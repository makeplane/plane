# Security Audit: Remove External Calls for Government Deployment

**Priority:** CRITICAL - Data exfiltration risk
**Type:** Security hardening
**Date:** 2025-12-20

## Executive Summary

This audit identified **multiple active data exfiltration vectors** that send sensitive government data to external servers. These must be removed before government deployment.

## Risk Classification

| Risk Level | Description |
|------------|-------------|
| 🔴 CRITICAL | Active network calls sending user/workspace data to external servers |
| 🟠 HIGH | External image loads in emails (tracking pixels), upgrade prompts |
| 🟡 MEDIUM | Links to external sites (no data sent, but inappropriate for gov) |
| 🟢 LOW | Test fixtures, documentation examples |

---

## 🔴 CRITICAL: Active Data Exfiltration

### 1. OpenTelemetry Traces to plane.so

**File:** `apps/api/plane/utils/telemetry.py:34`
```python
otel_endpoint = os.environ.get("OTLP_ENDPOINT", "https://telemetry.plane.so")
```

**Risk:** Sends request traces to Plane's telemetry server by default.

**Action:** Stub out or remove entirely.

---

### 2. Instance Traces Task (Every 6 Hours)

**File:** `apps/api/plane/license/bgtasks/tracer.py`
**Celery Schedule:** `apps/api/plane/celery.py:31-34`

```python
"run-every-6-hours-for-instance-trace": {
    "task": "plane.license.bgtasks.tracer.instance_traces",
    "schedule": crontab(hour="*/6", minute=0),
},
```

**Data Sent to `telemetry.plane.so`:**
- Instance ID, name, domain, version
- `is_telemetry_enabled`, `is_verified`, `edition`
- User count, workspace count, project count
- Issue count, module count, cycle count, page count
- **Per-workspace breakdown** including workspace slugs

**Action:** Remove scheduled task from celery.py and delete/stub tracer.py.

---

### 3. PostHog Event Tracking

**File:** `apps/api/plane/bgtasks/event_tracking_task.py`

**Data Sent:**
- User email and ID
- IP address
- User agent
- Auth events (sign in, sign up)
- Workspace invite events

**Action:** Delete file entirely or stub to no-op.

---

### 4. GitHub API Version Check

**File:** `apps/api/plane/license/management/commands/register_instance.py:39`
```python
requests.get("https://api.github.com/repos/makeplane/plane/releases/latest")
```

**Action:** Remove or make optional.

---

## 🟠 HIGH: Email Templates (Tracking Pixels + External Links)

All email templates load external images (potential tracking) and contain marketing links.

### Files to Clean (10 templates):

| File | Issues |
|------|--------|
| `apps/api/templates/emails/auth/magic_signin.html` | Logo from media.docs.plane.so, social links |
| `apps/api/templates/emails/auth/forgot_password.html` | Logo from media.docs.plane.so, social links |
| `apps/api/templates/emails/invitations/project_invitation.html` | Logo, Discord, Twitter, LinkedIn, GitHub links |
| `apps/api/templates/emails/invitations/workspace_invitation.html` | Logo, Twitter, LinkedIn, GitHub, plane.so links |
| `apps/api/templates/emails/notifications/issue-updates.html` | Logo from media.docs.plane.so |
| `apps/api/templates/emails/notifications/project_addition.html` | Logo, Discord, Twitter, GitHub, LinkedIn links |
| `apps/api/templates/emails/notifications/webhook-deactivate.html` | Logo, GitHub, LinkedIn, Twitter, plane.so links |
| `apps/api/templates/emails/user/user_activation.html` | Logo, Discord, Twitter, GitHub, LinkedIn links |
| `apps/api/templates/emails/user/user_deactivation.html` | Logo, Discord, Twitter, GitHub, LinkedIn links |
| `apps/api/templates/emails/user/email_updated.html` | Logo, GitHub, LinkedIn, Twitter links |

**External URLs Found:**
- `https://media.docs.plane.so/logo/new-logo-white.png` (in all templates - tracking pixel risk)
- `https://sendinblue-templates.s3.eu-west-3.amazonaws.com/icons/*` (social icons)
- `https://creative-assets.mailinblue.com/editor/social-icons/*` (social icons)
- `https://twitter.com/planepowers`
- `https://discord.gg/A92xrEGCge`
- `https://discord.com/channels/1031547764020084846/1094927053867995176`
- `https://www.linkedin.com/company/planepowers/`
- `https://github.com/makeplane` and `https://github.com/makeplane/plane`
- `https://plane.so/`

**Action:**
1. Replace external logo URL with inline base64 or remove
2. Remove entire social links footer section from all templates
3. Remove all sendinblue/mailinblue CDN references

---

## 🟠 HIGH: Frontend Components with External Links

