---
status: COMPLETE
---

# Phase 5: Dashboard i18n String Labels

## Overview

Below is the definitive list of exact UI strings displayed in the Plane Pro Dashboard interface. These exact English strings must be populated throughout the `@plane/i18n` matrix (`en.json`, `vi.json`, `ko.json`, etc.) to ensure 100% parity with the cloud variant.

### 1. Dashboard Management (Modal & List)

- **Modal Title:** `Create new dashboard`
- **Name Input Label:** `Name your dashboard.`
- **Name Placeholder:** Randomly displays: `Capacity across projects`, `Workload by team`, `State across all projects`.
- **Project Dropdown Label:** `Choose projects`
- **Project Description:** `Data from these projects will power this dashboard.`
- **Action Buttons:** `Cancel`, `Create dashboard`, `Update dashboard`, `Delete`
- **Dashboard Menu Actions:** `Edit`, `Delete`
- **Empty State (List):** `No dashboards found.` / `Create a dashboard to track your team's progress.`

### 2. Widget Configuration Sidebar

- **Add Widget Button:** `Add widget`
- **Widget Title Input:** `Name this widget`
- **Chart Selection Label:** `Widget type`
- **Layout Config Buttons:** `Cancel`, `Save`
- **X-axis:** `X-axis`
- **Y-axis:** `Y-axis`
- **Grouping:** `Group by` / `Stack by`
- **Property Button:** `Add property`
- **Metric Button:** `Add metric`
- **Filter System:** `Filters`, `Add filter`

### 3. Widget Operations & Context Menu

Strings visible upon expanding the ellipsis `...` menu on a grid-mounted Widget.

- **Edit:** `Edit`
- **Open internally:** `Open in new tab`
- **URL Copy:** `Copy link`
- **Delete Action:** `Delete`
- **Delete Warning Modal:** `Are you sure you want to delete this widget?`
- **Success Toast:** `Link copied to clipboard`

### 4. Chart Types & Variants

- **Bar:** `Bar`, `Basic bar`, `Stacked bar`, `Horizontal bar`
- **Line:** `Line`, `Basic line`, `Multi-line`
- **Area:** `Area`, `Basic area`, `Stacked area`
- **Donut:** `Donut`, `Basic donut`, `Progress donut`
- **Pie:** `Pie`, `Basic pie`
- **Text Element:** `Number`

### 5. Metrics & Properties

- **Metrics (Y-axis):** `Work item count`, `Estimate`
- **Number Widget Specific Metrics:** `Work item count`, `Pending work items`, `Completed work items`, `In progress work items`, `Blocked work items`, `Work items due this week`, `Work items due today`.
- **Properties (X-axis, Group by):** `State`, `State group`, `Label`, `Assignee`, `Estimate`, `Cycle`, `Module`, `Priority`, `Work item Types`, `Project`, `Start date`, `Due date`, `Created at`, `Completed at`, `Created by`, `Epics`.

### 6. Styles & Configuration

- **Colors:** `Bar color`, `Line color`, `Area color`, `Completed color`, `Color scheme`
- **Line Types:** `Solid`, `Dashed`, `Stepped`
- **Toggles:** `Show legends`, `Show tooltip`, `Smoothing`, `Markers`, `Center value`
- **Text Alignment:** `Text alignment` (Left, Center, Right)
- **Text Theme:** `Text color`

### 7. Empty States & Feedback Messages

- **Missing X-axis:** `The x-axis is missing a value.`
- **Missing Y-axis:** `Metric is missing a value.`
- **Fallback Button:** `Configure widget`
- **No Data Rendering:** `No data available for the selected configuration.`
