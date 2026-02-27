---
status: COMPLETE
---

# Phase 2: Backend API Specifications

## Overview

<!-- Updated: Validation Session 1 - Switched from external API (plane/api/ v1) to internal API (plane/app/) with session auth -->

All new API endpoints will be implemented under the internal API layer (`plane/app/` folder structure) using session-based authentication. This matches existing web app patterns (Issues, Cycles, Modules). No `@extend_schema` decorators needed. Use `@allow_permission` for role-based access control.

**Access control for list endpoint:** Filter dashboards by `Q(created_by=request.user) | Q(access=1)` to support private-by-default + workspace-shared dashboards.

## Base URL

`/api/workspaces/<str:slug>/dashboards/`

## Endpoints

### 1. List & Create Dashboards

- **GET** `/`
  - **Description:** Fetch all dashboards in the workspace.
  - **Permissions:** `ROLE.ADMIN`, `ROLE.MEMBER` level="WORKSPACE"
  - **Response:** `200 OK` (Array of Dashboard serializers)
- **POST** `/`
  - **Payload:** `{"name": "string", "project_ids": ["uuid"]}`
  - **Response:** `201 Created`
  - **Example Response:**
    ```json
    {
      "id": "c7d1cac8-...",
      "name": "My New Dashboard",
      "project_ids": ["7f6f693e-..."],
      "filters": {},
      "logo_props": {},
      "access": 1,
      "is_favorite": false,
      "workspace": "b1b1831b-..."
    }
    ```

### 2. Retrieve, Update, Delete Dashboard

- **GET** `/<uuid:dashboard_id>/`
  - **Response:** `200 OK`
- **PATCH** `/<uuid:dashboard_id>/`
  - **Payload:** Partial updates (e.g., `name`)
  - **Response:** `200 OK`
- **DELETE** `/<uuid:dashboard_id>/`
  - **Response:** `204 No Content`

### 3. Manage Widgets

- **GET** `/<uuid:dashboard_id>/widgets/`
  - **Response:** List of widgets configured for the dashboard.
- **POST** `/<uuid:dashboard_id>/widgets/`
  - **Payload:** Exact UI structure
    ```json
    {
      "name": "New widget",
      "chart_type": "LINE_CHART",
      "chart_model": "BASIC",
      "x_axis_coord": 0,
      "y_axis_coord": 0,
      "width": 2,
      "height": 2,
      "config": {
        "line_type": "solid",
        "show_legends": true,
        "show_tooltip": true,
        "line_color": "#049bdc"
      }
    }
    ```
  - **Response:** `201 Created`
- **PATCH** `/<uuid:dashboard_id>/widgets/<uuid:widget_id>/`
  - **Payload:** Configuration updates. Example for full config edit:
    ```json
    {
      "name": "Work item count",
      "chart_type": "BAR_CHART",
      "chart_model": "GROUPED",
      "x_axis_property": "STATES",
      "y_axis_metric": "WORK_ITEM_COUNT",
      "group_by": "PRIORITY",
      "filters": { "priority": ["urgent"] },
      "config": { "orientation": "vertical", "color_scheme": "earthen" }
    }
    ```
  - **Response:** `200 OK`
- **DELETE** `/<uuid:dashboard_id>/widgets/<uuid:widget_id>/`
  - **Response:** `204 No Content`

### 4. Fetch Widget Chart Data

- **GET** `/<uuid:dashboard_id>/widgets/<uuid:widget_id>/charts/`
  - **Description:** Calculates and returns the chart aggregation data based on the widget's config and dashboard's global project scoping.
  - **Security Check:** Validate that `x_axis_property` and JSON filters are strictly checked against a whitelist of `ALLOWED_WIDGET_FILTER_KEYS` to prevent arbitrary ORM injection.
  - **Response payload format:**
    ```json
    {
      "data": [{ "key": "3011dd13-...", "name": "Done", "count": 1 }],
      "schema": {}
    }
    ```
