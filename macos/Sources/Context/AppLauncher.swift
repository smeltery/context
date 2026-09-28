import AppKit
import ContextCore
import Foundation

/// Opens applications and links, and resolves app artwork.
@MainActor
enum AppLauncher {
  private static var iconCache: [String: NSImage] = [:]

  /// Launches or focuses an app by bundle identifier.
  static func openApp(bundleID: String) {
    guard let url = NSWorkspace.shared.urlForApplication(withBundleIdentifier: bundleID) else {
      return
    }
    let configuration = NSWorkspace.OpenConfiguration()
    configuration.activates = true
    NSWorkspace.shared.openApplication(at: url, configuration: configuration)
  }

  /// Opens a link in the user's default handler.
  static func openLink(_ string: String) {
    guard let url = URL(string: string), url.scheme != nil else { return }
    NSWorkspace.shared.open(url)
  }

  /// The Finder icon for an installed app, cached per bundle identifier.
  static func icon(bundleID: String) -> NSImage? {
    if let cached = iconCache[bundleID] { return cached }
    guard let url = NSWorkspace.shared.urlForApplication(withBundleIdentifier: bundleID) else {
      return nil
    }
    let icon = NSWorkspace.shared.icon(forFile: url.path)
    icon.size = NSSize(width: DockMetrics.appIconSize, height: DockMetrics.appIconSize)
    iconCache[bundleID] = icon
    return icon
  }

  /// Bundle identifiers of every app currently running with a UI.
  static func runningBundleIDs() -> Set<String> {
    Set(
      NSWorkspace.shared.runningApplications
        .filter { $0.activationPolicy == .regular }
        .compactMap(\.bundleIdentifier)
    )
  }
}
