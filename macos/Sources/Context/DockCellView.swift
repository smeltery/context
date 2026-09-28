import ContextCore
import SwiftUI

/// One dock row: artwork, hover magnification, and the running-app dot.
struct DockCellView: View {
  let item: DockItem
  @ObservedObject var model: DockModel
  let palette: DockPalette

  private var isHovering: Bool { model.hoveredItemID == item.id }

  var body: some View {
    if item.kind == .divider {
      DockDividerView(palette: palette)
    } else {
      content
    }
  }

  private var content: some View {
    DockItemContent(item: item, model: model, palette: palette)
      .frame(
        width: DockMetrics.panelWidth,
        height: DockMetrics.cellHeight(for: item.kind)
      )
      .background(highlight)
      .overlay(alignment: .trailing) { runningDot }
      .scaleEffect(isHovering ? DockMetrics.hoverScale : 1)
      .animation(.spring(response: 0.22, dampingFraction: 0.7), value: isHovering)
      .contentShape(Rectangle())
      .onHover { model.setHover($0, on: item) }
      .onTapGesture { model.activate(item) }
      .help(item.title)
      .accessibilityLabel(item.title)
  }

  @ViewBuilder
  private var highlight: some View {
    if isHovering {
      RoundedRectangle(cornerRadius: DockMetrics.cellHighlightRadius, style: .continuous)
        .fill(Color(palette.ink.opacity(0.06)))
        .padding(.horizontal, 5)
        .padding(.vertical, 2)
    }
  }

  @ViewBuilder
  private var runningDot: some View {
    if model.isRunning(item) {
      Circle()
        .fill(Color(palette.ink.opacity(0.9)))
        .frame(
          width: DockMetrics.runningDotDiameter,
          height: DockMetrics.runningDotDiameter
        )
        .padding(.trailing, DockMetrics.runningDotInset)
    }
  }
}
