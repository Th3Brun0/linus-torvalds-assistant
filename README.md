# Linus Torvalds Assistant

Plugin para o [Claude Code](https://claude.com/claude-code) que coloca um "Linus Torvalds" no seu fluxo de trabalho. Ele faz três coisas:

- **Revisão:** uma banca de especialistas seniores (rede, código, arquitetura, SRE, segurança, banco e front-end) revisa código, scripts, firewall, servidores ou arquitetura. É franca, mas cada achado traz a prova.
- **Entrega de website:** mede o site no navegador, dá nota de 0 a 10 em 7 áreas e corrige até **todas passarem de 9,0**. Só publica com o seu OK.
- **Planejamento:** faz as perguntas certas, corta exageros e escreve um plano em tarefas com TDD, executável por vários agentes em paralelo.

Tudo em português do Brasil.

---

## Por que "Linus Torvalds"?

Linus Torvalds, criador do Linux e do Git, ficou conhecido pelas revisões de código diretas, sem rodeio e muito técnicas nas listas do kernel. Ele não aceita gambiarra nem configuração feita sem entender como a ferramenta funciona por dentro, e cobra prova em vez de opinião ("Talk is cheap. Show me the code.").

Este plugin usa esse **estilo** como método de ensino:

- **Franqueza:** se a abordagem está errada, ele diz logo no veredito, sem eufemismo corporativo. Quando o erro é grosseiro, solta um palavrão ("Que porcaria é essa?"). O alvo é sempre o trabalho, nunca a pessoa.
- **O porquê antes da correção:** cada crítica explica o **mecanismo** (o código de saída que o shell descarta, o escape automático do template, a diferença entre autenticar e autorizar) para você chegar sozinho à resposta da próxima vez.
- **Vai estudar:** todo erro de conceito termina na seção **Estudo obrigatório**, com o tema exato e uma fonte real (RFC, documentação oficial, OWASP, CIS), no máximo 4 itens.
- **Também elogia:** o que está bem feito aparece em "O que está certo". Revisão que só acha defeito é tão desonesta quanto elogio vazio.

Exemplos reais dos testes:

**Linux:** script de backup do MySQL rodando pelo cron como root, sem checar erro nenhum.

> **Veredito:** Isto não é um script de backup, é um gerador de arquivos `.gz` que imprime "backup ok". Ele não confere erro nenhum, então pode passar uma semana gravando lixo enquanto a própria rotação apaga os backups bons. [...] E ainda grava o banco inteiro em texto puro, legível por todos, num nome fixo dentro do `/tmp`. Que porcaria.
>
> **Estudo obrigatório:** BashFAQ/105 no wiki do Greg Wooledge, "Why doesn't set -e do what I expected?": onde o `set -e` não te salva (condicionais, substituição de comando, pipe sem `pipefail`).

**Código:** portal do cliente em Django com `@login_required` em todas as views.

> **Veredito:** Isso não sobe. Vocês puseram `@login_required` em tudo e acharam que estava resolvido, mas login só diz **quem** a pessoa é, não **o que** ela pode tocar. Qualquer empresa cliente baixa o contrato de todas as outras trocando um número na URL. Você acertou o padrão três vezes e esqueceu na view mais sensível.
>
> **Estudo obrigatório:** OWASP *Insecure Direct Object Reference Prevention Cheat Sheet* e *Authorization Cheat Sheet*: autorização por objeto, não por login.

Se o relatório vai para outra pessoa (cliente, diretoria), avise: ele mantém o rigor e tira os palavrões.

> Projeto independente, inspirado no estilo público de revisão de Linus Torvalds. Não tem relação com Linus Torvalds nem com a Linux Foundation, e não foi endossado por eles. As respostas são do Claude no papel de revisor, não citações dele.

---

## Instalação

No prompt do Claude Code:

```
/plugin install linus-torvalds-assistant --marketplace Th3Brun0/linus-torvalds-assistant
```

Responda `y` para adicionar o marketplace e escolha o escopo: só você, este projeto ou todos os projetos.

Ou pelo terminal:

```
claude plugin install linus-torvalds-assistant --marketplace Th3Brun0/linus-torvalds-assistant
```

Para testar sem instalar, a partir de um clone:

```
git clone https://github.com/Th3Brun0/linus-torvalds-assistant.git
claude --plugin-dir ./linus-torvalds-assistant
```

> Se você usava a skill antiga `linus-torvalds-reviewer`, apague-a. As duas disputariam o mesmo pedido.

### Requisitos do modo entrega (só para websites)

| O quê | Para quê | Como |
|---|---|---|
| Node.js 18+ | rodar os scripts | `node --version` |
| `playwright-core` 1.64 | abrir o site no navegador | `npm install --prefix ~/.cache/linus-entrega playwright-core@1.64.0` |
| Chrome ou Chromium | navegador | usa o do Playwright, do sistema ou do Windows; senão `CHROME_PATH=<caminho>` |
| Acesso ao npm | Lighthouse 12.8.2 via `npx` | baixa sozinho na primeira vez (~360 MB de cache) |

Se o disco do `/home` tiver pouco espaço, ponha o `playwright-core` em outra pasta e exporte `LINUS_ENTREGA_CACHE=<pasta>`, e o cache do npm com `npm_config_cache=<pasta>`.

Revisão e planejamento não precisam de nada disso.

---

## Uso

### O menu
Com o plugin instalado, aparece uma faixa acima do prompt:

```
Do plugin linus-torvalds-assistant
[○ off]  último 1m 12s  [Arquitetura] [Código] [Rede] [Infra] [Segurança] [Entrega] [Planejar] [Detalhes]
```

| Botão | Tecla | O que faz |
|---|---|---|
| on/off | `o` | Liga o "modo Linus": todo prompt passa pela skill. Pergunta comum recebe resposta curta no tom do Linus; a banca só aparece quando há material para revisar. A escolha fica salva entre sessões. |
| Arquitetura, Código, Rede, Infra, Segurança | `q` `w` `e` `r` `t` | Revisão daquela área. Escopo padrão: o que mudou na branch. |
| Entrega | `y` | Modo de entrega do website do projeto atual. |
| Planejar | `p` | Digite no prompt o que quer fazer e aperte: vira um plano. |
| Detalhes | `d` | Tempo e número de ferramentas do último turno. |

Sem o menu (por exemplo, se a sua interface não mostra a faixa), funciona pedindo em texto:

### Revisão
```
Linus, revisa esse script de deploy antes de eu colocar no cron.
Linus, revisa a segurança do que mudou nessa branch.
Linus, auditoria completa do projeto.
```
O que esperar:
- **Só leitura:** ele nunca altera código, configuração ou equipamento durante a revisão.
- **Todo achado tem onde e prova** (arquivo:linha, regra, saída de comando ou cenário "usuário X faz Y e consegue Z"). Sem prova, vai para "A verificar".
- **Citações reais:** RFC, CWE, CIS e documentação oficial só quando ele tem certeza. Na dúvida, escreve "base a verificar".
- **Contraprova:** todo CRÍTICO ou ALTO é contestado por outro especialista antes de entrar no relatório.
- **Ferramenta antes de opinião:** roda `shellcheck`, `ruff`, `bandit`, `semgrep`, `pip-audit` e `npm audit` se estiverem instalados, e diz quais não estão.
- **Relatório enxuto:** veredito, tabela de achados, detalhe só de CRÍTICO e ALTO, o que está certo, o que verificar, o que corrigir primeiro e o que estudar.
- As regras do seu projeto (`CLAUDE.md`, `docs/SECURITY.md`) valem mais que o checklist genérico.
- Se o relatório vai para outra pessoa (cliente, diretoria), diga. Ele mantém o rigor e tira os palavrões.

### Entrega de website
```
Linus, modo de entrega: terminei o site, verifica tudo e deixa pronto pra publicar.
```
1. Lê o `CLAUDE.md`, cria a branch `entrega/AAAA-MM-DD` e sobe o site local.
2. **Mede:** Playwright em 7 larguras (320 a 1920 px) para console, rolagem lateral, alvos de toque, texto pequeno, foco, SEO, cabeçalhos, links e arquivos expostos, mais Lighthouse no celular e no desktop, **uma página por vez**.
3. **Placar inicial** com nota em 7 áreas: desempenho, acessibilidade, boas práticas, SEO técnico, SEO de conteúdo, responsividade e segurança.
4. **Corrige** o que está abaixo de 9,0, com teste, em até 3 rodadas, medindo de novo a cada uma.
5. **Fecha** com o placar antes e depois, as mudanças, os bloqueios (o que depende de você, como texto, credenciais ou CDN) e a pergunta **"Posso publicar?"**.

Regras que ele não quebra:
- Cada área precisa de **9,0 ou mais**; a média não salva área ruim. Área que não pôde ser medida reprova.
- Não maquia a nota: nada de esconder conteúdo do robô, `noindex` ou remover recurso sem perguntar.
- Não publica sem o seu OK. Decisões de produto, como tirar uma maquete 3D pesada, ele pergunta.

A régua completa está em [`placar-web.md`](skills/linus-torvalds-assistant/references/placar-web.md). Os scripts podem ser usados sozinhos:

```
S=skills/linus-torvalds-assistant/scripts
node $S/medir.mjs --base http://localhost:8090 --saida .entrega-linus
bash $S/lighthouse.sh http://localhost:8090 .entrega-linus
node $S/placar.mjs .entrega-linus --banca .entrega-linus/banca.json   # sai 0 só se tudo >= 9,0
```

### Planejamento
```
Linus, planeja um site institucional para a minha empresa.
```
1. Faz **de 3 a 5 perguntas estratégicas numa rodada só**, com opções e a recomendação dele. Em website, uma delas é a meta de entrega (padrão 9,0 em tudo).
2. Desenha com a banca, propõe 2 ou 3 abordagens e corta o que não é necessário agora.
3. Escreve o plano em `docs/plans/`, com tarefas pequenas, TDD, arquivos exatos, dependências e **ondas**.
4. Execução **em ondas de até 4 agentes em paralelo**, nunca dois no mesmo arquivo, com o modelo escolhido pela dificuldade da tarefa, ou **direto** na sessão.
5. Website nasce no padrão 9,0, e a última tarefa é sempre o modo entrega.

---

## O que tem dentro

```
skills/
  linus-torvalds-assistant/     revisão + entrega
    SKILL.md
    references/                 bancas e checklists: redes, código, arquitetura, infra,
                                segurança, segurança web, banco, front-end, entrega, placar
    scripts/                    medir.mjs, lighthouse.sh, placar.mjs (+ placar.test.mjs)
  linus-planejador/SKILL.md     planejamento
hooks/register.tsx              o menu acima do prompt
evals/                          casos de teste com erros plantados e gabarito
```

## Testes

`evals/` tem 7 casos com erros plantados e um gabarito: Django com IDOR, firewall MikroTik, script de backup, código correto (para pegar falso positivo), pergunta comum, site para o modo entrega e as perguntas do planejador. Como rodar está em [`evals/README.md`](evals/README.md). Rode depois de qualquer mudança nas skills.

A régua do placar tem testes próprios:
```
node --test skills/linus-torvalds-assistant/scripts/placar.test.mjs
```

Os arquivos `.env` e as senhas dentro de `evals/casos/` são **fictícios** e estão ali de propósito: o teste é ver se o Linus os acha.

## Licença

MIT
