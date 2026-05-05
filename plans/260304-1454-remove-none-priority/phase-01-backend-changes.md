# Phase 01: Backend Changes

## Context Links

- [Scout Report](./reports/scout-report.md)
- [plan.md](./plan.md)
- Backend root: `apps/api/`

## Overview

- **Priority**: P2
- **Status**: completed
- **Description**: Remove "none" from backend priority choices, change default to "medium" in Django models, serializers, views, and utility functions.

## Key Insights

- `PRIORITY_CHOICES` is defined in 3 model classes: `Issue`, `IssueVersion`, `DraftIssue`
- Default priority "none" is set in model field definitions and serializers
- Priority ordering lists in utils and views include "none"
- **Data migration required**: All existing `priority="none"` records must be updated to `"medium"` across Issue, IssueVersion, and DraftIssue tables
- Django `choices` param is for validation/admin only; it does NOT add a DB constraint, so a data migration (not schema migration) is sufficient

## Requirements

### Functional

- Remove "none" from all `PRIORITY_CHOICES` tuples
- Change `default="none"` to `default="medium"` on all priority fields
- Remove "none" from all priority ordering/grouping lists
- Update intake serializers and views to default to "medium"

### Non-functional

- **Data migration required** to update all `priority="none"` → `"medium"` across Issue, IssueVersion, DraftIssue
- No schema migration needed (column type/constraints unchanged)

## Architecture

No architectural changes. Pure value updates across models, utils, serializers, views.

## Related Code Files

### Files to Modify

| File                                         | Change                                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `apps/api/plane/db/models/issue.py`          | Remove "none" from `Issue.PRIORITY_CHOICES` and `IssueVersion.PRIORITY_CHOICES`; change `default="none"` to `default="medium"` |
| `apps/api/plane/db/models/draft.py`          | Remove "none" from `DraftIssue.PRIORITY_CHOICES`; change `default="none"` to `default="medium"`                                |
| `apps/api/plane/utils/order_queryset.py`     | Remove "none" from `PRIORITY_ORDER`                                                                                            |
| `apps/api/plane/utils/grouper.py`            | Remove "none" from priority list (line 191)                                                                                    |
| `apps/api/plane/utils/analytics_plot.py`     | Remove "none" from `sort_data` order list (line 48)                                                                            |
| `apps/api/plane/utils/filters/converters.py` | Remove "none" from `DEFAULT_VALID_CHOICES["priority"]` (line 45)                                                               |
| `apps/api/plane/utils/openapi/parameters.py` | Update description to remove "none" (line 338)                                                                                 |
| `apps/api/plane/api/views/issue.py`          | Remove "none" from `priority_order` list (line 319)                                                                            |
| `apps/api/plane/api/serializers/intake.py`   | Change `default="none"` to `default="medium"` (line 170)                                                                       |
| `apps/api/plane/api/views/intake.py`         | Change default "none" to "medium" (lines 163, 194)                                                                             |
| `apps/api/plane/space/views/intake.py`       | Remove "none" from valid priority list; change default to "medium" (lines 119-124)                                             |
| `apps/api/plane/space/utils/grouper.py`      | Remove "none" from priority list (line 228)                                                                                    |
| `apps/api/plane/app/views/workspace/user.py` | Remove "none" from `priority_order` list (line 414)                                                                            |
| `apps/api/plane/bgtasks/dummy_data_task.py`  | Remove "none" from random priority choices; update index (line 316)                                                            |

## Embedded Rules

- Follow existing code patterns; keep changes minimal
- Do NOT create a DB migration for this change (choices are not DB constraints)
- Preserve backward compat: existing "none" rows in DB must not cause errors
- Use try-catch in views where priority is read from DB (already handled by Django)

## Implementation Steps

### Step 1: Update Model PRIORITY_CHOICES and Defaults

**File**: `apps/api/plane/db/models/issue.py`

1. In `Issue.PRIORITY_CHOICES` (line ~105-110): remove `("none", "None")` tuple
2. In `Issue.priority` field (line ~139-144): change `default="none"` to `default="medium"`
3. In `IssueVersion.PRIORITY_CHOICES` (line ~669-675): remove `("none", "None")` tuple
4. In `IssueVersion.priority` field (line ~681-686): change `default="none"` to `default="medium"`

**File**: `apps/api/plane/db/models/draft.py`

5. In `DraftIssue.PRIORITY_CHOICES` (line ~17-23): remove `("none", "None")` tuple
6. In `DraftIssue.priority` field (line ~50-54): change `default="none"` to `default="medium"`

### Step 2: Update Utility Functions

**File**: `apps/api/plane/utils/order_queryset.py` 7. Line 8: change `PRIORITY_ORDER = ["urgent", "high", "medium", "low", "none"]` to `PRIORITY_ORDER = ["urgent", "high", "medium", "low"]`

**File**: `apps/api/plane/utils/grouper.py` 8. Line 191: change `return ["low", "medium", "high", "urgent", "none"]` to `return ["low", "medium", "high", "urgent"]`

**File**: `apps/api/plane/utils/analytics_plot.py` 9. Line 48: change `order = ["low", "medium", "high", "urgent", "none"]` to `order = ["low", "medium", "high", "urgent"]`

**File**: `apps/api/plane/utils/filters/converters.py` 10. Line 45: change `"priority": ["urgent", "high", "medium", "low", "none"]` to `"priority": ["urgent", "high", "medium", "low"]`

**File**: `apps/api/plane/utils/openapi/parameters.py` 11. Line 338: change description from `"Order by priority (urgent, high, medium, low, none)"` to `"Order by priority (urgent, high, medium, low)"`

