# Code Review: Remove Opinion + Add Date-Change Reason

**Date:** 2026-03-24
**Scope:** Remove IssueOpinion feature; enforce mandatory reason on `target_date` / `completed_at` change

---

## Scope

- **Backend:** 7 files (views, serializer, activity task, migration, model/serializer/view `__init__`, urls)
- **Frontend:** 11 files (new modal, new CE wrapper, updated sidebar, activity routing, stores, service, types)
- **i18n:** 3 locale files
- **LOC changed:** ~450 net additions, ~300 deletions (opinion removal)
- **Scout findings:** Bulk-date endpoint bypass, `updateIssue` type mismatch, optimistic-update pollution

---

## Overall Assessment

The feature intent is clear and the CE-wrapper pattern is applied correctly. The opinion removal is clean. However, there are two **high-priority** bugs: the `updateIssue` implementation ignores the `TIssueUpdatePayload` type change (still uses `Partial<TIssue>`, dropping `reason` before the API call), and the bulk-date endpoint entirely bypasses the reason gate. One medium-priority issue exists around the `completed_at` clearing path.

---

## Critical Issues

None (no security vulnerabilities, no data loss).

---

## High Priority

### H1 — `reason` dropped before reaching `patchIssue` (frontend type mismatch)

**File:** `apps/web/core/store/issue/issue-details/issue.store.ts` line 181
**File:** `apps/web/core/store/issue/helpers/base-issues.store.ts` line 554

`IssueStoreActions.updateIssue` interface declares `data: TIssueUpdatePayload`, but the **implementation** at line 181 still types `data: Partial<TIssue>`. This means TypeScript accepts calls with `reason` but then passes `data` down to `currentStore.updateIssue(...)`, which is `BaseIssueStore.issueUpdate(... data: Partial<TIssue>)`. `issueUpdate` calls `this.issueService.patchIssue(... data)` — `patchIssue` does accept `TIssueUpdatePayload` now, so `reason` reaches the network. However, `this.rootIssueStore.issues.updateIssue(issueId, data)` (line 565 base-issues) accepts `Partial<TIssue>` and would try to merge `{ reason: "..." }` into the local MobX store cache — which means after an update the cached issue object gets a phantom `reason` property. This won't crash but creates dirty observable state.

**Fix:** Change `issueUpdate` signature to accept `TIssueUpdatePayload`, and strip `reason` before calling `this.rootIssueStore.issues.updateIssue(issueId, data)`:
```ts
const { reason: _reason, ...issueData } = data;
this.rootIssueStore.issues.updateIssue(issueId, issueData);
```

### H2 — Bulk-date endpoint bypasses reason gate

**File:** `apps/api/plane/app/views/issue/base.py` lines 1165–1222 (`IssueBulkUpdateDateEndpoint.post`)

This endpoint accepts `target_date` per issue with no reason validation and no reason forwarding to the activity task. It calls `issue_activity.delay(requested_data=json.dumps({"target_date": ...}))` — no `reason` key — so the activity `comment` will always be empty for bulk updates. Additionally, if the frontend uses bulk-date for Gantt/calendar drag interactions, the reason enforcement is completely skipped.

**Fix:** Either add reason validation+forwarding to this endpoint (same pattern as `partial_update`), or document that bulk-date is admin-internal only and exempt from the policy. A decision is needed.

---

## Medium Priority

### M1 — `completed_at` clearing path inconsistency

**File:** `apps/web/ce/components/issues/issue-details/sidebar/completed-at-property.tsx`

`CompletedAtProperty.handleDateChange` is only triggered when the user picks a date. There is no "clear" affordance wired up in this component. The `CompletedAtDateTimePicker` child component may emit a clear/null value — if it does, `setPendingCompletedAt(null)` then `setIsReasonModalOpen(true)` would open the reason modal even for a clear, contradicting the "only require reason when SETTING a date" decision. Confirm the picker never emits `null` through `onChange`, or add a guard:
```ts
const handleDateChange = (isoString: string | null) => {
  if (!isoString) {
    void updateIssue(..., { completed_at: null });
    return;
  }
  ...
};
```

### M2 — `reason` serializer field not declared explicitly

**File:** `apps/api/plane/app/serializers/issue.py` — `IssueCreateSerializer` uses `fields = "__all__"`.

DRF silently ignores `reason` (not a model field) during `save()`, so no data corruption occurs. But this is implicit and fragile. If someone adds a `reason` field to the `Issue` model later it would silently persist without the intended logic. Add an explicit `read_only=True` or `write_only=True` `reason` field, or pop it in the view before passing to the serializer (add `request.data.pop("reason", None)` after validation). The current approach works but relies on DRF's silent-ignore behavior.

### M3 — Activity comment empty when clearing dates

**File:** `apps/api/plane/bgtasks/issue_activities_task.py` lines 267–284, 298–317

When `target_date` or `completed_at` is cleared (set to null), the reason gate is skipped (correct), but `comment` is set to `""` for those activities. The UI `AdditionalActivityRoot` correctly doesn't render `activity.comment` when it's empty. However, the `track_target_date` / `track_completed_at` functions always assign `reason = requested_data.get("reason", "")` — if someone clears the date and still passes a `reason` in the payload, it gets stored. This is a minor data hygiene issue, not a bug.

### M4 — `activity_list.tsx` only routes `target_date` to `AdditionalActivityRoot`

