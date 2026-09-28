import AppKit
import ContextCore
import SwiftUI

/// Owns the floating panel: placement, auto-hide, and the clipboard card.
@MainActor
final class DockWindowController {
  private let model: DockModel
  private let panel: DockPanel
  private let hostingView: NSHostingView<DockView>
  private let popover = NSPopover()

  private var isRevealed = true
  private var hideTimer: Timer?

  init(model: DockModel) {
    self.model = model
    let size = CGSize(model.panelSize)
    self.panel = DockPanel(contentRect: NSRect(origin: .zero, size: size))
    self.hostingView = NSHostingView(rootView: DockView(model: model))
    hostingView.frame = NSRect(origin: .zero, size: size)
    panel.contentView = hostingView

    popover.behavior = .transient
    popover.animates = true
    popover.contentViewController = NSHostingController(
      rootView: ClipboardCardView(model: model)
    )

    model.onAction = { [weak self] action in self?.perform(action) }
    model.onSettingsChange = { [weak self] _ in self?.settingsChanged() }
  }

  /// Called when the settings window should open.
  var onOpenSettings: (() -> Void)?

  func show() {
    settingsChanged()
    panel.orderFrontRegardless()
  }

  func hide() {
    popover.performClose(nil)
    panel.orderOut(nil)
  }

  func toggle() {
    if panel.isVisible {
      hide()
    } else {
      show()
    }
  }

  // MARK: - Actions

  private func perform(_ action: DockAction) {
    switch action {
    case .openSettings:
      popover.performClose(nil)
      onOpenSettings?()
    case .toggleClipboardCard(let itemID):
      toggleCard(anchoredTo: itemID)
    }
  }

  private func toggleCard(anchoredTo itemID: String) {
    if popover.isShown {
      popover.performClose(nil)
      return
    }
    guard let cell = model.cellFrames.first(where: { $0.itemID == itemID }) else { return }
    let anchor = anchorRect(for: cell)
    let edge: NSRectEdge = model.settings.edge == .right ? .minX : .maxX
    popover.show(relativeTo: anchor, of: hostingView, preferredEdge: edge)
  }

  /// Converts a top-down cell frame into the hosting view's bottom-left space.
  private func anchorRect(for cell: DockCellFrame) -> NSRect {
    let panelHeight = model.panelSize.height
    return NSRect(
      x: 0,
      y: panelHeight - cell.bottom,
      width: DockMetrics.panelWidth,
      height: cell.height
    )
  }

  // MARK: - Placement

  private func screenRect() -> DockRect {
    let screen = panel.screen ?? NSScreen.main ?? NSScreen.screens.first
    guard let frame = screen?.visibleFrame else {
      return DockRect(x: 0, y: 0, width: 1440, height: 900)
    }
    return DockRect(frame)
  }

  private func reposition(animated: Bool) {
    let size = model.panelSize
    let frame = DockLayout.panelFrame(
      panelSize: size,
      screen: screenRect(),
      edge: model.settings.edge,
      revealed: isRevealed
    )
    hostingView.frame = NSRect(origin: .zero, size: CGSize(size))
    panel.setFrame(NSRect(frame), display: true, animate: animated)
  }

  private func settingsChanged() {
    isRevealed = !model.settings.autoHide
    reposition(animated: false)
    model.settings.autoHide ? startTrackingPointer() : stopTrackingPointer()
  }

  // MARK: - Auto-hide

  private func startTrackingPointer() {
    guard hideTimer == nil else { return }
    let timer = Timer.scheduledTimer(withTimeInterval: 0.12, repeats: true) { [weak self] _ in
      MainActor.assumeIsolated { self?.updateReveal() }
    }
    RunLoop.main.add(timer, forMode: .common)
    hideTimer = timer
  }

  private func stopTrackingPointer() {
    hideTimer?.invalidate()
    hideTimer = nil
  }

  private func updateReveal() {
    let size = model.panelSize
    let screen = screenRect()
    let edge = model.settings.edge
    let pointer = DockPoint(NSEvent.mouseLocation)

    let revealedFrame = DockLayout.panelFrame(
      panelSize: size, screen: screen, edge: edge, revealed: true
    )
    let zone = DockLayout.revealZone(panelSize: size, screen: screen, edge: edge)
    let shouldReveal =
      popover.isShown
      || zone.contains(pointer)
      || (isRevealed && revealedFrame.inset(by: -DockMetrics.screenGap).contains(pointer))

    guard shouldReveal != isRevealed else { return }
    isRevealed = shouldReveal
    reposition(animated: true)
  }
}
