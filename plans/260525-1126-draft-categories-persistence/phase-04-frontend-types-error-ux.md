---
phase: 4
title: "Frontend Types + Error UX"
status: pending
priority: P2
effort: "1h"
dependencies: [3]
---

# Phase 4: Frontend Types + Error UX

## Overview

Extend `TWorkspaceDraftIssue` to expose category IDs returned by the now-fixed backend. Replace generic move-failure toast with field-level error surface so user sees WHICH field rejected (no more silent data loss).

## Requirements

**Functional:**

- `TWorkspaceDraftIssue` includes `main_task_category_id: string | null` and `sub_task_category_id: string | null`.
- `handleMoveToProjects` in `form.tsx`:
  - On API error, parse DRF error response (object with field → string[] map).
  - Surface field errors via `setError(fieldName, { type: "server", message })` on the RHF form.
  - Keep generic toast as fallback for non-field errors (network, 500).

**Non-functional:**

- No new dependencies. Reuse existing `extractApiErrorMessage` helper in `apps/web/core/components/issues/issue-modal/base.tsx:38-46` (or import path equivalent).
- i18n: any new user-facing string added to `packages/i18n/src/locales/{en,ko,vi}/translations.ts`.

## Architecture

DRF returns error responses shaped like (verified at `issue.py:234`):

```json
{ "main_task_category_id": ["Main task category is required for non-draft issues."], "non_field_errors": ["..."] }
```

Backend keys already match form field names (`*_id` suffix). Pass through unchanged — no normalize layer needed (per V3). Use RHF's `setError`. Modal stays open; user sees red-bordered field, no data loss.

<!-- Updated: Validation Session 1 - V3: dropped _id-suffix normalize -->

## Related Code Files

- Modify: `packages/types/src/workspace-draft-issues/base.ts` (add 2 fields per types-interfaces.md conventions)
- Modify: `apps/web/core/components/issues/issue-modal/form.tsx` (handleMoveToProjects catch block at lines 292-317)
- Read for context: `apps/web/core/components/issues/issue-modal/base.tsx:38-46` (extractApiErrorMessage)

## Implementation Steps

1. **Types** — Open `packages/types/src/workspace-draft-issues/base.ts`, add 2 nullable string fields below existing FK ids. Mirror naming (`*_id` suffix). Run `pnpm --filter @plane/types check:types`.
2. **Form** — In `form.tsx` `handleMoveToProjects` catch:
   ```ts
   } catch (error: any) {
     const fieldErrors = error?.response?.data ?? error;
     if (fieldErrors && typeof fieldErrors === "object" && !Array.isArray(fieldErrors)) {
       let hasFieldError = false;
       Object.entries(fieldErrors).forEach(([key, val]) => {
         if (key === "non_field_errors" || key === "detail") return;
         const msg = Array.isArray(val) ? val[0] : String(val);
         try {
           setError(key as any, { type: "server", message: msg });
           hasFieldError = true;
         } catch { /* unknown field */ }
       });
       if (hasFieldError) return;
     }
     setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "Failed to move work item to project. Please try again." });
   }
   ```
3. Verify `setError` is destructured from `useForm()` in component scope; if not, add.
4. Run `pnpm --filter web check:types && pnpm --filter web check:lint`.
5. Manual smoke: create draft with categories → close modal → reopen → fields populated. Switch state to non-backlog → move → see field-level errors instead of toast.

## Success Criteria

- [ ] `TWorkspaceDraftIssue` exports both ID fields
- [ ] Type check + lint pass
- [ ] Reopened draft shows previously selected categories
- [ ] Move failure surfaces red border + inline error on the specific field
- [ ] Modal stays open on field error (no data loss)
- [ ] Generic toast only fires for non-field errors (network/500)

## Risk Assessment

- **Verified:** Backend already returns form-compatible keys (`main_task_category_id` per `issue.py:234`). No normalize needed.
- **Risk:** RHF v7 strict typed paths reject dynamic field names.
  - **Mitigation:** Cast to `any` at call site; safer than disabling strict.
- **Risk:** Adding fields to `TWorkspaceDraftIssue` breaks consumers expecting non-null.
  - **Mitigation:** Nullable union (`string | null`) per types-interfaces.md.
