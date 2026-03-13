# Phase 3: Add Missing Frontend Rules (P2)

## Context Links

- [Plan Overview](plan.md)
- [Phase 1 — Critical Fixes](phase-01-fix-critical-rule-contradictions.md)
- [Plane Patterns Research](research/researcher-01-plane-patterns.md)
- [Routing & Layouts Rule](../../.claude/rules/routing-layouts.md)
- [MobX Stores Rule](../../.claude/rules/mobx-stores.md)

## Overview

- **Priority**: P2
- **Status**: complete
- **Effort**: 45m
- **Description**: Add 3 missing frontend patterns to existing rule files: React Router v7 advanced patterns (GAP 5), SWR data fetching convention (GAP 6), and fix the Common Traps table error (GAP 15).

## Key Insights

- React Router v7 uses `Route.ComponentProps` for type-safe params — seen in `apps/web/app/(all)/` pages
- Route groups use parenthesized directories: `(all)/`, `(settings)/`, `(projects)/`
- `apps/space` uses SSR (server-side rendering) via React Router; `apps/web` and `apps/admin` are CSR only
- SWR (`useSWR`) used in codebase for data fetching with cache/revalidation; stores use direct `fetchX()` for mutations
- `frontend-implementation-checklist.md` line 89 says `text-tertiary` is wrong — but codebase actually uses `text-tertiary` (will be fixed by Phase 1, verify here)

## Requirements

- **Functional**: Frontend rules must cover Router v7 type-safe patterns, SWR usage convention, and correct Common Traps
- **Non-functional**: Additions should be concise sections in existing files, not new rule files

## Architecture

### GAP 5: React Router v7 Advanced Patterns

Missing from `routing-layouts.md`:

1. **Type-safe route params** via `Route.ComponentProps` (already shown in page pattern but not explained)
2. **Route group conventions**: `(settings)/`, `(all)/`, `(projects)/` — parenthesized dirs are layout groups, not URL segments
3. **Error boundary patterns**: How to handle route-level errors
4. **SSR vs CSR**: `apps/space` = SSR, `apps/web` + `apps/admin` = CSR

### GAP 6: SWR Data Fetching

Two data fetching patterns coexist:
| Pattern | When | Example |
|---------|------|---------|
| `useSWR` | Read-only data with cache/revalidation | List views, dashboard widgets |
| `store.fetchX()` | Mutations, data that feeds MobX observables | Create/update/delete flows |

### GAP 15: Common Traps Table Error

`frontend-implementation-checklist.md` line 89 says `text-tertiary` is wrong. After Phase 1 fixes token naming, this becomes the CORRECT form. Must update the trap row.

## Related Code Files

- **Modify**: `.claude/rules/routing-layouts.md` — add Router v7 advanced patterns
- **Modify**: `.claude/rules/mobx-stores.md` — add SWR + store data fetching guidance
- **Modify**: `.claude/rules/frontend-implementation-checklist.md` — fix Common Traps (GAP 15, coordinated with Phase 1)

## Embedded Rules

1. **Rule accuracy**: Every rule statement MUST be verified against actual codebase grep results before writing
2. **Negative examples**: Every correction MUST include ❌ WRONG and ✅ CORRECT examples
3. **Path scoping**: Every rule file MUST have correct `paths:` frontmatter matching actual directories
4. **No contradictions**: After editing, grep for the old incorrect pattern across ALL rule files to ensure no contradictions remain

## Implementation Steps

### Step 1: Add Router v7 Advanced Patterns to `routing-layouts.md`

Add new section after "Breadcrumbs":

````markdown
## React Router v7 — Advanced Patterns

### Type-Safe Route Params

```typescript
import type { Route } from "./+types/page";

// Route.ComponentProps provides typed params from URL pattern
function ProjectPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params; // Fully typed
  // ...
}
```
````

### Route Groups (Parenthesized Directories)

Directories wrapped in `()` are layout groups — they affect nesting but NOT the URL:

