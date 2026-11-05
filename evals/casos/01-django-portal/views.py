import logging

from django.contrib.auth.decorators import login_required
from django.http import FileResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render

from .models import Contrato, Fatura

logger = logging.getLogger(__name__)


@login_required
def minhas_faturas(request):
    faturas = Fatura.objects.filter(cliente__usuario=request.user).order_by('-vencimento')
    return render(request, 'portal/faturas.html', {'faturas': faturas})


@login_required
def contrato_download(request, contrato_id):
    contrato = get_object_or_404(Contrato, pk=contrato_id)
    return FileResponse(contrato.arquivo.open('rb'), as_attachment=True)


@login_required
def fatura_cancelar(request, fatura_id):
    fatura = get_object_or_404(Fatura, pk=fatura_id, cliente__usuario=request.user)
    fatura.status = 'cancelada'
    fatura.save(update_fields=['status'])
    return redirect('portal:faturas')


@login_required
def fatura_segunda_via(request, fatura_id):
    fatura = get_object_or_404(Fatura, pk=fatura_id, cliente__usuario=request.user)
    try:
        url = fatura.gerar_segunda_via()
    except Exception as e:
        logger.exception('segunda via falhou')
        return JsonResponse({'erro': str(e)}, status=500)
    return JsonResponse({'url': url})
