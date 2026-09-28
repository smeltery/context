import ContextCore
import Foundation

/// Backs clipboard history and settings with `UserDefaults` JSON blobs.
final class DefaultsStorage: ClipboardStorage, DockSettingsStorage {
  private enum Key {
    static let clipboard = "context.clipboard.entries"
    static let settings = "context.dock.settings"
  }

  private let defaults: UserDefaults
  private let encoder = JSONEncoder()
  private let decoder = JSONDecoder()

  init(defaults: UserDefaults = .standard) {
    self.defaults = defaults
  }

  func loadEntries() -> [ClipboardEntry] {
    decode([ClipboardEntry].self, forKey: Key.clipboard) ?? []
  }

  func saveEntries(_ entries: [ClipboardEntry]) {
    encode(entries, forKey: Key.clipboard)
  }

  func loadSettings() -> DockSettings? {
    decode(DockSettings.self, forKey: Key.settings)
  }

  func saveSettings(_ settings: DockSettings) {
    encode(settings, forKey: Key.settings)
  }

  private func decode<T: Decodable>(_ type: T.Type, forKey key: String) -> T? {
    guard let data = defaults.data(forKey: key) else { return nil }
    return try? decoder.decode(type, from: data)
  }

  private func encode<T: Encodable>(_ value: T, forKey key: String) {
    guard let data = try? encoder.encode(value) else { return }
    defaults.set(data, forKey: key)
  }
}
