# `.claude` and `.cursor` layout

Quick map of where agent instructions, Cursor rules, and canonical docs live.

## `.claude/` — repo instructions and documentation

| Path | Purpose |
|------|---------|
| `CLAUDE.md` | Main Claude Code entry: priorities, pointers to style and API docs. |
| `STRUCTURE.md` | This file: overview of `.claude` and `.cursor`. |
| `docs/FRONTEND_STYLE.md` | Full frontend guide (`apps/web`): stack, folders, React Query, ky, Tailwind patterns. |
| `docs/channels-api-reference.md` | IronClaw gateway HTTP/SSE/WebSocket API reference (channels / web gateway). |

**UI work:** start with `CLAUDE.md`, then read `.claude/docs/FRONTEND_STYLE.md` when you need the full guide.

**Backend integration:** use `docs/channels-api-reference.md` (under `.claude/docs/`) as the source for endpoint contracts and payload shapes.

## `.cursor/` — Cursor rules (agent + IDE hints)

| Path | Purpose |
|------|---------|
| `rules/project-workflow.mdc` | Session defaults: where docs live and how to stay consistent in the monorepo. |
| `rules/frontend-style.mdc` | Applies when editing `apps/web/**/*.{ts,tsx}`; points to `FRONTEND_STYLE.md`. |
| `rules/channels-api.mdc` | Applies when editing `apps/web`; points to the gateway API reference. |

`.mdc` files use YAML frontmatter (`description`, `globs`, `alwaysApply`). Short rule summaries do not override the full documents in `.claude/docs/` — **if they conflict, the `.claude/docs/` file wins**.

## Rest of the repository

- Application code: `apps/web`, `packages/*`.
- Root `README.md` links to frontend style at `.claude/docs/FRONTEND_STYLE.md`.
