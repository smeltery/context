# Getting started

Context is a slim second dock for macOS 15+. It keeps apps, links, and live widgets on the edge of your screen.

## Install from Releases

1. Open the latest [GitHub Release](https://github.com/smeltery/context/releases/latest).
2. Download `context-macos-arm64` (Apple silicon) or build from source for Intel.
3. Make it executable and run:

```bash
chmod +x context-macos-arm64
./context-macos-arm64
```

Gatekeeper may ask you to allow the binary the first time.

## Build from source

```bash
flox activate   # optional, pins bun and hygiene tools
bun install
cd macos
swift build --product Context
swift run Context
```

## First run

- The dock appears on the right edge by default.
- Click an app cell to launch it; click a link to open it in your browser.
- The clipboard widget records recent pasteboard text locally.
- Use the menu bar item for Show Dock, Preferences, and Quit.

More detail: [How it works](how-it-works.md) and [Customization](customization.md).
