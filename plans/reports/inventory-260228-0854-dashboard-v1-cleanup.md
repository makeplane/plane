# Dashboard V1 → V2 Complete Cleanup Report

**Date:** 2026-02-28 | **Branch:** develop
**Goal:** Remove ALL V1 code + DB tables. V2 must be 100% independent — no V1 remnants.

---

## Recovery Strategy

```bash
git tag dashboard-v1-archive          # Tag before cleanup
git checkout dashboard-v1-archive -- <file>  # Restore any file
```

**Key commits:** V1 `8be8d3f2af` (Feb 15) → V1 squash `d8b9c09313` (Feb 25) → V2 `66ff654b91` (Feb 27)

---

## Phase 1: DELETE V1-only files (22 files)

### Backend (8 files)

| #   | File                                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------------- |
| 1   | `apps/api/plane/db/models/analytics_dashboard.py`                                                               |
| 2   | `apps/api/plane/app/views/analytics_dashboard.py`                                                               |
| 3   | `apps/api/plane/app/urls/analytics_dashboard.py`                                                                |
| 4   | `apps/api/plane/api/views/analytics_dashboard.py`                                                               |
| 5   | `apps/api/plane/api/serializers/analytics_dashboard.py`                                                         |
| 6   | `apps/api/plane/api/urls/analytics_dashboard.py`                                                                |
| 7   | `apps/api/plane/tests/contract/app/test_analytics_dashboard.py`                                                 |
| 8   | ~~`apps/api/plane/db/migrations/0120_analytics_dashboard_models.py`~~ **KEEP** (Django needs migration history) |

### Frontend — V1-only CE components (9 files)

| #     | File                                                                               |
| ----- | ---------------------------------------------------------------------------------- |
| 9     | `ce/components/dashboards/analytics-dashboard-widget-card.tsx`                     |
| 10    | `ce/components/dashboards/analytics-dashboard-widget-grid.tsx`                     |
| 11    | `ce/components/dashboards/widget-chart-renderer.tsx`                               |
| 12-17 | `ce/components/dashboards/widgets/` (6 files: area, bar, donut, line, number, pie) |

### Frontend — V1 store/hook/service (3 files)

| #   | File                                         |
| --- | -------------------------------------------- |
| 18  | `ce/store/analytics-dashboard.store.ts`      |
| 19  | `ce/hooks/store/use-analytics-dashboard.ts`  |
| 20  | `ce/services/analytics-dashboard.service.ts` |

### Packages (2 files)

| #   | File                                            |
| --- | ----------------------------------------------- |
| 21  | `packages/types/src/analytics-dashboard.ts`     |
| 22  | `packages/constants/src/analytics-dashboard.ts` |

---

## Phase 2: DROP V1 Database Tables

Create new migration to drop V1 tables. Keep migration `0120` file (Django needs it for history).

```python
# New migration: 0127_drop_analytics_dashboard_tables.py
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ("db", "0126_dashboard_dashboardwidget_and_more"),
    ]
    operations = [
        migrations.DeleteModel(name="AnalyticsDashboardWidget"),
        migrations.DeleteModel(name="AnalyticsDashboard"),
    ]
```

**Result:** Tables dropped from DB. Migration `0120` stays for history. V1 data gone.

---

## Phase 3: RENAME active V1-named components → V2 naming (7 files)

### Page components (3 + 3 routes/ duplicates)

| Old                                    | New                          |
| -------------------------------------- | ---------------------------- |
| `analytics-dashboard-card.tsx`         | `dashboard-card.tsx`         |
| `analytics-dashboard-delete-modal.tsx` | `dashboard-delete-modal.tsx` |
| `analytics-dashboard-list-header.tsx`  | `dashboard-list-header.tsx`  |
| Same 3 in `app/routes/`                | Same rename                  |

### CE component (1 file)

| Old                                  | New                        |
| ------------------------------------ | -------------------------- |
| `analytics-dashboard-form-modal.tsx` | `dashboard-form-modal.tsx` |

### Export renames

| Old                             | New                    |
| ------------------------------- | ---------------------- |
| `AnalyticsDashboardCard`        | `DashboardCard`        |
| `AnalyticsDashboardDeleteModal` | `DashboardDeleteModal` |
| `AnalyticsDashboardListHeader`  | `DashboardListHeader`  |
| `AnalyticsDashboardFormModal`   | `DashboardFormModal`   |

---

## Phase 4: CLEAN registration points (6 locations)

| #   | File                                       | What to remove                          |
| --- | ------------------------------------------ | --------------------------------------- |
| 1   | `plane/db/models/__init__.py` L95          | `from .analytics_dashboard import ...`  |
| 2   | `plane/app/views/__init__.py` L242-247     | `AnalyticsDashboard*Endpoint` imports   |
| 3   | `plane/app/urls/__init__.py` L25, L50      | `analytics_dashboard_urls`              |
| 4   | `plane/api/views/__init__.py` L65-70       | `AnalyticsDashboard*Endpoint` imports   |
| 5   | `plane/api/serializers/__init__.py` L63-66 | `AnalyticsDashboard*Serializer` imports |
| 6   | `ce/store/root.store.ts` L11-12, L20, L28  | `AnalyticsDashboardStore` import + init |

---

## Phase 5: FIX cross-references

### 5.1 `favorite.store.ts` L342-347

```typescript
// BEFORE:
case "analytics_dashboard": {
  const store = (this.rootStore as any).analyticsDashboard;
// AFTER: → use customDashboard store OR remove case entirely
```

### 5.2 Update imports in `dashboards/page.tsx`

```typescript
import { DashboardCard } from "./components/dashboard-card";
import { DashboardDeleteModal } from "./components/dashboard-delete-modal";
import { DashboardFormModal } from "@/plane-web/components/dashboards/dashboard-form-modal";
import { DashboardListHeader } from "./components/dashboard-list-header";
```

### 5.3 Update any remaining `AnalyticsDashboard*` references in detail page + other files.

---

## KEEP — V2 + Shared (26 files)

### V2 files (14)

`dashboard.py` (model, views, chart, serializers), migration `0126`, `dashboard_chart_aggregation.py`, `dashboard.store.ts`, `use-custom-dashboard.ts`, `dashboard.service.ts`, `widget-adapter.tsx`, `widget-context-menu.tsx`, `custom-dashboard-widget-card.tsx`, `custom-dashboard-widget-grid.tsx`, dashboard pages.

### Shared config (11)

`config/` dir (9 files), `widget-config-modal.tsx`, `widget-config-tab-content.tsx`.

---

## Execution Summary

| Phase | Action                   | Scope              |
| ----- | ------------------------ | ------------------ |
| 1     | Delete V1-only files     | 22 files           |
| 2     | DROP V1 DB tables        | 1 new migration    |
| 3     | Rename active components | 7 files + exports  |
| 4     | Clean registrations      | 6 locations        |
| 5     | Fix cross-references     | ~4 locations       |
| —     | **Total**                | **~40 operations** |

```bash
# Commit:
refactor: remove Dashboard V1 completely (code + DB)

- Delete 22 V1 analytics dashboard files
- Add migration to DROP AnalyticsDashboard + AnalyticsDashboardWidget tables
- Rename active V1-named components to V2 convention
- Clean all registration points and cross-references
- V1 preserved at git tag 'dashboard-v1-archive'
```
