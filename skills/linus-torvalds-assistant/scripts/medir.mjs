#!/usr/bin/env node
// Medição de um website no navegador para o modo de entrega do Linus.
// Uso: node medir.mjs --base http://localhost:8090 [--paginas /,/sobre/] [--saida ./entrega] [--larguras 320,390,768,1366]
// Sem --paginas: lê o /sitemap.xml (até 30 páginas do mesmo site) ou usa só "/".
// Saída: <saida>/medicao.json e <saida>/fotos/*.png, e um resumo no terminal.
// Precisa de playwright-core (no projeto ou em ~/.cache/linus-entrega) e de um Chrome/Chromium.
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
)
if (!args.base) {
  console.error('uso: node medir.mjs --base <url> [--paginas /,/x/] [--saida dir] [--larguras 320,390,...]')
  process.exit(2)
}
const BASE = args.base.replace(/\/$/, '')
const SAIDA = resolve(args.saida || 'entrega-linus')
const LARGURAS = (args.larguras || '320,375,390,768,1024,1366,1920').split(',').map(Number)
const LARGURA_DESKTOP = 1366
// LINUS_ENTREGA_CACHE: pasta com node_modules/playwright-core, para máquina com pouco espaço no /home
const CACHE = process.env.LINUS_ENTREGA_CACHE || join(homedir(), '.cache', 'linus-entrega')

function carregarPlaywright() {
  for (const base of [process.cwd(), CACHE]) {
    try {
      return createRequire(join(base, 'noop.js'))('playwright-core')
    } catch {}
  }
  console.error(`playwright-core não encontrado. Instale uma vez:\n  npm install --prefix ${CACHE} playwright-core@1.64.0`)
  process.exit(3)
}

function acharChrome(chromium) {
  const candidatos = [process.env.CHROME_PATH]
  try { candidatos.push(chromium.executablePath()) } catch {}
  for (const raiz of [join(homedir(), '.cache', 'ms-playwright'), process.env.PLAYWRIGHT_BROWSERS_PATH].filter(Boolean)) {
    if (!existsSync(raiz)) continue
    for (const d of readdirSync(raiz).filter(n => /^chromium-\d+$/.test(n)).sort().reverse()) {
      candidatos.push(join(raiz, d, 'chrome-linux64', 'chrome'), join(raiz, d, 'chrome-linux', 'chrome'))
    }
  }
  candidatos.push(
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  )
  return candidatos.find(c => c && existsSync(c))
}

async function paginasDoSitemap() {
  try {
    const r = await fetch(`${BASE}/sitemap.xml`)
    if (!r.ok) return null
    const locs = [...(await r.text()).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1])
    const caminhos = locs.map(u => { try { return new URL(u).pathname } catch { return null } }).filter(Boolean)
    return caminhos.length ? [...new Set(caminhos)].slice(0, 30) : null
  } catch { return null }
}

const slug = p => p.replace(/[^A-Za-z0-9]/g, '_')

// Cabeçalhos de segurança de uma resposta (o meta CSP entra pela página)
function avaliarCabecalhos(h, metaCsp, https) {
  const csp = h['content-security-policy'] || ''
  const efetiva = csp || metaCsp || ''
  const diretiva = nome => (efetiva.split(';').map(d => d.trim()).find(d => d.startsWith(nome + ' ')) || '')
  const scriptSrc = diretiva('script-src') || diretiva('default-src')
  const temNonceOuHash = /'nonce-|'sha(256|384|512)-|'strict-dynamic'/.test(scriptSrc)
  const servidor = `${h['server'] || ''} ${h['x-powered-by'] || ''}`.trim()
  return {
    csp: csp ? 'cabeçalho' : metaCsp ? 'meta' : 'ausente',
    unsafeInline: /'unsafe-inline'/.test(scriptSrc) && !temNonceOuHash,
    unsafeEval: /'unsafe-eval'/.test(scriptSrc),
    // frame-ancestors só vale no cabeçalho; no <meta> o navegador ignora
    antiFrame: /frame-ancestors/.test(csp) || !!h['x-frame-options'],
    nosniff: (h['x-content-type-options'] || '').toLowerCase() === 'nosniff',
    referrerPolicy: !!h['referrer-policy'],
    permissionsPolicy: !!h['permissions-policy'],
    hsts: https ? !!h['strict-transport-security'] : null,
    versaoNoServidor: /\d/.test(servidor) ? servidor : null,
  }
}

