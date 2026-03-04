# Phase 7: Frontend Validation & UX

## Context Links

- [Plan Overview](./plan.md)
- [Phase 5 — Backend validation](./phase-05-backend-validation-rules.md) (dependency)
- [Phase 6 — Backend permissions](./phase-06-backend-permission-enforcement.md) (dependency)
- WorklogModal: `apps/web/ce/components/issues/worklog/worklog-modal.tsx`
- Activity root: `apps/web/ce/components/issues/worklog/activity/root.tsx`
- Types: `packages/types/src/worklog.ts`
- i18n EN: `packages/i18n/src/locales/en/translations.ts`

## Overview

- **Priority**: P2
- **Status**: pending
- **Effort**: 45m
- **Description**: Restrict date picker (max=today, min=7 working days ago), show error toasts for validation failures, disable edit/delete UI for locked worklogs.

## Key Insights

- WorklogModal already has `max={todayDate()}` on date input — good, no change needed for "no future dates".
- Missing: `min` attribute on date input for 7-working-day backdate limit.
- Activity root currently shows edit/delete for any `isAdmin` worklog — must add date-based lock check.
- Backend returns error messages in `{"error": "..."}` format — frontend should show these in toast.
- Working-day calculation needs a small utility function (shared between modal min-date and activity lock check).

## Requirements

- **R1**: Date picker `min` = 7 working days ago (Mon-Fri, skip weekends)
- **R2**: Date picker `max` = today (already done)
- **R3**: Error toasts when backend returns 400/403 with validation messages
- **R4**: Hide edit/delete buttons on worklogs with `logged_at` older than 7 working days
- **R5**: Add i18n keys for new error messages (EN, KO, VI)

## Architecture

```
WorklogModal:
  - date input min={getMinAllowedDate()} max={todayDate()}
  - catch block: parse error.response.data.error → toast

Activity root:
  - isEditable = isAdmin && isWithinEditWindow(worklog.logged_at)
  - Show edit/delete only if isEditable
```

## Related Code Files

- **Modify**: `apps/web/ce/components/issues/worklog/worklog-modal.tsx`
  - Add `min` date attribute
  - Improve error toast to show backend message
- **Modify**: `apps/web/ce/components/issues/worklog/activity/root.tsx`
  - Add `isWithinEditWindow()` check before showing edit/delete
- **Create**: `apps/web/ce/components/issues/worklog/utils/worklog-date-utils.ts`
  - `getMinAllowedDate()`: returns YYYY-MM-DD string 7 working days ago
  - `isWithinEditWindow(loggedAt: string)`: returns boolean
- **Modify**: `packages/i18n/src/locales/en/translations.ts` — new worklog error keys
- **Modify**: `packages/i18n/src/locales/ko/translations.ts` — same keys
- **Modify**: `packages/i18n/src/locales/vi/translations.ts` — same keys

## Embedded Rules

```
- observer() on all MobX-reading components
- t() for all user-facing strings (en, ko, vi)
- Semantic color tokens: text-color-*, border-color-*, bg-*
- Propel subpath imports: @plane/propel/button, @plane/propel/toast
- File size < 200 lines
- kebab-case file names
```

## Implementation Steps

1. **Create `worklog-date-utils.ts`**

   ```typescript
   /**
    * Calculate date N working days ago (Mon-Fri).
    * Returns YYYY-MM-DD string.
    */
   export const getMinAllowedDate = (workingDays = 7): string => {
     const d = new Date();
     let counted = 0;
     while (counted < workingDays) {
       d.setDate(d.getDate() - 1);
       const dow = d.getDay(); // 0=Sun, 6=Sat
       if (dow !== 0 && dow !== 6) counted++;
     }
     return d.toISOString().split("T")[0];
   };

   /**
    * Check if a worklog logged_at date is within the editable window.
    */
   export const isWithinEditWindow = (loggedAt: string, workingDays = 7): boolean => {
     const minDate = getMinAllowedDate(workingDays);
     return loggedAt >= minDate; // string comparison works for YYYY-MM-DD
   };
   ```

2. **Update WorklogModal — add `min` to date input**

   ```tsx
   import { getMinAllowedDate } from "./utils/worklog-date-utils";
   // ...
   <input
     type="date"
     min={getMinAllowedDate()}
     max={todayDate()}
     // ... rest unchanged
   />;
   ```

3. **Update WorklogModal — improve error handling in catch block**
   - Current: generic `t("worklog.save_failed")`
   - Change: extract backend error message if available

   ```tsx
   } catch (err: unknown) {
     const apiError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
     setToast({
       type: TOAST_TYPE.ERROR,
       title: t("worklog.error"),
       message: apiError || t("worklog.save_failed"),
     });
   }
   ```

4. **Update Activity root — add edit window check**

   ```tsx
   import { isWithinEditWindow } from "../utils/worklog-date-utils";
   // ...
   const isEditable = isAdmin && worklog && isWithinEditWindow(worklog.logged_at);
   ```

   Replace all `isAdmin && worklog` conditions with `isEditable`:
   - Click handler on message `<p>`
   - Pencil icon visibility
   - CustomMenu visibility
   - WorklogModal render

5. **Add i18n keys for new validation messages**
   ```
   worklog.locked: "This worklog is locked"
   worklog.locked_description: "Worklogs older than 7 working days cannot be edited"
   worklog.daily_limit_exceeded: "Daily time limit exceeded"
   worklog.daily_limit_description: "Maximum 12 hours per day. You have {remaining} remaining."
   worklog.no_future_dates: "Cannot log time for future dates"
   worklog.backdate_limit: "Cannot log time more than 7 working days ago"
   ```
   Add to EN with actual Korean and Vietnamese translations (not English placeholders).
   <!-- Updated: Validation Session 2 - Write actual KO/VI translations instead of placeholders -->

## Post-Phase Checklist

- [ ] Date picker has `min` (7 working days ago) and `max` (today)
- [ ] Error toasts show backend error messages when available
- [ ] Edit/delete hidden on worklogs older than 7 working days
- [ ] `isWithinEditWindow` used consistently in activity root
- [ ] All new strings use `t()` with keys in EN, KO, VI
- [ ] `observer()` on all components reading MobX stores
- [ ] No hardcoded colors, semantic tokens only
- [ ] Files < 200 lines
- [ ] `worklog-date-utils.ts` is simple, testable utility

## Todo List

- [ ] Create `worklog-date-utils.ts` with `getMinAllowedDate()` and `isWithinEditWindow()`
- [ ] Add `min` attribute to WorklogModal date input
- [ ] Improve error handling in WorklogModal catch block
- [ ] Update activity root to use `isEditable` (admin + within window)
- [ ] Add i18n keys (EN, KO, VI)
- [ ] Run post-phase checklist
- [ ] Mark phase complete in plan.md

## Success Criteria

- Date picker doesn't allow selecting dates >7 working days ago
- Date picker doesn't allow future dates (existing)
- Clicking old worklog in activity feed: no edit UI appears
- Backend 400 error (daily limit) shows descriptive toast
- Backend 403 error (locked worklog) shows descriptive toast

## Risk Assessment

- **Client-server date mismatch**: Client `new Date()` uses user's local TZ; backend `date.today()` uses server TZ. On date boundaries, min/max could differ by 1 day. Acceptable — backend is source of truth.
- **Stale UI**: If admin has activity feed open and worklog crosses the 7-day boundary while viewing, edit buttons still show until page refresh. Acceptable.

## Security Considerations

- Frontend restrictions are UX only — backend enforces all rules
- No sensitive data exposed in error messages

## Next Steps

- Phase 8 (daily reminder) is independent and can proceed in parallel
