# Code Review: Remove `estimate_time`

**Date:** 2026-03-04
**Branch:** ngoc-feat/work-items
**Scope:** Full field removal across Django backend + TypeScript frontend

---

## Scope

- **Backend files:** 7 (serializer, model, migration, 2 views, 2 bgtasks)
- **Frontend files:** 12 (types, store, i18n ×3, components ×6, 1 deleted)
- **LOC changed:** ~200 net deletions
- **Focus:** Correctness of removal — no missed references, no broken contracts

---

## Overall Assessment

The core removal is clean and complete for the `estimate_time` field on the `Issue` model.
Migration, model, serializer, activity tracker, and i18n keys are all correctly cleaned up.

**However, there is a significant type/API contract mismatch** left behind in the capacity reporting
subsystem: the TypeScript types and two capacity UI components still reference fields that the
backend no longer returns. This will cause runtime errors or silent data bugs in the
Capacity Dashboard.

---

## Critical Issues

### 1. `ICapacityMember` type out of sync with backend response

**File:** `/Users/ngoctran/Documents/Shinhan/plane/packages/types/src/worklog.ts` (lines 76–85)

```ts
export interface ICapacityMember {
  member_id: string;
  display_name: string;
  avatar_url: string;
  total_logged_minutes: number;
  total_estimated_minutes: number; // STALE — backend no longer returns this
  issue_count: number; // STALE — backend no longer returns this
  status: "normal" | "overload" | "under"; // STALE — backend no longer computes this
  days?: Record<string, number>;
}
```

**Backend response (`capacity.py` lines 97–103) only returns:**

```python
{
    "member_id": mid,
    "display_name": ...,
    "avatar_url": ...,
    "total_logged_minutes": ...,
    "days": ...,
}
```

Fields `total_estimated_minutes`, `issue_count`, and `status` are gone from the backend but remain
in the TypeScript interface. The frontend will receive `undefined` for all three at runtime.

**Fix:** Remove the three stale fields from `ICapacityMember` and update all consumers.

---

### 2. `ICapacityReportResponse.project_total_estimated` is stale

**File:** `/Users/ngoctran/Documents/Shinhan/plane/packages/types/src/worklog.ts` (line 92)

```ts
export interface ICapacityReportResponse {
  ...
  project_total_estimated: number;  // STALE — no longer in backend response
  ...
}
```

Backend (`capacity.py` line 117–124) response no longer includes `project_total_estimated`.

---

## High Priority

### 3. `CapacityHeatmap` renders stale fields — will show 0/undefined

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/web/ce/components/time-tracking/capacity/capacity-heatmap.tsx`

Three places use `total_estimated_minutes` and `issue_count` which will be `undefined` at runtime:

- Line 138: `{formatHours(member.total_estimated_minutes)}h` → renders `NaN h`
- Line 181: `member.total_estimated_minutes > 0` → always false, status badge always shows `-`
- Line 201 (tfoot): `members.reduce((acc, m) => acc + m.total_estimated_minutes, 0)` → `NaN`
- Line 145–146: `member.issue_count` → always `undefined` displayed as empty

Also uses `member.status` (lines 96–98) for `isOverloaded`, `isNormal`, `isUnder` — all will be
`undefined`, so all members render as the "no status" grey badge.

**The heatmap "Total Estimated" column and status column are broken.**

---

### 4. `CapacitySummaryCards` burndown chart always empty

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/web/ce/components/time-tracking/capacity/capacity-summary-cards.tsx`

- Props still include `totalEstimatedMinutes: number` (line 21)
- Caller (`capacity-dashboard.tsx` line 129): `totalEstimatedMinutes={capacityData.project_total_estimated}`
  → `undefined` since the backend no longer returns this field
- The burndown chart `remaining` starts at `undefined`, all `burndownData` entries will have
  `Remaining: NaN`
- The "Total Estimated" card (lines 82–88) will always render `NaN h`

---

### 5. `CapacityDashboard` CSV export writes stale column

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/web/ce/components/time-tracking/capacity/capacity-dashboard.tsx` line 69

```ts
"Total Estimated (h)": (member.total_estimated_minutes / 60).toFixed(2),
```

`total_estimated_minutes` is `undefined` → CSV will have `NaN` in every row.

---

## Medium Priority

### 6. `capacity_report.py` docstring is stale

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/bgtasks/capacity_report.py` lines 14–17

The docstring still says:

> "Computes total logged minutes vs total estimated minutes for each member"

The task no longer computes estimated minutes. Minor but misleading for maintainers.

**Fix:** Update docstring to reflect new behavior (logged time only).

---

### 7. `EstimateTimeInput` component still exists but returns empty fragment

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/web/ce/components/estimates/inputs/time-input.tsx`

`EstimateTimeInput` is a stub that returns `<></>`. It is still imported and used in:

- `/Users/ngoctran/Documents/Shinhan/plane/apps/web/core/components/estimates/inputs/root.tsx` (line 12, 38)

This is for the estimate _system_ type (points/categories/time), which is separate from the
`estimate_time` field removed in this PR. **This component appears intentionally kept** — the
estimate system can use a "Time" unit (e.g., story points expressed as hours). No action needed
unless this feature is also being removed.

_Confirm: is `EEstimateSystem.TIME` (estimate type, not the per-issue field) still needed?_

---

## Positive Observations

- Migration `0129` is clean, minimal, correct dependency chain (`0128` → `0129`).
- `issue_activities_task.py` mapper cleanup is thorough — `track_estimate_time` function and map
  entry both removed with no residue.
- `IWorkLogSummary.by_issue` type no longer has `estimate_time`, matching backend response.
- i18n cleanup across all three locales (en, vi, ko) is consistent.
- `TimeTrackingIssueTable` and `TimeTrackingSummaryCards` are correctly simplified.
- `TIssue` type and issue store mapping both cleaned up.
- No stray references in notification card or peek-overview.

---

## Recommended Actions

1. **[Critical]** Remove `total_estimated_minutes`, `issue_count`, `status` from `ICapacityMember`
   in `packages/types/src/worklog.ts`.
2. **[Critical]** Remove `project_total_estimated` from `ICapacityReportResponse`.
3. **[High]** Update `CapacityHeatmap` to remove the "Total Estimated" column and fix status
   rendering — either derive status from `total_logged_minutes` alone or remove the status column.
4. **[High]** Update `CapacitySummaryCards` to remove the burndown chart's dependency on
   `totalEstimatedMinutes` (or replace with a pure logged-time metric).
5. **[High]** Update `CapacityDashboard` CSV export to remove the `Total Estimated (h)` column.
6. **[Medium]** Fix stale docstring in `capacity_report.py`.

---

## Metrics

- Linting issues: 0 syntax errors observed
- Type coverage: **2 stale interfaces** in `packages/types/src/worklog.ts`
- Runtime breakage risk: **High** — Capacity Dashboard will render NaN/undefined values

---

## Unresolved Questions

- Is `EEstimateSystem.TIME` (story-point-as-time-unit) still an active feature? If not,
  `time-input.tsx` and the `root.tsx` switch branch can also be removed.
- Should `issue_count` and `status` fields be re-implemented without `estimate_time` (e.g.,
  `status` based purely on logged vs. a configured capacity threshold), or dropped entirely?
