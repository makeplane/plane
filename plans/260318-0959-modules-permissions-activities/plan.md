---
title: "Modules: Admin-Only UI Permissions + Activity Tracking"
description: "Hide module create/edit/delete buttons for non-admin users and add activity log to module sidebar"
status: completed
priority: P2
effort: 6h
branch: ngoc-feat/workspaces
tags: [modules, permissions, activity, ce]
created: 2026-03-18
updated: 2026-03-18
---

# Modules: Admin-Only UI Permissions + Activity Tracking

## Summary

Two features:
1. **Permission Control (frontend-only)** -- Hide module create/edit/delete buttons for non-admin users. No backend permission changes needed.
2. **Activity Tracking** -- Add Activities section to `ModuleAnalyticsSidebar` showing module lifecycle events.

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| ~~1~~ | ~~Backend Permissions~~ | ~~1h~~ | removed | ~~[phase-01](phase-01-backend-permissions.md)~~ |
| 2 | Backend Module Activity | 3h | completed | [phase-02](phase-02-backend-module-activity.md) |
| 3 | Frontend Permissions (UI-only) | 0.5h | completed | [phase-03](phase-03-frontend-permissions.md) |
| 4 | Frontend Activity Sidebar | 2.5h | completed | [phase-04](phase-04-frontend-activity-sidebar.md) |

## Dependency Graph

```
Phase 2 (backend activity) ── Phase 4 (frontend activity)
Phase 3 (frontend perms)  -- independent, no backend dependency
```

Phases 2 and 3 are independent. Phase 4 depends on 2.

## Key Decisions

- **No backend permission changes** -- just hide UI buttons for non-admin users (frontend-only approach)
- New `ModuleActivity` model in `apps/api/plane/db/models/module.py` -- simple fields: module FK, actor FK, verb, field, old_value, new_value, epoch
- Activity logged in-view after mutations (no Celery needed -- simpler than issue activities)
- Frontend: new CE components for activity display in sidebar
- `ModuleActivityStore` in `apps/web/ce/store/module-activity.store.ts`

## Files Overview

### Backend (Modify)
- `apps/api/plane/db/models/module.py` -- add `ModuleActivity` model
- `apps/api/plane/db/models/__init__.py` -- export `ModuleActivity`

### Backend (Create)
- `apps/api/plane/app/views/module/activity.py` -- activity list endpoint
- Migration file for `ModuleActivity`

### Frontend (Modify)
- `apps/web/core/components/modules/analytics-sidebar/root.tsx` -- change permission check, add activity section
- `apps/web/core/components/modules/module-list-item-action.tsx` -- hide edit/delete for non-ADMIN
- `apps/web/core/components/modules/module-card-item.tsx` -- hide edit/delete for non-ADMIN
- `apps/web/core/components/modules/quick-actions.tsx` -- hide edit/delete/archive for non-ADMIN
- `apps/web/core/components/modules/modules-list-view.tsx` -- hide create for non-ADMIN

### Frontend (Create)
- `apps/web/ce/store/module-activity.store.ts`
- `apps/web/ce/services/module-activity.service.ts`
- `apps/web/ce/components/modules/activity/` -- activity UI components
- `packages/types/src/module/module-activity.ts` -- types

## Validation Log

### Session 1 — 2026-03-18
**Trigger:** Initial plan validation before implementation
**Questions asked:** 4

#### Questions & Answers

1. **[Permissions]** The plan removes `creator=True` from module destroy, so members who created a module can no longer delete it — only ADMINs can. Is this the intended behavior?
   - Options: Yes, ADMIN-only delete (Recommended) | Keep creator=True fallback
   - **Answer:** Yes, ADMIN-only delete
   - **Rationale:** Simplifies permission model — all module lifecycle mutations are admin-only, no exceptions. Removes edge case where member-creators had elevated privileges.

