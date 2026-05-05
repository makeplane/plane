---
title: "Add Frequency Property to Workitems"
description: "Single-select frequency field (Daily/Weekly/etc.) with tag-chip UI on issues"
status: completed
priority: P2
effort: 6h
branch: ngoc-feat/workspaces
tags: [feature, workitems, frequency, backend, frontend]
created: 2026-03-11
---

# Add Frequency Property to Workitems

## Overview

Add a `frequency` CharField to the Issue model with predefined choices: Daily, Weekly, Bi-weekly, Monthly, Quarterly, Half-year, Yearly, Ad-hoc. Single-select, nullable (optional). Frontend uses a tag-chip dropdown similar to PriorityDropdown pattern.

## Phases

1. **[Backend](./phase-01-backend.md)** (~2h) - Model field, migration, serializer, activity tracking
2. **[Types + Store + Service](./phase-02-types-store-service.md)** (~1.5h) - TS types, constants, store/service updates
3. **[UI Component + Integration](./phase-03-ui-integration.md)** (~2.5h) - FrequencyDropdown, sidebar, issue modal integration

## Key Design Decisions

- CharField with choices (same pattern as `priority`) - not a FK, not user-configurable
- Nullable/blank - user can leave empty
- Next migration number: `0137`
- Activity tracking via `ISSUE_ACTIVITY_MAPPER` (same as priority)
- Frontend: new `FrequencyDropdown` in `apps/web/core/components/dropdowns/`
- Sidebar integration in `apps/web/core/components/issues/issue-detail/sidebar.tsx`
- Issue modal integration via CE `modal-additional-properties.tsx`

## Validation Log

### Session 1 — 2026-03-11

**Trigger:** Initial plan validation before implementation
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** Where should `FrequencyDropdown` live? The plan places it in `core/components/dropdowns/` but it's only used in the sidebar (core) and CE modal — putting it in `ce/` would keep it overridable in EE.
   - Options: core/components/dropdowns/ | ce/components/dropdowns/
   - **Answer:** ce/ only — `apps/web/ce/components/dropdowns/frequency.tsx`
   - **Rationale:** Keeps the component in the CE layer where it can be overridden/extended in EE builds; import in sidebar must use `@/plane-web/components/dropdowns/frequency`

2. **[Assumptions]** Which icon should represent the Frequency property in the sidebar?
   - Options: RefreshCw (lucide-react) | Check propel first
   - **Answer:** RefreshCw (lucide-react) — no need to search propel
   - **Rationale:** Avoids discovery overhead; RefreshCw is a reasonable recurrence metaphor and already available

3. **[Architecture]** How should i18n for "Frequency" be handled in the sidebar?
   - Options: Add t() key | Inline string
   - **Answer:** Add t() key — `"common.frequency": "Frequency"` in locale file, use `t("common.frequency")` in sidebar
   - **Rationale:** Consistent with existing sidebar property labels; required for multi-language support

4. **[Scope]** Should the Frequency row in the sidebar always be visible, or only when a value is set?
   - Options: Always visible | Hide when empty
   - **Answer:** Always visible — same behavior as Priority row
   - **Rationale:** Discoverability; users need to know the field exists to set it

#### Confirmed Decisions

- FrequencyDropdown location: `ce/` layer — import via `@/plane-web/components/dropdowns/frequency`
- Icon: `RefreshCw` from `lucide-react`
- i18n: add `"common.frequency"` key to locale file
- Sidebar visibility: always shown (consistent with Priority)

#### Action Items

- [ ] Move FrequencyDropdown from planned `core/` to `ce/components/dropdowns/frequency.tsx`
- [ ] Update sidebar import to use `@/plane-web/components/dropdowns/frequency`
- [ ] Add `"common.frequency": "Frequency"` to i18n locale file

#### Impact on Phases

- Phase 3: FrequencyDropdown file path changes from `core/` to `ce/`; sidebar import path updates accordingly; confirm i18n key addition step

### Session 2 — 2026-03-11

**Trigger:** Re-validation to address implementation ambiguities before coding
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Phase 2 has a conflict: TIssueFrequency should go in the barrel file `packages/types/src/issues.ts` (like TIssuePriorities) OR in the sub-file `packages/types/src/issues/issue.ts` alongside TBaseIssue?
   - Options: Barrel file issues.ts | Sub-file issues/issue.ts
   - **Answer:** Barrel file issues.ts
   - **Rationale:** Consistent with TIssuePriorities pattern; type alias in barrel, usage in sub-file

2. **[Architecture]** The modal Controller snippet in Phase 3 omits the `control` prop. Which approach should the FrequencyDropdown Controller use?
   - Options: Use useFormContext | Pass control via props
   - **Answer:** Use useFormContext — `const { control } = useFormContext<TIssue>()` inside component
   - **Rationale:** No prop drilling; works within existing react-hook-form context from parent form

3. **[Assumptions]** Are the frequency badge colors in the plan from a design spec, or should they be revised?
   - Options: Use as-is | Use neutral palette
   - **Answer:** Use as-is — spectrum from red (daily) to gray (ad_hoc)
   - **Rationale:** Reasonable visual hierarchy; can be revised later if design spec provided

