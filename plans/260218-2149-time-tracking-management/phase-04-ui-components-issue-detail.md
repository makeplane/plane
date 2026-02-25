# Phase 4: UI Components (Issue Detail)

## Context Links
- CE stubs: `apps/web/ce/components/issues/worklog/`
  - `property/root.tsx` — IssueWorklogProperty (sidebar + peek overview)
  - `activity/root.tsx` — IssueActivityWorklog (activity feed item)
  - `activity/worklog-create-button.tsx` — IssueActivityWorklogCreateButton
  - `activity/filter-root.tsx` — ActivityFilterRoot (already has filter logic)
- Sidebar integration: `apps/web/core/components/issues/issue-detail/sidebar.tsx:262`
- Peek overview: `apps/web/core/components/issues/peek-overview/properties.tsx:256`
- Activity root: `apps/web/core/components/issues/issue-detail/issue-activity/root.tsx:114`
- Activity comment root: `apps/web/core/components/issues/issue-detail/issue-activity/activity-comment-root.tsx:92`
- UI components: `@plane/propel` (modern) + `@plane/ui` (legacy)
- Permission check: `isWorklogButtonEnabled` = !isIntakeIssue && !isGuest && (isAdmin || isAssigned)

## Overview
- **Priority**: P1
- **Status**: complete
- Implement the CE stub components + create worklog create/edit modal + time estimate input.

## Key Insights
- All 3 CE stubs already imported and rendered in core components — just fill them in
- `isWorklogButtonEnabled` logic already exists in activity root — no permission changes needed
- Need a modal/dialog for log time form (reuse pattern from existing modals)
- `estimate_time` field needs to be added to issue create/edit forms
- Project-level `is_time_tracking_enabled` should conditionally show/hide worklog UI

## Requirements
### Functional
- **IssueWorklogProperty**: Show total logged time + estimate comparison in sidebar
- **IssueActivityWorklogCreateButton**: "Log Time" button opening modal
- **IssueActivityWorklog**: Render individual worklog entry in activity feed
- **Worklog Modal**: Form with date picker, duration (hours + minutes inputs), description
- **Time Estimate Input**: hours:minutes input on issue forms
- **Conditional rendering**: Only show when project has time tracking enabled

### Non-functional
- Match existing UI patterns (Tailwind, @plane/ui components)
- Responsive in sidebar and peek overview contexts
- Accessible: proper labels, keyboard navigation

## Architecture
```
IssueWorklogProperty (sidebar)
├── Shows: "Time: 2h 30m / 4h est." with progress indicator
├── Click → opens worklog list popover or section
└── Fetches worklogs on mount via store

IssueActivityWorklogCreateButton (activity header)
├── "Log Time" button with clock icon
└── Click → opens WorklogCreateModal

IssueActivityWorklog (activity feed)
├── Shows: avatar + "logged 1h 30m" + date + description
├── Edit/Delete actions (own entries or admin)
└── Click edit → opens WorklogEditModal

WorklogModal (shared create/edit)
├── Date picker (logged_at)
├── Duration: hours input + minutes input
├── Description textarea
└── Save/Cancel buttons
```

## Related Code Files
### Create
- `apps/web/ce/components/issues/worklog/worklog-modal.tsx` — create/edit modal
- `apps/web/ce/components/issues/worklog/time-display.tsx` — reusable time display component
- `apps/web/ce/components/issues/worklog/time-estimate-input.tsx` — estimate input for issue forms

### Modify
- `apps/web/ce/components/issues/worklog/property/root.tsx` — implement IssueWorklogProperty
- `apps/web/ce/components/issues/worklog/activity/root.tsx` — implement IssueActivityWorklog
- `apps/web/ce/components/issues/worklog/activity/worklog-create-button.tsx` — implement button
- `apps/web/ce/components/issues/worklog/activity/filter-root.tsx` — add WORKLOG filter option
- `apps/web/ce/components/issues/worklog/property/index.ts` — re-export
- `apps/web/ce/components/issues/worklog/activity/index.ts` — re-export
- Issue create/edit form: add estimate_time input (find existing form component)

## Implementation Steps

1. **Create WorklogModal component** (`worklog-modal.tsx`)
   - Props: isOpen, onClose, workspaceSlug, projectId, issueId, existingWorklog? (for edit)
   - Form state: logged_at (DatePicker), hours (number input), minutes (number input), description (textarea)
   - On submit: convert hours+minutes to duration_minutes, call store.createWorklog or updateWorklog
   - Validation: duration > 0, date required

2. **Create TimeDisplay component** (`time-display.tsx`)
   - Props: minutes (number), estimateMinutes? (number | null)
   - Renders: "2h 30m" with optional "/ 4h est."
   - Color coding: green (on track), red (over), gray (no estimate)

3. **Implement IssueWorklogProperty** (`property/root.tsx`)
   - Use `useStore()` to access worklog store
   - On mount: fetch worklogs for issue if project has time tracking enabled
   - Check `is_time_tracking_enabled` from project store
   - Show: clock icon + total logged time + estimate comparison
   - If disabled: return null (current behavior)

4. **Implement IssueActivityWorklogCreateButton** (`worklog-create-button.tsx`)
   - Render button with Clock icon + "Log Time" text
   - onClick: open WorklogModal
   - State: isModalOpen

5. **Implement IssueActivityWorklog** (`activity/root.tsx`)
   - Render worklog entry in activity feed format
   - Avatar of logger + "logged Xh Ym on [date]"
   - Description if present
   - Edit/Delete menu (own entries for members, all for admins)
   - Delete confirmation dialog

6. **Create TimeEstimateInput** (`time-estimate-input.tsx`)
   - Hours + Minutes side-by-side inputs
   - Used in issue create/edit forms
   - Converts to/from minutes for API

7. **Integrate TimeEstimateInput into issue form**
   - Find issue creation form: likely `apps/web/core/components/issues/` area
   - Add estimate_time field, conditionally shown when time tracking enabled

8. **Update ActivityFilterRoot** (`filter-root.tsx`)
   - WORKLOG filter option should appear when `is_time_tracking_enabled`
   - Already handled by Phase 2 constants changes — verify rendering

## Todo List
- [ ] Create WorklogModal component
- [ ] Create TimeDisplay component
- [ ] Implement IssueWorklogProperty
- [ ] Implement IssueActivityWorklogCreateButton
- [ ] Implement IssueActivityWorklog
- [ ] Create TimeEstimateInput component
- [ ] Integrate estimate input into issue forms
- [ ] Verify activity filter includes WORKLOG
- [ ] Test in sidebar and peek overview contexts

## Success Criteria
- "Log Time" button appears in activity header for eligible users
- Modal opens, accepts input, saves via API
- Logged time appears in sidebar property
- Worklog entries appear in activity feed
- Edit/delete work correctly with permission checks
- Estimate time input works on issue create/edit

## Risk Assessment
- **Component size**: Modal may exceed 200 lines → split form logic into hook
- **Project setting check**: Need to fetch project details to check flag → may already be in project store
- **Date handling**: Timezone issues with logged_at → use date-only (no time component)

## Security Considerations
- Client-side permission checks match server-side (display only, actual enforcement on API)
- No sensitive data in component state

## Next Steps
- Phase 5: Reports page using summary endpoints
