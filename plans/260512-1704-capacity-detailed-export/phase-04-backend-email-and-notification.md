# Phase 04 — Backend: Email + In-App Notification

## Context Links

- BE research §6 (email), §7 (Notification model)
- Pattern: `apps/api/plane/bgtasks/user_activation_email_task.py`

## Overview

- Priority: P1
- Status: pending
- Brief: Send transactional email with download link when export ready (or apology on failure). Notification row creation is co-located in Phase 03 task; this phase owns the email task + HTML templates + locale resolution.

## Key Insights

- Reuse `get_email_configuration()` and `EmailMultiAlternatives` pattern.
- Locale resolution (validated chain): `user.user_locale` → workspace default locale → `settings.LANGUAGE_CODE`. Verify `User.user_locale` field exists during implementation (grep `class User`); if absent, drop to 2-tier chain (workspace → settings).
- Workspace default locale: check `Workspace` model for a `default_locale`/`language` field; if not present, skip middle tier without error.

<!-- Updated: Validation Session 1 - 3-tier locale fallback confirmed -->

- Two templates: `export_ready.html`, `export_failed.html` (and plain-text fallback auto-generated).
- Email subject + body strings localized via Django `gettext` (separate from FE i18n).

## Requirements

**Functional**

- Task `capacity_export_email_task(job_id, is_failure=False)`:
  - Loads job, requester.
  - Resolves locale, activates translation.
  - Renders template with context: range, member count, row count, download URL (success only), expiry date, ts.
  - Sends via `EmailMultiAlternatives` (HTML + plain text).
- Failure email subject: `Capacity export failed`; body: apology + retry guidance + job id reference.
- Notification row creation lives in Phase 03 (synchronous within task) — this phase does not duplicate.

**Non-functional**

- Both task files + templates each <200 LOC.
- Silent fail with `log_exception` (do NOT crash worker).

## Architecture

```
capacity_export_email_task(job_id, is_failure)
├─ job = CapacityExportJob.objects.select_related("requested_by","workspace").get(id=job_id)
├─ locale = resolve_locale(job.requested_by)
├─ with translation.override(locale):
│    if is_failure:
│      subject = _("Capacity export failed")
│      template = "emails/capacity/export_failed.html"
│      context = { range, error_summary, support_link, job_id }
│    else:
│      subject = _("Your capacity report is ready ({from} – {to})").format(...)
│      template = "emails/capacity/export_ready.html"
│      context = { workspace_name, range, member_count, row_count, download_url, expires_at, generated_at, logo_url }
│    html = render_to_string(template, context)
│    text = generate_plain_text_from_html(html)
│    send via EmailMultiAlternatives
```

## Related Code Files

**Create**

- `apps/api/plane/bgtasks/capacity_export_email_task.py`
- `apps/api/plane/templates/emails/capacity/export_ready.html`
- `apps/api/plane/templates/emails/capacity/export_failed.html`

**Modify**

- (none new — Phase 03 enqueues this)

## Implementation Steps

1. Create both HTML templates following existing email style (logo, container, CTA button).
   - `export_ready.html`: workspace name, date range badge, member count, row count, big "Download report" button (`href={{ download_url }}`), expiry notice ("Link expires {{ expires_at|date:'Y-m-d' }}"), generated timestamp footer.
   - `export_failed.html`: apology, error reference (`Job ID: {{ job_id }}`), retry instruction, support contact.
2. Implement `resolve_locale(user, workspace)` helper (top of task file or in `plane/utils/locale.py`):
   - `getattr(user, "user_locale", None)` → `getattr(workspace, "default_locale", None) or getattr(workspace, "language", None)` → `settings.LANGUAGE_CODE`.
   - Return first non-empty value.
3. Implement `capacity_export_email_task` per architecture.
4. Use `django.utils.translation.override(locale)` context manager.
5. Wrap send in try/except; `log_exception(e)` on failure.

## Todo List

- [ ] export_ready.html template
- [ ] export_failed.html template
- [ ] resolve_locale helper
- [ ] Email task implementation
- [ ] Manual test: trigger success path → email arrives with working link
- [ ] Manual test: simulate failure → apology email arrives

## Success Criteria

- Recipient receives email within 60s of job ready.
- Download link works; clicking downloads XLSX.
- Failure email arrives on task error.
- Email renders in Gmail + Outlook (light + dark mode acceptable).

## Risk Assessment

| Risk                     | Likelihood | Impact | Mitigation                                            |
| ------------------------ | ---------- | ------ | ----------------------------------------------------- |
| Spam classification      | Med        | Med    | Reuse existing transactional sender (SPF/DKIM signed) |
| Locale missing on User   | Med        | Low    | Fallback to settings.LANGUAGE_CODE                    |
| Template rendering error | Low        | Med    | Try/except + log; failure email is plain fallback     |

## Security Considerations

- Download URL contains presigned signature — body warns "Do not forward".
- No raw PII beyond requester's own email + workspace metadata.

## Next Steps

- Phase 03 enqueues this; nothing else depends on it.
