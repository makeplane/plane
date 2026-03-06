# Phase 1: Backend Model & API

## Context Links

- [Research: Backend Email Templates](./research/researcher-01-backend-email-templates.md)
- [License API views](../../apps/api/plane/license/api/views/)
- [License URLs](../../apps/api/plane/license/urls.py)
- [Base API View](../../apps/api/plane/license/api/views/base.py)

## Overview

- **Priority**: P1 (blocking for all other phases)
- **Status**: pending
- **Description**: Create EmailTemplate model, serializer, and API endpoints for CRUD + preview + test-send

## Key Insights

- All license API views extend `BaseAPIView` with `InstanceAdminPermission`
- Existing email bgtasks use `render_to_string("emails/{path}.html", context)` pattern
- `BaseModel` provides id, created_at, updated_at, created_by, updated_by

## Requirements

### Functional

- CRUD operations on email templates
- Preview endpoint renders template with sample data, returns HTML
- Test-send endpoint sends rendered email to specified address
- Reset endpoint restores template to file-based default

### Non-functional

- Admin-only access (InstanceAdminPermission)
- Template content validated as valid Django template syntax
- Max template size: 100KB

## Architecture

### EmailTemplate Model

```python
class EmailTemplate(BaseModel):
    slug = CharField(max_length=255, unique=True)  # e.g. "auth/magic_signin"
    subject = CharField(max_length=500, blank=True)
    html_content = TextField()  # Custom HTML override
    is_active = BooleanField(default=True)

    class Meta:
        db_table = "email_templates"
        ordering = ["slug"]
```

### API Endpoints (under `/god-mode/api/instances/`)

<!-- Updated: Validation Session 2 - UUID routing for all API endpoints -->

| Method | Path                                   | Action                                              |
| ------ | -------------------------------------- | --------------------------------------------------- |
| GET    | `email-templates/`                     | List all templates (with registry metadata)         |
| GET    | `email-templates/<uuid:pk>/`           | Get single template detail                          |
| PUT    | `email-templates/<uuid:pk>/`           | Update template content (returns variable warnings) |
| DELETE | `email-templates/<uuid:pk>/`           | Reset to file default (delete DB override)          |
| POST   | `email-templates/<uuid:pk>/preview/`   | Render preview with sample data                     |
| POST   | `email-templates/<uuid:pk>/test-send/` | Send test email                                     |

### Serializer

```python
class EmailTemplateSerializer(serializers.ModelSerializer):
    has_override = serializers.SerializerMethodField()
    variables = serializers.SerializerMethodField()  # From registry

    class Meta:
        model = EmailTemplate
        fields = ["id", "slug", "subject", "html_content", "is_active",
                  "has_override", "variables", "created_at", "updated_at"]
```

## Related Code Files

### Create

- `apps/api/plane/license/models/email_template.py` — Model definition
- `apps/api/plane/license/api/views/email_template.py` — ViewSet
- `apps/api/plane/license/api/serializers/email_template.py` — Serializer
- `apps/api/plane/db/migrations/0XXX_email_template.py` — Migration

### Modify

- `apps/api/plane/license/models/__init__.py` — Export new model
- `apps/api/plane/license/api/views/__init__.py` — Export new view
- `apps/api/plane/license/urls.py` — Register new URL patterns

## Implementation Steps

1. Create `EmailTemplate` model in `plane/license/models/email_template.py`
   - Extend BaseModel, add slug/subject/html_content/is_active fields
   - Add unique constraint on slug

2. Update `plane/license/models/__init__.py` to export EmailTemplate

3. Generate and review migration: `python manage.py makemigrations license`

4. Create serializer in `plane/license/api/serializers/email_template.py`
   - ModelSerializer with computed fields (has_override, variables from registry)

5. Create view in `plane/license/api/views/email_template.py`
   - Extend BaseAPIView
   - `list()`: Return all registered templates with DB override status
   - `retrieve()`: Return template detail (DB content or file content)
   - `update()`: Save/update HTML content in DB
   - `destroy()`: Delete DB record (revert to file default)
   - `preview()`: Render template with sample data from registry, return HTML string
   - `test_send()`: Accept `{"email": "test@example.com"}`, render + send via SMTP

6. Update `plane/license/api/views/__init__.py` to export

7. Register URL patterns in `plane/license/urls.py`

## Todo List

- [ ] Create EmailTemplate model
- [ ] Generate migration
- [ ] Create serializer
- [ ] Create API view (list, retrieve, update, destroy)
- [ ] Add preview endpoint
- [ ] Add test-send endpoint
- [ ] Register URLs
- [ ] Update **init** exports

## Success Criteria

- All CRUD endpoints respond correctly with proper auth
- Preview returns rendered HTML with sample variables populated
- Test-send delivers email to specified address
- Deleting a template reverts to file-based default

## Risk Assessment

- **Template syntax errors**: Wrap `render_to_string` in try/except, return validation error
- **SMTP misconfiguration**: Test-send reuses existing `get_email_configuration()`, same risk as current test email

## Security Considerations

- All endpoints require InstanceAdminPermission (same as other god-mode endpoints)
- Template content is HTML — stored as-is, rendered server-side (admin-only, trusted input)
- No user-facing template injection risk (only admins can edit)

<!-- Updated: Validation Session 2 - Variable validation warning -->

## Variable Validation

- On PUT (update), check html_content against registry's required variables
- If missing variables detected: return `200 OK` with `warnings` field listing missing vars
- Non-blocking — admin can still save. Frontend shows warning toast/banner.
