# Phase 1: Backend - Frequency Field

## Context

- [Plan](./plan.md) | Phase 1 of 3
- Pattern reference: `priority` CharField with choices on Issue model

## Overview

Add `frequency` CharField to Issue model, update serializers, create migration, add activity tracking.

## Key Insights

- `priority` pattern is the exact blueprint: CharField + choices tuple + nullable
- IssueCreateSerializer uses `fields = "__all__"` so new field auto-included
- IssueSerializer/IssueDetailSerializer use explicit field lists - must add `frequency`
- IssueListDetailSerializer uses manual `to_representation` - must add `frequency`
- Activity tracking: add `track_frequency` fn + register in `ISSUE_ACTIVITY_MAPPER`
- IssueVersion.log_issue_version needs `frequency` added

## Requirements

- [x] CharField, max_length=20, choices, null=True, blank=True, default=None
- [x] Values: daily, weekly, bi_weekly, monthly, quarterly, half_year, yearly, ad_hoc
- [x] Migration 0137
- [x] All serializers updated
- [x] Activity tracking for frequency changes

## Implementation Steps

<!-- Updated: Validation Session 3 - IssueVersion.frequency field + log_issue_version update confirmed in MVP scope -->

### 1. Model (`apps/api/plane/db/models/issue.py`)

Add to Issue class (after PRIORITY_CHOICES):

```python
FREQUENCY_CHOICES = (
    ("daily", "Daily"),
    ("weekly", "Weekly"),
    ("bi_weekly", "Bi-weekly"),
    ("monthly", "Monthly"),
    ("quarterly", "Quarterly"),
    ("half_year", "Half-year"),
    ("yearly", "Yearly"),
    ("ad_hoc", "Ad-hoc"),
)
```

Add field (after `type` field, before `time_spent`):

```python
frequency = models.CharField(
    max_length=20,
    choices=FREQUENCY_CHOICES,
    verbose_name="Issue Frequency",
    null=True,
    blank=True,
)
```

Update `IssueVersion.log_issue_version` to include `frequency=issue.frequency`.
Add `frequency` field to `IssueVersion` model as CharField (same choices, nullable).

### 2. Migration (`apps/api/plane/db/migrations/0137_issue_frequency.py`)

```python
# Auto-generated migration adding frequency to Issue and IssueVersion
```

Run: `cd apps/api && python manage.py makemigrations db --name issue_frequency`

### 3. Serializers (`apps/api/plane/app/serializers/issue.py`)

Files to update:

- `IssueFlatSerializer.Meta.fields` - add `"frequency"`
- `IssueSerializer.Meta.fields` - add `"frequency"`
- `IssueDetailSerializer` - inherits from IssueSerializer, auto-included
- `IssueListDetailSerializer.to_representation` - add `"frequency": instance.frequency`
- `IssueVersionDetailSerializer.Meta.fields` - add `"frequency"`

IssueCreateSerializer uses `fields = "__all__"` so no change needed there.

### 4. Activity Tracking (`apps/api/plane/bgtasks/issue_activities_task.py`)

Add `track_frequency` function (copy pattern from `track_priority`, lines 161-186):

```python
def track_frequency(
    requested_data, current_instance, issue_id,
    project_id, workspace_id, actor_id, issue_activities, epoch,
):
    if current_instance.get("frequency") != requested_data.get("frequency"):
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="updated",
                old_value=current_instance.get("frequency"),
                new_value=requested_data.get("frequency"),
                field="frequency",
                project_id=project_id,
                workspace_id=workspace_id,
                comment="updated the frequency to",
                epoch=epoch,
            )
        )
```

Register in `ISSUE_ACTIVITY_MAPPER` dict:

```python
"frequency": track_frequency,
```

## Related Files

- `/apps/api/plane/db/models/issue.py` - Issue model (line 104), IssueVersion (line 684)
- `/apps/api/plane/app/serializers/issue.py` - All serializers
- `/apps/api/plane/bgtasks/issue_activities_task.py` - Activity tracker (mapper at line 637)
- `/apps/api/plane/db/migrations/` - Next: 0137

## Todo

- [x] Add FREQUENCY_CHOICES and field to Issue model
- [x] Add frequency field to IssueVersion model
- [x] Update IssueVersion.log_issue_version
- [x] Generate migration 0137
- [x] Update IssueFlatSerializer fields
- [x] Update IssueSerializer fields
- [x] Update IssueListDetailSerializer.to_representation
- [x] Update IssueVersionDetailSerializer fields
- [x] Add track_frequency function
- [x] Register in ISSUE_ACTIVITY_MAPPER
- [x] Run migration and verify

## Success Criteria

- `frequency` column exists in `issues` table, nullable
- API accepts/returns frequency on CRUD operations
- Activity log records frequency changes
- No existing tests broken

## Risk Assessment

- **Low**: Simple additive CharField, no FK complexity
- Migration is non-destructive (nullable field addition)
- No impact on existing data

## Security Considerations

- CharField with choices enforces valid values at model level
- Serializer inherits model validation via DRF

## Next Steps

Continue to [Phase 2: Types + Store + Service](./phase-02-types-store-service.md)
