# Brainstorm — Capacity Detailed Work-Item Export

**Date:** 2026-05-12
**Tab:** `/{workspaceSlug}/time-tracking/capacity`
**Files:** `apps/web/ce/components/time-tracking/capacity/capacity-dashboard.tsx`

## Problem

Current `handleExport` (capacity-dashboard.tsx:87-108) produces a single CSV: member × daily total hours. Managers also need a worklog-level breakdown showing what each person did per work item, with Main / Sub category, to assess effort distribution. Existing export must remain unchanged.

## Requirements

- Keep current Capacity CSV exactly as-is (zero data/format change).
- Add a second "Detailed work-item report" export.
- Detailed report = XLSX, **one sheet per person**.
- Columns: `Member | Date | Main Category | Sub Category | Work Item | Time Spent (h)`.
- Row grain: per worklog entry.
- Scope: inherits all current dashboard filters (date range, member filter, cross-workspace toggle).
- Member filter behaviour: empty → all members, selected → only those; one sheet per included member.

## Final Design

### Entry point — Split-button dropdown

Replace the single `[Export]` primary button with a split-button (Propel `menu` + `button`):

```
[ Export ▼ ]
  ├ Capacity summary         ← current CSV, unchanged
  └ Detailed work-item report ← new XLSX
```

- Position: same slot as today (filter bar right side).
- Each item shows brief subtitle on hover (tooltip) describing output.
- Disable a menu item with tooltip when its data would be empty.
- Loading spinner replaces caret while generating.

### Filter inheritance

Both exports read from the existing dashboard state:

- `dateRange.from / to`
- `selectedMembers` (MemberDropdown)
- `isCrossWorkspace`

No new picker / dialog. WYSIWYG: "export what I see".

### Detailed XLSX shape

- Workbook filename: `{workspaceSlug}-worklog-detailed-{from}_{to}.xlsx`
- One sheet per member; sheet name = member display name, sanitized (Excel: ≤31 chars, strip `: \ / ? * [ ]`); collisions → append `-2`, `-3`.
- Sheet header row frozen; column widths auto-sized.
- Rows sorted by `Date ASC, Work Item`.
- Time Spent shown in hours (2 decimals), matching current convention.
- Optional: summary sheet at index 0 with per-member totals + grand total (nice-to-have, not required).

### i18n keys (add to en / ko / vi)

- `capacity.export.menu`
- `capacity.export.summary` ("Capacity summary")
- `capacity.export.detailed` ("Detailed work-item report")
- Column headers: `capacity.export.col.member`, `.date`, `.main_category`, `.sub_category`, `.work_item`, `.time_spent_hours`

## Generation Strategy — Async via Celery + Email

Client-side generation rejected (year-range = ~250k rows, 80MB+ JSON, browser freeze risk). Detailed export runs **fully server-side as a Celery job; manager receives the download link by email.**

### Flow

```
1. Manager clicks "Detailed work-item report"
   → POST /api/workspaces/{slug}/capacity/exports/
     body: { date_from, date_to, member_ids[], cross_workspace, format: "xlsx" }
   → API enqueues Celery task, returns 202 + job_id
2. Toast: "Export queued. We'll email you when ready."
3. Celery worker:
   a. Query worklogs (streamed iterator, not in-memory list)
   b. Build XLSX with openpyxl write_only mode (one sheet per member)
   c. Upload to object storage (existing S3/MinIO setup used for assets)
   d. Generate signed download URL (TTL: 7 days)
   e. Send email to manager with link
   f. Persist job record (status, file_url, expires_at) for audit
4. On failure → email with apology + retry instructions; job marked FAILED.
```

### Capacity Sync Export (current CSV) — unchanged

Stays fully client-side. Small (member × day grid), no scaling issue.

## Tech Notes (for downstream `/ck:plan`)

### Frontend (`apps/web/ce/`)

- `xlsx@0.18.5` in deps — kept for any future small exports; **not used by detailed flow**.
- Split-button dropdown with two items (see Final Design).
- Detailed item: POST to new export endpoint, show toast on 202, no file download in this flow.
- Cross-workspace mode: **disable detailed export** (tooltip explains).

### Backend (`apps/api/`)

- New Django model `CapacityExportJob`:
  ```python
  workspace, requested_by, date_from, date_to, member_ids (JSON),
  cross_workspace (bool), status (queued|running|ready|failed),
  file_path, file_size, error_message, expires_at, created_at, completed_at
  ```
