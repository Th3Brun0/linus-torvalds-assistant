// node --test placar.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcular } from './placar.mjs'

const cab = { csp: 'cabeçalho', unsafeInline: false, unsafeEval: false, antiFrame: true, nosniff: true, referrerPolicy: true, permissionsPolicy: true, hsts: null, versaoNoServidor: null }
const seo = { title: 'T', description: 'D', h1: 1, canonical: 'c', lang: 'pt-BR', viewport: 'v', og: [], jsonld: 1, jsonldInvalido: 0, noindex: false }
const pagina = (extra = {}) => ({ console: [], falhas: [], larguras: { 390: { rolagemLateral: false, alvosPequenos: [], textoPequeno: [] } }, foco: { semFoco: [] }, seo, cabecalhos: cab, ...extra })
const medicao = (porPagina, site = {}) => ({ base: 'http://x', paginas: Object.keys(porPagina), porPagina, site: { sondas: { '/robots.txt': 200, '/sitemap.xml': 200 }, expostos: [], linksQuebrados: [], ...site } })
const lh = (pagina, perf = 0.95, extra = {}) => ({ pagina, modo: 'mobile', categorias: { performance: perf, accessibility: 1, 'best-practices': 1, seo: 1 }, lcp: 1800, cls: 0.02, tbt: 100, ...extra })
const banca = { seoConteudo: 9.5, seguranca: { critico: 0, alto: 0, medio: 0 } }

test('site limpo passa em tudo', () => {
  const r = calcular(medicao({ '/': pagina() }), [lh('/')], banca)
  for (const a of Object.values(r)) assert.ok(a.nota() >= 9, `${a.nome} = ${a.nota()}`)
})

test('sem Lighthouse, desempenho não é medido (nunca nota chutada)', () => {
  const r = calcular(medicao({ '/': pagina() }), [], banca)
  assert.equal(r.desempenho.nota(), null)
  assert.equal(r.acessibilidade.nota(), null)
})

test('LCP acima de 2,5 s limita o desempenho a 8,9 mesmo com Lighthouse 100', () => {
  const r = calcular(medicao({ '/': pagina() }), [lh('/', 1, { lcp: 3200 })], banca)
  assert.equal(r.desempenho.nota(), 8.9)
})

test('nota da área é a da pior página', () => {
  const r = calcular(medicao({ '/': pagina(), '/b/': pagina() }), [lh('/', 0.99), lh('/b/', 0.82)], banca)
  assert.equal(r.desempenho.nota(), 8.2)
})

test('CSP com unsafe-inline e sem nosniff derruba segurança abaixo do corte', () => {
  const r = calcular(medicao({ '/': pagina({ cabecalhos: { ...cab, unsafeInline: true, nosniff: false } }) }), [lh('/')], banca)
  assert.equal(r.seguranca.nota(), 8)
})

test('arquivo exposto ou achado CRÍTICO da banca limitam a segurança', () => {
  const exp = calcular(medicao({ '/': pagina() }, { expostos: ['/.env'] }), [lh('/')], banca)
  assert.equal(exp.seguranca.nota(), 4)
  const crit = calcular(medicao({ '/': pagina() }), [lh('/')], { ...banca, seguranca: { critico: 1, alto: 0 } })
  assert.equal(crit.seguranca.nota(), 5)
})

test('segurança fica pendente sem a revisão da banca', () => {
  const r = calcular(medicao({ '/': pagina() }), [lh('/')], { seoConteudo: 9.5 })
  assert.ok(r.seguranca.pendente)
})

test('rolagem lateral e alvo pequeno descontam', () => {
  const p = pagina({ larguras: { 390: { rolagemLateral: true, alvosPequenos: ['a.x 16x16', 'button 20x20'], textoPequeno: [] } } })
  const r = calcular(medicao({ '/': p }), [lh('/')], banca)
  assert.equal(r.responsividade.nota(), 9)
  assert.equal(r.acessibilidade.nota(), 9.5)
})

test('teto vale depois dos descontos: .env exposto com cabeçalhos ruins fica em 4, não em 0', () => {
  const p = pagina({ cabecalhos: { ...cab, unsafeInline: true, nosniff: false, referrerPolicy: false } })
  const r = calcular(medicao({ '/': p }, { expostos: ['/.env'] }), [lh('/')], banca)
  assert.equal(r.seguranca.nota(), 4)
})
