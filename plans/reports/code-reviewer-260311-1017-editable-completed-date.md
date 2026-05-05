# Code Review: Editable Completed Date for Work Items

**Date:** 2026-03-11
**Branch:** ngoc-feat/workspaces
**Reviewer:** code-reviewer agent

---

## Scope

- Files changed: 4
- Backend: `apps/api/plane/db/models/issue.py`, `apps/api/plane/bgtasks/issue_activities_task.py`
- Frontend: `apps/web/ce/components/issues/issue-details/sidebar/completed-at-property.tsx`, `apps/web/ce/components/issues/issue-details/sidebar/completed-at-date-time-picker.tsx`
- Core files confirmed unmodified by this diff (sidebar.tsx and peek-overview/properties.tsx had existing `CompletedAtProperty` import from a prior commit `412d4c2e1`)

---

## Overall Assessment

The implementation is structurally sound with a correct CE pattern split. The core logic for preserving manual edits on unchanged state transitions is the right approach. However, there are several issues ranging from a potential data integrity bug to stale React state and a missing security validation.

**Score: 6.5 / 10**

---

## Critical Issues

### 1. `Issue.save()` — Extra DB query on every UPDATE (performance + correctness risk)

`apps/api/plane/db/models/issue.py` lines 205–210:

```python
old_state_id = Issue.objects.filter(pk=self.pk).values_list("state_id", flat=True).first()
if old_state_id != self.state_id:
```

This fires a `SELECT` query on **every** `issue.save()` for existing issues, including saves that have nothing to do with `completed_at` (e.g., description updates, label changes). At scale this is a measurable regression.

**The standard Django pattern** is to cache the old value at load time using `__init__` or a pre-save signal, or use `update_fields` checking. Example:

```python
class Issue(ProjectBaseModel):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._original_state_id = self.state_id  # cached at load
```

Then in `save()`:

```python
if self._original_state_id != self.state_id:
    ...
```

This eliminates the extra query. The current approach also has a subtle race: between the DB read and the `super().save()`, another process could change the state — though this is very unlikely in practice.

### 2. `completed_at` is writable with no backend validation

`IssueCreateSerializer` uses `fields = "__all__"` and `completed_at` is **not** in `read_only_fields`. This means any authenticated project member with PATCH access can set `completed_at` to an arbitrary future or past value, including on issues **not in a completed state**.

The backend `Issue.save()` only guards against auto-setting on state change — it does not reject or clamp manually provided `completed_at` values. A user could, for example, PATCH `completed_at` on a "backlog" issue directly via the API.

**Recommended fix:** In `IssueCreateSerializer.validate()` or the PATCH view, check:

```python
if "completed_at" in attrs and attrs.get("completed_at") is not None:
    # Resolve the effective state
    state = attrs.get("state") or instance.state  # instance from self.instance
    if state and state.group != "completed":
        raise serializers.ValidationError(
            {"completed_at": "Cannot set completed_at on a non-completed state."}
        )
```

---

## High Priority

### 3. Stale `useState` initializers in `CompletedAtDateTimePicker`

`apps/web/ce/components/issues/issue-details/sidebar/completed-at-date-time-picker.tsx` lines 34–41:

```typescript
const existing = value ? new Date(value) : null;
const [selectedDate, setSelectedDate] = useState<Date | undefined>(existing ?? undefined);
const [timeValue, setTimeValue] = useState<string>(() => { ... });
```

`useState` initializers run **once on mount**. If the parent re-renders with a new `value` prop (e.g., after a successful `updateIssue` call from another tab or after optimistic update), `selectedDate` and `timeValue` will be stale — they will not reflect the updated `value`.

**Fix:** Add a `useEffect` to sync state when `value` changes:

```typescript
useEffect(() => {
  const d = value ? new Date(value) : null;
  setSelectedDate(d ?? undefined);
  setTimeValue(
    d ? `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}` : "00:00"
  );
}, [value]);
```

Or use a `key={value}` prop on the component at the parent call site to force remount on value change (simpler but heavier).

### 4. `CompletedAtDateTimePicker` is not wrapped in `observer`

The component calls `useUserProfile()` which returns MobX observable data (`data?.start_of_the_week`). Since the component is a plain function (not wrapped with `observer`), it **will not re-render** if the user profile changes while the popover is open.

This is low-impact in practice but violates the MobX pattern used throughout the codebase.

**Fix:** Wrap with `observer`:

