# Placar de entrega de website (0 a 10 por área, corte 9,0)

A régua abaixo é a mesma que `scripts/placar.mjs` calcula. Se mudar uma, mude a outra e rode `node --test scripts/placar.test.mjs`.

**Regras gerais**
- Cada área precisa de **9,0 ou mais**. A média não salva área ruim.
- A nota da área é a da **pior página** (o Lighthouse conta pela versão celular; a desktop é informativa).
- Área sem medição é **NÃO MEDIDA** e reprova. Nunca dê nota de cabeça para área medível.
- O mesmo elemento em várias larguras conta uma vez.
- "Teto" limita a nota depois dos descontos (ex.: `.env` exposto deixa a segurança em no máximo 4).

| Área | Base | Descontos e tetos |
|---|---|---|
| **Desempenho** | Lighthouse performance (celular) ÷ 10 | Teto 8,9 se LCP > 2.500 ms, CLS > 0,1 ou TBT > 200 ms em qualquer página |
| **Acessibilidade** | Lighthouse accessibility (celular) ÷ 10 | −0,25 por alvo de toque < 24 px (máx. −2); −0,25 por texto < 12 px (máx. −2); −0,5 por elemento com foco invisível (máx. −2) |
| **Boas práticas** | Lighthouse best-practices (celular) ÷ 10 | −1 por erro distinto no console (máx. −4); −0,5 por requisição do próprio site com erro (máx. −2) |
| **SEO técnico** | Lighthouse SEO (celular) ÷ 10 | −0,25 por title/description/canonical/lang/viewport faltando por página (máx. −3); −0,25 por página sem exatamente um H1 (máx. −2); −0,1 por tag Open Graph faltando (máx. −1); −0,5 por JSON-LD inválido (máx. −2); −1 por página publicada com noindex (máx. −3); −0,5 sem robots.txt; −0,5 sem sitemap.xml; −0,5 por link interno quebrado (máx. −3) |
| **Responsividade** | 10 | −1 por página × largura com rolagem lateral (máx. −6); −1 por largura que não carregou; banca: −0,5 por elemento cortado, sobreposto ou fora da tela nas capturas, com a foto como prova |
| **SEO de conteúdo** | banca (régua abaixo) | — |
| **Segurança** | 10 | −3 sem CSP; −1,5 `script-src` com `'unsafe-inline'` sem nonce/hash; −1 `'unsafe-eval'`; −1 sem `frame-ancestors`/`X-Frame-Options`; −0,5 sem `nosniff`; −0,5 sem `Referrer-Policy`; −0,25 sem `Permissions-Policy`; −1,5 HTTPS sem HSTS; −0,5 versão do servidor no cabeçalho; **teto 4** com arquivo exposto (`.env`, `.git`); banca: **teto 5** com achado CRÍTICO, **teto 7** com ALTO, −0,5 por MÉDIO (máx. −3) |

## Régua da banca: SEO de conteúdo
Comece em 10 e desconte, citando a página:
- −1 por title repetido entre páginas; −1 por description repetida.
- −0,5 por title fora de 30–60 caracteres ou description fora de 70–160.
- −0,5 por H1 que não diz o assunto da página ou não conversa com o title.
- −0,5 por hierarquia de títulos pulando nível (h1 → h3).
- −0,5 por imagem de conteúdo com alt vazio de sentido ("imagem", "foto", nome de arquivo).
- −1 por página com menos de ~150 palavras de conteúdo próprio (exceto contato, privacidade, login).
- −0,5 por link com texto genérico ("clique aqui", "saiba mais" sem contexto).

## Régua da banca: segurança do código
Aplique `seguranca-web.md` ao código do site (servidor, configuração do proxy, JS do front). Conte os achados com prova: CRÍTICO, ALTO e MÉDIO. Esses números entram no `banca.json`.

## O banca.json
```json
{
  "seoConteudo": 9.5,
  "seguranca": { "critico": 0, "alto": 0, "medio": 1 },
  "descontos": { "responsividade": [{ "motivo": "botão Enviar cortado em 320 px (foto _contato_-320.png)", "valor": 0.5 }] }
}
```
`node scripts/placar.mjs <saida> --banca <saida>/banca.json` sai com código 0 só quando tudo passou.

## O que o placar não mede (diga no relatório)
GPU e celular reais, rede 4G real, comportamento atrás do CDN de produção (scripts injetados, cache, HSTS), leitor de tela real e contraste de texto sobre imagem. O Lighthouse cobre contraste de texto sobre cor sólida.
