/// Dock geometry in points, mirroring the marketing dock CSS where `1em == 1pt`.
///
/// These values are the single source of truth shared by the SwiftUI dock view,
/// window placement, and the smoke checks.
public enum DockMetrics {
  /// Width of the panel itself, excluding the screen gap.
  public static let panelWidth: Double = 66
  /// Height of a standard icon cell.
  public static let cellHeight: Double = 54
  /// Glyph / favicon box inside a cell.
  public static let iconSize: Double = 44
  /// App icons ship their own transparent margin, so they are drawn slightly larger.
  public static let appIconSize: Double = 50
  /// Vertical breathing room at the top and bottom of the panel.
  public static let panelPadding: Double = 7
  public static let cornerRadius: Double = 22
  /// Inner white rim drawn just inside the panel edge.
  public static let rimWidth: Double = 1

  /// Running-app indicator on the trailing edge of a cell.
  public static let runningDotDiameter: Double = 4
  public static let runningDotInset: Double = 2

  public static let dividerWidth: Double = 50
  public static let dividerThickness: Double = 1
  /// Space above and below a divider hairline.
  public static let dividerSpacing: Double = 7

  /// Stats cells stack two metrics and size themselves.
  public static let statsCellHeight: Double = 80
  public static let statsContentWidth: Double = 39.6

  /// Subtle magnification when the pointer is over a cell.
  public static let hoverScale: Double = 1.06
  /// Corner radius of the hover highlight behind a cell.
  public static let cellHighlightRadius: Double = 12

  /// Gap between the panel and the screen edge when revealed.
  public static let screenGap: Double = 12
  /// Sliver of the panel left on screen while auto-hidden.
  public static let peekWidth: Double = 4
  /// How close to the screen edge the pointer must be to trigger a reveal.
  public static let revealTriggerWidth: Double = 8

  /// Badge bubble used by the clipboard widget.
  public static let badgeHeight: Double = 17
  public static let badgeFontSize: Double = 10

  /// Width of the clipboard card shown beside the dock.
  public static let cardWidth: Double = 300

  /// Height a cell occupies for a given item kind.
  public static func cellHeight(for kind: DockItemKind) -> Double {
    switch kind {
    case .divider:
      return dividerThickness + dividerSpacing * 2
    case .stats:
      return statsCellHeight
    case .app, .link, .clipboard, .weather, .settings:
      return cellHeight
    }
  }

  /// Icon box for a given item kind.
  public static func iconSize(for kind: DockItemKind) -> Double {
    kind == .app ? appIconSize : iconSize
  }
}
