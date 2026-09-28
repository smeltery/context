import AppKit
import SwiftUI

/// Lazily creates and focuses the preferences window.
@MainActor
final class SettingsWindowController {
  private let model: DockModel
  private var window: NSWindow?

  init(model: DockModel) {
    self.model = model
  }

  func show() {
    let window = self.window ?? makeWindow()
    self.window = window
    NSApp.activate(ignoringOtherApps: true)
    window.center()
    window.makeKeyAndOrderFront(nil)
  }

  private func makeWindow() -> NSWindow {
    let controller = NSHostingController(rootView: SettingsView(model: model))
    let window = NSWindow(contentViewController: controller)
    window.title = "Context Settings"
    window.styleMask = [.titled, .closable, .miniaturizable]
    window.isReleasedWhenClosed = false
    window.level = .normal
    return window
  }
}
