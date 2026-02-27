---
status: COMPLETE
---

# Phase 1: Database Schema

## Overview

New models will be added to the database to support Dashboards and their associated Widgets. These models must inherit from `BaseModel` (or `ProjectBaseModel`) to ensure proper UUID primary keys, audit fields (`created_by`, `updated_by`), soft delete support, and workspace-level scoping.

## Models

### 1. `Dashboard`

Represents a customizable dashboard within a workspace.

- `id` (UUIDField)
- `workspace` (ForeignKey to `Workspace`)
- `name` (CharField)
- `description` (TextField, optional)
- `projects` (ManyToManyField to `Project`, blank=True) to scope the dashboard data. Provides referential integrity.
- `filters` (JSONField) for any global dashboard-level filters.
- `logo_props` (JSONField) - icon/logo configurations.
- `access` (IntegerField, default=0) - Access level: `0` = Private (creator only), `1` = Workspace Public (all admins/members).
- `archived_at` (DateTimeField, null=True, blank=True)
<!-- Updated: Validation Session 1 - Removed is_favorite (use existing UserFavorite model), changed project_ids to M2M, documented access field semantics -->

### 2. `DashboardWidget`

Represents an individual widget placed on a dashboard.

- `id` (UUIDField)
- `dashboard` (ForeignKey to `Dashboard`, related_name='widgets')
- `name` (CharField)
- `chart_type` (CharField/Choices: `BAR_CHART`, `LINE_CHART`, `AREA_CHART`, `DONUT_CHART`, `PIE_CHART`, `NUMBER`)
- `chart_model` (CharField/Choices: `BASIC`, `GROUPED`)
- `x_axis_property` (CharField, e.g., 'STATES', 'ASSIGNEE', 'LABELS')
- `y_axis_metric` (CharField, e.g., 'WORK_ITEM_COUNT', 'ESTIMATE_POINTS')
- `group_by` (CharField, null=True) - group by dimension for grouped models.
- `config` (JSONField) - stores widget visual configurations (`line_color`, `line_type`, `show_legends`, `show_tooltip`, `show_markers`, `smoothing`, `color_scheme`, `orientation`).
- `filters` (JSONField) - widget-specific data filters.
- `x_axis_coord` (IntegerField) - X position on grid.
- `y_axis_coord` (IntegerField) - Y position on grid.
- `width` (IntegerField) - widget width.
- `height` (IntegerField) - widget height.

## Migration Steps

1. Create the models in `plane/db/models/dashboard.py`.
2. Ensure they are registered in the module's `__init__.py`.
3. Generate migrations: `python manage.py makemigrations`.
4. Run migrations: `python manage.py migrate`.
