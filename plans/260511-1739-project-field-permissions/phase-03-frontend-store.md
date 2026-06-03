# Phase 03 — Frontend Types / Service / Store / Hook

## Context Links

- CE root store: `apps/web/ce/store/root.store.ts`
- CE workflow store (pattern reference): `apps/web/ce/store/workflow.store.ts`
- CE service pattern: `apps/web/ce/services/workflow.service.ts`
- Hook pattern: `apps/web/core/hooks/store/use-workflow.ts`
- Memory: MobX rules, CE pattern (root store extension)

## Overview

Priority: P2 | Status: pending
Frontend plumbing: type, API service, MobX store, store hook.

## Key Insights

- Per-project resource → use `ObservableMap<string, IProjectFieldPermission>` keyed by `${workspaceSlug}_${projectId}`.
- Hook returns store from `StoreContext` (mirror `use-workflow.ts`).
- Types live in `packages/types/src/` as `.ts`, exported via `index.ts`.

## Requirements

- Functional: fetch on project mount, update via service, expose `canMemberAction(slug, projectId, fieldKey)` computedFn.
- Non-functional: zero direct fetch in components (always via store action).

## Architecture

```
Component → useProjectFieldPermission()
        → store.fetchPermissions(slug, projectId) / updatePermissions(slug, projectId, payload)
        → ProjectFieldPermissionService → /api/v1/workspaces/<slug>/projects/<projectId>/field-permissions/
```

## Related Code Files

**Create**

- `packages/types/src/project-field-permission.ts`
- `apps/web/ce/services/project-field-permission.service.ts`
- `apps/web/ce/store/project-field-permission.store.ts`
- `apps/web/core/hooks/store/use-project-field-permission.ts`

**Modify**

- `packages/types/src/index.ts` — `export * from "./project-field-permission"`
- `apps/web/ce/store/root.store.ts` — register `projectFieldPermission`

## Implementation Steps

1. **Type** — `IProjectFieldPermission`: `{ id; workspace; project; allow_member_modify_completed_date; allow_member_modify_target_date; allow_member_modify_start_date; allow_member_delete_work_item }`. Plus enum `EProjectFieldPermissionKey`.
2. **Service** — class `ProjectFieldPermissionService extends APIService` with `fetch(slug, projectId)` and `update(slug, projectId, payload: Partial<IProjectFieldPermission>)`.
3. **Store** — `ProjectFieldPermissionStore` with `makeObservable`:
   - `permissionsMap: ObservableMap<string, IProjectFieldPermission>` (key = `${slug}_${projectId}`)
   - actions: `fetchPermissions(slug, projectId)`, `updatePermissions(slug, projectId, payload)` (both wrapped in `runInAction`)
   - computed-fn: `canMemberAction(slug, projectId, key)` → boolean
4. **Hook** — `useProjectFieldPermission()` reads `projectFieldPermission` from StoreContext.
5. **Register** store in `ce/store/root.store.ts` constructor.

## Todo List

- [ ] Type file
- [ ] Service file
- [ ] Store file
- [ ] Hook file
- [ ] Register in root.store.ts
- [ ] Verify type export in packages/types

## Success Criteria

- `useProjectFieldPermission()` returns typed store
- Calling `fetchPermissions(slug, projectId)` populates map
- Updating mutates observable + persists via API

## Risk Assessment

- **R:** Forgetting `runInAction` → mobx strict-mode error. Mitigation: copy pattern from `workflow.store.ts`.
- **R:** Key collision if `slug` or `projectId` contain `_`. Mitigation: use separator unlikely to collide (e.g. `:`), document constant.

## Security Considerations

- Frontend is UX-only; no security trust here.

## Next Steps

- Phase 04 (UI)
- Phase 05 (Form gating)
