# Phase 06: Worklog Activity Scalability

<!-- Updated: Validation Session 1 - Renumbered from Phase 7 to Phase 6. Confirmed: included in this PR. -->

## Context

- Parent plan: [plan.md](./plan.md)
- Depends on: Phase 4 (audit trail — must not collapse audit entries)
- Related: `apps/web/ce/store/issue/issue-details/activity.store.ts`, activity components

## Overview

- **Priority**: P2
- **Status**: complete
- **Description**: When many time logs exist on a work item, the activity feed becomes excessively long. Implement collapsible worklog groups.

## Problem

- Each worklog creates an activity entry: "User logged 2h 30m — description — Mar 15"
- A work item with 30+ worklogs drowns other activity (comments, state changes) in the feed
- Admin modification/deletion entries (Phase 4) add even more entries

## Architecture (Collapsible Worklog Group)

### Frontend Changes Only

1. In `activity.store.ts` → `buildActivityAndCommentItems()`:
   - After building the flat list, post-process to detect consecutive WORKLOG items
   - Group them into a `TWorklogGroupItem` with metadata (count, total_minutes, entries[])

2. New component: `WorklogActivityGroup`
   - Renders collapsed summary: "Time Logs (N entries, total: Xh Ym)" with expand toggle
   - When expanded, renders individual `IssueActivityWorklog` entries
   - Always keeps first 3 entries visible, collapses rest

3. In activity rendering loop, handle the new group item type

### Data Structure

```ts
type TWorklogGroupItem = {
  type: "worklog_group";
  entries: TIssueActivityComment[];
  totalMinutes: number;
  count: number;
  created_at: string;
};
```

**Important:** Admin edit/delete entries (field="worklog", verb="updated"/"deleted") are NOT grouped — they're audit events, always visible.

## Related Code Files

| File                                                                        | Change                                                              |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `apps/web/ce/store/issue/issue-details/activity.store.ts`                   | Group consecutive worklog items in `buildActivityAndCommentItems()` |
| `apps/web/ce/components/issues/worklog/activity/worklog-activity-group.tsx` | **NEW** — collapsible group component                               |
| Activity rendering component (parent of IssueActivityWorklog)               | Handle `worklog_group` type                                         |

## Implementation Steps

1. Define `TWorklogGroupItem` type in types package or locally
2. In `activity.store.ts`, add post-processing after `buildActivityAndCommentItems()`:
   - Scan ordered list for consecutive WORKLOG items
   - If count > 3, merge into a `TWorklogGroupItem`
   - Keep admin modification/deletion entries separate (don't group)
3. Create `WorklogActivityGroup` component:
   - Collapsed: Timer icon + "Time Logs (N entries, total Xh Ym)" + chevron
   - Expanded: render each entry as `IssueActivityWorklog`
   - useState for expand/collapse
4. Update activity feed rendering to handle group items

## Todo

- [x] Define `TWorklogGroupItem` type
- [x] Add grouping logic in activity store
- [x] Create `WorklogActivityGroup` component
- [x] Update activity rendering loop
- [x] Test with 1-3 worklogs (no grouping)
- [x] Test with 10+ worklogs (grouped, expand/collapse)

## Success Criteria

- ≤3 worklogs: displayed individually (no change)
- > 3 worklogs: collapsed into summary with total, expandable
- Admin modification/deletion entries remain always visible
- Expand/collapse works smoothly

## Risk Assessment

- **Low**: Frontend-only, no backend changes
- **Medium**: Grouping logic must not break activity ordering
- **Low**: Collapse state is ephemeral (local state only)

## Security Considerations

- None — display-only change

## Next Steps

- If collapsible groups prove insufficient, evaluate separate "Time Logs" tab as follow-up