### Step 3: Update API Views

**File**: `apps/api/plane/api/views/issue.py` 12. Line 319: change `priority_order = ["urgent", "high", "medium", "low", "none"]` to `priority_order = ["urgent", "high", "medium", "low"]`

**File**: `apps/api/plane/app/views/workspace/user.py` 13. Line 414: change `priority_order = ["urgent", "high", "medium", "low", "none"]` to `priority_order = ["urgent", "high", "medium", "low"]`

### Step 4: Update Serializers

**File**: `apps/api/plane/api/serializers/intake.py` 14. Line 170: change `default="none"` to `default="medium"`

### Step 5: Update Intake Views

**File**: `apps/api/plane/api/views/intake.py` 15. Line 163: change `"none"` to `"medium"` in priority validation default 16. Line 194: change `"none"` to `"medium"` in `issue_data.get("priority", "medium")`

**File**: `apps/api/plane/space/views/intake.py` 17. Lines 119-124: remove `"none"` from valid priorities list; change default from `"none"` to `"medium"`

**File**: `apps/api/plane/space/utils/grouper.py` 18. Line 228: change `return ["low", "medium", "high", "urgent", "none"]` to `return ["low", "medium", "high", "urgent"]`

### Step 6: Update Dummy Data Task

**File**: `apps/api/plane/bgtasks/dummy_data_task.py` 19. Line 316: change `["urgent", "high", "medium", "low", "none"][random.randint(0, 4)]` to `["urgent", "high", "medium", "low"][random.randint(0, 3)]`

### Step 7: Create Data Migration

**Deployment note**: Phase 1 must be deployed and this migration run **before** Phase 2 (frontend) is deployed.

Create a new Django data migration to update all existing `priority="none"` records to `"medium"`.
First, find the latest migration: `python manage.py showmigrations db | tail -5`

**File**: `apps/api/plane/db/migrations/XXXX_migrate_none_priority_to_medium.py` (auto-named by Django)

Run: `python manage.py makemigrations db --empty --name migrate_none_priority_to_medium`

<!-- Updated: Validation Session 3 - Fix app label from 'plane' to 'db' -->

Then edit the generated migration to add:

```python
from django.db import migrations

def migrate_none_to_medium(apps, schema_editor):
    Issue = apps.get_model("db", "Issue")
    IssueVersion = apps.get_model("db", "IssueVersion")
    DraftIssue = apps.get_model("db", "DraftIssue")
    Issue.objects.filter(priority="none").update(priority="medium")
    IssueVersion.objects.filter(priority="none").update(priority="medium")
    DraftIssue.objects.filter(priority="none").update(priority="medium")

def reverse_migration(apps, schema_editor):
    pass  # intentionally irreversible

class Migration(migrations.Migration):
    dependencies = [
        ("db", "<previous_migration>"),
    ]
    operations = [
        migrations.RunPython(migrate_none_to_medium, reverse_migration),
    ]
```

<!-- Updated: Validation Session 1 - Add data migration step to update none→medium in DB -->

## Todo List

- [x] Update `Issue.PRIORITY_CHOICES` and default in `issue.py`
- [x] Update `IssueVersion.PRIORITY_CHOICES` and default in `issue.py`
- [x] Update `DraftIssue.PRIORITY_CHOICES` and default in `draft.py`
- [x] Update `PRIORITY_ORDER` in `order_queryset.py`
- [x] Update grouper in `grouper.py`
- [x] Update `sort_data` in `analytics_plot.py`
- [x] Update `DEFAULT_VALID_CHOICES` in `filters/converters.py`
- [x] Update OpenAPI docs in `openapi/parameters.py`
- [x] Update `priority_order` in `api/views/issue.py`
- [x] Update `priority_order` in `app/views/workspace/user.py`
- [x] Update intake serializer default in `api/serializers/intake.py`
- [x] Update intake view defaults in `api/views/intake.py`
- [x] Update space intake view in `space/views/intake.py`
- [x] Update space grouper in `space/utils/grouper.py`
- [x] Update dummy data task in `bgtasks/dummy_data_task.py`
- [x] Create data migration to update `priority="none"` → `"medium"` in Issue, IssueVersion, DraftIssue

## Post-Phase Checklist

- [x] All `PRIORITY_CHOICES` tuples have exactly 4 entries (urgent, high, medium, low)
- [x] All `default=` on priority fields are `"medium"`
- [x] All ordering/grouping lists have exactly 4 priorities
- [x] No Python syntax errors (run `python -m py_compile` on changed files)
- [x] Data migration created and runs without errors (`python manage.py migrate`)
- [x] After migration: `Issue.objects.filter(priority="none").count()` returns 0

## Success Criteria

- Backend accepts new issues with default priority "medium"
- Priority ordering/sorting works with 4 values
- No regression in existing API endpoints

## Risk Assessment

| Risk                                                 | Mitigation                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------- |
| Data migration runs on large table, causing downtime | Run during low-traffic window; add DB index on `priority` if needed       |
| Migration fails mid-way                              | Use atomic transaction (Django wraps RunPython in transaction by default) |
| Admin panel shows "none" as invalid pre-migration    | Run migration before or alongside choices change                          |
| API clients filtering `priority=none` get 400        | Intentional breaking change (per validation); document in changelog       |

## Security Considerations

None -- this is a value restriction, not a permission change.

## Next Steps

After completing Phase 1, proceed to [Phase 2: Frontend Changes](./phase-02-frontend-changes.md).