```
(all)/                    ← Not in URL, just a layout wrapper
  [workspaceSlug]/        ← URL segment: /:workspaceSlug
    (projects)/           ← Not in URL, provides sidebar layout
      issues/page.tsx     ← URL: /:workspaceSlug/issues
    (settings)/           ← Not in URL, provides settings layout
      profile/page.tsx    ← URL: /:workspaceSlug/profile
```

### SSR vs CSR Apps

| App          | Rendering    | Notes                              |
| ------------ | ------------ | ---------------------------------- |
| `apps/web`   | CSR (client) | SPA, no server loaders             |
| `apps/admin` | CSR (client) | SPA, no server loaders             |
| `apps/space` | SSR (server) | Has loaders, use `useLoaderData()` |

❌ WRONG — Using SSR loader in apps/web:

```typescript
export async function loader() { ... }  // Only for apps/space
```

✅ CORRECT — CSR data fetching in apps/web:

```typescript
// Use SWR or store.fetchX() in useEffect, not loaders
useEffect(() => {
  store.fetchItems(slug);
}, [slug]);
```

````

### Step 2: Add SWR Data Fetching Section to `mobx-stores.md`

Add section after "Optimistic Update Pattern":

```markdown
## Data Fetching: SWR vs Store

Two patterns coexist — use the right one:

### `useSWR` — Read-Only with Cache

```typescript
import useSWR from "swr";

const { data, isLoading, mutate } = useSWR(
  workspaceSlug ? `WORKSPACE_DETAILS_${workspaceSlug}` : null,
  workspaceSlug ? () => workspaceService.getDetails(workspaceSlug) : null
);
````

Use when: read-only display, benefit from SWR cache/revalidation, component-local data.

### `store.fetchX()` — Mutations & Shared State

```typescript
// In store
fetchItems = action(async (slug: string) => {
  const items = await service.list(slug);
  runInAction(() => {
    items.forEach((i) => set(this.dataMap, i.id, i));
  });
});

// In component
useEffect(() => {
  store.fetchItems(slug);
}, [slug]);
```

Use when: data feeds MobX observables shared across components, or involves mutations (create/update/delete).

**Rule**: Never mix — don't put SWR data into MobX stores. Choose one pattern per data domain.

````

### Step 3: Verification
<!-- Updated: Validation Session 6 - Removed Common Traps fix (GAP 15) — already handled by Phase 1 Step 2 -->

```bash
# Verify Route.ComponentProps usage exists in codebase:
grep -r "Route\.ComponentProps" apps/web/ --include="*.tsx" -l | head -5

# Verify useSWR usage:
grep -r "useSWR" apps/web/ --include="*.ts" --include="*.tsx" -l | head -5

# Verify no new contradictions:
grep -r "text-color-tertiary.*correct\|always.*text-color-" .claude/rules/ --include="*.md" -i
````

## Post-Phase Checklist

- [ ] `routing-layouts.md` has Router v7 type-safe params, route groups, SSR/CSR distinction
- [ ] `mobx-stores.md` has SWR vs store data fetching guidance with when-to-use rules
- [ ] All examples verified against actual codebase patterns via grep
- [ ] No contradictions between new sections and existing rule content

## Todo List

- [ ] Add Router v7 advanced patterns to `routing-layouts.md`
- [ ] Add SWR data fetching section to `mobx-stores.md`
- [ ] Run grep verification
- [ ] Mark phase complete in plan.md

## Success Criteria

- AI agents use `Route.ComponentProps` for typed params in page components
- AI agents understand route group `()` conventions
- AI agents choose SWR for read-only display, store for shared/mutable data
- Common Traps table no longer contradicts actual token naming

## Risk Assessment

- **Risk**: SWR usage patterns may vary across codebase
  - **Mitigation**: Grep actual `useSWR` calls to identify most common pattern before writing rule
- **Risk**: Adding too many Router v7 patterns may exceed file size limit
  - **Mitigation**: Keep `routing-layouts.md` under 150 lines total; only add patterns with verified codebase usage

## Security Considerations

- No direct security impact — frontend rule files only
- SSR/CSR distinction matters for data exposure: SSR loaders may leak server-side data if misconfigured

## Next Steps

- Phase 4 (anti-hallucination) depends on Phases 1-3 being complete
- Can run in parallel with Phase 2 (backend rules)
