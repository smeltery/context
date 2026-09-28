import ContextCore
import SwiftUI

/// Recent pasteboard strings, shown in a popover beside the clipboard cell.
struct ClipboardCardView: View {
  @ObservedObject var model: DockModel

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      header
      Divider()
      if model.clipboardEntries.isEmpty {
        empty
      } else {
        list
      }
    }
    .frame(width: DockMetrics.cardWidth)
  }

  private var header: some View {
    HStack {
      Text("Clipboard")
        .font(.system(size: 13, weight: .semibold))
      Spacer()
      Button("Clear", action: model.clearClipboard)
        .buttonStyle(.link)
        .disabled(model.clipboardEntries.isEmpty)
    }
    .padding(.horizontal, 14)
    .padding(.vertical, 10)
  }

  private var empty: some View {
    Text("Copy something and it shows up here.")
      .font(.system(size: 12))
      .foregroundStyle(.secondary)
      .frame(maxWidth: .infinity, alignment: .leading)
      .padding(14)
  }

  private var list: some View {
    ScrollView {
      LazyVStack(alignment: .leading, spacing: 0) {
        ForEach(model.clipboardEntries) { entry in
          ClipboardRowView(entry: entry, model: model)
        }
      }
    }
    .frame(maxHeight: 320)
  }
}

private struct ClipboardRowView: View {
  let entry: ClipboardEntry
  @ObservedObject var model: DockModel

  private var isHovering: Bool { model.hoveredEntryID == entry.id }

  var body: some View {
    HStack(spacing: 8) {
      Text(entry.preview())
        .font(.system(size: 12))
        .lineLimit(2)
        .frame(maxWidth: .infinity, alignment: .leading)
      if isHovering {
        Button {
          model.removeClipboardEntry(entry)
        } label: {
          Image(systemName: "xmark.circle.fill")
            .foregroundStyle(.secondary)
        }
        .buttonStyle(.plain)
        .help("Remove")
      }
    }
    .padding(.horizontal, 14)
    .padding(.vertical, 8)
    .background(isHovering ? Color.primary.opacity(0.06) : .clear)
    .contentShape(Rectangle())
    .onHover { model.setHover($0, on: entry) }
    .onTapGesture { model.copyToPasteboard(entry) }
  }
}
