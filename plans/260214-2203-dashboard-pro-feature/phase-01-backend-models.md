# Phase 1: Backend Models & Migrations

## Context Links

- **Parent Plan**: [plan.md](./plan.md)
- **Research Reports**:
  - [Backend Patterns](./research/researcher-01-backend-patterns.md)
  - [Brainstorm](../reports/brainstorm-260214-2203-dashboard-pro-feature.md)
- **Codebase Docs**: [Code Standards](../../docs/code-standards.md)

## Overview

**Date**: 2026-02-14
**Priority**: P1 (Critical - foundation for all other phases)
**Status**: Completed
**Estimated Effort**: 3 hours

Create Django models for Dashboard and DashboardWidget with proper relationships, constraints, and admin registration.

## Key Insights

1. **BaseModel Pattern**: Use `WorkspaceBaseModel` for automatic workspace FK and soft delete support
2. **JSONField**: Store flexible config data (layout, filters, style) in JSONField
3. **Unique Constraints**: Apply unique constraints with soft delete condition
4. **TextChoices**: Use for widget type enums
5. **Sort Order**: Use FloatField (default 65535) for flexible ordering

## Requirements

### Functional Requirements

1. Dashboard model stores workspace-scoped dashboard metadata
2. DashboardWidget model stores widget configuration with FK to Dashboard
3. Support soft delete on both models
4. Widget types: bar, line, area, donut, pie, number
5. Widget config stores: x_axis, y_axis, filters, color preset, style options
6. Position tracking: row, col, width, height for grid layout

### Non-Functional Requirements

1. Database migration must be reversible
2. Models registered in Django admin for debugging
3. Type-safe field choices using TextChoices
4. Proper indexing on frequently queried fields
5. Cascade delete: widgets deleted when dashboard deleted

## Architecture

### Model Relationships

```
Workspace (existing)
    ↓ (1:N)
Dashboard
    ↓ (1:N)
DashboardWidget
    ↓ (N:M implied via config)
Project (existing) - stored as project IDs in Dashboard config
```

### Data Flow

1. Dashboard created → auto-populate workspace from context
2. DashboardWidget created → validate dashboard FK exists
3. Widget config → JSON schema: `{x_axis, y_axis, filters, colors, style, display}`
4. Position data → JSON schema: `{row, col, width, height}`

## Related Code Files

### Files to Create

1. **`apps/api/plane/db/models/dashboard.py`**
   - Dashboard model class
   - DashboardWidget model class
   - TextChoices for widget types

2. **`apps/api/plane/db/migrations/0XXX_dashboard_models.py`**
   - Auto-generated migration file
   - Add Dashboard table
   - Add DashboardWidget table
   - Add indexes and constraints

### Files to Modify

1. **`apps/api/plane/db/models/__init__.py`**
   - Import and export Dashboard
   - Import and export DashboardWidget

2. **`apps/api/plane/admin.py`** (or relevant admin file)
   - Register Dashboard admin
   - Register DashboardWidget admin

## Implementation Steps

### Step 1: Create Dashboard Model

**File**: `apps/api/plane/db/models/dashboard.py`

```python
from django.db import models
from django.conf import settings
from plane.db.models import WorkspaceBaseModel, BaseModel


class Dashboard(WorkspaceBaseModel):
    """
    Pro feature dashboard for workspace analytics

    Stores dashboard metadata and project scoping.
    Supports multiple dashboards per workspace.
    """

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    logo_props = models.JSONField(default=dict)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_dashboards"
    )
    is_default = models.BooleanField(default=False)
    sort_order = models.FloatField(default=65535)

    # Project scoping - store project IDs in JSONField for flexibility
    config = models.JSONField(
        default=dict,
        help_text="Dashboard config: {project_ids: [], layout: {}, filters: {}}"
    )

    class Meta:
        db_table = "dashboards"
        verbose_name = "Dashboard"
        verbose_name_plural = "Dashboards"
        ordering = ("sort_order", "-created_at")
        unique_together = [["workspace", "name", "deleted_at"]]
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="dashboard_unique_workspace_name_when_not_deleted",
            )
        ]
        indexes = [
            models.Index(fields=["workspace", "deleted_at"]),
            models.Index(fields=["owner", "deleted_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.workspace.name} - {self.name}"
```

### Step 2: Create DashboardWidget Model

**File**: `apps/api/plane/db/models/dashboard.py` (continued)

