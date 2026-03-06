# Phase 2: Template Registry

## Context Links

- [Phase 1: Backend Model & API](./phase-01-backend-model-and-api.md)
- [Email bgtasks](../../apps/api/plane/bgtasks/)
- [Email templates](../../apps/api/templates/emails/)

## Overview

- **Priority**: P1 (required for list/preview to work)
- **Status**: pending
- **Description**: Central registry mapping template slugs to file paths, variable definitions, and sample data. Update email-sending bgtasks to check DB first.

## Key Insights

- 12 unique templates (magic_signin listed twice in research — deduplicate)
- Each bgtask builds its own context dict — variable names extractable from these
- `render_to_string` is the single integration point for override logic

## Requirements

### Functional

- Registry defines: slug, display name, category, file path, variables list, sample data
- Utility function `render_email_template(slug, context)` replaces direct `render_to_string` calls
- DB override takes priority over file template
- Subject line also overridable from DB (fallback to hardcoded in bgtask)
<!-- Updated: Validation Session 1 - subject override support -->

### Non-functional

- Zero breaking changes to existing email flow
- No performance regression (DB lookup adds 1 query per email send)

## Architecture

### Registry Structure

```python
# plane/license/utils/email_template_registry.py
TEMPLATE_REGISTRY = {
    "auth/magic_signin": {
        "name": "Magic Sign-In",
        "category": "auth",
        "file_path": "emails/auth/magic_signin.html",
        "variables": [
            {"key": "code", "label": "Login Code", "type": "string"},
            {"key": "email", "label": "Recipient Email", "type": "string"},
        ],
        "sample_data": {
            "code": "123456",
            "email": "user@example.com",
        },
    },
    # ... 11 more templates
}
```

### Override Utility

```python
def render_email_template(slug: str, context: dict) -> tuple[str, str]:
    """Render email template with DB override fallback to file.
    Returns (subject, html_body). Subject empty string if no override."""
    subject = ""
    try:
        template = EmailTemplate.objects.get(slug=slug, is_active=True)
        from django.template import Template, Context
        t = Template(template.html_content)
        html = t.render(Context(context))
        subject = template.subject or ""
        return (subject, html)
    except EmailTemplate.DoesNotExist:
        registry = TEMPLATE_REGISTRY.get(slug)
        if registry:
            return (subject, render_to_string(registry["file_path"], context))
        raise ValueError(f"Unknown template: {slug}")
```

### Template Inventory (12 templates)

| Slug                               | Category      | Variables                                                            |
| ---------------------------------- | ------------- | -------------------------------------------------------------------- |
| `auth/magic_signin`                | Auth          | code, email                                                          |
| `auth/forgot_password`             | Auth          | email, forgot_password_url                                           |
| `invitations/workspace_invitation` | Invitations   | first_name, workspace_name, abs_url, email                           |
| `invitations/project_invitation`   | Invitations   | first_name, project_name, workspace_name, abs_url, email             |
| `notifications/project_addition`   | Notifications | project_name, workspace_name, email, inviter_first_name, project_url |
| `notifications/issue_updates`      | Notifications | (complex — issue data, summary)                                      |
| `notifications/webhook_deactivate` | Notifications | webhook_url, workspace_name                                          |
| `user/user_activation`             | User          | email                                                                |
| `user/user_deactivation`           | User          | email                                                                |
| `user/email_updated`               | User          | old_email, new_email                                                 |
| `exports/analytics`                | Exports       | email, first_name                                                    |
| `test_email`                       | System        | email                                                                |

## Related Code Files

### Create

- `apps/api/plane/license/utils/email_template_registry.py` — Registry + render utility

### Modify

- `apps/api/plane/bgtasks/project_add_user_email_task.py` — Use `render_email_template`
- `apps/api/plane/bgtasks/user_activation_email_task.py` — Use `render_email_template`
- `apps/api/plane/bgtasks/user_deactivation_email_task.py` — Use `render_email_template`
- `apps/api/plane/bgtasks/user_email_update_task.py` — Use `render_email_template`
- `apps/api/plane/bgtasks/email_notification_task.py` — Use `render_email_template`
- (+ remaining bgtask files that call render_to_string for emails)

## Implementation Steps

1. Create `plane/license/utils/email_template_registry.py`
   - Define TEMPLATE_REGISTRY dict with all 12 templates
   - Each entry: name, category, file_path, variables (list of {key, label, type}), sample_data

2. Add `render_email_template(slug, context)` utility in same file
   - Try DB lookup first (EmailTemplate with matching slug + is_active)
   - Fall back to file-based `render_to_string`
   - Wrap in try/except for template syntax errors

3. Add `get_all_templates()` helper for list endpoint
   - Merge registry metadata with DB override status (has_override, updated_at)

4. Update bgtask files to use `render_email_template` instead of direct `render_to_string`
   - Unpack tuple: `subject, html = render_email_template("slug", context)`
   - Use DB subject with fallback: `subject = subject or "Hardcoded Subject Here"`
   - Each bgtask file: ~2-3 line change
   <!-- Updated: Validation Session 5 - subject unpacking pattern -->

5. Verify each bgtask's context dict matches registry variable definitions

## Todo List

- [ ] Create template registry with all 12 templates
- [ ] Implement render_email_template utility
- [ ] Implement get_all_templates helper
- [ ] Update project_add_user_email_task.py
- [ ] Update user_activation_email_task.py
- [ ] Update user_deactivation_email_task.py
- [ ] Update user_email_update_task.py
- [ ] Update email_notification_task.py
- [ ] Update remaining bgtask files (forgot_password, magic_signin, invitations, etc.)
- [ ] Verify sample_data completeness for each template

## Success Criteria

- `render_email_template` correctly falls back to file when no DB override exists
- All existing email sends work unchanged (regression test)
- Registry provides accurate variable metadata for each template

## Risk Assessment

- **Breaking existing emails**: Mitigated by fallback to file; test thoroughly
- **Template syntax in DB override**: Invalid Django template syntax → catch `TemplateSyntaxError`, return error
- **Performance**: 1 extra DB query per email send; negligible for email volume

## Security Considerations

- `render_email_template` uses Django's Template engine (sandboxed, no code execution)
- Only admin-created content rendered — not user input
