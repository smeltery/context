import AppKit
import ContextCore

/// Wires the storage, model, panel, and menu bar together at launch.
@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
  private let storage = DefaultsStorage()
  private var model: DockModel?
  private var dock: DockWindowController?
  private var settings: SettingsWindowController?
  private var statusItem: StatusItemController?

  func applicationDidFinishLaunching(_ notification: Notification) {
    let model = DockModel(
      clipboard: ClipboardStore(storage: storage),
      settingsStorage: storage
    )
    let dock = DockWindowController(model: model)
    let settings = SettingsWindowController(model: model)
    let statusItem = StatusItemController()

    dock.onOpenSettings = { settings.show() }
    statusItem.onToggleDock = { dock.toggle() }
    statusItem.onOpenSettings = { settings.show() }

    self.model = model
    self.dock = dock
    self.settings = settings
    self.statusItem = statusItem

    model.start()
    dock.show()
  }

  func applicationSupportsSecureRestorableState(_ app: NSApplication) -> Bool {
    true
  }
}
