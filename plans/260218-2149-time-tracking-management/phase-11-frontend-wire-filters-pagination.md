# Phase 02: Frontend — Wire Filters + Pagination

## Context Links

- Settings page: `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/worklogs/page.tsx`
- Store: `apps/web/ce/store/project/worklog.store.ts`
- Service: `apps/web/ce/services/project-worklog.service.ts`
- Backend view: `apps/api/plane/app/views/project/worklog.py`

## Overview

- **Priority**: P1 (core functionality)
- **Status**: Pending
- **Description**: Wire existing filter UI (member dropdown, date range) to API params. Wire pagination buttons to store's hasMore/nextCursor.

## Key Insights

- Filter state (`selectedUsers`, `dateRange`) already exists in page.tsx but NOT passed to `fetchWorklogs()`
- Backend supports: `member_id`, `date_from`, `date_to`, `issue_id` query params
- Store has `hasMore` + `nextCursor` + `loadMore` flag support but UI buttons always disabled
- `fetchWorklogs` accepts `params?` object — just need to pass filter values
- Page.tsx is 252 lines — needs modularization during this phase

## Requirements

- Member filter → sends `member_id` param to API
- Date range filter → sends `date_from` + `date_to` params
- Pagination: Next button enabled when `hasMore=true`, triggers `fetchWorklogs(…, loadMore=true)`
- Re-fetch when filters change

## Related Code Files

- **Modify**: `apps/web/app/…/worklogs/page.tsx`
- **Check**: `apps/web/ce/store/project/worklog.store.ts` (fetchWorklogs signature)

## Embedded Rules

- `observer()` on all MobX-reading components
- `useEffect` for data fetching with proper deps
- Semantic color tokens only
- Keep files under 200 lines — extract filter/table components if needed
- Use `@plane/propel/*` for UI components

## Implementation Steps

### 1. Read current page.tsx and store

Understand exact state/props shape and fetchWorklogs signature.

### 2. Wire filters to fetchWorklogs

In `useEffect` or handler, pass filter params:

```tsx
const params: Record<string, string> = {};
if (selectedUsers.length) params.member_id = selectedUsers.join(",");
if (dateRange?.from) params.date_from = dateRange.from;
if (dateRange?.to) params.date_to = dateRange.to;

projectWorklogs.fetchWorklogs(workspaceSlug, projectId, params);
```

### 3. Re-fetch on filter change

Add `selectedUsers` and `dateRange` to useEffect deps or use onChange handlers that trigger re-fetch.

### 4. Wire pagination

- Next button: `disabled={!projectWorklogs.hasMore}`, onClick triggers `fetchWorklogs(…, params, true)`
- Show loading state during fetch
- Consider: "Load more" pattern vs prev/next (match codebase convention)

### 5. Modularize if over 200 lines

Extract table component and/or filter bar into separate files if page exceeds limit.

### 6. Fix store type issue

Fix `as any` cast in `worklog.store.ts` — define proper paginated response type.

## Post-Phase Checklist

- [ ] Member filter sends `member_id` to API
- [ ] Date range filter sends `date_from`/`date_to`
- [ ] Filters trigger re-fetch
- [ ] Pagination Next works when `hasMore=true`
- [ ] Loading state shown during fetch
- [ ] Files under 200 lines
- [ ] `observer()` preserved
- [ ] No TypeScript errors

## Todo List

- [ ] Wire selectedUsers to member_id param
- [ ] Wire dateRange to date_from/date_to params
- [ ] Add useEffect deps or onChange handlers
- [ ] Wire Next button to loadMore
- [ ] Fix store as-any cast
- [ ] Modularize page.tsx if needed
- [ ] Run lint check

## Success Criteria

- Selecting members filters table to show only their worklogs
- Selecting date range filters by date
- Next button loads more results when available
- Clear filters shows all worklogs again
