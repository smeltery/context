# Releasing

Context uses the same auto-release pattern as [hab](https://github.com/smeltery/hab).

## Flow

```mermaid
sequenceDiagram
  participant Dev as Developer
  participant CI as ci workflow
  participant AR as auto-release
  participant Rel as release workflow
  participant GH as GitHub Releases
  Dev->>CI: merge to main
  CI-->>AR: workflow_run success
  AR->>AR: next patch tag vX.Y.Z
  AR->>Rel: gh workflow run release.yml
  Rel->>Rel: preflight + pack macOS + web
  Rel->>GH: create/upload assets
```

1. CI goes green on `main`.
2. `auto-release.yml` computes the next `vMAJOR.MINOR.PATCH` tag (or reuses one already on HEAD).
3. It dispatches `release.yml` with that tag (token-created tags do not trigger `on: push` alone).
4. Release builds `context-macos-arm64`, `context-web-*.tar.gz`, and `SHA256SUMS`.

Manual dispatch of `release.yml` is supported for rebuilds.
