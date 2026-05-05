# Phase 8: Hierarchical Dashboards (5 Levels)

## Context Links

- Bank hierarchy rules: `.claude/rules/bank-hierarchy-and-compliance-rules.md`
- WorkloadSnapshot model: phase-07 (this plan)
- Existing dashboard pattern: `apps/web/core/components/dashboards/`
- Widget registry: `apps/web/ce/components/home/home-dashboard-widgets.tsx`
- Gantt chart: `apps/web/core/components/gantt-chart/`
- Recharts usage: `apps/web/core/components/dashboards/widgets/bar-chart-widget.tsx`
- Department model: `apps/api/plane/db/models/department.py`
- StaffProfile model: `apps/api/plane/db/models/staff.py`
- Route config: `apps/web/app/routes/core.ts`

## Overview

- **Priority**: P1
- **Status**: split (Validation Session 10)
- **Effort**: 10h → split into 8a (5h) + 8b (5h)
- **See:** [phase-08a-dashboards-l1-l2.md](phase-08a-dashboards-l1-l2.md) | [phase-08b-dashboards-l3-l5.md](phase-08b-dashboards-l3-l5.md)
- Build 5-level hierarchical dashboard with role-based access. Each level shows progressively aggregated workload data from WorkloadSnapshot.

## Key Insights

- 5 levels map to StaffProfile.position/job_grade (configurable mapping table)
- Each level aggregates data from levels below (roll-up pattern)
- Reuse existing widget registry + Gantt chart + Recharts infrastructure
- Department hierarchy already exists; StaffProfile links users to departments
- Dashboard route: workspace-level (not project-level) since it spans projects

## Requirements

### Functional

Per bank-hierarchy-and-compliance-rules.md:

| Level | Role                   | View                      | Key Widgets                                          |
| ----- | ---------------------- | ------------------------- | ---------------------------------------------------- |
| 1     | Team Leader            | My Team Workload          | Gantt chart + individual overload status badges      |
| 2     | Manager                | Department Heatmap        | Heatmap (member x week) + burn-down with actual time |
| 3     | Director               | Cross-Team Comparison     | Bar chart comparing teams + workload roll-up table   |
| 4     | DGD (Head of Division) | Enterprise Risk Dashboard | Overall overload % across bank + risk distribution   |
| 5     | GD (General Director)  | Executive 1-Page Summary  | KPI cards + trend chart + PDF export (read-only)     |

- Role mapping: StaffProfile → dashboard level (admin-configurable)
- Each level can drill down to the level below
- Responsive layout; mobile-friendly summary cards

### Non-functional

- Dashboard loads in <3s for departments with 50 members
- Cached WorkloadSnapshot queries (no recalc on page load)
- Workspace-scoped; no cross-workspace data

## Architecture

```
WorkspaceSlug/workload-dashboard/
├── DashboardRouter (detects user level from StaffProfile)
│   ├── Level 1: TeamLeaderDashboard
│   │   ├── TeamGanttChart (member timelines + overload colors)
│   │   └── MemberOverloadList (OverloadStatusBadge per member)
│   ├── Level 2: ManagerDashboard
│   │   ├── DepartmentHeatmap (member x week matrix, color = overload)
│   │   └── BurnDownChart (planned vs actual hours over sprint)
│   ├── Level 3: DirectorDashboard
│   │   ├── CrossTeamBarChart (avg allocation_pct per department)
│   │   └── WorkloadRollUpTable (department summary rows)
│   ├── Level 4: DGDDashboard
│   │   ├── EnterpriseRiskCards (total red/yellow/green counts)
│   │   ├── RiskDistributionPie (% of staff in each status)
│   │   └── TrendLineChart (overload % over last 12 weeks)
│   └── Level 5: GDDashboard
│       ├── ExecutiveKPICards (headcount, avg allocation, risk %)
│       ├── TrendChart (same as L4, simplified)
│       └── PDFExportButton (triggers phase-09 PDF generation)

Backend Aggregation:
  WorkloadDashboardViewSet
  ├── GET /workload-dashboard/team/       → L1 data (my team snapshots)
  ├── GET /workload-dashboard/department/ → L2 data (department heatmap)
  ├── GET /workload-dashboard/division/   → L3 data (cross-team roll-up)
  ├── GET /workload-dashboard/enterprise/ → L4 data (org-wide risk)
  └── GET /workload-dashboard/executive/  → L5 data (1-page summary)
```

<!-- Updated: Validation Session 3 - Admin-configurable mapping table in DB -->

### Role Mapping (Admin-Configurable)

```python
# New model: DashboardLevelMapping
class DashboardLevelMapping(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE)
    job_grade_pattern = models.CharField(max_length=100)  # regex or exact match
    dashboard_level = models.SmallIntegerField(choices=[(1,"Team Leader"),(2,"Manager"),(3,"Director"),(4,"DGD"),(5,"GD")])

    class Meta:
        unique_together = ["workspace", "job_grade_pattern"]
```

