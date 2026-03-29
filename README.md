# Split Flap Screensaver

Screensaver para macOS que simula un tablero split-flap, rotando frases de diseño. Basado en [FlipOff](https://github.com/magnum6actual/flipoff).

---

## Descarga rápida

1. Descarga [SplitFlapSaver.zip](https://github.com/ChrisPiz/split-flap-screensaver/releases/latest) y descomprime
2. Mueve `SplitFlapSaver.app` a tu carpeta **Aplicaciones**
3. Click derecho → **Abrir** (necesario la primera vez por Gatekeeper)
4. Para inicio automático: **Configuración del Sistema → General → Ítems de inicio de sesión → +**

---

## Como funciona

- Corre en background sin icono en el Dock
- Se activa tras **5 minutos** de inactividad
- Cualquier movimiento de mouse o tecla lo cierra
- Rota 40 frases de diseño en un tablero split-flap animado

---

## Compilar desde el codigo

Requiere Xcode Command Line Tools (`xcode-select --install`):

```bash
git clone https://github.com/ChrisPiz/split-flap-screensaver.git
cd split-flap-screensaver
bash install.sh
```

---

## Personalizar frases

Edita `messages.md` y corre `bash install.sh`. Formato: un mensaje por bloque separado por `---`, maximo **22 caracteres** por linea, maximo **3 lineas** por mensaje.

```
DESIGN IS THINKING
MADE VISUAL
- SAUL BASS

---

LESS IS MORE

- MIES VAN DER ROHE
```

---

## Creditos

Basado en [FlipOff](https://github.com/magnum6actual/flipoff).
