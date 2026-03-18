# Phase 2: Frontend — Gate Log Time Button + Worklog Property

## Context Links

- Log Time button: `apps/web/ce/components/issues/worklog/activity/worklog-create-button.tsx`
- Button usage in activity root: `apps/web/core/components/issues/issue-detail/issue-activity/root.tsx:83,126-132`
- Worklog property (sidebar): `apps/web/ce/components/issues/worklog/property/root.tsx`
- Property usage in sidebar: `apps/web/core/components/issues/issue-detail/sidebar.tsx:309-314`
- Property usage in peek-overview: `apps/web/core/components/issues/peek-overview/properties.tsx:303-308`
- Sidebar nav gating (reference): `apps/web/ce/components/sidebar/project-navigation-root.tsx:39`
- Time tracking layout guard (reference): `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/time-tracking/layout.tsx:50`

## Overview

- **Priority**: P2
- **Status**: complete
- **Description**: Gate "Log Time" button and worklog property display behind `is_time_tracking_enabled` project flag

## Key Insights

- The `IssueActivityWorklogCreateButton` already has a `disabled` prop that returns `null` when true — used for archived issues
- The `isWorklogButtonEnabled` flag in `root.tsx` checks role/assignment but NOT the feature flag
- The `IssueWorklogProperty` component does NOT check the feature flag — renders for any project with worklogs
- Sidebar nav and time-tracking layout already gate on `is_time_tracking_enabled`
- Backend API already rejects worklog CRUD when flag is off (returns 400)
- Need to add frontend gating to match backend enforcement

## Requirements

**Functional:**

- When `is_time_tracking_enabled=false`: hide "Log Time" button in issue detail activity section
- When `is_time_tracking_enabled=false`: hide worklog property display in issue sidebar and peek-overview
- When `is_time_tracking_enabled=true`: no behavior change (show everything as today)

**Non-functional:**

- Use existing `useProject` / `getProjectById` hooks (already available in parent components)
- Minimal code changes — add flag check alongside existing conditions

## Architecture

No new components. Add `is_time_tracking_enabled` check to existing visibility logic.

## Related Code Files

**Modify:**

- `apps/web/core/components/issues/issue-detail/issue-activity/root.tsx` — add flag check to `isWorklogButtonEnabled`
- `apps/web/core/components/issues/issue-detail/sidebar.tsx` — conditionally render `IssueWorklogProperty`
- `apps/web/core/components/issues/peek-overview/properties.tsx` — conditionally render `IssueWorklogProperty`

**Create:** None

## Implementation Steps

### Step 1: Gate "Log Time" button in activity root

File: `apps/web/core/components/issues/issue-detail/issue-activity/root.tsx`

Line 83 currently:

```typescript
const isWorklogButtonEnabled = !isIntakeIssue && !isGuest && (isAdmin || isAssigned);
```

Change to:

```typescript
const isTimeTrackingEnabled = project?.is_time_tracking_enabled !== false;
const isWorklogButtonEnabled = !isIntakeIssue && !isGuest && isTimeTrackingEnabled && (isAdmin || isAssigned);
```

Note: `project` is already fetched on line 105 via `getProjectById(projectId)`. Move the `project` fetch above line 83 (before `isWorklogButtonEnabled` derivation) so it's available.

### Step 2: Gate worklog property in issue detail sidebar

File: `apps/web/core/components/issues/issue-detail/sidebar.tsx`

Around line 309, wrap `IssueWorklogProperty` in a conditional:

```typescript
{
  currentProjectDetails?.is_time_tracking_enabled !== false && (
    <IssueWorklogProperty
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      issueId={issueId}
      disabled={!isEditable}
    />
  );
}
```

Note: `currentProjectDetails` should already be available via `useProject()` hook. Verify import exists; if not, use `getProjectById(projectId)`.

### Step 3: Gate worklog property in peek-overview

File: `apps/web/core/components/issues/peek-overview/properties.tsx`

Around line 303, wrap `IssueWorklogProperty` in same conditional:

```typescript
{
  project?.is_time_tracking_enabled !== false && (
    <IssueWorklogProperty workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} disabled={disabled} />
  );
}
```

Note: Check what variable name holds the project data in this component. Likely already available via props or store.

## Todo List

- [x] Move `project` fetch above `isWorklogButtonEnabled` in `root.tsx`
- [x] Add `isTimeTrackingEnabled` check to `isWorklogButtonEnabled`
- [x] Wrap `IssueWorklogProperty` in sidebar.tsx with feature flag check
- [x] Wrap `IssueWorklogProperty` in peek-overview/properties.tsx with feature flag check
- [x] Run `pnpm check:lint` to verify no errors (0 new errors, pre-existing only)
- [ ] Manual test: disable time tracking on a project → verify Log Time button hidden
- [ ] Manual test: enable time tracking → verify Log Time button shows

## Success Criteria

- Time tracking OFF → "Log Time" button not visible in issue detail
- Time tracking OFF → worklog property not visible in sidebar/peek-overview
- Time tracking ON → all worklog UI elements visible (unchanged behavior)
- No lint errors
- No new files created

## Risk Assessment

- **Low risk**: Adding a boolean check to existing conditional — no structural changes
- **Edge case**: Projects where `is_time_tracking_enabled` is `undefined` (should not happen but handled by `!== false` pattern, matching existing sidebar nav approach)

## Security Considerations

- Frontend gating is UX-only; backend already enforces the flag (returns 400)
- No new permissions or auth changes

## Next Steps

- Run `pnpm check:lint` after changes
- Test both states (enabled/disabled) in browser