Admin configures mapping via workspace settings. Dashboard-router queries this table to determine user's level. Default fallback: Level 1 (Team Leader) if no mapping found.
Users see their level's dashboard by default; higher levels can drill down.

- Dashboard level detection combines:
  1. DashboardLevelMapping table (admin-configurable in Workspace Settings > General)
  2. Department tree + StaffProfile.is_department_manager for automatic roll-up visibility
- Team Leader (L1) sees only own department.
- Higher levels automatically see aggregated data from ALL descendant departments (recursive query).

## Department Tree Integration (Mandatory)

- Dashboard level detection uses BOTH:
  1. DashboardLevelMapping table (admin configurable)
  2. StaffProfile.department + Department tree (for manager roll-up)
- Team Leader (L1) sees only own department members.
- Manager/Director/DGD/GD see aggregated data from ALL descendant departments via Department.children recursive query.
- Sidebar navigation: "Workload Dashboard" item visible according to user's dashboard level (higher levels see more).

## Related Code Files

### Create

- `apps/api/plane/app/views/workspace/workload_dashboard.py` -- WorkloadDashboardViewSet (5 endpoints)
- `apps/api/plane/app/serializers/workload_dashboard.py` -- aggregation serializers per level
- `apps/api/plane/app/urls/workload_dashboard.py` -- URL config
- `apps/web/app/(all)/[workspaceSlug]/workload-dashboard/page.tsx` -- page entry
- `apps/web/ce/components/workload/dashboard/dashboard-router.tsx` -- level detection + routing
- `apps/web/ce/components/workload/dashboard/team-leader-dashboard.tsx` -- L1
- `apps/web/ce/components/workload/dashboard/manager-dashboard.tsx` -- L2
- `apps/web/ce/components/workload/dashboard/director-dashboard.tsx` -- L3
- `apps/web/ce/components/workload/dashboard/dgd-dashboard.tsx` -- L4
- `apps/web/ce/components/workload/dashboard/gd-dashboard.tsx` -- L5
- `apps/web/ce/components/workload/widgets/team-gantt-chart.tsx` -- L1 gantt
- `apps/web/ce/components/workload/widgets/department-heatmap.tsx` -- L2 heatmap
- `apps/web/ce/components/workload/widgets/burn-down-chart.tsx` -- L2 burn-down
- `apps/web/ce/components/workload/widgets/cross-team-bar-chart.tsx` -- L3 comparison
- `apps/web/ce/components/workload/widgets/workload-roll-up-table.tsx` -- L3 table
- `apps/web/ce/components/workload/widgets/risk-distribution-pie.tsx` -- L4 pie
- `apps/web/ce/components/workload/widgets/enterprise-risk-cards.tsx` -- L4 KPI cards
- `apps/web/ce/components/workload/widgets/trend-line-chart.tsx` -- L4/L5 trend
- `apps/web/ce/components/workload/widgets/executive-kpi-cards.tsx` -- L5 cards
- `apps/web/ce/store/workload-dashboard.store.ts` -- dashboard MobX store
- `packages/types/src/workload-dashboard.d.ts` -- dashboard-specific types

### Modify

- `apps/api/plane/app/views/__init__.py` -- add WorkloadDashboardViewSet
- `apps/api/plane/app/serializers/__init__.py` -- add dashboard serializers
- `apps/api/plane/app/urls/__init__.py` -- include dashboard URLs
- `apps/web/app/routes/core.ts` -- add workload dashboard route
- `apps/web/ce/store/root.store.ts` -- add workload dashboard store
- `packages/types/src/index.d.ts` -- export dashboard types
- `packages/i18n/src/locales/en/translations.ts` -- dashboard labels
- `packages/i18n/src/locales/vi-VN/translations.ts` -- dashboard labels
- `packages/i18n/src/locales/ko/translations.ts` -- dashboard labels

## Implementation Steps

1. **Create WorkloadDashboardViewSet** in `apps/api/plane/app/views/workspace/workload_dashboard.py`
   - 5 action methods: team, department, division, enterprise, executive
   - Each aggregates WorkloadSnapshot data at appropriate scope
   - Permission: workspace member + role-level check via StaffProfile

2. **Create dashboard serializers** in `apps/api/plane/app/serializers/workload_dashboard.py`
   - TeamDashboardSerializer: list of member snapshots
   - DepartmentDashboardSerializer: heatmap matrix (member x period)
   - DivisionDashboardSerializer: per-department aggregates
   - EnterpriseDashboardSerializer: org-wide counts + distribution
   - ExecutiveDashboardSerializer: KPI summary + trend data

