# IronClaw orchestrator — agent instructions

## Rule: frontend style

Whenever you work on **`apps/web`** (React, routes, components, API calls from the UI), **follow the full guide:**

**`docs/FRONTEND_STYLE.md`** (repository root)

If the summary below disagrees with that file, **`docs/FRONTEND_STYLE.md`** is authoritative.

### Summary

- React: functional components only; TypeScript strict, no `any`.
- Styling: Tailwind only; `cn()` from `@/common/lib/utils`; no `style={{}}` and no separate CSS file per component.
- Feature layout: `{feature}/pages/`, `{feature}/components/`, `{feature}/queries.ts`, plus `api-types.ts` when needed.
- Components: **named** `export`; prop types as **`{Name}Props`** above the component.
- Pages: named component with logic + a separate **`export default`** only as the routing wrapper.
- Server state: **React Query** in the feature’s `queries.ts`; Zustand only for global session / minimal client state.
- HTTP: **ky** via `@/api`; icons: Lucide; format and lint: **Biome**.
