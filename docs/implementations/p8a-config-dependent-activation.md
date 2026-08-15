# P8A Existing Configuration-Dependent Feature Activation

## Summary

P8A audited AI, SMTP, object storage, and the four existing OAuth sign-in providers against source. All four areas already exist. No missing product domains were built. Bounded readiness/runtime mismatches were fixed so `capabilities.*.ready` matches a callable existing flow, commercial leftover copy on existing AI UI was removed, and Admin readiness now names required configuration keys without exposing secrets.

## Method

Traced implementation from configuration keys through routes, tasks, UI, and `InstanceCapabilityService` (`apps/api/plane/license/utils/capabilities.py`). Compared P3A readiness, P3B Admin Readiness, boot flags on `GET /api/instances/`, and action-time checks. Searched target paths for `Upgrade`, `PRO`, `Enterprise`, `plan`, `subscription`, `license`, `edition`, `is_ee`, `isPaid`.

P7C (PR #12) is merged on `preview` (`aa2deb452d`). Remaining product features were already commercially unrestricted; this phase is configuration activation only.

## Capability table

| Capability     | Backend Exists                                                                      | Frontend Exists                                               | Config Required                                                                                                       | Ready Logic Accurate                                                                                                            | Commercial Gate                                            | Action                    |
| -------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------- |
| AI             | Yes (`GPTIntegrationEndpoint`, `WorkspaceGPTIntegrationEndpoint`, `get_llm_config`) | Yes (issue GPT popover / “I'm feeling lucky”)                 | `LLM_API_KEY`, `LLM_PROVIDER`, `LLM_MODEL`                                                                            | Yes after aligning `has_llm_configured` with provider+model+key                                                                 | Leftover 50-requests/month copy and Admin “contact us” CTA | Ready when configured     |
| SMTP           | Yes (invites, magic link, password reset, notifications, export email, test email)  | Yes (Admin Email; login magic-link uses `is_smtp_configured`) | `ENABLE_SMTP`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_FROM` (plus credentials for actual delivery)                        | Yes: capability `ready` still requires enable+host+port+from; boot `is_smtp_configured` stays `EMAIL_HOST` to match magic/reset | None                                                       | Existing/config-dependent |
| Object Storage | Yes (`S3Storage`, assets, export upload, signed URLs)                               | Yes (uploads/exports; Admin readiness)                        | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`                                                    | Yes after env-vs-settings alignment                                                                                             | None                                                       | Ready when configured     |
| Google OAuth   | Yes (`/auth/google/`, callback, `GoogleOAuthProvider`)                              | Yes (web/space login; Admin Google settings)                  | `IS_GOOGLE_ENABLED`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                                                       | Yes; login buttons now follow `capabilities.oauth.providers.google.ready`                                                       | None                                                       | Ready when configured     |
| GitHub OAuth   | Yes (`/auth/github/`, callback, `GitHubOAuthProvider`)                              | Yes                                                           | `IS_GITHUB_ENABLED`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`                                                       | Yes                                                                                                                             | None                                                       | Ready when configured     |
| GitLab OAuth   | Yes (`/auth/gitlab/`, callback, `GitLabOAuthProvider`)                              | Yes                                                           | `IS_GITLAB_ENABLED`, `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`, `GITLAB_HOST` (runtime default `https://gitlab.com`) | Yes after matching the provider host default                                                                                    | None                                                       | Ready when configured     |
| Gitea OAuth    | Yes (`/auth/gitea/`, callback, `GiteaOAuthProvider`)                                | Yes                                                           | `IS_GITEA_ENABLED`, `GITEA_CLIENT_ID`, `GITEA_CLIENT_SECRET`, `GITEA_HOST` (scheme required)                          | Yes; host remains required (no default)                                                                                         | None                                                       | Ready when configured     |

Statuses:

- **Ready when configured** — implementation exists; usable when instance configuration is present.
- **Existing/config-dependent** — implementation exists; delivery still depends on operator SMTP/storage credentials.

No source-absent items in this phase’s four areas.

## Existing implementation proof

### AI

- Routes: `apps/api/plane/app/urls/external.py` — `POST /api/workspaces/<slug>/projects/<project_id>/ai-assistant/` and workspace-level `.../ai-assistant/`
- Runtime: `apps/api/plane/app/views/external/base.py` — `get_llm_config()` requires a supported provider, API key, and a model in that provider’s list; otherwise 400. Completions go through the existing OpenAI SDK client (`OpenAI(api_key=...)`). Gemini only prefixes `gemini/` onto the model name; there is no separate Anthropic/Gemini HTTP adapter.
- Supported providers/models (existing lists, not new adapters):
  - `openai`: `gpt-3.5-turbo`, `gpt-4o-mini`, `gpt-4o`, `o1-mini`, `o1-preview` (default `gpt-4o-mini`)
  - `anthropic`: Claude 3.x / 2.x / instant list (default `claude-3-sonnet-20240229`)
  - `gemini`: `gemini-pro`, `gemini-1.5-pro-latest`, `gemini-pro-vision` (default `gemini-pro`)
- UI: `apps/web/core/components/issues/issue-modal/components/description-editor.tsx`, `apps/web/core/components/core/modals/gpt-assistant-popover.tsx`
- RBAC: project/workspace Admin and Member; guests 403
- Unconfigured: 400 `"LLM provider API key and model are required"`; no live provider call
- Admin: `apps/admin/app/(all)/(dashboard)/ai/form.tsx` now exposes existing `LLM_PROVIDER` (already in `instance_config_variables`)

### SMTP / email

Implemented flows:

- Workspace invitations: `apps/api/plane/bgtasks/workspace_invitation_task.py`
- Project invitations / add-user: `project_invitation_task.py`, `project_add_user_email_task.py`
- Magic link: `authentication/provider/credentials/magic_code.py`, `bgtasks/magic_link_code_task.py`
- Password reset: `authentication/views/app/password_management.py`, `bgtasks/forgot_password_task.py`
- Notifications: `bgtasks/email_notification_task.py`
- Analytic export email: `bgtasks/analytic_plot_export.py`
- Activation/deactivation/email-update: corresponding `bgtasks/`
- Admin test email: `license/api/views/configuration.py` `EmailCredentialCheckEndpoint`

Runtime senders use `get_email_configuration()` (`EMAIL_HOST`, user, password, port, TLS/SSL, `EMAIL_FROM`). Magic link and forgot-password gate on **`EMAIL_HOST` presence**, not `ENABLE_SMTP`. `ENABLE_SMTP` is the Admin enable/disable flag used by capability `enabled`/`ready`.

### Object storage / export delivery

- Upload/download: `apps/api/plane/settings/storage.py` `S3Storage` reads `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME` from the environment
- Django settings map `AWS_S3_BUCKET_NAME` → `AWS_STORAGE_BUCKET_NAME` with Compose defaults (`access-key` / `secret-key` / `uploads`)
- Exports: `apps/api/plane/bgtasks/export_task.py` uses Django settings + presigned GET URLs
- Presigned POST still enforces content type and `content-length-range`; signed URL expiry unchanged
- No backup/restore implementation (out of scope)

### OAuth

| Provider | Initiate / callback                                          | Login UI    | Host                                            |
| -------- | ------------------------------------------------------------ | ----------- | ----------------------------------------------- |
| Google   | `authentication/urls.py` + `views/app` and space equivalents | web + space | n/a                                             |
| GitHub   | same                                                         | web + space | n/a (optional org id is extra, not readiness)   |
| GitLab   | same                                                         | web + space | required; provider default `https://gitlab.com` |
| Gitea    | same                                                         | web + space | required; http/https scheme enforced            |

Providers check credentials (and host for GitLab/Gitea). They do not re-check `IS_*_ENABLED`; login buttons now require capability `ready` (enabled **and** configured). Direct `/auth/<provider>/` with credentials still initiates if the operator hits the URL. CSRF `state` comparison and Google `verified_email` remain.

## Readiness / runtime mismatches found and fixed

| Mismatch                       | Before                                                                                                                                                              | After                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| AI boot flag vs endpoint       | `config.has_llm_configured = bool(LLM_API_KEY)` so UI could show AI with an unsupported provider/model; endpoint then 400                                           | `has_llm_configured` = `capabilities.ai.ready` (key + supported provider + supported model)                                              |
| Object storage env vs settings | Capability used Django settings (defaults `access-key`/`uploads`) while `S3Storage` uses env `AWS_S3_BUCKET_NAME`. Env keys without a bucket could still look ready | If any AWS env credential/bucket is present, all three env values are required. Otherwise Django settings are used (export path / tests) |
| GitLab host                    | Capability required `GITLAB_HOST` with default `""`; provider defaults to `https://gitlab.com`                                                                      | Capability uses the same default host as `GitLabOAuthProvider`                                                                           |
| SMTP FROM                      | Capability treated empty `EMAIL_FROM` as unconfigured; senders default FROM via `get_email_configuration()`                                                         | Capability uses the same FROM default as senders                                                                                         |
| OAuth login buttons            | Shown when `IS_*_ENABLED` even if client ID/secret/host missing                                                                                                     | Web and Space buttons use `capabilities.oauth.providers.*.ready`                                                                         |
| AI commercial copy             | 429 toast claimed “50 requests per month per user”; Admin AI form linked to plane.so/contact                                                                        | Generic rate-limit toast; self-hosted configuration note. Backend has no monthly AI quota                                                |
| Admin AI provider              | Form only edited `LLM_MODEL` / `LLM_API_KEY` although `LLM_PROVIDER` already exists                                                                                 | Form wires existing `LLM_PROVIDER`                                                                                                       |
| Capability schema test         | Contract test omitted `policy` after P6                                                                                                                             | Test expects `policy` and asserts no paid requirement / no secrets                                                                       |

Not changed (legitimate, documented):

- `config.is_smtp_configured` remains `bool(EMAIL_HOST)` because magic-link and password-reset are callable with host alone.
- Capability `smtp.ready` remains `ENABLE_SMTP` **and** host/port/from. Admin disable (`ENABLE_SMTP=0`) is operator intent. Celery senders still do not re-read `ENABLE_SMTP` if `EMAIL_HOST` remains in env after a disable that did not clear env — pre-existing sender behavior, not a commercial gate.
- Anthropic/Gemini labels still share the OpenAI-compatible client. That is existing implementation, not a new provider.
- OAuth initiate does not additionally require `IS_*_ENABLED` (UI already hides non-ready providers).

## Commercial gates

No backend plan/edition/license rejection on these four areas. Removed/normalized presentation only:

- Monthly AI quota toast (no matching backend limit)
- Admin AI “get in touch with us” sales CTA

Upgrade/PRO billing surfaces remain hosted-only as in P6/P7C.

## Security confirmation

- Capability and boot APIs still return booleans/status only. Tests assert `llm-secret`, `oauth-secret`, `smtp-secret`, and S3 keys are absent from `GET /api/instances/`.
- SMTP passwords, OAuth secrets, LLM keys, and storage keys are not added to readiness UI.
- OAuth `state` checks, Google verified-email, Gitea host scheme check, signed URL expiry, presigned POST size/MIME conditions, auth throttles, and workspace/project RBAC are unchanged.
- AI guest access remains 403.
- No SSRF, redirect-validation, or tenant-isolation changes.

## Tests

Backend (Docker):

```bash
docker compose -f docker-compose-test.yml run --rm api-tests pytest \
  plane/tests/unit/license/test_capabilities.py \
  plane/tests/contract/license/test_instance_capabilities.py \
  plane/tests/contract/app/test_config_dependent_activation.py -q
# 24 passed in 95.67s

docker compose -f docker-compose-test.yml run --rm api-tests pytest \
  plane/tests/contract/app/test_self_hosted_unlimited.py::TestSelfHostedPolicyEndpoint -q
# 3 passed in 30.52s
```

Frontend: `oxfmt --check` on changed files passed; `oxlint --deny-warnings` on new/edited TS without pre-existing warnings passed; `@plane/types` build plus Admin and Space `check:types` passed.

Coverage:

- AI ready / missing key / invalid provider / unsupported model; no secret leakage
- SMTP disabled vs enabled+configured
- Object storage missing, settings-configured, env bucket missing
- OAuth none / one / multiple / GitLab default host / Gitea without host
- Public instance capabilities include `policy`, `has_llm_configured` matches AI ready, no secrets
- AI assistant 400 when unconfigured (provider not called); 200 with mocked completion; guest 403
- Self-hosted policy still `commercial_gating: false` with null limits

No live OpenAI, SMTP, S3, or OAuth network calls.

## Files changed

- `apps/api/plane/license/utils/capabilities.py`
- `apps/api/plane/license/api/views/instance.py`
- `apps/api/plane/tests/unit/license/test_capabilities.py`
- `apps/api/plane/tests/contract/license/test_instance_capabilities.py`
- `apps/api/plane/tests/contract/app/test_config_dependent_activation.py`
- `packages/types/src/instance/ai.ts`
- `apps/admin/app/(all)/(dashboard)/ai/form.tsx`
- `apps/admin/app/(all)/(dashboard)/readiness/page.tsx`
- `apps/web/core/hooks/oauth/core.tsx`
- `apps/web/core/components/core/modals/gpt-assistant-popover.tsx`
- `apps/web/core/components/issues/issue-modal/components/description-editor.tsx`
- `apps/space/store/instance.store.ts`
- `apps/space/hooks/oauth/core.tsx`
- `docs/implementations/p8a-config-dependent-activation.md`

## Out of scope (not built)

Templates, standalone Wiki, Teamspaces, Initiatives, Customers, Connections, missing importers, generic Integrations APIs, dashboards, SAML/OIDC/LDAP/SCIM, backup/restore, new AI HTTP adapters.
