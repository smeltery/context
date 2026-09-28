# CI

Continuous integration runs on every push and pull request to `main`.

```mermaid
flowchart TD
  push[Push / PR] --> docs[docs job]
  push --> verify[verify job]
  push --> macos[macos job]
  docs --> md[Markdown + Mermaid + links]
  docs --> hy[Budgets + shellcheck + actionlint]
  verify --> test[bun test]
  verify --> web[Vite build]
  macos --> swift[swift build Context]
  macos --> smoke[ContextCoreSmoke]
  docs --> green[CI green]
  verify --> green
  macos --> green
  green --> autorelease[auto-release on main]
```

## Jobs

| Job | Runner | What it runs |
|-----|--------|--------------|
| `docs` | Blacksmith Ubuntu | flox activate, `check-docs.sh`, `check-hygiene.sh` |
| `verify` | Blacksmith Ubuntu | `check-node.sh` |
| `macos` | Blacksmith macOS 15 | Swift build + smoke (+ `swift test` when Xcode exists) |

Flox is installed in Linux jobs so the same `manifest.toml` tools used locally are proven in CI. Bun 1.4.2 is also set up via `oven-sh/setup-bun` so the lockfile version is exact even if the catalog lags.
