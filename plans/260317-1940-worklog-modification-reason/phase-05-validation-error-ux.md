# Phase 05: Validation Error UX

## Context

- Parent plan: [plan.md](./plan.md)
- Related: `apps/api/plane/app/serializers/worklog.py`, `apps/api/plane/app/views/issue/worklog.py`
- Related: `apps/web/ce/components/issues/worklog/worklog-modal.tsx`, `activity/root.tsx`

## Overview

- **Priority**: P1
- **Status**: complete
- **Description**: Fix generic "Failed to save work log" error messages. Show specific validation errors (exceeded 12h, future date, >60 working days ago, daily limit) in toast notifications.

## Key Insights

### Root Cause

Two different error response formats from backend:

1. **View-level errors** (daily limit, time tracking disabled, edit window): `{"error": "message"}` — ✅ correctly extracted by frontend
2. **Serializer validation errors** (duration >12h, future date, >7 days ago): DRF format `{"field_name": ["error message"]}` — ❌ NOT extracted, falls back to generic message

Frontend extraction pattern only handles case 1:

```ts
const apiError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
// → undefined when serializer returns {"duration_minutes": ["..."]}
```

### Backend Validation Rules (already exist)

| Rule                                  | Location   | Error Format                                                                          |
| ------------------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| `duration_minutes <= 0`               | serializer | `{"duration_minutes": ["Duration must be greater than 0."]}`                          |
| `duration_minutes > 720` (12h)        | serializer | `{"duration_minutes": ["Duration cannot exceed 720 minutes (12 hours)."]}`            |
| `logged_at > today`                   | serializer | `{"logged_at": ["Cannot log time for future dates."]}`                                |
| `logged_at < 60 working days ago`     | serializer | `{"logged_at": ["Cannot log time more than 60 working days ago."]}`                   |
| Daily aggregate > 720 min             | view       | `{"error": "Daily time limit exceeded. You have X minutes remaining for this date."}` |
| Time tracking disabled                | view       | `{"error": "Time tracking is not enabled for this project"}`                          |
| Edit window expired (60 working days) | view       | `{"error": "This worklog is locked..."}`                                              |

## Requirements

1. Frontend must extract meaningful error messages from both DRF serializer and view-level error formats
2. Toast must show the specific validation error, not generic "Failed to save work log"
3. No backend changes needed — error messages from serializer are already descriptive

## Architecture

### Option A: Frontend-only fix (RECOMMENDED)

Create a utility function to extract error message from API response:

```ts
// apps/web/ce/components/issues/worklog/utils/extract-api-error.ts
export function extractApiError(err: unknown): string | undefined {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
  if (!data) return undefined;

  // View-level: {"error": "message"}
  if (typeof data.error === "string") return data.error;

  // DRF serializer: {"field_name": ["message1", "message2"]} or {"non_field_errors": [...]}
  for (const value of Object.values(data)) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
      return value[0]; // first error message
    }
  }
  return undefined;
}
```

Then replace all `apiError` extraction in worklog components with this utility.

### Option B: Backend normalization

Wrap serializer errors in view to return `{"error": "message"}` consistently. **Not recommended** — adds unnecessary code and deviates from DRF conventions.

## Related Code Files

| File                                                               | Change                                                 |
| ------------------------------------------------------------------ | ------------------------------------------------------ |
| `apps/web/ce/components/issues/worklog/utils/extract-api-error.ts` | **NEW** — utility function                             |
| `apps/web/ce/components/issues/worklog/worklog-modal.tsx`          | Replace `apiError` extraction with `extractApiError()` |
| `apps/web/ce/components/issues/worklog/activity/root.tsx`          | Replace `apiError` extraction with `extractApiError()` |
| `apps/web/ce/components/issues/worklog/worklog-delete-modal.tsx`   | Use `extractApiError()` (new file from Phase 3)        |

## Implementation Steps

1. Create `extract-api-error.ts` utility in `utils/` directory
2. Update `worklog-modal.tsx` catch block — replace inline extraction with `extractApiError(err)`
3. Update `activity/root.tsx` catch block — replace inline extraction with `extractApiError(err)`
4. Update `worklog-delete-modal.tsx` (Phase 3 new file) to use `extractApiError(err)`
5. Test each validation scenario:
   - Log 13h → toast shows "Duration cannot exceed 720 minutes (12 hours)."
   - Log future date → toast shows "Cannot log time for future dates."
   - Log >60 working days ago → toast shows "Cannot log time more than 60 working days ago."
   - Exceed daily limit → toast shows "Daily time limit exceeded. You have X minutes remaining..."

## Todo

- [x] Create `extract-api-error.ts` utility
- [x] Update `worklog-modal.tsx` error handling
- [x] Update `activity/root.tsx` error handling
- [x] Update `worklog-delete-modal.tsx` error handling
- [x] Manual test all 4+ validation scenarios

## Success Criteria

- Each validation error shows specific descriptive message in toast
- No generic "Failed to save work log" when a known validation triggers
- Still falls back to generic message only for truly unknown errors

## Risk Assessment

- **Low**: Frontend-only change, no API contract changes
- **Low**: Utility is additive, doesn't break existing behavior

## Security Considerations

- None — error messages are already returned by backend, just not displayed properly

## Next Steps

- Consider i18n for backend error messages in future (currently English-only from serializer)
- These backend messages could be mapped to i18n keys on frontend if localization is needed
