#!/usr/bin/env bash
# Exporta cada docs/diagramas/*.drawio a docs/diagramas/img/<nombre>.png con la CLI de draw.io.
# Uso: make diagramas   (requiere draw.io desktop: brew install --cask drawio)
set -euo pipefail

cd "$(dirname "$0")"

# `drawio` en el PATH o la app de escritorio de macOS; se puede forzar con DRAWIO=/ruta/al/binario
DRAWIO="${DRAWIO:-$(command -v drawio || echo /Applications/draw.io.app/Contents/MacOS/draw.io)}"
if [ ! -x "$DRAWIO" ]; then
  echo "No se encontró draw.io. Instálalo con: brew install --cask drawio" >&2
  exit 1
fi

mkdir -p img
for src in *.drawio; do
  out="img/${src%.drawio}.png"
  echo "→ $out"
  # --scale 2: nítido en pantallas retina · --border 20: margen blanco alrededor
  "$DRAWIO" -x -f png --scale 2 --border 20 -o "$out" "$src"
done