**File:** `apps/web/core/components/issues/issue-detail/issue-activity/activity/activity-list.tsx` line 75–77

`completed_at` has no explicit case in the switch — it falls through to `default` which also routes to `AdditionalActivityRoot`. This works, but is non-obvious and could cause a future regression if someone adds a `completed_at` case before `default`. Add an explicit case for `completed_at` alongside `target_date`:
```ts
case "completed_at":
  return <AdditionalActivityRoot {...componentDefaultProps} field={activityField} />;
```

---

## Low Priority

### L1 — `DueDatePropertyIcon` imported but unused in sidebar after refactor

**File:** `apps/web/core/components/issues/issue-detail/sidebar.tsx` line 20

`DueDatePropertyIcon` is still imported but the inline DateDropdown for due date has been replaced by `DueDateProperty`. The icon is now rendered inside `DueDateProperty`. Verify whether it is still used elsewhere in `sidebar.tsx` — if not, remove the import to avoid lint warnings.

### L2 — `DueDateProperty` renders inside `SidebarPropertyListItem` that passes its own `icon`

**File:** `apps/web/core/components/issues/issue-detail/sidebar.tsx` lines 208–220

The outer `SidebarPropertyListItem` is given `icon={DueDatePropertyIcon}` but `DueDateProperty` itself does not render a label/icon row — it only renders the `DateDropdown` + `DateAlert`. This is structurally fine but check that the `SidebarPropertyListItem` wrapper doesn't add unwanted nesting compared to how it was before the CE wrapper was introduced (visual regression risk).

### L3 — `fieldLabel` passed as `t("common.order_by.due_date")` may differ from i18n key intent

**File:** `apps/web/ce/components/issues/issue-details/sidebar/due-date-property.tsx` line 88

The modal title uses `t("issue.reason_modal_title", { field: fieldLabel })`. For the due date, `fieldLabel = t("common.order_by.due_date")`. This is fine for English, but confirm that the Vietnamese/Korean locale strings for `reason_modal_title` with interpolation look natural (some languages place the field name differently).

---

## Edge Cases Found

1. **Bulk-date drag (Gantt/Calendar):** As noted in H2 — the `IssueBulkUpdateDateEndpoint` has no reason gate. If users can reach this endpoint from the UI without going through the sidebar (e.g., Gantt bar drag), the reason requirement is silently bypassed server-side.

2. **Programmatic API clients:** External or internal API scripts can PATCH `target_date` without `reason` from any endpoint OTHER than `IssueViewSet.partial_update`. Only that one view has the validation. If there are other views that also save `target_date` (intake, archive restore, etc.), they bypass the check.

3. **Race condition on modal dismiss:** In `DueDateProperty`, if the user opens the modal and simultaneously another update arrives through websocket that changes `target_date`, `pendingDueDate` could be stale when `handleConfirm` fires. Low probability but worth noting.

4. **Empty reason stored for cleared dates:** If a client sends `{ target_date: null, reason: "test" }`, the reason gate is bypassed (correct), but the activity task will store `"test"` as the comment. The `AdditionalActivityRoot` will then display "Reason: test" for a date-removal activity. Cosmetically incorrect.

---

## Positive Observations

- CE wrapper pattern for `DueDateProperty` is well-executed — core sidebar is minimally touched.
- `FieldChangeReasonModal` is clean, reusable, and properly resets state on close.
- Migration `0143_remove_issueopinion.py` is minimal and correct.
- `TIssueUpdatePayload` type is well-documented with JSDoc comment explaining the transient nature of `reason`.
- i18n keys are consistent across all three locales.
- The `requested_data = json.dumps(self.request.data)` approach correctly passes `reason` through to the Celery task without any extra wiring.
- `DueDateProperty` correctly handles the "clearing date = no reason required" path.
- Activity display in `AdditionalActivityRoot` correctly guards `activity.comment` with a truthiness check.

---

## Recommended Actions (Prioritized)

1. **[H1]** Strip `reason` from data before calling `rootIssueStore.issues.updateIssue(issueId, ...)` in `base-issues.store.ts` to avoid polluting the MobX cache with a non-model property.
2. **[H2]** Decide on `IssueBulkUpdateDateEndpoint` policy: exempt it explicitly or add reason validation.
3. **[M1]** Add null guard in `CompletedAtProperty.handleDateChange` in case picker emits null.
4. **[M4]** Add explicit `case "completed_at":` in `activity-list.tsx` switch.
5. **[L1]** Remove unused `DueDatePropertyIcon` import from `sidebar.tsx` if confirmed unused.

---

## Metrics

- Type Coverage: `TIssueUpdatePayload` correctly propagated through interface declarations; implementation body has one mismatch (H1)
- Linting Issues: Likely 1 unused import (L1)
- Test Coverage: No new tests added for the reason validation path; backend unit test for `partial_update` with/without `reason` would close the gap

---

## Unresolved Questions

1. Is `IssueBulkUpdateDateEndpoint` accessible from any frontend interaction (Gantt drag, calendar drag)? If yes, H2 is blocking.
2. Does `CompletedAtDateTimePicker` emit `null` through its `onChange`? If yes, M1 is a real bug.
3. Should the reason enforcement apply only to `IssueViewSet.partial_update` or to all issue update paths (intake, archive, etc.)?
4. Are there other custom views (beyond `base.py`) that call `Issue.save()` with `target_date`/`completed_at` that should also be gated?
