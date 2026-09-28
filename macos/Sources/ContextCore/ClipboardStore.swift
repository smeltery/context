import Foundation

/// One captured pasteboard string.
public struct ClipboardEntry: Codable, Sendable, Equatable, Identifiable {
  public var id: UUID
  public var text: String
  public var capturedAt: Date

  public init(id: UUID = UUID(), text: String, capturedAt: Date = Date()) {
    self.id = id
    self.text = text
    self.capturedAt = capturedAt
  }

  /// Single-line preview for the clipboard card.
  public func preview(limit: Int = 80) -> String {
    let flattened = text
      .split(whereSeparator: \.isNewline)
      .joined(separator: " ")
      .trimmingCharacters(in: .whitespaces)
    guard flattened.count > limit else { return flattened }
    return flattened.prefix(limit).trimmingCharacters(in: .whitespaces) + "…"
  }
}

/// Persistence for clipboard history. The app backs this with `UserDefaults`.
public protocol ClipboardStorage: AnyObject {
  func loadEntries() -> [ClipboardEntry]
  func saveEntries(_ entries: [ClipboardEntry])
}

/// In-memory history for tests and smoke checks.
public final class InMemoryClipboardStorage: ClipboardStorage {
  private var entries: [ClipboardEntry]

  public init(entries: [ClipboardEntry] = []) {
    self.entries = entries
  }

  public func loadEntries() -> [ClipboardEntry] { entries }

  public func saveEntries(_ entries: [ClipboardEntry]) { self.entries = entries }
}

/// Newest-first pasteboard history, capped and de-duplicated.
public final class ClipboardStore {
  public static let defaultLimit = 50

  public private(set) var entries: [ClipboardEntry]

  private let storage: ClipboardStorage
  private let limit: Int

  public init(storage: ClipboardStorage, limit: Int = ClipboardStore.defaultLimit) {
    self.storage = storage
    self.limit = max(1, limit)
    self.entries = Array(storage.loadEntries().prefix(self.limit))
  }

  public var count: Int { entries.count }

  public var latest: ClipboardEntry? { entries.first }

  /// Records a pasteboard string, skipping blanks and promoting repeats.
  ///
  /// Returns `true` when the history changed.
  @discardableResult
  public func record(_ text: String, at date: Date = Date()) -> Bool {
    let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return false }
    if entries.first?.text == trimmed { return false }

    entries.removeAll { $0.text == trimmed }
    entries.insert(ClipboardEntry(text: trimmed, capturedAt: date), at: 0)
    if entries.count > limit {
      entries.removeLast(entries.count - limit)
    }
    storage.saveEntries(entries)
    return true
  }

  public func remove(id: UUID) {
    let before = entries.count
    entries.removeAll { $0.id == id }
    guard entries.count != before else { return }
    storage.saveEntries(entries)
  }

  public func clear() {
    guard !entries.isEmpty else { return }
    entries.removeAll()
    storage.saveEntries(entries)
  }
}
