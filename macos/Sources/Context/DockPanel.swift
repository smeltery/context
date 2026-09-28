import AppKit

/// Borderless, non-activating floating panel that hosts the dock.
///
/// It joins every Space and stays above normal windows without ever becoming
/// the main window, so clicking a cell does not pull focus away from the app
/// the user is working in.
final class DockPanel: NSPanel {
  init(contentRect: NSRect) {
    super.init(
      contentRect: contentRect,
      styleMask: [.borderless, .nonactivatingPanel],
      backing: .buffered,
      defer: false
    )
    isFloatingPanel = true
    level = .floating
    isOpaque = false
    backgroundColor = .clear
    hasShadow = true
    hidesOnDeactivate = false
    isMovable = false
    isReleasedWhenClosed = false
    animationBehavior = .none
    collectionBehavior = [.canJoinAllSpaces, .stationary, .fullScreenAuxiliary, .ignoresCycle]
  }

  /// Needed so popovers presented from the dock can take keyboard focus.
  override var canBecomeKey: Bool { true }

  override var canBecomeMain: Bool { false }
}