2. **[Work Items]** Should module work item add/remove (assigning issues to modules) remain accessible to both ADMIN and MEMBER roles?
   - Options: Yes, keep ADMIN+MEMBER (Recommended) | No, restrict to ADMIN only
   - **Answer:** Yes, keep ADMIN+MEMBER
   - **Rationale:** Work item assignment is a day-to-day member action. Only module lifecycle (CRUD, archive) is admin-restricted.

3. **[Activity Scope]** The plan logs activities in both App views AND API views (/api/v1/). Should we instrument both, or only App views?
   - Options: Both App + API views (Recommended) | App views only | Shared helper, single code path
   - **Answer:** App views only
   - **Rationale:** API v1 views are rarely used externally. Reduces implementation scope. If needed later, can add to API views using the same helper.

4. **[Activity UI]** Phase 4 has 3 unresolved questions: (1) pagination strategy, (2) auto-refresh after edits, (3) extracting sidebar wrapper component. Which approach?
   - Options: Fetch all + refresh + extract (Recommended) | Paginate + refresh + extract | Fetch all + no refresh + inline
   - **Answer:** Paginate + refresh + extract
   - **Rationale:** Cursor-based pagination with "Load more" is more scalable for modules with many activities. Auto-refresh after mutations ensures fresh data. Extracted wrapper keeps sidebar under 200-line limit.

#### Confirmed Decisions
- **Module delete**: ADMIN-only, no creator fallback — simplifies permission model
- **Work items**: ADMIN+MEMBER — day-to-day member action, not restricted
- **Activity logging scope**: App views only — reduces scope, API v1 rarely used
- **Activity UI**: Cursor pagination + auto-refresh + extracted sidebar wrapper component

#### Action Items
- [ ] Remove activity logging from API views in Phase 2 (steps 13, related files)
- [ ] Update Phase 4 to use cursor-based pagination with "Load more"
- [ ] Update Phase 4 to add auto-refresh after module mutations
- [ ] Update Phase 4 to extract Activity Disclosure into wrapper component

#### Impact on Phases
- Phase 1: No changes needed (ADMIN-only delete already planned)
- Phase 2: Remove steps related to API view activity logging (step 13). Remove `apps/api/plane/api/views/module.py` from activity-related modifications. Reduces effort.
- Phase 3: No changes needed
- Phase 4: Update pagination to cursor-based with "Load more" button. Add auto-refresh on mutation. Extract Activity Disclosure into `module-sidebar-activities.tsx` wrapper.

### Session 2 — 2026-03-18
**Trigger:** Re-validation — user clarified that only admins edit module info, but members can still add/remove work items per existing rules
**Questions asked:** 3

#### Questions & Answers

1. **[Links]** The sidebar's `isEditingAllowed` controls both module info AND module links (add/edit/delete links). Should link management also be ADMIN-only, or should members be able to manage links like they can manage work items?
   - Options: ADMIN-only (Recommended) | ADMIN+MEMBER
   - **Answer:** ADMIN-only
   - **Rationale:** Links are module metadata, not day-to-day work item operations. Keeping them under the same `isEditingAllowed` gate as other module info is simpler — no need to split permission checks in the sidebar.

2. **[Favorites]** Phase 3 changes `isEditingAllowed` in `module-card-item.tsx` which controls the favorite toggle and status dropdown on cards. Should members still be able to favorite modules (personal preference, no module mutation)?
   - Options: Yes, keep favorites for all (Recommended) | No, ADMIN-only for everything on card
   - **Answer:** Yes, keep favorites for all
   - **Rationale:** Favorite is a personal user preference stored on the user, not a module mutation. Must ensure the favorite toggle is NOT gated behind `isEditingAllowed` in card/list components.

3. **[UX Signal]** Should the module detail sidebar show a visual indicator (banner/badge) to non-admin members that module editing is restricted? Or just silently disable the controls?
   - Options: Silently disable (Recommended) | Show read-only badge | Tooltip on disabled fields
   - **Answer:** Silently disable
   - **Rationale:** Consistent with how other permission restrictions work in Plane. No extra UI needed.

