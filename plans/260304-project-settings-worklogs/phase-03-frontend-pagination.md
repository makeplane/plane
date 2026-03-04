# Phase 3: Frontend — Pagination

## Context

- [Worklog page](<../../apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/worklogs/page.tsx>) — lines 150-159 "Load more" button
- [WorklogStore](../../apps/web/ce/store/project/worklog.store.ts) — cursor-based pagination state
- [WorklogService](../../apps/web/ce/services/project-worklog.service.ts) — API calls

## Overview

- **Priority:** P2
- **Status:** pending
- Replace "Load more" button with "1-X of Y" + Prev/Next pagination footer.

## Key Insights

- Backend already returns `total_count`, `next_cursor`, `prev_cursor` in paginated response
- Current store uses cursor-based pagination — keep it, just expose page info
- Need to track current page boundaries (offset) for display

## Requirements

### Functional

- Bottom-left: "1-25 of 142" text (showing current range)
- Bottom-right: Prev/Next buttons (like `<Prev>` `<Next>`)
- Prev disabled on first page, Next disabled on last page
- Page size fixed at 25 (backend default)

### Non-functional

- No layout shift when switching pages
- Loading state during page transitions

## Architecture

- Store changes: add `totalCount`, `prevCursor` observables; modify `fetchWorklogs` to track page index
- New component: `worklog-pagination-footer.tsx` — stateless, receives props
- Page component: replace Load more div with pagination footer

## Related Code Files

### Modify

- `apps/web/ce/store/project/worklog.store.ts` — add totalCount, prevCursor, page tracking
- `apps/web/app/.../worklogs/page.tsx` — replace Load more with pagination footer

### Create

- `apps/web/app/.../worklogs/worklog-pagination-footer.tsx` — pagination UI component

## Implementation Steps

1. **Update `ProjectWorklogStore`**:
   - Add observables: `totalCount: number = 0`, `prevCursor?: string`, `currentPage: number = 1`
   - In `fetchWorklogs` response handler, extract `total_count` and `prev_cursor`
   - Add `fetchPage(direction: 'next' | 'prev')` action that calls fetchWorklogs with appropriate cursor
   - Reset `currentPage = 1` when filters change (non-loadMore fetch)

2. **Create `worklog-pagination-footer.tsx`** (~50 lines):

   ```tsx
   interface Props {
     currentPage: number;
     pageSize: number;
     totalCount: number;
     hasNext: boolean;
     hasPrev: boolean;
     isLoading: boolean;
     onNext: () => void;
     onPrev: () => void;
   }
   ```

   - Left side: `{start}-{end} of {totalCount}` text
   - Right side: Prev/Next `<Button variant="secondary" size="sm">`
   - Use `@plane/propel/button`

3. **Update `page.tsx`**:
   - Remove `handleLoadMore` callback
   - Replace lines 150-159 (Load more div) with `<WorklogPaginationFooter ... />`
   - Pass props from store: `projectWorklogs.totalCount`, `projectWorklogs.hasMore`, etc.

## Todo

- [ ] Add `totalCount`, `prevCursor`, `currentPage` to worklog store
- [ ] Add `fetchPage` action to store
- [ ] Create `worklog-pagination-footer.tsx`
- [ ] Replace Load more button with pagination footer in `page.tsx`
- [ ] Test: first page shows "1-25 of N", Prev disabled
- [ ] Test: clicking Next loads page 2, updates range display

## Success Criteria

- "Load more" button completely removed
- Pagination footer shows correct range and total
- Prev/Next navigation works correctly
- Filters reset pagination to page 1

## Risk Assessment

- **Backend response shape**: Verify `total_count` field exists in paginated response — check `BasePaginator`
- **Cursor pagination vs offset display**: Track page number client-side, derive range from `(page-1)*pageSize+1`

## Security

- No new security concerns — same API, same permissions

## Next Steps

- Can be implemented independently of phases 4-5
