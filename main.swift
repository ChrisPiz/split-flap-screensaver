import AppKit
import WebKit

let IDLE_SECONDS: TimeInterval = 300

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
        let win = NSWindow(
            contentRect: screen.frame,
            styleMask: .borderless,
            backing: .buffered,
            defer: false
        )
        win.level = .screenSaver
        win.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        win.backgroundColor = .black
        win.isOpaque = true
        win.acceptsMouseMovedEvents = true

        let config = WKWebViewConfiguration()
        config.mediaTypesRequiringUserActionForPlayback = []
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

        // Monitor local: eventos dentro de nuestra ventana
        let dismissMask: NSEvent.EventTypeMask = [
            .mouseMoved, .keyDown, .leftMouseDown, .rightMouseDown,
            .otherMouseDown, .scrollWheel, .gesture
        ]
        localMonitor = NSEvent.addLocalMonitorForEvents(matching: dismissMask) { [weak self] event in
            self?.hide()
            return event
        }

        // Monitor global: eventos fuera de nuestra ventana
        globalMonitor = NSEvent.addGlobalMonitorForEvents(matching: dismissMask) { [weak self] _ in
            self?.hide()
        }
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
