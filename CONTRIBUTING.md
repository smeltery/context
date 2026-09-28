# Contributing

Thanks for helping with context.

1. Activate the Flox env (`flox activate`) or install Bun 1.4+.
2. `bun install --frozen-lockfile`
3. Enable hooks: `pre-commit install` (or `git config core.hooksPath .githooks`)
4. Make your change, then run `bun run ci` before opening a PR.

See [docs/development.md](docs/development.md) for Swift, flox, and CI parity.
