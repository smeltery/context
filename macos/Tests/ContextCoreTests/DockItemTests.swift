import Foundation
import XCTest

@testable import ContextCore

final class DockItemTests: XCTestCase {
  func testRoundTripsThroughJSON() throws {
    let items = DockItem.starterItems
    let data = try JSONEncoder().encode(items)
    let decoded = try JSONDecoder().decode([DockItem].self, from: data)
    XCTAssertEqual(decoded, items)
  }

  func testStarterDockHasAppsALinkAndTheWidgets() {
    let kinds = DockItem.starterItems.map(\.kind)
    XCTAssertEqual(kinds.filter { $0 == .app }.count, 3)
    XCTAssertEqual(kinds.filter { $0 == .divider }.count, 2)
    for widget in [DockItemKind.link, .clipboard, .weather, .stats, .settings] {
      XCTAssertTrue(kinds.contains(widget), "missing \(widget.rawValue)")
    }
  }

  func testIDsAreUniqueAndAppsCarryBundleIdentifiers() {
    let items = DockItem.starterItems
    XCTAssertEqual(Set(items.map(\.id)).count, items.count)
    for item in items where item.kind == .app {
      XCTAssertNotNil(item.target, "\(item.id) needs a bundle identifier")
    }
    for item in items where item.kind == .link {
      guard let target = item.target else { return XCTFail("\(item.id) needs a URL") }
      XCTAssertNotNil(URL(string: target)?.scheme)
    }
  }

  func testOnlyDividersAreNonInteractive() {
    for kind in DockItemKind.allCases {
      XCTAssertEqual(kind.isInteractive, kind != .divider)
    }
  }
}
