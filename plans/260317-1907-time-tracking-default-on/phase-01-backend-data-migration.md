# Phase 1: Backend — Data Migration

## Context Links

- Model: `apps/api/plane/db/models/project.py:98` — `is_time_tracking_enabled = models.BooleanField(default=True)`
- Original migration (default=False): `apps/api/plane/db/migrations/0070_apitoken_is_service_exporterhistory_filters_and_more.py`
- Changed to default=True: `apps/api/plane/db/migrations/0124_issue_worklog_and_estimate_time.py`
- Reference data migration pattern: `apps/api/plane/db/migrations/0131_migrate_none_priority_to_medium.py`
- Latest migration: `0150_fix_default_view_rich_filters.py`

## Overview

- **Priority**: P2
- **Status**: complete
- **Description**: Create Django data migration to set `is_time_tracking_enabled=True` for all existing projects

## Key Insights

- Field was added with `default=False` in migration 0070, changed to `default=True` in 0124
- Projects created between 0070 and 0124 (or any manually toggled off) still have `False`
- Requirement: ALL existing projects should have time tracking ON
- Follow same pattern as `0131_migrate_none_priority_to_medium.py` — raw SQL for performance

## Requirements

**Functional:**

- All existing `Project` rows with `is_time_tracking_enabled=False` must be updated to `True`

**Non-functional:**

- Migration must be atomic (single SQL statement)
- Fast execution — raw SQL avoids ORM overhead

## Architecture

Single data migration file. No schema change needed (model already has `default=True`).

## Related Code Files

**Modify:** None (model already correct)

**Create:**

- `apps/api/plane/db/migrations/0151_enable_time_tracking_all_projects.py`

## Implementation Steps

1. Create new migration file `0151_enable_time_tracking_all_projects.py`
2. Set dependency on `("db", "0150_fix_default_view_rich_filters")`
3. Define `enable_time_tracking(apps, schema_editor)` function:
   ```python
   from django.db import connection
   with connection.cursor() as cursor:
       cursor.execute(
           "UPDATE projects SET is_time_tracking_enabled = TRUE "
           "WHERE is_time_tracking_enabled = FALSE"
       )
   ```
4. Define `reverse_migration` as no-op (intentionally irreversible)
5. Register `migrations.RunPython(enable_time_tracking, reverse_migration)`

## Todo List

- [x] Create migration file `0151_enable_time_tracking_all_projects.py`
- [x] Verify table name is `projects` (check model Meta or existing SQL)
- [ ] Test migration locally with `python manage.py migrate db`

## Success Criteria

- `SELECT COUNT(*) FROM projects WHERE is_time_tracking_enabled = FALSE` returns 0 after migration
- New projects still default to `True` (no model change needed)
- Existing migrations still pass

## Risk Assessment

- **Override concern**: Projects where admin intentionally disabled time tracking will be re-enabled. Per requirements, this is desired behavior.
- **Mitigation**: Migration is one-way; admins can re-disable manually after migration.

## Security Considerations

- No auth/permission changes
- Data-only migration, no schema changes

## Next Steps

- None — this phase is independent
