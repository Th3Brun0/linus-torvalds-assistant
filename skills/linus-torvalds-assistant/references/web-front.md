# Banca de Front-end de Website

## Especialistas
- **Engenheiro de desempenho web**: Core Web Vitals (LCP, CLS, INP/TBT), caminho crítico de renderização, imagens, fontes, cache.
- **Especialista em acessibilidade** (WCAG 2.2 AA): teclado, foco, contraste, alvos de toque, leitores de tela.
- **Especialista em SEO técnico**: indexação, metadados, dados estruturados, sitemap.
- **Desenvolvedor front-end sênior** do stack exato (HTML/CSS/JS puro, React, Vue, Astro, WordPress...).
- **Especialista em responsividade/UX**: 320 px até 1920 px, toque e mouse.

## Checklist
**Desempenho**
- Imagem do LCP sem `loading="lazy"`, com `fetchpriority="high"` ou preload; abaixo da dobra, `loading="lazy"`.
- Toda `<img>` com `width`/`height` (ou `aspect-ratio`) para não pular layout (CLS); formato moderno (AVIF/WebP) e tamanho certo (`srcset`).
- Fontes: `font-display: swap`, preload só da fonte do texto principal, subset quando possível.
- JS: `defer`/`type=module`, nada bloqueando a renderização, terceiros (chat, mapa, vídeo, 3D) atrás de **fachada** que carrega no clique.
- Seções longas abaixo da dobra com `content-visibility: auto`.
- Ler layout (`offsetHeight`) logo depois de escrever no DOM força reflow: use `ResizeObserver`.
- Cache longo só com nome versionado por **hash do conteúdo** (nunca data à mão: cache de 1 ano mistura CSS velho com HTML novo).

**Acessibilidade**
- Contraste 4,5:1 no texto normal, 3:1 no grande e em ícones de interface.
- Alvo de toque ≥ 24×24 px (exceção: link dentro de frase).
- Foco sempre visível; `outline: none` sem substituto é erro. Ordem de Tab lógica, sem armadilha de teclado.
- `lang` no `<html>`, landmarks (`header`, `nav`, `main`, `footer`), um H1, rótulo em todo campo e botão de ícone (`aria-label`).
- `alt` descritivo em imagem de conteúdo, `alt=""` em decorativa.
- `prefers-reduced-motion` respeitado em animação.

**SEO técnico**
- `title` e `description` únicos por página, `canonical`, `robots.txt`, `sitemap.xml` com todas as páginas públicas.
- JSON-LD válido (Organization/LocalBusiness/Product conforme o caso), Open Graph completo.
- Sem `noindex` em página que deve aparecer; 404 de verdade para página inexistente (não 200 com "não encontrado").

**Responsividade**
- Nada de rolagem lateral em 320 px. Tabela larga dentro de contêiner com `overflow-x: auto`.
- `<meta name="viewport" content="width=device-width, initial-scale=1">`, sem `maximum-scale=1` (bloqueia zoom).
- Texto ≥ 12 px em qualquer lugar e campo de formulário com 16 px (evita zoom automático no iOS).

**Boas práticas**
- Console limpo em todas as larguras. Sem bibliotecas com vulnerabilidade conhecida, sem `document.write`.
- O que o CDN injeta em produção (ex.: beacon de analytics do Cloudflare) precisa caber na CSP: só aparece medindo em produção.

## Base técnica de referência
web.dev (Core Web Vitals, Optimize LCP/CLS/INP); WCAG 2.2 (1.4.3 Contrast Minimum, 2.4.7 Focus Visible, 2.5.8 Target Size Minimum); Google Search Central (title, meta description, canonical, sitemaps, dados estruturados); documentação do Lighthouse; MDN.

## Estudo típico para indicar
A página do web.dev da métrica que falhou; o critério WCAG exato; a página do Search Central do item de SEO.
