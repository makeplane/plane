# Plane.so Dashboard Feature - Business Requirements Document (BRD)

## 1. Executive Summary

This document outlines the business and technical requirements for implementing the "Dashboard" feature natively within the open-source Plane.so Community Edition (CE) environment, modeled after the Plane Pro version.

## 2. Objectives

- Provide users the ability to create, edit, and view personalized dashboards containing data visualization widgets.
- Scope dashboards to multiple specific projects within a workspace.
- Support 6 widget types: Bar, Line, Area, Donut, Pie, and Number (metric).
- Establish the backend structure using PostgreSQL and Django, ensuring isolation between workspaces.

## 3. Key Use Cases

- A user creates a custom dashboard and selects specific projects as the data source.
- A user adds multiple widgets to their dashboard, configuring specific X-axis properties (e.g., State, Assignee, Priority) and Y-axis metrics (e.g., Work item count, Estimate points).
- A user edits widget configurations (colors, legends, tooltips) which autosave.
- A user renames the dashboard or deletes existing widgets.
- Any Workspace Admin or Member can view and edit the shared dashboards in the workspace.

## 4. UI/UX Requirements

- **Dashboard List View:** A route displaying all created dashboards for management.
- **Grid Layout:** A free-form coordinate-based layout system (using x, y, width, height properties saved on the widget) allowing arbitrary placement and resizing of widgets.
- **Add Widget Modal:** A configuration panel enabling chart type selection, property mappings, visual customizations, and multi-dimensional split via 'group_by'.
- **Design System:** Strict adherence to Plane's design guidelines, utilizing `@plane/propel` components and semantic color tokens (`bg-surface-1`, `text-color-primary`, etc.) to support light/dark modes seamlessly without manual `dark:` classes.

## 5. Non-Functional Requirements

- **API Versioning:** All endpoints should be built under the external API version (`v1` mapped at `plane/api/`) instead of the legacy `v0` internal one.
- **Performance:** Ensure independent/parallel data fetches per widget to avoid single slow widgets blocking the entire dashboard render.
- **Security:** Standard workspace-level role enforcement via `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")`. Prevent arbitrary ORM lookups by whitelisting valid filter keys.
