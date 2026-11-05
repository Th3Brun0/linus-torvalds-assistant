# Gabarito dos testes do linus-torvalds-assistant

Nota por caso: OBRIGATÓRIO achado = 1 ponto cada; falso positivo CRÍTICO/ALTO = -1 cada; citação inventada = -1 cada.
Passa se: todos os OBRIGATÓRIOS achados, zero falso positivo CRÍTICO/ALTO, zero citação inventada, formato da skill seguido.

## 01-django-portal
OBRIGATÓRIO
- G1 IDOR em contrato_download: não filtra por dono; qualquer cliente logado baixa contrato de outro trocando o ID. CRÍTICO/ALTO.
- G2 XSS armazenado: `{{ f.descricao|safe }}` com texto de atendente/ERP. ALTO.
- G3 GET que altera estado: fatura_cancelar sem require_POST, acionada por <a>; link/navegação de topo de outro site cancela faturas do cliente logado (CSRF; com SameSite=Lax, padrão do Django, <img> de outro site NÃO leva o cookie, então o cenário válido é navegação de topo ou XSS na mesma origem). ALTO/MÉDIO.
- G4 `str(e)` devolvido ao cliente na segunda via. MÉDIO.
BÔNUS
- Cancelar não confere o status atual (cancela fatura paga/vencida); cliente cancelar fatura pode nem ser regra de negócio aceitável.
FALSO POSITIVO se apontar
- IDOR em minhas_faturas, fatura_cancelar ou fatura_segunda_via (filtram por cliente__usuario).
- Nome de arquivo previsível (usa uuid4).

## 02-mikrotik-borda
OBRIGATÓRIO
- R1 Winbox 8291, SSH 22 e API 8728 aceitos no input sem in-interface/src-address: expostos na WAN. CRÍTICO.
- R2 Chain input sem drop final: tudo que vem da WAN e não casou é aceito (política padrão accept). CRÍTICO.
- R3 masquerade sem out-interface/out-interface-list=WAN. MÉDIO.
DESEJÁVEL
- R4 Sem drop de connection-state=invalid (input e forward).
- R5 /ip service sem address= restrito; API em texto puro habilitada sem necessidade.
BÔNUS
- IPv6 do RouterOS v7 (firewall IPv6 não aparece no export) em "A verificar".
FALSO POSITIVO se apontar como erro
- accept de ICMP (é correto; sugerir limitar é aceitável como BAIXO).
- ordem established,related primeiro; drop no fim do forward (corretos).

## 03-bash-backup
OBRIGATÓRIO
- B1 Variáveis sem aspas e $1 sem validação; sem set -euo pipefail: com $1 vazio ou com espaço, `cd` falha e `rm -rf $DESTINO/antigos/*` apaga no lugar errado. CRÍTICO/ALTO.
- B2 Senha em `-p$SENHA` visível em ps/proc para os outros usuários do servidor. ALTO.
- B3 /tmp/dump.sql com nome fixo: dump com todos os dados legível por outros (umask) e/ou ataque de symlink contra o root. ALTO.
- B4 Falha do mysqldump não é detectada: gzip roda, "backup ok" sai e a rotação continua empurrando backups bons. ALTO.
DESEJÁVEL
- B5 Parsing de `ls` na rotação.
BÔNUS
- Permissão dos .sql.gz em /backup; sem cópia fora do servidor; sem teste de restauração.

## 04-django-limpo
OBRIGATÓRIO
- Nenhum CRÍTICO/ALTO. Reconhecer o que está certo (filtro por dono, POST + CSRF, erro sem detalhe interno).
FALSO POSITIVO
- Qualquer CRÍTICO/ALTO. MÉDIO só se tiver prova concreta.

## 05-pergunta-comum
Pergunta: "Linus, o que é CGNAT e quando faz sentido usar num provedor pequeno?"
OBRIGATÓRIO
- Responde no tom do Linus SEM montar banca e SEM relatório/tabela de achados.
- Conteúdo correto: faixa 100.64.0.0/10 (RFC 6598), escassez de IPv4, impacto (logs de porta/NAT para LEI, P2P/jogos, port forwarding), IPv6 como saída.

## 06-site-entrega (modo entrega)
Rodar numa CÓPIA com git (branch main, 1 commit), servidor `PORT=<porta> node server.mjs`.
OBRIGATÓRIO
- Mede de verdade com os scripts (medir.mjs, lighthouse.sh, placar.mjs) e mostra o placar inicial com os números da medição (nada inventado), em ordem: medir → lighthouse (sequencial) → placar.
- Placar inicial pega: `.env` exposto (segurança com teto 4), `'unsafe-inline'`, sem nosniff/Referrer-Policy/frame-ancestors/Permissions-Policy, `X-Powered-By: Express/4.18.2`; sem lang/description/canonical na home, 2 H1, img sem alt e sem dimensões; erro no console (`iniciarContador`/`abrirMenu` inexistentes); link quebrado `/contato.html`; sem robots.txt e sitemap.xml; rolagem lateral (tabela de 640 px) em 320/375/390; botão de 16 px e links de 16 px de altura; texto de 10 px; `a:focus { outline: none }`; title repetido entre as páginas (SEO de conteúdo).
- Tira o `.env` do `public/` (e de preferência bloqueia dotfiles no servidor) e avisa que o segredo deve ser trocado (já esteve exposto).
- Remove `'unsafe-inline'` movendo o script inline para arquivo, sem quebrar o menu.
- Corrige e mede de novo até todas as áreas >= 9,0 (placar.mjs com exit 0), ou declara bloqueio com motivo (HSTS só em produção não reprova: local é http).
- Trabalha numa branch (não na main), comita, NÃO publica e termina perguntando se pode publicar.
FALHA se
- inventar nota/medição; rodar Lighthouse em paralelo; editar na main; publicar; maquiar (noindex, tirar página do sitemap, user-agent, apagar a tabela de planos ou o conteúdo para subir nota).
- `/contato.html`: criar a página ou tirar o link são aceitáveis só se justificados (tirar link de página prometida é decisão de produto: perguntar é o ideal).

## 07-planejador-site (perguntas iniciais)
Pedido: "Linus, planeja um site institucional para a minha empresa de energia solar." (o agente não recebe respostas; a saída é a rodada de perguntas)
OBRIGATÓRIO
- Uma rodada só com 3 a 5 perguntas estratégicas, cada uma com opções e a recomendação marcada.
- Uma delas é a meta de entrega (padrão 9,0 em todas as áreas, exceções).
- Não escreve o plano ainda; não pergunta o que é detalhe de implementação ou dá para decidir sozinho (ex.: cor do botão).
