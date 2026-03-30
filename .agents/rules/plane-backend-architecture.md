<!-- Scope: apps/api/**, packages/types/**, packages/services/** -->

# Plane Backend Architecture — Quick Reference

> Detailed rules in domain-specific files. This is a compact index with critical rules.

## Tech Stack

Django 4.2 + DRF 3.15 | PostgreSQL 15.7 | Redis/Valkey | RabbitMQ + Celery | Session auth (crum)

## Project Structure

```
apps/api/plane/
├── db/     # Models only, no business logic
├── app/    # Internal API (v0) — session auth, NO OpenAPI
├── api/    # External API (v1) — API key auth, WITH @extend_schema
├── bgtasks/# 36+ Celery tasks
└── utils/  # Shared utilities
```

### Two API Layers — CRITICAL

|             | `plane/app/` (Internal) | `plane/api/` (External) |
| ----------- | ----------------------- | ----------------------- |
| Auth        | Session (cookie)        | API Key / OAuth         |
| OpenAPI     | No decorators           | `@extend_schema`        |
| Serializers | Own set                 | Own SEPARATE set        |

**NEVER** mix serializers between layers.

## Top 10 Critical Rules

1. **`Issue.issue_objects`** — NEVER `Issue.objects` for user queries (→ `backend-models.md`)
2. **`workspace__slug` filter** — ALWAYS filter by workspace (→ `backend-views.md`)
3. **`BaseViewSet`/`BaseAPIView`** — ALWAYS inherit (→ `backend-views.md`)
4. **`@allow_permission`** — ALWAYS use decorator (→ `backend-views.md`)
5. **Activity tracking** — fire `issue_activity.delay()`/`model_activity.delay()` (→ `backend-urls-celery.md`)
6. **`current_instance` before update** — capture for activity diff (→ `backend-views.md`)
7. **`select_related`/`prefetch_related`** — prevent N+1 (→ `backend-models.md`)
8. **`str(obj.id)` to Celery** — never pass model instances (→ `backend-urls-celery.md`)
9. **Register in `__init__.py`** — all new models/views/serializers/urls (→ `backend-urls-celery.md`)
10. **Separate write/read serializers** — when write needs different fields (→ `backend-serializers.md`)

## Modular Rule Files (path-scoped)

| Rule File                 | Content                                     |
| ------------------------- | ------------------------------------------- |
| `backend-models.md`       | Model hierarchy, custom managers, QuerySet  |
| `backend-views.md`        | ViewSet patterns, permissions, guest access |
| `backend-serializers.md`  | Base classes, write/read split              |
| `backend-urls-celery.md`  | URL conventions, Celery, activity tracking  |
| `backend-testing-i18n.md` | Test fixtures, i18n, frontend integration   |
| `backend-testing.md`      | Test runner commands, markers, options      |

## New Feature Checklist

1. Model → `plane/db/models/` (BaseModel/ProjectBaseModel) + `__init__.py`
2. Migration → `python manage.py makemigrations`
3. Serializer → `plane/app/serializers/` + `__init__.py`
4. Views → `plane/app/views/` with `@allow_permission` + `__init__.py`
5. URLs → `plane/app/urls/` + `__init__.py`
6. Activity → `issue_activity.delay()`/`model_activity.delay()`
7. Tasks → `plane/bgtasks/` if needed
8. Frontend: Types → Service → Store → Components

## Rule Maintenance

If you encounter code that contradicts these rules:

1. **Grep to verify** which pattern is dominant (count occurrences)
2. **Follow the majority** pattern (the rule may be outdated)
3. **Flag the discrepancy** in your output so rules can be updated
