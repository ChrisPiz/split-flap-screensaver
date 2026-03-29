#!/bin/bash
# Split Flap Screensaver — instalador
# Requiere: Xcode Command Line Tools (xcode-select --install)
set -e

APP="$HOME/Applications/SplitFlapSaver.app"

echo "→ Creando bundle..."
mkdir -p "$APP/Contents/MacOS"
mkdir -p "$APP/Contents/Resources/htdocs"
cp screensaver.html "$APP/Contents/Resources/htdocs/index.html"

cat > "$APP/Contents/Info.plist" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>  <string>SplitFlapSaver</string>
    <key>CFBundleIdentifier</key>  <string>com.chrispiz.splitflapsaver</string>
    <key>CFBundleName</key>        <string>SplitFlap Saver</string>
    <key>CFBundlePackageType</key> <string>APPL</string>
    <key>CFBundleVersion</key>     <string>1.0</string>
    <key>LSUIElement</key>         <true/>
</dict>
</plist>
PLIST

echo "→ Compilando..."
swiftc -framework AppKit -framework WebKit main.swift \
  -o "$APP/Contents/MacOS/SplitFlapSaver"

echo "→ Firmando..."
codesign --force --deep --sign - "$APP"
xattr -r -d com.apple.quarantine "$APP" 2>/dev/null || true

echo "→ Lanzando..."
pkill -x SplitFlapSaver 2>/dev/null || true
sleep 0.5
open "$APP"

echo ""
echo "✅ SplitFlapSaver instalado en ~/Applications/"
echo "   Se activa a los 5 minutos de inactividad."
echo "   Para auto-inicio: Configuración del Sistema → General → Ítems de inicio de sesión"
