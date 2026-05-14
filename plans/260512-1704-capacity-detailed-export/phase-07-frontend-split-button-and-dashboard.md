# Phase 07 — Frontend: Split-Button on Capacity Dashboard

## Context Links

- FE research §1, §2, §4, §8
- Target file: `apps/web/ce/components/time-tracking/capacity/capacity-dashboard.tsx`

## Overview

- Priority: P1
- Status: pending
- Brief: Replace single `[Export]` button (lines 203–210) with Propel `Menu` split-button: item 1 keeps existing CSV flow (untouched), item 2 queues detailed XLSX export. FE debounce 30s. Cross-workspace disables detailed item.

## Key Insights

- Existing `handleExport` (lines 87–108) MUST stay byte-identical. Wrap as `onClick` for menu item 1.
- Detailed item disabled when: `isCrossWorkspace=true` OR within 30s of last request OR missing date range (optional).
- Use Propel `Menu` with `customButton` for split-button look.
- Toast on 202 (info) and on error (error).

## Requirements

**Functional**

- Menu has 2 items:
  1. "Capacity summary" → calls existing `handleExport()` unchanged.
  2. "Detailed work-item report" → calls `worklogStore.initiateDetailedExport(slug, payload)`.
- Cross-workspace: item 2 disabled with tooltip "Not available in cross-workspace mode".
- FE debounce: after success, store `lastExportRequestAt`; disable item 2 for 30s.
- Toast messages all i18n'd.

**Non-functional**

- Modify capacity-dashboard.tsx but keep <200 LOC (current 237 LOC; extract split-button into separate component to reduce).
- Extract into `capacity-export-menu.tsx` (<150 LOC).

## Architecture

```
<CapacityExportMenu
  workspaceSlug
  dateFrom dateTo
  selectedMembers
  isCrossWorkspace
  onSummaryExport={handleExport}   // unchanged existing fn
/>
  ↓ uses Propel Menu + Button (split visual)
  ↓ item 1: onSummaryExport()
  ↓ item 2: worklogStore.initiateDetailedExport({ date_from, date_to, member_ids, cross_workspace })
            → setToast INFO (queued)
            → on error setToast ERROR
```

## Related Code Files

**Create**

- `apps/web/ce/components/time-tracking/capacity/capacity-export-menu.tsx`

**Modify**

- `apps/web/ce/components/time-tracking/capacity/capacity-dashboard.tsx` — replace button block; import + render new component; keep `handleExport` intact.

## Implementation Steps

1. Create `capacity-export-menu.tsx`:
   - Props: `workspaceSlug`, `dateFrom`, `dateTo`, `selectedMembers`, `isCrossWorkspace`, `onSummaryExport`, `hasData`.
   - Wrap in `observer()`.
   - Read `lastExportRequestAt` from `useWorklog()`.
   - Compute `isDebounced = lastExportRequestAt && Date.now() - lastExportRequestAt < 30_000`.
   - Use Propel `Menu` with `customButton` = split-look (left primary `Button` + right caret `Button`).
   - Item 1: `<Menu.Item onClick={onSummaryExport} disabled={!hasData}>`.
   - Item 2: `<Menu.Item onClick={handleDetailedExport} disabled={isCrossWorkspace || isDebounced || !dateFrom || !dateTo}>` + Tooltip with i18n key.
   - `handleDetailedExport` async: call store action, setToast on success/error.
2. Modify `capacity-dashboard.tsx`:
   - Add import: `import { CapacityExportMenu } from "./capacity-export-menu";`
   - Replace lines 203–210 button with `<CapacityExportMenu ... onSummaryExport={handleExport} hasData={!!capacityData} ... />`.
   - Verify file size ≤200 LOC after change.
3. Toast keys (added in Phase 09):
   - INFO: `capacity.export.queued_title` / `capacity.export.queued_message`
   - ERROR: `capacity.export.failed_title` / `capacity.export.failed_message`
4. Tooltip for disabled-detailed (cross-workspace): `capacity.export.cross_workspace_disabled`.
5. Tooltip for debounced: `capacity.export.already_queued`.

## Todo List

- [ ] Create `capacity-export-menu.tsx` (<150 LOC)
- [ ] Wire into dashboard, replacing single button
- [ ] Verify existing CSV export still byte-identical
- [ ] Verify cross-workspace disables item 2 with tooltip
- [ ] Verify 30s debounce works (click twice quickly)
- [ ] `pnpm check:lint` + `pnpm check:format`

## Success Criteria

- Capacity summary item produces same CSV as before (byte-identical comparison vs baseline).
- Detailed item POSTs to BE and shows toast "Export queued".
- Cross-workspace mode: item 2 visibly disabled + tooltip explains.
- Within 30s of click: item 2 disabled + tooltip "Already queued".
- No layout regression in filter bar.
- Files <200 / <150 LOC.

## Risk Assessment

| Risk                                 | Likelihood | Impact | Mitigation                                       |
| ------------------------------------ | ---------- | ------ | ------------------------------------------------ |
| Menu styling mismatch (split look)   | Med        | Low    | Test against Figma; tweak `customButton` classes |
| `handleExport` accidentally modified | Low        | High   | Code review specifically diffs lines 87–108      |
| Dashboard exceeds 200 LOC            | Med        | Low    | Extraction into export-menu component            |

## Security Considerations

- Payload sent to BE only — no client-side XLSX generation, no client-side file write for detailed path.
- Member IDs sourced from existing filter state (already permission-scoped on display).

## Next Steps

- Unblocks user-facing flow; Phase 08 adds re-download UI.