### Upgrade/Pro Prompts (return null)
| File | External URL |
|------|--------------|
| `apps/admin/ce/components/common/upgrade-button.tsx:11` | `https://plane.so/pricing?mode=self-hosted` |
| `apps/web/ce/components/pages/editor/embed/issue-embed-upgrade-card.tsx:24` | `https://plane.so/pro` |
| `apps/web/core/constants/plans.tsx:1234` | `https://plane.so/talk-to-sales` |

### Documentation/Help Links (remove or stub)
| File | External URL |
|------|--------------|
| `apps/admin/app/(all)/(dashboard)/sidebar-help-section.tsx:20` | `https://docs.plane.so/` |
| `apps/admin/app/(all)/(dashboard)/sidebar-help-section.tsx:30` | `https://github.com/makeplane/plane/issues/new/choose` |
| `apps/admin/app/(all)/(dashboard)/ai/form.tsx:126` | `https://plane.so/contact` |
| `apps/admin/app/(all)/(dashboard)/general/form.tsx:124` | `https://developers.plane.so/self-hosting/telemetry` |
| `apps/admin/core/components/instance/setup-form.tsx:331` | `https://developers.plane.so/self-hosting/telemetry` |
| `apps/web/core/components/integration/guide.tsx:86` | `https://docs.plane.so/importers/github` |

### Social/Marketing Links (remove)
| File | External URL |
|------|--------------|
| `apps/web/app/(all)/[workspaceSlug]/(projects)/star-us-link.tsx:33` | `https://github.com/makeplane/plane` |
| `apps/web/core/components/global/product-updates/fallback.tsx:13-14` | `https://plane.so/changelog` |
| `apps/space/app/error.tsx:17-18` | `mailto:support@plane.so` |
| `apps/space/app/error.tsx:22-27` | `https://discord.com/invite/A92xrEGCge` |

### Meta Tags (update or remove)
| File | Issue |
|------|-------|
| `apps/admin/app/root.tsx:61` | `og:url` → `https://plane.so/` |
| `apps/space/app/root.tsx:72` | `og:url` → `https://sites.plane.so/` |
| `apps/space/app/root.tsx:78` | `twitter:site` → `@planepowers` |
| `apps/admin/app/root.tsx:67` | `twitter:site` → `@planepowers` |
| `apps/space/app/root.tsx:23` | Description mentions `plane.so` |

---

## 🟠 HIGH: Admin Panel Intercom Config

Files containing Intercom configuration UI that should be removed:
- `apps/admin/app/(all)/(dashboard)/general/intercom.tsx` (entire file)
- `apps/admin/app/(all)/(dashboard)/general/form.tsx:13,42-47,110` (IntercomConfig import/usage)

**Action:** Remove Intercom config component and references.

---

## 🟡 MEDIUM: Backend Configuration Cleanup

### Instance API Exposes Telemetry/Intercom Config
**File:** `apps/api/plane/license/api/views/instance.py:58-63, 108-130, 152-170`

Exposes to frontend:
- `POSTHOG_API_KEY`, `POSTHOG_HOST`
- `IS_INTERCOM_ENABLED`, `INTERCOM_APP_ID`

**Action:** Remove these from the API response or always return empty/disabled.

### Instance Config Variables
**File:** `apps/api/plane/utils/instance_config_variables/core.py:209-217`

Contains Intercom default config:
```python
"IS_INTERCOM_ENABLED": "1"  # Default enabled!
```

**Action:** Change defaults to disabled or remove.

### Settings File
**File:** `apps/api/plane/settings/common.py:328-334`
```python
ANALYTICS_SECRET_KEY = os.environ.get("ANALYTICS_SECRET_KEY", False)
ANALYTICS_BASE_API = os.environ.get("ANALYTICS_BASE_API", False)
POSTHOG_API_KEY = os.environ.get("POSTHOG_API_KEY", False)
POSTHOG_HOST = os.environ.get("POSTHOG_HOST", False)
```

**Action:** Remove or ensure defaults are False/disabled.

### OpenAPI Documentation
**File:** `apps/api/plane/settings/openapi.py:15,19-20,25,44`

Contains:
- `developers.plane.so` documentation links
- `https://plane.so` contact URL
- `support@plane.so` email
- `https://api.plane.so` as production server

**Action:** Update to reflect internal deployment or remove.

### Default Email From
**File:** `apps/api/plane/license/utils/instance_value.py:52`
```python
"default": os.environ.get("EMAIL_FROM", "Team Plane <team@mailer.plane.so>")
```

**Action:** Change default to a placeholder.

---

## 🟡 MEDIUM: Package Dependencies

### Frontend (apps/web/package.json)
```json
"@intercom/messenger-js-sdk": "^0.0.12",
"@posthog/react": "^1.4.0",
"posthog-js": "^1.255.1",
```

### Backend (apps/api/requirements/base.txt:54)
```
posthog==3.5.0
```

**Action:** Consider removing from package files (optional since code is stubbed).

---

## 🟢 LOW: Acceptable External Calls

