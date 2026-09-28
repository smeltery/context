import ContextCore
import SwiftUI

extension CGRect {
  init(_ rect: DockRect) {
    self.init(x: rect.minX, y: rect.minY, width: rect.width, height: rect.height)
  }
}

extension CGSize {
  init(_ size: DockSize) {
    self.init(width: size.width, height: size.height)
  }
}

extension DockRect {
  init(_ rect: CGRect) {
    self.init(x: rect.minX, y: rect.minY, width: rect.width, height: rect.height)
  }
}

extension DockPoint {
  init(_ point: CGPoint) {
    self.init(x: point.x, y: point.y)
  }
}

extension Color {
  init(_ color: DockColor) {
    self.init(
      .sRGB,
      red: color.red,
      green: color.green,
      blue: color.blue,
      opacity: color.alpha
    )
  }
}
