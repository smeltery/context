import XCTest

@testable import ContextCore

final class DockLayoutTests: XCTestCase {
  private let items: [DockItem] = [
    .app("safari", title: "Safari", bundleID: "com.apple.Safari"),
    .divider("d1"),
    DockItem(id: "stats", kind: .stats, title: "Stats"),
  ]

  func testPanelHeightSumsCellsAndPadding() {
    let expected =
      DockMetrics.cellHeight
      + DockMetrics.cellHeight(for: .divider)
      + DockMetrics.statsCellHeight
      + DockMetrics.panelPadding * 2
    XCTAssertEqual(DockLayout.panelHeight(for: items), expected)
    XCTAssertEqual(DockLayout.panelSize(for: items).width, DockMetrics.panelWidth)
  }

  func testCellFramesStackContiguouslyInsidePadding() {
    let frames = DockLayout.cellFrames(for: items)
    XCTAssertEqual(frames.map(\.itemID), ["safari", "d1", "stats"])
    XCTAssertEqual(frames[0].top, DockMetrics.panelPadding)
    for (previous, next) in zip(frames, frames.dropFirst()) {
      XCTAssertEqual(previous.bottom, next.top)
    }
    let height = DockLayout.panelHeight(for: items)
    XCTAssertEqual(frames[2].bottom, height - DockMetrics.panelPadding)
  }

  func testPanelFrameHugsTheChosenEdgeAndCentersVertically() {
    let screen = DockRect(x: 0, y: 0, width: 1440, height: 900)
    let size = DockLayout.panelSize(for: items)

    let right = DockLayout.panelFrame(panelSize: size, screen: screen, edge: .right)
    XCTAssertEqual(right.maxX, screen.maxX - DockMetrics.screenGap)
    XCTAssertEqual(right.midY, screen.midY)

    let left = DockLayout.panelFrame(panelSize: size, screen: screen, edge: .left)
    XCTAssertEqual(left.minX, screen.minX + DockMetrics.screenGap)
    XCTAssertEqual(left.midY, screen.midY)
  }

  func testHiddenPanelLeavesOnlyAPeekOnScreen() {
    let screen = DockRect(x: 0, y: 0, width: 1440, height: 900)
    let size = DockLayout.panelSize(for: items)

    let right = DockLayout.panelFrame(
      panelSize: size, screen: screen, edge: .right, revealed: false
    )
    XCTAssertEqual(screen.maxX - right.minX, DockMetrics.peekWidth)

    let left = DockLayout.panelFrame(
      panelSize: size, screen: screen, edge: .left, revealed: false
    )
    XCTAssertEqual(left.maxX - screen.minX, DockMetrics.peekWidth)
  }

  func testRevealZoneCoversTheEdgeStripBesideThePanel() {
    let screen = DockRect(x: 0, y: 0, width: 1440, height: 900)
    let size = DockLayout.panelSize(for: items)
    let zone = DockLayout.revealZone(panelSize: size, screen: screen, edge: .right)

    XCTAssertEqual(zone.maxX, screen.maxX)
    XCTAssertEqual(zone.height, size.height)
    XCTAssertTrue(zone.contains(DockPoint(x: screen.maxX - 1, y: screen.midY)))
    XCTAssertFalse(zone.contains(DockPoint(x: screen.midX, y: screen.midY)))
    XCTAssertFalse(zone.contains(DockPoint(x: screen.maxX - 1, y: screen.maxY)))
  }
}
