# Phase 4: Clean Registrations + Fix Cross-References

**Priority:** High | **Status:** ✅ Complete

## Overview

Remove V1 imports from `__init__.py` files, clean store registration, fix all cross-references.

## Steps

### 4.1 Backend `__init__.py` cleanup (5 files)

| File                                | Line(s)  | Remove                                                                          |
| ----------------------------------- | -------- | ------------------------------------------------------------------------------- |
| `plane/db/models/__init__.py`       | L95      | `from .analytics_dashboard import AnalyticsDashboard, AnalyticsDashboardWidget` |
| `plane/app/views/__init__.py`       | L242-247 | All `AnalyticsDashboard*Endpoint` imports                                       |
| `plane/app/urls/__init__.py`        | L25, L50 | `analytics_dashboard_urls` import + usage                                       |
| `plane/api/views/__init__.py`       | L65-70   | All `AnalyticsDashboard*Endpoint` imports                                       |
| `plane/api/serializers/__init__.py` | L63-66   | All `AnalyticsDashboard*Serializer` imports                                     |

### 4.2 Frontend store registration (1 file)

`ce/store/root.store.ts` — remove:

- L11-12: `import { AnalyticsDashboardStore }` + type import
- L20: `analyticsDashboard: IAnalyticsDashboardStore`
- L28: `this.analyticsDashboard = new AnalyticsDashboardStore(this)`

### 4.3 Fix `favorite.store.ts`

`apps/web/core/store/favorite.store.ts` L342-347:

```typescript
// Update analytics_dashboard case to use customDashboard store
case "analytics_dashboard": {
  const store = (this.rootStore as any).customDashboard;
```

### 4.4 Update imports in dashboard pages

**`dashboards/page.tsx`:**

```typescript
import { DashboardCard } from "./components/dashboard-card";
import { DashboardDeleteModal } from "./components/dashboard-delete-modal";
import { DashboardFormModal } from "@/plane-web/components/dashboards/dashboard-form-modal";
import { DashboardListHeader } from "./components/dashboard-list-header";
```

**`dashboards/[dashboardId]/page.tsx`:** Check for any remaining V1 references.

### 4.5 Search for any remaining V1 references

```bash
grep -rn 'AnalyticsDashboard\|analytics-dashboard\|analytics_dashboard' apps/web/ apps/api/plane/app/ apps/api/plane/api/ packages/ \
  --include='*.tsx' --include='*.ts' --include='*.py' \
  | grep -vE 'node_mod|migrations/0120|plans/'
```

## Todo

- [ ] Clean 5 backend `__init__.py` files
- [ ] Clean `root.store.ts`
- [ ] Fix `favorite.store.ts`
- [ ] Update imports in dashboard pages
- [ ] Search & fix any remaining V1 references

## Success Criteria

- `grep -rn 'AnalyticsDashboard' apps/ packages/` returns nothing (except migration `0120`)
- No import errors
