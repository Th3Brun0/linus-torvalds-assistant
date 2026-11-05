# Testes do linus-torvalds-assistant

Casos com erros plantados e um gabarito. Rode depois de qualquer mudança na skill.

| Caso | Testa |
|---|---|
| 01-django-portal | IDOR, XSS por `|safe`, GET que altera, `str(e)`; sem falso positivo nas views certas |
| 02-mikrotik-borda | input sem drop, gerência na WAN, masquerade sem interface, invalid |
| 03-bash-backup | falha silenciosa, senha no `ps`, `/tmp` fixo, variáveis sem aspas |
| 04-django-limpo | código correto: não pode inventar CRÍTICO/ALTO |
| 05-pergunta-comum | só no gabarito: pergunta sem material não monta banca |
| 06-site-entrega | modo entrega: mede, corrige até 9,0 em todas as áreas, branch, não publica |
| 07-planejador-site | só no gabarito: planejador faz 3 a 5 perguntas estratégicas, uma delas a meta 9,0 |

## Como rodar
Um agente novo por caso, sem ver o gabarito:

> Aja como se a skill `skills/linus-torvalds-assistant/SKILL.md` tivesse sido acionada. Pedido: "Linus, revisa isso". Material: `evals/casos/<caso>/`. Leia só a skill e a pasta do caso. Não altere arquivos. A mensagem final é o relatório.

Caso 06: copie a pasta para fora, `git init -b main` e um commit inicial, e peça "Linus, modo de entrega". O servidor sobe com `PORT=<porta> node server.mjs`.

Depois compare cada relatório com `gabarito.md`. Passa se achou todos os OBRIGATÓRIOS, sem falso positivo CRÍTICO/ALTO e sem citação inventada.

## Histórico
- 2026-11-05, v0.5: 5/5. Ajustes depois do teste: limite de tamanho, calibração de severidade, ferramenta antes de opinião. Reteste do caso 01: 4/4 obrigatórios, relatório ~metade do tamanho, rodou bandit sozinho.
- 2026-11-05, v0.6: 7/7. Retestes 01–05 passaram com relatórios mais curtos e severidade calibrada (cancelamento ALTO, `rm -rf` sem aspas ALTO). 06 (entrega): placar 10/5,9/7,6/4,9/7,0/5,5/4,0 → 10/10/10/10/10/8,0/7,0, com 2 bloqueios corretos (segredo no histórico do git e texto curto, que o dono precisa resolver), branch, 9 testes, sem publicar; achou sozinho DoS por `decodeURIComponent` e leitura de pasta vizinha por `startsWith`. 07 (planejador): 5 perguntas numa rodada com a meta 9,0.
