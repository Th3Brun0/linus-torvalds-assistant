# Auditoria de segurança de aplicação web

Checklist da casa para auditar aplicações web (foco em Django/Python e front-end em JS, mas vale para qualquer stack). Itens com ⚠️ são os que mais aparecem na prática: confira todos, sempre.

## Banca desta auditoria
- **AppSec sênior Django/Python** (e da stack do front, se houver: React, Vue, JS puro).
- **Pentester sênior web** (OSWE): monta o cenário "usuário X faz Y e consegue Z".
- **Especialista em IAM/controle de acesso**: IDOR, escalada, perfis.
- **SRE/infra** para a seção 7 (cabeçalhos, Nginx, firewall, backup).

## Como a banca trabalha nesta auditoria
Valem as regras da seção 0 da skill (só leitura, prova em todo achado, sem citação inventada, regras do projeto acima deste checklist). Aqui elas ficam mais duras:
1. **A prova de todo achado é um cenário de exploração** no formato "usuário X (com tal perfil) faz Y e consegue Z". Sem cenário, não entra no relatório.
2. **Começar pelo grep e confirmar lendo o código.** O grep acha candidatos, não achados:
   `innerHTML|outerHTML|insertAdjacentHTML|\|safe|mark_safe|autoescape off|csrf_exempt|shell=True|os\.system|\.url }}|eval\(|exec\(|pickle\.loads|yaml\.load|fields = .__all__.|str\(e\)|\.raw\(|\.extra\(|verify=False|DEBUG *= *True`
3. **Seguir o dado da entrada até a saída**: de `request.GET/POST`, URL, upload ou API externa até o template, o SQL, o shell, o arquivo ou a resposta JSON. A checagem de permissão tem de estar no caminho, não só no menu.

Na tabela de achados, a coluna "Base técnica" traz a CWE/OWASP, e a **Prova** de cada achado é o cenário.

## 1. Injeção e XSS
- ⚠️ `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` ou template string montando HTML com dado do servidor. O certo é `textContent` ou criar o elemento com `createElement`.
- `|safe`, `mark_safe`, `autoescape off`, `dangerouslySetInnerHTML`, `v-html`.
- ⚠️ HTML montado à mão na view (respostas de fallback, `HttpResponse(f"...")`).
- ⚠️ Motores sem escape automático: ReportLab, WeasyPrint, wkhtmltopdf, XML, e-mail em HTML. No ReportLab, um `<img src>` sem escape também permite ler arquivo local e fazer SSRF.
- SQL cru: `raw()`, `extra()`, `cursor.execute` com f-string ou `%`.
- Comandos de shell: `subprocess` com `shell=True`, `os.system`, ou parâmetro do usuário virando argumento de comando.
- ⚠️ Fórmula em planilha (CSV/XLSX): célula que começa com `= + - @` precisa ser neutralizada.
- Texto vindo de API externa (CRM, BrasilAPI, ERP) tratado como não confiável.
- `eval`, `exec`, `pickle.loads`, `yaml.load` sem `SafeLoader`.

## 2. Controle de acesso (a área mais importante)
- ⚠️ IDOR: toda view que recebe `<id>` precisa conferir se o objeto pertence a quem está pedindo, não só se a pessoa está logada.
- ⚠️ Endpoint novo sem checagem de permissão dentro da própria view, contando só com middleware por prefixo de URL.
- ⚠️ Escalada de privilégio: formulário que grava `role`, `is_staff`, `is_superuser` ou grupo sem conferir se quem envia pode conceder aquele valor. Inclui alguém editar o próprio perfil.
- ⚠️ `ModelForm` com `fields = '__all__'` ou com campo sensível que só foi tirado do template. O POST continua aceitando o campo.
- Menu e tela usando regras diferentes: o item fica escondido, mas a URL abre.
- Acesso negado por padrão: usuário sem perfil não vê nada.
- 404 antes de 403, para não revelar que o recurso de outra pessoa existe.
- ⚠️ GET que altera dados (apagar, atribuir, reabrir) precisa passar a ser POST.
- Personificação ou "logar como" sempre limitada, auditada e só de leitura.

## 3. Autenticação, sessão e força bruta
- ⚠️ Rate limit no login, MFA/OTP, recuperação de senha, busca, autocomplete e qualquer endpoint que revele dado sensível. Ao bloquear, devolver 429 com `Retry-After`.
- ⚠️ Rate limit atrás de proxy contando o IP do Nginx em vez do IP real do cliente (conferir `X-Forwarded-For` e o proxy confiável).
- Comparar token, OTP ou hash com `secrets.compare_digest`, nunca com `==`.
- TOTP que não aceita o mesmo código duas vezes.
- Open redirect no parâmetro `next` ou `redirect`.
- Mensagem de erro que revela se o usuário existe.
- Cookies com `HttpOnly`, `Secure` e `SameSite`. CSRF ativo em tudo que altera estado e nenhum `csrf_exempt` sem justificativa.

