# Frontend Code Style Prompt
---

## Project Stack

- **React** (functional components only, no class components)
- **TypeScript** — `strict: true`, no `any`, use `unknown` + type guards
- **Vite** — ESM only, `.js` extensions in imports
- **Tailwind CSS v4** — utility-only styling, no CSS files per component
- **@tanstack/react-query** — all server state
- **Zustand** — minimal global state (auth token, selected entity)
- **ky** — HTTP client
- **Lucide React** — icons
- **Biome** — lint/format (no ESLint, no Prettier)

---

## Folder Structure

Each feature is a self-contained folder:

```
src/
├── api/            # ky HTTP client instance + auth logic
├── common/
│   ├── components/ # Layout shell: RootLayout, Header, BottomNav, PageSpinner
│   ├── hooks/      # Shared hooks (e.g., useCopy)
│   ├── icons/      # Custom SVG icon components
│   └── lib/        # format.ts, telegram.ts, reason.tsx
├── store/          # Zustand store (app.ts)
├── hooks/          # Global hooks (auth bootstrap)
└── {feature}/      # One folder per feature (see below)
    ├── pages/          # Route-level components
    ├── components/     # Presentational components
    ├── queries.ts      # All React Query hooks for this feature
    ├── api-types.ts    # TypeScript types for API responses
    └── lib/            # Feature-specific utilities (optional)
```

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `leader-list-row.tsx` |
| Components | `PascalCase` | `LeaderListRow` |
| Hooks | `camelCase` with `use` prefix | `useLeaders`, `useUpdateLeader` |
| Query key objects | `camelCase + Keys` suffix | `leaderKeys`, `tradesKeys` |
| Type aliases | `PascalCase` | `LeaderListItem`, `TradesResponse` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_RETRIES` |
| Zod schemas | `PascalCase + Schema` | `CreateLeaderSchema` |

---

## Component Pattern

```typescript
// Props interface defined at top, named {ComponentName}Props
type LeaderListRowProps = {
  leader: LeaderListItem;
  onSelect: (leader: LeaderListItem) => void;
};

// Named export (not default), PascalCase
export function LeaderListRow({ leader, onSelect }: LeaderListRowProps) {
  // Derived values as consts before return
  const isActive = leader.isActive;

  return (
    <li className="flex rounded-xl border border-border bg-surface-low">
      {/* ... */}
    </li>
  );
}
```

**Rules:**
- Props interface always defined above the component
- Named export only (not `export default`)
- Derived values as `const` before `return`
- Tailwind only — no inline `style`, no CSS modules
- `cn()` from `@workspace/ui/lib/utils` for conditional classes

---

## Page Component Pattern

Pages live in `{feature}/pages/`. They fetch data and pass it to presentational components.

```typescript
// Named component with logic
export function Leaders({ onSelectLeader }: LeadersProps) {
  const { data: leaders = [], isLoading } = useLeaders();
  const [isAddOpen, setIsAddOpen] = useState(false);

  if (isLoading) return <PageSpinner />;
  if (!leaders.length) return <EmptyState />;

  return (
    <div className="flex flex-1 flex-col pb-24">
      {/* ... */}
    </div>
  );
}

// Default export wraps with routing/navigation
export default function LeadersPage() {
  const navigate = useNavigate();
  return <Leaders onSelectLeader={(l) => navigate(`/leaders/${l.id}`)} />;
}
```

---

## Query Hooks Pattern (`queries.ts`)

```typescript
import type { CopyTradeListItem } from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useAppStore } from "@/store/app";

// 1. Query key factory — immutable, hierarchical
export const tradesKeys = {
  list: (params?: { limit?: number; offset?: number }) => {
    const limit = params?.limit ?? 50;
    const offset = params?.offset ?? 0;
    return ["trades", { limit, offset }] as const;
  },
};

// 2. Response type defined alongside the hook
export type TradesResponse = {
  data: CopyTradeListItem[];
  total: number;
  pagination: { limit: number; offset: number };
};

