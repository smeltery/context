import AppKit

/// Menu bar entry with the few controls that live outside the dock itself.
@MainActor
final class StatusItemController {
  var onToggleDock: (() -> Void)?
  var onOpenSettings: (() -> Void)?

  private let statusItem: NSStatusItem

  init() {
    statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
    statusItem.button?.image = NSImage(
      systemSymbolName: "sidebar.trailing",
      accessibilityDescription: "Context"
    )
    statusItem.button?.toolTip = "Context"
    statusItem.menu = makeMenu()
  }

  private func makeMenu() -> NSMenu {
    let menu = NSMenu()
    menu.addItem(item("Show Dock", action: #selector(toggleDock), key: "d"))
    menu.addItem(item("Preferences…", action: #selector(openSettings), key: ","))
    menu.addItem(.separator())
    menu.addItem(item("Quit Context", action: #selector(quit), key: "q"))
    menu.items.forEach { $0.target = self }
    return menu
  }

  private func item(_ title: String, action: Selector, key: String) -> NSMenuItem {
    NSMenuItem(title: title, action: action, keyEquivalent: key)
  }

  @objc private func toggleDock() {
    onToggleDock?()
  }

  @objc private func openSettings() {
    onOpenSettings?()
  }

  @objc private func quit() {
    NSApp.terminate(nil)
  }
}
