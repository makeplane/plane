# UI Test Report: Workspace Time Tracking

**Date:** 2026-04-09 | **Tester:** debugger agent | **Workspace:** `yesyes`

---

## Executive Summary

All 3 time-tracking pages render correctly and are accessible post-login. The core feature works. Two bugs found: (1) the Analytics tab (`/time-tracking/analytics`) shows empty state "No time logs found for this week" instead of an aggregated analytics view — this may be expected behavior with no data, but the UX is unclear; (2) 13 React console warnings on the My Timesheet page (non-blocking but indicate minor component issues).

---

## Test Results

| Test                         | Status  | Notes                                            |
| ---------------------------- | ------- | ------------------------------------------------ |
| Login                        | PASS    | URL: `/yesyes/` after login                      |
| Sidebar "Time Tracking" link | PASS    | Present under "More" expandable section          |
| My Timesheet page renders    | PASS    | Title: "My Timesheet", weekly grid with issues   |
| Analytics tab navigates      | PASS    | URL: `/yesyes/time-tracking/analytics`           |
| Analytics page renders       | PARTIAL | Renders but shows empty state                    |
| Capacity tab navigates       | PASS    | URL: `/yesyes/time-tracking/capacity`            |
| Capacity page renders        | PASS    | "Capacity Dashboard" with member grid            |
| Tab switching (3 tabs)       | PASS    | My Timesheet / Team/Project Analytics / Capacity |
| No 404 errors                | PASS    | All 3 pages return 200                           |
| No auth redirect             | PASS    | All pages accessible when logged in              |

---

## Detailed Findings

### 1. Login

- **URL:** `http://localhost:3000/` → redirects to `/yesyes/` on success
- **Form:** Custom Shinhan Bank login with `#login-identifier` (Employee No./Email) and `#login-password`
- **Result:** Login successful, session maintained across all page navigations

### 2. Sidebar Navigation

- "Time Tracking" link IS present at `/yesyes/time-tracking/`
- **Location:** Under the "More" collapsible in the Workspace section (not immediately visible — requires expanding "More")
- **UX Note:** Users must click "More" to reveal Time Tracking. Consider whether this should be pinned above "More" for discoverability.

### 3. My Timesheet (`/yesyes/time-tracking/`)

- **Page title:** "My Timesheet"
- **Active tab:** "My Timesheet" (underlined)
- **Tabs visible:** My Timesheet | Team/Project Analytics | Capacity
- **Grid:** Weekly calendar (Mon–Sun, Apr 6–12) with workspace/issue rows
  - Shows 3 issues: YESYE-10 "oko", YESYE-9 "ok", YESYE-8 "ok"
  - All show 0m logged (expected — no time logged)
  - TOTAL row shows 0m across all days
- **Week navigation:** Previous/Next arrows + "This Week" button present
- **Console errors:** 13 React warnings (see below)

### 4. Team/Project Analytics (`/yesyes/time-tracking/analytics`)

- **Page title:** "Workspace Analytics"
- **URL:** Stays at `/yesyes/time-tracking/analytics` (correct, no redirect)
- **Active tab:** "Team/Project Analytics" (underlined, confirmed in screenshot)
- **Content:** "No time logs found for this week." empty state message
- **Week navigation:** Present (Week of Apr 6–Apr 12)
- **Console errors:** 0
- **Issue:** Empty state message is identical to what My Timesheet would show with no data. No analytics-specific charts/graphs visible — unclear if this is expected behavior when no time is logged, or if the analytics component isn't rendering.

### 5. Capacity (`/yesyes/time-tracking/capacity`)

- **Page title:** "Capacity"
- **Active tab:** "Capacity" (underlined)
- **Content:** "Capacity Dashboard" with subtitle "View total logged time vs estimated capacity for team/project members"
- **Member grid:** Shows members: ngocyt001, Plane (x2), ngocyt004 — all showing 0.0h
- **Date columns:** APR 06 through APR 12 (current week)
- **Date range picker:** "Add date → Add date" with Export button
- **TOTAL LOGGED TIME:** 0.0h
- **Console errors:** 3 React warnings (same non-blocking type as My Timesheet)

---

## Console Errors / Warnings

### My Timesheet (13 errors)

All are React dev-mode warnings, not runtime errors:

1. **`Warning: Function components cannot be given refs`** — `AppSidebarItem` → `TooltipTrigger`. Fix: wrap `AppSidebarItem` with `React.forwardRef()`.
2. **`Warning: validateDOMNesting`** — `<button>` inside `<button>`. Nested interactive elements in sidebar item.
3. **`Warning: Cannot update a component while rendering a different component`** — MobX observer update during render cycle.

### Capacity (3 errors)

Same 3 warning types as above — originate from the sidebar/layout, not capacity-specific components.

### Analytics (0 errors)

Clean — no console errors.

### Global (pre-login)

- `401 Unauthorized` on initial page load — expected (unauthenticated request to API).

---

## Bug Summary

| #   | Severity | Description                                                                                                | Evidence                                                                   |
| --- | -------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| B1  | Low      | React `forwardRef` warning on `AppSidebarItem` — all 3 pages                                               | Console: "Function components cannot be given refs at AppSidebarItem"      |
| B2  | Low      | `<button>` inside `<button>` DOM nesting violation in sidebar                                              | Console: `validateDOMNesting` warning                                      |
| B3  | Low      | MobX state update during render in workspace layout                                                        | Console: "Cannot update a component while rendering a different component" |
| B4  | Medium   | Analytics tab shows "No time logs found" (empty state) instead of analytics UI when no data — UX ambiguity | Screenshot: `/tmp/plane-time-tracking-test/08-analytics-loggedin.png`      |
| B5  | Low      | "Time Tracking" hidden behind "More" in sidebar — discoverability concern                                  | DOM analysis: link only visible after expanding "More"                     |

---

## Screenshots

| Page                           | Path                                                      |
| ------------------------------ | --------------------------------------------------------- |
| Login page                     | `/tmp/plane-time-tracking-test/01-login.png`              |
| After login (workspace home)   | `/tmp/plane-time-tracking-test/03-after-login.png`        |
| Workspace home                 | `/tmp/plane-time-tracking-test/04-workspace.png`          |
| My Timesheet                   | `/tmp/plane-time-tracking-test/05-my-timesheet.png`       |
| Analytics (wrong session)      | `/tmp/plane-time-tracking-test/06-analytics.png`          |
| Capacity                       | `/tmp/plane-time-tracking-test/07-capacity.png`           |
| Analytics (logged-in, correct) | `/tmp/plane-time-tracking-test/08-analytics-loggedin.png` |
| Sidebar (More collapsed)       | `/tmp/plane-time-tracking-test/09-workspace-sidebar.png`  |

---

## Unresolved Questions

1. **Analytics empty state:** Is "No time logs found for this week." the intended behavior for the `Team/Project Analytics` tab when no work logs exist? Or should it show a different empty-state UI distinct from My Timesheet?
2. **Sidebar pinning:** Should "Time Tracking" be a top-level sidebar item (always visible) rather than hidden under "More"? Depends on product priority/UX decision.
3. **Analytics data population:** The analytics tab needs actual time log data to test chart rendering — current workspace has 0 logged hours.
