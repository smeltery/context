import AppKit
import Combine
import ContextCore
import Foundation

/// Side effects the dock view asks the window layer to perform.
enum DockAction: Equatable {
  case openSettings
  /// Show or hide the clipboard card next to the cell with this item id.
  case toggleClipboardCard(itemID: String)
}

/// Observable state behind the dock: items, settings, live widget readouts.
@MainActor
final class DockModel: ObservableObject {
  @Published private(set) var items: [DockItem]
  @Published private(set) var clipboardEntries: [ClipboardEntry] = []
  @Published private(set) var runningBundleIDs: Set<String> = []
  @Published private(set) var load = SystemLoad()
  /// Cell the pointer is over, driving the dock's magnification.
  @Published var hoveredItemID: String?
  /// Clipboard row the pointer is over, revealing its remove button.
  @Published var hoveredEntryID: UUID?
  @Published var settings: DockSettings {
    didSet {
      guard settings != oldValue else { return }
      settingsStorage.saveSettings(settings)
      restartPolling()
      onSettingsChange?(settings)
    }
  }

  /// Placeholder until a real forecast source is wired up.
  let weather = WeatherStub.current

  var onAction: ((DockAction) -> Void)?
  var onSettingsChange: ((DockSettings) -> Void)?

  private let clipboard: ClipboardStore
  private let settingsStorage: DockSettingsStorage
  private let pasteboard = PasteboardWatcher()
  private var statsTimer: Timer?
  private var previousTicks: CPUTicks?
  private var observers: [NSObjectProtocol] = []

  init(clipboard: ClipboardStore, settingsStorage: DockSettingsStorage) {
    self.clipboard = clipboard
    self.settingsStorage = settingsStorage
    self.settings = settingsStorage.loadSettings() ?? .default
    self.items = DockItem.starterItems
    self.clipboardEntries = clipboard.entries
  }

  var palette: DockPalette {
    DockPalette.resolve(settings.theme, systemIsDark: Self.systemIsDark)
  }

  var cellFrames: [DockCellFrame] { DockLayout.cellFrames(for: items) }

  var panelSize: DockSize { DockLayout.panelSize(for: items) }

  func start() {
    pasteboard.onCapture = { [weak self] text in self?.captureClipboard(text) }
    refreshRunningApps()
    observeWorkspace()
    restartPolling()
  }

  // MARK: - Interaction

  func activate(_ item: DockItem) {
    switch item.kind {
    case .app:
      if let bundleID = item.target { AppLauncher.openApp(bundleID: bundleID) }
    case .link:
      if let url = item.target { AppLauncher.openLink(url) }
    case .clipboard:
      onAction?(.toggleClipboardCard(itemID: item.id))
    case .settings:
      onAction?(.openSettings)
    case .weather, .stats, .divider:
      break
    }
  }

  func setHover(_ isHovering: Bool, on item: DockItem) {
    if isHovering {
      hoveredItemID = item.id
    } else if hoveredItemID == item.id {
      hoveredItemID = nil
    }
  }

  func setHover(_ isHovering: Bool, on entry: ClipboardEntry) {
    if isHovering {
      hoveredEntryID = entry.id
    } else if hoveredEntryID == entry.id {
      hoveredEntryID = nil
    }
  }

  func isRunning(_ item: DockItem) -> Bool {
    guard item.kind == .app, let bundleID = item.target else { return false }
    return runningBundleIDs.contains(bundleID)
  }

  // MARK: - Clipboard

  func copyToPasteboard(_ entry: ClipboardEntry) {
    let pasteboard = NSPasteboard.general
    pasteboard.clearContents()
    pasteboard.setString(entry.text, forType: .string)
  }

  func removeClipboardEntry(_ entry: ClipboardEntry) {
    clipboard.remove(id: entry.id)
    clipboardEntries = clipboard.entries
  }

  func clearClipboard() {
    clipboard.clear()
    clipboardEntries = clipboard.entries
  }

  private func captureClipboard(_ text: String) {
    guard clipboard.record(text) else { return }
    clipboardEntries = clipboard.entries
  }

  // MARK: - Polling

  private func restartPolling() {
    pasteboard.start(interval: settings.clipboardPollInterval)
    statsTimer?.invalidate()
    let interval = max(0.5, settings.statsPollInterval)
    let timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
      MainActor.assumeIsolated { self?.sampleLoad() }
    }
    timer.tolerance = interval / 4
    RunLoop.main.add(timer, forMode: .common)
    statsTimer = timer
    sampleLoad()
  }

  private func sampleLoad() {
    var next = load
    if let ticks = SystemStatsReader.cpuTicks() {
      if let previous = previousTicks {
        next.cpuPercent = cpuPercent(from: previous, to: ticks)
      }
      previousTicks = ticks
    }
    if let memory = SystemStatsReader.memoryUsage() {
      next.memoryPercent = memoryPercent(usedBytes: memory.used, totalBytes: memory.total)
    }
    guard next != load else { return }
    load = next
  }

  private func refreshRunningApps() {
    let ids = AppLauncher.runningBundleIDs()
    guard ids != runningBundleIDs else { return }
    runningBundleIDs = ids
  }

  private func observeWorkspace() {
    let center = NSWorkspace.shared.notificationCenter
    let names: [Notification.Name] = [
      NSWorkspace.didLaunchApplicationNotification,
      NSWorkspace.didTerminateApplicationNotification,
    ]
    observers = names.map { name in
      center.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
        MainActor.assumeIsolated { self?.refreshRunningApps() }
      }
    }
  }

  private static var systemIsDark: Bool {
    NSApp.effectiveAppearance.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua
  }
}
