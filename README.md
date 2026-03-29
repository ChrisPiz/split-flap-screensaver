# Split Flap Screensaver

A macOS screensaver that simulates a split-flap display, rotating through design quotes. Based on [FlipOff](https://github.com/magnum6actual/flipoff).

---

## Descarga rápida

1. Descargá [SplitFlapSaver.zip](https://github.com/ChrisPiz/split-flap-screensaver/releases/latest) y descomprimí
2. Mové `SplitFlapSaver.app` a tu carpeta **Aplicaciones**
3. Click derecho → **Abrir** (necesario la primera vez por Gatekeeper)
4. Para inicio automático: **Configuración del Sistema → General → Ítems de inicio de sesión → +**

---

## Cómo funciona

- Corre en background sin ícono en el Dock
- Se activa tras **5 minutos** de inactividad
- Cualquier movimiento de mouse o tecla lo cierra
- Rota 40 frases de diseño en un tablero split-flap animado

---

## Compilar desde el código

Requiere Xcode Command Line Tools (`xcode-select --install`):

```bash
git clone https://github.com/ChrisPiz/split-flap-screensaver.git
cd split-flap-screensaver
bash install.sh
```

---

## Personalizar frases

Editá `messages.md` y corré `bash install.sh`. Formato: un mensaje por bloque separado por `---`, máximo **22 caracteres** por línea, máximo **3 líneas** por mensaje.

```
DESIGN IS THINKING
MADE VISUAL
- SAUL BASS

---

LESS IS MORE

- MIES VAN DER ROHE
```

---

## Créditos

Basado en [FlipOff](https://github.com/magnum6actual/flipoff).