#### Confirmed Decisions
- **Links**: ADMIN-only — same gate as module info, no split needed
- **Favorites**: Available to all members — personal preference, not a module mutation. Must separate from `isEditingAllowed`
- **UX**: Silently disable — no badge or tooltip needed

#### Action Items
- [ ] Phase 3: Ensure favorite toggle in `module-card-item.tsx` and `module-list-item-action.tsx` is NOT gated by `isEditingAllowed`
- [ ] Phase 3: Verify work item add/remove UI components are not affected by the permission change

#### Impact on Phases
- Phase 1: No changes needed
- Phase 2: No changes needed
- Phase 3: Must ensure favorite toggle is excluded from `isEditingAllowed` gate in card/list components. Verify work item UI unchanged.
- Phase 4: No changes needed

### Session 3 — 2026-03-18
**Trigger:** Final validation — CE pattern compliance, pagination implementation gap, data retention
**Questions asked:** 3

#### Questions & Answers

1. **[CE Pattern]** Phase 3 modifies 5 files in `core/components/modules/` (permission constant swaps). CLAUDE.md says 'never modify core/ except app router layouts and hook files'. Should we modify core directly or create CE component overrides?
   - Options: Modify core directly (Recommended) | Create CE overrides
   - **Answer:** Modify core directly
   - **Rationale:** Permission constant swap is minimal — not adding new features. CE overrides would duplicate entire components for a 1-line change. Pragmatic exception to the rule.

2. **[Pagination]** Phase 4 store code shows a simple fetch-all pattern, but Session 1 decided on cursor-based pagination with 'Load more'. Should the store track cursor state and support incremental loading?
   - Options: Cursor pagination in store (Recommended) | Fetch all, no pagination | Fetch first page only
   - **Answer:** Cursor pagination in store
   - **Rationale:** Matches Session 1 decision. Store tracks next_cursor per module, fetchActivities appends results, 'Load more' triggers next page.

3. **[Data Retention]** Phase 2 uses CASCADE on module FK. When module is hard-deleted, all activities are lost. Should activities survive module hard-deletion for audit trail?
   - Options: CASCADE is fine (Recommended) | SET_NULL on module FK
   - **Answer:** CASCADE is fine
   - **Rationale:** Hard deletes are rare in Plane (soft-delete is default). Simpler model. Acceptable tradeoff.

#### Confirmed Decisions
- **Core modifications**: Allowed for Phase 3 permission constant swaps — pragmatic exception, not new features
- **Pagination**: Cursor-based in store with next_cursor tracking per module, append on "Load more"
- **Data retention**: CASCADE on module FK — acceptable for soft-delete-default codebase

#### Action Items
- [ ] Phase 4: Update store implementation to track `next_cursor` per module and support incremental append

#### Impact on Phases
- Phase 1: No changes needed
- Phase 2: No changes needed (CASCADE confirmed)
- Phase 3: No changes needed (core modifications approved)
- Phase 4: Store must implement cursor tracking — `nextCursorMap: Record<string, string | null>`, `fetchActivities` appends to existing array, `hasMore` computed from cursor presence

### Session 4 — 2026-03-18
**Trigger:** User simplification — non-admin users just need buttons hidden, no backend permission enforcement needed
**Questions asked:** 0

#### Confirmed Decisions
- **Phase 1 REMOVED**: No backend permission changes. Frontend-only approach — just hide create/edit/delete buttons for non-admin users.
- **Phase 3 simplified**: Pure UI hiding, no backend dependency. Effort reduced from 1.5h to 0.5h.
- **Total effort reduced**: 8h → 6h (removed 1h backend perms + reduced 1h frontend perms)

