from django.urls import path

from . import views

app_name = 'portal'
urlpatterns = [
    path('faturas/', views.minhas_faturas, name='faturas'),
    path('contratos/<int:contrato_id>/download/', views.contrato_download, name='contrato_download'),
    path('faturas/<int:fatura_id>/cancelar/', views.fatura_cancelar, name='fatura_cancelar'),
    path('faturas/<int:fatura_id>/segunda-via/', views.fatura_segunda_via, name='fatura_segunda_via'),
]
