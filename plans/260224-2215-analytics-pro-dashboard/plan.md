# Phase 09: Analytics Pro Dashboard Implementation

## Overview
Replicate the Plane Pro Analytics Dashboard in the SHBVN Community Edition. The dashboard provides deep insights into Workspace and Project performance across 7 distinct tabs.

## 1. UI Breakdown & Requirements

Based on visual analysis of the Pro version:

### Tabs
1. **Overview**
   - Metrics: Total Users/Admins/Members/Guests, Total Projects, Work items, Cycles, Intake.
   - Project Insights Radar Chart (Work Items, Cycles, Modules, Intake, Members, Pages, Views).
   - Sidebar list of active projects with activity percentage badges.
2. **Projects**
   - Metrics: Total Projects, On-Track, Off-Track, At Risk.
   - Chart: Projects by Status (Donut/Bar).
   - Table: Project Name, Members, Epics, Work items, Cycles, Modules, Pages, Views, Intake.
3. **Users**
   - Metrics: Total Users/Admins/Members/Guests.
   - Chart: Work items resolved vs pending (Stacked Bar, separated by User).
   - Table: Member Name, Started, Unstarted, Completed.
4. **Work items**
   - Metrics: Total, Started, Backlog, Unstarted, Completed.
   - Chart 1: Created vs Resolved (Area Line Chart).
   - Chart 2: Customized Insights (Dynamic Bar Chart with filters for Group By, Priority).
5. **Cycles**
   - Metrics: Total, Current, Upcoming, Completed.
   - Chart: Cycle Progress (Lollipop Chart: % completion per cycle).
   - Table: Cycle Name, Lead, Project, Start/End date, Completion %.
6. **Modules**
   - Metrics: Total, Completed, In progress, Planned, Paused.
   - Chart: Module Progress (Lollipop Chart).
   - Table: Module Name, Lead, Project, Start/End date, Completion %.
7. **Intake**
   - Metrics: Total Intake, Accepted, Declined, Duplicate.
   - Chart: Intake Trends (Line Chart: Accepted vs Declined over time).
   - Table: Project, Total Work items, Accepted, Declined, Duplicate.

## 2. API & Data Strategy

- **Backend Ready**: The OSS Django backend already has `AdvanceAnalyticsEndpoint`, `AdvanceAnalyticsStatsEndpoint`, and `AdvanceAnalyticsChartEndpoint` in `plane/app/views/analytic/advance.py`. 
- **Missing Tabs**: The OSS implementation currently only explicitly handles `overview` and `work-items`. Network analysis confirms the Pro version uses these exact same endpoints but with extra `tab` and `type` queries (`projects`, `users`, `cycles`, `modules`, `intake`).
    - `.../advance-analytics/?tab=cycles` ➔ returns metric cards count (`total_cycles`, `current_cycles`, etc.)
    - `.../advance-analytics-stats/?type=cycles` ➔ returns data for the table list.
    - `.../advance-analytics-charts/?type=cycles` ➔ returns data for the progress chart.
- **Action**: We will extend the Python views in `advance.py` to support these missing `tab`/`type` conditions and calculate the metrics using Django ORM annotations.
- **Filters**: The `project_ids` filter (the "All projects" dropdown) is natively parsed by `get_analytics_filters` and applied to `self.filters["base_filters"]`, so filtering will work automatically once we use `self.filters`.

## 3. Frontend Architecture (CE Override)

- **Entry Hook**: Override `ce/components/analytics/use-analytics-tabs.tsx` to return the 7 tabs instead of the default restricted CE tabs.
- **Components**: Create `ce/components/analytics/tabs/` containing a React component for each tab.
- **Charts**: Use the existing charting library (e.g., Recharts) integrated via `@plane/ui` or custom wrappers.
- **Design System**: Strictly adhere to `@plane/propel` and semantic colors (e.g., `var(--color-text-primary)` via tailwind classes like `text-color-primary`).

## 4. Execution Steps
1. Write/extend backend endpoints for any missing Analytics Pro charts.
2. Build the structural layout for the 7 tabs in `use-analytics-tabs.tsx`.
3. Implement reusable Metric Widgets (`analytics-dashboard-widget-card.tsx`).
4. Implement Chart Widgets and Table Lists for each tab.
5. Localize all strings in `en`, `vi`, `ko`.

## 5. Changelog (Development History)

### Analytics Pro Dashboard Implementation
- **Backend Analytics API (`apps/api/plane/app/views/analytic/advance.py`)**: 
  - Extended the `AdvanceAnalyticsStatsEndpoint` to structure JSON dictionaries for all Pro tabs.
  - Returns calculated data models using ORM aggregations for `projects`, `users`, `modules`, `cycles`, and `intake` views.

### Frontend Charts and Tables (`apps/web/core/components/analytics/`)
- Implemented `IntakeInsightTable`, `CyclesInsightTable`, `ModulesInsightTable`, `ProjectsInsightTable`, and `UsersInsightTable` to display statistical lists.
- Implemented BarCharts and customized `TBarItem` to cleanly display statistical trends in the distributions components for all 5 new analytics tabs (`intake-distribution.tsx`, `cycles-distribution.tsx`, etc.).
- Reapplied specific fields mapped directly to the backend representation (`project__name`, `lead__display_name`, `total_issues`, etc.).

### TypeScript Type-Safety (`packages/types/src/analytics.ts`)
- Defined precise data schemas for all analytics responses: 
  - `IntakeInsightColumns`
  - `CycleInsightColumns`
  - `ModuleInsightColumns`
  - `UserInsightColumns`
- Cleaned up the table representations of row fields to eliminate `TypeError: Cannot read properties of undefined` issues that crashed the tables upon rendering. Run checked `pnpm check:types` without warnings for the analytics modules.

### i18n Localization (`packages/i18n/src/locales/`)
- Extracted all usages of `t()` strings dynamically nested inside the frontend components.
- Appended and localized standard analytics strings into all three languages: `en`, `vi`, `ko`.
- Fixed duplicate mapping conflicts (e.g., using explicit static keys like `total_users_count` and `completed_issues_title` instead of parameterised object paths).
- Ensured all missing strings under `workspace_analytics` and `sidebar` configurations for (users, projects, intake, cycles, modules, work_items) display dynamically across the entire Analytics page.
