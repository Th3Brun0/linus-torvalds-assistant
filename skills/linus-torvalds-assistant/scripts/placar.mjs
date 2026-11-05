#!/usr/bin/env node
// Placar 0-10 por área do modo de entrega, pela régua de references/placar-web.md.
// Uso: node placar.mjs <saida> [--banca banca.json]
//   <saida> tem o medicao.json (medir.mjs) e os lh-*.json (lighthouse.sh).
//   banca.json (opcional): {"seoConteudo": 9.5, "seguranca": {"critico": 0, "alto": 0, "medio": 1},
//                           "descontos": {"responsividade": [{"motivo": "...", "valor": 0.5}]}}
// Sai com código 0 só se todas as áreas foram medidas e estão >= 9,0.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const CORTE = 9.0
const arred = n => Math.round(n * 10) / 10
const centavos = n => Math.round(n * 100) / 100
const limitar = n => Math.max(0, Math.min(10, n))

function area(nome) {
  const descontos = []
  return {
    nome, base: null, teto: 10, descontos,
    tirar(valor, motivo) { if (valor > 0) descontos.push({ valor: centavos(valor), motivo }) },
    limitar(teto, motivo) { this.teto = Math.min(this.teto, teto); descontos.push({ valor: 0, teto, motivo }) },
    // várias ocorrências do mesmo tipo, com desconto máximo
    tirarVarios(qtd, cada, max, motivo) { if (qtd > 0) descontos.push({ valor: centavos(Math.min(qtd * cada, max)), motivo: `${motivo} (${qtd})` }) },
    nota() {
      if (this.base === null) return null
      // o teto vale depois dos descontos: um .env exposto deixa a nota em no máximo 4, não em 4 menos o resto
      return arred(limitar(Math.min(this.teto, this.base - descontos.reduce((s, d) => s + d.valor, 0))))
    },
  }
}

export function calcular(medicao, lhs, banca = {}) {
  const paginas = Object.values(medicao.porPagina)
  const mob = lhs.filter(l => l.modo === 'mobile')
  const cat = k => (mob.length === paginas.length && mob.length ? Math.min(...mob.map(l => l.categorias[k])) * 10 : null)
  const r = {}

  const des = r.desempenho = area('Desempenho')
  des.base = cat('performance')
  for (const l of mob) {
    if (l.lcp > 2500) des.limitar(8.9, `LCP ${Math.round(l.lcp)} ms > 2500 em ${l.pagina}`)
    if (l.cls > 0.1) des.limitar(8.9, `CLS ${l.cls.toFixed(3)} > 0,1 em ${l.pagina}`)
    if (l.tbt > 200) des.limitar(8.9, `TBT ${Math.round(l.tbt)} ms > 200 em ${l.pagina}`)
  }

  // o mesmo elemento em larguras diferentes conta uma vez (tira o tamanho do fim: "button[Menu] 16x16")
  const uniq = f => new Set(paginas.flatMap(f).map(s => s.replace(/ [\d.]+(x\d+|px)$/, ''))).size
  const a11y = r.acessibilidade = area('Acessibilidade')
  a11y.base = cat('accessibility')
  a11y.tirarVarios(uniq(p => Object.values(p.larguras).flatMap(m => m.alvosPequenos || [])), 0.25, 2, 'alvo de toque < 24 px')
  a11y.tirarVarios(uniq(p => Object.values(p.larguras).flatMap(m => m.textoPequeno || [])), 0.25, 2, 'texto < 12 px')
  a11y.tirarVarios(uniq(p => p.foco?.semFoco || []), 0.5, 2, 'foco sem indicação visível')

  const bp = r.boasPraticas = area('Boas práticas')
  bp.base = cat('best-practices')
  bp.tirarVarios(uniq(p => p.console), 1, 4, 'erro no console')
  bp.tirarVarios(uniq(p => p.falhas.filter(f => f.includes(medicao.base))), 0.5, 2, 'requisição do próprio site com erro')

  const seo = r.seoTecnico = area('SEO técnico')
  seo.base = cat('seo')
  const faltas = paginas.reduce((n, p) => n + ['title', 'description', 'canonical', 'lang', 'viewport'].filter(k => !p.seo?.[k]).length, 0)
  seo.tirarVarios(faltas, 0.25, 3, 'title/description/canonical/lang/viewport faltando')
  seo.tirarVarios(paginas.filter(p => p.seo && p.seo.h1 !== 1).length, 0.25, 2, 'página sem exatamente um H1')
  seo.tirarVarios(paginas.reduce((n, p) => n + (p.seo?.og.length || 0), 0), 0.1, 1, 'Open Graph faltando')
  seo.tirarVarios(paginas.reduce((n, p) => n + (p.seo?.jsonldInvalido || 0), 0), 0.5, 2, 'JSON-LD inválido')
  seo.tirarVarios(paginas.filter(p => p.seo?.noindex).length, 1, 3, 'noindex em página publicada')
  if (medicao.site.sondas['/robots.txt'] !== 200) seo.tirar(0.5, 'robots.txt ausente')
  if (medicao.site.sondas['/sitemap.xml'] !== 200) seo.tirar(0.5, 'sitemap.xml ausente')
  seo.tirarVarios(medicao.site.linksQuebrados.length, 0.5, 3, 'link interno quebrado')

  const resp = r.responsividade = area('Responsividade')
  resp.base = paginas.every(p => Object.keys(p.larguras).length) ? 10 : null
  const comRolagem = paginas.reduce((n, p) => n + Object.values(p.larguras).filter(m => m.rolagemLateral).length, 0)
  resp.tirarVarios(comRolagem, 1, 6, 'rolagem lateral (página × largura)')
  resp.tirarVarios(paginas.reduce((n, p) => n + Object.values(p.larguras).filter(m => m.erro).length, 0), 1, 6, 'largura que não carregou')

  const sc = r.seoConteudo = area('SEO de conteúdo')
  sc.base = typeof banca.seoConteudo === 'number' ? banca.seoConteudo : null

  const seg = r.seguranca = area('Segurança')
  seg.base = 10
  const pior = k => paginas.some(p => p.cabecalhos?.[k])
  const nenhum = k => paginas.some(p => p.cabecalhos && !p.cabecalhos[k])
  if (paginas.some(p => p.cabecalhos?.csp === 'ausente')) seg.tirar(3, 'sem CSP')
  if (pior('unsafeInline')) seg.tirar(1.5, "script-src com 'unsafe-inline' sem nonce/hash")
  if (pior('unsafeEval')) seg.tirar(1, "script-src com 'unsafe-eval'")
  if (nenhum('antiFrame')) seg.tirar(1, 'sem frame-ancestors nem X-Frame-Options')
  if (nenhum('nosniff')) seg.tirar(0.5, 'sem X-Content-Type-Options: nosniff')
  if (nenhum('referrerPolicy')) seg.tirar(0.5, 'sem Referrer-Policy')
  if (nenhum('permissionsPolicy')) seg.tirar(0.25, 'sem Permissions-Policy')
  if (paginas.some(p => p.cabecalhos?.hsts === false)) seg.tirar(1.5, 'HTTPS sem HSTS')
  if (pior('versaoNoServidor')) seg.tirar(0.5, 'versão do servidor no cabeçalho')
  if (medicao.site.expostos.length) seg.limitar(4, `arquivo exposto: ${medicao.site.expostos.join(', ')}`)
  const b = banca.seguranca
  if (!b) seg.pendente = 'revisão do código pela banca (seguranca-web.md) ainda não informada'
  else {
    if (b.critico > 0) seg.limitar(5, `banca: ${b.critico} achado(s) CRÍTICO`)
    else if (b.alto > 0) seg.limitar(7, `banca: ${b.alto} achado(s) ALTO`)
    seg.tirarVarios(b.medio || 0, 0.5, 3, 'achado MÉDIO da banca')
  }

  for (const [chave, lista] of Object.entries(banca.descontos || {})) {
    for (const d of lista) r[chave]?.tirar(d.valor, `banca: ${d.motivo}`)
  }
  return r
}

