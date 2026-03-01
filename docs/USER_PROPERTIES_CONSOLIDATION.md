# User Properties Consolidation

## Overview

The codebase currently has **7 separate tables** for storing user-specific display preferences (filters, display properties, display filters, etc.) across different entities. This document captures the current state and proposes consolidating them into a single unified table using an `entity_type` + `entity_id` polymorphic pattern.

---

## Current State

### 1. ProjectUserProperty

- **File**: `apps/api/plane/db/models/project.py`
- **DB Table**: `project_user_properties`
- **Base Class**: `ProjectBaseModel`
- **Entity FK**: `project` (via ProjectBaseModel)
- **Unique Constraint**: `(user, project)` where `deleted_at IS NULL`
- **Serializer**: `ProjectUserPropertySerializer` (`apps/api/plane/app/serializers/issue.py`)
- **Fields**:

| Field | Type | Default |
|-------|------|---------|
| `user` | FK → User | — |
| `filters` | JSONField | `get_default_filters` |
| `display_filters` | JSONField | `get_default_display_filters` |
| `display_properties` | JSONField | `get_default_display_properties` |
| `rich_filters` | JSONField | `dict` |
| `preferences` | JSONField | `get_default_preferences` |
| `sort_order` | FloatField | `65535` |

---

### 2. WorkspaceUserProperties

- **File**: `apps/api/plane/db/models/workspace.py`
- **DB Table**: `workspace_user_properties`
- **Base Class**: `BaseModel`
- **Entity FK**: `workspace`
- **Unique Constraint**: `(workspace, user)` where `deleted_at IS NULL`
- **Serializer**: `WorkspaceUserPropertiesSerializer` (`apps/api/plane/app/serializers/workspace.py`)
- **Fields**:

| Field | Type | Default |
|-------|------|---------|
| `workspace` | FK → Workspace | — |
| `user` | FK → User | — |
| `filters` | JSONField | `get_default_filters` |
| `display_filters` | JSONField | `get_default_display_filters` |
| `display_properties` | JSONField | `get_default_display_properties` |
| `rich_filters` | JSONField | `dict` |
| `navigation_project_limit` | IntegerField | `10` |
| `navigation_control_preference` | CharField | `"ACCORDION"` |

---

### 3. ModuleUserProperties

- **File**: `apps/api/plane/db/models/module.py`
- **DB Table**: `module_user_properties`
- **Base Class**: `ProjectBaseModel`
- **Entity FK**: `module`
- **Unique Constraint**: `(module, user)` where `deleted_at IS NULL`
- **Serializer**: `ModuleUserPropertiesSerializer` (`apps/api/plane/app/serializers/module.py`)
- **Fields**:

| Field | Type | Default |
|-------|------|---------|
| `module` | FK → Module | — |
| `user` | FK → User | — |
| `filters` | JSONField | `get_default_filters` |
| `display_filters` | JSONField | `get_default_display_filters` |
| `display_properties` | JSONField | `get_default_display_properties` |
| `rich_filters` | JSONField | `dict` |

---

### 4. CycleUserProperties

- **File**: `apps/api/plane/db/models/cycle.py`
- **DB Table**: `cycle_user_properties`
- **Base Class**: `ProjectBaseModel`
- **Entity FK**: `cycle`
- **Unique Constraint**: `(cycle, user)` where `deleted_at IS NULL`
- **Serializer**: `CycleUserPropertiesSerializer` (`apps/api/plane/app/serializers/cycle.py`)
- **Fields**:

| Field | Type | Default |
|-------|------|---------|
| `cycle` | FK → Cycle | — |
| `user` | FK → User | — |
| `filters` | JSONField | `get_default_filters` |
| `display_filters` | JSONField | `get_default_display_filters` |
| `display_properties` | JSONField | `get_default_display_properties` |
| `rich_filters` | JSONField | `dict` |

---

### 5. EpicUserProperties (Enterprise)

