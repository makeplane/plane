# Phase 8b: Hierarchical Dashboards — L3-L5 (Director + DGD + GD)

## Context Links

- Split from: [phase-08-hierarchical-dashboards.md](phase-08-hierarchical-dashboards.md) (Validation Session 10)
- Phase 8a (prerequisite): [phase-08a-dashboards-l1-l2.md](phase-08a-dashboards-l1-l2.md)
- WorkloadSnapshot model: phase-07
- Bank hierarchy rules: `.claude/rules/bank-hierarchy-and-compliance-rules.md`

## Overview

- **Priority**: P1
- **Status**: pending
- **Effort**: 5h
- **Depends on**: Phase 8a (shared infrastructure: dashboard-router, MobX store, ViewSet, URL config)
- Build L3 (Director), L4 (DGD), L5 (GD) dashboards with cross-team/org-wide aggregation.

## Key Insights

- L3 (Director): Cross-team bar chart + workload roll-up table
- L4 (DGD): Enterprise risk cards + risk distribution pie + trend line chart
- L5 (GD): Executive KPI cards + trend chart + PDF export (read-only)
- Dept/org aggregation is lazy (computed on request, cached) per Validation Session 10
- Higher levels see aggregated data from ALL descendant departments (recursive query)

## Requirements

### Functional

| Level | Role                   | View                      | Key Widgets                                        |
| ----- | ---------------------- | ------------------------- | -------------------------------------------------- |
| 3     | Director               | Cross-Team Comparison     | Bar chart comparing teams + workload roll-up table |
| 4     | DGD (Head of Division) | Enterprise Risk Dashboard | Overall overload % + risk distribution             |
| 5     | GD (General Director)  | Executive 1-Page Summary  | KPI cards + trend chart + PDF export (read-only)   |

- L3 sees own division's departments (recursive Department children)
- L4 sees org-wide risk aggregation
- L5 read-only executive summary with PDF export
- Drill-down: L5→L4→L3→L2→L1

### Non-functional

- Dashboard loads <3s for org-wide queries
- Lazy aggregation with caching (no pre-aggregated rows)
- PDF export for L5 only

## Architecture

```
WorkspaceSlug/workload-dashboard/
├── DashboardRouter (from Phase 8a)
│   ├── Level 3: DirectorDashboard
│   │   ├── CrossTeamBarChart (avg allocation_pct per department)
│   │   └── WorkloadRollUpTable (department summary rows)
│   ├── Level 4: DGDDashboard
│   │   ├── EnterpriseRiskCards (total red/yellow/green counts)
│   │   ├── RiskDistributionPie (% of staff in each status)
│   │   └── TrendLineChart (overload % over last 12 weeks)
│   └── Level 5: GDDashboard
│       ├── ExecutiveKPICards (headcount, avg allocation, risk %)
│       ├── TrendChart (simplified)
│       └── PDFExportButton

Backend (extend WorkloadDashboardViewSet from 8a):
  ├── GET /workload-dashboard/division/   → L3 data (cross-team roll-up)
  ├── GET /workload-dashboard/enterprise/ → L4 data (org-wide risk)
  └── GET /workload-dashboard/executive/  → L5 data (1-page summary)
```

## Related Code Files

### Create

- `apps/web/ce/components/workload/dashboard/director-dashboard.tsx` — L3
- `apps/web/ce/components/workload/dashboard/dgd-dashboard.tsx` — L4
- `apps/web/ce/components/workload/dashboard/gd-dashboard.tsx` — L5
- `apps/web/ce/components/workload/widgets/cross-team-bar-chart.tsx` — L3 comparison
- `apps/web/ce/components/workload/widgets/workload-roll-up-table.tsx` — L3 table
- `apps/web/ce/components/workload/widgets/risk-distribution-pie.tsx` — L4 pie
- `apps/web/ce/components/workload/widgets/enterprise-risk-cards.tsx` — L4 KPI cards
- `apps/web/ce/components/workload/widgets/trend-line-chart.tsx` — L4/L5 trend
- `apps/web/ce/components/workload/widgets/executive-kpi-cards.tsx` — L5 cards

### Modify

- `apps/api/plane/app/views/workspace/workload_dashboard.py` — add L3/L4/L5 endpoints
- `apps/api/plane/app/serializers/workload_dashboard.py` — add Division/Enterprise/Executive serializers
- `apps/api/plane/app/urls/workload_dashboard.py` — add L3/L4/L5 URL patterns
- `apps/web/ce/components/workload/dashboard/dashboard-router.tsx` — add L3/L4/L5 routing
- `apps/web/ce/store/workload-dashboard.store.ts` — add L3/L4/L5 fetch actions
- `packages/types/src/workload-dashboard.d.ts` — add L3/L4/L5 types
- `packages/i18n/src/locales/en/translations.ts` — L3-L5 labels
- `packages/i18n/src/locales/vi/translations.ts` — L3-L5 labels
- `packages/i18n/src/locales/ko/translations.ts` — L3-L5 labels

## Implementation Steps

1. **Extend WorkloadDashboardViewSet** — add division, enterprise, executive action methods
2. **Create L3-L5 serializers** — DivisionDashboardSerializer, EnterpriseDashboardSerializer, ExecutiveDashboardSerializer
3. **Add URL patterns** for L3/L4/L5 endpoints
4. **Add TypeScript types** — IDivisionRollUpData, IEnterpriseRiskData, IExecutiveSummaryData
5. **Extend MobX store** — fetchDivisionData, fetchEnterpriseData, fetchExecutiveData
6. **Create L3: DirectorDashboard** — CrossTeamBarChart + WorkloadRollUpTable
7. **Create L4: DGDDashboard** — EnterpriseRiskCards + RiskDistributionPie + TrendLineChart
8. **Create L5: GDDashboard** — ExecutiveKPICards + TrendChart + PDFExportButton
9. **Update dashboard-router** — add L3/L4/L5 routing + drill-down navigation
10. **Add i18n keys** (en, vi, ko) for L3-L5 labels

## Todo List

- [ ] Extend ViewSet with L3/L4/L5 endpoints
- [ ] Create L3-L5 serializers
- [ ] Add URL patterns
- [ ] Add TypeScript types
- [ ] Extend MobX store
- [ ] Create L3: Director Dashboard + CrossTeam widgets
- [ ] Create L4: DGD Dashboard + Enterprise Risk widgets
- [ ] Create L5: GD Dashboard + Executive Summary + PDF export
- [ ] Update dashboard-router for L3-L5
- [ ] Add i18n keys (en, vi, ko)

## Success Criteria

- L3 users see cross-team comparison with bar chart + roll-up table
- L4 users see org-wide risk dashboard with pie + trend
- L5 users see read-only executive summary with PDF export
- Drill-down navigation works from L5→L4→L3→L2→L1
- Lazy aggregation performs <3s for org-wide queries
- Role-based access enforced (L1 users cannot access L4/L5 data)

## Risk Assessment

- **Org-wide aggregation performance**: Lazy computation must be cached effectively
- **PDF export**: May require separate library (e.g., react-pdf or server-side generation)
- **Recharts bundle size**: Lazy-load all L3-L5 components

## Next Steps

- Future: Real-time WebSocket updates for live dashboard refresh
- Future: PDF report customization options