```python
class DashboardWidget(BaseModel):
    """
    Widget configuration for dashboard

    Stores widget type, chart configuration, positioning, and styling.
    """

    class WidgetType(models.TextChoices):
        BAR = "bar", "Bar Chart"
        LINE = "line", "Line Chart"
        AREA = "area", "Area Chart"
        DONUT = "donut", "Donut Chart"
        PIE = "pie", "Pie Chart"
        NUMBER = "number", "Number Widget"

    dashboard = models.ForeignKey(
        "db.Dashboard",
        on_delete=models.CASCADE,
        related_name="widgets"
    )
    widget_type = models.CharField(
        max_length=50,
        choices=WidgetType.choices,
        default=WidgetType.BAR
    )
    title = models.CharField(max_length=255, blank=True)

    # Chart configuration
    chart_property = models.CharField(
        max_length=100,
        help_text="X-axis property: priority, state, assignee, labels, etc."
    )
    chart_metric = models.CharField(
        max_length=100,
        default="count",
        help_text="Y-axis metric: count, estimate_points"
    )

    # Widget config: colors, style, display options
    config = models.JSONField(
        default=dict,
        help_text="Widget config: {color_preset, fill_opacity, show_border, smoothing, show_legend, show_tooltip, center_value, show_markers, filters}"
    )

    # Grid positioning
    position = models.JSONField(
        default=dict,
        help_text="Grid position: {row, col, width, height}"
    )

    sort_order = models.FloatField(default=65535)

    class Meta:
        db_table = "dashboard_widgets"
        verbose_name = "Dashboard Widget"
        verbose_name_plural = "Dashboard Widgets"
        ordering = ("sort_order", "-created_at")
        indexes = [
            models.Index(fields=["dashboard", "deleted_at"]),
            models.Index(fields=["widget_type"]),
        ]

    def __str__(self) -> str:
        return f"{self.dashboard.name} - {self.get_widget_type_display()}"
```

### Step 3: Update Model Exports

**File**: `apps/api/plane/db/models/__init__.py`

Add to existing exports:
```python
from .dashboard import Dashboard, DashboardWidget
```

### Step 4: Register in Admin

**File**: `apps/api/plane/admin.py` (or create dashboard admin file)

```python
from django.contrib import admin
from plane.db.models import Dashboard, DashboardWidget


@admin.register(Dashboard)
class DashboardAdmin(admin.ModelAdmin):
    list_display = ["name", "workspace", "owner", "is_default", "created_at"]
    list_filter = ["workspace", "is_default", "created_at"]
    search_fields = ["name", "description", "workspace__name"]
    readonly_fields = ["id", "created_at", "updated_at"]
    ordering = ["-created_at"]


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = ["title", "dashboard", "widget_type", "chart_property", "created_at"]
    list_filter = ["widget_type", "created_at"]
    search_fields = ["title", "dashboard__name"]
    readonly_fields = ["id", "created_at", "updated_at"]
    ordering = ["dashboard", "sort_order"]
```

### Step 5: Generate Migration

```bash
cd apps/api
python manage.py makemigrations --name dashboard_models
python manage.py migrate
```

### Step 6: Verify Migration

```bash
# Check migration was created
ls plane/db/migrations/ | grep dashboard

# Test migration is reversible
python manage.py migrate plane <previous_migration_number>
python manage.py migrate plane

# Verify tables in database
python manage.py dbshell
\dt dashboards
\dt dashboard_widgets
\d dashboards
\d dashboard_widgets
```

## Todo List

- [ ] Create `apps/api/plane/db/models/dashboard.py` with Dashboard model
- [ ] Add DashboardWidget model to same file
- [ ] Update `apps/api/plane/db/models/__init__.py` exports
- [ ] Register models in Django admin
- [ ] Generate migration file
- [ ] Run migration
- [ ] Test migration is reversible
- [ ] Verify tables created in database
- [ ] Check indexes and constraints applied
- [ ] Test soft delete behavior

## Success Criteria

1. ✅ Dashboard model created with all required fields
2. ✅ DashboardWidget model created with all required fields
3. ✅ Migration file generated and applied successfully
4. ✅ Tables exist in database with correct schema
5. ✅ Unique constraints enforce workspace+name uniqueness (when not deleted)
6. ✅ Cascade delete works (deleting dashboard deletes widgets)
7. ✅ Soft delete works on both models
8. ✅ Models appear in Django admin
9. ✅ Indexes created on frequently queried fields
10. ✅ Migration is reversible without data loss

## Risk Assessment

**Risk**: Migration conflicts with existing migrations
- **Mitigation**: Review latest migration number before generating, resolve conflicts manually

**Risk**: JSONField schema not validated
- **Mitigation**: Add validation in serializer layer (Phase 2)

**Risk**: Workspace FK not auto-populated
- **Mitigation**: WorkspaceBaseModel handles this via save() override

**Risk**: Performance on large widget queries
- **Mitigation**: Indexes on dashboard FK and widget_type

## Security Considerations

1. **Workspace Isolation**: WorkspaceBaseModel ensures workspace FK always set
2. **Owner Tracking**: Dashboard tracks owner for audit trail (shared editing model - any ADMIN/MEMBER can edit) <!-- Updated: Validation Session 1 - Shared ownership confirmed -->
3. **Soft Delete**: Deleted dashboards remain in DB for audit trail
4. **Unique Constraints**: Prevent duplicate dashboard names in workspace

## Next Steps

Proceed to [Phase 2: Backend API Endpoints](./phase-02-backend-api.md)
- Create serializers for Dashboard and DashboardWidget
- Implement ViewSets for CRUD operations
- Add widget data endpoint using `build_analytics_chart()`
