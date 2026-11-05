import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const RAIZ = join(import.meta.dirname, 'public')
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain' }

createServer(async (req, res) => {
  let caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (caminho.endsWith('/')) caminho += 'index.html'
  const arquivo = normalize(join(RAIZ, caminho))
  if (!arquivo.startsWith(RAIZ)) { res.writeHead(403); return res.end() }
  try {
    const corpo = await readFile(arquivo)
    res.writeHead(200, {
      'Content-Type': TIPOS[extname(arquivo)] || 'application/octet-stream',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      'X-Powered-By': 'Express/4.18.2',
    })
    res.end(corpo)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('não encontrado')
  }
}).listen(Number(process.env.PORT || 8090))