export function lerLighthouse(dir, medicao) {
  const slug = p => p.replace(/[^A-Za-z0-9]/g, '_')
  const out = []
  for (const pagina of medicao.paginas) {
    for (const modo of ['mobile', 'desktop']) {
      const arq = join(dir, `lh-${slug(pagina)}-${modo}.json`)
      if (!existsSync(arq)) continue
      const j = JSON.parse(readFileSync(arq, 'utf8'))
      if (!j.categories?.performance) continue
      out.push({
        pagina, modo,
        categorias: Object.fromEntries(['performance', 'accessibility', 'best-practices', 'seo'].map(k => [k, j.categories[k]?.score ?? 0])),
        lcp: j.audits['largest-contentful-paint'].numericValue,
        cls: j.audits['cumulative-layout-shift'].numericValue,
        tbt: j.audits['total-blocking-time'].numericValue,
      })
    }
  }
  return out
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2]
  if (!dir) { console.error('uso: node placar.mjs <saida> [--banca banca.json]'); process.exit(2) }
  const iBanca = process.argv.indexOf('--banca')
  const banca = iBanca > 0 ? JSON.parse(readFileSync(process.argv[iBanca + 1], 'utf8')) : {}
  const medicao = JSON.parse(readFileSync(join(dir, 'medicao.json'), 'utf8'))
  const lhs = lerLighthouse(dir, medicao)
  if (!lhs.length) console.log(`(sem Lighthouse em ${dir}: ${readdirSync(dir).filter(f => f.startsWith('lh-')).length} arquivos lh-*)`)
  const r = calcular(medicao, lhs, banca)
  let aprovado = true
  for (const a of Object.values(r)) {
    const n = a.nota()
    const ok = n !== null && n >= CORTE && !a.pendente
    aprovado &&= ok
    const status = n === null ? 'NÃO MEDIDA' : a.pendente ? 'PENDENTE' : ok ? 'ok' : 'ABAIXO'
    console.log(`${a.nome.padEnd(16)} ${n === null ? '  - ' : n.toFixed(1).padStart(4)}  ${status}`)
    for (const d of a.descontos) console.log(`${''.padEnd(22)}${d.valor ? ('-' + d.valor).padEnd(6) : ('teto ' + d.teto).padEnd(6)}  ${d.motivo}`)
    if (a.pendente) console.log(`${''.padEnd(22)}pendente: ${a.pendente}`)
  }
  console.log(aprovado ? `\nENTREGA APROVADA: todas as áreas >= ${CORTE}` : `\nENTREGA REPROVADA: há área abaixo de ${CORTE}, pendente ou não medida`)
  writeFileSync(join(dir, 'placar.json'), JSON.stringify(Object.fromEntries(Object.entries(r).map(([k, a]) => [k, { nota: a.nota(), descontos: a.descontos, pendente: a.pendente || null }])), null, 2))
  process.exit(aprovado ? 0 : 1)
}
