# Code Review: Frequency Property Implementation

**Date:** 2026-03-11
**Reviewer:** code-reviewer agent
**Branch:** ngoc-feat/workspaces

---

## Scope

| Layer               | Files                                                                                                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend models      | `apps/api/plane/db/models/issue.py`                                                                                                                                                       |
| Backend serializers | `apps/api/plane/app/serializers/issue.py`                                                                                                                                                 |
| Backend activity    | `apps/api/plane/bgtasks/issue_activities_task.py`                                                                                                                                         |
| Backend migration   | `apps/api/plane/db/migrations/0137_issue_frequency.py`                                                                                                                                    |
| Types               | `packages/types/src/issues.ts`, `packages/types/src/issues/issue.ts`                                                                                                                      |
| Constants           | `packages/constants/src/issue/common.ts`                                                                                                                                                  |
| Components          | `apps/web/ce/components/dropdowns/frequency.tsx`, `apps/web/core/components/issues/issue-detail/sidebar.tsx`, `apps/web/ce/components/issues/issue-modal/modal-additional-properties.tsx` |

**LOC added:** ~250 (backend) + ~290 (frontend)
**Focus:** Full feature review against priority CharField pattern

---

## Overall Assessment

The implementation is well-structured and correctly mirrors the existing `priority` CharField pattern throughout the stack. Data flow is complete: model → migration → serializers → activity tracking → TypeScript types → constants → UI components. No security issues found. One confirmed bug (duplicate `name` field in `IssueVersionDetailSerializer`) and several minor quality observations.

**Score: 7.5 / 10**

---

## Critical Issues

None.

---

## High Priority

### 1. Duplicate `name` field in `IssueVersionDetailSerializer`

**File:** `apps/api/plane/app/serializers/issue.py`, lines 993 and 1011

`IssueVersionDetailSerializer.Meta.fields` contains `"name"` twice. DRF silently deduplicates duplicate field names in the list, so it does not cause an error or data loss, but it is clearly unintentional copy-paste residue and makes the intent ambiguous.

```python
# Current (line 993 and 1011 both say "name")
fields = [
    ...
    "name",     # line 993 — correct position
    "priority",
    ...
    "type",
    "frequency",
    "cycle",
    "modules",
    "meta",
    "name",     # line 1011 — duplicate, should be removed
    "last_saved_at",
    ...
]
```

**Fix:** Remove the second `"name"` entry (line 1011).

---

### 2. `FrequencyDropdown` exceeds 150-line component limit

**File:** `apps/web/ce/components/dropdowns/frequency.tsx`

The component is 246 lines, exceeding the 150-line component limit defined in project rules. The `ButtonContent` sub-component and the main `FrequencyDropdown` can be split into separate files, consistent with how other dropdowns in the codebase structure their button content.

**Fix:** Extract `ButtonContent` into a `frequency-button-content.tsx` file and import it, bringing the main file under 150 lines.

---

## Medium Priority

### 3. `FREQUENCY_CHOICES` duplicated across `Issue` and `IssueVersion` models

**File:** `apps/api/plane/db/models/issue.py`, lines 111-120 and 708-717

Both model classes define identical `FREQUENCY_CHOICES` tuples inline. If a new frequency option is added in the future, both must be updated in sync. The existing `PRIORITY_CHOICES` has the same pattern, so this is consistent with current conventions, but it creates a maintainability risk.

**Suggestion:** Define `FREQUENCY_CHOICES` once as a module-level constant and reference it from both model classes. Defer if not breaking convention.

### 4. Modal frequency `placeholder` is a hardcoded English string

**File:** `apps/web/ce/components/issues/issue-modal/modal-additional-properties.tsx`, line 37

```tsx
placeholder = "Frequency";
```

The `FrequencyDropdown` already accepts a `placeholder` prop and falls back to `t("common.frequency")` internally — so this hardcoded string overrides the i18n fallback. The sidebar correctly omits the `placeholder` prop and relies on the i18n default.

**Fix:** Remove the `placeholder="Frequency"` prop from the modal usage so the i18n fallback takes effect.

### 5. `IssueCreateSerializer` does not validate `frequency` enum values

**File:** `apps/api/plane/app/serializers/issue.py`

The serializer uses `fields = "__all__"`, which means `frequency` is accepted via Django model field `choices`, but DRF with `__all__` does not automatically enforce choices as a validation error unless `choices_validator` is applied. In practice, Django's `CharField` with `choices` does not enforce constraint at the database level either. An invalid value like `"bi-weekly"` (hyphen instead of underscore) would be stored without rejection.

**Suggestion:** Add an explicit `validate_frequency` method or an `EnumField`-style serializer field. Low urgency since choices are sourced from a typed frontend constant, but it is a defensive gap.

---

## Low Priority

### 6. `IssuePublicSerializer` omits `frequency`