#### Impact on Phases
- Phase 1: **REMOVED** — no backend permission changes needed
- Phase 2: No changes
- Phase 3: Simplified to UI-only button hiding. No longer depends on Phase 1. Effort reduced to 0.5h.
- Phase 4: No changes

### Session 5 — 2026-03-18
**Trigger:** Code-level validation — pagination response shape mismatch, missing i18n keys, undefined refresh mechanism
**Questions asked:** 3

#### Questions & Answers

1. **[Pagination]** Phase 4 store assumes API returns `{ results, next_cursor }`, but actual `self.paginate()` returns `{ results, next_cursor: "100:0:0", next_page_results: true/false, total_count, ... }`. Should frontend match real paginator response?
   - Options: Match real paginator (Recommended) | Use per_page + offset instead
   - **Answer:** Match real paginator
   - **Rationale:** Service return type and store must use `next_cursor` encoded string + `next_page_results` boolean. Pass cursor string as `?cursor=` query param. Prevents runtime errors from shape mismatch.

2. **[i18n]** Phase 4 uses `t("common.activity")` but no such key exists in translation files. How to handle activity translation keys?
   - Options: Add keys to en.json (Recommended) | Hardcode English strings
   - **Answer:** Add keys to en.json
   - **Rationale:** Maintains i18n consistency. Need keys for "activity", verb descriptions ("created the module", "changed {field}", etc.).

3. **[Refresh]** Session 1 decided on auto-refresh after mutations, but no implementation detail. How should activity list refresh after module edits?
   - Options: Refetch in store method (Recommended) | Refetch in component via useEffect | No auto-refresh, manual only
   - **Answer:** Refetch in store method
   - **Rationale:** Add `refreshActivities(moduleId)` to `ModuleActivityStore`. Call it at the end of module mutation methods in existing module store (e.g., after `updateModuleDetails`). Keeps logic in store layer, not scattered in components.

#### Confirmed Decisions
- **Pagination shape**: Match real `BasePaginator` response — `next_cursor` is encoded string, use `next_page_results` boolean for hasMore
- **i18n**: Add translation keys to en.json for all activity strings
- **Refresh**: Store-level `refreshActivities()` method called after module mutations

#### Action Items
- [ ] Phase 4: Update service return type to match real paginator response shape (`next_cursor`, `next_page_results`, `total_count`, etc.)
- [ ] Phase 4: Update store to use `next_page_results` boolean for `hasMore` instead of checking cursor presence
- [ ] Phase 4: Add `refreshActivities(moduleId)` method that clears cache and refetches first page
- [ ] Phase 4: Add i18n keys to en.json for activity-related strings
- [ ] Phase 4: Call `refreshActivities` from module store after mutation methods

#### Impact on Phases
- Phase 2: No changes needed (backend paginator is correct as-is)
- Phase 3: No changes needed
- Phase 4: Multiple updates — service response type, store pagination logic, refresh method, i18n keys. See action items above.

### Session 6 — 2026-03-18
**Trigger:** Final validation — sidebar wrapper contradiction, i18n namespace, refresh trigger scope
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Phase 4 Todo says to create `module-sidebar-activities.tsx` as a Disclosure wrapper, but Step 10 shows the Disclosure inline in `root.tsx`. Which approach?
   - Options: Extract wrapper component | Inline in root.tsx
   - **Answer:** Extract wrapper component
   - **Rationale:** `ModuleSidebarActivities` owns the Disclosure logic; root.tsx just renders `<ModuleSidebarActivities moduleId={moduleId} />`. Keeps sidebar file lean and respects component size limits.

2. **[i18n]** Which i18n namespace should activity strings go in?
   - Options: modules namespace | common namespace | New module-activity namespace
   - **Answer:** modules namespace
   - **Rationale:** All module strings already live in `modules` namespace. Activity strings (verb descriptions, empty state) stay co-located. Keys like `modules:activity.created_module`.

