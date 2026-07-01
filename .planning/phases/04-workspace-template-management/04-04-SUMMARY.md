---
phase: 04-workspace-template-management
plan: 04
subsystem: project-templates
tags: [frontend, react-hook-form, settings, editor, atomic-save, enum-select, cross-section-refs, name-based-pick]
dependency_graph:
  requires:
    - "Existing `ProjectTemplateEditorRoot` shell with two `useFieldArray` (states, labels) from Plan 04-03 (commit be502b7ce)"
    - "Existing `TProjectTemplateForm` / `TProjectTemplateFormPayload` shapes with `modules`/`cycles`/`starter_issues` already declared (Plan 04-03)"
    - "Existing `slugifyKey` / `uniqueKey` / `emptyTemplatePayload` / `mapProjectTemplateErrors` (Plan 04-03)"
    - "Existing `@plane/ui` `CustomSelect` and `Input` primitives"
    - "Backend validation rules in `apps/api/plane/app/serializers/project_template.py:43-60, 480-572` (offset, module status, starter-issue state ref)"
  provides:
    - "Editor sections Modules, Cycles, and Starter issues with full CRUD and inline validation"
    - "Cross-section reference resolution: starter-issue ref_ids resolved to stable `*_key` on save (D-13 / Pitfall 2)"
    - "Modules section constraining status to the six-value enum via CustomSelect (Pitfall mitigation)"
    - "Cycles section client-side guard `start_offset_days <= target_offset_days` (Pitfall 4)"
    - "Starter-issue client guard requiring every named issue to reference a state (backend-aligned)"
  affects:
    - "apps/web/core/components/project-templates/editor/root.tsx (useFieldArray + id-maps + JSX for 3 new sections; clientErrors/isInvalid extended; assemblePayload context wired)"
    - "apps/web/core/components/project-templates/utils.ts (TProjectTemplateFormStarterIssue carries ref_ids; TAssemblePayloadContext + signature change)"
    - "apps/web/core/components/project-templates/editor/index.ts (barrel exports)"
    - "packages/i18n/src/locales/en/workspace-settings.json (editor.* namespace extended)"
status: complete
key-files:
  created:
    - "apps/web/core/components/project-templates/editor/modules-section.tsx"
    - "apps/web/core/components/project-templates/editor/cycles-section.tsx"
    - "apps/web/core/components/project-templates/editor/starter-issues-section.tsx"
  modified:
    - "apps/web/core/components/project-templates/editor/root.tsx"
    - "apps/web/core/components/project-templates/utils.ts"
    - "apps/web/core/components/project-templates/editor/index.ts"
    - "packages/i18n/src/locales/en/workspace-settings.json"
decisions:
  - "Starter-issue references are stored as the SOURCE ROW's RHF field-array `id` (`state_ref_id`/`module_ref_id`/`cycle_ref_id`/`label_ref_ids`), NOT as the current name. `assemblePayload` resolves each id to the source row's stable `*_key` at submit time using parent-supplied id-maps. Renames never dangle references (D-12/D-13, Pitfall 2, T-04-12)."
  - "If a referenced source row is removed before save, the assemble step drops the dangling reference (returns `null` for single refs, filters for label arrays). The payload never emits an unknown `*_key` (T-04-12)."
  - "Cycles offset guard runs in TWO places: per-row inline (CycleRow computes its own error so a single offending row is visually flagged) and the page-level `clientErrors.cycles` memo (drives `isInvalid` to block Save when ANY row violates)."
  - "Module `description` and cycle `description` were INTENTIONALLY OMITTED. Backend `TProjectTemplateModule`/`TProjectTemplateCycle` types have no description field; including it would have been a `Rule 1` bug (UI would silently drop the value on submit). Plan's reference to `description TextArea/Input` was descoped for parity with the backend contract."
  - "Starter-issue priority defaults to `'none'` at add-time (not `null`); the CustomSelect onChange keeps the literal `TProjectTemplateIssuePriority` value. `assemblePayload` coerces to `null` for the payload."
  - "Multi-label selection renders as a row of toggle chips (each label as a button) rather than a multi-select dropdown primitive. CustomSelect is single-value; introducing a new multi-select primitive was out of scope (matches the 'compose only existing primitives' UI-SPEC constraint)."
  - "Modules status is initialized to `backlog` at add-time (matches the existing state default; aligns with the first row of the source array). Stays consistent if the user later changes it."
  - "The plan's `// Phase 1` comment in root.tsx was rewritten to enumerate all five sections per plan; otherwise the existing 04-03 footer and read-only banner are unchanged."
  - "`assemblePayload` is now `(form, context?)` instead of `(form)`. The second arg defaults to `{}` and is consumed only by the starter-issue resolution; existing callers (none yet outside this plan) do not need updates. Signature change is local to the editor surface — no public API."
