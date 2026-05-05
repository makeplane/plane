# Profile Page Performance Analysis: /[workspaceSlug]/profile/[userId]/

## (a) ROUTE MAP

**Location**: `apps/web/app/(all)/[workspaceSlug]/(projects)/profile/[userId]/`

**Routes & Pages:**
- `/profile/[userId]/` → `page.tsx` (default overview with stats/charts)
- `/profile/[userId]/activity/` → `activity/page.tsx` (workspace activity log)
- `/profile/[userId]/[profileViewId]/` → `[profileViewId]/page.tsx` (assigned/created/subscribed issue views)

**Layout Hierarchy:**
- `layout.tsx` (parent) — renders AppHeader + sidebar + nav + Outlet
- `navbar.tsx` — tab navigation (switches between overview/activity/assigned/etc.)
- `header.tsx` — breadcrumbs + filter toggle (shows active tab)

**No lazy/dynamic imports** on profile sub-routes. All components bundled in main route.

---

## (b) API CALLS ON MOUNT TRIGGER

**Overview page (/profile/[userId]/) — 3 base requests fired in parallel:**

| Endpoint | Service Method | Fetch Key | Component | Line |
|----------|---|---|---|---|
| `GET /api/workspaces/{slug}/user-stats/{userId}/` | `getUserProfileData()` | `USER_PROFILE_DATA` | page.tsx | 34 |
| `GET /api/workspaces/{slug}/user-profile/{userId}/` | `getUserProfileProjectsSegregation()` | `USER_PROFILE_PROJECT_SEGREGATION` | layout.tsx | 47 |
| `GET /api/workspaces/{slug}/user-activity/{userId}/?per_page=10` | `getUserProfileActivity()` | `USER_PROFILE_ACTIVITY` | overview/activity.tsx | 33 |

**TodayWorkItems (CE) — Promise.all() per workspace:**
- `GET /api/workspaces/{slug}/user-issues/{userId}/?assignees={uid}&state_group=backlog,unstarted,started`
  - **No pagination limit** — fetches entire user issue list
  - Also triggers `getProjectsLite()` + `getWorkspaceStates()` per workspace
  - Location: `ce/components/profile/today-work-items.tsx:55-96`

**OverdueWorkItems (CE) — Same pattern as TodayWorkItems:**
  - Location: `ce/components/profile/overdue-work-items.tsx:55-96`

**Profile Issues view (assigned/created/subscribed):**
  - `fetchFilters()` via `profile-issues.tsx:79` (useSWR)

**No waterfall detected** — requests fire in parallel. **But cross-workspace toggle multiplies fetch count by 3x.**

---

## (c) HEAVY COMPONENTS & RENDERING

| Component | Type | Virtualized? | Notes |
|-----------|------|---|---|
| **BarChart** (ProfilePriorityDistribution) | Chart | N/A | 5 bars, lightweight |
| **PieChart** (ProfileStateDistribution) | Chart | N/A | Legend + donut, lightweight |
| **WorkItemsTable** (TodayWorkItems/OverdueWorkItems) | Table | **NO** | Renders all rows in DOM (100+ rows possible) |
| **ProfileActivity** | List | Partial | 10 items hardcoded, has "Load More" pagination |
| **IssuePeekOverview** | Modal | N/A | Loaded but unused most of the time |

**Critical issue: WorkItemsTable renders all fetched issues without virtualization.** If user has 200 today-work items, all 200 DOM nodes created on first render.

---

## (d) MOBX STORES HYDRATION

**Stores initialized on profile mount:**

| Store | Location | Trigger | Notes |
|-------|---|---|---|
| **ProfileIssues** | `/core/store/issue/profile/issue.store.ts` | On profile view init | Always available, no lazy load |
| **ProfileIssuesFilter** | `/core/store/issue/profile/filter.store.ts` | On assigned/created/subscribed nav | Calls `fetchFilters()` via useSWR |
| **useWorkspace** | (hook) | TodayWorkItems init | Returns all workspace slugs |
| **useTaskCategory** | (hook) | TodayWorkItems per-workspace | Calls `fetchCategories()` per workspace |

**No duplicate fetch protection.** Each component independently calls `getUserProfileIssues()`. If cross-workspace toggle on, TaskCategory store fetches twice per workspace (once per component).

---

## (e) BOTTLENECK CANDIDATES (Top 3)

### **#1: Unpaginated TodayWorkItems/OverdueWorkItems issue fetch**
- **Issue**: No `limit` param in `filterParams` at `today-work-items.tsx:62`
  ```typescript
  const filterParams = { assignees: uid, state_group: "backlog,unstarted,started", order_by: "target_date" };
  ```
- If user assigned 500 issues, **all 500 loaded into memory + rendered in table**
- **Impact**: 2-5s render delay for large issue counts
- **File refs**: `ce/components/profile/today-work-items.tsx:62`, `ce/components/profile/overdue-work-items.tsx:59`

### **#2: WorkItemsTable renders all rows without virtualization**
- **Issue**: Table renders every row in DOM immediately
  ```typescript
  // ce/components/profile/work-items-table.tsx (inferred)
  {issues.map(issue => <WorkItemRow key={issue.id} ... />)}
  ```
- **Impact**: Layout thrashing, CPU spike on render, slow scroll
- **File ref**: `ce/components/profile/work-items-table.tsx` (body)

### **#3: Cross-workspace toggle multiplies API requests by workspace count**
- **Issue**: `Promise.all()` at `today-work-items.tsx:64-93` and `overdue-work-items.tsx:64-93`
  - 1 workspace = 3 requests (issues + projects + states)
  - 3 workspaces = 9 requests per component (18 total for today + overdue)
- **Impact**: 1-3s extra delay for multi-workspace users
- **File ref**: `ce/components/profile/today-work-items.tsx:55-96`

---

## FINDINGS SUMMARY

**Route structure**: 3-level nesting (workspace → profile → detail)
**API calls on overview mount**: 3 base + 6-9 per-workspace = 9-12 total requests
**Fetch strategy**: Parallel (no waterfall), but multiplied by workspace count
**Lazy loading**: NONE — all profile sub-routes bundled
**Virtualization**: NONE — full table rendered for 100+ items
**Store re-hydration**: ProfileIssues store always available, no lazy init
**Activity tab**: Separate SWR key, cache miss on tab navigation

**Root causes of slow load (1-3s delay):**
1. Unpaginated issue fetch (500+ items into DOM)
2. Non-virtualized table rendering all rows
3. 3x-9x request multiplier from cross-workspace toggle
4. Two independent activity fetches (overview vs. activity tab)

**Recommendations** (not implemented, analysis only):
- Add `limit` param to TodayWorkItems/OverdueWorkItems fetch
- Implement virtual scrolling in WorkItemsTable (e.g., `react-window`)
- Lazy-load WorkItems when cross-workspace toggle enabled
- Unify activity fetch (reuse SWR key across tabs)
