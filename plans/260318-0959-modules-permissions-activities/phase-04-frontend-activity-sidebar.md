# Phase 4: Frontend Activity Sidebar

## Context Links

- [Plan Overview](plan.md)
- Depends on: [Phase 2](phase-02-backend-module-activity.md)
- Reference: `apps/web/ce/components/issues/worklog/activity/` (worklog activity pattern)
- Reference: `apps/web/core/components/issues/issue-detail/issue-activity/` (issue activity pattern)

## Overview

- **Priority**: P2
- **Status**: completed
- **Effort**: 2.5h
- **Description**: Add an Activities section to the module detail sidebar (`ModuleAnalyticsSidebar`) showing chronological module lifecycle events. Includes new service, store, types, and UI components.

## Key Insights

- Sidebar (`root.tsx`) is already 445 lines. Adding activity inline would exceed 200-line limit. Must extract into separate component.
- CE pattern: new features go in `apps/web/ce/`. Create activity components there.
- Store pattern: `ModuleActivityStore` in CE, hook in `core/hooks/store/`.
- Service pattern: new service file for API calls.
- Activity display: simple timeline list with actor avatar, action description, timestamp. No comments or reactions needed.
- Sidebar already has a Disclosure pattern (Links section). Activity section should follow same pattern.

## Requirements

- Activities section in sidebar below Links section
- Disclosure component (collapsible), default open if activities exist
- Each activity item shows: actor avatar + name, action text (e.g., "changed status from Planned to In Progress"), relative timestamp
- Paginated loading (load more button or infinite scroll)
- Activities fetched on sidebar mount, cached in store
- Empty state: "No activities yet" text

## Architecture

```
New files:
├── packages/types/src/module/module-activity.ts          # IModuleActivity type
├── apps/web/ce/services/module-activity.service.ts       # API service
├── apps/web/ce/store/module-activity.store.ts            # MobX store (with cursor pagination)
├── apps/web/core/hooks/store/use-module-activity.ts      # Store hook
├── apps/web/ce/components/modules/activity/              # UI components
│   ├── index.ts
│   ├── module-activity-list.tsx                          # Main list with "Load more"
│   ├── module-activity-item.tsx                          # Single activity row
│   └── module-sidebar-activities.tsx                     # Sidebar Disclosure wrapper
```
<!-- Updated: Validation Session 1 - Added sidebar wrapper, noted cursor pagination -->

**Data flow:**
1. Sidebar mounts -> calls `moduleActivityStore.fetchActivities(workspaceSlug, projectId, moduleId)`
2. Store calls service -> `GET /api/workspaces/:slug/projects/:pid/modules/:mid/activities/`
3. Store caches activities by moduleId in `ObservableMap`
4. Components observe store and render timeline

## Related Code Files

- **Modify**: `apps/web/core/components/modules/analytics-sidebar/root.tsx` -- add Activity Disclosure section
- **Modify**: `packages/types/src/module/index.ts` or `modules.ts` -- export new type (if index exists)
- **Modify**: `packages/types/src/index.ts` -- export module activity type
- **Modify**: `apps/web/ce/store/root.store.ts` -- add `moduleActivity` store
- **Create**: `packages/types/src/module/module-activity.ts`
- **Create**: `apps/web/ce/services/module-activity.service.ts`
- **Create**: `apps/web/ce/store/module-activity.store.ts`
- **Create**: `apps/web/core/hooks/store/use-module-activity.ts`
- **Create**: `apps/web/ce/components/modules/activity/index.ts`
- **Create**: `apps/web/ce/components/modules/activity/module-activity-list.tsx`
- **Create**: `apps/web/ce/components/modules/activity/module-activity-item.tsx`
- **Create**: `apps/web/ce/components/modules/activity/module-sidebar-activities.tsx` (Disclosure wrapper)
<!-- Updated: Validation Session 1 - Added sidebar wrapper component -->

## Embedded Rules

```
- observer() from mobx-react on all MobX-reading components
- t() from @plane/i18n for all user-facing strings
- Semantic tokens: text-primary, text-secondary, text-tertiary, border-subtle, bg-surface-1
- @plane/propel/* subpath imports for new code
- makeObservable (explicit), set() from lodash-es, runInAction() for async
- CE components use @/plane-web/ path alias
- Files <200 lines, components <150 lines
- kebab-case file names
```

