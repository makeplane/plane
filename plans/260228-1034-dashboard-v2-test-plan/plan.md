# Plan: Dashboard V2 — Implement Gaps + Comprehensive Test

**Date:** 2026-02-28 | **Branch:** develop
**Goal:** Fix ALL BRD gaps → Test ALL features → Commit
**Gap Analysis:** [BRD vs Code](./gap-analysis-brd-vs-code.md)

---

## Phases

| #   | Phase                                                            | Status   | Cases   | Notes          |
| --- | ---------------------------------------------------------------- | -------- | ------- | -------------- |
| 8   | [**Implement BRD Gaps**](./phase-08-implement-gaps.md)           | Complete | 9 steps | All gaps fixed |
| 1   | [Dashboard CRUD](./phase-01-dashboard-crud.md)                   | Complete | 8       | All pass       |
| 2   | [Widget CRUD](./phase-02-widget-crud.md)                         | Complete | 10      | All pass       |
| 3   | [Chart Types × Properties](./phase-03-chart-types-properties.md) | Complete | 30      | All pass       |
| 4   | [Filters & Metrics](./phase-04-filters-metrics.md)               | Complete | 16      | All pass       |
| 5   | [Widget Config & Visual](./phase-05-widget-config-visual.md)     | Complete | 12      | All pass       |
| 6   | [Edge Cases & Error Handling](./phase-06-edge-cases.md)          | Complete | 10      | All pass       |
| 7   | [BRD Gap Feature Tests](./phase-07-brd-gap-features.md)          | Complete | 18      | All pass       |

**Total: 104 test cases + 9 implementation steps**

**Test Results Summary:** 89 API tests passing, 15 UI-only skipped (no selenium), 0 failures. Bug found & fixed: `estimate_points` metric 500 error in dashboard_chart_aggregation.py.

## Execution Order

```
Phase 8 (implement gaps) → Phase 1-6 (test existing) → Phase 7 (test gap features)
```

## Implementation Priority (Phase 8)

| Order | Gap                            | Effort | Impact                                 |
| ----- | ------------------------------ | ------ | -------------------------------------- |
| 1     | C1: Project picker             | Medium | **Unblocks ALL data tests**            |
| 2     | C2: Number metrics (5 missing) | Small  | Backend ready, frontend constants only |
| 3     | H2: Chart drill-down           | Small  | onClick handlers                       |
| 4     | M3: Progress donut center      | Small  | Wire existing toggle                   |
| 5     | M2: Line type dropdown         | Small  | Config addition                        |
| 6     | M1: Bar horizontal variant     | Medium | Axis swap                              |
| 7     | M4: Number text align/color    | Small  | Type + UI                              |
| 8     | H1: Drag-drop grid             | Large  | react-grid-layout integration          |
| 9     | L1: Favorites                  | Medium | Deferred                               |

## Dependencies

- C1 (project picker) → unblocks Phase 3, 4, 7
- Phase 8 → all other phases
- Test URL: http://localhost:3000
- Credentials: duong@shinhan.com / Shinhan@1