#### Confirmed Decisions

- TIssueFrequency location: barrel `packages/types/src/issues.ts` (not sub-file)
- Modal Controller: use `useFormContext<TIssue>()` inside component
- Badge colors: use spectrum as defined in Phase 2 constants

#### Action Items

- [ ] Phase 2: Define TIssueFrequency in `packages/types/src/issues.ts`, NOT in `issues/issue.ts`
- [ ] Phase 3: Add `const { control } = useFormContext<TIssue>()` in modal component

#### Impact on Phases

- Phase 2: Clarify TIssueFrequency goes in barrel file `packages/types/src/issues.ts`
- Phase 3: Update Controller to use `useFormContext<TIssue>()` pattern

### Session 3 — 2026-03-11

**Trigger:** Re-validation to resolve remaining implementation ambiguities before coding
**Questions asked:** 3

#### Questions & Answers

1. **[Assumptions]** Where should the i18n key `"common.frequency": "Frequency"` be added? The plan says "check existing i18n files" but doesn't resolve the exact file.
   - Options: apps/web/public/locales/en/common.json | apps/web/public/locales/en/issues.json | Skip i18n — use inline string
   - **Answer:** `apps/web/public/locales/en/common.json`
   - **Rationale:** Matches the `common.*` key namespace; consistent with how other sidebar property labels are added

2. **[Scope]** Phase 1 plans to add `frequency` to both the `Issue` model AND the `IssueVersion` model. Should this be done in MVP, or skip IssueVersion for now?
   - Options: Include IssueVersion in MVP | Skip IssueVersion for now
   - **Answer:** Include IssueVersion in MVP
   - **Rationale:** Consistent with how other fields like priority are tracked in version history; avoids a follow-up migration

3. **[Architecture]** Should `FrequencyDropdown` be re-exported from a CE dropdowns barrel or imported directly by path?
   - Options: Direct import by path | Add to CE dropdowns barrel
   - **Answer:** Direct import by path
   - **Rationale:** Simpler; no barrel file to maintain; consistent with how other CE components are imported

#### Confirmed Decisions

- i18n file: `apps/web/public/locales/en/common.json` — add `"common.frequency": "Frequency"`
- IssueVersion: include `frequency` field in MVP (Phase 1 scope confirmed)
- Import style: direct path import `@/plane-web/components/dropdowns/frequency` everywhere

#### Action Items

- [ ] Phase 1: Confirm IssueVersion.frequency field and log_issue_version update are in scope
- [ ] Phase 3: Add i18n key to `apps/web/public/locales/en/common.json`

#### Impact on Phases

- Phase 1: IssueVersion scope confirmed — include frequency field and log_issue_version update
- Phase 3: i18n key goes in `apps/web/public/locales/en/common.json`; no barrel export needed

### Session 4 — 2026-03-11

**Trigger:** Final pre-implementation validation
**Questions asked:** 3

#### Questions & Answers

1. **[Risk]** Has any new migration been added since planning that might have taken 0137?
   - Options: 0137 is still free | Check at runtime | A migration was added
   - **Answer:** 0137 is still free
   - **Rationale:** Migration number confirmed — proceed as planned

2. **[Architecture]** Should the modal CE component use a bare dropdown or a label+dropdown row?
   - Options: Bare dropdown | Label + dropdown row
   - **Answer:** Bare dropdown — `buttonVariant="border-with-text"` with `placeholder="Frequency"` provides sufficient context
   - **Rationale:** Modal already provides field context; label row unnecessary

3. **[Scope]** Should filter/grouping support for frequency be added now?
   - Options: Strictly defer | Add filter support now
   - **Answer:** Strictly defer — YAGNI; only sidebar + modal for MVP
   - **Rationale:** Keeps scope focused; can add filtering/grouping in follow-up

#### Confirmed Decisions

- Migration: 0137 confirmed free, proceed as planned
- Modal layout: bare dropdown with `placeholder="Frequency"`, no label wrapper
- Filter/grouping: deferred, not in scope for this iteration

#### Action Items

- (none — all decisions confirm existing plan)

#### Impact on Phases

- No phase changes required

---

## Architecture

```
Backend:
  apps/api/plane/db/models/issue.py          - Add FREQUENCY_CHOICES + field
  apps/api/plane/db/migrations/0137_*.py      - Migration
  apps/api/plane/app/serializers/issue.py     - Add to serializers
  apps/api/plane/bgtasks/issue_activities_task.py - Activity tracking

Frontend:
  packages/types/src/issues/issue.ts          - Add TIssueFrequency type + field
  packages/constants/src/issue/common.ts      - ISSUE_FREQUENCIES constant
  apps/web/ce/components/dropdowns/frequency.tsx   - FrequencyDropdown (ce/ per validation)
  apps/web/core/components/issues/issue-detail/sidebar.tsx - Sidebar property
  apps/web/ce/components/issues/issue-modal/modal-additional-properties.tsx - Modal
```
