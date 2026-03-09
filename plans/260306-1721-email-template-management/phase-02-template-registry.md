# Phase 2: Template Registry

> **Note:** Merged with Phase 1 as single implementation unit (Validation Session 12). Implement after Phase 1 model/API, before moving to frontend.

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
        "critical": True,  # Updated: Validation Session 18 - Cannot be disabled
        "variables": [
            {"key": "code", "label": "Login Code", "type": "string"},
            {"key": "email", "label": "Recipient Email", "type": "string"},
        ],
        "default_subject": "Your Login Code",
        "sample_data": {
            "code": "123456",
            "email": "user@example.com",
        },
    },
    <!-- Updated: Validation Session 7 - default_subject added to all registry entries -->
    <!-- Updated: Validation Session 18 - critical=True for auth/* templates (cannot be disabled) -->
    # ... 11 more templates
}
```

### Override Utility

```python
def render_email_template(slug: str, context: dict) -> tuple[str, str] | None:
    """Render email template with DB override fallback to file.
    Returns (subject, html_body) or None if template is disabled."""
    # Updated: Validation Session 18 - Returns None when disabled (block send)
    registry = TEMPLATE_REGISTRY.get(slug)
    if not registry:
        raise ValueError(f"Unknown template: {slug}")
    default_subject = registry.get("default_subject", "")
    try:
        template = EmailTemplate.objects.get(slug=slug)
        if not template.is_active:
            # Updated: Validation Session 18 - Disabled template = block email send, return None
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Template '{slug}' is disabled, skipping email send")
            return None
        if template.html_content:  # Has override
            from django.template import Template, Context
            try:
                t = Template(template.html_content)
                html = t.render(Context(context))
                subject = template.subject or default_subject
                return (subject, html)
            except TemplateSyntaxError:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"TemplateSyntaxError in DB template '{slug}', falling back to file template")
                return (default_subject, render_to_string(registry["file_path"], context))
        # Empty content = reset state, use file fallback
        return (default_subject, render_to_string(registry["file_path"], context))
    except EmailTemplate.DoesNotExist:
        return (default_subject, render_to_string(registry["file_path"], context))
    # Updated: Validation Session 9 - Return registry default_subject in fallback, handle reset state
    # Updated: Validation Session 13 - Catch TemplateSyntaxError, fallback to file template + log warning
    # Updated: Validation Session 18 - is_active=False returns None (block send), not fallback
```

### Template Inventory (12 templates)

| Slug                               | Category      | Critical | Variables                                                            |
| ---------------------------------- | ------------- | -------- | -------------------------------------------------------------------- |
| `auth/magic_signin`                | Auth          | Yes      | code, email                                                          |
| `auth/forgot_password`             | Auth          | Yes      | email, forgot_password_url                                           |
| `invitations/workspace_invitation` | Invitations   | No       | first_name, workspace_name, abs_url, email                           |
| `invitations/project_invitation`   | Invitations   | No       | first_name, project_name, workspace_name, abs_url, email             |
| `notifications/project_addition`   | Notifications | No       | project_name, workspace_name, email, inviter_first_name, project_url |
| `notifications/issue_updates`      | Notifications | No       | (complex — issue data, summary) — `complex: True`                    |

<!-- Updated: Validation Session 20 - complex flag for templates with heavy template tag usage -->

| `notifications/webhook_deactivate` | Notifications | No | webhook_url, workspace_name |
| `user/user_activation` | User | No | email |
| `user/user_deactivation` | User | No | email |
| `user/email_updated` | User | No | old_email, new_email |
| `exports/analytics` | Exports | No | email, first_name |
| `test_email` | System | No | email |

<!-- Updated: Validation Session 18 - Critical column added, auth/* templates marked critical -->

## Related Code Files

### Create

- `apps/api/plane/license/utils/email_template_registry.py` — Registry + render utility

### Modify

<!-- Updated: Validation Session 17 - Complete enumerated file list (11 files, 12 calls) -->

- `apps/api/plane/bgtasks/magic_link_code_task.py` — `auth/magic_signin`
- `apps/api/plane/bgtasks/forgot_password_task.py` — `auth/forgot_password`
- `apps/api/plane/bgtasks/workspace_invitation_task.py` — `invitations/workspace_invitation`
- `apps/api/plane/bgtasks/project_invitation_task.py` — `invitations/project_invitation`
- `apps/api/plane/bgtasks/project_add_user_email_task.py` — `notifications/project_addition`
- `apps/api/plane/bgtasks/email_notification_task.py` — `notifications/issue-updates` ⚠️ **SPECIAL HANDLING**: Has post-email logic (EmailNotificationLog.update + release_lock). Must ensure lock release runs even when template disabled — place None check after lock, use finally block.
  <!-- Updated: Validation Session 19 - Critical side effect: lock release must not be skipped -->
- `apps/api/plane/bgtasks/webhook_task.py` — `notifications/webhook-deactivate`
- `apps/api/plane/bgtasks/user_activation_email_task.py` — `user/user_activation`
- `apps/api/plane/bgtasks/user_deactivation_email_task.py` — `user/user_deactivation`
- `apps/api/plane/bgtasks/user_email_update_task.py` — `auth/magic_signin` + `user/email_updated` (2 calls)
- `apps/api/plane/bgtasks/analytic_plot_export.py` — `exports/analytics`
- `apps/api/plane/db/management/commands/test_email.py` — `test_email`

## Implementation Steps

1. Create `plane/license/utils/email_template_registry.py`
   - Define TEMPLATE_REGISTRY dict with all 12 templates
   - Each entry: name, category, file_path, variables (list of {key, label, type}), sample_data

2. Add `render_email_template(slug, context)` utility in same file
   - Try DB lookup first (EmailTemplate with matching slug + is_active)
   - Fall back to file-based `render_to_string`
   - Wrap in try/except for template syntax errors

3. Add `ensure_all_templates()` helper — auto-creates missing DB records from registry + cleans orphans
   - Called by list endpoint before querying
   - For each registry slug: if no DB record exists, bulk_create with empty html_content + default_subject
   - Use `bulk_create(ignore_conflicts=True)` for race condition safety (multiple API workers)
   <!-- Updated: Validation Session 20 - bulk_create(ignore_conflicts=True) for concurrency safety -->
   - Delete orphaned DB records: `EmailTemplate.objects.exclude(slug__in=registry_slugs).delete()`
   <!-- Updated: Validation Session 20 - Clean up orphans when registry changes -->
   - Ensures all 12 templates always have UUID in DB
   - Idempotent — safe to call multiple times
   - **Cache with flag**: Module-level `_templates_ensured = False`. After first successful run, set `True`. Skip on subsequent calls within same process. Resets on restart.
     <!-- Updated: Validation Session 9 - Auto-create DB records instead of virtual records -->
     <!-- Updated: Validation Session 11 - Cache with module-level flag for performance -->

4. Add `get_all_templates()` helper for list endpoint
   - Queries all EmailTemplate records (always 12 after ensure_all_templates)
   - Enriches with registry metadata (name, category, variables, sample_data)
   - Sets `has_override=True` when html_content is non-empty, `has_override=False` when empty
   - Frontend receives uniform data shape with real UUIDs
   <!-- Updated: Validation Session 7+9 - Real DB records, has_override based on content -->

5. Update bgtask files to use `render_email_template` instead of direct `render_to_string`
   - Call: `result = render_email_template("slug", context)`
   - Check: `if result is None: logger.info("Template disabled, skipping"); return`
   - Unpack: `subject, html = result`
   <!-- Updated: Validation Session 18 - Bgtask callers check for None return (disabled template) -->
   - Subject returned from render_email_template() is already resolved (DB override or registry default)
   - Bgtask simply uses returned subject — no hardcoded fallback needed. ~3-4 line change
   <!-- Updated: Validation Session 9 - Bgtask no longer needs hardcoded subject fallback -->
   - **Big bang migration**: Update ALL callers in single commit (no wrapper/v2 pattern)
     <!-- Updated: Validation Session 5 - subject unpacking pattern -->
     <!-- Updated: Validation Session 6 - Big bang migration strategy confirmed -->
   - ⚠️ **EXCEPTION: `email_notification_task.py`**: Has `release_lock()` + `EmailNotificationLog.update(sent_at=...)` after send. Place None check AFTER lock acquisition. Ensure `release_lock()` in finally block so lock is released regardless of template status.
   <!-- Updated: Validation Session 19 - email_notification_task.py has critical post-email side effects -->

6. Verify each bgtask's context dict matches registry variable definitions

## Todo List

- [ ] Create template registry with all 12 templates
- [ ] Implement render_email_template utility
- [ ] Implement ensure_all_templates helper (auto-create missing DB records)
- [ ] Implement get_all_templates helper (query DB + enrich with registry metadata)
- [ ] Update project_add_user_email_task.py
- [ ] Update user_activation_email_task.py
- [ ] Update user_deactivation_email_task.py
- [ ] Update user_email_update_task.py
- [ ] Update email_notification_task.py
- [ ] Update magic_link_code_task.py
- [ ] Update forgot_password_task.py
- [ ] Update workspace_invitation_task.py
- [ ] Update project_invitation_task.py
- [ ] Update webhook_task.py
- [ ] Update analytic_plot_export.py
- [ ] Update test_email.py management command
- [ ] Verify sample_data completeness for each template
- [ ] Add `complex: True` to `notifications/issue_updates` registry entry
<!-- Updated: Validation Session 20 - Complex template flag -->
- [ ] Write backend tests for render_email_template utility + ensure_all_templates + get_all_templates
<!-- Updated: Validation Session 12 - Tests inline per phase -->

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
- Rendering uses `Context()` only — NOT `RequestContext()`. No settings, request, or context processors exposed to template.
<!-- Updated: Validation Session 8 - Restrict rendering context for defense in depth -->
- Critical templates (auth/\*) cannot be disabled — prevents lockout scenarios (e.g., magic_signin disabled = no login)
<!-- Updated: Validation Session 18 - Critical template protection -->
