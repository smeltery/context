/// An sRGB colour with straight alpha, expressed without importing AppKit.
public struct DockColor: Sendable, Equatable {
  public var red: Double
  public var green: Double
  public var blue: Double
  public var alpha: Double

  public init(red: Double, green: Double, blue: Double, alpha: Double = 1) {
    self.red = red
    self.green = green
    self.blue = blue
    self.alpha = alpha
  }

  /// `DockColor(hex: 0xECECEE)` — the same literals the marketing CSS uses.
  public init(hex: UInt32, alpha: Double = 1) {
    self.init(
      red: Double((hex >> 16) & 0xFF) / 255,
      green: Double((hex >> 8) & 0xFF) / 255,
      blue: Double(hex & 0xFF) / 255,
      alpha: alpha
    )
  }

  public func opacity(_ value: Double) -> DockColor {
    DockColor(red: red, green: green, blue: blue, alpha: value)
  }
}

/// Theme selection; `.system` follows the macOS appearance.
public enum DockTheme: String, Codable, Sendable, CaseIterable {
  case system
  case light
  case dark
}

/// The dock's colour set, matching the marketing CSS custom properties.
public struct DockPalette: Sendable, Equatable {
  /// Panel fill.
  public var panel: DockColor
  /// Inner rim drawn just inside the panel edge.
  public var rim: DockColor
  /// Outer hairline around the panel.
  public var edge: DockColor
  /// Primary text and glyphs.
  public var ink: DockColor
  /// Captions and muted glyphs.
  public var secondaryInk: DockColor
  /// Divider hairline.
  public var hairline: DockColor

  public init(
    panel: DockColor,
    rim: DockColor,
    edge: DockColor,
    ink: DockColor,
    secondaryInk: DockColor,
    hairline: DockColor
  ) {
    self.panel = panel
    self.rim = rim
    self.edge = edge
    self.ink = ink
    self.secondaryInk = secondaryInk
    self.hairline = hairline
  }

  public static let light = DockPalette(
    panel: DockColor(hex: 0xECECEE),
    rim: DockColor(hex: 0xFFFFFF, alpha: 0.95),
    edge: DockColor(hex: 0x000000, alpha: 0.10),
    ink: DockColor(hex: 0x1D1D1F),
    secondaryInk: DockColor(hex: 0x86868B),
    hairline: DockColor(hex: 0x1D1D1F, alpha: 0.22)
  )

  public static let dark = DockPalette(
    panel: DockColor(hex: 0x1C1C1E),
    rim: DockColor(hex: 0xFFFFFF, alpha: 0.10),
    edge: DockColor(hex: 0x000000, alpha: 0.60),
    ink: DockColor(hex: 0xF5F5F7),
    secondaryInk: DockColor(hex: 0x98989D),
    hairline: DockColor(hex: 0xF5F5F7, alpha: 0.22)
  )

  /// Resolves a theme against the current system appearance.
  public static func resolve(_ theme: DockTheme, systemIsDark: Bool) -> DockPalette {
    switch theme {
    case .light: return .light
    case .dark: return .dark
    case .system: return systemIsDark ? .dark : .light
    }
  }
}
