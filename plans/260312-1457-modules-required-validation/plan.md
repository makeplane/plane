---
title: "Conditional Required Validation for Modules Field"
description: "Modules field required on issue submit, except for Draft state or projects with no modules"
status: pending
priority: P2
effort: 2h
branch: ngoc-feat/workspaces
tags: [validation, modules, issues, frontend]
created: 2026-03-12
---

# Conditional Required Validation for Modules Field

## Overview

Add required validation for the `module_ids` field in the issue creation/edit form. Two exceptions bypass the requirement: (1) issue state is "Draft" (backlog group), (2) the project has zero modules.

## Key Insights

- Existing `useIssueFormValidation` hook in `apps/web/ce/hooks/use-issue-form-validation.ts` already handles draft-state bypass via `getFieldRules()` pattern
- `module_ids` Controller in `default-properties.tsx` (line 236-257) currently has NO validation rules -- just needs `rules={...}` added
- Module store exposes `getProjectModuleIds(projectId)` returning `string[] | null` -- use to check if project has modules
- The hook re-exports through `apps/web/core/hooks/store/use-issue-form-validation.ts`

## Phases

| Phase | Description                                | Effort |
| ----- | ------------------------------------------ | ------ |
| 01    | Add module-aware validation to hook + form | 2h     |

See [phase-01-modules-required-validation.md](./phase-01-modules-required-validation.md) for details.

## Validation Log

### Session 1 — 2026-03-12

**Trigger:** Initial plan validation before implementation
**Questions asked:** 4

#### Questions & Answers

1. **[Scope]** Should the modules required validation apply to both issue creation AND editing existing issues?
   - Options: Create only | Create + Edit
   - **Answer:** Create only
   - **Rationale:** Avoids blocking users who edited legacy issues without modules; simpler scope reduces risk.

2. **[Architecture]** When the module store hasn't loaded yet (getProjectModuleIds returns null), what should happen?
   - Options: Skip validation | Block submission
   - **Answer:** Skip validation
   - **Rationale:** Treat null as "no modules" — safe default prevents false blocking on slow loads. Matches plan's current approach.

3. **[Error UX]** When a user switches to Draft/backlog state, when should the module validation error clear?
   - Options: Immediately on state change | On next submit attempt
   - **Answer:** Immediately on state change
   - **Rationale:** useEffect clears error as soon as draft state is detected — better UX, consistent with existing draft bypass behavior.

4. **[Backend Scope]** Should backend validation for required modules be added as part of this plan or remain out of scope?
   - Options: Out of scope | Include in this plan
   - **Answer:** Out of scope
   - **Rationale:** Frontend-only for now; backend enforcement tracked as a separate follow-up plan.

#### Confirmed Decisions

- Validation scope: create-only — editing existing issues not affected
- Null module store: skip validation (safe default)
- Error clearing: immediate on state change via useEffect
- Backend: out of scope for this plan

#### Action Items

- [x] Confirm `default-properties.tsx` module Controller only renders on create modal, not edit modal (or add create-only guard if needed)
  - **Finding:** Component renders in both create + edit. `id` prop is `string | undefined` — use `!id` guard in rules to skip validation on edit.

#### Impact on Phases

- Phase 01: No structural changes needed — all answers confirm the plan as written. Add note that validation applies to issue creation form only.