```typescript
export const CompletedAtDateTimePicker = observer(function CompletedAtDateTimePicker(...) {
```

---

## Medium Priority

### 5. `handleApply` — time parsing not validated

`completed-at-date-time-picker.tsx` line 47:

```typescript
const [hours, minutes] = timeValue.split(":").map((s) => Number(s));
```

If `timeValue` is somehow empty or malformed (e.g., browser `<input type="time">` cleared), `hours` and `minutes` will be `NaN`. The `combined.setHours(NaN, NaN, 0, 0)` call produces an invalid Date and `combined.toISOString()` throws a `RangeError`.

**Fix:**

```typescript
const hours = parseInt(timeValue.split(":")[0] ?? "0", 10) || 0;
const minutes = parseInt(timeValue.split(":")[1] ?? "0", 10) || 0;
```

### 6. Activity tracking fires on auto-state-change transitions

When a user changes the state to "completed", `Issue.save()` auto-sets `completed_at = now()`. The PATCH request includes `state_id` in `requested_data` but may or may not include `completed_at`. Since the activity task reads `requested_data` from `self.request.data` (the raw PATCH body), `track_completed_at` will only fire if the client explicitly sent `completed_at` in the PATCH.

**Implication:** Auto-set `completed_at` from state transitions is **not tracked** in activity history. This is probably acceptable as-is (state change is already tracked), but it means the activity log shows state changes without a corresponding `completed_at` entry, which could confuse audit readers.

This may be intentional — worth documenting with a comment in the activity mapper.

### 7. `CompletedAtProperty` fallback value is misleading

`completed-at-property.tsx` line 49:

```typescript
const completedAt = issue.completed_at ?? new Date().toISOString();
```

If `issue.completed_at` is null (which should not happen in completed-state issues, but is possible due to edge case #2 above), the component shows the **current time at render**, not the actual completion time. Each render would show a different value. This should be `null` or guarded earlier.

---

## Low Priority

### 8. `disabledDays` is always an empty array

`completed-at-date-time-picker.tsx` line 43:

```typescript
const disabledDays: Matcher[] = [];
```

This is unused configuration noise. Either remove it or apply a meaningful constraint (e.g., disabling future dates for completion). Future dates for `completed_at` are logically invalid.

### 9. `DueDatePropertyIcon` used for completed-at

`completed-at-property.tsx` line 14: The `DueDatePropertyIcon` is semantically incorrect for a completion date — it's the due date icon. A `CheckCircle` or dedicated completed icon would be more appropriate.

---

## Positive Observations

- The core CE pattern is respected: new components live in `ce/`, core files untouched in this diff.
- `track_completed_at` faithfully mirrors `track_target_date` — consistent pattern, clean signature.
- `Issue.save()` correctly handles the three cases: new issue (auto-set), existing with state change (auto-set), existing without state change (preserve manual value). The logic branching is readable.
- The `observer` wrapper on `CompletedAtProperty` is correct.
- `useParams()` inside the component avoids prop drilling — clean self-contained design.
- `IssueCreateSerializer` field-level write access for `completed_at` is consistent with how `target_date` is handled (same serializer), so the pattern is consistent — the validation gap exists for `target_date` too, but that is pre-existing.
- The Headless UI Popover + Apply/Cancel flow prevents accidental immediate updates.

---

## Recommended Actions (Priority Order)

1. **[High]** Replace the `Issue.save()` extra DB query with an `__init__`-based cached original state ID.
2. **[High]** Add server-side validation in `IssueCreateSerializer.validate()` to reject `completed_at` on non-completed states.
3. **[High]** Fix stale `useState` in `CompletedAtDateTimePicker` with a `useEffect` sync on `value` prop.
4. **[Medium]** Wrap `CompletedAtDateTimePicker` in `observer`.
5. **[Medium]** Guard `NaN` in `handleApply` time parsing.
6. **[Low]** Remove `disabledDays` empty array or enforce no-future-date constraint.
7. **[Low]** Use correct icon for completed-at property.

---

## Unresolved Questions

1. Should `completed_at` be allowed to be set to a future date? If not, the Calendar should disable future dates and the serializer should validate this.
2. When `completed_at` is auto-set by a state transition, should there be an activity log entry for `completed_at` field (currently there is not)?
3. The peek-overview `properties.tsx` also imports `CompletedAtProperty` — is it intended that peek-overview also shows the editable picker? The review scope only mentioned sidebar, but both are wired in core files from a prior commit.