3. **Create URL config** in `apps/api/plane/app/urls/workload_dashboard.py`
   - `workspaces/<str:slug>/workload-dashboard/team/`
   - `workspaces/<str:slug>/workload-dashboard/department/`
   - `workspaces/<str:slug>/workload-dashboard/division/`
   - `workspaces/<str:slug>/workload-dashboard/enterprise/`
   - `workspaces/<str:slug>/workload-dashboard/executive/`

4. **Register backend** in **init**.py files (views, serializers, urls)

5. **Create TypeScript types** in `packages/types/src/workload-dashboard.d.ts`
   - ITeamDashboardData, IDepartmentHeatmapData, IDivisionRollUpData, IEnterpriseRiskData, IExecutiveSummaryData

6. **Create workload-dashboard.store.ts** in `apps/web/ce/store/`
   - Observable: dashboardData, currentLevel, isLoading
   - Actions: fetchTeamData, fetchDepartmentData, fetchDivisionData, fetchEnterpriseData, fetchExecutiveData
   - Register in ce/store/root.store.ts

7. **Create dashboard-router.tsx** in `apps/web/ce/components/workload/dashboard/`
   - Detect user's dashboard level from StaffProfile store
   - Render appropriate level component
   - Allow drill-down navigation to lower levels

8. **Create L1: TeamLeaderDashboard** with TeamGanttChart + MemberOverloadList
   - Reuse existing Gantt chart components from `core/components/gantt-chart/`
   - OverloadStatusBadge from phase-07

9. **Create L2: ManagerDashboard** with DepartmentHeatmap + BurnDownChart
   - Heatmap: Recharts custom cell rendering (member rows x week columns, cell color = overload)
   - BurnDown: Recharts LineChart (planned capacity line vs actual hours line)

10. **Create L3: DirectorDashboard** with CrossTeamBarChart + WorkloadRollUpTable
    - Bar chart: Recharts BarChart (department names on x-axis, avg allocation_pct on y-axis)
    - Table: department name, headcount, avg allocation, red count, yellow count

11. **Create L4: DGDDashboard** with EnterpriseRiskCards + RiskDistributionPie + TrendLineChart
    - Cards: total staff, % red, % yellow, % green
    - Pie: Recharts PieChart with semantic colors
    - Trend: Recharts LineChart over last 12 weeks

12. **Create L5: GDDashboard** with ExecutiveKPICards + TrendChart + PDFExportButton
    - Read-only view; no interactive filters
    - PDFExportButton triggers phase-09 backend endpoint

13. **Add route** in `apps/web/app/routes/core.ts`
    - `/:workspaceSlug/workload-dashboard` → page.tsx

14. **Add navigation** in workspace sidebar
    - "Workload Dashboard" item, visible to users with StaffProfile

15. **Add i18n keys** for all 5 level labels, widget titles, filter labels (en, vi, ko)

## Todo List

- [ ] Create WorkloadDashboardViewSet (5 endpoints)
- [ ] Create dashboard serializers (5 levels)
- [ ] Create URL config + register
- [ ] Create TypeScript dashboard types
- [ ] Create workload-dashboard MobX store
- [ ] Create dashboard-router component
- [ ] Create L1: Team Leader Dashboard + Gantt
- [ ] Create L2: Manager Dashboard + Heatmap + BurnDown
- [ ] Create L3: Director Dashboard + CrossTeam comparison
- [ ] Create L4: DGD Dashboard + Enterprise Risk
- [ ] Create L5: GD Dashboard + Executive Summary
- [ ] Add route in core.ts
- [ ] Add workspace sidebar navigation
- [ ] Add i18n keys (en, vi, ko)
- [ ] Test role-based level detection

## Success Criteria

- Each level sees only appropriate data scope (team → org)
- Role-based access enforced: L1 users cannot access L4/L5 data
- Heatmap/Gantt/BurnDown/BarChart/Pie render correctly with Recharts
- Drill-down navigation works from higher to lower levels
- Responsive layout on desktop and tablet
- Dashboard loads <3s for typical department (20-50 members)

## Risk Assessment

<!-- Updated: Validation Session 3 - Admin-configurable confirmed -->

- **Role mapping complexity**: Admin-configurable DashboardLevelMapping table. Need admin settings UI + migration.
- **Data volume at L4/L5**: Org-wide aggregation → pre-aggregate in Celery task or cache
- **Gantt chart integration**: Existing Gantt is project-scoped → may need adapter for member-centric view
- **Recharts bundle size**: Multiple chart types → lazy-load dashboard components

## Security Considerations

- Level-based access control: users only see data at their level or below
- Department-scoped queries for L1-L2 (only own department)
- Division-scoped for L3 (own division's departments)
- Org-wide for L4-L5 (admin/executive only)
- Workspace filtering prevents cross-workspace data leak
- No export capability except L5 PDF (controlled)

## Next Steps

- Phase 9: PDF report generation for L5 executive summary
- Future: Real-time WebSocket updates for live dashboard refresh
