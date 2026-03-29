/**
 * build.js — Genera screensaver.html con todo inline
 * Uso: node build.js
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');

const DIR = __dirname;

// ─── Helpers ────────────────────────────────────────────────────────────────

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function stripModuleSyntax(code) {
  return code
    // Multi-line destructured imports: import { \n  X,\n  Y\n} from '...'
    .replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"]\s*;?/gs, '')
    // Default imports: import X from '...'
    .replace(/import\s+\w+\s*from\s*['"][^'"]+['"]\s*;?/g, '')
    // Side-effect imports: import '...'
    .replace(/import\s*['"][^'"]+['"]\s*;?/g, '')
    // export const/class/function/etc.
    .replace(/^export\s+(const|let|var|class|function|async)/gm, '$1')
    // export default
    .replace(/^export\s+default\s+/gm, '')
    // export { ... }
    .replace(/^export\s*\{[^}]*\};?\s*$/gm, '')
    .trim();
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function build() {

  // 1. CSS — leer y concatenar
  const cssFiles = ['reset.css', 'layout.css', 'board.css', 'tile.css'];
  const css = cssFiles
    .map(f => `/* ${f} */\n` + fs.readFileSync(path.join(DIR, 'css', f), 'utf8'))
    .join('\n\n')
    + '\n\n/* screensaver overrides */\nhtml, body { background: #111; height: 100%; }\n.page-frame { min-height: 100vh; background: #111; }';

  // 2. Font — descargar Barlow Condensed 700 y embeber como base64
  let fontFace = "/* Font fallback — sin conexión a internet durante el build */";
  try {
    console.log('Descargando Barlow Condensed Bold...');
    const googleCss = (await fetchUrl(
      'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&display=swap'
    )).toString();
    const match = googleCss.match(/url\((https?:\/\/fonts\.gstatic\.com[^)'"]+)\)/)
                || googleCss.match(/src:\s*url\(['"]?(https?:\/\/fonts\.gstatic\.com[^'")\s]+)/);
    if (match) {
      const fontBuf = await fetchUrl(match[1]);
      const b64 = fontBuf.toString('base64');
      fontFace = `@font-face {
  font-family: 'Barlow Condensed';
  font-weight: 700;
  font-style: normal;
  src: url('data:font/woff2;base64,${b64}') format('woff2');
}`;
      console.log(`  Fuente embebida (${(fontBuf.length / 1024).toFixed(1)} KB)`);
    }
  } catch (e) {
    console.warn('  No se pudo descargar la fuente, se usa fallback del sistema:', e.message);
  }

  // 3. JS — módulos en orden de dependencia, sin import/export
  const jsOrder = [
    'constants.js',
    'flapAudio.js',
    'SoundEngine.js',
    'Tile.js',
    'Board.js',
    'MessageRotator.js',
    'KeyboardController.js',
  ];

  const jsModules = jsOrder
    .map(f => {
      let code = stripModuleSyntax(fs.readFileSync(path.join(DIR, 'js', f), 'utf8'));
      // Eliminar MESSAGES de constants.js — se reemplaza con el de messages.md
      if (f === 'constants.js') {
        code = code.replace(/const MESSAGES\s*=\s*\[[\s\S]*?\];/, '// MESSAGES inyectado desde messages.md');
      }
      return `// ─── ${f} ───\n${code}`;
    })
    .join('\n\n');

  // Parsear messages.md y generar el array MESSAGES
  function parseMd(filepath) {
    const text = fs.readFileSync(filepath, 'utf8');
    return text.split(/\n---\n/)
      .map(b => b.trim()).filter(Boolean)
      .map(block => {
        const lines = block.split('\n').map(l => l.trim());
        // Centrar verticalmente en 5 filas: vacío arriba y abajo
        const padTop = Math.floor((5 - lines.length) / 2);
        const rows = [];
        for (let i = 0; i < 5; i++) rows.push(lines[i - padTop] || '');
        return rows;
      });
  }
  const parsedMessages = parseMd(path.join(DIR, 'messages.md'));
  const messagesOverride = `const MESSAGES = ${JSON.stringify(parsedMessages, null, 2)};`;

  // MessageParser adaptado: sin fetch, devuelve defaults directamente
  const messageParser = `
// ─── MessageParser.js (screensaver: sin fetch) ───
async function loadMessages(_url, defaultMessages) {
  return defaultMessages;
}`;

  // main.js adaptado
  const mainJs = `
// ─── main.js ───
document.addEventListener('DOMContentLoaded', async () => {
  const boardContainer = document.getElementById('board-container');
  const soundEngine = new SoundEngine();
  const board = new Board(boardContainer, soundEngine);
  const messages = await loadMessages('messages.md', MESSAGES);
  const rotator = new MessageRotator(board, messages);
  new KeyboardController(rotator, soundEngine);

  let audioInitialized = false;
  const initAudio = async () => {
    if (audioInitialized) return;
    audioInitialized = true;
    await soundEngine.init();
    soundEngine.resume();
    document.removeEventListener('click', initAudio);
    document.removeEventListener('keydown', initAudio);
  };
  document.addEventListener('click', initAudio);
  document.addEventListener('keydown', initAudio);

  rotator.start();

  // Escalar tiles en fullscreen
  const boardEl = document.querySelector('.board');
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      boardEl.style.setProperty('--tile-size', 'clamp(32px, 10vmin, 82px)');
    } else {
      boardEl.style.removeProperty('--tile-size');
    }
  });
});`;

  const js = [jsModules, messagesOverride, messageParser, mainJs].join('\n\n');

  // 4. HTML final
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FlipOff Screensaver</title>
  <style>
${fontFace}

${css}
  </style>
</head>
<body>
  <div class="page-frame" id="board-container"></div>
  <script>
${js}
  </script>
</body>
</html>`;

  const outPath = path.join(DIR, 'screensaver.html');
  fs.writeFileSync(outPath, html, 'utf8');
  const kb = (html.length / 1024).toFixed(1);
  console.log(`\n✅  screensaver.html generado (${kb} KB)`);
  console.log(`   Ruta: ${outPath}`);
  console.log('\nPróximos pasos:');
  console.log('  1. Abrí screensaver.html directamente en el navegador para verificar');
  console.log('  2. Instalá Web Screensaver: brew install --cask web-screensaver');
  console.log('  3. Configuralo en Preferencias del Sistema → Protector de pantalla');
}

build().catch(err => {
  console.error('Error en el build:', err);
  process.exit(1);
});
