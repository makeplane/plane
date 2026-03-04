# Phase 7: Overload Calculation Engine & Color Status

## Context Links

- Bank hierarchy rules: `.claude/rules/bank-hierarchy-and-compliance-rules.md`
- Celery task pattern: `apps/api/plane/bgtasks/issue_activities_task.py`
- IssueWorkLog model: `apps/api/plane/db/models/worklog.py`
- Existing worklog ViewSet: `apps/api/plane/app/views/issue/worklog.py`
- MobX store pattern: `apps/web/core/store/worklog.store.ts`
- Semantic color tokens: `.claude/rules/plane-design-system.md` (bg-success-subtle, bg-warning-subtle, bg-danger-subtle)

## Overview

- **Priority**: P1
- **Status**: pending
- **Effort**: 6h
- Build Celery-based overload calculation engine. Computes allocation_pct per member per period. Stores snapshots for historical tracking. Color status (green/yellow/red) using semantic tokens.

## Key Insights

<!-- Updated: Validation Session 3 - Weekly period Mon-Sun, simple 8h*weekdays capacity -->

<!-- Updated: Validation Session 10 - Member-only recalc, lazy dept rollup, null estimate=0 -->

- Formula: `allocation_pct = (actual_hours_logged + remaining_estimate_hours) / daily_capacity_hours`
- `daily_capacity_hours = 8 * weekdays_in_week` (MVP: no leave adjustment, future iteration)
- **Null estimate_time**: Treat as 0 (no remaining work assumed) — KISS
- **Period granularity: Weekly (Mon-Sun)** — ~52 snapshots/member/year
- Trigger on every worklog mutation (create/update/delete) via Celery
- **Recalc scope: Member-only** — Celery task only recalculates the affected member's snapshot
- **Dept/org aggregation: Lazy** — computed on dashboard request with caching, NOT pre-aggregated on every mutation
- WorkloadSnapshot stores per-member results; department/org rollups computed at read time
- Use ChangeTrackerMixin on IssueWorkLog to detect changes in duration_minutes
- Add week boundary utility: `get_week_boundaries(date) → (monday, sunday)`

## Bank & Department Integration

- Overload calculation MUST use Department hierarchy for roll-up:
  - Individual member → Team (L3/L4) → Department → Division → Group Biz → Bank-wide.
- Use StaffProfile.department FK and recursive get_all_descendants(department) to determine scope.
- Manager visibility: if user manages a department, automatically include workload of all child departments.
- Capacity: Start with 8h \* weekdays (MVP). Future iteration will read StaffProfile.leave_days, shift_type, part_time_ratio.
- Pre-aggregation in Celery task MUST create additional rows:
  - department-level (member=NULL, department=dept_id, aggregation_level='DEPARTMENT')
  - division-level, group-level, and org-wide (member=NULL, department=NULL, aggregation_level='ORG')
- L4/L5 dashboards query these pre-computed rows directly for sub-second performance.

## Requirements

### Functional

- Overload calculation per member: allocation_pct based on actual + remaining vs capacity
- Color status thresholds: Green (<80%), Yellow (80-100%), Red (>100%)
- Celery task `bank_workload_calculation` triggers on every worklog create/update/delete
- WorkloadSnapshot model stores: member, department, period, allocation_pct, status, hours breakdown
- API endpoint to query snapshots by department, member, date range
- Internal alert when any member status = Red (>100%)

### Non-functional

- Batch calculation for department-wide updates (avoid per-member task storms)
- Idempotent: re-running same calculation yields same snapshot
- Performance: handle departments with 50+ members without timeout

## Architecture

```
IssueWorkLogViewSet (create/update/delete)
  → bank_workload_calculation.delay(issue_id, member_id)
    → Celery task:
      1. Aggregate actual_hours from IssueWorkLog for member in period
      <!-- Updated: Validation Session 10 - Member-only recalc, lazy dept rollup, null estimate=0 -->
      2. Aggregate remaining_estimate from assigned Issues: (COALESCE(estimate_time, 0) - logged_minutes) / 60
      3. Calculate daily_capacity (8h * working_days)
      4. allocation_pct = (actual + remaining) / capacity
      5. status = green/yellow/red based on thresholds
      6. Upsert WorkloadSnapshot for (member, period)
    → Dept/org aggregation: computed lazily on dashboard API request (cached, not pre-aggregated)
```

