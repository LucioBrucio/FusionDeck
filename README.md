# FusionDeck

> **CHIRP for Yaesu System Fusion.** An open-source, cross-platform tool that
> unifies the radio-amateur Fusion workflow — **discover → see what's live →
> select → write to memory** — in one experience, "from the map to the memory."

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
![Status](https://img.shields.io/badge/status-Phase%200%20(foundations)-orange)
![Node](https://img.shields.io/badge/node-%E2%89%A522-3c873a)

---

## Why

Today the Fusion workflow is split across five disconnected tools: repeater
lists, WIRES-X maps, aprs.fi, the Yaesu node/room list, and finally ADMS-18 to
write the radio. FusionDeck **fuses that loop into a single app** and fills a
real gap:

1. **No CHIRP for Fusion.** CHIRP doesn't cover the Fusion radios; RT Systems is
   paid and Windows-only; ADMS is functional but isolated and unloved.
2. **No one unifies the live-activity layer with programming**, and no one
   unifies the two parallel networks — **WIRES-X** (proprietary) and **YSF**
   (open). Doing both is the novelty.

First target radio: **Yaesu FTM-510DE**. The discovery layer is
model-independent and works for any future radio.

> ⚠️ **Status: Phase 0 (foundations).** The monorepo, the isomorphic core, the
> `DiscoveryGateway` (remote + local fallback) and the package skeletons are in
> place. RepeaterBook wiring, the live-activity sources, and the `.dat` codec
> are scaffolded as stubs. See the [roadmap](#roadmap).

## Architecture in one breath

All domain logic lives in one **isomorphic, dependency-free core** that runs in
two places: the central community **server** and, **embedded** in the desktop
app as an offline fallback. Hosts differ only in which I/O adapters they inject
(hexagonal ports). The client always goes through a `DiscoveryGateway`:
**remote-first, with transparent fallback to the embedded core** on timeout,
error, or staleness.

```
            @fusiondeck/core  (pure TypeScript, isomorphic)
   sources · normalize · cache · domain · ports(HttpClient·CacheStore·Clock·Logger)
                    ▲                                   ▲
        implements ports                       implements ports
   @fusiondeck/server (Node)              apps/desktop (Electron)
   undici · fs cache · REST          embedded core = LocalProvider (fallback)
                    ▲                                   │
                    └──────────  REST (preferred)  ─────┘
                                            + SD-card codec  + UI (map, grid)
```

Full design rationale and ADRs: **[docs/DESIGN.md](docs/DESIGN.md)**.

## Monorepo layout

| Package | What it is |
|---|---|
| [`packages/core`](packages/core) | **`@fusiondeck/core`** — isomorphic domain: discovery sources, normalization, caching, ports, `DiscoveryGateway`, codec contracts. Zero host deps. |
| [`packages/server`](packages/server) | **`@fusiondeck/server`** — Fastify host that runs the core with Node adapters (undici, fs cache, pino) and exposes the REST API. |
| [`packages/codec-ftm510de`](packages/codec-ftm510de) | **`@fusiondeck/codec-ftm510de`** — `RadioCodec` plugin for the FTM-510DE (SD-card `.dat`) + Tier 1 ADMS-18 CSV export. |
| [`packages/ui`](packages/ui) | **`@fusiondeck/ui`** — Angular web UI (Leaflet + OpenStreetMap), shell-agnostic so Electron→Tauri stays cheap. |
| [`apps/desktop`](apps/desktop) | **`@fusiondeck/desktop`** — Electron app: hosts the UI, embeds the core as local fallback, bridges the SD card. |

## Getting started

Requires **Node ≥ 22**. pnpm comes via Corepack — no global install.

```sh
corepack enable          # makes pnpm available
pnpm install
pnpm build               # builds all packages (core builds first)
pnpm test                # runs the core test suite
```

### Run a package

```sh
# Central API (http://localhost:8787 — try /health, /api/v1/repeaters)
pnpm --filter @fusiondeck/server dev

# Web UI (http://localhost:4200) — build core once first: pnpm --filter @fusiondeck/core build
pnpm --filter @fusiondeck/ui dev

# Desktop app (loads the UI dev server in dev mode)
pnpm --filter @fusiondeck/desktop dev
```

Common tasks run through Turborepo: `pnpm build`, `pnpm dev`, `pnpm test`,
`pnpm typecheck`, `pnpm format`.

## Data sources & an honesty caveat

| Source | Access | Provides |
|---|---|---|
| RepeaterBook | public API | Geolocated RF repeaters (primary) |
| WIRES-X | scraping | Active nodes/rooms, popularity (no API) |
| Live-Wires-X | community JSON | Re-aggregated WIRES-X data |
| YSF — DVRef | host file | Authoritative reflector registry |
| YSF — pistar.uk / W0CHP | structured lists | Reflector mirrors (hourly) |
| YSF — DG9VH dashboard | scraping / ws | Real-time last-heard per reflector |
| aprs.fi | API (key) | Liveness / last-seen |

> **No network source sees purely-local RF QSOs** that aren't forwarded to a
> room/reflector. FusionDeck presents this as *"network activity"*, to be
> cross-checked with an RF test of the repeater's beacon/ID — never as
> "everything you can hear on the repeater" (§4.3).

## Roadmap

- **Phase 0 — Foundations** *(here)*: monorepo, isomorphic core, `DiscoveryGateway`, RepeaterBook + map. No reverse engineering.
- **Phase 1 — Useful MVP**: generate **CSV** importable by ADMS-18. Publishable, zero RE.
- **Phase 2 — Standalone**: write `.dat` directly to SD (RE the FTM-510DE format) → drop ADMS-18.
- **Phase 3 — Live activity** *(the killer feature)*: WIRES-X + YSF + aprs, unified. "This is active, here's the last heard, I'll write it to memory."
- **Phase 4 — Hardware tier**: RTL-SDR sentinel on a Raspberry Pi (FM + activity detection; **not** C4FM software decode — AMBE is proprietary), GPS puck for mobile.
- **Codec expansion**: new radios = new `RadioCodec` plugins.

## Tech stack

pnpm workspaces · Turborepo · TypeScript (strict, isomorphic core) · Fastify +
undici (server) · Angular + Leaflet/OSM (UI) · Electron (desktop, Tauri later).

## Legal & ethical

- **Reverse engineering** is clean-room of the **radio's file format** for
  interoperability only (EU Software Directive art. 6). We work **only** on files
  the radio writes — never on vendor executables. *(Not legal advice.)*
- **Scraping**: aggressive caching, attribution, respect for ToS/robots; prefer
  the host files/JSON meant to be consumed, and honor the ~72 req/day cadence
  toward Yaesu.
- **AMBE** vocoder is proprietary → no software C4FM decode is promised.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Work off `develop`; PRs target `develop`.

## License

[GPL-3.0-or-later](LICENSE) — chosen for coherence with the G4KLX / CHIRP
open-source ecosystem.