## Implementation Steps

1. **Create `IModuleActivity` type**
   - File: `packages/types/src/module/module-activity.ts` (new, ~30 lines)
   ```typescript
   export interface IModuleActivity {
     id: string;
     module: string;
     actor: string;
     actor_detail: {
       id: string;
       first_name: string;
       last_name: string;
       display_name: string;
       avatar: string;
       avatar_url: string;
     };
     verb: string;
     field: string | null;
     old_value: string | null;
     new_value: string | null;
     epoch: number | null;
     created_at: string;
     updated_at: string;
     created_by: string;
   }
   ```

2. **Export type from package**
   - Check if `packages/types/src/module/index.ts` exists. If not, check how modules.ts is exported.
   - Add `export * from "./module-activity"` to the appropriate barrel file.
   - Ensure `packages/types/src/index.ts` exports it.

3. **Create `ModuleActivityService`**
   - File: `apps/web/ce/services/module-activity.service.ts` (new, ~40 lines)
   ```typescript
   import { APIService } from "@/services/api.service";
   import type { IModuleActivity } from "@plane/types";
   import { API_BASE_URL } from "@/helpers/common.helper";

   export class ModuleActivityService extends APIService {
     constructor() {
       super(API_BASE_URL);
     }

     async fetchActivities(
       workspaceSlug: string,
       projectId: string,
       moduleId: string,
       cursor?: string
     ): Promise<TPaginationInfo<IModuleActivity>> {
       const params = cursor ? `?cursor=${cursor}` : "";
       return this.get(
         `/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/activities/${params}`
       ).then((response) => response?.data);
     }
   }
   ```
   <!-- Updated: Validation Session 5 - Service return type matches real BasePaginator response: { results, next_cursor (encoded string), next_page_results (boolean), total_count, prev_cursor, ... } -->
   - **API response shape** (from `BasePaginator.paginate`): `{ results: T[], next_cursor: string, prev_cursor: string, next_page_results: boolean, prev_page_results: boolean, total_count: number, count: number, total_pages: number, total_results: number, grouped_by: null, sub_grouped_by: null, extra_stats: null }`
   - Use existing `TPaginationInfo` type if available, or define inline. Key fields: `results`, `next_cursor`, `next_page_results`.

4. **Create `ModuleActivityStore`**
   - File: `apps/web/ce/store/module-activity.store.ts` (new, ~80 lines)
   ```typescript
   import { makeObservable, observable, action, runInAction } from "mobx";
   import { set } from "lodash-es";
   import type { IModuleActivity } from "@plane/types";
   import { ModuleActivityService } from "@/plane-web/services/module-activity.service";

   export interface IModuleActivityStore {
     activitiesMap: Record<string, IModuleActivity[]>;
     loader: boolean;
     fetchActivities: (
       workspaceSlug: string, projectId: string, moduleId: string
     ) => Promise<IModuleActivity[]>;
     getActivitiesByModuleId: (moduleId: string) => IModuleActivity[] | undefined;
   }

   export class ModuleActivityStore implements IModuleActivityStore {
     activitiesMap: Record<string, IModuleActivity[]> = {};
     nextCursorMap: Record<string, string | null> = {};
     nextPageResultsMap: Record<string, boolean> = {};
     loader: boolean = false;
     moduleActivityService: ModuleActivityService;

     constructor() {
       makeObservable(this, {
         activitiesMap: observable,
         nextCursorMap: observable,
         nextPageResultsMap: observable,
         loader: observable.ref,
         fetchActivities: action,
       });
     <!-- Updated: Validation Session 7 - Added nextPageResultsMap as separate observable -->
       this.moduleActivityService = new ModuleActivityService();
     }

     getActivitiesByModuleId = (moduleId: string) =>
       this.activitiesMap[moduleId];

     hasMore = (moduleId: string) =>
       !!this.nextPageResultsMap[moduleId];
     // NOTE: Use next_page_results boolean, NOT next_cursor string presence

     fetchActivities = async (
       workspaceSlug: string, projectId: string, moduleId: string,
       loadMore: boolean = false
     ) => {
       this.loader = true;
       const cursor = loadMore ? this.nextCursorMap[moduleId] : undefined;
       try {
         const response = await this.moduleActivityService.fetchActivities(
           workspaceSlug, projectId, moduleId, cursor ?? undefined
         );
         runInAction(() => {
           const existing = loadMore ? (this.activitiesMap[moduleId] ?? []) : [];
           set(this.activitiesMap, moduleId, [...existing, ...response.results]);
           set(this.nextCursorMap, moduleId, response.next_cursor ?? null);
           set(this.nextPageResultsMap, moduleId, response.next_page_results ?? false);
           this.loader = false;
         });
         return response.results;
       } catch (error) {
         runInAction(() => { this.loader = false; });
         throw error;
       }
     };

     // Refresh: clears cache for moduleId and refetches first page
     refreshActivities = async (
       workspaceSlug: string, projectId: string, moduleId: string
     ) => {
       delete this.activitiesMap[moduleId];
       delete this.nextCursorMap[moduleId];
       delete this.nextPageResultsMap[moduleId];
       return this.fetchActivities(workspaceSlug, projectId, moduleId);
     };
   }
   <!-- Updated: Validation Session 5 - next_page_results boolean for hasMore, refreshActivities method added -->
   ```

