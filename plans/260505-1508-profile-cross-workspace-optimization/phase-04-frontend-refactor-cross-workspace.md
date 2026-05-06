# Phase 4 — Frontend: Refactor Today/Overdue to Use Aggregate Endpoint

## Context Links

- Debug report §"#1 CROSS-WORKSPACE FAN-OUT": `plans/reports/debugger-260505-1454-your-work-profile-slow.md`
- Components: `apps/web/ce/components/profile/today-work-items.tsx`, `overdue-work-items.tsx`
- Table: `apps/web/ce/components/profile/work-items-table.tsx` (consumes `EnrichedIssue` shape — keep stable)
- Frontend rules: `.claude/rules/api-services.md`, `.claude/rules/ce-override-pattern.md`

## Overview

- **Priority:** P1 (delivers user-facing perf win)
- **Status:** complete
- **Effort:** 2h
- **Brief:** Replace 100-workspace `Promise.all` loop with 1 fetch to new `/api/users/me/work-items/today/` (or `/overdue/`) endpoint. Keep `crossWorkspaces=true` default (UX unchanged); toggle off → add `?workspace=<slug>` param.
- **Depends:** Phase 1 (endpoint must exist)

<!-- Updated: Validation Session 1 - confirmed decisions -->

**Validation decisions (Session 1):**

- `crossWorkspaces` default stays `true` (perf cost ~0 with Phase 1 endpoint)
- Hide cross-workspace toggle when `userId !== currentUser.id` (endpoint is `/users/me/...` — self-only, prevents silent data leak on other-user profiles)
- Feature flag `VITE_USE_AGGREGATE_PROFILE_ENDPOINT` (Vite env var; read via `import.meta.env.VITE_USE_AGGREGATE_PROFILE_ENDPOINT`, default `"true"`): when `"false"`, hook falls back to old fan-out path. Defense-in-depth for first deploy. <!-- Note: Codebase uses Vite, not Next.js; env var name is VITE_*, not NEXT_PUBLIC_* -->

<!-- Updated: Validation Session 2 - other-user profile path -->

**Validation decisions (Session 2):**

- **Cross-user profile fallback:** When `userId !== currentUser.id`, hook routes to LEGACY `WorkspaceUserProfileIssuesEndpoint` per-workspace fan-out (preserves existing teammate-profile UX). New aggregate endpoint stays self-only.
  - Hook signature: `useUserWorkItems(kind, crossWorkspaces, currentWorkspaceSlug, userId)` — when `userId !== currentUser.id`, dispatches to legacy `userIssueService.getUserProfileIssues(workspaceSlug, userId, ...)` per-workspace; results normalized to same `EnrichedIssue[]` shape.
  - Two execution paths inside one hook (avoid duplicating in components): self-aggregate-call vs other-user-fan-out. Each returns `EnrichedIssue[]`.
- **Wire shape:** Backend returns `assignee_ids: UUID[]`, `label_ids: UUID[]` only. Frontend joins with `useMember()` / `useLabel()` MobX stores for avatars/colors. NO embedded mini-objects expected.

## Key Insights

- Both components share 95% structure → extract shared hook `useUserWorkItems(kind: "today"|"overdue", crossWorkspaces, workspaceSlug)` to apply DRY (skill: dedupe).
- New endpoint returns server-enriched `_workspace`, `_project`, `_state` → frontend stops needing `getProjectsLite` + `getWorkspaceStates` per workspace (-200 calls).
- Keep `EnrichedIssue` type unchanged (table component contract). New service maps API response → `EnrichedIssue` shape directly (since Phase 1 serializer is designed flat already).
- Workspace name lookup from `useWorkspace().workspaces` becomes redundant — server provides `_workspace.name`. Keep store usage only for non-data needs (avoid over-refactor).
- Task category names still come from MobX store (`useTaskCategory`) — out of scope for new endpoint.

## Requirements

**Functional**

