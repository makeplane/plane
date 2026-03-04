# Phase 8a: Hierarchical Dashboards — L1-L2 (Team Leader + Manager)

## Context Links

- Split from: [phase-08-hierarchical-dashboards.md](phase-08-hierarchical-dashboards.md) (Validation Session 10)
- WorkloadSnapshot model: phase-07
- Bank hierarchy rules: `.claude/rules/bank-hierarchy-and-compliance-rules.md`
- Existing dashboard pattern: `apps/web/core/components/dashboards/`
- Recharts usage: `apps/web/core/components/dashboards/widgets/bar-chart-widget.tsx`
- Gantt chart: `apps/web/core/components/gantt-chart/`

## Overview

- **Priority**: P1
- **Status**: pending
- **Effort**: 5h
- Build L1 (Team Leader) and L2 (Manager) dashboards with role-based routing. Foundation for L3-L5 in Phase 8b.

## Key Insights

- L1 (Team Leader): Gantt chart + individual overload status badges for own team
- L2 (Manager): Department heatmap (member x week) + burn-down with actual time
- Shared infrastructure: dashboard-router, MobX store, backend ViewSet, URL config
- Role detection via DashboardLevelMapping table + StaffProfile.is_department_manager

## Requirements

### Functional

| Level | Role        | View               | Key Widgets                                          |
| ----- | ----------- | ------------------ | ---------------------------------------------------- |
| 1     | Team Leader | My Team Workload   | Gantt chart + individual overload status badges      |
| 2     | Manager     | Department Heatmap | Heatmap (member x week) + burn-down with actual time |

- DashboardRouter detects user level from StaffProfile + DashboardLevelMapping
- Default fallback: Level 1 (Team Leader) if no mapping found
- L1 sees only own department members
- L2 sees department + can drill down to L1 view

### Non-functional

- Dashboard loads in <3s for departments with 50 members
- Lazy dept/org aggregation (from Phase 7 validation)
- Workspace-scoped; no cross-workspace data

## Architecture

```
WorkspaceSlug/workload-dashboard/
├── DashboardRouter (detects user level from StaffProfile)
│   ├── Level 1: TeamLeaderDashboard
│   │   ├── TeamGanttChart (member timelines + overload colors)
│   │   └── MemberOverloadList (OverloadStatusBadge per member)
│   └── Level 2: ManagerDashboard
│       ├── DepartmentHeatmap (member x week matrix, color = overload)
│       └── BurnDownChart (planned vs actual hours over sprint)

Backend:
  WorkloadDashboardViewSet
  ├── GET /workload-dashboard/team/       → L1 data (my team snapshots)
  └── GET /workload-dashboard/department/ → L2 data (department heatmap)
```

## Related Code Files

### Create

- `apps/api/plane/app/views/workspace/workload_dashboard.py` — WorkloadDashboardViewSet (L1+L2 endpoints)
- `apps/api/plane/app/serializers/workload_dashboard.py` — TeamDashboardSerializer, DepartmentDashboardSerializer
- `apps/api/plane/app/urls/workload_dashboard.py` — URL config
- `apps/api/plane/db/models/dashboard_level_mapping.py` — DashboardLevelMapping model
- `apps/web/app/(all)/[workspaceSlug]/workload-dashboard/page.tsx` — page entry
- `apps/web/ce/components/workload/dashboard/dashboard-router.tsx` — level detection + routing
- `apps/web/ce/components/workload/dashboard/team-leader-dashboard.tsx` — L1
- `apps/web/ce/components/workload/dashboard/manager-dashboard.tsx` — L2
- `apps/web/ce/components/workload/widgets/team-gantt-chart.tsx` — L1 gantt
- `apps/web/ce/components/workload/widgets/department-heatmap.tsx` — L2 heatmap
- `apps/web/ce/components/workload/widgets/burn-down-chart.tsx` — L2 burn-down
- `apps/web/ce/store/workload-dashboard.store.ts` — dashboard MobX store
- `packages/types/src/workload-dashboard.d.ts` — TypeScript types

### Modify

- `apps/api/plane/db/models/__init__.py` — add DashboardLevelMapping import
- `apps/api/plane/app/views/__init__.py` — add WorkloadDashboardViewSet
- `apps/api/plane/app/serializers/__init__.py` — add dashboard serializers
- `apps/api/plane/app/urls/__init__.py` — include dashboard URLs
- `apps/web/app/routes/core.ts` — add workload dashboard route
- `apps/web/ce/store/root.store.ts` — add workload dashboard store
- `packages/i18n/src/locales/en/translations.ts` — dashboard labels
- `packages/i18n/src/locales/vi/translations.ts` — dashboard labels
- `packages/i18n/src/locales/ko/translations.ts` — dashboard labels

## Implementation Steps

1. **Create DashboardLevelMapping model** — admin-configurable role → level mapping
2. **Create WorkloadDashboardViewSet** — L1 (team) and L2 (department) endpoints
3. **Create dashboard serializers** — TeamDashboardSerializer, DepartmentDashboardSerializer
4. **Create URL config** + register in **init**.py files
5. **Create TypeScript types** for dashboard data
6. **Create workload-dashboard MobX store** + register in root.store.ts
7. **Create dashboard-router** — detect level, render L1 or L2
8. **Create L1: TeamLeaderDashboard** — TeamGanttChart + MemberOverloadList
9. **Create L2: ManagerDashboard** — DepartmentHeatmap + BurnDownChart
10. **Add route** in core.ts + sidebar navigation
11. **Add i18n keys** (en, vi, ko) for L1/L2 labels

## Todo List

- [ ] Create DashboardLevelMapping model + migration
- [ ] Create WorkloadDashboardViewSet (L1+L2 endpoints)
- [ ] Create dashboard serializers
- [ ] Create URL config + register
- [ ] Create TypeScript dashboard types
- [ ] Create workload-dashboard MobX store
- [ ] Create dashboard-router component
- [ ] Create L1: Team Leader Dashboard + Gantt
- [ ] Create L2: Manager Dashboard + Heatmap + BurnDown
- [ ] Add route + sidebar navigation
- [ ] Add i18n keys (en, vi, ko)

## Success Criteria

- L1 users see team member workload with Gantt + overload badges
- L2 users see department heatmap + burn-down chart
- Role detection works via DashboardLevelMapping + StaffProfile
- Dashboard loads <3s for 50-member department
- Drill-down from L2 → L1 works

## Risk Assessment

- **Gantt chart integration**: Existing Gantt is project-scoped → need adapter for member-centric view
- **Recharts bundle size**: Lazy-load dashboard components to minimize impact
- **DashboardLevelMapping migration**: New model + admin UI needed

## Next Steps

- Phase 8b: L3-L5 dashboards (Director, DGD, GD)
