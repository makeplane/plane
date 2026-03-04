# Phase 4: Frontend — Async Export

## Context

- [WorklogFiltersToolbar](<../../apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/worklogs/worklog-filters-toolbar.tsx>) — current export dropdown
- [page.tsx](<../../apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/worklogs/page.tsx>) — `handleExportCSV` + `downloadCSV` functions
- [WorklogService](../../apps/web/ce/services/project-worklog.service.ts) — add export method

## Overview

- **Priority:** P2
- **Status:** done
- Replace client-side CSV blob export with async backend export. Add "Export as Excel" option.

## Key Insights

- Current `handleExportCSV` builds CSV client-side from loaded worklogs — problematic when paginated (only exports current page)
- Async export solves this: backend exports ALL matching worklogs regardless of pagination
- Toolbar dropdown already has `CustomMenu` — just add second menu item

## Requirements

### Functional

- Dropdown shows: "Export as CSV" and "Export as Excel"
- Clicking either triggers POST to `/export-worklogs/` with provider + current filters
- Show toast notification: "Export started. Check Previous Downloads when ready."
- Auto-expand Previous Downloads section after triggering export
- Remove `downloadCSV` helper and client-side export logic from page.tsx

### Non-functional

- Export request should complete <200ms (just queuing the task)

## Architecture

```
User clicks "Export as CSV"
  → worklogService.triggerExport(slug, projectId, "csv", filters)
  → POST /api/workspaces/{slug}/projects/{projectId}/worklogs/export/
  → Toast: "Export started"
  → Auto-expand Previous Downloads section + start polling
```

## Related Code Files

### Modify

- `apps/web/ce/services/project-worklog.service.ts` — add `triggerExport` method
- `apps/web/ce/store/project/worklog.store.ts` — add `triggerExport` action
- `apps/web/app/.../worklogs/worklog-filters-toolbar.tsx` — add Excel option, change callback signature
- `apps/web/app/.../worklogs/page.tsx` — remove `downloadCSV`, `handleExportCSV`; wire new export handler

## Implementation Steps

1. **Add service method** in `project-worklog.service.ts`:

   ```typescript
   async triggerExport(
     workspaceSlug: string,
     projectId: string,
     provider: "csv" | "xlsx",
     filters?: Record<string, string>
   ): Promise<{ message: string; export_id: string }> {
     return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/worklogs/export/`, {
       provider,
       filters,
     }).then(getData);
   }
   ```

2. **Add store action** in `worklog.store.ts`:

   ```typescript
   triggerExport = async (
     workspaceSlug: string,
     projectId: string,
     provider: "csv" | "xlsx",
     filters?: Record<string, string>
   ) => {
     return this.worklogService.triggerExport(workspaceSlug, projectId, provider, filters);
   };
   ```

3. **Update `worklog-filters-toolbar.tsx`**:
   - Change prop from `onExportCSV: () => void` to `onExport: (provider: "csv" | "xlsx") => void`
   - Add second `CustomMenu.MenuItem` for Excel with `FileSpreadsheet` icon
   - Both call `onExport("csv")` / `onExport("xlsx")`

4. **Update `page.tsx`**:
   - Remove `downloadCSV` function and `handleExportCSV`
   <!-- Updated: Validation Session 1 - auto-expand Previous Downloads after export -->
   - Add `handleExport` that calls `projectWorklogs.triggerExport(...)` + shows toast
   - After successful trigger, set `isPreviousDownloadsOpen = true` (shared state or ref callback)
   - Pass `onExport={handleExport}` to toolbar
   - Use `useToast()` for notification (or `setToast` from `@plane/ui`)

## Todo

- [ ] Add `triggerExport` to worklog service
- [ ] Add `triggerExport` action to worklog store
- [ ] Update toolbar: add Excel option, change prop signature
- [ ] Update page: remove client-side export, wire async export
- [ ] Add toast notification on export trigger
- [ ] Test: CSV export triggers backend task
- [ ] Test: Excel export triggers backend task

## Success Criteria

- Client-side `downloadCSV` completely removed
- Both CSV and Excel options visible in dropdown
- POST request sent with correct provider and filters
- Toast shown to user after triggering export

## Risk Assessment

- **No immediate download**: User must check Previous Downloads — toast message must be clear
- **Export with no data**: Backend should handle empty queryset gracefully (empty file or error)

## Security

- Same workspace permission check as existing worklogs endpoint
- Filters passed to backend — no client-side data exposure

## Next Steps

- Phase 5: Previous Downloads shows export results