### WorkloadSnapshot Model

```python
class WorkloadSnapshot(BaseModel):
    member = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="workload_snapshots")
    department = models.ForeignKey("db.Department", on_delete=models.CASCADE, related_name="workload_snapshots", null=True, blank=True)
    period_start = models.DateField()
    period_end = models.DateField()
    actual_hours = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    estimated_remaining = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    capacity_hours = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    allocation_pct = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    status = models.CharField(max_length=10, choices=[("green","Green"),("yellow","Yellow"),("red","Red")], default="green")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="workload_snapshots")

    class Meta:
        db_table = "workload_snapshots"
        unique_together = ["member", "period_start", "period_end", "workspace"]
        indexes = [
            models.Index(fields=["workspace", "department", "period_start"]),
            models.Index(fields=["member", "period_start"]),
            models.Index(fields=["status"]),
        ]
```

## Related Code Files

### Create

- `apps/api/plane/db/models/workload_snapshot.py` -- WorkloadSnapshot model
- `apps/api/plane/bgtasks/bank_workload_calculation.py` -- Celery task
- `apps/api/plane/app/views/workspace/workload.py` -- WorkloadSnapshotViewSet
- `apps/api/plane/app/serializers/workload.py` -- WorkloadSnapshotSerializer
- `apps/api/plane/app/urls/workload.py` -- URL config
- `apps/web/ce/components/workload/overload-status-badge.tsx` -- OverloadStatusBadge component
- `packages/types/src/workload.d.ts` -- TypeScript types for workload
- `packages/constants/src/workload.ts` -- Overload thresholds + color mapping

### Modify

- `apps/api/plane/db/models/__init__.py` -- add WorkloadSnapshot import
- `apps/api/plane/app/views/__init__.py` -- add WorkloadSnapshotViewSet import
- `apps/api/plane/app/serializers/__init__.py` -- add serializer import
- `apps/api/plane/app/urls/__init__.py` -- include workload URLs
- `apps/api/plane/app/views/issue/worklog.py` -- add Celery trigger on create/update/delete
- `apps/web/core/store/worklog.store.ts` -- add workload snapshot methods
- `apps/web/core/services/worklog.service.ts` -- add workload endpoints
- `packages/i18n/src/locales/en/translations.ts` -- overload i18n keys
- `packages/i18n/src/locales/vi-VN/translations.ts` -- overload i18n keys

## Implementation Steps

1. **Create WorkloadSnapshot model** in `apps/api/plane/db/models/workload_snapshot.py`
   - Inherit BaseModel; fields: member, department, workspace, period_start, period_end, actual_hours, estimated_remaining, capacity_hours, allocation_pct, status
   - Unique constraint on (member, period_start, period_end, workspace)

2. **Register model** in `apps/api/plane/db/models/__init__.py`
   - `from .workload_snapshot import WorkloadSnapshot`

3. **Create migration** -- `python manage.py makemigrations db`

4. **Create bank_workload_calculation Celery task** in `apps/api/plane/bgtasks/bank_workload_calculation.py`
   - Input: issue_id (str), optionally member_id
   - Determine affected member(s) from issue assignees
   - For each member: aggregate actual_hours (Sum of duration_minutes / 60), remaining estimate (sum of estimate_time - logged for assigned issues), capacity (8 \* working_days in period)
   - Compute allocation_pct, determine status color
   - Upsert WorkloadSnapshot using `update_or_create`

5. **Add Celery trigger to IssueWorkLogViewSet** in `apps/api/plane/app/views/issue/worklog.py`
   <!-- Updated: Validation Session 4 - countdown=60s debounce on all triggers -->
   - After create: `bank_workload_calculation.apply_async(kwargs={"issue_id": str(issue.id)}, countdown=60)`
   - After update: `bank_workload_calculation.apply_async(kwargs={"issue_id": str(issue.id)}, countdown=60)`
   - After delete: `bank_workload_calculation.apply_async(kwargs={"issue_id": str(issue.id)}, countdown=60)`

