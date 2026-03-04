# Phase 5: Frontend — Previous Downloads Section

## Context

- [Collapsible](../../packages/propel/src/collapsible/collapsible.tsx) — `@plane/propel/collapsible`
- [ExporterHistorySerializer](../../apps/api/plane/app/serializers/exporter.py) — response shape
- [page.tsx](<../../apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/worklogs/page.tsx>) — mount below table

## Overview

- **Priority:** P2
- **Status:** pending
- Add collapsible "Previous Downloads" accordion below pagination footer showing export history table.

## Key Insights

- Use `Collapsible` from `@plane/propel/collapsible` (compound component pattern)
- ExporterHistorySerializer returns: `id`, `created_at`, `provider`, `status`, `url`, `initiated_by_detail` (with `display_name`, `avatar_url`), `project`
- Poll for status updates when any export is "queued" or "processing" (5s interval)
- Use `Table` from `@plane/ui` consistent with worklog table above

## Requirements

### Functional

- Collapsible accordion with "Previous Downloads" header + refresh button
- Table columns: Exported By (avatar + name), Exported On (formatted date), Format (CSV/XLSX badge), Status (Queued/Processing/Completed/Failed badge), Download (link or disabled)
- Auto-poll every 5s when any row has status queued/processing
- Download column: clickable link for completed, "—" for others
- **Paginated** (reuse cursor pagination from backend, display `1-X of Y` with `<Prev>` `<Next>` buttons)
- Export Format: Text display `Excel` or `CSV` (no badges)

### Non-functional

- Max 10 items per page with clear pagination controls
- Stop polling when all exports completed/failed or section collapsed
- Stop polling when all exports completed/failed or section collapsed

## Architecture

```
Previous Downloads (Collapsible)
  └── Table
       ├── Exported By: Avatar + display_name
       ├── Exported On: format(created_at, "MMM dd, yyyy HH:mm")
       ├── Format: provider badge
       ├── Status: colored badge
       └── Download: <a href={url}> or "—"
```

### State Management

- Add to worklog store: `exportHistory: ExporterHistory[]`, `fetchExportHistory()`, `isExportHistoryLoading`
- Polling via `useEffect` + `setInterval` when section is open and pending exports exist

## Related Code Files

### Modify

- `apps/web/ce/services/project-worklog.service.ts` — add `getExportHistory` method
- `apps/web/ce/store/project/worklog.store.ts` — add export history state + fetch action
- `apps/web/app/.../worklogs/page.tsx` — mount PreviousDownloads component

### Create

- `apps/web/app/.../worklogs/previous-downloads.tsx` — Collapsible + table (~120 lines)

## Implementation Steps

1. **Add service method** in `project-worklog.service.ts`:

   ```typescript
   async getExportHistory(
     workspaceSlug: string,
     projectId: string,
     cursor?: string
   ): Promise<TPaginatedResponse<IExporterHistory[]>> {
     return this.get(
       `/api/workspaces/${workspaceSlug}/projects/${projectId}/worklogs/export/`,
       { params: { per_page: 10, cursor: cursor || "10:0:0" } }
     ).then(getData);
   }
   ```

2. **Add store state** in `worklog.store.ts`:

   ```typescript
   exportHistory: IExporterHistory[] = [];
   isExportHistoryLoading: boolean = false;

   fetchExportHistory = async (workspaceSlug, projectId) => { ... };
   ```

3. **Create `previous-downloads.tsx`**:
   - Use `Collapsible.CollapsibleRoot`, `.CollapsibleTrigger`, `.CollapsibleContent`
   - Trigger: "Previous Downloads" text + `RefreshCw` icon button + chevron
   - Content: `Table` with export history data
   - Status badges: Queued (yellow), Processing (blue), Completed (green), Failed (red)
   - Download: `<a href={url} target="_blank">` for completed exports

4. **Add polling logic** in component:

   ```typescript
   useEffect(() => {
     if (!isOpen) return;
     const hasPending = exportHistory.some((e) => ["queued", "processing"].includes(e.status));
     if (!hasPending) return;
     const interval = setInterval(() => fetchExportHistory(), 5000);
     return () => clearInterval(interval);
   }, [isOpen, exportHistory]);
   ```

5. **Mount in `page.tsx`**:
   - Add `<PreviousDownloads />` after the table/pagination section
   - Pass `workspaceSlug` and `projectId` props

6. **Define `IExporterHistory` type** (if not already in `@plane/types`):
   ```typescript
   interface IExporterHistory {
     id: string;
     created_at: string;
     provider: "csv" | "xlsx";
     status: "queued" | "processing" | "completed" | "failed";
     url: string | null;
     initiated_by_detail: {
       id: string;
       display_name: string;
       avatar: string;
     };
   }
   ```

## Todo

- [ ] Add `getExportHistory` to worklog service
- [ ] Add export history state + fetch to worklog store
- [ ] Define `IExporterHistory` type (check if exists in `@plane/types`)
- [ ] Create `previous-downloads.tsx` component
- [ ] Add status badge styling (semantic color tokens)
- [ ] Add polling logic for pending exports
- [ ] Mount component in `page.tsx`
- [ ] Test: accordion opens/closes
- [ ] Test: completed export shows download link
- [ ] Test: polling stops when all exports done

## Success Criteria

- Accordion collapses/expands correctly
- Export history table shows correct data
- Polling updates status in real-time
- Download links work for completed exports
- Refresh button manually fetches latest data

## Risk Assessment

- **Polling performance**: 5s interval is reasonable; stop when collapsed or no pending
- **Stale presigned URLs**: URLs expire in 7 days — show "Expired" if url is null and status is completed
- **Component size**: Target ~120 lines; split table columns config if needed

## Security

- Export history filtered by project on backend
- Download URLs are presigned S3 — time-limited access
- No sensitive data exposed in export history list

## Next Steps

- Integration testing across all phases
- Verify export flow end-to-end: trigger → Celery → S3 → download link
