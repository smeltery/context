/// What a dock cell renders and what happens when it is clicked.
public enum DockItemKind: String, Codable, Sendable, CaseIterable {
  /// Launches or focuses a local application by bundle identifier.
  case app
  /// Opens a URL in the default browser.
  case link
  /// Pasteboard history with a badge and a card.
  case clipboard
  /// Current conditions readout.
  case weather
  /// CPU / memory readout drawn directly in the cell.
  case stats
  /// Hairline separator; not interactive.
  case divider
  /// Opens the preferences window.
  case settings

  /// Divider cells are decoration and swallow no clicks.
  public var isInteractive: Bool { self != .divider }
}

/// One row in the dock.
public struct DockItem: Codable, Sendable, Equatable, Identifiable {
  public var id: String
  public var kind: DockItemKind
  public var title: String
  /// Bundle identifier for `.app`, absolute URL string for `.link`, otherwise `nil`.
  public var target: String?
  /// SF Symbol drawn when no artwork is available.
  public var symbol: String?

  public init(
    id: String,
    kind: DockItemKind,
    title: String,
    target: String? = nil,
    symbol: String? = nil
  ) {
    self.id = id
    self.kind = kind
    self.title = title
    self.target = target
    self.symbol = symbol
  }

  public static func app(_ id: String, title: String, bundleID: String) -> DockItem {
    DockItem(id: id, kind: .app, title: title, target: bundleID, symbol: "app.dashed")
  }

  public static func link(_ id: String, title: String, url: String, symbol: String) -> DockItem {
    DockItem(id: id, kind: .link, title: title, target: url, symbol: symbol)
  }

  public static func divider(_ id: String) -> DockItem {
    DockItem(id: id, kind: .divider, title: "")
  }
}

extension DockItem {
  /// The starter dock: a few apps, a link, the live widgets, and settings.
  public static let starterItems: [DockItem] = [
    .app("safari", title: "Safari", bundleID: "com.apple.Safari"),
    .app("finder", title: "Finder", bundleID: "com.apple.finder"),
    .app("terminal", title: "Terminal", bundleID: "com.apple.Terminal"),
    .link("github", title: "GitHub", url: "https://github.com", symbol: "chevron.left.forwardslash.chevron.right"),
    .divider("divider-widgets"),
    DockItem(id: "clipboard", kind: .clipboard, title: "Clipboard", symbol: "doc.on.clipboard.fill"),
    DockItem(id: "weather", kind: .weather, title: "Weather", symbol: "sun.max.fill"),
    DockItem(id: "stats", kind: .stats, title: "Stats", symbol: "gauge.with.dots.needle.50percent"),
    .divider("divider-settings"),
    DockItem(id: "settings", kind: .settings, title: "Settings", symbol: "gearshape.fill"),
  ]
}
