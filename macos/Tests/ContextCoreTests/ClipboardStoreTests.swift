import XCTest

@testable import ContextCore

final class ClipboardStoreTests: XCTestCase {
  func testSkipsBlanksAndConsecutiveRepeats() {
    let store = ClipboardStore(storage: InMemoryClipboardStorage())

    XCTAssertFalse(store.record(""))
    XCTAssertFalse(store.record("   \n\t "))
    XCTAssertTrue(store.record("  alpha  "))
    XCTAssertFalse(store.record("alpha"))
    XCTAssertEqual(store.count, 1)
    XCTAssertEqual(store.latest?.text, "alpha")
  }

  func testPromotesRepeatsAndEvictsPastTheLimit() {
    let store = ClipboardStore(storage: InMemoryClipboardStorage(), limit: 3)
    for text in ["one", "two", "three", "four"] {
      XCTAssertTrue(store.record(text))
    }

    XCTAssertEqual(store.entries.map(\.text), ["four", "three", "two"])

    XCTAssertTrue(store.record("two"))
    XCTAssertEqual(store.entries.map(\.text), ["two", "four", "three"])
    XCTAssertEqual(store.count, 3)
  }

  func testPersistsThroughStorageAndClears() {
    let storage = InMemoryClipboardStorage()
    let store = ClipboardStore(storage: storage)
    _ = store.record("kept")
    _ = store.record("also kept")

    let reloaded = ClipboardStore(storage: storage)
    XCTAssertEqual(reloaded.entries.map(\.text), ["also kept", "kept"])

    guard let first = reloaded.entries.first else { return XCTFail("expected an entry") }
    reloaded.remove(id: first.id)
    XCTAssertEqual(reloaded.entries.map(\.text), ["kept"])

    reloaded.clear()
    XCTAssertTrue(reloaded.entries.isEmpty)
    XCTAssertTrue(storage.loadEntries().isEmpty)
  }

  func testPreviewFlattensAndTruncates() {
    XCTAssertEqual(ClipboardEntry(text: "first\nsecond").preview(), "first second")
    XCTAssertEqual(ClipboardEntry(text: String(repeating: "x", count: 10)).preview(limit: 4), "xxxx…")
  }

  func testDefaultLimitIsFifty() {
    XCTAssertEqual(ClipboardStore.defaultLimit, 50)

    let store = ClipboardStore(storage: InMemoryClipboardStorage())
    for index in 0..<60 {
      _ = store.record("entry \(index)")
    }
    XCTAssertEqual(store.count, 50)
    XCTAssertEqual(store.latest?.text, "entry 59")
  }
}
