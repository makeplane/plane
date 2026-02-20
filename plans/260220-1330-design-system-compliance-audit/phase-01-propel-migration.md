# Phase 1 — Propel Migration & Semantic Tokens

**Priority**: High
**Status**: [x] Complete
**Risk**: Low — import swaps, no logic changes
**Estimated effort**: ~1 hour

## Context

- Rule: `plane-design-system.md` → overlapping components MUST use `@plane/propel`
- Propel has: `button`, `input`, `dialog`, `tabs`
- Propel does NOT have: `Loader`, `Breadcrumbs`, `ToggleSwitch`, `CustomSelect`, `FavoriteStar`, `AlertModalCore`, `ModalCore`, `TextArea`, `TabList` → keep `@plane/ui` for these

## Key Insights

Components to migrate from `@plane/ui` → `@plane/propel`:

- **`Button`** → `import { Button } from "@plane/propel/button"` (13 files)
- **`Input`** → `import { Input } from "@plane/propel/input"` (4 files)

Components to KEEP in `@plane/ui` (no propel equivalent):

- `Loader`, `Breadcrumbs`, `ToggleSwitch`, `CustomSelect`, `FavoriteStar`
- `ModalCore`, `AlertModalCore`, `EModalPosition`, `EModalWidth`
- `TextArea`, `TabList`

## Related Code Files

### Dashboard Pro Feature

#### [MODIFY] analytics-dashboard-list-header.tsx

`apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/analytics-dashboard-list-header.tsx`

- Line 10: `import { Button } from "@plane/ui"` → `import { Button } from "@plane/propel/button"`

#### [MODIFY] analytics-dashboard-form-modal.tsx

`apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/analytics-dashboard-form-modal.tsx`

- Line 11: Split import — `Button` + `Input` → propel; keep `EModalPosition, EModalWidth, ModalCore, TextArea` in `@plane/ui`

```typescript
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { EModalPosition, EModalWidth, ModalCore, TextArea } from "@plane/ui";
```

#### [MODIFY] analytics-dashboard-delete-modal.tsx

`apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/analytics-dashboard-delete-modal.tsx`

- No change needed — only uses `AlertModalCore` (ui-only)

#### [MODIFY] analytics-dashboard-card.tsx

`apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/analytics-dashboard-card.tsx`

- No change needed — only uses `FavoriteStar` (ui-only)

#### [MODIFY] dashboards/page.tsx

`apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx`

- Line 13: Split — `Button` → propel; keep `Loader` in `@plane/ui`

#### [MODIFY] dashboards/[dashboardId]/page.tsx

`apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx`

- Line 11: Split — `Button` → propel; keep `Loader` in `@plane/ui`

#### [MODIFY] widget-config-modal.tsx

`apps/web/core/components/dashboards/widget-config-modal.tsx`

- Line 13: Split — `Button` → propel; keep `ModalCore, EModalPosition, EModalWidth, TabList` in `@plane/ui`

#### [MODIFY] config/basic-settings-section.tsx

`apps/web/core/components/dashboards/config/basic-settings-section.tsx`

- Line 10: Split — `Input` → propel; keep `CustomSelect` in `@plane/ui`

---

### Department Management

#### [MODIFY] department-form-modal.tsx

`apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/departments/components/department-form-modal.tsx`

- Line 13: Split — `Button` + `Input` → propel; keep `TextArea` in `@plane/ui`

```typescript
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { TextArea } from "@plane/ui";
```

#### [MODIFY] department-tree-item.tsx

`apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/departments/components/department-tree-item.tsx`

- Line 13: `import { Button } from "@plane/ui"` → `import { Button } from "@plane/propel/button"`

#### [MODIFY] link-project-modal.tsx

`apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/departments/components/link-project-modal.tsx`

- Line 13: `import { Button } from "@plane/ui"` → `import { Button } from "@plane/propel/button"`

#### [MODIFY] departments/page.tsx

`apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/departments/page.tsx`

- Line 14: Split — `Button` → propel; keep `Loader` in `@plane/ui`

#### [MODIFY] departments/header.tsx

- No change — only uses `Breadcrumbs` (ui-only)

---

### Staff Management

#### [MODIFY] staff-table.tsx

`apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/staff/components/staff-table.tsx`

- Line 12: `import { Button } from "@plane/ui"` → `import { Button } from "@plane/propel/button"`

#### [MODIFY] staff-form-modal.tsx

`apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/staff/components/staff-form-modal.tsx`

- Line 13: Split — `Button` + `Input` → propel

```typescript
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
```

#### [MODIFY] staff-import-modal.tsx

`apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/staff/components/staff-import-modal.tsx`

- Line 13: `import { Button } from "@plane/ui"` → `import { Button } from "@plane/propel/button"`

#### [MODIFY] staff/page.tsx

`apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/staff/page.tsx`

- Line 14: Split — `Button` + `Input` → propel; keep `Loader` in `@plane/ui`

#### [MODIFY] staff/header.tsx

- No change — only uses `Breadcrumbs` (ui-only)

---

### Fix Hardcoded Colors (Staff)

#### [MODIFY] staff-table.tsx

`apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/staff/components/staff-table.tsx`

- Line 30: `resigned: "bg-gray-500/10 text-gray-600 border-gray-500/20"`
  → `resigned: "bg-surface-2 text-color-tertiary border-color-subtle"`

#### [MODIFY] staff/page.tsx

`apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/staff/page.tsx`

- Line 157: `text-gray-600` → `text-color-secondary`

---

## Implementation Steps

1. For each file listed above, open and modify the import lines
2. When splitting imports: keep non-propel components in `@plane/ui`, move `Button`/`Input` to propel subpath imports
3. Fix hardcoded colors in staff-table.tsx and staff/page.tsx
4. Run `pnpm check:lint` to verify no errors
5. Run `pnpm check:types` to verify TypeScript
6. Visually verify dark mode for all modified pages

## Todo List

- [x] Dashboard: analytics-dashboard-list-header.tsx
- [x] Dashboard: analytics-dashboard-form-modal.tsx
- [x] Dashboard: dashboards/page.tsx
- [x] Dashboard: dashboards/[dashboardId]/page.tsx
- [x] Dashboard: widget-config-modal.tsx
- [x] Dashboard: config/basic-settings-section.tsx
- [x] Department: department-form-modal.tsx
- [x] Department: department-tree-item.tsx
- [x] Department: link-project-modal.tsx
- [x] Department: departments/page.tsx
- [x] Staff: staff-table.tsx (imports + hardcoded colors)
- [x] Staff: staff-form-modal.tsx
- [x] Staff: staff-import-modal.tsx
- [x] Staff: staff/page.tsx (imports + hardcoded colors)
- [x] Run `pnpm check:lint`
- [x] Run `pnpm check:types`
- [x] Verify dark mode
