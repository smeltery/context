import ContextCore
import SwiftUI

/// The panel: a rounded slab with one cell per dock item.
struct DockView: View {
  @ObservedObject var model: DockModel

  var body: some View {
    let palette = model.palette
    VStack(spacing: 0) {
      ForEach(model.items) { item in
        DockCellView(item: item, model: model, palette: palette)
      }
    }
    .padding(.vertical, DockMetrics.panelPadding)
    .frame(width: DockMetrics.panelWidth)
    .background(panel(palette))
    .colorScheme(palette == .dark ? .dark : .light)
  }

  private func panel(_ palette: DockPalette) -> some View {
    let shape = RoundedRectangle(cornerRadius: DockMetrics.cornerRadius, style: .continuous)
    return shape
      .fill(Color(palette.panel))
      .overlay(shape.strokeBorder(Color(palette.rim), lineWidth: DockMetrics.rimWidth))
      .overlay(
        shape
          .inset(by: -0.5)
          .strokeBorder(Color(palette.edge), lineWidth: 0.5)
      )
  }
}

/// The hairline separator between groups of cells.
struct DockDividerView: View {
  let palette: DockPalette

  var body: some View {
    Color(palette.hairline)
      .frame(width: DockMetrics.dividerWidth, height: DockMetrics.dividerThickness)
      .padding(.vertical, DockMetrics.dividerSpacing)
  }
}
