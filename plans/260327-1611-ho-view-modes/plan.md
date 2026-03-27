---
title: "HO Tab - View Mode Tabs (Department / Datasheet / Category)"
description: "Add view-mode switching tabs to HO tab: Department (default), Datasheet (cross-workspace spreadsheet, read-only, sortable), Category (aggregated summary table)."
status: complete
priority: P1
effort: 5d
branch: ngoc-feat/workspaces-default-view
tags: [feature, frontend, backend, api]
created: 2026-03-27
---

# HO Tab — View Mode Tabs

## Overview

Add three view modes to the HO tab: **Department** (current default), **Datasheet** (cross-workspace spreadsheet with all 19 columns, read-only, sortable, with display properties), and **Category** (aggregated summary: Department + Team/Project + Main/Sub Task Category + Work Item count).

## Phases

| #   | Phase                                | Status   | Effort | Link                                            |
| --- | ------------------------------------ | -------- | ------ | ----------------------------------------------- |
| 1   | HO Header — View Tab Navigation      | Complete | 0.5d   | [phase-01](./phase-01-ho-header-tabs.md)        |
| 2   | Backend — Cross-Workspace Issues API | Complete | 1d     | [phase-02](./phase-02-backend-ho-issues-api.md) |
| 3   | Frontend Store & Service             | Complete | 0.5d   | [phase-03](./phase-03-ho-store-service.md)      |
| 4   | Datasheet View Component             | Complete | 2d     | [phase-04](./phase-04-ho-datasheet-view.md)     |
| 5   | Category View Component              | Complete | 1d     | [phase-05](./phase-05-ho-category-view.md)      |

## Dependencies

- Phase 1 is independent (UI only, uses local state)
- Phase 2 must complete before Phase 3
- Phase 3 must complete before Phases 4 and 5
- Phases 4 and 5 can run in parallel after Phase 3

## Key Design Decisions

- **Tab state**: URL search param `?view=department|datasheet|category`
- **Data source**: New backend endpoint aggregating issues across all accessible workspaces
- **Read-only**: Datasheet and Category views have no inline editing
- **Grouping**: Data sorted by Department → Team/Project → Main Category → Sub Category
- **Display properties**: Reuse existing `IIssueDisplayProperties` + filter controls for Datasheet
- **Column order (Datasheet)**: department_name, project_name, main_task_category, sub_task_category, [issue title fixed], sub_issue_count, project_lead, assignee, bank_wide_project, priority, state, progress_tracking, modules, cycle, start_date, due_date, completed_date, total_log_time, reference_link
- **Issue title in Datasheet**: Clickable link → `/{workspaceSlug}/projects/{projectId}/issues/{issueId}` (new tab)
- **Access control (backend)**: Use existing DRF permission class — not raw `user.role >= 15` check
- **progress_tracking**: Existing model field on Issue — serialize directly, no computation needed
- **Dept hierarchy traversal**: Python-side (fetch tree, build descendant ID list in Python)

## Validation Log

### Session 1 — 2026-03-27

**Trigger:** Initial plan validation before implementation
**Questions asked:** 5

#### Questions & Answers

1. **[Access Control]** Phase 2 uses `user.role >= 15` as the instance admin threshold. Is this the correct role value for instance admins in your codebase?
   - Options: Yes, role >= 15 | No, different threshold | Use existing permission class
   - **Answer:** Use existing permission class
   - **Rationale:** Raw role checks are fragile — using an existing DRF permission class is safer, more maintainable, and consistent with the rest of the codebase.

2. **[Datasheet UX]** In the Datasheet view, should issue names (Work Items column) be clickable links to the issue detail page, or plain read-only text?
   - Options: Clickable links | Plain read-only text
   - **Answer:** Clickable links
   - **Rationale:** Links to `/{workspaceSlug}/projects/{projectId}/issues/{issueId}` open in a new tab — improves usability, adds no complexity.

3. **[Progress Field]** The `progress_tracking` field is listed in the 19 columns but marked as 'computed' with no defined logic. What is it?
   - Options: Existing model field | Completion % (sub-issues) | Existing label/badge field
   - **Answer:** Existing model field
   - **Rationale:** Serialize directly from the Issue model — no custom computation needed, simplifies backend serializer.

4. **[Dept Hierarchy]** For the department hierarchy traversal (finding all descendant departments), which approach should we use?
   - Options: Python-side traversal | Recursive CTE in SQL | Reuse existing helper
   - **Answer:** Python-side traversal
   - **Rationale:** Simpler to implement; optimize with CTE later only if performance is a concern.

5. **[Phase 5 Scope]** Phase 5 (Category View) is marked P2 and estimated 1d. Should it be included in this sprint or deferred?
   - Options: Include in this sprint | Defer Phase 5
   - **Answer:** Include in this sprint
   - **Rationale:** Plan is complete as-is; all 5 phases implemented together.

#### Confirmed Decisions

- Access control: use existing DRF permission class — not raw role threshold
- Datasheet issue title: clickable link (new tab) to issue detail
- progress_tracking: existing model field, serialize directly
- Dept hierarchy: Python-side traversal
- Phase 5: included in this sprint

#### Action Items

- [ ] Phase 2: replace `user.role >= 15` check with existing DRF permission class (identify correct class in codebase before implementing)
- [ ] Phase 2: `progress_tracking` — confirm field name on Issue model (`progress_tracking`?) and include in serializer
- [ ] Phase 4: issue `name` column renders as `<a href=...>` link opening in new tab

#### Impact on Phases