- **File**: `apps/api/plane/ee/models/issue.py`
- **DB Table**: `epic_user_properties`
- **Base Class**: `ProjectBaseModel`
- **Entity FK**: `project` (via ProjectBaseModel, same as ProjectUserProperty)
- **Unique Constraint**: `(user, project)` where `deleted_at IS NULL`
- **Serializer**: `EpicUserPropertySerializer` (`apps/api/plane/ee/serializers/app/epic.py`)
- **Fields**:

| Field | Type | Default |
|-------|------|---------|
| `user` | FK → User | — |
| `filters` | JSONField | `get_default_filters` |
| `display_filters` | JSONField | `get_default_display_filters` |
| `display_properties` | JSONField | `get_default_display_properties` |
| `rich_filters` | JSONField | `dict` |

---

### 6. TeamspaceUserProperty (Enterprise)

- **File**: `apps/api/plane/ee/models/teamspace.py`
- **DB Table**: `team_space_user_properties`
- **Base Class**: `BaseModel`
- **Entity FK**: `team_space`
- **Unique Constraint**: `(team_space, user)` where `deleted_at IS NULL`
- **Serializer**: `TeamspaceUserPropertySerializer` (`apps/api/plane/ee/serializers/app/teamspace.py`)
- **Fields**:

| Field | Type | Default |
|-------|------|---------|
| `workspace` | FK → Workspace | — |
| `team_space` | FK → Teamspace | — |
| `user` | FK → User | — |
| `filters` | JSONField | `get_default_filters` |
| `display_filters` | JSONField | `get_default_display_filters` |
| `display_properties` | JSONField | `get_default_display_properties` |
| `rich_filters` | JSONField | `dict` |

---

### 7. InitiativeUserProperty (Enterprise)

- **File**: `apps/api/plane/ee/models/initiative.py`
- **DB Table**: `initiative_user_properties`
- **Base Class**: `BaseModel`
- **Entity FK**: `workspace`
- **Unique Constraint**: `(user, workspace)` where `deleted_at IS NULL`
- **Serializer**: `InitiativeUserPropertySerializer` (`apps/api/plane/ee/serializers/app/initiative.py`)
- **Fields**:

| Field | Type | Default |
|-------|------|---------|
| `workspace` | FK → Workspace | — |
| `user` | FK → User | — |
| `filters` | JSONField | `dict` |
| `display_filters` | JSONField | `dict` |
| `display_properties` | JSONField | `dict` |
| `rich_filters` | JSONField | `dict` |

---

## Common Fields Across All Models

Every model shares these 4 core JSON fields:

| Field | Purpose |
|-------|---------|
| `filters` | Legacy filter configuration (priority, state, assignee, etc.) |
| `display_filters` | Display-level settings (group_by, order_by, layout, etc.) |
| `display_properties` | Toggle visibility of columns (assignee, labels, due_date, etc.) |
| `rich_filters` | Advanced filter configuration (newer format, replaces `filters`) |

## Model-Specific Extra Fields

| Model | Extra Field | Type | Default |
|-------|-------------|------|---------|
| `ProjectUserProperty` | `preferences` | JSONField | `get_default_preferences` |
| `ProjectUserProperty` | `sort_order` | FloatField | `65535` |
| `WorkspaceUserProperties` | `navigation_project_limit` | IntegerField | `10` |
| `WorkspaceUserProperties` | `navigation_control_preference` | CharField | `"ACCORDION"` |

---

## Entity Scoping Summary

| Model | Scoped To | Workspace | Project |
|-------|-----------|-----------|---------|
| `ProjectUserProperty` | Project | via ProjectBaseModel | via ProjectBaseModel |
| `WorkspaceUserProperties` | Workspace | direct FK | N/A |
| `ModuleUserProperties` | Module | via ProjectBaseModel | via ProjectBaseModel |
| `CycleUserProperties` | Cycle | via ProjectBaseModel | via ProjectBaseModel |
| `EpicUserProperties` | Project | via ProjectBaseModel | via ProjectBaseModel |
| `TeamspaceUserProperty` | Teamspace | direct FK | N/A |
| `InitiativeUserProperty` | Workspace | direct FK | N/A |

