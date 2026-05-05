# Phase 1: Database Migration

## Context Links

- Plan: [plan.md](./plan.md)
- Issue model: `apps/api/plane/db/models/issue.py`
- Original migration: `apps/api/plane/db/migrations/0124_issue_worklog_and_estimate_time.py`

## Overview

- **Priority**: P1
- **Status**: pending
- **Description**: Remove `estimate_time` field from Issue model and create a new Django migration
<!-- Updated: Validation Session 2 - Execution order changed: this phase runs SECOND, after Phase 2 (Backend API Cleanup) -->

## Key Insights

- Field added in migration 0124 alongside IssueWorkLog model
- Field is `PositiveIntegerField(null=True, blank=True)` -- nullable, so removal is safe
- No other model references this field via FK or constraint
- Migration 0125 depends on 0124 but only touches `IssueView.archived_at`, no conflict

## Requirements

### Functional

- Remove `estimate_time` field from `Issue` model definition
- Generate Django migration to drop the column

### Non-functional

- Migration must be backward-compatible (nullable field removal is safe)
- Migration should be the latest in sequence

## Architecture

Simple column drop -- no schema redesign needed.

## Related Code Files

### Files to Modify

- `apps/api/plane/db/models/issue.py` -- Remove `estimate_time` field definition (line ~169)

### Files to Create

- `apps/api/plane/db/migrations/XXXX_remove_issue_estimate_time.py` -- Auto-generated migration

## Embedded Rules

- Follow Django migration best practices
- Use `python manage.py makemigrations db` to auto-generate
- Test migration forward with `python manage.py migrate`
- Never manually edit auto-generated migrations unless necessary

## Implementation Steps

1. Open `apps/api/plane/db/models/issue.py`
2. Remove the `estimate_time` field (lines 169-171):
   ```python
   estimate_time = models.PositiveIntegerField(
       null=True, blank=True, help_text="Time estimate in minutes"
   )
   ```
3. Run `python manage.py makemigrations db -n remove_issue_estimate_time`
4. Verify generated migration contains `RemoveField(model_name="issue", name="estimate_time")`
5. Run `python manage.py migrate` to apply

## Post-Phase Checklist

- [ ] `estimate_time` removed from Issue model
- [ ] Migration file generated and reviewed
- [ ] Migration applies without errors
- [ ] No other models reference `estimate_time`

## Todo List

- [ ] Remove field from model
- [ ] Generate migration
- [ ] Test migration forward

## Success Criteria

- `estimate_time` column no longer exists in `issues` table after migration
- Django `makemigrations` shows no pending changes

## Risk Assessment

- **Low risk**: Nullable field, no FK references, no constraints
- Column data will be lost permanently -- confirm this is acceptable before running in production

## Security Considerations

- No security impact -- field removal only

## Next Steps

- Proceed to Phase 2 (Backend API Cleanup) to remove serializer/view references
