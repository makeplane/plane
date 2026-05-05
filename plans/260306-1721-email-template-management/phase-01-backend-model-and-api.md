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
    html_content = TextField(blank=True, default="")  # Custom HTML override (empty = no override)
    is_active = BooleanField(default=True)

    class Meta:
        db_table = "email_templates"
        ordering = ["slug"]
```

### API Endpoints (under `/god-mode/api/instances/`)

<!-- Updated: Validation Session 2 - UUID routing for all API endpoints -->

| Method | Path                               | Action                                              |
| ------ | ---------------------------------- | --------------------------------------------------- |
| GET    | `email-templates/`                 | List all templates (with registry metadata)         |
| GET    | `email-templates/<uuid:pk>/`       | Get single template detail                          |
| PUT    | `email-templates/<uuid:pk>/`       | Update template content (returns variable warnings) |
| POST   | `email-templates/<uuid:pk>/reset/` | Reset to default (clear content, keep record)       |

<!-- Updated: Validation Session 9 - Reset via POST instead of DELETE, keeps record for stable UUID -->

| POST | `email-templates/<uuid:pk>/preview/` | Render preview with sample data |
| POST | `email-templates/<uuid:pk>/test-send/` | Send test email |

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
- `apps/api/plane/license/migrations/0007_email_template.py` — Migration
  <!-- Updated: Validation Session 19 - Corrected from plane/db/migrations/ to plane/license/migrations/ (license app has own migrations dir with 6 existing) -->
- `apps/api/plane/bgtasks/send_test_email_template_task.py` — Celery task for test-send
  <!-- Updated: Validation Session 11 - Full implementation in Phase 1, not deferred to Phase 2 -->

### Modify

- `apps/api/plane/license/models/__init__.py` — Export new model
- `apps/api/plane/license/api/views/__init__.py` — Export new view
- `apps/api/plane/license/urls.py` — Register new URL patterns

## Implementation Steps

1. Create `EmailTemplate` model in `plane/license/models/email_template.py`
   - Extend BaseModel, add slug/subject/html_content/is_active fields
   - Add unique constraint on slug

2. Update `plane/license/models/__init__.py` to export EmailTemplate

3. Generate and review migration: `python manage.py makemigrations license` (creates in `plane/license/migrations/`, NOT `plane/db/migrations/`)
   <!-- Updated: Validation Session 19 - License app has own migrations dir -->

4. Create serializer in `plane/license/api/serializers/email_template.py`
   - ModelSerializer with computed fields (has_override, variables from registry)

5. Create view in `plane/license/api/views/email_template.py`
   - Extend BaseAPIView
   - `list()`: Call `ensure_all_templates()` first (auto-creates missing DB records from registry), then return all templates as JSON (no serializer)
   - `retrieve()`: Return template detail via serializer. If html_content is empty (no override), populate response with file template content (read-through, don't save to DB). Editor always shows content.
   <!-- Updated: Validation Session 16 - Retrieve populates file content when no override -->
   - `update()`: Save/update HTML content in DB via serializer. Reject `is_active=False` for critical templates (registry `critical=True`) → return 400 error.
   <!-- Updated: Validation Session 18 - Critical templates cannot be disabled -->
   - `reset()`: Clear html_content (set empty) + reset subject to registry default_subject (keep record for stable UUID), NOT delete
     <!-- Updated: Validation Session 16 - Reset re-sets subject to default_subject instead of empty -->
     <!-- Updated: Validation Session 9 - List auto-creates records, reset clears content instead of deleting -->
   - `preview()`: Render template directly via Template() + Context(sample_data). Catch TemplateSyntaxError → return 400 with error detail. Does NOT use render_email_template() fallback — admin needs to see syntax errors.
   <!-- Updated: Validation Session 13 - Preview renders directly, returns syntax errors to admin -->
   - `test_send()`: Accept `{"email": "test@example.com"}`, dispatch `send_test_email_template_task` Celery task, return 202 Accepted
   <!-- Updated: Validation Session 8 - List bypasses serializer, test-send via Celery -->

6. Update `plane/license/api/views/__init__.py` to export

7. Create `send_test_email_template_task.py` Celery task
   <!-- Updated: Validation Session 12 - Detailed Celery task implementation step -->
   - Shared task accepting `template_id` (UUID) and `email` (str)
   - Fetch EmailTemplate by id, get slug
   - Call `render_email_template(slug, registry_sample_data)` to get (subject, html)
   - Send via existing email util (`send_mail` or project's email helper)
   - Handle errors: template not found, render failure, SMTP error → log error and return (NO auto-retry — test email is manual action, admin clicks again if needed)
   <!-- Updated: Validation Session 14 - No Celery retry for test-send task -->

8. Register URL patterns in `plane/license/urls.py`

## Todo List

- [ ] Create EmailTemplate model
- [ ] Generate migration
- [ ] Create serializer
- [ ] Create API view (list, retrieve, update, reset)
- [ ] Add preview endpoint
- [ ] Add test-send endpoint
- [ ] Create send_test_email_template_task Celery task (render via render_email_template() + send via existing email util)
- [ ] Register URLs
- [ ] Update **init** exports
- [ ] Write backend tests for API endpoints (list, retrieve, update, reset, preview, test-send)
<!-- Updated: Validation Session 12 - Tests inline per phase -->

## Success Criteria

- All CRUD endpoints respond correctly with proper auth
- Preview returns rendered HTML with sample variables populated
- Test-send delivers email to specified address
- Resetting a template clears html_content and resets subject to default_subject (record kept for stable UUID)
- Retrieve returns file template content when no DB override (editor always shows content)

## Risk Assessment

- **Template syntax errors**: render_email_template() catches TemplateSyntaxError → fallback to file template + log warning (email safe). Preview endpoint returns 400 error to admin (feedback).
<!-- Updated: Validation Session 13 - Dual behavior: bgtask fallback safe, preview shows error -->
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