5. **Add store to CE RootStore**
   - File: `apps/web/ce/store/root.store.ts`
   - Import and instantiate `ModuleActivityStore`
   - Add `moduleActivity: IModuleActivityStore` to root store interface and constructor

6. **Create store hook**
   - File: `apps/web/core/hooks/store/use-module-activity.ts` (new, ~10 lines)
   ```typescript
   import { useContext } from "react";
   import { StoreContext } from "@/lib/store-context";
   import type { IModuleActivityStore } from "@/plane-web/store/module-activity.store";

   export const useModuleActivity = (): IModuleActivityStore => {
     const context = useContext(StoreContext);
     if (context === undefined)
       throw new Error("useModuleActivity must be used within StoreProvider");
     return context.moduleActivity;
   };
   ```

7. **Create `ModuleActivityItem` component**
   - File: `apps/web/ce/components/modules/activity/module-activity-item.tsx` (new, ~70 lines)
   - Display: actor avatar (small circle), action text, relative time
   - Action text generation based on verb+field using `modules` i18n namespace:
     - `created` + null field -> `t("modules:activity.created_module")`
     - `updated` + `name` -> `t("modules:activity.changed_name", { old, new })`
     - `updated` + `status` -> `t("modules:activity.changed_status", { old, new })`
     - `updated` + `lead` -> `t("modules:activity.changed_lead")`
     - `updated` + `members` -> `t("modules:activity.updated_members")`
     - `updated` + `work_items` -> `t("modules:activity.updated_work_items")`
     - `deleted` -> `t("modules:activity.deleted_module")`
     - `archived` -> `t("modules:activity.archived_module")`
     - `unarchived` -> `t("modules:activity.unarchived_module")`
   - Use `t()` for all strings (namespace: `modules`)
   <!-- Updated: Validation Session 6 - Use modules namespace, not common -->
   - Use `calculateTimeAgo` or similar helper for relative timestamps

8. **Create `ModuleActivityList` component**
   - File: `apps/web/ce/components/modules/activity/module-activity-list.tsx` (new, ~80 lines)
   - Props: `workspaceSlug: string; projectId: string; moduleId: string`
   <!-- Updated: Validation Session 7 - Add workspaceSlug and projectId as explicit props -->
   - On mount: fetch activities via store
   - Render: list of `ModuleActivityItem` components
   - Loading state: Loader placeholder
   - Empty state: "No activities yet" message
   - Wrap with `observer()` from mobx-react

9. **Create barrel export**
   - File: `apps/web/ce/components/modules/activity/index.ts`
   ```typescript
   export { ModuleActivityList } from "./module-activity-list";
   ```

10. **Create `ModuleSidebarActivities` wrapper component**
    - File: `apps/web/ce/components/modules/activity/module-sidebar-activities.tsx` (new, ~30 lines)
    - Props: `workspaceSlug: string; projectId: string; moduleId: string`
    - Owns the Disclosure logic — Disclosure button, chevron, transition, panel
    - Renders `<ModuleActivityList workspaceSlug={workspaceSlug} projectId={projectId} moduleId={moduleId} />` inside the panel
    <!-- Updated: Validation Session 7 - Pass workspaceSlug/projectId through to list -->
    - Use `t("modules:activity.title")` for the section label
    - Follow exact same Disclosure markup pattern as the Links section in root.tsx
    <!-- Updated: Validation Session 6 - Extract to wrapper component; not inline in root.tsx -->

