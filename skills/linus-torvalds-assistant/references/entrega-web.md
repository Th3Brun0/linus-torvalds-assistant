# Modo de entrega de website

Objetivo: o site só sai daqui com **todas as áreas do placar em 9,0 ou mais**, medidas no navegador, ou com o motivo exato de cada uma que não passou e quem resolve. Aqui você corrige, diferente do modo revisão. As regras da seção 0 da skill continuam valendo (prova, sem citação inventada, ferramenta antes de opinião, regras do projeto acima de tudo).

Scripts em `scripts/` desta skill (caminho relativo a este arquivo: `../scripts/`). Régua em `placar-web.md`. Banca de front-end em `web-front.md`.

## 1. Preparar
1. Leia `CLAUDE.md` e a documentação de build/deploy do projeto. Descubra: como sobe local, onde ficam as fontes (nunca edite `*.min.*` nem HTML gerado), como se gera o build, como se publica.
2. `git status`. Se estiver na branch principal, crie `entrega/AAAA-MM-DD`. Nunca comite na principal nesta etapa.
3. Ferramentas (uma vez por máquina):
   - `playwright-core`: no projeto, ou `npm install --prefix ~/.cache/linus-entrega playwright-core@1.64.0`. Pouco espaço no `/home`? Instale em outra pasta e exporte `LINUS_ENTREGA_CACHE=<pasta>`.
   - Chrome/Chromium: o script acha o do Playwright, do sistema ou do Windows. Senão, `CHROME_PATH`.
   - Lighthouse vem pelo `npx` (12.8.2). Pouco espaço? `npm_config_cache=<pasta com espaço>`.
4. Suba o site local em segundo plano numa porta livre, com rate limit alto se o projeto tiver (a medição faz centenas de requisições). Anote o comando e derrube o servidor no fim.
5. Liste as páginas: o `sitemap.xml`, ou todas as rotas públicas do projeto. Passe com `--paginas` se o sitemap estiver incompleto.

## 2. Medir (sempre uma coisa por vez)
```
node <scripts>/medir.mjs --base http://localhost:<porta> --saida <saida> [--paginas /,/sobre/]
bash <scripts>/lighthouse.sh http://localhost:<porta> <saida>
```
- **Nunca rode Lighthouse em paralelo** com outro Lighthouse, build ou teste pesado: a CPU disputada derruba a nota de desempenho e o placar mente.
- Guarde `<saida>` fora das fontes (ex.: `.entrega-linus/`, no `.gitignore`).

## 3. Banca
1. **Capturas**: abra com Read pelo menos as fotos de 320, 390 e 1366 de cada página. Elemento cortado, sobreposto ou fora da tela vira desconto de responsividade, com a foto citada.
2. **Segurança do código**: aplique `seguranca-web.md` ao servidor, à configuração do proxy/CDN versionada e ao JS do front. Conte CRÍTICO, ALTO e MÉDIO, cada um com prova.
3. **SEO de conteúdo**: régua da banca em `placar-web.md`.
4. Grave `<saida>/banca.json` e rode `node <scripts>/placar.mjs <saida> --banca <saida>/banca.json`. Esse é o **placar inicial**: mostre-o ao usuário antes de corrigir.

## 4. Corrigir (até 3 rodadas)
Para cada área abaixo de 9,0:
1. Ache a causa no placar e no JSON do Lighthouse (`audits` com `score < 1` e seus `details`). Corrija na fonte, pela causa: dimensione a imagem, não esconda a imagem.
2. Lógica nova (script, servidor, regra de cabeçalho) leva teste. Mudança de markup/CSS é provada pela nova medição.
3. **Paralelo só na correção, nunca na medição**: correções de áreas que mexem em arquivos diferentes (ex.: cabeçalhos no servidor × alt e títulos no HTML × CSS de responsividade) podem ir para até 4 subagentes ao mesmo tempo, cada um com a lista de arquivos que pode tocar. Mesmo arquivo, mesmo agente. Tarefa simples vai para modelo mais rápido; segurança e lógica, para o mais capaz.
4. Rode o build do projeto, depois medir → lighthouse → placar de novo.

**Proibido maquiar a nota** (isso reprova a entrega mesmo com 10):
- esconder conteúdo do Lighthouse/robô (detecção de user-agent, `noindex`, tirar página do sitemap para fugir da medição);
- remover funcionalidade ou conteúdo para subir nota sem o OK do usuário (ex.: tirar a maquete 3D);
- desligar verificação, baixar o corte, mudar a régua ou o `banca.json` sem prova.

Se a correção exige decisão de produto (tirar um recurso, trocar texto de marketing, mudar layout aprovado), **pare e pergunte**.

Depois de 3 rodadas, o que não passou vira **bloqueio**, com o motivo e quem resolve (ex.: "HSTS: configurar no Cloudflare, responsável: infra"; "LCP 3,1 s: a maquete 3D pesa 4 MB, decisão do dono").

## 5. Fechar
1. Derrube o servidor local. Rode os testes do projeto.
2. Comite na branch de entrega, nas regras de commit do projeto.
3. Relatório ao usuário, curto:
```
# Entrega — <site>

| Área | Antes | Depois | |
|---|---|---|---|
| Desempenho | 7,2 | 9,4 | ok |
...

Mudanças: <lista curta, por área>
Bloqueios: <área, motivo, quem resolve>
Não medido: <GPU/celular reais, produção atrás do CDN, ...>
Branch: entrega/AAAA-MM-DD (<n> commits)

Posso publicar?
```
4. **Só publique com o OK do usuário**, pelo caminho de publicação do projeto. Depois de publicar, se possível, rode o `medir.mjs` contra a URL de produção: HSTS, scripts injetados pelo CDN e cache só aparecem lá.
