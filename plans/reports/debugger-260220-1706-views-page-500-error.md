# Debugger Report: Views Page 500 Error

**Date:** 2026-02-20
**Severity:** High — Views page completely broken for all projects

---

## Executive Summary

The `/projects/{id}/views/` page returns HTTP 500 for all requests. Root cause: migration `0120_issueview_archived_at` was never applied to the database, so the `archived_at` column is missing from the `issue_views` table. The API serializer references `instance.archived_at`, which triggers a `ProgrammingError` on every views list query.

---

## Root Cause

**Missing DB migration:** `0120_issueview_archived_at` was not applied.

Two migrations share the same number `0120`:

- `0120_analytics_dashboard_models` — **applied** (depended on by `0121_department_staffprofile_and_more`)
- `0120_issueview_archived_at` — **NOT applied** (orphaned; nothing depends on it)

Django ran `0121` which depends on `0120_analytics_dashboard_models`, so Django considered the `0120` chain complete and never ran `0120_issueview_archived_at`.

---

## Evidence

### API Error Log

```
django.db.utils.ProgrammingError: column issue_views.archived_at does not exist
LINE 1: ..."owned_by_id", "issue_views"."is_locked", "issue_vie...

File "/code/plane/app/views/view/base.py", line 305, in list
    views = IssueViewSerializer(queryset, many=True, fields=...).data
File "/code/plane/app/serializers/view.py", line 47
    "archived_at": instance.archived_at,
```

### Migration Status

```
[X] 0119_alter_estimatepoint_key
[X] 0120_analytics_dashboard_models
[ ] 0120_issueview_archived_at      ← NOT APPLIED
[X] 0121_department_staffprofile_and_more
```

### DB Schema Confirmation

`issue_views` table has no `archived_at` column. Existing columns: `created_at`, `updated_at`, `id`, `name`, `description`, `query`, `access`, `filters`, `display_filters`, `display_properties`, `sort_order`, `logo_props`, `is_locked`, `owned_by_id`, `deleted_at`, `rich_filters`.

### Network Errors (from Playwright)

| URL                                 | Status               |
| ----------------------------------- | -------------------- |
| `/api/workspaces/.../views/`        | 500                  |
| `/api/workspaces/.../intake-state/` | 404                  |
| `/api/users/me/`                    | 401 (pre-login only) |

---

## Fix

### Option A — Rename migration to fix numbering conflict (recommended)

Rename `0120_issueview_archived_at.py` → `0122_issueview_archived_at.py` and update its `dependencies` to point to `0121_department_staffprofile_and_more`. Then run migrations.

```python
# 0122_issueview_archived_at.py
dependencies = [
    ('db', '0121_department_staffprofile_and_more'),
]
```

Then apply:

```bash
docker exec planeso-api-1 python manage.py migrate db 0122_issueview_archived_at
```

### Option B — Apply migration directly (quick fix, no rename)

Since Django can run a specific migration by name regardless of numbering conflicts:

```bash
docker exec planeso-api-1 python manage.py migrate db 0120_issueview_archived_at
```

This should work because the dependency `0119_alter_estimatepoint_key` is already applied.

### Option C — Raw SQL (emergency hotfix, bypasses Django)

```sql
ALTER TABLE issue_views ADD COLUMN archived_at timestamp with time zone NULL;
```

Then mark migration applied:

```bash
docker exec planeso-api-1 python manage.py migrate db 0120_issueview_archived_at --fake
```

---

## Secondary Issue

`/api/workspaces/.../intake-state/` returns 404. Workers (`planeso-beat-worker-1`, `planeso-worker-1`) are in restart loop — may be related to the same missing migration or another issue. Investigate separately.

---

## Unresolved Questions

1. Why are `planeso-beat-worker-1` and `planeso-worker-1` restarting? Is it the same migration issue or different?
2. The `intake-state` 404 — is the intake feature disabled/unimplemented for these projects, or is it another missing migration?
3. Should the duplicate `0120` numbering be fixed in the migration chain permanently to prevent future Django confusion?
