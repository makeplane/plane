# Weekend Working-Day Duration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add nullable per-Work Item planned working-day duration and derive `target_date` across weekends.

**Architecture:** Keep Plane's public schedule model as `start_date` and `target_date`, with a new nullable `planned_duration_working_days` field on `Issue`. Add pure weekend-only scheduling helpers, normalize Issue schedule writes on the server, and let frontend controls send duration updates through existing Issue update flows.

**Tech Stack:** Django model/serializer/view code, pytest, React/TypeScript, MobX, `@plane/propel`/`@plane/ui`.

---

## File Structure

- `apps/api/plane/app/services/weekend_working_days.py`: pure weekend-only scheduling helpers for this slice.
- `apps/api/plane/tests/unit/services/test_weekend_working_days.py`: helper tests.
- `apps/api/plane/db/models/issue.py`: add nullable `planned_duration_working_days`.
- `apps/api/plane/db/migrations/0122_issue_planned_duration_working_days.py`: database migration.
- `apps/api/plane/app/serializers/issue.py`: expose field and normalize create/update schedules.
- `apps/api/plane/app/views/issue/base.py`: preserve duration invariants for Gantt bulk date updates.
- `apps/api/plane/app/views/issue/timeline_propagation.py`: load and persist planned duration in propagation.
- `apps/api/plane/app/services/timeline_propagation/types.py`: carry planned duration in schedule snapshot and update result.
- `apps/api/plane/app/services/timeline_propagation/propagation.py`: derive propagated target dates for duration-managed Work Items.
- `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py`: propagation duration tests.
- `apps/api/plane/tests/contract/app/test_timeline_propagation.py`: endpoint persistence coverage for planned duration.
- `packages/types/src/issues/issue.ts`: add `planned_duration_working_days`.
- `apps/web/core/store/issue/helpers/base-issues.store.ts`: merge full PATCH response so derived `target_date` reaches MobX.
- `apps/web/core/components/issues/issue-detail/sidebar.tsx`: add compact numeric duration control.

## Task 1: Weekend Scheduling Helper

**Files:**

- Create: `apps/api/plane/app/services/weekend_working_days.py`
- Create: `apps/api/plane/tests/unit/services/test_weekend_working_days.py`

- [ ] **Step 1: Write failing helper tests**

Create tests for Friday+1, Friday+2, Thursday+3, Saturday+1, working-day counting, null-free positive durations, and invalid non-positive duration.

Run: `cd apps/api && uv run pytest plane/tests/unit/services/test_weekend_working_days.py -q`

Expected: FAIL with import error for `plane.app.services.weekend_working_days`.

- [ ] **Step 2: Implement helper**

Implement:

```python
def is_weekend(d: date) -> bool
def is_working_day(d: date) -> bool
def add_working_days(start: date, duration: int) -> date
def count_working_days(start: date, target: date) -> int
```

`add_working_days` treats the first weekday on or after `start` as day 1 and rejects `duration < 1`.

- [ ] **Step 3: Verify helper**

Run: `cd apps/api && uv run pytest plane/tests/unit/services/test_weekend_working_days.py -q`

Expected: PASS.

## Task 2: Issue Model and Serializer Normalization

**Files:**

- Modify: `apps/api/plane/db/models/issue.py`
- Create: `apps/api/plane/db/migrations/0122_issue_planned_duration_working_days.py`
- Modify: `apps/api/plane/app/serializers/issue.py`
- Create: `apps/api/plane/tests/contract/app/test_issue_working_day_duration.py`

- [ ] **Step 1: Write failing API contract tests**

Cover create/update behavior:

- create with `start_date=2026-05-08` and `planned_duration_working_days=2` returns/persists `target_date=2026-05-11`.
- patching an existing item from duration 3 to 1 shrinks the target date.
- patching `target_date` directly recalculates `planned_duration_working_days`.
- clearing duration leaves explicit target date behavior.
- duration 0 returns HTTP 400.

Run: `cd apps/api && uv run pytest plane/tests/contract/app/test_issue_working_day_duration.py -q`

Expected: FAIL because the field does not exist.

- [ ] **Step 2: Add model and migration**

Add:

```python
planned_duration_working_days = models.PositiveSmallIntegerField(null=True, blank=True)
```

Use migration `0122_issue_planned_duration_working_days.py` with an `AddField` on `issue`.

- [ ] **Step 3: Normalize serializer schedules**

In `IssueCreateSerializer.validate`, call a small local helper that:

- rejects duration outside 1..366,
- derives `target_date` from `start_date` and duration when duration is present,
- derives duration from explicit `start_date`/`target_date` when target date is present without duration.

In `IssueCreateSerializer.update`, merge instance schedule values with incoming partial data before normalization so PATCH behaves correctly.

