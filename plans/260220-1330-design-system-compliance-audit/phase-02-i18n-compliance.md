# Phase 2 — i18n Compliance

**Priority**: Medium
**Status**: [ ] Pending
**Risk**: Low — additive changes, no logic impact
**Estimated effort**: ~1-2 hours

## Context

- Rule: All user-facing strings must use `useTranslation()` from `@plane/i18n`
- 7 component files have hardcoded strings
- Translation files: `packages/i18n/src/locales/{lang}/translations.json`

## Key Insights

- Need to add translation keys under a new namespace (e.g., `department`, `staff`, `analytics_dashboard`)
- Add keys to ALL language files (use English as placeholder for non-English)
- Follow existing key naming pattern: nested JSON with dot notation

## Related Code Files

### Files Missing useTranslation

#### [MODIFY] department-tree-item.tsx (165 lines)

`apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/departments/components/department-tree-item.tsx`

- Add `import { useTranslation } from "@plane/i18n"`
- Replace hardcoded strings: button labels, tooltips, confirmation messages

#### [MODIFY] department-tree.tsx (50 lines)

`apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/departments/components/department-tree.tsx`

- Add `useTranslation` hook
- Replace: headers, empty states

#### [MODIFY] staff-form-modal.tsx (229 lines)

`apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/staff/components/staff-form-modal.tsx`

- Add `useTranslation` hook
- Replace: form labels, field placeholders, button text, validation messages

#### [MODIFY] staff-table.tsx (168 lines)

`apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/staff/components/staff-table.tsx`

- Add `useTranslation` hook
- Replace: column headers, status labels, action buttons

#### [MODIFY] analytics-dashboard-card.tsx (131 lines)

`apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/analytics-dashboard-card.tsx`

- Add `useTranslation` hook
- Replace: card labels, menu actions (edit, delete, duplicate)

#### [MODIFY] analytics-dashboard-delete-modal.tsx (58 lines)

`apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/analytics-dashboard-delete-modal.tsx`

- Add `useTranslation` hook
- Replace: confirmation title, description, button labels

#### [MODIFY] analytics-dashboard-form-modal.tsx (132 lines)

`apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/analytics-dashboard-form-modal.tsx`

- Add `useTranslation` hook
- Replace: form title, field labels, placeholders, button text

### Translation Files

#### [MODIFY] packages/i18n/src/locales/en/translations.json

Add new keys:

```json
{
  "department": {
    "label": "Department",
    "add": "Add department",
    "edit": "Edit department",
    "delete": "Delete department",
    "delete_confirm": "Are you sure you want to delete this department?",
    "name": { "label": "Department name", "placeholder": "Enter department name" },
    "code": { "label": "Code", "placeholder": "Enter code" },
    "description": { "label": "Description", "placeholder": "Enter description" },
    "parent": { "label": "Parent department" },
    "manager": { "label": "Manager" },
    "linked_project": { "label": "Linked project" },
    "empty": "No departments found",
    "staff_count": "{count, plural, one {# member} other {# members}}"
  },
  "staff": {
    "label": "Staff",
    "add": "Add staff",
    "edit": "Edit staff",
    "import": "Import staff",
    "delete": "Delete staff",
    "staff_id": { "label": "Staff ID", "placeholder": "Enter staff ID" },
    "name": { "label": "Full name", "placeholder": "Enter full name" },
    "email": { "label": "Email", "placeholder": "Enter email" },
    "position": { "label": "Position", "placeholder": "Enter position" },
    "department": { "label": "Department" },
    "status": {
      "active": "Active",
      "inactive": "Inactive",
      "resigned": "Resigned"
    },
    "empty": "No staff members found"
  },
  "analytics_dashboard": {
    "label": "Analytics Dashboard",
    "create": "Create dashboard",
    "edit": "Edit dashboard",
    "delete": "Delete dashboard",
    "delete_confirm": "Are you sure you want to delete this dashboard? This action cannot be undone.",
    "duplicate": "Duplicate",
    "name": { "label": "Dashboard name", "placeholder": "Enter dashboard name" },
    "description": { "label": "Description", "placeholder": "Enter description" },
    "empty": "No dashboards found",
    "add_widget": "Add widget",
    "configure_widget": "Configure widget"
  }
}
```

#### [MODIFY] All other locale files (copy English as placeholder)

- `packages/i18n/src/locales/fr/translations.json`
- `packages/i18n/src/locales/ja/translations.json`
- (and all others in the locales directory)

## Implementation Steps

1. Add translation keys to `en/translations.json` first
2. Copy same keys to ALL other locale files (English as placeholder)
3. For each of the 7 component files:
   a. Add `import { useTranslation } from "@plane/i18n"`
   b. Add `const { t } = useTranslation()` in component body
   c. Replace hardcoded strings with `t("namespace.key")`
4. Run `pnpm check:lint` and `pnpm check:types`

## Todo List

- [ ] Add translation keys to `en/translations.json`
- [ ] Copy keys to all other locale files
- [ ] department-tree-item.tsx
- [ ] department-tree.tsx
- [ ] staff-form-modal.tsx
- [ ] staff-table.tsx
- [ ] analytics-dashboard-card.tsx
- [ ] analytics-dashboard-delete-modal.tsx
- [ ] analytics-dashboard-form-modal.tsx
- [ ] Run `pnpm check:lint`
- [ ] Run `pnpm check:types`