async function sondarSite() {
  const sondas = {}
  for (const caminho of ['/robots.txt', '/sitemap.xml']) {
    try { sondas[caminho] = (await fetch(BASE + caminho)).status } catch { sondas[caminho] = 'erro' }
  }
  // Arquivos que nunca podem sair; 200 com HTML costuma ser o fallback de SPA, não exposição
  const expostos = []
  for (const caminho of ['/.env', '/.git/HEAD', '/.git/config', '/%2eenv', '/.DS_Store', '/package.json', '/composer.json']) {
    try {
      const r = await fetch(BASE + caminho, { redirect: 'manual' })
      const corpo = r.status === 200 ? (await r.text()).slice(0, 200) : ''
      if (r.status === 200 && !/^\s*<!doctype html|^\s*<html/i.test(corpo)) expostos.push(caminho)
    } catch {}
  }
  return { sondas, expostos }
}

async function medirPagina(browser, caminho) {
  const url = BASE + caminho
  const res = { url, console: [], falhas: [], larguras: {}, seo: null, foco: null, cabecalhos: null }
  for (const largura of LARGURAS) {
    const ctx = await browser.newContext({ viewport: { width: largura, height: largura <= 768 ? 740 : 900 }, hasTouch: largura <= 768 })
    const page = await ctx.newPage()
    page.on('console', m => { if (m.type() === 'error') res.console.push(m.text().slice(0, 300)) })
    page.on('pageerror', e => res.console.push(`pageerror: ${String(e.message).slice(0, 300)}`))
    page.on('response', r => { if (r.status() >= 400) res.falhas.push(`${r.status()} ${r.url()}`) })
    page.on('requestfailed', r => res.falhas.push(`falhou ${r.url()} (${r.failure()?.errorText || ''})`))
    let resposta
    try {
      resposta = await page.goto(url, { waitUntil: 'load', timeout: 45000 })
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
    } catch (e) {
      res.larguras[largura] = { erro: String(e.message).slice(0, 200) }
      await ctx.close()
      continue
    }
    const medida = await page.evaluate(movel => {
      const visivel = el => {
        const r = el.getBoundingClientRect(), s = getComputedStyle(el)
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0
      }
      const nome = el => {
        const rotulo = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 20)
        return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '') + (rotulo ? `[${rotulo}]` : '')
      }
      const larg = document.documentElement.clientWidth
      const rolagemLateral = document.documentElement.scrollWidth > larg + 1
      const culpados = rolagemLateral
        ? [...document.querySelectorAll('body *')].filter(el => visivel(el) && el.getBoundingClientRect().right > larg + 1).slice(0, 5).map(nome)
        : []
      const alvos = movel
        ? [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=link],summary')]
            .filter(visivel)
            // exceção da WCAG 2.5.8 para link dentro de frase
            .filter(el => !(el.tagName === 'A' && el.closest('p,li') && (el.closest('p,li').textContent.trim().length > el.textContent.trim().length + 10)))
            .map(el => ({ el, r: el.getBoundingClientRect() }))
            .filter(({ r }) => r.width < 24 || r.height < 24)
            .map(({ el, r }) => `${nome(el)} ${Math.round(r.width)}x${Math.round(r.height)}`)
        : []
      const textoPequeno = [...document.querySelectorAll('body *')]
        .filter(el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && visivel(el) && parseFloat(getComputedStyle(el).fontSize) < 12)
        .map(el => `${nome(el)} ${getComputedStyle(el).fontSize}`)
      return { rolagemLateral, culpados, alvosPequenos: [...new Set(alvos)], textoPequeno: [...new Set(textoPequeno)] }
    }, largura <= 768)
    mkdirSync(join(SAIDA, 'fotos'), { recursive: true })
    await page.screenshot({ path: join(SAIDA, 'fotos', `${slug(caminho)}-${largura}.png`), fullPage: largura === 390 || largura === LARGURA_DESKTOP })
    res.larguras[largura] = medida

    if (largura === LARGURA_DESKTOP) {
      const h = resposta ? await resposta.allHeaders() : {}
      res.seo = await page.evaluate(() => {
        const meta = sel => document.querySelector(sel)?.getAttribute('content') || null
        const jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')]
        let invalidos = 0
        for (const s of jsonld) { try { JSON.parse(s.textContent) } catch { invalidos++ } }
        return {
          title: document.title || null,
          description: meta('meta[name="description"]'),
          h1: document.querySelectorAll('h1').length,
          canonical: document.querySelector('link[rel="canonical"]')?.href || null,
          lang: document.documentElement.getAttribute('lang'),
          viewport: meta('meta[name="viewport"]'),
          og: ['og:title', 'og:description', 'og:image'].filter(p => !document.querySelector(`meta[property="${p}"]`)),
          jsonld: jsonld.length, jsonldInvalido: invalidos,
          noindex: /noindex/i.test(meta('meta[name="robots"]') || ''),
          imgSemAlt: document.querySelectorAll('img:not([alt])').length,
          imgSemDimensao: [...document.querySelectorAll('img')].filter(i => !i.getAttribute('width') || !i.getAttribute('height')).length,
          metaCsp: meta('meta[http-equiv="Content-Security-Policy" i]'),
          links: [...document.querySelectorAll('a[href]')].map(a => a.href).filter(h => h.startsWith(location.origin)),
        }
      })
      res.cabecalhos = avaliarCabecalhos(h, res.seo.metaCsp, url.startsWith('https:'))
      // Foco visível (WCAG 2.4.7): percorre os primeiros elementos com Tab
      res.foco = await (async () => {
        const semFoco = []
        await page.locator('body').click({ position: { x: 1, y: 1 } }).catch(() => {})
        for (let i = 0; i < 15; i++) {
          await page.keyboard.press('Tab')
          const r = await page.evaluate(() => {
            const el = document.activeElement
            if (!el || el === document.body) return null
            const s = getComputedStyle(el)
            const temAnel = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== 'none'
            return { el: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''), temAnel }
          })
          if (r && !r.temAnel) semFoco.push(r.el)
        }
        return { semFoco: [...new Set(semFoco)] }
      })()
    }
    await ctx.close()
  }
  res.console = [...new Set(res.console)]
  res.falhas = [...new Set(res.falhas)]
  return res
}

