# Phase 1: Tag + Delete V1 Files

**Priority:** High | **Status:** ✅ Complete

## Overview

Create git tag for recovery, then delete all 22 V1-only files.

## Steps

### 1.1 Create recovery tag

```bash
git tag dashboard-v1-archive
```

### 1.2 Delete backend files (7)

```bash
rm apps/api/plane/db/models/analytics_dashboard.py
rm apps/api/plane/app/views/analytics_dashboard.py
rm apps/api/plane/app/urls/analytics_dashboard.py
rm apps/api/plane/api/views/analytics_dashboard.py
rm apps/api/plane/api/serializers/analytics_dashboard.py
rm apps/api/plane/api/urls/analytics_dashboard.py
rm apps/api/plane/tests/contract/app/test_analytics_dashboard.py
```

**NOTE:** Keep `migrations/0120_analytics_dashboard_models.py` — Django needs migration history.

### 1.3 Delete frontend CE components (9)

```bash
rm apps/web/ce/components/dashboards/analytics-dashboard-widget-card.tsx
rm apps/web/ce/components/dashboards/analytics-dashboard-widget-grid.tsx
rm apps/web/ce/components/dashboards/widget-chart-renderer.tsx
rm -rf apps/web/ce/components/dashboards/widgets/
```

### 1.4 Delete V1 store/hook/service (3)

```bash
rm apps/web/ce/store/analytics-dashboard.store.ts
rm apps/web/ce/hooks/store/use-analytics-dashboard.ts
rm apps/web/ce/services/analytics-dashboard.service.ts
```

### 1.5 Delete V1 packages (2)

```bash
rm packages/types/src/analytics-dashboard.ts
rm packages/constants/src/analytics-dashboard.ts
```

## Todo

- [ ] Create git tag `dashboard-v1-archive`
- [ ] Delete 7 backend files
- [ ] Delete 9 CE component files
- [ ] Delete 3 store/hook/service files
- [ ] Delete 2 package files

## Success Criteria

- 22 V1-only files removed
- Migration `0120` still exists
- No compile errors from deletions alone (registrations cleaned in Phase 4)
