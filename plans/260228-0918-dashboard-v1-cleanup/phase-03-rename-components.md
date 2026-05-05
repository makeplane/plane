# Phase 3: Rename V1-Named Active Components

**Priority:** High | **Status:** ✅ Complete

## Overview

7 files are actively used on dashboard pages but have V1 naming. Rename files + exports.

## Steps

### 3.1 Rename page components (3 + 3 routes/ duplicates)

**In `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/`:**

| Old                                    | New                          |
| -------------------------------------- | ---------------------------- |
| `analytics-dashboard-card.tsx`         | `dashboard-card.tsx`         |
| `analytics-dashboard-delete-modal.tsx` | `dashboard-delete-modal.tsx` |
| `analytics-dashboard-list-header.tsx`  | `dashboard-list-header.tsx`  |

**Same 3 files in `apps/web/app/routes/(all)/[workspaceSlug]/(projects)/dashboards/components/`**

### 3.2 Rename CE component (1 file)

| Old                                                           | New                                                 |
| ------------------------------------------------------------- | --------------------------------------------------- |
| `ce/components/dashboards/analytics-dashboard-form-modal.tsx` | `ce/components/dashboards/dashboard-form-modal.tsx` |

### 3.3 Rename exports inside each file

| Old export                      | New export             |
| ------------------------------- | ---------------------- |
| `AnalyticsDashboardCard`        | `DashboardCard`        |
| `AnalyticsDashboardDeleteModal` | `DashboardDeleteModal` |
| `AnalyticsDashboardListHeader`  | `DashboardListHeader`  |
| `AnalyticsDashboardFormModal`   | `DashboardFormModal`   |

## Todo

- [ ] Rename 6 page component files (3 app/ + 3 routes/)
- [ ] Rename 1 CE component file
- [ ] Update export names in all 7 files
- [ ] Update all imports referencing old names (Phase 4)

## Success Criteria

- No files with `analytics-dashboard-` prefix remain (except migration `0120`)
- All exports use `Dashboard*` naming (no `AnalyticsDashboard*`)
