import Foundation

/// User preferences for the dock, persisted as JSON.
public struct DockSettings: Codable, Sendable, Equatable {
  /// Screen edge the panel clings to.
  public var edge: DockEdge
  /// Slide the panel off-edge until the pointer approaches.
  public var autoHide: Bool
  public var theme: DockTheme
  /// Seconds between pasteboard polls.
  public var clipboardPollInterval: Double
  /// Seconds between CPU / memory samples.
  public var statsPollInterval: Double

  public init(
    edge: DockEdge = .right,
    autoHide: Bool = false,
    theme: DockTheme = .system,
    clipboardPollInterval: Double = 0.8,
    statsPollInterval: Double = 2.0
  ) {
    self.edge = edge
    self.autoHide = autoHide
    self.theme = theme
    self.clipboardPollInterval = clipboardPollInterval
    self.statsPollInterval = statsPollInterval
  }

  public static let `default` = DockSettings()
}

/// Reads and writes `DockSettings`; the app backs this with `UserDefaults`.
public protocol DockSettingsStorage: AnyObject {
  func loadSettings() -> DockSettings?
  func saveSettings(_ settings: DockSettings)
}

/// In-memory settings storage for tests and smoke checks.
public final class InMemorySettingsStorage: DockSettingsStorage {
  private var stored: DockSettings?

  public init(initial: DockSettings? = nil) {
    self.stored = initial
  }

  public func loadSettings() -> DockSettings? { stored }

  public func saveSettings(_ settings: DockSettings) { stored = settings }
}
