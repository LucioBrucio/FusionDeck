# Contributing to FusionDeck

Thanks for helping build an open-source programming tool for Yaesu System Fusion radios. 73!

## Prerequisites

- **Node.js ≥ 22** (`.nvmrc` pins the major; `nvm use` works)
- **pnpm** via Corepack — no global install needed:
  ```sh
  corepack enable
  ```

## Setup

```sh
pnpm install
pnpm build        # build all packages (core must build before its dependents)
pnpm test         # run the core test suite
```

## Repo layout

This is a pnpm + Turborepo monorepo. See [README](README.md#monorepo-layout) and
[docs/DESIGN.md](docs/DESIGN.md) for the architecture. The golden rule:

> **All domain logic lives in `packages/core` and stays isomorphic** — no
> Node-only, Electron-only, or browser-only imports. Host specifics enter only
> through the hexagonal ports (`HttpClient`, `CacheStore`, `Clock`, `Logger`).

## Branching & commits

- Work off `develop`; open PRs against `develop`. `main` is the release branch.
- Keep commits focused. Conventional Commits (`feat:`, `fix:`, `docs:`…) are appreciated.

## Adding support for a new radio

Implement the `RadioCodec` interface (`packages/core/src/codec/radio-codec.ts`)
in a new `packages/codec-<model>` package. Reverse-engineer **only** the files
the radio writes to its SD card — never disassemble vendor software (§8). Use
controlled hex-diffing as described in `docs/DESIGN.md` §5.3.

## Code style

- TypeScript strict mode; Prettier (`pnpm format`).
- Prefer small, pure functions in `core`; keep I/O at the adapter edges.

## Legal

By contributing you agree your contributions are licensed under the project's
**GPL-3.0-or-later** license. Reverse engineering is for interoperability only
(EU Software Directive art. 6); this project does not condone violating any
service's Terms of Service.
