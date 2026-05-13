# Phase 08 — Frontend: My Exports Page

## Context Links

- FE research §6
- Pattern: `/time-tracking/capacity/page.tsx`, layout at `apps/web/app/(all)/[workspaceSlug]/(projects)/time-tracking/layout.tsx`

## Overview

- Priority: P2
- Status: pending
- Brief: New `/time-tracking/exports` route with a table of the requester's export jobs (status, range, member count, file size, actions: download/copy URL). Re-download supported until expiry.

## Key Insights

- Lives entirely in CE (`apps/web/ce/components/...` + `apps/web/app/.../exports/page.tsx`).
- Re-download uses `file_url` from `ICapacityExportJob` (presigned URL valid until `expires_at`).
- Polling: simple refresh button + auto-refresh every 30s while any job is `queued`/`processing` (use `setInterval` cleared on unmount).
- New tab in time-tracking layout (visible to ALL workspace members — validated). GET endpoint filters by `requested_by=request.user`, so each user sees only their own jobs.

<!-- Updated: Validation Session 1 - access changed admin-only → all members (own jobs only) -->

## Requirements

**Functional**

- Route: `/{workspaceSlug}/time-tracking/exports`.
- Table columns: Status badge | Date range | Members | Rows | Size | Created | Expires | Actions.
- Status badge colors (semantic tokens): queued (warning), processing (warning), ready (success), failed (danger), expired (secondary).
- Action: "Download" if ready & not expired (anchor with `download` attr to `file_url`); "Retry" link to capacity page if failed.
- Empty state when no jobs.
- Auto-refresh while any in-progress job present.

**Non-functional**

- Page file <100 LOC; row component <100 LOC.
- Use `AppHeader` + `ContentWrapper` (per design system).
- All strings via `t()`.

## Architecture

```
apps/web/app/(all)/[workspaceSlug]/(projects)/time-tracking/exports/
├── layout.tsx   ← AppHeader (reuses WorkspaceTimeTrackingHeader)
└── page.tsx     ← <CapacityExportsList />

apps/web/ce/components/time-tracking/capacity/
├── capacity-exports-list.tsx  (table container, observer)
├── capacity-export-row.tsx    (single row, status badge + actions)
└── capacity-export-status-badge.tsx (small util)
```

## Related Code Files

**Create**

- `apps/web/app/(all)/[workspaceSlug]/(projects)/time-tracking/exports/layout.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(projects)/time-tracking/exports/page.tsx`
- `apps/web/ce/components/time-tracking/capacity/capacity-exports-list.tsx`
- `apps/web/ce/components/time-tracking/capacity/capacity-export-row.tsx`
- `apps/web/ce/components/time-tracking/capacity/capacity-export-status-badge.tsx`

**Modify**

- `apps/web/app/routes/extended.ts` — add route entry
- `apps/web/app/(all)/[workspaceSlug]/(projects)/time-tracking/layout.tsx` — add tab `{ key: "exports", labelKey: "capacity.exports.tab", path: "exports", icon: Download, adminOnly: false }` (visible to all workspace members per validation)

## Implementation Steps

1. Add route in `extended.ts` (CE routing file).
2. Add tab in time-tracking layout's `ALL_TAB_ITEMS` (line ~23–26).
3. `page.tsx`: minimal — `<PageHead title={t("capacity.exports.tab")} /> + <CapacityExportsList />`.
4. `capacity-exports-list.tsx`:
   - On mount: `worklogStore.fetchExportHistory(slug)`.
   - Render `<table>` with header (i18n'd) + map jobs to `<CapacityExportRow>`.
   - Auto-refresh: `useEffect` polls every 30s while `jobs.some(j => ['queued','processing'].includes(j.status))`.
   - Loading + empty states.
5. `capacity-export-row.tsx`:
   - Shows badge, range, member_count, row_count, formatted size (KB/MB), created/expires (ISO).
   - Download action: anchor with `href={file_url} download`; disabled if expired/not-ready.
6. Style: `bg-surface-1` container, `bg-layer-1` row hover, `text-tertiary` for secondary text.
7. Add i18n keys (Phase 09 covers).

## Todo List

- [ ] Route registration
- [ ] Tab entry
- [ ] Layout + page files
- [ ] List component with polling
- [ ] Row component + status badge
- [ ] Empty/loading states
- [ ] Manual QA: click Download after job ready

## Success Criteria

- Page accessible at `/{slug}/time-tracking/exports`.
- Lists own jobs, sorted by created_at desc.
- Download action retrieves the XLSX.
- Auto-refresh stops once all jobs settled.
- No i18n strings hardcoded.

## Risk Assessment

| Risk                             | Likelihood | Impact | Mitigation                                            |
| -------------------------------- | ---------- | ------ | ----------------------------------------------------- |
| Polling thrash                   | Low        | Low    | Only poll if in-progress jobs exist; clear on unmount |
| Stale presigned URL (clock skew) | Low        | Med    | UI shows expires_at; user retriggers if stale         |
| File size formatting locale      | Low        | Low    | Use simple `${(bytes/1024/1024).toFixed(2)} MB`       |

## Security Considerations

- Page only shows requester's own jobs (BE enforces).
- Presigned URLs short-lived; copy-link action acceptable.

## Next Steps

- None.
