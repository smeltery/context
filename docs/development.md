# Development

## Tooling

- **Flox** — `flox activate` installs bun, pre-commit, shellcheck, actionlint, gh.
- **Bun 1.4.2** — workspace install, tests, Vite marketing site, doc validators.
- **Swift 6** — `macos/` package (`ContextCore`, `Context`, `ContextCoreSmoke`).

```bash
flox activate
bun install --frozen-lockfile
pre-commit install
git config core.hooksPath .githooks   # optional pre-push parity with CI
bun run ci
```

## Layout of the repo

| Path | Role |
|------|------|
| `apps/web` | Pixel-faithful marketing site (Vite) |
| `packages/core` | Shared TypeScript layout constants + tests |
| `macos` | Native second-dock app |
| `docs` | User-facing guides |
| `scripts` | CI / pre-commit check entrypoints |

## Checks that must stay green

Pre-commit and CI both run:

1. `scripts/check-docs.sh` — markdownlint + mermaid parse + doc links
2. `scripts/check-hygiene.sh` — LOC/flat budgets + actionlint + shellcheck
3. `scripts/check-node.sh` — `bun test` + web build
4. macOS job — `swift build` + `ContextCoreSmoke`

See [CI](ci.md).