// 3. Query hook — always gate with enabled: !!token
export function useTrades(params?: { limit?: number; offset?: number }) {
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;
  const token = useAppStore((s) => s.token);

  return useQuery({
    queryKey: tradesKeys.list({ limit, offset }),
    queryFn: () =>
      api
        .get("trades", {
          searchParams: { limit: String(limit), offset: String(offset) },
        })
        .json<TradesResponse>(),
    enabled: !!token,
  });
}

// 4. Mutation hook — always invalidate on success
export function useCreateTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTradeInput) =>
      api.post("trades", { json: body }).json<CopyTradeListItem>(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: tradesKeys.list() });
    },
  });
}
```

**Rules:**
- Query keys: functions that normalize params, return `as const`
- Every query: `enabled: !!token`
- Every mutation: `onSuccess` invalidates related keys
- Response types defined in same file, not in `api-types.ts`
- Domain types imported from `@repo/shared`; API response shapes defined locally

---

## API Types Pattern (`api-types.ts`)

Only for types returned by the API that don't exist in `@repo/shared`:

```typescript
/** Shapes returned by `GET /leaders` */
export type LeaderListItem = {
  id: string;
  address: string;
  alias: string | null;
  tier: "HOT" | "WARM" | "COLD";
  isActive: boolean;
  createdAt: string;
  _count: { followConfigs: number };
};
```

---

## HTTP Client Usage (`@/api`)

```typescript
// GET with search params
api.get("trades", { searchParams: { limit: "50" } }).json<TradesResponse>()

// POST with JSON body
api.post("leaders", { json: body }).json<LeaderListItem>()

// PUT
api.put(`leaders/${id}`, { json: body }).json<LeaderListItem>()

// DELETE (returns void)
api.delete(`leaders/${id}`)
```

- Search params: always convert numbers to strings
- All numeric API responses are strings — always `parseFloat()` where needed

---

## Zustand Store Pattern

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AppStore = {
  token: string | null;
  walletId: string | null;
  setToken: (token: string | null) => void;
  setWalletId: (walletId: string | null) => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      token: null,
      walletId: null,
      setToken: (token) => set({ token }),
      setWalletId: (walletId) => set({ walletId }),
    }),
    { name: "app-store" },
  ),
);

// Usage — selector pattern, not full store
const token = useAppStore((s) => s.token);
```

**Rules:**
- Only global auth/session state in Zustand
- All server state in React Query
- Persisted to localStorage
- Always access via selector `useAppStore((s) => s.x)`

---

## UI Components (imports)

```typescript
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input, Label } from "@workspace/ui/components/input";
import { Switch } from "@workspace/ui/components/switch";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { cn } from "@workspace/ui/lib/utils";
```

---

## Import Order

```typescript
// 1. React + external libs
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

// 2. Monorepo types/packages
import type { SomeType } from "@repo/shared";

// 3. Internal UI library
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

// 4. App utilities & common
import { formatCurrency } from "@/common/lib/format";
import { useAppStore } from "@/store/app";

// 5. Feature-local imports
import { useLeaders } from "../queries";
import type { LeaderListItem } from "../api-types";
```

---

## Tailwind Patterns

```tsx
// Conditional classes
<div className={cn("rounded-xl border", isActive && "border-primary", className)} />

// Layout patterns
<div className="flex flex-1 flex-col gap-3 p-4 pb-24" />  // page container
<ul className="flex flex-col gap-2" />                      // list
<li className="flex items-center gap-3 rounded-xl border border-border bg-surface-low p-3" />

// Responsive (mobile-first Telegram app — rarely needed)
<div className="text-sm text-muted-foreground" />
```

---

## Loading / Empty / Error States

```tsx
// Loading
if (isLoading) return <PageSpinner />;

// Empty
if (!items.length) {
  return (
    <Empty>
      <EmptyMedia>...</EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>No items yet</EmptyTitle>
        <EmptyDescription>Add your first item to get started.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

// Error — use reason.tsx helper from @/common/lib/reason
```

---

## What NOT to do

- No `export default` for components (only for page wrappers)
- No CSS files, no `style={{}}` props
- No `any` — narrow with Zod or type guards
- No data fetching inside presentational components
- No `useEffect` for data fetching — use React Query
- No prop drilling more than 2 levels — lift to query hook or store
- No helper functions inside JSX `return` — define them before `return`
- No comments that describe what the code does — only non-obvious intent
