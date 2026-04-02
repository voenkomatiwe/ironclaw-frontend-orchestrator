# IronClaw frontend orchestrator

Monorepo: **orchestrator** app plus optional **add-on** workspace packages.

**Workspace packages:** `ironclaw-frontend-orchestrator` (root), `@repo/web`, `@repo/typescript-config`, `@repo/polymarket-copy-bot`, …

## Layout

| Path | Role |
|------|------|
| `apps/web` | Vite + React: orchestrator UI, routing, embedded add-on UIs |
| `packages/typescript-config` | Shared `tsconfig` presets |
| `packages/addons/*` | Add-ons (e.g. `@repo/polymarket-copy-bot`) |

## Requirements

- Node.js ≥ 18  
- [Bun](https://bun.sh) (see root `package.json` → `packageManager`)

## Commands (repo root)

```sh
bun install
bun run dev              # turbo dev (includes web)
bun run build            # turbo build
bun run check-types      # tsc across packages
bun run check            # biome check --fix
bun run format           # biome format --write
```

Web only: `bun run dev --filter=@repo/web`, `bun run build --filter=@repo/web`.

## Add-on routes (`apps/web`)

- `/addons/:name` → redirect to `/addons/:name/manage`
- `/addons/:name/manage` — container, env, logs
- `/addons/:name/start/*` — embedded add-on UI (see `apps/web/src/addons/addon-ui-registry.tsx`)

Wire an add-on into the bundle: add `workspace:*` in `apps/web/package.json` and register it in `ADDON_UI_ROOT`.

## Add-on API during dev

`apps/web` Vite proxies `/api` and `/ws` to the backend (default `http://localhost:3000`). Override:

```sh
VITE_ADDON_API_TARGET=http://host:port bun run dev --filter=@repo/web
```

## Code style

See [docs/FRONTEND_STYLE.md](docs/FRONTEND_STYLE.md).
