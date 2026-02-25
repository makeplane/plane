# Phase 5 — CE Override Pattern

**Priority**: Medium
**Status**: [x] Complete
**Risk**: Medium — import path updates, but `pnpm check:types` catches all errors immediately
**Estimated effort**: ~2 hours

## Context

All custom Shinhan Bank features (Analytics Dashboard Pro, Department, Staff) are **NOT in upstream Plane** — verified via `git show upstream/preview`. They belong in `ce/` (CE override layer), not `core/` (shared upstream code).

The CE override pattern is already established:

- `ce/store/root.store.ts` extends `CoreRootStore` — custom stores register here (e.g., `WorklogStore`, `TimeLineStore`)
- `@/plane-web/*` → `./ce/*` (tsconfig alias)

## What Needs to Move

### A. Services (3 files) — `core/services/` → `ce/services/`

| File                             | Imports to Update                                                                                                    |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `department.service.ts`          | 13 imports across 7 files: `@/services/department.service` → `@/plane-web/services/department.service`               |
| `staff.service.ts`               | 9 imports across 6 files: `@/services/staff.service` → `@/plane-web/services/staff.service`                          |
| `analytics-dashboard.service.ts` | 1 import (store file): `@/services/analytics-dashboard.service` → `@/plane-web/services/analytics-dashboard.service` |

### B. Store (1 file) — `core/store/` → `ce/store/`

| File                           | What Changes        |
| ------------------------------ | ------------------- |
| `analytics-dashboard.store.ts` | Move to `ce/store/` |

**Store registration change** — move from `CoreRootStore` to `RootStore` (ce):

```typescript
// REMOVE from core/store/root.store.ts:
import type { IAnalyticsDashboardStore } from "./analytics-dashboard.store";
import { AnalyticsDashboardStore } from "./analytics-dashboard.store";
// Remove from class: analyticsDashboard property + constructor init

// ADD to ce/store/root.store.ts:
import type { IAnalyticsDashboardStore } from "./analytics-dashboard.store";
import { AnalyticsDashboardStore } from "./analytics-dashboard.store";

export class RootStore extends CoreRootStore {
  timelineStore: ITimelineStore;
  worklog: IWorklogStore;
  analyticsDashboard: IAnalyticsDashboardStore; // ← ADD

  constructor() {
    super();
    this.timelineStore = new TimeLineStore(this);
    this.worklog = new WorklogStore();
    this.analyticsDashboard = new AnalyticsDashboardStore(this); // ← ADD
  }
}
```

This follows the same pattern as `WorklogStore` and `TimeLineStore` — custom stores register in CE, not core.

### C. Hook (1 file) — `core/hooks/store/` → `ce/hooks/store/`

| File                         | Imports to Update                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `use-analytics-dashboard.ts` | Update internal import: `@/store/analytics-dashboard.store` → `@/plane-web/store/analytics-dashboard.store`. All consumers update: `@/hooks/store/use-analytics-dashboard` → `@/plane-web/hooks/store/use-analytics-dashboard` |

### D. Dashboard Components (6 files) — `core/components/dashboards/` → `ce/components/dashboards/`

| File                                  | Notes                                                          |
| ------------------------------------- | -------------------------------------------------------------- |
| `analytics-dashboard-widget-card.tsx` | Relative imports to widget-chart-renderer → auto OK after move |
| `analytics-dashboard-widget-grid.tsx` | Relative import to widget-card → auto OK                       |
| `widget-config-modal.tsx`             | Relative imports to tab-content + config/ → auto OK            |
| `widget-chart-renderer.tsx`           | No external imports                                            |
| `widget-config-tab-content.tsx`       | No external imports                                            |
| `config/` (entire folder)             | Relative imports → auto OK                                     |

External imports to update (2 files):

- `[dashboardId]/page.tsx`: `@/components/dashboards/` → `@/plane-web/components/dashboards/`

## Total Impact

| Category   | Files to Move       | Import Paths to Update               |
| ---------- | ------------------- | ------------------------------------ |
| Services   | 3                   | ~23 imports across 13 files          |
| Store      | 1                   | 3 imports (core root, ce root, hook) |
| Hook       | 1                   | ~4 imports (dashboard pages)         |
| Components | 6 + config folder   | 2 external imports                   |
| **Total**  | **11+ files moved** | **~32 import paths**                 |

## Implementation Steps

1. **Create target directories**:

   ```bash
   mkdir -p apps/web/ce/components/dashboards/config
   mkdir -p apps/web/ce/services
   mkdir -p apps/web/ce/hooks/store
   ```

2. **Move files** (use `git mv` to preserve history):

   ```bash
   cd apps/web
   # Services
   git mv core/services/department.service.ts ce/services/
   git mv core/services/staff.service.ts ce/services/
   git mv core/services/analytics-dashboard.service.ts ce/services/

   # Store
   git mv core/store/analytics-dashboard.store.ts ce/store/

   # Hook
   git mv core/hooks/store/use-analytics-dashboard.ts ce/hooks/store/

   # Dashboard components
   git mv core/components/dashboards/analytics-dashboard-widget-card.tsx ce/components/dashboards/
   git mv core/components/dashboards/analytics-dashboard-widget-grid.tsx ce/components/dashboards/
   git mv core/components/dashboards/widget-config-modal.tsx ce/components/dashboards/
   git mv core/components/dashboards/widget-chart-renderer.tsx ce/components/dashboards/
   git mv core/components/dashboards/widget-config-tab-content.tsx ce/components/dashboards/
   git mv core/components/dashboards/config/ ce/components/dashboards/
   ```

3. **Update store registration**:
   - Remove `AnalyticsDashboardStore` from `core/store/root.store.ts`
   - Add `AnalyticsDashboardStore` to `ce/store/root.store.ts`

4. **Search & replace import paths** (all within `apps/web/`):
   - `@/services/department.service` → `@/plane-web/services/department.service`
   - `@/services/staff.service` → `@/plane-web/services/staff.service`
   - `@/services/analytics-dashboard.service` → `@/plane-web/services/analytics-dashboard.service`
   - `@/store/analytics-dashboard.store` → `@/plane-web/store/analytics-dashboard.store`
   - `@/hooks/store/use-analytics-dashboard` → `@/plane-web/hooks/store/use-analytics-dashboard`
   - `@/components/dashboards/analytics-dashboard-widget-grid` → `@/plane-web/components/dashboards/analytics-dashboard-widget-grid`
   - `@/components/dashboards/widget-config-modal` → `@/plane-web/components/dashboards/widget-config-modal`

5. **Verify**:
   ```bash
   pnpm check:types
   pnpm exec eslint apps/web/ --max-warnings=0
   ```

## Todo List

- [x] Create target directories
- [x] Move services (3 files)
- [x] Move store + update registration (CoreRootStore → RootStore)
- [x] Move hook
- [x] Move dashboard components (6 files + config/)
- [x] Update all ~32 import paths
- [x] Run `pnpm check:types`
- [x] Run ESLint
- [x] Test dashboard pages
- [x] Test department settings
- [x] Test staff settings

## Risk Assessment

- **Medium risk** (downgraded from HIGH): all errors caught by `pnpm check:types`
- **No logic changes**: only file locations + import paths
- **No API changes**: backend unchanged
- **Rollback**: `git revert` if build breaks
