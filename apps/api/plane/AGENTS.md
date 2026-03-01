# Plane Django Project

Root Django project containing all backend modules.

## API Layers

| Module   | Consumer    | Purpose                  |
| -------- | ----------- | ------------------------ |
| api/     | Third-party | External/public REST API |
| app/     | Web app     | Internal REST API        |
| graphql/ | Mobile app  | GraphQL endpoint         |
| space/   | Public      | Public workspace viewing |

## Entry Points

- **WSGI**: `plane.wsgi:application`
- **ASGI**: `plane.asgi:application`
- **Celery**: `plane.celery:app`

## Settings

Set via `DJANGO_SETTINGS_MODULE`:

- `plane.settings.local` - Development
- `plane.settings.production` - Production
- `plane.settings.test` - Testing

## Soft Deletion

Plane uses **soft deletion** for all core models. Records are marked with a `deleted_at` timestamp instead of being removed.

### Managers

| Manager             | Behavior                        |
| ------------------- | ------------------------------- |
| `Model.objects`     | Default - excludes soft-deleted |
| `Model.all_objects` | Includes soft-deleted records   |

### Usage

```python
issue.delete()              # Soft delete (default)
issue.delete(soft=False)    # Hard delete

Issue.objects.filter(...)           # Active records only
Issue.all_objects.filter(...)       # All records
Issue.all_objects.filter(deleted_at__isnull=False)  # Only deleted
```

### Key Points

- Always use `Model.objects` unless you need deleted records
- Cascading deletes happen asynchronously via Celery
- Soft-deleted records can conflict with unique constraints
- To restore: set `deleted_at = None` and save

See module-specific `AGENTS.md` files for detailed documentation.
