import ContextCore
import SwiftUI

/// Preferences for edge, theme, auto-hide, and poll intervals.
struct SettingsView: View {
  @ObservedObject var model: DockModel

  var body: some View {
    Form {
      Picker("Edge", selection: $model.settings.edge) {
        Text("Left").tag(DockEdge.left)
        Text("Right").tag(DockEdge.right)
      }
      .pickerStyle(.segmented)

      Picker("Theme", selection: $model.settings.theme) {
        Text("System").tag(DockTheme.system)
        Text("Light").tag(DockTheme.light)
        Text("Dark").tag(DockTheme.dark)
      }

      Toggle("Hide until pointer reaches the edge", isOn: $model.settings.autoHide)

      Section("Refresh") {
        LabeledContent("Clipboard") {
          Slider(value: $model.settings.clipboardPollInterval, in: 0.3...3, step: 0.1) {
            Text("Clipboard")
          }
          .labelsHidden()
          Text(String(format: "%.1fs", model.settings.clipboardPollInterval))
            .monospacedDigit()
            .foregroundStyle(.secondary)
        }
        LabeledContent("Stats") {
          Slider(value: $model.settings.statsPollInterval, in: 1...10, step: 0.5) {
            Text("Stats")
          }
          .labelsHidden()
          Text(String(format: "%.1fs", model.settings.statsPollInterval))
            .monospacedDigit()
            .foregroundStyle(.secondary)
        }
      }

      Section("Clipboard history") {
        LabeledContent("Stored") {
          Text("\(model.clipboardEntries.count) of \(ClipboardStore.defaultLimit)")
            .foregroundStyle(.secondary)
        }
        Button("Clear history", action: model.clearClipboard)
          .disabled(model.clipboardEntries.isEmpty)
      }
    }
    .formStyle(.grouped)
    .frame(width: 420)
    .fixedSize(horizontal: false, vertical: true)
  }
}
