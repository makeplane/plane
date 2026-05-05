# Phase 01 — Issue Detail Sidebar

**Plan:** [plan.md](./plan.md)

## Overview

| Field       | Value                                                         |
| ----------- | ------------------------------------------------------------- |
| Date        | 2026-03-06                                                    |
| Description | Add read-only `completed_at` property to issue detail sidebar |
| Priority    | P2                                                            |
| Status      | ⏳ pending                                                    |

## Key Insights

<!-- Updated: Validation Session 3 - CE override confirmed, rewrite steps for CE wrapper -->

- `sidebar.tsx` is in `core/` — **DO NOT modify directly**
- Must create/extend a CE override component in `apps/web/ce/components/issues/issue-detail/`
- `completed_at` is a `string | null` ISO datetime from the API
- Show only when `issue.completed_at` is not null
- Read-only: just display text, no dropdown/editable control
- Pattern: `SidebarPropertyListItem` with icon + formatted text span
- Verify `common.completed_at` key in KO and VI locale files inline

## Related Files

- `apps/web/core/components/issues/issue-detail/sidebar.tsx` — reference only (do not modify)
- `apps/web/ce/components/issues/issue-detail/` — CE override location (investigate existing files)
- `packages/utils/src/datetime.ts` — `renderFormattedDate`, `renderFormattedTime`
- `packages/i18n/src/locales/en/translations.ts:728` — `common.completed_at: "Completed at"`
- `packages/i18n/src/locales/ko/translations.ts` — verify `common.completed_at` key
- `packages/i18n/src/locales/vi/translations.ts` — verify `common.completed_at` key
- `packages/propel/src/icons/properties/due-date-icon.tsx` — icon to reuse

## Implementation Steps

1. **Explore CE override** — check `apps/web/ce/components/issues/issue-detail/` for existing sidebar override; inspect how it wraps or extends `core/` sidebar
2. **Find injection point** — locate where the CE sidebar renders the Due Date property row
3. **Verify backend clears `completed_at`** — read `apps/api/plane/db/models/issue.py` `Issue.save()` (or Django signals) to confirm `completed_at` is set to `None` when state group transitions away from "completed". If not, the dual display condition below is even more important.
4. **Add completed_at block** after the Due Date row:
   ```tsx
   {
     /* Dual check: completed_at value + state group (handles optimistic update race) */
   }
   {
     issue.completed_at && issue.state?.group === "completed" && (
       <SidebarPropertyListItem icon={DueDatePropertyIcon} label={t("common.completed_at")}>
         <span className="px-2 text-body-xs-regular text-secondary-200">
           {renderFormattedDate(issue.completed_at)} {renderFormattedTime(issue.completed_at, "12-hour")}
         </span>
       </SidebarPropertyListItem>
     );
   }
   ```
5. **Add imports** — `renderFormattedDate`, `renderFormattedTime` from `@plane/utils`; `DueDatePropertyIcon` from `@plane/propel`
6. **Verify i18n** — check KO (`ko/translations.ts`) and VI (`vi/translations.ts`) for `common.completed_at`; add if missing

## Todo

- [ ] Explore `apps/web/ce/components/issues/issue-detail/` to find sidebar override file
- [ ] Verify backend: read `apps/api/plane/db/models/issue.py` `Issue.save()` — confirm `completed_at` cleared on state revert
- [ ] Add completed_at property block after Due Date row in CE override (dual condition)
- [ ] Add missing imports
- [ ] Verify/add `common.completed_at` in KO and VI locale files
- [ ] Verify display with a "completed" state work item
- [ ] Manual test: change state from completed → in-progress, confirm completed_at row disappears immediately

## Success Criteria

- `completed_at` row appears in sidebar only when state group = "completed"
- Row disappears when state changes back to non-completed
- Date + time displayed, read-only, styled consistently with other properties

## Risk

- Low — purely additive UI change, no logic
