# Phase 5 — CE Override Pattern

**Priority**: Medium
**Status**: [ ] Pending
**Risk**: HIGH — moving files changes import paths, may break many references
**Estimated effort**: ~3-4 hours
**Prerequisite**: Complete Phase 1-4 first

## Context

- Rule: Custom/CE-specific code should be in `apps/web/ce/` directory, NOT in `core/`
- `core/` is shared upstream code; `ce/` is Community Edition override layer
- Path alias: `@/plane-web/*` → `./ce/*`
- CE root store extends `CoreRootStore` via `ce/store/root.store.ts`

## Key Insights

This is the **highest risk** phase because:

1. Moving files requires updating ALL import paths across the codebase
2. Store registration changes in `ce/store/root.store.ts`
3. Services are imported from many components
4. Must verify no circular dependencies after move

## Files in Wrong Location

### Dashboard Components (core/ → ce/)

| Current Location                                                 | Target Location                                                |
| ---------------------------------------------------------------- | -------------------------------------------------------------- |
| `core/components/dashboards/analytics-dashboard-widget-card.tsx` | `ce/components/dashboards/analytics-dashboard-widget-card.tsx` |
| `core/components/dashboards/analytics-dashboard-widget-grid.tsx` | `ce/components/dashboards/analytics-dashboard-widget-grid.tsx` |
| `core/components/dashboards/widget-config-modal.tsx`             | `ce/components/dashboards/widget-config-modal.tsx`             |
| `core/components/dashboards/config/` (entire folder)             | `ce/components/dashboards/config/`                             |

### Store (core/ → ce/)

| Current Location                          | Target Location                         |
| ----------------------------------------- | --------------------------------------- |
| `core/store/analytics-dashboard.store.ts` | `ce/store/analytics-dashboard.store.ts` |

**Also update** `ce/store/root.store.ts` to import from local instead of `@/store/`:

```typescript
// Before:
import { AnalyticsDashboardStore } from "@/store/analytics-dashboard.store";

// After:
import { AnalyticsDashboardStore } from "./analytics-dashboard.store";
```

### Services (core/ → ce/)

| Current Location                               | Target Location                              |
| ---------------------------------------------- | -------------------------------------------- |
| `core/services/department.service.ts`          | `ce/services/department.service.ts`          |
| `core/services/staff.service.ts`               | `ce/services/staff.service.ts`               |
| `core/services/analytics-dashboard.service.ts` | `ce/services/analytics-dashboard.service.ts` |

**Note**: Create `ce/services/` directory if it doesn't exist.

## Implementation Steps

1. **Create target directories**:

   ```bash
   mkdir -p apps/web/ce/components/dashboards/config
   mkdir -p apps/web/ce/services
   ```

2. **Move files** (use `git mv` to preserve history):

   ```bash
   # Dashboard components
   git mv core/components/dashboards/analytics-dashboard-widget-card.tsx ce/components/dashboards/
   git mv core/components/dashboards/analytics-dashboard-widget-grid.tsx ce/components/dashboards/
   git mv core/components/dashboards/widget-config-modal.tsx ce/components/dashboards/
   git mv core/components/dashboards/config/ ce/components/dashboards/config/

   # Store
   git mv core/store/analytics-dashboard.store.ts ce/store/

   # Services
   git mv core/services/department.service.ts ce/services/
   git mv core/services/staff.service.ts ce/services/
   git mv core/services/analytics-dashboard.service.ts ce/services/
   ```

3. **Update all imports** — search and replace:
   - `@/store/analytics-dashboard.store` → `@/plane-web/store/analytics-dashboard.store`
   - `@/services/department.service` → `@/plane-web/services/department.service`
   - `@/services/staff.service` → `@/plane-web/services/staff.service`
   - `@/services/analytics-dashboard.service` → `@/plane-web/services/analytics-dashboard.service`
   - `@/core/components/dashboards/` → `@/plane-web/components/dashboards/` (check actual import paths)

4. **Update ce/store/root.store.ts**:
   - Change analytics-dashboard store import to local path

5. **Verify no broken imports**:

   ```bash
   pnpm check:types
   pnpm check:lint
   ```

6. **Test all affected pages**:
   - Dashboard listing page
   - Dashboard detail page
   - Department settings page
   - Staff settings page

## Todo List

- [ ] Create target directories
- [ ] Move dashboard components (git mv)
- [ ] Move analytics-dashboard store (git mv)
- [ ] Move services (git mv)
- [ ] Update ce/store/root.store.ts
- [ ] Search & replace all import paths
- [ ] Run `pnpm check:types`
- [ ] Run `pnpm check:lint`
- [ ] Test dashboard pages
- [ ] Test department settings
- [ ] Test staff settings
- [ ] Verify no visual regressions
- [ ] Verify no circular dependencies

## Risk Assessment

- **HIGH**: Breaking imports will cause build failures
- **Mitigation**: Do all moves + import updates in a single commit; run type checker immediately
- **Rollback**: `git revert` if build breaks
- **Testing**: Manual testing on all affected pages is mandatory

## Security Considerations

- No security impact — file location changes only
- No API changes, no model changes, no permission changes
