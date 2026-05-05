---
title: "Work Item Required Fields Validation"
description: "Add required field validation for State, Assignee, Priority, Start date, Due date, Label in work item creation (frontend only)"
status: complete
priority: P2
effort: 2h
branch: ngoc-feat/work-items
tags: [validation, work-items, frontend]
created: 2026-03-03
---

# Work Item Required Fields Validation

## Overview

Add required field validation/constraints to the work item creation form. Enforces validation for: **State, Assignee, Priority, Start date, Due date, Label** (6 fields, frontend-only).

## Phases

| #   | Phase                                                      | Status       | Effort |
| --- | ---------------------------------------------------------- | ------------ | ------ |
| 1   | [Frontend Validation](./phase-01-frontend-validation.md)   | **complete** | 2h     |
| 2   | [Backend API Validation](./phase-02-backend-validation.md) | **skipped**  | —      |

## Key Files

- `apps/web/core/components/issues/issue-modal/components/default-properties.tsx` — main target
- `apps/web/core/components/dropdowns/types.d.ts` — add `hasError` prop
- `apps/web/core/components/dropdowns/buttons.tsx` — error border styling
- `apps/web/core/components/issues/issue-modal/form.tsx` — error summary

## Field Mapping

| Field          | Frontend name   | Required        |
| -------------- | --------------- | --------------- |
| State          | `state_id`      | ✅              |
| Assignee       | `assignee_ids`  | ✅              |
| Priority       | `priority`      | ✅ (not "none") |
| Start date     | `start_date`    | ✅              |
| Due date       | `target_date`   | ✅              |
| Label          | `label_ids`     | ✅              |
| Module         | `module_ids`    | ❌ not required |
| Estimated time | `estimate_time` | ❌ not required |

## Validation Log

### Session 1 — 2026-03-03

**Trigger:** Initial plan validation before implementation
**Questions asked:** 5

#### Questions & Answers

1. **[Scope]** Are the 8 required fields mandatory on ALL projects, or configurable per-project?
   - Options: All projects | Configurable per-project
   - **Answer:** All projects
   - **Rationale:** Simpler implementation — no per-project config UI or DB schema needed.

2. **[Assumptions]** Should `estimate_time` only be required when the project has time-tracking enabled?
   - Options: Yes conditional | Always required | Don't require estimate_time
   - **Answer:** Don't require estimate_time
   - **Rationale:** Removed from required fields entirely — reduces scope.

3. **[Assumptions]** Should `module_ids` only be required when `project.module_view = true`?
   - Options: Yes conditional | Always required | Don't require module
   - **Answer:** Don't require module
   - **Rationale:** module_ids is post-create only (separate ModuleIssue model); removed from required fields.

4. **[Architecture]** Backend validation: web modal only or all API consumers?
   - Options: Web modal only | All consumers | Frontend only (skip Phase 2)
   - **Answer:** Frontend only (skip Phase 2)
   - **Rationale:** No backend enforcement needed; validation is UX-only. Phase 2 skipped.

5. **[UX]** How should validation errors be displayed?
   - Options: Red border + error text below each field | Red border only | Consolidated summary only
   - **Answer:** Red border + error text below each field
   - **Rationale:** Clearest UX — user sees exactly which field is missing without guessing.

#### Confirmed Decisions

- Required fields: State, Assignee, Priority, Start date, Due date, Label (6 fields)
- estimate_time: not required
- module_ids: not required
- Backend validation: skipped (frontend UX only)
- Error display: red border + error text inline below each field

#### Action Items

- [x] Update Phase 1 to remove estimate_time and module_ids from required fields
- [x] Mark Phase 2 as skipped in plan.md

#### Impact on Phases

- Phase 1: Remove estimate_time and module_ids from validation steps, todo, architecture. Keep 6-field validation with red border + inline error text.
- Phase 2: Skipped entirely.

### Session 2 — 2026-03-03

**Trigger:** Re-validation run; checking for new decision points after Session 1 changes
**Questions asked:** 0 — all decisions already confirmed in Session 1. No new ambiguities found.

**Stale references cleaned in phase-01:**

- Removed `estimate_time` reference from Related Code Files
- Removed `issue-additional-properties.tsx` reference (no longer needed)
- Updated Success Criteria to match 6-field scope
- Updated Risk Assessment (removed estimate_time and module_ids rows)
- Updated Security Considerations (Phase 2 skipped note)
- Updated Next Steps (removed "Proceed to Phase 2")
