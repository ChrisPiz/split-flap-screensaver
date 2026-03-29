# Split Flap Screensaver

A macOS screensaver that simulates a split-flap display, rotating through design quotes. Based on [FlipOff](https://github.com/magnum6actual/flipoff).

---

## How it works

- Runs silently in the background (no Dock icon)
- Activates after **1 minute** of inactivity
- Any mouse movement or keypress dismisses it
- Rotates through 40 design quotes on a split-flap board

---

## Installation

### Requirements

- macOS 13 or later
- Xcode Command Line Tools: `xcode-select --install`

### Steps

**1. Clone the repo**

```bash
git clone https://github.com/ChrisPiz/split-flap-screensaver.git
cd split-flap-screensaver
```

**2. Create the app bundle**

```bash
mkdir -p SplitFlapSaver.app/Contents/MacOS
mkdir -p SplitFlapSaver.app/Contents/Resources/htdocs
cp index.html SplitFlapSaver.app/Contents/Resources/htdocs/index.html
```

```bash
cat > SplitFlapSaver.app/Contents/Info.plist << 'EOF'
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
EOF
```

**3. Add the app logic** — save this as `main.swift`:

```swift
import AppKit
import WebKit

let IDLE_SECONDS: TimeInterval = 60

class SplitFlapApp: NSObject, NSApplicationDelegate {
    var screenWindow: NSWindow?
    var webView: WKWebView?
    var idleTimer: Timer?
    var globalMonitor: Any?
    var localMonitor: Any?
    var isShowing = false

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        startIdleMonitor()
    }

    func startIdleMonitor() {
        idleTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { [weak self] _ in
            guard let self, !self.isShowing else { return }
            let idle = CGEventSource.secondsSinceLastEventType(
                .combinedSessionState,
                eventType: CGEventType(rawValue: UInt32.max)!
            )
            if idle >= IDLE_SECONDS { self.show() }
        }
    }

    func show() {
        guard !isShowing else { return }
        isShowing = true
        let screen = NSScreen.main ?? NSScreen.screens[0]
        let win = NSWindow(contentRect: screen.frame, styleMask: .borderless, backing: .buffered, defer: false)
        win.level = .screenSaver
        win.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        win.backgroundColor = .black
        win.isOpaque = true
        win.acceptsMouseMovedEvents = true
        let config = WKWebViewConfiguration()
        let wv = WKWebView(frame: win.contentView!.bounds, configuration: config)
        wv.autoresizingMask = [.width, .height]
        let bundle = Bundle.main
        if let url = bundle.url(forResource: "index", withExtension: "html", subdirectory: "htdocs"),
           let html = try? String(contentsOf: url, encoding: .utf8) {
            wv.loadHTMLString(html, baseURL: url.deletingLastPathComponent())
        }
        win.contentView?.addSubview(wv)
        win.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        self.screenWindow = win
        self.webView = wv
        let mask: NSEvent.EventTypeMask = [.mouseMoved, .keyDown, .leftMouseDown, .rightMouseDown, .otherMouseDown, .scrollWheel, .gesture]
        localMonitor = NSEvent.addLocalMonitorForEvents(matching: mask) { [weak self] e in self?.hide(); return e }
        globalMonitor = NSEvent.addGlobalMonitorForEvents(matching: mask) { [weak self] _ in self?.hide() }
    }

    func hide() {
        guard isShowing else { return }
        isShowing = false
        if let m = localMonitor  { NSEvent.removeMonitor(m); localMonitor = nil }
        if let m = globalMonitor { NSEvent.removeMonitor(m); globalMonitor = nil }
        screenWindow?.orderOut(nil)
        screenWindow = nil
        webView = nil
    }
}

let app = NSApplication.shared
let delegate = SplitFlapApp()
app.delegate = delegate
app.run()
```

**4. Compile and install**

```bash
swiftc -framework AppKit -framework WebKit main.swift \
  -o SplitFlapSaver.app/Contents/MacOS/SplitFlapSaver

codesign --force --deep --sign - SplitFlapSaver.app
xattr -r -d com.apple.quarantine SplitFlapSaver.app

cp -r SplitFlapSaver.app ~/Applications/
open ~/Applications/SplitFlapSaver.app
```

**5. Auto-start on login**

System Settings → General → Login Items → **+** → select `SplitFlapSaver.app`

---

## Customizing quotes

Edit `messages.md` and rebuild. Format: one message per block separated by `---`, max **22 characters** per line, max **3 lines** per message.

```
DESIGN IS THINKING
MADE VISUAL
- SAUL BASS

---

LESS IS MORE

- MIES VAN DER ROHE
```

---

## Credits

Built on top of [FlipOff](https://github.com/magnum6actual/flipoff) — a split-flap display web app.
