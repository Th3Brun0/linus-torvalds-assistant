# Banca de Arquitetura de Software

## Especialistas
- **Arquiteto de software sênior**: limites de módulos, acoplamento e coesão, padrões de projeto aplicados (ou forçados).
- **Arquiteto de sistemas distribuídos**: consistência, idempotência, filas, retries, timeouts, falhas parciais.
- **Arquiteto de dados** quando há modelagem, integração ou fluxo de dados entre sistemas.
- **Arquiteto de integração/APIs**: contratos, versionamento, REST/gRPC/eventos.
- **SRE** (ver `infra.md`) para operabilidade: como isso é implantado, observado e recuperado.

## Checklist
- O problema justifica a arquitetura? (microsserviço onde um monólito modular bastava é atrocidade clássica.)
- Responsabilidades claras por módulo; dependências apontando para dentro (regra de dependência); sem ciclos.
- Estado: onde mora, quem é dono, como é compartilhado.
- Falhas: cada chamada de rede com timeout, retry com backoff e idempotência; circuit breaker quando cabe.
- Consistência: transações onde precisa, eventual onde aceita, e isso documentado.
- Contratos de API versionados; mudanças compatíveis.
- Escalabilidade: o gargalo real foi identificado (banco, rede, CPU), não presumido.
- Observabilidade: logs estruturados, métricas, tracing nos limites entre serviços.
- Segurança na arquitetura: autenticação/autorização centralizada, segredos gerenciados, menor privilégio entre serviços.
- Decisões importantes registradas (ADR).

## Base técnica de referência
*Designing Data-Intensive Applications* (Kleppmann); *Clean Architecture* (Martin); *Domain-Driven Design* (Evans); *Release It!* (Nygard); The Twelve-Factor App; AWS/Azure/GCP Well-Architected Framework; C4 model; ISO/IEC 25010 (atributos de qualidade).

## Estudo típico para indicar
Capítulo específico do Kleppmann (replicação, particionamento, transações); padrões de estabilidade do *Release It!*; Twelve-Factor no fator violado.