- Default `crossWorkspaces=true` → call new endpoint without `workspace` param.
- Toggle off → call with `?workspace=<currentSlug>`.
- XLSX export still works (consumes `EnrichedIssue[]`).
- Filter (state group, target_date for overdue, start_date for today) → moved to backend; frontend keeps client-side `EXCLUDED_STATE_GROUPS` filter as defensive layer.
- Loading state, empty state unchanged.
- `useTaskCategory` enrichment loop unchanged.

**Non-functional**

- File <150 lines (component limit per rules).
- Single `useSWR` per component (no nested promises).
- Type-safe — no `any`.

## Architecture

```
Before:
TodayWorkItems → useSWR(N×Promise.all(userIssues + projects + states))
                 → 600 HTTP calls

After:
TodayWorkItems → useUserWorkItems("today", crossWs, slug) (CE hook)
                 → CEUserWorkItemsService.list("today", { workspace?: slug })
                 → 1 HTTP call → returns EnrichedIssue[]
                 → enrichWithTaskCategory() (MobX store join)
                 → render
```

## Related Code Files

**Create**

- `apps/web/ce/services/user-work-items.service.ts` (~50 lines) — `CEUserWorkItemsService`
- `apps/web/ce/hooks/store/use-user-work-items.ts` (~50 lines) — shared SWR hook

**Modify**

- `apps/web/ce/components/profile/today-work-items.tsx` — drop fan-out, use new hook
- `apps/web/ce/components/profile/overdue-work-items.tsx` — drop fan-out, use new hook
- `packages/types/src/users/index.ts` — add `IUserWorkItem` type matching backend serializer (or re-use `TBaseIssue` + add `_workspace` etc.)

**Read for context**

- `apps/web/ce/components/profile/work-items-table.tsx:23` (`EnrichedIssue` shape)
- `apps/web/core/services/api.service.ts` (parent service class)
- `apps/web/ce/hooks/store/` (CE hook patterns)

## Implementation Steps

1. **Search-before-build** (per rules):

   ```
   grep -r "user-work-items\|useUserWorkItems" apps/web/ packages/
   ```

   Confirm new symbols.

2. **Create service** `apps/web/ce/services/user-work-items.service.ts`:

   ```ts
   import { API_BASE_URL } from "@plane/constants";
   import { APIService } from "@/services/api.service";
   import type { EnrichedIssue } from "@/plane-web/components/profile/work-items-table";

   type Kind = "today" | "overdue";
   export class CEUserWorkItemsService extends APIService {
     constructor() {
       super(API_BASE_URL);
     }
     async list(kind: Kind, params?: { workspace?: string }): Promise<EnrichedIssue[]> {
       return this.get(`/api/users/me/work-items/${kind}/`, { params })
         .then((r) => r?.data ?? [])
         .catch((e) => {
           throw e?.response?.data;
         });
     }
   }
   ```

3. **Create shared hook** `apps/web/ce/hooks/store/use-user-work-items.ts`:
   - Args: `kind: "today"|"overdue"`, `crossWorkspaces: boolean`, `currentWorkspaceSlug?: string`, `userId: string` <!-- Updated: Validation Session 2 - userId arg required -->
   - Build SWR key: `WORK_ITEMS_${kind}_${userId}_${crossWorkspaces ? "ALL" : currentWorkspaceSlug}_${todayStr}`
   - Fetcher decision tree (priority order): <!-- Updated: Validation Session 2 - cross-user fallback -->
     1. **`userId !== currentUser.id`** → LEGACY path: call `userIssueService.getUserProfileIssues(workspaceSlug, userId, params)` for the current workspace only (toggle is hidden anyway). Map result → `EnrichedIssue[]`. NO new endpoint call.
     2. **`import.meta.env.VITE_USE_AGGREGATE_PROFILE_ENDPOINT === "false"`** → feature-flag fallback: legacy fan-out across `useWorkspace().workspaces` (preserves Session 1 rollback path).
     3. **Else (self + flag on)** → new aggregate `CEUserWorkItemsService.list(kind, { workspace: !crossWorkspaces ? slug : undefined })`.
   - Use `useSWRImmutable` (rules of thumb: data semi-static for short page-life)
   - Return `{ data, isLoading, error }`