metrics:
  duration_min: 30
  completed_date: 2026-07-01
  tasks: 2
  files: 7
one_liner: "Editor adds Modules, Cycles, and Starter-issues sections; cycles guard start<=target; starter-issue refs store the source row's RHF id and resolve to stable *_key at save (D-12/D-13, Pitfall 2), with no dangling references and no raw keys visible to admins."
---

# Phase 4 Plan 4: Editor Modules / Cycles / Starter Issues Summary

**Plan:** 04-04-PLAN.md
**Status:** Complete — both tasks shipped
**Date:** 2026-07-01
**Commits:**

- `e5bf8b46b` — feat(04-04): add Modules + Cycles sections with enum status and offset guard
- `2889f0196` — feat(04-04): add starter-issues section with name-based refs resolved to keys on save

## One-liner

Editor adds Modules, Cycles, and Starter-issues sections; cycles guard start<=target; starter-issue refs store the source row's RHF id and resolve to stable `*_key` at save (D-12/D-13, Pitfall 2), with no dangling references and no raw keys visible to admins.

## Objective

Complete the structured editor by adding the remaining three sections — Modules, Cycles, and Starter issues — so the atomic save covers all five payload sections (D-10/D-11). Starter-issue references are name-based dropdowns populated from the items defined in the sections above and resolved to stable keys on save (D-13), preventing the dangling-reference 400s the backend would otherwise reject. After this plan the editor authors a complete template covering states, labels, modules, cycles, and starter issues.

## What shipped

### Task 1 — Modules and Cycles sections (`e5bf8b46b`)

| File                                                                                     | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------- | ------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/core/components/project-templates/editor/modules-section.tsx` (NEW, 149 lines) | `ModulesSection` — inline add/edit/remove rows. Each row: name `Input` (required, `maxLength: 255`) and status via `CustomSelect` constrained to `backlog                                                                                                                                                                                                                                                                                                                                           | planned | in-progress | paused | completed | cancelled`(matches`TProjectTemplateModuleStatus`). Stable `module_key`generated at add-time via`slugifyKey`+`uniqueKey` (D-12). Empty-hint + "Add module" control per UI-SPEC copy. |
| `apps/web/core/components/project-templates/editor/cycles-section.tsx` (NEW, 243 lines)  | `CyclesSection` — inline add/edit/remove rows. Each row: name `Input` (required, `maxLength: 255`), three numeric offset Inputs (start/target/duration). A `CycleRow` sub-component computes its own inline offset-error message (visible under the offending row only) so a single bad row is visually flagged. Stable `cycle_key` generated at add-time. Numeric `OffsetInput` coerces non-integer input to `null` to mirror backend `validate_*` rule (`serializers/project_template.py:21-41`). |
| `apps/web/core/components/project-templates/editor/index.ts`                             | Re-exports the two new components.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `apps/web/core/components/project-templates/editor/root.tsx`                             | `useFieldArray` for `modules` and `cycles`; rendered as sections in order after Labels. `clientErrors` extended with `modules` (duplicate-name) and `cycles` (offset violation) — both feed `isInvalid` so the page-level Save button is disabled while any row is invalid. The `// Phase 1` comment was rewritten to enumerate the five sections.                                                                                                                                                  |
| `packages/i18n/src/locales/en/workspace-settings.json`                                   | Adds the editor.\* keys: `add_module`, `add_cycle`, `modules_section_title`, `cycles_section_title`, `modules_empty_hint`, `cycles_empty_hint`, `module_name_placeholder`, `cycle_name_placeholder`, `module_status`, `cycle_start_offset`, `cycle_target_offset`, `cycle_duration`, `duplicate_module_name`, `duplicate_cycle_name`, `cycle_offsets_invalid`.                                                                                                                                      |

