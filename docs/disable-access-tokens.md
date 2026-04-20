# Disable Access Tokens

An instance-level toggle that globally blocks creation and usage of user-owned access tokens (Personal Access Tokens and Workspace API Tokens). Service / integration tokens are unaffected.

- **Config key:** `DISABLE_ACCESS_TOKENS` (values `"0"` / `"1"`, default `"0"`)
- **Category:** `SECURITY`
- **Scope:** entire instance — not per-workspace
- **Reversible:** yes. Toggling back to `"0"` restores all previously valid tokens with no manual reactivation

## Product behavior

### When the flag is OFF (default)

No behavioral change. Token creation, authentication, and UI flows work as they always have.

### When the flag is ON

- **Authentication:** every request that uses a non-service `APIToken` is rejected with `401 Unauthorized`. Session-authenticated requests are untouched.
- **Creation:** `POST` to the token creation endpoints is rejected with `403 Forbidden` and a machine-readable error code (see below). The response body:
  ```json
  {
    "error": "Access token creation has been disabled by the instance administrator",
    "code": "DISABLED_AT_INSTANCE_LEVEL"
  }
  ```
  The same code (`DISABLED_AT_INSTANCE_LEVEL`) is returned by the auth layer so clients can distinguish this from a generic invalid/expired-token error.
- **Service tokens (`APIToken.is_service=True`) are exempt.** Silo integrations, bot users, and internal system calls continue to work because the check is gated on `is_service`.
- **Web UI:** the "Add token" button is hidden on both the profile and workspace token pages. A warning banner is shown at the top of each page. Existing tokens remain visible and can still be deleted/revoked.

### Out of scope

- No physical revocation — rows in `APIToken` are left untouched (`is_active` is not flipped).
- No per-workspace switch.
- No audit log entry for the config toggle (consistent with other `InstanceConfiguration` updates).
- No grace period or scheduled disable.
- No changes to `apps/space` or `apps/silo`.

## Implementation

### Backend (`apps/api`)

**Config registration** — `plane/utils/instance_config_variables/core.py`

A new `security_config_variables` list registers the `DISABLE_ACCESS_TOKENS` key under a new `SECURITY` category and is spliced into `core_config_variables`. The row is seeded at `"0"` on deploy by the existing `configure_instance` management command (uses `get_or_create`), so no data migration is required.

**Shared helper** — `plane/license/utils/instance_value.py`

```python
def are_access_tokens_disabled() -> bool
```

Single source of truth that reads the config via `get_configuration_value` (DB → env fallback). Consumed by auth classes, creation endpoints, and the instance info endpoint.

**Auth enforcement** — both `APIKeyAuthentication` classes

- `plane/app/middleware/api_authentication.py` (app API, used by the Plane web UI)
- `plane/api/middleware/api_authentication.py` (public API)

After the `APIToken` lookup succeeds, both classes raise `AuthenticationFailed` with `{"error": "...", "code": "DISABLED_AT_INSTANCE_LEVEL"}` when the flag is on and `api_token.is_service` is `False`. Placement after the DB lookup means the config read only runs for token-authenticated requests.

**Creation enforcement** — token endpoints

- `plane/app/views/api/base.py` → `ApiTokenEndpoint.post` (personal tokens)
- `plane/app/views/api/workspace.py` → `WorkspaceAPITokenEndpoint.post` (workspace tokens)

Each `post()` short-circuits with a `403` response carrying the same error code before any validation or DB write.

**Instance endpoint exposure** — `plane/license/api/views/instance.py`

`InstanceEndpoint.get` adds `DISABLE_ACCESS_TOKENS` to the tuple read from `get_configuration_value` and exposes a derived boolean `are_access_tokens_disabled` on the response, alongside the existing `is_workspace_creation_disabled`.

### Frontend types (`packages/types`)

- `src/instance/config.ts` — adds `"DISABLE_ACCESS_TOKENS"` to the `TInstanceConfigKeys` union.
- `src/instance/base.ts` — adds `are_access_tokens_disabled: boolean` to `IInstanceConfig`.

### Admin app — dedicated Security page

Unlike the original spec (which proposed a section inside the existing `/configurations` page), the implementation ships a new top-level page in god-mode:

- **Page:** `apps/admin/app/(all)/(dashboard)/(with-sidebar)/security/page.tsx`
- **Form:** `apps/admin/app/(all)/(dashboard)/(with-sidebar)/security/form.tsx`
- Route registered in `apps/admin/app/routes.ts`, header in `apps/admin/core/components/common/header/core.ts`, sidebar entry in `apps/admin/core/hooks/use-sidebar-menu/core.ts`.

The toggle is a propel `Switch` bound via `Controller` to `DISABLE_ACCESS_TOKENS`, serialising as `"0"` / `"1"` strings. The form **auto-saves on toggle** (no separate "Save" button) — the change is submitted immediately through `updateInstanceConfigurations` with a `setPromiseToast` success/error toast. The stub entry previously in `configurations/form.tsx` was removed.

### Web app UI

**Shared banner** — `apps/web/core/components/api-token/instance-disabled-banner.tsx`

`InstanceTokensDisabledBanner` component — a `role="status"` warning callout with a `lucide-react` `AlertTriangle` icon and i18n-driven copy.

**Integration**

- `apps/web/core/components/settings/profile/content/pages/api-tokens.tsx` — Profile → API tokens.
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/access-tokens/page.tsx` — Workspace settings → Access tokens.

Both pages read `instance.config?.are_access_tokens_disabled` via `useInstance()` and:

- Render `<InstanceTokensDisabledBanner />` above the list when the flag is on.
- Suppress the "Add token" button in the page header.
- Empty-state CTA actions collapse to `[]` so the empty state no longer offers a create action.
- List rendering and per-row delete continue to work.

### i18n

Banner title and description are translated across **all supported locales** (`en`, `cs`, `de`, `es`, `fr`, `id`, `it`, `ja`, `ko`, `pl`, `pt-BR`, `ro`, `ru`, `sk`, `tr-TR`, `ua`, `vi-VN`, `zh-CN`, `zh-TW`) under:

```
workspace_settings.settings.api_tokens.instance_disabled.title
workspace_settings.settings.api_tokens.instance_disabled.description
```

This extends the original spec, which had planned to ship English-only inline copy.

## Testing

- **Unit tests** — `apps/api/plane/tests/unit/license/test_access_tokens_helper.py`: helper returns `False` when row absent, `False` for `"0"`, `True` for `"1"`.
- **Contract tests (app)** — `apps/api/plane/tests/contract/app/test_access_token_disable.py`:
  - Personal + workspace token creation rejected with `403` when flag on; allowed when off.
  - User tokens rejected with `401` in auth middleware; service tokens accepted.
- **Contract tests (public API)** — `apps/api/plane/tests/contract/api/test_access_token_disable.py`: user tokens rejected, service tokens accepted for public-API endpoints.

## Rollout

1. Deploy backend: the `configure_instance` management command seeds the row at `"0"`.
2. Deploy admin + web UI.
3. No behavioral change until an admin explicitly toggles the switch on the god-mode Security page.

## Error code reference

| Status | Code                         | When                                                      |
| ------ | ---------------------------- | --------------------------------------------------------- |
| 401    | `DISABLED_AT_INSTANCE_LEVEL` | Token used for auth while flag is on (non-service token). |
| 403    | `DISABLED_AT_INSTANCE_LEVEL` | Token creation attempted while flag is on.                |

Clients (including the Plane web app's error-toast infrastructure) can key off `code` to present a consistent disabled-tokens message rather than a generic auth error.
