import AppKit
import Foundation

/// Polls the general pasteboard and reports newly copied strings.
@MainActor
final class PasteboardWatcher {
  /// Called with each new pasteboard string; blanks are filtered by the store.
  var onCapture: ((String) -> Void)?

  private let pasteboard: NSPasteboard
  private var lastChangeCount: Int
  private var timer: Timer?

  init(pasteboard: NSPasteboard = .general) {
    self.pasteboard = pasteboard
    self.lastChangeCount = pasteboard.changeCount
  }

  func start(interval: TimeInterval) {
    stop()
    let timer = Timer.scheduledTimer(withTimeInterval: max(0.2, interval), repeats: true) {
      [weak self] _ in
      MainActor.assumeIsolated { self?.poll() }
    }
    timer.tolerance = interval / 4
    RunLoop.main.add(timer, forMode: .common)
    self.timer = timer
  }

  func stop() {
    timer?.invalidate()
    timer = nil
  }

  private func poll() {
    let changeCount = pasteboard.changeCount
    guard changeCount != lastChangeCount else { return }
    lastChangeCount = changeCount
    guard let text = pasteboard.string(forType: .string) else { return }
    onCapture?(text)
  }
}
