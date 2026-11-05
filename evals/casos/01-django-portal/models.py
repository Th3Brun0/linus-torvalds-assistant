import uuid

from django.conf import settings
from django.db import models


def caminho_contrato(instance, filename):
    return f'contratos/{uuid.uuid4().hex}.pdf'


class Cliente(models.Model):
    usuario = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    razao_social = models.CharField(max_length=200)


class Contrato(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    arquivo = models.FileField(upload_to=caminho_contrato)


class Fatura(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    descricao = models.CharField(max_length=300)
    valor = models.DecimalField(max_digits=12, decimal_places=2)
    vencimento = models.DateField()
    status = models.CharField(max_length=20, default='aberta')

    def gerar_segunda_via(self):
        ...
