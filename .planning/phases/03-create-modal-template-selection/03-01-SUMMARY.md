---
phase: 03-create-modal-template-selection
plan: 01
subsystem: frontend
tags:
  - typescript
  - project-templates
  - project-create
  - service-layer
requires:
  - phase: 01-template-catalog-foundation
    provides: Workspace project-template catalog endpoint and read serializer contract.
  - phase: 02-transactional-project-creation
    provides: Optional template_id handling during Project creation.
provides:
  - Frontend Project Template catalog types.
  - Optional template_id Project create payload typing.
  - Workspace project-template SWR fetch key.
  - ProjectService workspace template catalog fetch method.
  - Typed ProjectService and ProjectStore create payload plumbing.
affects:
  - 03-02 selector UI and submit-time template_id wiring
tech-stack:
  added: []
  patterns:
    - Service-layer API access for workspace project-template catalog.
    - Typed optional template_id payload instead of widening createProject to any.
key-files:
  created:
    - packages/types/src/project/project_templates.ts
  modified:
    - packages/types/src/project/projects.ts
    - packages/types/src/project/index.ts
    - packages/constants/src/fetch-keys.ts
    - apps/web/core/services/project/project.service.ts
    - apps/web/core/store/project/project.store.ts
key-decisions:
  - "Project template catalog fetching stays in ProjectService."
  - "Project create payload typing uses optional template_id without adding MobX selector state."
patterns-established:
  - "Project Template frontend contracts mirror the backend read serializer fields needed by the selector."
  - "ProjectStore.createProject forwards TProjectCreatePayload and remains free of transient template selection state."
requirements-completed:
  - PERM-02
  - UI-02
  - VER-05
coverage:
  - id: D1
    description: "Frontend template catalog contracts include the backend read serializer fields used by the selector."
    requirement: UI-02
    verification:
      - kind: other
        ref: "pnpm turbo run check:types --filter=@plane/types --filter=@plane/constants --filter=web"
        status: pass
      - kind: other
        ref: 'rg -n "TProjectTemplate|TProjectCreatePayload|WORKSPACE_PROJECT_TEMPLATES|getProjectTemplates" packages/types/src/project packages/constants/src apps/web/core/services/project apps/web/core/store/project'
        status: pass
    human_judgment: false
  - id: D2
    description: "Project create payload typing allows optional template_id and service/store create signatures use that payload."
    requirement: UI-02
    verification:
      - kind: other
        ref: "pnpm turbo run check:types --filter=@plane/types --filter=@plane/constants --filter=web"
        status: pass
      - kind: other
        ref: 'rg -n "getProjectTemplates|TProjectTemplate|TProjectCreatePayload" apps/web/core/services/project/project.service.ts apps/web/core/store/project/project.store.ts packages/types/src/project'
        status: pass
    human_judgment: false
  - id: D3
    description: "Template catalog access goes through ProjectService without backend schema, migration, serializer, or model changes."
    requirement: PERM-02
    verification:
      - kind: other
        ref: 'test "$(git diff --name-only | rg "^(apps/api|.*migrations|.*schema)" | wc -l)" -eq 0'
        status: pass
      - kind: other
        ref: "pnpm turbo run check:lint --filter=@plane/types --filter=@plane/constants --filter=web"
        status: pass
    human_judgment: false
  - id: D4
    description: "No transient selected-template observable or MobX action was added to ProjectStore."
    requirement: VER-05
    verification:
      - kind: other
        ref: 'test "$(rg -n "selectedTemplate|templateSelection|observable.*template|action.*template" apps/web/core/store/project/project.store.ts | wc -l)" -eq 0'
        status: pass
    human_judgment: false
duration: 35min
completed: 2026-07-01
status: complete
---

# Phase 03 Plan 01: Contracts And Service Plumbing Summary

**Typed Project Template catalog access and optional template_id create payload plumbing for the create Project modal.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-07-01T01:22:00Z
- **Completed:** 2026-07-01T01:57:23Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Added frontend Project Template types that mirror the backend catalog serializer fields needed by the selector.
- Added `TProjectCreatePayload` with optional `template_id` and a stable `WORKSPACE_PROJECT_TEMPLATES(workspaceSlug)` fetch key.
- Added `ProjectService.getProjectTemplates(workspaceSlug)` and typed ProjectService/ProjectStore createProject payloads without adding selector state to MobX.

## Task Commits

1. **Task 1: Add frontend project-template contracts and fetch key** - `fffbfa752` (feat)
2. **Task 2: Type ProjectService and ProjectStore create plumbing** - `0c095c23c` (feat)

## Files Created/Modified

- `packages/types/src/project/project_templates.ts` - New Project Template catalog and payload contracts.
- `packages/types/src/project/projects.ts` - Adds `TProjectCreatePayload` with optional `template_id`.
- `packages/types/src/project/index.ts` - Exports Project Template contracts.
- `packages/constants/src/fetch-keys.ts` - Adds `WORKSPACE_PROJECT_TEMPLATES(workspaceSlug)`.
- `apps/web/core/services/project/project.service.ts` - Adds catalog list method and typed create payload.
- `apps/web/core/store/project/project.store.ts` - Forwards typed create payload and keeps template selection out of store state.

## Decisions Made

- Project template catalog fetching stays in `ProjectService` so the selector can use a service-backed request in Plan 03-02.
- `template_id` is optional on `TProjectCreatePayload`; no-template submissions can omit the field entirely.
- The Project store remains a pass-through for create payload typing and does not gain selected-template observables or actions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Tooling blocker] Pre-commit denied existing Promise warnings in touched store file**

- **Found during:** Task 2 commit
- **Issue:** `oxlint --deny-warnings` flagged two existing `promise/always-return` warnings in `archiveProject` and `restoreProject` because `project.store.ts` was staged.
- **Fix:** Converted those two Promise chains to equivalent `async/await` with the same log-and-rethrow behavior.
- **Files modified:** `apps/web/core/store/project/project.store.ts`
- **Verification:** `pnpm exec oxlint --fix --deny-warnings apps/web/core/services/project/project.service.ts apps/web/core/store/project/project.store.ts`; plan-level type/lint checks passed.
- **Committed in:** `0c095c23c`

---

**Total deviations:** 1 auto-fixed tooling blocker.
**Impact on plan:** No scope change to template selection behavior; the refactor only allows the required hook to pass on a file already touched by the plan.

## Issues Encountered

Repo-wide web lint still reports many pre-existing warnings, but the configured command passed with 0 errors and stayed within the repo threshold. The two warnings in the touched store file were fixed so pre-commit could pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 03-02 can now build the selector UI on top of `TProjectTemplate`, fetch via `ProjectService.getProjectTemplates`, key SWR with `WORKSPACE_PROJECT_TEMPLATES`, and merge `template_id` into `TProjectCreatePayload` only when selected.

---

_Phase: 03-create-modal-template-selection_
_Completed: 2026-07-01_