4. **Refactor `today-work-items.tsx`**:
   - Remove `useWorkspace().workspaces`, `projectService`, `stateService`, fan-out `Promise.all`
   - Replace with `const { data, isLoading } = useUserWorkItems("today", crossWorkspaces, workspaceSlug?.toString())`
   - Keep `useTaskCategory` enrichment, keep `EXCLUDED_STATE_GROUPS` defensive filter, keep XLSX export
   - **Hide cross-workspace toggle** when `userId !== currentUser.id`: `const isSelf = userId === currentUser?.id;` and conditionally render the toggle. <!-- Updated: Validation Session 1 - hide toggle on other-user profiles -->
   - File should drop ~60 lines

5. **Refactor `overdue-work-items.tsx`**: same pattern, kind=`"overdue"`

6. **Update types**: extend `EnrichedIssue` is already in `work-items-table.tsx` — confirm new endpoint returns matching shape (per Phase 1 serializer design).

7. **Lint + format:**

   ```bash
   pnpm check:lint --filter=web
   pnpm check:format
   ```

8. **Manual smoke:** Open profile page, watch Network tab → expect 1 call to `/work-items/today/` + 1 to `/work-items/overdue/` instead of 600.

## Todo List

- [x] grep search-before-build
- [x] Create `ce/services/user-work-items.service.ts`
- [x] Create `ce/hooks/store/use-user-work-items.ts` with 3-branch fetcher: cross-user-legacy → flag-off-fan-out → self-aggregate
- [x] Verify cross-user path on `/profile/<otherUid>/` returns correct teammate's work items (legacy endpoint regression check)
- [x] Refactor `today-work-items.tsx` (use hook + hide toggle when not self)
- [x] Refactor `overdue-work-items.tsx` (use hook + hide toggle when not self)
- [x] Verify `EnrichedIssue` shape matches backend response
- [x] Verify feature flag fallback path works (`VITE_USE_AGGREGATE_PROFILE_ENDPOINT=false`)
- [x] `pnpm check:lint`
- [x] `pnpm check:format`
- [x] Browser smoke: ≤4 calls in Network tab for these 2 components
- [x] Verify XLSX export still works

## Success Criteria

- File line counts: each component <150 lines, hook <100, service <50
- Network tab: only 2 calls for Today + Overdue (down from 600)
- Toggle `crossWorkspaces` off → calls switch to `?workspace=<slug>` and return current-workspace-only data
- XLSX export contains all rows shown
- `pnpm check:lint` clean
- No type `any` introduced

## Risk Assessment

| Risk                                                                   | Likelihood | Impact | Mitigation                                                                                                                                                                                          |
| ---------------------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend response shape mismatch with `EnrichedIssue`                   | Med        | High   | Phase 1 designs serializer to match; integration test in Phase 7                                                                                                                                    |
| SWR key collision between Today & Overdue                              | Low        | Med    | Prefix with `kind`; verify with React DevTools                                                                                                                                                      |
| `useTaskCategory` store not loaded → category names empty              | Low        | Low    | Existing `useEffect(fetchCategories)` retained                                                                                                                                                      |
| `crossWorkspaces=true` for non-self profile (`profile/{otherUserId}/`) | Low        | Med    | Hook routes non-self to LEGACY `WorkspaceUserProfileIssuesEndpoint` per-workspace path (Session 2 decision); toggle hidden so user cannot trigger cross-ws on others. New endpoint stays self-only. |
| Loss of per-workspace error isolation (one bad ws killed entire fetch) | Low        | Med    | Backend single-query naturally degrades — already covered by try/catch wrapping                                                                                                                     |

## Security Considerations

- Endpoint enforces `request.user` server-side — frontend cannot escalate to other user's work items.
- No localStorage/cookie change.
- Same i18n keys reused (no new strings).

## Next Steps

- Phase 5 dedupes other profile fetches if needed
- Phase 7 adds component smoke test
- Update breadcrumb/UI hint that toggle now toggles "all workspaces" via 1 call (no behavior diff to user, just speed)

## Unresolved Questions

(All resolved in Validation Session 1 — see plan.md `## Validation Log`)
