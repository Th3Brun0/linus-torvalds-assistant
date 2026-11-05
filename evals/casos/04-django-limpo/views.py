import logging

from django.contrib.auth.decorators import login_required
from django.http import FileResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.views.decorators.http import require_POST

from .models import Chamado, Anexo

logger = logging.getLogger(__name__)


def _chamados_do_usuario(user):
    return Chamado.objects.filter(cliente__usuario=user)


@login_required
def anexo_download(request, anexo_id):
    anexo = get_object_or_404(Anexo, pk=anexo_id, chamado__in=_chamados_do_usuario(request.user))
    return FileResponse(anexo.arquivo.open('rb'), as_attachment=True, filename=anexo.nome_original)


@login_required
@require_POST
def chamado_fechar(request, chamado_id):
    chamado = get_object_or_404(_chamados_do_usuario(request.user), pk=chamado_id, status='aberto')
    chamado.status = 'fechado'
    chamado.save(update_fields=['status'])
    return redirect('portal:chamados')


@login_required
def chamado_resumo(request, chamado_id):
    chamado = get_object_or_404(_chamados_do_usuario(request.user), pk=chamado_id)
    try:
        sla = chamado.calcular_sla()
    except ValueError:
        logger.exception('SLA do chamado %s', chamado.pk)
        return JsonResponse({'erro': 'Não foi possível calcular o SLA.'}, status=500)
    return JsonResponse({'titulo': chamado.titulo, 'status': chamado.status, 'sla_horas': sla})