- Phase 2: Use existing DRF permission class; serialize `progress_tracking` as direct field
- Phase 4: Issue title cell is a clickable link, not plain text

### Session 2 — 2026-03-27

**Trigger:** New requirement — add from_date / to_date date range filters to Datasheet and Category views
**Questions asked:** 4

#### Questions & Answers

1. **[Date Field]** Filter from_date / to_date áp dụng lên trường date nào của issue?
   - Options: due_date | start_date | created_at | Nhiều trường — user chọn
   - **Answer:** Overlap logic — start_date <= to_date AND due_date >= from_date
   - **Custom input:** "chỉ cần start_date và due_date giao nhau với from_date / to_date là đủ điều kiện, tức là đang cần biết trong ngày ai đang làm việc gì"
   - **Rationale:** Filter shows issues that are "active" during the selected range — overlap between [start_date, due_date] and [from_date, to_date]. Not a single-field filter.

2. **[Default Range]** Default 'today' nghĩa là gì?
   - Options: from=today, to=today | from=đầu tháng, to=today | from=đầu năm, to=today | Không filter mặc định
   - **Answer:** from=today, to=today
   - **Rationale:** Default shows issues active on today — answers "who is working on what today". Both pickers default to today on mount.

3. **[Filter Side — Datasheet]** Filter date ở Datasheet: backend hay frontend?
   - Options: Backend (Recommended) | Client-side
   - **Answer:** Backend (Recommended)
   - **Rationale:** Datasheet is paginated — client-side filtering would miss issues on other pages. Must send from_date/to_date as query params to /api/ho/issues/.

4. **[Category Filter]** Ở Category view, filter date ảnh hưởng đến work_item_count như thế nào?
   - Options: Backend re-aggregate (Recommended) | Client-side ẩn rows
   - **Answer:** Backend re-aggregate (Recommended)
   - **Rationale:** Send from_date/to_date to /api/ho/category-summary/, backend re-counts issues matching the overlap condition. Counts are accurate.

#### Confirmed Decisions

- Date filter logic: overlap — `start_date <= to_date AND due_date >= from_date`
- Default: from_date=today, to_date=today (both pickers default to today on mount)
- Datasheet: backend filtering via `from_date` / `to_date` query params
- Category: backend re-aggregate with same params

#### Action Items

- [ ] Phase 2: both endpoints accept `from_date` / `to_date` query params; filter using overlap condition
- [ ] Phase 3: store adds `fromDate` / `toDate` observables (default today); `setDateRange()` action; pass to both service methods
- [ ] Phase 4: toolbar adds two date pickers (From / To), default today; on change → `hoIssueStore.setDateRange()` → re-fetch
- [ ] Phase 5: root component adds two date pickers (From / To), default today; on change → `hoIssueStore.setDateRange()` → re-fetch category summary

#### Impact on Phases

- Phase 2: Both endpoints filter with overlap condition on start_date / due_date
- Phase 3: Store needs fromDate/toDate state and setDateRange() action
- Phase 4: Toolbar needs date range picker UI
- Phase 5: Root needs date range picker UI

### Session 3 — 2026-03-27

**Trigger:** Pre-implementation clarification — pagination style, date picker component, shared state, fetch trigger
**Questions asked:** 4

#### Questions & Answers

1. **[Pagination]** Phase 2: Which pagination style should the /api/ho/issues/ endpoint use?
   - Options: Page-number | Cursor-based
   - **Answer:** Page-number
   - **Rationale:** DRF `PageNumberPagination` with `?page=&page_size=100` — simple, standard, easy to implement. Sufficient for HO use case.

2. **[Date Picker]** Phase 4 & 5: Which date picker component should be used for From/To date inputs?
   - Options: Existing Plane DatePicker | Native HTML `<input type="date">`
   - **Answer:** Existing Plane DatePicker
   - **Rationale:** Consistent with Plane design system — reuse the existing DatePicker component used on issue detail pages.

3. **[Date Range State]** Phase 4 & 5: Should date range persist when switching between Datasheet and Category tabs?
   - Options: Shared store state | Independent per view
   - **Answer:** Shared store state
   - **Rationale:** Both views read/write `hoIssueStore.fromDate` / `toDate`. Switching tabs preserves the selected range — better UX, no duplication.

4. **[Fetch Trigger]** Phase 4: Should re-fetch be debounced or immediate on date picker change?
   - Options: Immediate on change | Debounced 500ms | On explicit Apply button
   - **Answer:** Immediate on change
   - **Rationale:** Simple — no debounce logic. User completes both pickers manually; each change fires `setDateRange()` → re-fetch immediately.

#### Confirmed Decisions

- Pagination: `PageNumberPagination` (`?page=1&page_size=100`)
- Date picker: Existing Plane `DatePicker` component (not native input)
- Date range: Shared store state — `hoIssueStore.fromDate`/`toDate` persists across tab switches
- Fetch trigger: Immediate on `DatePicker` change — no debounce, no Apply button

#### Action Items

- [ ] Phase 2: use `PageNumberPagination` with `page_size=100`
- [ ] Phase 4: use Plane `DatePicker` component in toolbar; immediate `setDateRange()` on change
- [ ] Phase 5: use Plane `DatePicker` component; reads shared store date state

#### Impact on Phases

- Phase 2: Use `PageNumberPagination` (not cursor)
- Phase 4: Toolbar date pickers → Plane `DatePicker`, immediate re-fetch on change
- Phase 5: Root date pickers → Plane `DatePicker`, reads shared `hoIssueStore` state
