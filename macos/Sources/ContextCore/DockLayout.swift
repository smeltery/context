/// Which screen edge the dock clings to.
public enum DockEdge: String, Codable, Sendable, CaseIterable {
  case left
  case right

  public var opposite: DockEdge { self == .left ? .right : .left }
}

/// A cell's placement inside the panel, measured from the top of the panel down.
public struct DockCellFrame: Sendable, Equatable {
  public let itemID: String
  public let kind: DockItemKind
  /// Distance from the panel's top edge to the top of the cell.
  public let top: Double
  public let height: Double

  public init(itemID: String, kind: DockItemKind, top: Double, height: Double) {
    self.itemID = itemID
    self.kind = kind
    self.top = top
    self.height = height
  }

  public var bottom: Double { top + height }
  public var midY: Double { top + height / 2 }
}

/// Pure layout math for the dock panel.
public enum DockLayout {
  /// Stacked height of every cell plus the panel's vertical padding.
  public static func panelHeight(for items: [DockItem]) -> Double {
    let content = items.reduce(0.0) { $0 + DockMetrics.cellHeight(for: $1.kind) }
    return content + DockMetrics.panelPadding * 2
  }

  public static func panelSize(for items: [DockItem]) -> DockSize {
    DockSize(width: DockMetrics.panelWidth, height: panelHeight(for: items))
  }

  /// Cell placements in draw order, top-down from the panel's top edge.
  public static func cellFrames(for items: [DockItem]) -> [DockCellFrame] {
    var top = DockMetrics.panelPadding
    return items.map { item in
      let height = DockMetrics.cellHeight(for: item.kind)
      defer { top += height }
      return DockCellFrame(itemID: item.id, kind: item.kind, top: top, height: height)
    }
  }

  /// Where the panel window sits on a screen, in AppKit's bottom-left coordinates.
  ///
  /// When `revealed` is false the panel slides off the edge, leaving
  /// `DockMetrics.peekWidth` on screen so the user can find it again.
  public static func panelFrame(
    panelSize: DockSize,
    screen: DockRect,
    edge: DockEdge,
    revealed: Bool = true
  ) -> DockRect {
    let y = screen.midY - panelSize.height / 2
    let x: Double
    switch edge {
    case .right:
      x = revealed
        ? screen.maxX - DockMetrics.screenGap - panelSize.width
        : screen.maxX - DockMetrics.peekWidth
    case .left:
      x = revealed
        ? screen.minX + DockMetrics.screenGap
        : screen.minX + DockMetrics.peekWidth - panelSize.width
    }
    return DockRect(origin: DockPoint(x: x, y: y), size: panelSize)
  }

  /// The strip near the screen edge that reveals a hidden dock on hover.
  ///
  /// It spans the panel's own vertical extent so the pointer only wakes the
  /// dock where the dock actually is.
  public static func revealZone(
    panelSize: DockSize,
    screen: DockRect,
    edge: DockEdge
  ) -> DockRect {
    let frame = panelFrame(panelSize: panelSize, screen: screen, edge: edge, revealed: false)
    let width = DockMetrics.peekWidth + DockMetrics.revealTriggerWidth
    let x = edge == .right ? screen.maxX - width : screen.minX
    return DockRect(
      origin: DockPoint(x: x, y: frame.minY),
      size: DockSize(width: width, height: frame.height)
    )
  }

  /// Anchor rect for a card presented beside a cell, in the panel's flipped
  /// (top-left origin) view coordinates.
  public static func cardAnchor(for cell: DockCellFrame) -> DockRect {
    DockRect(
      x: 0,
      y: cell.top,
      width: DockMetrics.panelWidth,
      height: cell.height
    )
  }
}
