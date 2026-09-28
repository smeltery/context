/// Minimal geometry primitives so layout math stays free of AppKit/CoreGraphics
/// and remains testable on any platform.
public struct DockSize: Sendable, Equatable {
  public var width: Double
  public var height: Double

  public init(width: Double, height: Double) {
    self.width = width
    self.height = height
  }

  public static let zero = DockSize(width: 0, height: 0)
}

public struct DockPoint: Sendable, Equatable {
  public var x: Double
  public var y: Double

  public init(x: Double, y: Double) {
    self.x = x
    self.y = y
  }

  public static let zero = DockPoint(x: 0, y: 0)
}

/// Bottom-left origin, matching AppKit screen coordinates.
public struct DockRect: Sendable, Equatable {
  public var origin: DockPoint
  public var size: DockSize

  public init(origin: DockPoint, size: DockSize) {
    self.origin = origin
    self.size = size
  }

  public init(x: Double, y: Double, width: Double, height: Double) {
    self.init(origin: DockPoint(x: x, y: y), size: DockSize(width: width, height: height))
  }

  public var minX: Double { origin.x }
  public var minY: Double { origin.y }
  public var maxX: Double { origin.x + size.width }
  public var maxY: Double { origin.y + size.height }
  public var midX: Double { origin.x + size.width / 2 }
  public var midY: Double { origin.y + size.height / 2 }
  public var width: Double { size.width }
  public var height: Double { size.height }

  public func contains(_ point: DockPoint) -> Bool {
    point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
  }

  /// Grows the rect by `amount` on every side.
  public func inset(by amount: Double) -> DockRect {
    DockRect(
      x: minX + amount,
      y: minY + amount,
      width: max(0, width - amount * 2),
      height: max(0, height - amount * 2)
    )
  }

  public static let zero = DockRect(x: 0, y: 0, width: 0, height: 0)
}