6. **Create WorkloadSnapshotSerializer** in `apps/api/plane/app/serializers/workload.py`
   - Read-only serializer; fields: id, member, department, period_start, period_end, actual_hours, estimated_remaining, capacity_hours, allocation_pct, status

7. **Create WorkloadSnapshotViewSet** in `apps/api/plane/app/views/workspace/workload.py`
   - Workspace-scoped list endpoint
   - Filters: department_id, member_id, period_start, period_end, status
   - Permission: ADMIN + MEMBER

8. **Create URL config** in `apps/api/plane/app/urls/workload.py`
   - `workspaces/<str:slug>/workload-snapshots/` -- list
   - Register in `apps/api/plane/app/urls/__init__.py`

9. **Add TypeScript types** in `packages/types/src/workload.d.ts`

   ```typescript
   export type TOverloadStatus = "green" | "yellow" | "red";
   export interface IWorkloadSnapshot {
     id: string;
     member: string;
     department: string | null;
     period_start: string;
     period_end: string;
     actual_hours: number;
     estimated_remaining: number;
     capacity_hours: number;
     allocation_pct: number;
     status: TOverloadStatus;
   }
   ```

10. **Add workload constants** in `packages/constants/src/workload.ts`
    - Thresholds: GREEN_MAX=80, YELLOW_MAX=100
    - Color map: green → bg-success-subtle/text-color-success-primary, yellow → bg-warning-subtle/text-color-warning-primary, red → bg-danger-subtle/text-color-danger-primary

11. **Create OverloadStatusBadge component** in `apps/web/ce/components/workload/overload-status-badge.tsx`
    - Props: status (TOverloadStatus), allocationPct (number)
    - Renders badge with semantic color tokens, percentage text
    - Uses `cn()` for conditional class application

12. **Add i18n keys** for overload labels (en, vi, ko)
    - `workload.overload`, `workload.green`, `workload.yellow`, `workload.red`, `workload.allocation`

## Todo List

- [ ] Create WorkloadSnapshot model
- [ ] Create migration
- [ ] Create bank_workload_calculation Celery task
- [ ] Add Celery trigger to IssueWorkLogViewSet
- [ ] Create WorkloadSnapshotSerializer
- [ ] Create WorkloadSnapshotViewSet
- [ ] Create URL config + register
- [ ] Add TypeScript types for workload
- [ ] Add workload constants (thresholds, colors)
- [ ] Create OverloadStatusBadge component
- [ ] Extend worklog service with snapshot endpoint
- [ ] Add i18n keys

## Success Criteria

- Celery task fires on every worklog mutation (create/update/delete)
- allocation_pct correctly computed: (actual + remaining) / capacity
- Color status: green <80%, yellow 80-100%, red >100%
- Snapshots queryable via API by department, member, period
- OverloadStatusBadge renders correct color using semantic tokens
- Idempotent: re-running calculation produces same snapshot

## Risk Assessment

<!-- Updated: Validation Session 4 - countdown=60s debounce confirmed -->

<!-- Updated: Validation Session 10 - Member-only recalc confirmed -->

- **Calculation frequency**: Use `countdown=60` on all `.delay()` calls. Last trigger wins due to upsert. Simple debounce.
- **Large departments**: Member-only recalc. Dept/org rollup lazy-computed on dashboard read with caching.
<!-- Updated: Validation Session 3 - MVP simple capacity confirmed -->
- **Working days calculation**: MVP = 8h \* weekdays (Mon-Fri) per week. Leave/shift/part-time deferred to future iteration.
- **Timezone handling**: Period boundaries must respect workspace timezone

## Security Considerations

- Only ADMIN + MEMBER can view workload snapshots
- Department-scoped queries: members only see their department unless admin
- Workspace filtering prevents cross-workspace data leak
- No PII exposed beyond member_id (display names resolved client-side)

## Next Steps

- Phase 8: Hierarchical dashboards consume WorkloadSnapshot data
- Phase 9: PDF reports export dashboard views
