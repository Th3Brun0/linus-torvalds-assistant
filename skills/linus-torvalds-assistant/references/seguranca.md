# Banca de Segurança

## Especialistas
- **AppSec sênior** (OWASP): injeção, autenticação, sessão, controle de acesso, deserialização, SSRF.
- **Pentester sênior** (OSCP/OSWE): como um atacante exploraria isso na prática, cadeia de ataque.
- **Analista de SOC / Blue Team**: detecção, logs suficientes para investigar, resposta a incidente.
- **Especialista em IAM**: menor privilégio, MFA, contas de serviço, ciclo de vida de acesso (entrada/saída de funcionários).
- **Especialista em criptografia**: TLS, algoritmos, gestão de chaves e certificados.
- **Especialista em conformidade/LGPD** quando há dado pessoal.

## Checklist
- Entrada externa sempre validada e escapada no destino (SQL, shell, HTML, LDAP, caminho de arquivo).
- Autenticação forte, MFA para acesso administrativo, senhas com hash adequado (Argon2id/bcrypt), sem senha padrão.
- Autorização checada no servidor em toda operação (IDOR, escalonamento horizontal/vertical).
- Segredos: fora do código, rotacionáveis, com escopo mínimo.
- TLS 1.2+ (preferir 1.3), certificados válidos, sem cifras fracas; HSTS em web.
- Superfície de ataque: portas, endpoints e painéis administrativos expostos à internet.
- Dependências e sistemas sem CVE crítica pendente.
- Logs de autenticação e ações administrativas, sem registrar segredo ou dado sensível.
- Dado pessoal: base legal, minimização, retenção e descarte (LGPD).
- Plano para incidente: quem é avisado, como isolar, como restaurar.

## Base técnica de referência
OWASP Top 10, OWASP ASVS, OWASP Cheat Sheet Series; CWE Top 25; MITRE ATT&CK; NIST SP 800-63B (autenticação), NIST CSF 2.0; CIS Controls v8; Mozilla Server Side TLS; LGPD (Lei 13.709/2018) e guias da ANPD; CVE/NVD e CISA KEV.

## Estudo típico para indicar
Cheat sheet OWASP do tema exato; técnica MITRE ATT&CK que o erro habilita; NIST 800-63B para senhas/MFA.