Add `planned_duration_working_days` to `IssueFlatSerializer`, `IssueSerializer.Meta.fields`, and `IssueListDetailSerializer.to_representation`.

- [ ] **Step 4: Verify API contracts**

Run: `cd apps/api && uv run pytest plane/tests/contract/app/test_issue_working_day_duration.py -q`

Expected: PASS.

## Task 3: Bulk Date Updates and Timeline Propagation

**Files:**

- Modify: `apps/api/plane/app/views/issue/base.py`
- Modify: `apps/api/plane/app/views/issue/timeline_propagation.py`
- Modify: `apps/api/plane/app/services/timeline_propagation/types.py`
- Modify: `apps/api/plane/app/services/timeline_propagation/propagation.py`
- Modify: `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py`
- Modify: `apps/api/plane/tests/contract/app/test_timeline_propagation.py`

- [ ] **Step 1: Write failing propagation tests**

Add unit coverage proving:

- a successor without planned duration keeps existing calendar-day propagation,
- a successor with `planned_duration_working_days=2` and new start Friday gets target Monday.

Run: `cd apps/api && uv run pytest plane/tests/unit/services/timeline_propagation/test_propagation.py -q`

Expected: FAIL because `ScheduledWorkItem` has no planned duration.

- [ ] **Step 2: Implement propagation schedule carry-through**

Add `planned_duration_working_days: int | None` to `ScheduledWorkItem` and `WorkItemUpdate`.

When shifting a Work Item with planned duration, set:

```python
new_target = add_working_days(new_start, succ.planned_duration_working_days)
```

Use the same rule for backward predecessor movement, deriving `new_start` from `new_target` with the existing calendar-day fallback for items without duration.

- [ ] **Step 3: Update API persistence**

Load `planned_duration_working_days` in `TimelinePropagationView`, include it in `ScheduledWorkItem`, write it through `WorkItemUpdate`, and include it in response `work_items`.

In `IssueBulkUpdateDateEndpoint`, when direct `target_date` changes for an issue with `start_date`, recalculate `planned_duration_working_days`. When `start_date` changes for an issue with duration, derive the new `target_date`.

- [ ] **Step 4: Verify propagation and endpoint tests**

Run: `cd apps/api && uv run pytest plane/tests/unit/services/timeline_propagation/test_propagation.py plane/tests/contract/app/test_timeline_propagation.py -q`

Expected: PASS.

## Task 4: Frontend Types, Store, and Detail Control

**Files:**

- Modify: `packages/types/src/issues/issue.ts`
- Modify: `packages/types/src/issues/timeline-propagation.ts`
- Modify: `apps/web/core/store/issue/helpers/base-issues.store.ts`
- Modify: `apps/web/ce/store/timeline/timeline-propagation.store.ts`
- Modify: `apps/web/core/components/issues/issue-detail/sidebar.tsx`

- [ ] **Step 1: Write type/store expectation by running types**

Run: `pnpm check:types`

Expected: FAIL after backend response fields are added until TS types include `planned_duration_working_days`.

- [ ] **Step 2: Add TypeScript fields**

Add `planned_duration_working_days: number | null` to `TBaseIssue` and timeline propagation response work items.

Update `TimelinePropagationStore` to write returned `planned_duration_working_days`.

Update `BaseIssuesStore.issueUpdate` to merge the full PATCH response into MobX, not only `updated_at`, so server-derived `target_date` is visible after duration changes.

- [ ] **Step 3: Add sidebar input**

Import `Input` and add a `SidebarPropertyListItem` labelled "Duration" after the due date field. Use a numeric transparent input with min 1 and max 366. On blur or Enter, send:

```ts
{
  planned_duration_working_days: value ? Number(value) : null;
}
```

- [ ] **Step 4: Verify frontend types**

Run: `pnpm check:types`

Expected: PASS.

## Task 5: Focused Verification and Commit

**Files:**

- All changed files above.

- [ ] **Step 1: Run backend focused tests**

Run:

```bash
cd apps/api && uv run pytest \
  plane/tests/unit/services/test_weekend_working_days.py \
  plane/tests/contract/app/test_issue_working_day_duration.py \
  plane/tests/unit/services/timeline_propagation/test_propagation.py \
  plane/tests/contract/app/test_timeline_propagation.py \
  -q
```

Expected: PASS.

- [ ] **Step 2: Run repository checks**

Run: `pnpm check:types`

Expected: PASS.

- [ ] **Step 3: Format and lint touched files**

Run: `pnpm fix`

Expected: completes without introducing unrelated changes.

- [ ] **Step 4: Commit implementation**

Commit message:

```bash
git commit -m "feat: add weekend working-day duration scheduling"
```