- New endpoint `POST /api/workspaces/{slug}/capacity/exports/` → creates job row + enqueues Celery task.
- Optional `GET /api/workspaces/{slug}/capacity/exports/` for "My exports" list (defer to v2).
- Celery task `generate_capacity_xlsx_export(job_id)`:
  - Use `openpyxl` `write_only=True` mode (bounded memory).
  - Stream rows from ORM with `.iterator(chunk_size=2000)`.
  - Sheet per member; sanitize name (≤31 chars, strip `:\/?*[]`, dedupe).
  - Columns: `Member | Date | Main Category | Sub Category | Work Item | Time Spent (h)`.
- Storage: reuse existing `FileAsset` / S3 layer; key prefix `capacity-exports/{workspace_id}/{job_id}.xlsx`.
- Signed URL: 7-day expiry; revoke on job delete.

### Email

- Reuse existing transactional email infra (`apps/api/plane/bgtasks/email/`).
- Template:
  - Subject: `Your capacity report is ready ({from} – {to})`
  - Body: range, member count, row count, **Download** button (signed URL), expiry notice, "Generated on {timestamp}".
- Failure email: subject `Capacity export failed`, generic apology + retry guidance.
- i18n: render in manager's preferred locale.

### Cleanup

- Daily Celery beat task: delete expired files + mark job rows as `expired`.

### Worklog query shape

```sql
SELECT m.id, m.display_name, w.logged_at, wi.name AS work_item,
       mc.name AS main_cat, sc.name AS sub_cat, w.minutes
FROM worklog w
JOIN member m   ON w.member_id = m.id
JOIN work_item wi ON w.work_item_id = wi.id
LEFT JOIN main_category mc ON wi.main_category_id = mc.id
LEFT JOIN sub_category  sc ON wi.sub_category_id  = sc.id
WHERE w.workspace_id = :ws AND w.logged_at BETWEEN :from AND :to
  AND (:member_ids IS NULL OR m.id = ANY(:member_ids))
ORDER BY m.id, w.logged_at;
```

## Alternatives Considered (Rejected)

| Option                          | Why rejected                                                            |
| ------------------------------- | ----------------------------------------------------------------------- |
| Two side-by-side buttons        | Bloats header; doesn't scale past 2 exports.                            |
| Export modal with options       | User confirmed inheriting filters is fine; modal is unnecessary clicks. |
| CSV with member column          | Cannot do one-sheet-per-person; user explicitly wants sheets.           |
| Roll up per (member, work item) | User wants per-entry grain to inspect daily activity.                   |

## Risks

- **Email deliverability**: link emails may land in spam. Mitigation: use existing transactional sender domain (already SPF/DKIM-signed by Plane); test with major providers.
- **Signed URL leakage**: forwarded email = anyone with link can download. Mitigation: short TTL (7d), one-time-download option (defer), watermark sheet with `Generated for {email} on {date}` first row.
- **Long-running Celery jobs**: year-range may take 1–3 min. Mitigation: openpyxl write_only mode + streamed ORM iterator keeps memory bounded; set Celery soft/hard time limits (5/10 min); add progress logging.
- **Duplicate job spam**: manager clicks twice → 2 emails. Mitigation: debounce on FE (disable button 30s after click) + show "Already queued" if recent identical job exists.
- **Storage growth**: yearly exports × many users × 7-day retention. Mitigation: cleanup beat task; track size in `CapacityExportJob.file_size` for monitoring.
- **Sheet-name collisions**: two members with same display name. Mitigation: sanitize + dedupe suffix.
- **Null sub-category**: render as empty cell, not the string "null".
- **Cross-workspace scope**: rows would span projects → permission leak risk. Decision: **disable** detailed export in cross-workspace mode.

## Success Criteria

- Clicking "Capacity summary" produces byte-identical output to today's export.
- Clicking "Detailed work-item report" downloads XLSX with one sheet per filtered member and the agreed columns.
- All strings i18n'd in en / ko / vi.
- No layout regression in filter bar.
- Lint + format pass; files <200 LOC.

## Next Step

Awaiting user decision: run `/ck:plan` to produce an implementation plan (FE split-button + XLSX gen, plus BE endpoint spec)?

## Unresolved Questions

1. Include the optional "Summary totals" first sheet with per-member totals?
2. Date format in cells — locale-aware or ISO `YYYY-MM-DD` (recommend ISO)?
3. Signed URL TTL — 7 days OK, or should manager configure (3/7/30)?
4. Failure email — send to requester only, or also CC workspace admin for audit?
5. Should we add a lightweight in-app "My exports" page (v1) for re-download without email, or defer entirely to v2?
6. Rate limit per user — e.g. max 5 detailed exports per hour?
