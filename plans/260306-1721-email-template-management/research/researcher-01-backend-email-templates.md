# Backend Email Template System Research

## Template Location

All HTML email templates stored in: `/apps/api/templates/emails/`

## Template Inventory

### Found Template Paths (13 total)

- `emails/auth/magic_signin.html` — Login code delivery
- `emails/auth/forgot_password.html` — Password reset link
- `emails/auth/magic_signin.html` — Email change verification
- `emails/invitations/workspace_invitation.html` — Workspace join invite
- `emails/invitations/project_invitation.html` — Project join invite
- `emails/notifications/project_addition.html` — User added to project
- `emails/notifications/issue-updates.html` — Issue activity digest
- `emails/notifications/webhook-deactivate.html` — Webhook disabled alert
- `emails/user/user_activation.html` — Account activation
- `emails/user/user_deactivation.html` — Account deactivation
- `emails/user/email_updated.html` — Email change confirmation
- `emails/exports/analytics.html` — Analytics export
- `emails/test_email.html` — Test email

## Template Variable Structure

### magic_signin.html

- `{{code}}` — 6-digit login code
- `{{email}}` — Recipient email address (display only)
- Variables in preheader + body text

### workspace_invitation.html

- `{{first_name}}` — Inviter display name (fallback: email)
- `{{workspace_name}}` — Target workspace name
- `{{abs_url}}` — Complete invitation link with token
- `{{email}}` — Recipient email address (display only)
- Variables in title, preheader, heading, body, footer

## render_to_string Usage Pattern

**Location:** `apps/api/plane/bgtasks/` — 13 bgtask files

**Syntax:**

```python
html_content = render_to_string("emails/{category}/{template}.html", context)
```

**Context Dictionary Pattern:**

```python
context = {
    "email": recipient_email,
    "first_name": user.first_name or user.display_name or user.email,
    "workspace_name": workspace.name,
    "abs_url": absolute_url_with_token,
    # Additional vars per template
}
html_content = render_to_string("emails/invitations/workspace_invitation.html", context)
text_content = generate_plain_text_from_html(html_content)
```

**Typical Flow:**

1. Render HTML from template + context dict
2. Generate plain text via `generate_plain_text_from_html()`
3. Create `EmailMultiAlternatives` message
4. Send via configured SMTP connection

## InstanceConfiguration Model

**Location:** `apps/api/plane/license/models/instance.py` (lines 72-83)

**Fields:**

- `key` (CharField, max_length=100, unique) — Config identifier
- `value` (TextField, nullable) — Configuration value
- `category` (TextField) — Logical grouping
- `is_encrypted` (BooleanField, default=False) — Encryption flag
- `id`, `created_at`, `updated_at` — From BaseModel
- `created_by`, `updated_by` — From BaseModel (audit fields)

**Current Usage:**
Email config retrieved via `get_email_configuration()` utility → returns 7 email parameters (host, user, password, port, TLS, SSL, from address)

**Extensibility:**

- `category` field allows grouping custom template configs
- `is_encrypted` enables secure storage for sensitive template vars
- `value` can store JSON for complex configs

## Key Findings

1. **Template Syntax:** Django template language `{{ variable }}` with no custom filters observed
2. **No Dynamic Rendering:** Templates are static HTML; all variables injected via context dict
3. **Consistent Structure:** All templates use same email layout (header, body, footer)
4. **Existing Config Model:** InstanceConfiguration can extend to store template overrides
5. **No Admin UI:** Templates managed via git; no database storage for customization

## Implications for Template Management

- Templates can be extended to accept custom variables via InstanceConfiguration
- Template catalog needs listing mechanism (no built-in discovery)
- Override strategy: store custom template paths or variables in InstanceConfiguration
- Plain text generation happens post-render; no template inheritance layer
