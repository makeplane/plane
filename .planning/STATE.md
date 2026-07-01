---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: In Progress
stopped_at: Completed 04-03-PLAN.md
last_updated: "2026-07-01T11:55:00.000Z"
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 14
  completed_plans: 12
  percent: 85
---

# State: Plane Project Templates

**Initialized:** 2026-06-29
**Last updated:** 2026-07-01 after Phase 04-03 completion

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-06-29)

**Core value:** Creating a new Project should produce a useful, ready-to-work structure immediately instead of an empty shell that admins must configure by hand every time.
**Current focus:** Phase 04 — workspace-template-management

## Current Status

- Project initialized: yes
- Codebase mapped: yes
- Research complete: yes
- Requirements defined: yes
- Roadmap created: yes
- Active phase: 4

## Phase Progress

| Phase | Name                            | Status   | Progress |
| ----- | ------------------------------- | -------- | -------- |
| 1     | Template Catalog Foundation     | Complete | 100%     |
| 2     | Transactional Project Creation  | Complete | 100%     |
| 3     | Create Modal Template Selection | Complete | 100%     |
| 4     | Workspace Template Management   | Pending  | 0%       |

## Active Requirements

See `.planning/REQUIREMENTS.md` for the complete list and phase traceability.

## Codebase Context

Codebase map lives in `.planning/codebase/`.

High-signal paths for Phase 3:

- `apps/web/ce/components/projects/create/template-select.tsx`
- `apps/web/ce/components/projects/create/root.tsx`
- `apps/web/core/components/project/create/header.tsx`
- `apps/web/core/components/project/create-project-modal.tsx`
- `apps/web/core/services/project/project.service.ts`
- `apps/web/core/store/project/project.store.ts`
- `packages/types/src/project/project_templates.ts`
- `packages/constants/src/fetch-keys.ts`

## Decisions

- Use Vertical MVP phase mode for initial roadmap.
- Preserve existing no-template Project creation path.
- Add built-in system templates plus workspace custom templates.
- Apply selected templates on the backend transactionally.
- Limit custom template management to workspace admins.
- include_inactive list param defaults false so the Phase 3 create-modal selector stays active-only (D-14).
- Reactivation is a dedicated admin-only action; \_get_writable_template stays active-only (D-15).
- Defer /new and /:templateId/edit route registrations to Plan 03/05 so each plan's typegen gate is self-consistent.
- Built-in rows render muted text-tertiary metadata (no edit controls) — provenance conveyed by section heading, not row tint (per UI-SPEC Color).
- Custom-empty branch uses EmptyStateCompact; system section falls back to a dashed-border helper (system templates are always expected to be populated).
- Editor form shape already declares `modules`/`cycles`/`starter_issues` empty arrays so Plan 04 only wires UI (no type renumbering).
- Reference keys are generated ONCE at add-time and stored on the form item; never recomputed at submit (D-12 / RESEARCH Pitfall 2).
- Exactly-one-default enforcement clears the marker for every OTHER state when one is toggled to true (single-radio over the array — RESEARCH Pitfall 3).
- Editor color fields default to a real hex via `getRandomLabelColor()` — never the `var(--text-color-secondary)` CSS-var default (RESEARCH Pitfall 5).
- Backend 400 (list-of-dicts) errors surface inline per-section AND as a fallback toast via `mapProjectTemplateErrors` (RESEARCH Pitfall 7).

## Session

**Last session:** 2026-07-01T11:55:00.000Z
**Stopped at:** Completed 04-03-PLAN.md
**Resume file:** .planning/phases/04-workspace-template-management/04-04-PLAN.md

## Accumulated Context

### Roadmap Evolution

- Phase 5 added: 2

## Performance Metrics

| Phase        | Plan  | Duration | Notes    |
| ------------ | ----- | -------- | -------- |
| Phase 03 P01 | 35min | 2 tasks  | 6 files  |
| Phase 03 P02 | 36min | 2 tasks  | 4 files  |
| Phase 03 P03 | 17min | 3 tasks  | 1 file   |
| Phase 04 P01 | 15min | 2 tasks  | 3 files  |
| Phase 04 P02 | 22min | 2 tasks  | 6 files  |
| Phase 04 P03 | 53min | 2 tasks  | 16 files |