These are **expected** and **user-initiated**:

1. **OAuth Providers** (only when user configures):
   - GitHub OAuth (`github.com/login/oauth`)
   - Google OAuth (`accounts.google.com`)
   - GitLab OAuth (configurable host)
   - Gitea OAuth (configurable host)

2. **Unsplash API** (`api.unsplash.com`) - only if user searches for cover images

3. **User-configured Webhooks** - sends to user-specified endpoints

4. **Integration APIs** - Jira, GitHub imports (user-initiated)

---

## 🟢 LOW: Test Fixtures (No Action Needed)

Files using `@plane.so` emails in tests - these are fine:
- `apps/api/plane/tests/factories.py`
- `apps/api/plane/tests/conftest.py`
- `apps/api/plane/tests/contract/app/test_*.py`
- `apps/api/plane/seeds/data/issues.json`

---

## Implementation Checklist

### Phase 1: CRITICAL - Active Data Exfiltration
- [ ] Stub `apps/api/plane/utils/telemetry.py` to no-op
- [ ] Delete or stub `apps/api/plane/license/bgtasks/tracer.py`
- [ ] Remove `instance_traces` task from `apps/api/plane/celery.py:31-34`
- [ ] Stub `apps/api/plane/bgtasks/event_tracking_task.py` to no-op
- [ ] Remove GitHub API call from `register_instance.py:38-40`

### Phase 2: HIGH - Email Templates
- [ ] Create local logo asset or use inline base64
- [ ] Update all 10 email templates:
  - Replace external logo URL
  - Remove entire social footer section
  - Remove all sendinblue/mailinblue CDN references

### Phase 3: HIGH - Frontend Components
- [ ] Stub `apps/admin/ce/components/common/upgrade-button.tsx` → return null
- [ ] Stub `apps/web/ce/components/pages/editor/embed/issue-embed-upgrade-card.tsx` → return null
- [ ] Remove/stub `apps/web/app/(all)/[workspaceSlug]/(projects)/star-us-link.tsx`
- [ ] Stub `apps/web/core/components/global/product-updates/fallback.tsx` → return null
- [ ] Remove external links from `apps/admin/app/(all)/(dashboard)/sidebar-help-section.tsx`
- [ ] Remove telemetry doc links from admin general/setup forms
- [ ] Update/remove meta tags in `apps/admin/app/root.tsx` and `apps/space/app/root.tsx`
- [ ] Fix `apps/space/app/error.tsx` - remove support@plane.so and Discord links

### Phase 4: HIGH - Admin Intercom Config
- [ ] Delete `apps/admin/app/(all)/(dashboard)/general/intercom.tsx`
- [ ] Remove IntercomConfig from `apps/admin/app/(all)/(dashboard)/general/form.tsx`

### Phase 5: MEDIUM - Backend Config
- [ ] Update `apps/api/plane/license/api/views/instance.py` to not expose PostHog/Intercom
- [ ] Update `apps/api/plane/utils/instance_config_variables/core.py` - disable Intercom default
- [ ] Update `apps/api/plane/settings/openapi.py` - remove plane.so references
- [ ] Update `apps/api/plane/license/utils/instance_value.py` - change default EMAIL_FROM

### Phase 6: OPTIONAL - Package Cleanup
- [ ] Remove posthog, intercom packages from package.json files
- [ ] Remove posthog from requirements.txt

---

## Verification Commands

After implementation, verify with:

```bash
# Check for remaining external URLs (excluding tests)
grep -r "plane\.so" apps/ --include="*.py" --include="*.tsx" --include="*.ts" --include="*.html" | grep -v test | grep -v __pycache__ | grep -v node_modules

# Check for tracking services
grep -r "posthog\|intercom\|telemetry\.plane" apps/ --include="*.py" --include="*.tsx" | grep -v test | grep -v __pycache__ | grep -v node_modules

# Check for social media links
grep -r "twitter\.com\|discord\.\|linkedin\.com\|github\.com/makeplane" apps/ --include="*.html" --include="*.tsx" | grep -v test

# Check for external CDN references
grep -r "sendinblue\|mailinblue\|media\.docs\.plane" apps/
```

**Network-level verification (strongly recommended):**
1. Run application in isolated network environment
2. Monitor outbound connections with `tcpdump`, Wireshark, or proxy
3. Verify ZERO connections to:
   - `*.plane.so`
   - `posthog.*`
   - `intercom.*`
   - Any social media domains
4. Expected connections (user-initiated only):
   - Configured OAuth providers
   - User-configured webhooks
   - User-configured integrations

---

## References

- Previous PR: #14 (infrastructure simplification)
- Files already stubbed in PR #14:
  - `posthog-provider.tsx` - returns children only
  - `event-tracker.helper.ts` - all functions are no-ops
  - `use-chat-support.ts` - returns `isEnabled: false`
  - `chat-support-modal.tsx` - returns null
