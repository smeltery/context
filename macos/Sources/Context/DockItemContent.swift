import ContextCore
import SwiftUI

/// Picks the artwork for a cell: app icon, link glyph, or a live widget.
struct DockItemContent: View {
  let item: DockItem
  @ObservedObject var model: DockModel
  let palette: DockPalette

  var body: some View {
    switch item.kind {
    case .app:
      appIcon
    case .link, .settings:
      symbolGlyph
    case .clipboard:
      ClipboardWidgetView(count: model.clipboardEntries.count, palette: palette)
    case .weather:
      WeatherWidgetView(weather: model.weather, palette: palette)
    case .stats:
      StatsWidgetView(load: model.load, palette: palette)
    case .divider:
      EmptyView()
    }
  }

  @ViewBuilder
  private var appIcon: some View {
    if let bundleID = item.target, let icon = AppLauncher.icon(bundleID: bundleID) {
      Image(nsImage: icon)
        .resizable()
        .frame(width: DockMetrics.appIconSize, height: DockMetrics.appIconSize)
    } else {
      symbolGlyph
    }
  }

  private var symbolGlyph: some View {
    Image(systemName: item.symbol ?? "square.dashed")
      .font(.system(size: 21, weight: .medium))
      .foregroundStyle(Color(palette.ink))
      .frame(width: DockMetrics.iconSize, height: DockMetrics.iconSize)
  }
}
