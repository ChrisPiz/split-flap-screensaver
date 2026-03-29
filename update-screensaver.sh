#!/bin/bash
# Regenera el screensaver con los mensajes actuales de messages.md
set -e

cd "$(dirname "$0")"

echo "Generando screensaver..."
node build.js

echo "Instalando..."
cp screensaver.html ~/Applications/SplitFlapSaver.app/Contents/Resources/htdocs/index.html

echo "Reiniciando app..."
pkill -x SplitFlapSaver 2>/dev/null || true
sleep 0.5
open ~/Applications/SplitFlapSaver.app

echo "✅ Listo"
