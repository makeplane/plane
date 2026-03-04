# Phase 03: Frontend — Export + i18n + Code Quality

## Context Links

- Settings page: `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/worklogs/page.tsx`
- Store: `apps/web/ce/store/project/worklog.store.ts`
- i18n VI: `packages/i18n/src/locales/vi/translations.ts`
- i18n KO: `packages/i18n/src/locales/ko/translations.ts`

## Overview

- **Priority**: P2 (polish)
- **Status**: Pending
- **Description**: Implement CSV/Excel export, add missing i18n keys, fix code quality issues.

## Key Insights

- Export buttons exist with empty `() => {}` handlers
- VI and KO locales missing `project_settings.worklogs.*` keys (label, empty_title, empty_description)
- `formatMinutesToHours` duplicated locally instead of using shared util
- Store has unused `rootStore` dependency
- Need to decide: client-side CSV generation or backend export endpoint?

## Requirements

- CSV export: download worklogs as CSV file
- Excel export: download as XLSX (or skip if no library available)
- i18n: add missing keys to VI and KO locales
- Remove duplicate utility, use shared `formatMinutesToDisplay`
- Clean up unused rootStore in store

## Related Code Files

- **Modify**: `apps/web/app/…/worklogs/page.tsx`
- **Modify**: `apps/web/ce/store/project/worklog.store.ts`
- **Modify**: `packages/i18n/src/locales/vi/translations.ts`
- **Modify**: `packages/i18n/src/locales/ko/translations.ts`
- **Check**: `packages/constants/src/` for shared formatMinutesToDisplay

## Embedded Rules

- Use existing i18n key patterns — check EN locale for reference
- DRY: use shared utilities, don't duplicate
- YAGNI: if Excel export needs new dependency, consider CSV-only for MVP

## Implementation Steps

### 1. Implement CSV export

Client-side CSV generation from current worklogs data:

```tsx
const handleExportCSV = () => {
  const rows = worklogs.map((w) => ({
    issue: w.issue_detail?.identifier,
    logged_by: w.logged_by_detail?.display_name,
    duration: w.duration_minutes,
    date: w.logged_at,
    description: w.description,
  }));
  // Convert to CSV string and trigger download
};
```

### 2. Implement Excel export (evaluate)

Check if project already has xlsx library. If not, consider CSV-only or use simple TSV format.

### 3. Add missing i18n keys

Add to VI locale:

```
"project_settings.worklogs.label": "Nhật ký công việc",
"project_settings.worklogs.empty_title": "Không tìm thấy nhật ký",
"project_settings.worklogs.empty_description": "Thành viên chưa ghi nhận thời gian làm việc."
```

Add equivalent to KO locale.

### 4. Replace duplicate utility

Remove local `formatMinutesToHours` in page.tsx. Import shared `formatMinutesToDisplay` from `@plane/constants`.

### 5. Clean up store

Remove unused `rootStore` property from `ProjectWorklogStore` if confirmed unused.

## Post-Phase Checklist

- [ ] CSV export downloads correct data
- [ ] Excel export works or intentionally deferred
- [ ] VI locale has all worklog keys
- [ ] KO locale has all worklog keys
- [ ] No duplicate utility functions
- [ ] Unused code removed from store
- [ ] No TypeScript errors

## Todo List

- [ ] Implement CSV export handler
- [ ] Evaluate Excel export feasibility
- [ ] Add VI i18n keys
- [ ] Add KO i18n keys
- [ ] Replace formatMinutesToHours with shared util
- [ ] Remove unused rootStore from store
- [ ] Run lint check

## Success Criteria

- CSV download works with filtered data
- Settings page displays correctly in VI and KO
- No code quality warnings (unused vars, duplicate code)