11. **Add Activities section to sidebar via wrapper**
    - File: `apps/web/core/components/modules/analytics-sidebar/root.tsx`
    - Import `ModuleSidebarActivities` from `@/plane-web/components/modules/activity`
    - After the Links Disclosure section (line ~440), add:
    ```tsx
    <ModuleSidebarActivities
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      moduleId={moduleId}
    />
    ```
    <!-- Updated: Validation Session 7 - Pass workspaceSlug/projectId props -->
    <!-- Updated: Validation Session 6 - One-line import replaces inline Disclosure block -->

## Post-Phase Checklist

- [ ] All new files use kebab-case naming
- [ ] All components wrapped with `observer()` where reading store
- [ ] All user-facing strings use `t()`
- [ ] Color tokens use semantic names (text-primary, text-secondary, etc.)
- [ ] Store uses `makeObservable` with explicit observables
- [ ] Store uses `runInAction` for async state mutations
- [ ] Files <200 lines, components <150 lines
- [ ] `pnpm check:lint` passes
- [ ] Import paths use `@/plane-web/` for CE code
- [ ] Types exported from `@plane/types`

## Todo List

- [ ] Create `IModuleActivity` type
- [ ] Export type from packages
- [ ] Create `ModuleActivityService`
- [ ] Create `ModuleActivityStore`
- [ ] Add store to CE RootStore
- [ ] Create store hook
- [ ] Create `ModuleActivityItem` component
- [ ] Create `ModuleActivityList` component
- [ ] Create barrel export
- [ ] Create `module-sidebar-activities.tsx` Disclosure wrapper
- [ ] Import wrapper in sidebar `root.tsx` (instead of inline Disclosure)
- [ ] Add i18n keys to en.json (activity, verb descriptions, empty state)
- [ ] Wire `refreshActivities` after all 4 mutations in module store via `this._rootStore.moduleActivity.refreshActivities(workspaceSlug, projectId, moduleId)`: `updateModuleDetails`, `createModule`, `deleteModule`, `addIssuesToModule`/`removeIssueFromModule`
<!-- Updated: Validation Session 7 - Use rootStore reference in module store to call refreshActivities -->
- [ ] Run `pnpm check:lint`
- [ ] Manual test: verify activities render in sidebar
- [ ] Manual test: verify activities refresh after module edit
- [ ] Mark phase complete

## Success Criteria

- Activities section appears in module sidebar below Links
- Activities load on sidebar open, show loading state
- Each activity shows: who did what, when (relative time)
- Empty state shown when no activities
- Activities refresh after module mutations
- No visual regressions to existing sidebar

## Risk Assessment

- **Medium**: Sidebar file is 445 lines. Adding activity import + Disclosure adds ~15 lines. Still large but under control since most content is in new component.
- **Low**: Store/service pattern is well-established; following existing patterns.
- ~~**Medium**: API response format may differ from expected.~~ **Resolved (Session 5)**: Verified `BasePaginator` response shape. Service/store updated to match.

## Security Considerations

- Activities are read-only -- no mutation endpoints on frontend
- Accessible to all project members (matching backend permissions)
- No sensitive data displayed (just action descriptions)

## Next Steps

- After all 4 phases complete, full integration test
- Consider adding activity refresh on sidebar re-open or after mutations
- Future: add real-time activity updates via WebSocket (out of scope)

---

## Resolved Questions (Validation Session 1)
<!-- Updated: Validation Session 1 - All unresolved questions resolved -->

1. **Pagination strategy**: ✅ Cursor-based pagination. Fetch first 20, show "Load more" button if `next_cursor` exists.
2. **Activity refresh**: ✅ Auto-refresh after mutations. Refetch activities after `updateModuleDetails` / module CRUD succeeds.
3. **Sidebar file size**: ✅ Extract into wrapper. Create `module-sidebar-activities.tsx` (~30 lines) that renders Disclosure + `ModuleActivityList`.