---

## Proposed Consolidation

### Unified Model: `UserProperty`

```python
class UserProperty(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="user_properties",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="user_properties",
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_properties",
    )

    # Polymorphic entity reference
    entity_type = models.CharField(max_length=30)
    entity_id = models.UUIDField()

    # Common properties (shared by all 7 models)
    filters = models.JSONField(default=get_default_filters)
    display_filters = models.JSONField(default=get_default_display_filters)
    display_properties = models.JSONField(default=get_default_display_properties)
    rich_filters = models.JSONField(default=dict)

    # Entity-specific extensions
    extra = models.JSONField(default=dict)

    class Meta:
        db_table = "user_properties"
        verbose_name = "User Property"
        verbose_name_plural = "User Properties"
        ordering = ("-created_at",)
        unique_together = ["user", "entity_type", "entity_id", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "entity_type", "entity_id"],
                condition=models.Q(deleted_at__isnull=True),
                name="user_property_unique_user_entity_when_deleted_at_null",
            )
        ]
        indexes = [
            models.Index(fields=["entity_type", "entity_id"]),
            models.Index(fields=["user", "entity_type"]),
        ]
```

### Entity Type Values

| entity_type | entity_id points to | project field |
|-------------|---------------------|---------------|
| `PROJECT` | Project.id | set |
| `WORKSPACE` | Workspace.id | null |
| `MODULE` | Module.id | set |
| `CYCLE` | Cycle.id | set |
| `EPIC` | Project.id | set |
| `TEAMSPACE` | Teamspace.id | null |
| `INITIATIVE` | Workspace.id | null |

### Extra Field Usage

```json
// PROJECT entity_type
{
    "preferences": { ... },
    "sort_order": 65535
}

// WORKSPACE entity_type
{
    "navigation_project_limit": 10,
    "navigation_control_preference": "ACCORDION"
}

// All other entity_types: {} (empty dict)
```

---

## Migration Strategy

### Phase 1: Create New Table
1. Add the new `UserProperty` model and run `makemigrations` / `migrate`.
2. Add new serializer and viewset.

### Phase 2: Data Migration
Write a data migration that copies rows from all 7 existing tables into the new `user_properties` table:

| Source Table | entity_type | entity_id source |
|-------------|-------------|------------------|
| `project_user_properties` | `PROJECT` | `project_id` |
| `workspace_user_properties` | `WORKSPACE` | `workspace_id` |
| `module_user_properties` | `MODULE` | `module_id` |
| `cycle_user_properties` | `CYCLE` | `cycle_id` |
| `epic_user_properties` | `EPIC` | `project_id` |
| `team_space_user_properties` | `TEAMSPACE` | `team_space_id` |
| `initiative_user_properties` | `INITIATIVE` | `workspace_id` |

### Phase 3: Update API Layer
- Update views to query the new table with appropriate `entity_type` filter.
- Update serializers to read/write from the new model.
- Keep old endpoints working (same URL patterns, same response shapes).

### Phase 4: Deprecate Old Tables
- Remove old model classes, serializers, and views.
- Drop old tables via migration.

---

## Trade-offs

| Pros | Cons |
|------|------|
| Single table, single serializer, single viewset pattern | No DB-level FK on `entity_id` (referential integrity via app logic) |
| Easy to add new entity types without schema migrations | `extra` field needs per-entity-type validation |
| Less code duplication across models, serializers, views | Data migration across 7 tables is non-trivial |
| Consistent API pattern for all entities | Slightly more complex queries (must filter by `entity_type`) |
| Single index strategy, easier to optimize | Larger single table vs. smaller purpose-specific tables |
