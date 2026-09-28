import ContextCore
import Foundation

/// Lightweight assertions so ContextCore can be verified without Xcode/XCTest.
@main
enum ContextCoreSmoke {
  static func main() {
    var failures = 0

    func check(_ name: String, _ ok: Bool) {
      if ok {
        print("ok   \(name)")
      } else {
        print("FAIL \(name)")
        failures += 1
      }
    }

    // Geometry must stay in step with the marketing dock CSS.
    check("panel width", DockMetrics.panelWidth == 66)
    check("cell height", DockMetrics.cellHeight == 54)
    check("icon size", DockMetrics.iconSize == 44)
    check("app icon size", DockMetrics.appIconSize == 50)
    check("panel padding", DockMetrics.panelPadding == 7)
    check("corner radius", DockMetrics.cornerRadius == 22)
    check("running dot", DockMetrics.runningDotDiameter == 4)
    check("divider width", DockMetrics.dividerWidth == 50)
    check("divider hairline", DockMetrics.dividerThickness == 1)
    check("hover scale", DockMetrics.hoverScale == 1.06)
    check("divider cell height", DockMetrics.cellHeight(for: .divider) == 15)
    check("app icon sizing", DockMetrics.iconSize(for: .app) == 50)
    check("link icon sizing", DockMetrics.iconSize(for: .link) == 44)

    // Palette matches the CSS custom properties.
    check("light panel", DockPalette.light.panel == DockColor(hex: 0xECECEE))
    check("dark panel", DockPalette.dark.panel == DockColor(hex: 0x1C1C1E))
    check("ink", DockPalette.light.ink == DockColor(hex: 0x1D1D1F))
    check("secondary ink", DockPalette.light.secondaryInk == DockColor(hex: 0x86868B))
    check("theme follows system", DockPalette.resolve(.system, systemIsDark: true) == .dark)

    // Layout stacking and edge placement.
    let items: [DockItem] = [
      .app("safari", title: "Safari", bundleID: "com.apple.Safari"),
      .divider("d1"),
      DockItem(id: "clipboard", kind: .clipboard, title: "Clipboard"),
    ]
    let size = DockLayout.panelSize(for: items)
    check("panel size width", size.width == 66)
    check("panel size height", size.height == 54 + 15 + 54 + 14)

    let frames = DockLayout.cellFrames(for: items)
    check("frame count", frames.count == 3)
    check("first frame top", frames.first?.top == 7)
    check("second frame top", frames.count > 1 && frames[1].top == 61)
    check("frames are contiguous", frames.last?.bottom == size.height - 7)

    let screen = DockRect(x: 0, y: 0, width: 1440, height: 900)
    let right = DockLayout.panelFrame(panelSize: size, screen: screen, edge: .right)
    check("right edge x", right.maxX == 1440 - DockMetrics.screenGap)
    check("vertically centred", right.midY == screen.midY)

    let hidden = DockLayout.panelFrame(
      panelSize: size, screen: screen, edge: .right, revealed: false
    )
    check("hidden peeks", hidden.maxX - screen.maxX == size.width - DockMetrics.peekWidth)

    let left = DockLayout.panelFrame(panelSize: size, screen: screen, edge: .left)
    check("left edge x", left.minX == DockMetrics.screenGap)

    let zone = DockLayout.revealZone(panelSize: size, screen: screen, edge: .right)
    check("reveal zone touches edge", zone.maxX == screen.maxX)
    check("reveal zone hit", zone.contains(DockPoint(x: 1438, y: screen.midY)))
    check("reveal zone miss", !zone.contains(DockPoint(x: 900, y: screen.midY)))

    // DockItem round-trip.
    let encoder = JSONEncoder()
    let decoder = JSONDecoder()
    let original = DockItem.link("gh", title: "GitHub", url: "https://github.com", symbol: "link")
    if let data = try? encoder.encode(original),
      let decoded = try? decoder.decode(DockItem.self, from: data)
    {
      check("item round-trip", decoded == original)
    } else {
      check("item round-trip", false)
    }
    check("starter items", DockItem.starterItems.count == 10)
    check("divider not interactive", !DockItemKind.divider.isInteractive)

    // Settings round-trip.
    let settings = DockSettings(edge: .left, autoHide: true, theme: .dark)
    if let data = try? encoder.encode(settings),
      let decoded = try? decoder.decode(DockSettings.self, from: data)
    {
      check("settings round-trip", decoded == settings)
    } else {
      check("settings round-trip", false)
    }

    // Clipboard store basics.
    let storage = InMemoryClipboardStorage()
    let store = ClipboardStore(storage: storage, limit: 3)
    check("skips empty", !store.record("   \n "))
    check("records text", store.record("alpha"))
    check("skips repeat", !store.record("alpha"))
    _ = store.record("beta")
    _ = store.record("gamma")
    _ = store.record("delta")
    check("respects limit", store.count == 3)
    check("newest first", store.latest?.text == "delta")
    check("evicts oldest", !store.entries.contains { $0.text == "alpha" })
    _ = store.record("beta")
    check("promotes repeat", store.latest?.text == "beta" && store.count == 3)
    check("persists", storage.loadEntries().count == 3)
    check("reloads", ClipboardStore(storage: storage, limit: 3).count == 3)
    store.clear()
    check("clears", store.count == 0 && storage.loadEntries().isEmpty)
    check("preview trims", ClipboardEntry(text: "a\nb").preview() == "a b")

    // Load math.
    let first = CPUTicks(user: 100, system: 50, idle: 850, nice: 0)
    let second = CPUTicks(user: 200, system: 100, idle: 1700, nice: 0)
    check("cpu percent", cpuPercent(from: first, to: second) == 15)
    check("cpu first sample", cpuPercent(from: second, to: second) == 0)
    check("memory percent", memoryPercent(usedBytes: 4, totalBytes: 16) == 25)
    check("memory guards zero", memoryPercent(usedBytes: 4, totalBytes: 0) == 0)
    check("formats percent", SystemLoad(cpuPercent: 42.4).cpuLabel == "42")
    check("clamps percent", SystemLoad.clampPercent(140) == 100)

    if failures > 0 {
      print("\(failures) failure(s)")
      exit(1)
    }
    print("all smoke checks passed")
  }
}