### Task 2 — Starter issues + reference resolution (`2889f0196`)

| File                                                                                            | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------ | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/core/components/project-templates/editor/starter-issues-section.tsx` (NEW, 353 lines) | `StarterIssuesSection` — inline add/edit/remove rows. Each row: name `Input` (required, `maxLength: 255`), priority `CustomSelect` (`urgent                                                                                                                                                                                                                                                                                                                       | high | medium | low | none`), and four reference controls: state (single `CustomSelect`, required), labels (toggle-chip row, multi), module (single `CustomSelect`, optional), cycle (single `CustomSelect`, optional). Each reference's "value" is the SOURCE ROW's RHF field-array `id`; the visible label is the source row's `name`. Default at add-time: `state_ref_id=null`, `label_ref_ids=[]`, `module_ref_id=null`, `cycle_ref_id=null`, `priority="none"`. |
| `apps/web/core/components/project-templates/utils.ts`                                           | `TProjectTemplateFormStarterIssue` is reshaped: `state_key`/`label_keys`/`module_key`/`cycle_key` are replaced by `state_ref_id`/`label_ref_ids`/`module_ref_id`/`cycle_ref_id` (RHF field-array ids). New `TAssemblePayloadContext` type. `assemblePayload(form, context = {})` now takes four id->key maps and resolves each ref id to the current stable `*_key` on submit, dropping any ref whose source row was removed (defensive — `Pitfall 2 / T-04-12`). |
| `apps/web/core/components/project-templates/editor/root.tsx`                                    | (already committed in Task 1 because both tasks touched the file in a single edit pass) — `useFieldArray` for `starter_issues`; four `useMemo` id-maps (`stateKeyById`/`labelKeyById`/`moduleKeyById`/`cycleKeyById`) built from the field arrays; `assemblePayload` call site passes them in. `clientErrors.starter_issues` blocks Save when any named issue is missing a state ref (backend-aligned — `serializers/project_template.py:528-536`).               |
| `packages/i18n/src/locales/en/workspace-settings.json`                                          | Adds the editor.\* keys: `add_starter_issue`, `starter_issues_section_title`, `starter_issues_empty_hint`, `starter_issue_name_placeholder`, `priority_label`, `state_label`, `labels_label`, `module_label`, `cycle_label`, `no_reference`, `starter_issue_state_required`.                                                                                                                                                                                      |

## Acceptance Criteria Verification

| Criterion                                                                                                                                                        | Status | Evidence                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `check:types` and `check:lint` pass; no new lint warnings                                                                                                        | PASS   | `pnpm --filter=web check:types` exits 0 after both tasks; `pnpm --filter=web check:lint` reports 983 warnings (same baseline), 0 errors. `grep -c warning` on each new/edited file = 0.                                                            |
| `modules-section.tsx` constrains status to the six-value enum via `CustomSelect` (grep the enum values)                                                          | PASS   | `MODULE_STATUSES` literal in `modules-section.tsx:30-36` is exactly `["backlog","planned","in-progress","paused","completed","cancelled"]`; `CustomSelect` iterates this array.                                                                    |
| `cycles-section.tsx` blocks Save / surfaces inline when `start_offset_days > target_offset_days` (grep the offset comparison)                                    | PASS   | `CycleRow` at `cycles-section.tsx:113-117`: `hasBoth && startNum > targetNum ? t(...cycle_offsets_invalid) : null`. Page-level `clientErrors.cycles` at `root.tsx:221` blocks `isInvalid` on any violation. Inline message rendered at `:194-197`. |
| Modules and cycles generate hidden `module_key`/`cycle_key` at add-time; no raw key input is rendered (grep: no visible Input bound to `module_key`/`cycle_key`) | PASS   | `append({module_key: newKey, ...})` at `modules-section.tsx:64-67`; `append({cycle_key: newKey, ...})` at `cycles-section.tsx:44-50`. No `<Controller name="...module_key">` or `...cycle_key` exists in the JSX.                                  |
| `editor/root.tsx` declares `useFieldArray` for `modules` and `cycles`                                                                                            | PASS   | `useFieldArray({ control, name: "payload.modules" })` and `useFieldArray({ control, name: "payload.cycles" })` at `root.tsx:144-145`.                                                                                                              |
| `starter-issues-section.tsx` feeds reference dropdown options from the in-editor states/labels/modules/cycles field values                                       | PASS   | `root.tsx:402-405` maps `states.fields`/`labels.fields`/`modules.fields`/`cycles.fields` to `{id, name, color}` option arrays; section props `stateOptions`/`labelOptions`/`moduleOptions`/`cycleOptions` consume them.                            |
| `assemblePayload` resolves starter-issue references to stored stable keys and does not recompute keys from current names                                         | PASS   | `utils.ts:234-239` reads `stateKeyById[i.state_ref_id]`/`labelKeyById[id]`/`moduleKeyById[i.module_ref_id]`/`cycleKeyById[i.cycle_ref_id]`. No `slugifyKey(name)` call appears in the starter-issue resolution.                                    |
| No raw `*_key` field is rendered as a visible input in the starter-issues rows                                                                                   | PASS   | `Controller` names in the section are `state_ref_id`, `label_ref_ids`, `module_ref_id`, `cycle_ref_id`, `name`, `priority` only — no `state_key`/`label_key`/`module_key`/`cycle_key` is bound.                                                    |
| Deleting a referenced item does not leave a dangling reference in the assembled payload                                                                          | PASS   | `utils.ts:234-239` uses `??`/`.filter(...)` so missing source ids collapse to `null` or are dropped; the payload never emits an unknown `*_key`.                                                                                                   |
| 04-03 editor root's States/Labels sections are preserved unchanged                                                                                               | PASS   | The `StatesSection`/`LabelsSection` props in `root.tsx:374-389` are identical to 04-03 (same `control`/`array`/`disabled`/`clientError`/`backendError`); only the surrounding JSX was extended to add three new sections.                          |
| 04-03 utils are extended (not duplicated)                                                                                                                        | PASS   | `utils.ts` was edited in place: new `TAssemblePayloadContext` type, `assemblePayload` signature extended. No duplicate `assemblePayload` exists; `slugifyKey`/`uniqueKey`/`emptyTemplatePayload`/`mapProjectTemplateErrors` unchanged.             |

## Deviations from Plan

The plan was executed with one local-only deviation; no plan-level changes.

1. **Module and cycle `description` fields were omitted from the form shapes.** The plan's Task 1 brief referenced `description TextArea/Input` for both modules and cycles, but the backend `TProjectTemplateModule`/`TProjectTemplateCycle` types (`packages/types/src/project/project_templates.ts:31-43`) carry NO `description` field. Including it in the form would have been a `Rule 1` bug — the field would render, but `assemblePayload` would silently drop the value. Decision: keep parity with the backend contract and drop description. No UX regression: there is no "what is this module for?" copy in the UI-SPEC for these sections.

2. **`assemblePayload` signature changed from `(form)` to `(form, context = {})`.** The plan's pseudo-code does not show the second arg explicitly; introducing it was unavoidable because RHF field-array `id` is on the `fields` array (not the form value), so the resolution maps must be supplied by the caller. The default `context = {}` keeps the function backward-compatible for any external caller (no other callers exist in this repo). The new `TAssemblePayloadContext` type is exported from `utils.ts`.

3. **Pre-commit hooks reformatted/auto-fixed files during commit.** `oxfmt` and `oxlint --fix --deny-warnings` ran as part of the workspace pre-commit pipeline and applied trivial formatting + lint fixes (mostly block reformatting of `if/return` ternaries). No semantic changes; diff against unstaged state shows only style adjustments. This is the expected behavior of the existing `lint-staged` setup.

4. **Tasks 1 and 2 both modified `editor/root.tsx` in a single edit pass, so root.tsx changes were committed atomically with Task 1.** This kept each commit self-consistent (`root.tsx` and `index.ts` are present in Task 1; `utils.ts` and the new `starter-issues-section.tsx` are in Task 2). No reverts or backouts; root.tsx is a single coherent state in `HEAD`.

## Threat Model Coverage

| Threat ID                                          | Mitigation implemented                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-04-12 (Tampering — dangling starter-issue refs)  | `TProjectTemplateFormStarterIssue` stores RHF field-array `id`s (`state_ref_id`/`label_ref_ids`/`module_ref_id`/`cycle_ref_id`), not names. `assemblePayload` resolves each id via caller-supplied `id->key` maps and drops any id whose source row is no longer in the form. The payload never carries a key the backend doesn't know. Backend re-validates `references unknown *_key` (`serializers/project_template.py:528-563`) as the authoritative control. |
| T-04-13 (Tampering — invalid enum / offset)        | Module status constrained to the six-value enum via `CustomSelect` options; `MODULE_STATUSES` literal in `modules-section.tsx:30-36`. Cycles enforce `start_offset_days <= target_offset_days` in two places: per-row inline (`CycleRow` in `cycles-section.tsx:113-117`) and page-level `clientErrors.cycles` (`root.tsx:218-222`) which blocks Save. Backend `validate_project_template_payload` remains authoritative for any client-bypass.                   |
| T-04-14 (XSS — rendering module/cycle/issue names) | React auto-escapes all rendered fields. No `dangerouslySetInnerHTML` in any of the new components. The reference dropdown trigger labels (`labelForState`, etc.) render the source `name` string which is itself rendered through React.                                                                                                                                                                                                                          |

## Auth Gates

None. The editor is admin-gated by the existing 04-03 page-level `allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE)` check; this plan only adds UI surface inside the already-authorized shell.

## Known Stubs / Followups

- **The 18 non-English i18n locales** for the new editor.\* keys (`add_module`, `cycle_offsets_invalid`, `starter_issue_state_required`, etc.) fall back to English at runtime. Populated by the translate workflow downstream — not in this plan's scope.
- **Multi-label selection is a chip toggle rather than a search-style multi-select dropdown.** The chip row is keyboard-operable and accessible (`aria-pressed`), but lacks the search/filter affordance a real multi-select dropdown would offer. Acceptable for the v1 row count (one chip per label) and consistent with the "compose only existing primitives" UI-SPEC constraint. A future polish task can swap to `MultiSelectDropdown` (`packages/ui/src/dropdown/multi-select.tsx`) without changing the data model.
- **Backend `validate_*` will reject `state_key` references that are NOT in the same template's `states` array** (`serializers/project_template.py:529`). The editor never has this case in normal flow, but a JSON-pasted payload (out of scope) could trip it — handled by the existing backend 400 → `mapProjectTemplateErrors` → inline error path.
- **`mapProjectTemplateErrors` already iterates the list-of-dicts shape** (per 04-03, RESEARCH Pitfall 7) so the new sections inherit the same inline error path; no changes were needed to the mapper for modules/cycles/starter-issues.

## Self-Check

- All 3 new files exist on disk and are tracked under `e5bf8b46b` and `2889f0196`.
- `e5bf8b46b` (Task 1) and `2889f0196` (Task 2) present in `git log --oneline -3`.
- `pnpm --filter=@plane/types check:types` exits 0 (Task 1).
- `pnpm --filter=web check:types` exits 0 (after both tasks).
- `pnpm --filter=web check:lint` reports 983 warnings, 0 errors (no new above the 04-03 baseline).
- `grep -c warning` on `modules-section.tsx`/`cycles-section.tsx`/`starter-issues-section.tsx`/`root.tsx` = 0.
- The 04-03 `StatesSection`/`LabelsSection` props in `root.tsx` are unchanged (verified by diff against `d17aff8a2`).
- `utils.ts` extends the existing types and `assemblePayload`; `slugifyKey`/`uniqueKey`/`emptyTemplatePayload`/`mapProjectTemplateErrors` are unchanged from 04-03.

## Outcome

- The editor authors a complete custom project template covering all five payload sections: states, labels, modules, cycles, and starter issues.
- Cross-section references are stored as the source row's RHF id and resolved to the current stable `*_key` at save — renames never dangle references (Pitfall 2), and removing a referenced item clears the now-invalid reference automatically.
- Cycles offsets are guarded client-side per row and at the page level; module status is constrained to a fixed enum; starter issues must reference a state before save.
- All client guards are surfacing in the i18n layer with consistent copy; backend `validate_*` remains the authoritative control with its 400 list-of-dicts surfaced inline via `mapProjectTemplateErrors`.
- Type-check and lint pass with no new warnings above the 04-03 baseline; backend contract parity preserved (no fields rendered that the backend doesn't accept).
- The editor surface is ready for Plan 04-05 (row actions on the list page) to wire the Edit / Duplicate / Deactivate / Reactivate entry points; the `readOnly` mode already exists for built-in "View" rows.