## 4. Dados sensíveis e segredos
- ⚠️ Senha ou credencial no HTML, em resposta GET, em JSON de contexto ou em log. Revelar só por POST, com auditoria e `Cache-Control: no-store`.
- ⚠️ Objeto inteiro do model passado ao template ou serializer. O certo é montar um dicionário só com os campos permitidos.
- ⚠️ Texto interno de exceção mostrado ao usuário (`str(e)`, stack trace, `DEBUG=True`).
- Segredo no código, em teste, em `.env.example` ou no **histórico** do git (apagar no último commit não tira do histórico): `gitleaks detect` se existir, senão `git log -p --all | grep -inE 'password|secret|token|api[_-]?key|BEGIN .*PRIVATE'`.
- Log com senha, token, `Authorization` ou cookie de sessão.
- Campos sensíveis cifrados, e rotação de chave que não perde o que já está cifrado.
- Valores financeiros e custos aparecendo para perfis que não deveriam ver.

## 5. Arquivos e uploads
- ⚠️ `{{ arquivo.url }}` apontando para `/media/` público. Tudo deve sair por uma view protegida com `FileResponse`.
- ⚠️ Nome de arquivo previsível (ID sequencial, nome do cliente, data). Usar `uuid4`.
- Validar tamanho, extensão e assinatura real do arquivo (magic bytes).
- Path traversal: `../` no nome ou caminho montado com dado do usuário, inclusive **codificado** (`%2e%2e/`, `..%2f`, `%252e`): o filtro precisa olhar o caminho já decodificado e normalizado.
- ⚠️ Dotfiles e fontes servidos pelo servidor estático: `/.env`, `/.git/`, `/package.json`, mapas de código (`*.map`), pasta de fontes não minificadas. Teste com `curl -I` em cada um.
- Arquivo SVG ou HTML enviado e servido inline.

## 6. Integrações externas
- `timeout` em toda chamada HTTP.
- SSRF: URL informada pelo usuário sendo buscada pelo servidor.
- Token só no `.env` e nunca em exceção ou log.
- Integração que escreve fora só pode alterar o mínimo combinado.
- Webhook sem conferência de assinatura.

## 7. Cabeçalhos e infraestrutura
- CSP sem `unsafe-inline` e sem `unsafe-eval`, com `frame-ancestors` restrito.
- ⚠️ CSP e cabeçalhos definidos em **mais de um lugar** (Nginx/proxy, app, `<meta>`, CDN, fallback de erro): todos idênticos. Página de erro e arquivo estático costumam sair sem cabeçalho nenhum. `frame-ancestors` no `<meta>` é ignorado pelo navegador.
- `<iframe sandbox>` com `allow-scripts` **e** `allow-same-origin` servindo conteúdo da mesma origem: o iframe remove o próprio sandbox. Demo ou conteúdo de terceiro vai em outra origem (subdomínio).
- HSTS, `X-Content-Type-Options`, `Referrer-Policy` e `X-Frame-Options`.
- CORS aberto (`*` junto com credenciais).
- Firewall ativo e serviços expostos em `0.0.0.0` sem necessidade.
- Backup com cópia fora do servidor e restauração testada.
- Dependências com vulnerabilidade conhecida (`pip-audit`, `npm audit`).

## 8. Higiene do código
- ⚠️ Debug ou telemetria "temporária" deixada no commit (`fetch` ou `requests` para fora, `exec`, `eval`, leitura de config externa).
- `print` ou `console.log` mostrando dados.
- Teste novo cobrindo a regra de acesso: usuário sem permissão recebe 403 e o dado não muda.
- Migração ou deploy que roda código novo antes do `migrate`, como cron e workers.
- Permissão de arquivo após edição: arquivo do serviço legível pelo usuário do processo.

## 9. Lógica de negócio e concorrência
- ⚠️ Duplo envio: dois cliques ou duas abas gerando dois títulos, duas remessas, dois pagamentos. Procure trava (`select_for_update`, `unique` no banco, chave de idempotência) e não só botão desabilitado no JS.
- Valor que o servidor não confere: negativo, zero, maior que o saldo, desconto acima do permitido, data fora do período.
- Status pulando etapa por POST forjado (aprovar o que não passou pela conferência, reabrir o que está fechado).
- Leitura e gravação separadas sem transação (TOCTOU): confere o saldo e depois grava, com outra requisição no meio.
- Exportação, relatório ou API de listagem que ignora o filtro de permissão que a tela aplica.

## 10. APIs e dados pessoais
- Serializer (DRF) ou API com `fields = '__all__'` ou que aceita campos de permissão e de dono na escrita (atribuição em massa).
- Paginação sem limite máximo (`?page_size=1000000`).
- SSTI: template montado a partir de texto do usuário (`Template(texto).render`).
- LGPD: CPF, telefone e endereço em log; cópia de banco para teste sem anonimizar; dado pessoal sem prazo de retenção.

## Base técnica de referência
OWASP Top 10 e ASVS (V4 controle de acesso, V5 validação, V8 dados, V12 arquivos, V14 configuração); OWASP Cheat Sheets (XSS Prevention, CSRF, IDOR/Authorization, File Upload, SSRF, CSV Injection); documentação de segurança do Django (`docs.djangoproject.com/en/stable/topics/security/`) e `manage.py check --deploy`; CWE-79, 89, 78, 639, 352, 601, 918, 22, 1236, 362 (race condition), 840 (lógica de negócio), 915 (atribuição em massa), 1336 (SSTI).
