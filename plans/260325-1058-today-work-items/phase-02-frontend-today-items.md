# Phase 2: Frontend — Today Work Items Table Component

## Overview

Create a `TodayWorkItems` component that displays a data table of work items assigned to the current user in a valid execution window. Place it between "Work Items by Priority" and "Recent Activity" on the Your Work → Summary page.

**Priority:** P2 | **Status:** Pending

## Requirements

- Data table with columns: Work Item Name, Department, Project, State, Progress Tracking, Start Date, Due Date
- Fetch data using existing `UserService.getUserProfileIssues()` with today-filter params
- Reuse `getProgressStatus()` from `ce/components/issues/issue-layouts/progress-tracking-utils.ts`
- Component placed in `apps/web/ce/components/profile/` (CE-only feature)
- Add i18n keys for the section title and column headers in en/ko/vi

## Architecture

### Data Fetching

```typescript
// Filter: assigned to userId, state groups = backlog+unstarted+started
// start_date <= today (null excluded), target_date not null (include overdue for visibility)
// Updated: Validation Session 1 — include overdue, exclude null dates
const params = {
  assignees: userId,
  state_group: "backlog,unstarted,started",
  start_date: `${todayStr};before_including;`, // start_date <= today; nulls naturally excluded
  // No target_date >= filter — include overdue items (null target_dates excluded naturally)
  order_by: "target_date",
  type: "assigned",
};
// Updated: Validation Session 2 — no isnull params needed; null exclusion handled by __lte filter
```

### Component Structure

```
apps/web/ce/components/profile/
├── today-work-items.tsx         ← main component (NEW)
└── index.ts                     ← barrel export (NEW or UPDATE)
```

### Data Table Columns

| Column            | Source                                                   | Component/Logic                                          |
| ----------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| Work Item Name    | `issue.name` + `issue.sequence_id` + project identifier  | Link to issue detail                                     |
| Department        | `workspace.name` from workspace store                    | Read-only text                                           |
| Project           | `project.name` from project store via `issue.project_id` | Read-only text                                           |
| State             | `issue.state_id` → state from state store                | State badge with color                                   |
| Progress Tracking | `getProgressStatus(issue.target_date)`                   | Color-coded badge (Off Track/Due Today/At Risk/On Track) |
| Start Date        | `issue.start_date`                                       | Formatted date (DD MMM YYYY)                             |
| Due Date          | `issue.target_date`                                      | Formatted date (DD MMM YYYY)                             |

## Related Files

### Files to modify

- `apps/web/app/(all)/[workspaceSlug]/(projects)/profile/[userId]/page.tsx` — insert `<TodayWorkItems />` between priority/state grids and `<ProfileActivity />`
- `packages/i18n/src/locales/en/translations.ts` — add i18n keys under `profile.stats.today_work_items`
- `packages/i18n/src/locales/ko/translations.ts` — add Korean translations
- `packages/i18n/src/locales/vi/translations.ts` — add Vietnamese translations

### Files to create

- `apps/web/ce/components/profile/today-work-items.tsx` — main component

## Embedded Rules

1. **Semantic tokens only** — use `text-primary`, `text-secondary`, `bg-surface-1`, `border-subtle` etc. NO hardcoded colors
2. **`observer()` on MobX-reading components** — wrap component with `observer` since it reads from stores
3. **`t()` for all user-facing strings** — use i18n for title, column headers, empty state
4. **Import order** — React → `import type` → `@plane/*` → `@/` → relative
5. **CE code in `ce/` directory** — new component in `apps/web/ce/components/profile/`
6. **Propel subpath imports** — `@plane/propel/button`, NOT barrel
7. **File < 150 lines** — keep component concise

## Implementation Steps

### 2.0 Verify data fetching pattern (pre-step)

<!-- Updated: Validation Session 1 - verify existing pattern before implementing -->

Before writing the component, grep `ProfileActivity` and `ProfilePriorityDistribution` for their data fetching approach (useSWR, useEffect, store action, etc.) and match it.

### 2.1 Add i18n keys

Add to `profile.stats` namespace in all 3 locale files:

```typescript
today_work_items: {
  title: "Today Work Items",
  empty: "No active work items for today.",
  columns: {
    work_item: "Work Item",
    department: "Department",
    project: "Project",
    state: "State",
    progress: "Progress Tracking",
    start_date: "Start Date",
    due_date: "Due Date",
  },
},
```

### 2.2 Create `today-work-items.tsx`

Key implementation details:

<!-- Updated: Validation Session 2 - add "use client" directive -->

- Add `"use client"` directive at top of file (component uses useSWR, MobX stores, browser APIs)
- Use `useSWR` with fetch key to load data
- Use `UserService.getUserProfileIssues()` with filter params
- Use `useWorkspace()` for department name
- Use `useProject()` for project name lookup
- Use `getProgressStatus()` for progress tracking column
- Use `useProjectState()` for state lookup and rendering
- Render as HTML `<table>` with Plane styling or use `Card` wrapper
- Handle loading state with `<Loader>` skeleton
- Handle empty state with `<EmptyStateCompact>`

### 2.3 Update profile page

In `page.tsx`, insert `<TodayWorkItems />` between the grid (priority + state charts) and `<ProfileActivity />`:

```diff
         <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
           <ProfilePriorityDistribution userProfile={userProfile} />
           <ProfileStateDistribution stateDistribution={stateDistribution} userProfile={userProfile} />
         </div>
+        <TodayWorkItems />
         <ProfileActivity />
```

## Post-Phase Checklist

- [ ] Component uses `observer()` wrapper
- [ ] All strings use `t()` with i18n keys
- [ ] No hardcoded colors — semantic tokens only
- [ ] Component file < 150 lines
- [ ] i18n keys added to en, ko, vi translations
- [ ] Import order: React → type → @plane → @/ → relative
- [ ] Component placed in `ce/components/profile/`
- [ ] Loading and empty states handled
- [ ] Progress tracking uses `getProgressStatus()` from existing util
- [ ] Date formatting is consistent

## Success Criteria

- "Today Work Items" section renders between priority charts and recent activity
- Table shows correct data (assigned issues in valid execution window, not done/cancelled)
- Progress Tracking column shows color-coded status badges
- Loading skeleton shows while data is fetching
- Empty state shows when no items match criteria
- All i18n translations work for en, ko, vi