3. **[Architecture]** Which module store mutation methods should call `refreshActivities`?
   - Options: updateModuleDetails | createModule | deleteModule | addIssuesToModule / removeIssueFromModule
   - **Answer:** All four
   - **Rationale:** Every mutation that generates an activity record should trigger a refresh so the sidebar always reflects current state.

#### Confirmed Decisions
- **Sidebar wrapper**: Extract `module-sidebar-activities.tsx` component — root.tsx imports and renders it, not inline
- **i18n namespace**: `modules` namespace — keys like `modules:activity.created_module`, `modules:activity.no_activities`
- **Refresh triggers**: All 4 mutations — `updateModuleDetails`, `createModule`, `deleteModule`, `addIssuesToModule`/`removeIssueFromModule`

#### Action Items
- [ ] Phase 4: Replace Step 10 inline Disclosure with import of `ModuleSidebarActivities` in root.tsx
- [ ] Phase 4: i18n keys use `modules` namespace prefix
- [ ] Phase 4: Wire `refreshActivities` after all 4 mutation methods in module store

#### Impact on Phases
- Phase 4: Step 10 changes from inline Disclosure to `<ModuleSidebarActivities moduleId={moduleId} />`. i18n keys under `modules:` namespace. Refresh wired to all 4 mutations.

### Session 7 — 2026-03-18
**Trigger:** Code-level bug fixes — store property mismatch, missing props, refresh wiring pattern
**Questions asked:** 3

#### Questions & Answers

1. **[Store Bug]** Phase 4 store code references `this.nextPageResultsMap` in `hasMore` and `fetchActivities`, but the observable is declared as `nextCursorMap` — `nextPageResultsMap` is never defined. How to fix?
   - Options: Add `nextPageResultsMap` as separate observable | Derive hasMore from nextCursorMap
   - **Answer:** Add `nextPageResultsMap` as separate observable
   - **Rationale:** Declare `nextPageResultsMap: Record<string, boolean> = {}` alongside `nextCursorMap`, add to makeObservable. Both cursor and hasMore tracked separately. Matches `next_page_results` boolean from API response.

2. **[Props Gap]** `ModuleActivityList` props are `{ moduleId }` only, but `fetchActivities(workspaceSlug, projectId, moduleId)` needs all three. How should workspaceSlug and projectId reach the component?
   - Options: Add to props (Recommended) | Read from router in component
   - **Answer:** Add to props
   - **Rationale:** Pass `workspaceSlug` and `projectId` as explicit props from `ModuleSidebarActivities` down to `ModuleActivityList`. Clear, testable data flow.

3. **[Refresh Wiring]** Phase 4 says wire `refreshActivities` into module store mutations, but those methods live in the module store — how should it access `moduleActivity`?
   - Options: Pass rootStore to module store (Recommended) | Refresh in component via useEffect
   - **Answer:** Pass rootStore to module store
   - **Rationale:** Module store already receives rootStore in constructor. Call `this._rootStore.moduleActivity.refreshActivities(...)` after mutations. Keeps refresh logic in store layer.

#### Confirmed Decisions
- **Store fix**: Add `nextPageResultsMap: Record<string, boolean> = {}` as separate observable alongside `nextCursorMap`
- **Props**: `ModuleActivityList` receives `workspaceSlug`, `projectId`, `moduleId` as explicit props
- **Refresh wiring**: Use `this._rootStore.moduleActivity.refreshActivities(...)` in module store mutations

#### Action Items
- [ ] Phase 4: Add `nextPageResultsMap` observable property to store class and makeObservable
- [ ] Phase 4: Update `ModuleActivityList` and `ModuleSidebarActivities` interfaces to include `workspaceSlug` and `projectId` props
- [ ] Phase 4: Wire refresh via `this._rootStore.moduleActivity.refreshActivities(...)` in module store

#### Impact on Phases
- Phase 4: Store class needs `nextPageResultsMap` declared. Component props updated. Refresh wired through rootStore reference.