async function checarLinks(links) {
  const quebrados = []
  for (const l of [...new Set(links)].slice(0, 150)) {
    try {
      const r = await fetch(l.split('#')[0], { redirect: 'follow' })
      if (r.status >= 400) quebrados.push(`${r.status} ${l}`)
    } catch (e) { quebrados.push(`erro ${l}`) }
  }
  return quebrados
}

const { chromium } = carregarPlaywright()
const chrome = acharChrome(chromium)
if (!chrome) {
  console.error('Chrome/Chromium não encontrado. Defina CHROME_PATH ou rode: npx playwright-core@1.64.0 install chromium')
  process.exit(4)
}
const paginas = args.paginas ? args.paginas.split(',') : (await paginasDoSitemap()) || ['/']
mkdirSync(SAIDA, { recursive: true })
const browser = await chromium.launch({ executablePath: chrome, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const porPagina = {}
for (const p of paginas) {
  process.stderr.write(`medindo ${p}\n`)
  porPagina[p] = await medirPagina(browser, p)
}
await browser.close()
const site = await sondarSite()
site.linksQuebrados = await checarLinks(Object.values(porPagina).flatMap(r => r.seo?.links || []))
for (const r of Object.values(porPagina)) if (r.seo) delete r.seo.links

const medicao = { base: BASE, quando: new Date().toISOString(), chrome, larguras: LARGURAS, paginas, porPagina, site }
writeFileSync(join(SAIDA, 'medicao.json'), JSON.stringify(medicao, null, 2))

// Resumo no terminal
for (const [p, r] of Object.entries(porPagina)) {
  const rolagem = Object.entries(r.larguras).filter(([, m]) => m.rolagemLateral).map(([w]) => w)
  const alvos = new Set(Object.values(r.larguras).flatMap(m => m.alvosPequenos || []))
  const texto = new Set(Object.values(r.larguras).flatMap(m => m.textoPequeno || []))
  const erros = Object.entries(r.larguras).filter(([, m]) => m.erro).map(([w]) => w)
  console.log(`${p.padEnd(28)} console=${r.console.length} falhas=${r.falhas.length} rolagem=[${rolagem}] alvos<24=${alvos.size} texto<12=${texto.size} semFoco=${r.foco?.semFoco.length ?? '?'} imgSemAlt=${r.seo?.imgSemAlt ?? '?'}${erros.length ? ' ERRO_EM=' + erros : ''}`)
}
console.log(`site: robots=${site.sondas['/robots.txt']} sitemap=${site.sondas['/sitemap.xml']} expostos=[${site.expostos}] linksQuebrados=${site.linksQuebrados.length}`)
console.log(`medicao: ${join(SAIDA, 'medicao.json')}`)
