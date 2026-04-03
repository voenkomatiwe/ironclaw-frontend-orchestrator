# IronClaw orchestrator — agent instructions

## Where rules and docs live

| Topic | Canonical document |
|------|---------------------|
| Repo / agent workflow | `.claude/STRUCTURE.md` |
| Frontend (`apps/web`) | `.claude/docs/FRONTEND_STYLE.md` |
| Gateway HTTP / SSE / WS | `.claude/docs/channels-api-reference.md` |

If a short summary below disagrees with those files, **the files in `.claude/docs/` win**.

## Rule: frontend style

Whenever you work on **`apps/web`** (React, routes, components, API calls from the UI), follow the full guide:

**`.claude/docs/FRONTEND_STYLE.md`**

### Summary

- React: functional components only; TypeScript strict, no `any`.
- Styling: Tailwind only; `cn()` from `@/common/lib/utils`; no `style={{}}` and no separate CSS file per component.
- Feature layout: `{feature}/pages/`, `{feature}/components/`, `{feature}/queries.ts`, plus `api-types.ts` when needed.
- Components: **named** `export`; prop types as **`{Name}Props`** above the component.
- Pages: named component with logic + a separate **`export default`** only as the routing wrapper.
- Server state: **React Query** in the feature’s `queries.ts`; Zustand only for global session / minimal client state.
- HTTP: **ky** via `@/api`; icons: Lucide; format and lint: **Biome**.

## Rule: gateway API

When adding or changing calls to `/api/*`, webhooks, signal routes, or stream handling, align shapes and methods with:

**`.claude/docs/channels-api-reference.md`**
