# context

[![CI](https://github.com/smeltery/context/actions/workflows/ci.yml/badge.svg)](https://github.com/smeltery/context/actions/workflows/ci.yml)
[![Release](https://github.com/smeltery/context/actions/workflows/release.yml/badge.svg)](https://github.com/smeltery/context/actions/workflows/release.yml)
[![License: PolyForm Shield 1.0.0](https://img.shields.io/badge/license-PolyForm%20Shield%201.0.0-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/bun-1.4-black?logo=bun&logoColor=white)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/typescript-5+-3178c6?logo=typescript&logoColor=white)](packages/core)
[![Swift](https://img.shields.io/badge/Swift-6-F05138?logo=swift&logoColor=white)](macos)
[![macOS 15+](https://img.shields.io/badge/macOS-15%2B-000000?logo=apple&logoColor=white)](docs/getting-started.md)
[![Vite](https://img.shields.io/badge/vite-7-646CFF?logo=vite&logoColor=white)](apps/web)
[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit&logoColor=white)](.pre-commit-config.yaml)
[![Flox](https://img.shields.io/badge/dev%20env-flox-7c3aed.svg)](https://flox.dev)

A second dock for your Mac — apps, links, clipboard history, and live widgets on the screen edge.

<p align="center">
  <img src="docs/assets/context-hero.png" width="720" alt="Context on a MacBook — a second dock on the screen edge">
</p>

## Quick start

```bash
flox activate   # optional
bun install
bun run dev     # marketing site
cd macos && swift build --product Context && open .build/debug/Context
```

Or download a build from [Releases](https://github.com/smeltery/context/releases).

## Docs

Guides, architecture diagrams, and development notes live in [`docs/`](docs/README.md).

## License

[PolyForm Shield 1.0.0](LICENSE)
