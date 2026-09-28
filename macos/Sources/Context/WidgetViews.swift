import ContextCore
import SwiftUI

/// Clipboard tile with a badge for the number of stored entries.
struct ClipboardWidgetView: View {
  let count: Int
  let palette: DockPalette

  var body: some View {
    RoundedRectangle(cornerRadius: 10, style: .continuous)
      .fill(
        LinearGradient(
          colors: [Color(DockColor(hex: 0x3D8CFF)), Color(DockColor(hex: 0x1E63E9))],
          startPoint: .top,
          endPoint: .bottom
        )
      )
      .frame(width: DockMetrics.iconSize, height: DockMetrics.iconSize)
      .overlay(
        Image(systemName: "doc.on.clipboard.fill")
          .font(.system(size: 19, weight: .semibold))
          .foregroundStyle(.white)
      )
      .overlay(alignment: .bottomTrailing) { badge }
      .shadow(color: .black.opacity(0.18), radius: 2, y: 1)
  }

  @ViewBuilder
  private var badge: some View {
    if count > 0 {
      Text(count > 99 ? "99+" : "\(count)")
        .font(.system(size: DockMetrics.badgeFontSize, weight: .bold))
        .foregroundStyle(.white)
        .padding(.horizontal, 4.5)
        .frame(height: DockMetrics.badgeHeight)
        .background(Capsule().fill(Color.black.opacity(0.82)))
        .offset(x: 5, y: 5)
    }
  }
}

/// Sun glyph over a temperature readout.
struct WeatherWidgetView: View {
  let weather: WeatherStub
  let palette: DockPalette

  var body: some View {
    VStack(spacing: 1) {
      Image(systemName: weather.symbol)
        .font(.system(size: 19, weight: .medium))
        .foregroundStyle(Color(DockColor(hex: 0xFF9F0A)))
      Text(weather.label)
        .font(.system(size: 16, weight: .semibold, design: .rounded))
        .monospacedDigit()
        .foregroundStyle(Color(palette.ink))
    }
  }
}

/// CPU and memory percentages stacked in a taller cell.
struct StatsWidgetView: View {
  let load: SystemLoad
  let palette: DockPalette

  var body: some View {
    VStack(spacing: 5) {
      metric("CPU", value: load.cpuLabel)
      metric("MEM", value: load.memoryLabel)
    }
    .frame(width: DockMetrics.statsContentWidth)
  }

  private func metric(_ caption: String, value: String) -> some View {
    VStack(spacing: 0) {
      Text(caption)
        .font(.system(size: 8.7, weight: .semibold, design: .rounded))
        .foregroundStyle(Color(palette.secondaryInk))
      Text(value)
        .font(.system(size: 16.7, weight: .bold, design: .rounded))
        .monospacedDigit()
        .foregroundStyle(Color(palette.ink))
    }
  }
}