**File:** `apps/api/plane/app/serializers/issue.py`, lines 949-972

`IssuePublicSerializer` is used for public-facing Plane boards and intentionally excludes many fields. The omission of `frequency` appears intentional. No action needed — confirmed this is consistent with other internal-only fields (`sort_order`, `is_draft`) that are also excluded.

### 7. `overflow-y-scroll` on dropdown options list

**File:** `apps/web/ce/components/dropdowns/frequency.tsx`, line 199

Uses `overflow-y-scroll` which always shows a scrollbar even when content fits. This matches the existing `priority.tsx` dropdown (line 486) exactly, so it is consistent — not a new issue introduced by this feature. Note it for future cleanup.

### 8. `displayValue` cast on `Combobox.Input` is a no-op

**File:** `apps/web/ce/components/dropdowns/frequency.tsx`, line 195

```tsx
displayValue={(assigned: unknown) => (assigned as { name?: string })?.name ?? ""}
```

The `Combobox` values here are `TIssueFrequency` strings (not objects with a `.name` property), so this cast always evaluates to `""`. The search state is managed by the `query` state variable directly, so this causes no visible bug, but the `displayValue` prop is misleading. This is copied from another dropdown and not frequency-specific; deferring is acceptable.

---

## Edge Cases Reviewed

| Scenario                                                     | Status                                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `null` frequency → serializer returns `null`                 | Correct — field is `null=True, blank=True`                                           |
| Clearing frequency in UI (`None` option)                     | Handled — `onChange(null)` calls `issueOperations.update` with `{ frequency: null }` |
| Activity tracking when frequency unchanged                   | Correct — `track_frequency` guards with inequality check                             |
| Activity tracking stores `null` old/new value                | Handled — `IssueActivity.old_value` and `new_value` are nullable                     |
| `IssueVersion.log_issue_version` includes frequency          | Confirmed at line 809                                                                |
| Max key length vs `max_length=20`                            | Max key is `"quarterly"` at 9 chars — well within limit                              |
| All three i18n locales (en/ko/vi) define `common.frequency`  | Confirmed                                                                            |
| `TIssueFrequency` exported via `packages/types/src/index.ts` | Confirmed via `export * from "./issues"` chain                                       |

---

## Positive Observations

- Pattern consistency is excellent — frequency follows priority's CharField exactly in models, serializers, and activity tracking.
- All three serializers that expose issue fields (`IssueFlatSerializer`, `IssueSerializer`, `IssueListDetailSerializer.to_representation`) correctly include `frequency`.
- The `FrequencyDropdown` uses `usePopper` for positioning, `useDropdown` for shared keyboard/close behavior, and `ComboDropDown` from `@plane/ui` — consistent with all other dropdowns in the codebase.
- The `FrequencyDropdown` provides a `None` option allowing users to clear the field — correctly maps to `null`.
- Migration is clean: adds `frequency` to both `issue` and `issueversion` tables, uses correct `null=True, blank=True`, no `default` required.
- `ISSUE_FREQUENCIES` constant has a distinct color per frequency value, aiding visual differentiation.
- The color dot in `ButtonContent` provides a clear visual affordance consistent with how other colored properties are shown.
- `IssueVersionDetailSerializer` includes `frequency` — version history will correctly capture frequency changes.

---

## Recommended Actions

1. **[High]** Remove duplicate `"name"` from `IssueVersionDetailSerializer.Meta.fields` (line 1011 in `issue.py`).
2. **[High]** Split `FrequencyDropdown` to bring component under 150 lines (extract `ButtonContent`).
3. **[Medium]** Remove hardcoded `placeholder="Frequency"` in `modal-additional-properties.tsx` — let `t("common.frequency")` render.
4. **[Low]** Consider module-level `FREQUENCY_CHOICES` constant to avoid the dual-definition in `Issue` and `IssueVersion` (follow-up, low urgency).
5. **[Low]** Add `validate_frequency` to `IssueCreateSerializer` for stricter server-side enum validation.

---

## Metrics

| Metric                  | Value                                |
| ----------------------- | ------------------------------------ |
| FrequencyDropdown lines | 246 (limit: 150)                     |
| Serializers updated     | 4 of 4 relevant                      |
| i18n locales covered    | 3 of 3 (en, ko, vi)                  |
| Security issues         | 0                                    |
| Breaking changes        | 0                                    |
| Activity tracking       | Correct                              |
| Migration completeness  | Both `issue` + `issueversion` tables |

---

## Unresolved Questions

- Is `frequency` intended to be filterable or groupable in future (like `priority`)? If so, `IssueFilterOptions` type and `EIssueGroupByToServerOptions` will need to be extended.
- Should `frequency` appear in `IssuePublicSerializer` for public boards? Currently omitted — needs product decision if public issues should expose recurrence frequency.
