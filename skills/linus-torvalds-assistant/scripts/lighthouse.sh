#!/usr/bin/env bash
# Lighthouse 12.8.2 no celular e no desktop, UMA página por vez (em paralelo a CPU é disputada e a nota de desempenho cai).
# Uso: bash lighthouse.sh <base> <saida> [caminho ...]
#   Sem caminhos: lê <saida>/medicao.json (do medir.mjs) ou usa "/".
# Saída: <saida>/lh-<slug>-mobile.json e -desktop.json, e uma linha por página e modo no terminal.
# Sem placa de vídeo o WebGL roda em SwiftShader (pior caso). O PageSpeed Insights também mede assim.
set -u
export MSYS_NO_PATHCONV=1   # Git Bash no Windows: não converter "/sobre/" em "C:/Program Files/Git/sobre/"
BASE="${1:?uso: lighthouse.sh <base> <saida> [caminho ...]}"; BASE="${BASE%/}"
SAIDA="${2:?uso: lighthouse.sh <base> <saida> [caminho ...]}"; shift 2
mkdir -p "$SAIDA"
PAGINAS=("$@")
if [ ${#PAGINAS[@]} -eq 0 ] && [ -f "$SAIDA/medicao.json" ]; then
  mapfile -t PAGINAS < <(node -e 'for (const p of require(process.argv[1]).paginas) console.log(p)' "$(cd "$SAIDA" && pwd)/medicao.json")
fi
[ ${#PAGINAS[@]} -eq 0 ] && PAGINAS=(/)

if [ -z "${CHROME_PATH:-}" ]; then
  for c in "$HOME"/.cache/ms-playwright/chromium-*/chrome-linux64/chrome /usr/bin/google-chrome /usr/bin/google-chrome-stable \
           /usr/bin/chromium /usr/bin/chromium-browser "C:/Program Files/Google/Chrome/Application/chrome.exe" \
           "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; do
    [ -x "$c" ] && { CHROME_PATH="$c"; break; }
  done
fi
[ -n "${CHROME_PATH:-}" ] || { echo "Chrome não encontrado: defina CHROME_PATH" >&2; exit 4; }
export CHROME_PATH

for u in "${PAGINAS[@]}"; do
  n=$(printf '%s' "$u" | sed 's/[^A-Za-z0-9]/_/g')
  for modo in mobile desktop; do
    extra=(); [ "$modo" = desktop ] && extra=(--preset=desktop)
    arq="$SAIDA/lh-$n-$modo.json"
    timeout 300 npx -y lighthouse@12.8.2 "$BASE$u" "${extra[@]}" --quiet --output=json --output-path="$arq" \
      --chrome-flags="--headless=new --no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader" >/dev/null 2>&1
    node -e 'const r=require(process.argv[1]);const c=r.categories;console.log(process.argv[2].padEnd(28),process.argv[3].padEnd(8),["performance","accessibility","best-practices","seo"].map(k=>k.slice(0,4)+"="+Math.round((c[k].score||0)*100)).join(" "),"LCP="+Math.round(r.audits["largest-contentful-paint"].numericValue),"TBT="+Math.round(r.audits["total-blocking-time"].numericValue),"CLS="+r.audits["cumulative-layout-shift"].numericValue.toFixed(3))' \
      "$(cd "$SAIDA" && pwd)/lh-$n-$modo.json" "$u" "$modo" 2>/dev/null \
      || echo "$u $modo: falhou (o servidor está no ar?)"
  done
done
