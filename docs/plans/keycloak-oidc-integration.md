# Keycloak OIDC Integration — Execution Plan

## 1. Executive Intent

### Problem

Plane currently supports four OAuth providers (Google, GitHub, GitLab, Gitea) but lacks support for enterprise identity providers using the OpenID Connect (OIDC) standard. Organizations running Keycloak as their central IdP cannot use single sign-on with Plane, forcing users to maintain separate credentials.

### Why it matters

Enterprise adoption requires integration with corporate identity infrastructure. Keycloak is the most widely deployed open-source IAM solution and supports OIDC — the industry standard for modern authentication. Adding Keycloak support makes Plane viable for organizations that mandate centralized identity management.

### Core outcomes

1. Users can sign in to Plane (web, space) using their Keycloak credentials via OIDC Authorization Code Flow.
2. Instance admins can configure Keycloak (host, realm, client ID, client secret) through the admin dashboard.
3. User profile data (name, email, avatar) syncs from Keycloak on login when sync is enabled.
4. The implementation follows Plane's existing OAuth provider pattern exactly — no architectural novelty.

### Non-goals

- **Generic OIDC provider support**: This plan targets Keycloak specifically. A generic "custom OIDC" provider would require dynamic URL configuration UI and is out of scope.
- **SAML support**: Keycloak supports SAML, but this plan uses OIDC only.
- **Keycloak admin API integration**: No automated client registration, realm management, or role mapping.
- **Multi-realm support**: One realm per Plane instance. Multiple realms require separate Plane instances.
- **Group/role mapping**: Keycloak groups/roles will not be mapped to Plane workspace roles.
- **Logout propagation**: Keycloak backchannel/frontchannel logout is out of scope.

### Success criteria

- End-to-end login flow works: click "Sign in with Keycloak" → redirect to Keycloak → authenticate → redirect back to Plane with active session.
- Admin can enable/disable Keycloak and configure credentials from the admin UI.
- Existing OAuth providers remain unaffected.
- No new dependencies introduced (uses existing `requests` library and Django infrastructure).

---

## 2. Scope Framing

### MVP scope

- Backend: Keycloak OIDC provider, views (app + space), URL routes, error codes, instance config variables, Account model update, migration
- Frontend: Types update, OAuth button in web + space apps, admin configuration page with form
- Config: Instance-level Keycloak settings (host, realm, client_id, client_secret, enable flag, sync flag)

### Explicitly deferred

- Token refresh / offline access
- Keycloak logout endpoint integration
- PKCE (Proof Key for Code Exchange) — Keycloak supports it, but Plane's OAuth pattern uses confidential clients with client_secret
- JWK validation of id_token — we use the userinfo endpoint for user data, consistent with other providers
- Automated testing against a real Keycloak instance (would require Docker test infrastructure)
- i18n for Keycloak-related admin UI strings

### Assumptions

1. Keycloak instance is accessible from the Plane API server (network-level).
2. Keycloak client is configured as "confidential" with client_secret (not public client).
3. The Keycloak realm has standard OIDC endpoints at well-known paths (`/realms/{realm}/protocol/openid-connect/*`).
4. Users have `email` claim in their Keycloak profile (Plane requires email for user identity).
5. Plane's existing OAuth adapter pattern (token exchange via POST, userinfo via GET with Bearer token) is compatible with Keycloak's OIDC implementation.

---

## 3. Delivery-Relevant System Understanding

### Authentication architecture

Plane uses a layered OAuth architecture:

```
View (Django View)
  └── Provider (e.g., GitLabOAuthProvider)
        └── OauthAdapter (base class)
              └── Adapter (base class — user creation, login completion)
```

**Flow**: View receives redirect → creates Provider with auth code → calls `provider.authenticate()` → Provider exchanges code for tokens (`set_token_data`) → fetches user info (`set_user_data`) → Adapter creates/updates User + Account + Session → redirects to app.

### Key integration points

| Component           | File                                                     | What to touch                                        |
| ------------------- | -------------------------------------------------------- | ---------------------------------------------------- |
| Provider base class | `apps/api/plane/authentication/adapter/oauth.py`         | Add `keycloak` case in `authentication_error_code()` |
| Error codes         | `apps/api/plane/authentication/adapter/error.py`         | Add 2 new error codes                                |
| Account model       | `apps/api/plane/db/models/user.py`                       | Add to `PROVIDER_CHOICES`                            |
| Config variables    | `apps/api/plane/utils/instance_config_variables/core.py` | Add keycloak config block                            |
| Instance API        | `apps/api/plane/license/api/views/instance.py`           | Add `is_keycloak_enabled` boolean transform          |
| Auth URL routing    | `apps/api/plane/authentication/urls.py`                  | Add 4 URL patterns                                   |
| View exports        | `apps/api/plane/authentication/views/__init__.py`        | Add imports                                          |
| Frontend types      | `packages/types/src/instance/auth.ts`, `base.ts`         | Add Keycloak types                                   |
| Web OAuth hook      | `apps/web/core/hooks/oauth/core.tsx`                     | Add Keycloak option                                  |
| Space OAuth hook    | `apps/space/hooks/oauth/core.tsx`                        | Add Keycloak option                                  |
| Admin auth hook     | `apps/admin/hooks/oauth/core.tsx`                        | Add Keycloak mapping                                 |
| Admin routes        | `apps/admin/app/routes.ts`                               | Add keycloak route                                   |

### Trust boundaries

- Plane API ↔ Keycloak: HTTPS required in production. Token exchange uses client_secret (server-side only, never exposed to browser).
- Browser ↔ Plane API: Session cookie (HttpOnly, same-site). CSRF protection via token.
- Browser ↔ Keycloak: Standard OIDC redirect. State parameter prevents CSRF.

### Data flow

```
Browser → Plane API /auth/keycloak/ (GET)
  → Redirect to Keycloak /realms/{realm}/protocol/openid-connect/auth
    → User authenticates at Keycloak
      → Redirect to Plane API /auth/keycloak/callback/?code=...&state=...
        → Plane API POSTs to Keycloak /realms/{realm}/protocol/openid-connect/token
          → Receives access_token, id_token, refresh_token
        → Plane API GETs Keycloak /realms/{realm}/protocol/openid-connect/userinfo
          → Receives email, name, sub, picture
        → Creates/updates User + Account
        → Sets session cookie
        → Redirects to app
```

### State ownership

- **User identity**: Keycloak is the source of truth; Plane stores a copy.
- **Session**: Plane owns the session. Keycloak session is independent.
- **Configuration**: Stored in `InstanceConfiguration` (database), configurable via admin UI.

---

## 4. Workstream Decomposition

### WS1: Backend Provider & Auth Flow

**Purpose**: Implement the core Keycloak OIDC authentication logic.

**Produces**:

- `KeycloakOAuthProvider` class (provider)
- App views (initiate + callback)
- Space views (initiate + callback)
- URL routing

**Key implementation considerations**:

- Follow **Gitea provider** pattern for the provider class (`apps/api/plane/authentication/provider/oauth/gitea.py`) — it uses `"openid email profile"` scope (same as Keycloak), has URL scheme validation, and has `IS_GITEA_ENABLED` in the config seed. Follow **GitLab view** pattern for the initiate/callback endpoints (`apps/api/plane/authentication/views/app/gitlab.py`) since the structure is identical.
- **Space views differ from app views** in three ways: (1) use `is_space=True` in `base_host(request, is_space=True)`, (2) do NOT pass `callback=post_user_auth_workflow` to the provider — space callbacks omit the post-auth workflow, (3) use `validate_next_path` and `get_allowed_hosts` for redirect validation. Reference `apps/api/plane/authentication/views/space/gitea.py` as the template for space views, NOT the app views.
- Keycloak adds `KEYCLOAK_REALM` as an additional config dimension (GitLab/Gitea only have host).
- OIDC userinfo response uses `sub` (not `id`), `given_name`/`family_name` (not `name`/`family_name`), `picture` (not `avatar_url`).
- Scope must be `"openid email profile"` (same as Gitea, not GitLab's `"read_user"`).
- Validate `KEYCLOAK_HOST`: parse with `urlparse()`, reject if scheme is not `http` or `https` (raise `KEYCLOAK_NOT_CONFIGURED`), strip trailing slashes (`KEYCLOAK_HOST.rstrip("/")`).
- Validate `KEYCLOAK_REALM`: must be non-empty, must not contain `/`, `?`, `#`, or whitespace (these would break URL construction). Raise `KEYCLOAK_NOT_CONFIGURED` if invalid.

**Risks**:

- Keycloak may return different claim names depending on realm/client configuration. Mitigation: use standard OIDC claims and document required Keycloak client settings.

**Interfaces**: WS2 (error codes), WS3 (config variables), WS4 (Account model).

### WS2: Error Codes & OAuth Adapter Update

**Purpose**: Register Keycloak-specific error codes and update the adapter's error mapping.

**Produces**:

- Two new error codes in `error.py`
- Updated `authentication_error_code()` mapping in `oauth.py`

**Key considerations**:

- Error codes must be unique. Current highest OAuth code is 5123 (GITEA_OAUTH_PROVIDER_ERROR). Use 5113 (KEYCLOAK_NOT_CONFIGURED) and 5124 (KEYCLOAK_OAUTH_PROVIDER_ERROR).
- The `authentication_error_code()` method in `OauthAdapter` maps provider name → error code string. **Must** add `"keycloak"` → `"KEYCLOAK_OAUTH_PROVIDER_ERROR"` case. This is mandatory — the default fallback returns `"OAUTH_NOT_CONFIGURED"` which is a different error (instance-level code 5104, not provider-level). Missing this case would cause all Keycloak token/userinfo errors to report code 5104 instead of 5124.

### WS3: Instance Configuration

**Purpose**: Define Keycloak config variables and expose them via API.

**Produces**:

- Config variable definitions in `core.py` (`keycloak_config_variables` list, added to `core_config_variables`)
- Updated `InstanceEndpoint.get()` in `apps/api/plane/license/api/views/instance.py` — requires changes in **three places**:
  1. Add `{"key": "IS_KEYCLOAK_ENABLED", "default": os.environ.get("IS_KEYCLOAK_ENABLED", "0")}` to the `get_configuration_value()` list of dicts
  2. Add `IS_KEYCLOAK_ENABLED` to the positional tuple destructuring. Current order (15 vars): `ENABLE_SIGNUP, ENABLE_EMAIL_PASSWORD, ... IS_GITEA_ENABLED`. Append `IS_KEYCLOAK_ENABLED` as the 16th position. **Order must exactly match the list of dicts above — a mismatch silently assigns wrong values.**
  3. Add `data["is_keycloak_enabled"] = IS_KEYCLOAK_ENABLED == "1"` to the data dict alongside other auth flags.

  **Implementation note**: Read the current `get_configuration_value()` call in `apps/api/plane/license/api/views/instance.py` before editing. Count existing entries and append to both the list and the tuple in the same position.

**Key considerations**:

- 6 config keys: `IS_KEYCLOAK_ENABLED`, `KEYCLOAK_HOST`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `ENABLE_KEYCLOAK_SYNC`
- `KEYCLOAK_CLIENT_SECRET` must be `is_encrypted: True`
- Initial values come from environment variables (same pattern as other providers)
- `IS_KEYCLOAK_ENABLED` is included in `keycloak_config_variables` (following Gitea's pattern where `IS_GITEA_ENABLED` is seeded). Google/GitHub/GitLab do NOT seed their `IS_*_ENABLED` flags — their flags are only set by the admin UI toggle. Gitea/Keycloak seed them to default `"0"` for explicit visibility.

### WS4: Database Model & Migration

**Purpose**: Update Account model to support Keycloak as a provider.

**Produces**:

- Updated `PROVIDER_CHOICES` in Account model — add both `("gitea", "Gitea")` (fixing pre-existing gap) and `("keycloak", "Keycloak")`
- Django migration file

**Key considerations**:

- This is a simple CharField choices update — no schema change, just validation. Note: `("gitea", "Gitea")` is currently missing from `PROVIDER_CHOICES` despite Gitea being fully implemented. Include it in the same migration.
- Migration is auto-generated by `python manage.py makemigrations`.

### WS5: Frontend Types

**Purpose**: Update shared TypeScript types to include Keycloak.

**Produces**:

- Updated union types in `auth.ts`
- Updated `IInstanceConfig` in `base.ts`
- New `TInstanceKeycloakAuthenticationConfigurationKeys` type

**Interfaces**: All frontend workstreams depend on this.

### WS6: Frontend OAuth Integration (Web + Space)

**Purpose**: Add Keycloak login button to web and space apps.

**Produces**:

- Updated `useCoreOAuthConfig` hook in web app
- Updated `useCoreOAuthConfig` hook in space app
- Keycloak logo asset

**Key considerations**:

- Both hooks follow identical pattern — check `config?.is_keycloak_enabled`, add option with redirect to `/auth/keycloak/`.
- Need a Keycloak logo (SVG preferred, or PNG). Can use the official Keycloak logo or a generic key/shield icon.

### WS7: Admin Configuration UI

**Purpose**: Build the admin interface for configuring Keycloak.

**Produces**:

- `keycloak-config.tsx` component (list item with toggle)
- `keycloak/page.tsx` (config page)
- `keycloak/form.tsx` (configuration form with Host, Realm, Client ID, Client Secret, Sync toggle, Callback URL display)
- Updated `getCoreAuthenticationModesMap` hook
- Updated admin routes

**Key considerations**:

- Form has one extra field compared to GitLab: "Realm". Layout should match GitLab form pattern.
- Callback URL display should show `{instance_url}/auth/keycloak/callback/` for easy copy-paste into Keycloak client config.
- **Save mechanism**: The form saves configuration via `useInstance().updateInstanceConfigurations(payload)` which calls `PATCH /api/instances/configurations/`. No custom backend handler is needed — the existing generic `InstanceConfigurationEndpoint` handles all providers. Reference `apps/admin/app/(all)/(dashboard)/authentication/gitea/form.tsx` for the exact pattern (uses `react-hook-form`, imports `IFormattedInstanceConfiguration` from `@plane/types`).
- The form must handle the `KEYCLOAK_REALM` field which is unique to this provider.

---

## 5. Dependency and Sequencing Model

### Dependency graph

```
WS2 (Error Codes)  ──┐
WS3 (Instance Config) ──┤
WS4 (DB Migration)  ──┼──→ WS1 (Backend Provider) ──→ Integration Test
                       │
WS5 (Frontend Types) ──┼──→ WS6 (Web + Space OAuth) ──→ E2E Test
                       │
                       └──→ WS7 (Admin Config UI) ──→ E2E Test
```

### Hard blockers

- WS1 depends on WS2 (error codes), WS3 (config vars), WS4 (Account model) — provider imports/uses these.
- WS6 and WS7 depend on WS5 (types must exist before frontend code).

### Soft sequencing

- WS2, WS3, WS4 can all proceed in parallel (independent files).
- WS6 and WS7 can proceed in parallel (different apps, different files).
- WS5 should land before WS6/WS7 but can be done quickly.

### Recommended sequence

1. **Phase 1** (parallel): WS2 + WS3 + WS4 + WS5 — all foundation work
2. **Phase 2** (parallel): WS1 + WS6 + WS7 — provider + frontend, after foundation
3. **Phase 3**: Integration testing — end-to-end verification

### Why this sequence

- Foundation work (error codes, config, types, migration) is small and independent — doing it first eliminates all blockers.
- Provider and frontend can then be built in parallel since they touch different codebases (Python vs TypeScript).
- Testing last ensures all pieces are in place.

---

## 6. Key Design and Delivery Decisions

### D1: Use userinfo endpoint instead of id_token decoding

**Decision**: Fetch user data from Keycloak's userinfo endpoint (GET with Bearer token) rather than decoding the id_token JWT.
**Reasoning**: Consistent with how all other Plane OAuth providers work. Avoids adding JWT/JWK verification dependencies. The id_token is still stored in the Account record.
**Consequence**: One extra HTTP call per login. Negligible performance impact for an auth flow.

### D2: Keycloak-specific provider (not generic OIDC)

**Decision**: Create a `KeycloakOAuthProvider` specifically, not a generic OIDC provider.
**Reasoning**: Plane's architecture uses named providers with hardcoded config keys. A generic OIDC provider would require a fundamentally different config model (dynamic URL fields, custom claim mapping). This can be built later on top of the Keycloak implementation if needed.
**Consequence**: Adding another OIDC provider (e.g., Okta, Auth0) would require similar but separate implementation. However, this keeps the codebase consistent and simple.

### D3: Single realm per instance

**Decision**: One `KEYCLOAK_REALM` setting per Plane instance.
**Reasoning**: Plane's instance config is flat key-value. Multi-realm would require array/object config which the current model doesn't support.
**Consequence**: Organizations with multiple realms need multiple Plane instances or a Keycloak-side solution (federation/brokering between realms).

### D4: Callback URL pattern

**Decision**: Use `/auth/keycloak/callback/` (app) and `/auth/spaces/keycloak/callback/` (space).
**Reasoning**: Follows existing convention (gitlab, github, google, gitea all use `/<provider>/callback/`).
**Consequence**: Must be registered in Keycloak client as valid redirect URIs.

### D5: Error code allocation

**Decision**: Use codes 5113 (`KEYCLOAK_NOT_CONFIGURED`) and 5124 (`KEYCLOAK_OAUTH_PROVIDER_ERROR`).
**Reasoning**: 5113 fits in the "not configured" range (5104-5112), 5124 extends the "provider error" range (5115-5123). Follows the pattern gap.

### D6: Config variable naming

**Decision**: Use `IS_KEYCLOAK_ENABLED` (not `ENABLE_KEYCLOAK`) for the enable flag, and `ENABLE_KEYCLOAK_SYNC` for the sync flag.
**Reasoning**: Follows Gitea's pattern (`IS_GITEA_ENABLED`). The `IS_*` prefix is used for the main toggle, `ENABLE_*_SYNC` for sync.

### D7: Ignore `email_verified` claim

**Decision**: Do not check the `email_verified` claim from Keycloak's userinfo response.
**Reasoning**: No existing Plane OAuth provider checks email verification status. Adding this check only for Keycloak would be inconsistent and could block users in development/test Keycloak realms where email verification is disabled.
**Consequence**: Users with unverified emails in Keycloak can log in to Plane. This matches the behavior of all other providers. Can be hardened later as a cross-provider improvement.

---

## 7. Risks, Ambiguities, and Assumptions

### Risks

| Risk                                                       | Severity | Mitigation                                                                                                                                |
| ---------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Keycloak userinfo response has non-standard claims         | Medium   | Use standard OIDC claims (`sub`, `email`, `given_name`, `family_name`, `picture`). Document required Keycloak client scope configuration. |
| Network connectivity between Plane API and Keycloak        | Medium   | Document network requirements. Provide clear error messages when Keycloak is unreachable.                                                 |
| CORS issues if Keycloak and Plane are on different domains | Low      | Not applicable — token exchange is server-to-server (no browser CORS). Redirect flow handles cross-domain via HTTP redirects.             |
| Keycloak email not verified                                | Low      | Ignore `email_verified` claim — no existing provider checks this (see D7). Can be hardened later as a cross-provider improvement.         |

### Ambiguities

1. **Logo asset**: No official Keycloak logo in the repo. Need to source one. Could use official Keycloak logo or a generic shield icon.
2. **Admin UI description text**: Need appropriate copy for the Keycloak config page (e.g., "Connect your Keycloak identity provider to enable single sign-on").

### Assumptions

1. The `OauthAdapter.get_user_token()` method works with Keycloak's token endpoint (standard OAuth2 POST with form-encoded body).
2. The `OauthAdapter.get_user_response()` method works with Keycloak's userinfo endpoint (standard Bearer token auth).
3. Keycloak returns `email` in the userinfo response (most Keycloak setups include the `email` scope by default).
4. The existing `Account` model's `access_token`, `refresh_token`, `id_token` fields are sufficient for Keycloak tokens.

---

## 8. Execution Slices / Phases

### Phase 1: Foundation (can be parallelized, ~2 hours)

**Objective**: Lay all groundwork that other workstreams depend on.

**Included**:

- WS2: Add error codes to `error.py`, update `authentication_error_code()` in `oauth.py`
- WS3: Add `keycloak_config_variables` to `core.py`, update `InstanceEndpoint` in `instance.py`
- WS4: Add `("gitea", "Gitea")` and `("keycloak", "Keycloak")` to `PROVIDER_CHOICES`, generate migration
- WS5: Update all TypeScript types in `auth.ts` and `base.ts`

**Dependencies**: None (this is the starting phase).

**Validation**: Type check passes (`pnpm check:types`), Python syntax valid, migration generates cleanly.

**After this phase**: All backend and frontend foundational types are in place.

### Phase 2: Backend Provider (depends on Phase 1, ~3 hours)

**Objective**: Implement the complete server-side Keycloak authentication flow.

**Included**:

- WS1: Create `KeycloakOAuthProvider`, app views, space views
- Wire up URL routes
- Update view exports in `__init__.py`

**Dependencies**: Phase 1 (error codes, config vars, Account model).

**Validation**: Django server starts without errors. Manual test: visiting `/auth/keycloak/` redirects to Keycloak (if configured).

**After this phase**: The backend auth flow is complete. A user could authenticate via direct URL manipulation.

### Phase 3: Frontend Integration (depends on Phase 1, parallel with Phase 2, ~3 hours)

**Objective**: Add Keycloak to all three frontend apps.

**Included**:

- WS6: Update web + space OAuth hooks, add logo
- WS7: Create admin config page + form, update admin hooks + routes

**Dependencies**: Phase 1 (types). Does NOT depend on Phase 2 (frontend just generates URLs; backend handles the actual flow).

**Validation**: `pnpm check` passes. Admin config page renders. Keycloak button appears when enabled.

**After this phase**: Full end-to-end integration is visually complete.

### Phase 4: Integration Testing (~1 hour)

**Objective**: Verify the complete flow works end-to-end.

**Included**:

- Set up a test Keycloak instance (Docker: `docker run -p 8080:8080 quay.io/keycloak/keycloak:latest start-dev`)
- Create realm, client, test user
- Configure Plane with Keycloak credentials via admin UI
- Test: sign-in, sign-up (new user), profile sync, error handling

**Validation**: User can log in via Keycloak button, user record is created, session is active.

---

## 9. Validation and Acceptance Framing

### Functional validation

- [ ] Clicking "Sign in with Keycloak" redirects to correct Keycloak authorization URL with proper query params (client_id, scope, state, redirect_uri)
- [ ] After Keycloak authentication, callback correctly exchanges code for tokens
- [ ] New user: account is created with correct email, name, avatar from Keycloak claims
- [ ] Existing user: account is linked, session is created, no duplicate user
- [ ] Profile sync: when enabled, user name/avatar updates from Keycloak on next login
- [ ] Admin UI: can enable/disable Keycloak, configure all fields, see callback URL

### Integration validation

- [ ] Other OAuth providers (Google, GitHub, GitLab, Gitea) still work after changes
- [ ] Email/password login still works
- [ ] Magic link login still works
- [ ] Space app login with Keycloak works
- [ ] Admin app is not affected (admin uses separate auth flow)

### Security validation

- [ ] State parameter is validated on callback (CSRF protection)
- [ ] Client secret is stored encrypted in InstanceConfiguration
- [ ] Client secret is never exposed to the browser
- [ ] Token exchange happens server-to-server
- [ ] Invalid/expired code returns proper error, not 500

### Failure mode validation

- [ ] Keycloak unreachable: clear error message, no crash
- [ ] Keycloak not configured: appropriate error code returned
- [ ] Invalid client credentials: proper error handling
- [ ] User denies authorization at Keycloak: handled gracefully
- [ ] Missing email claim: login rejected with clear error
- [ ] State mismatch (CSRF attempt): rejected

### Regression expectations

- All existing tests pass unchanged
- No changes to Django settings or DRF configuration
- No changes to session handling or CSRF middleware
- No new Python/Node.js dependencies

---

## 10. Task Graph Mapping

### Top-level tasks (workstreams → beads)

```
keycloak-oidc-integration/
├── foundation/
│   ├── error-codes          (WS2 — add error codes + update oauth adapter)
│   ├── instance-config      (WS3 — config variables + instance API)
│   ├── account-model        (WS4 — PROVIDER_CHOICES + migration)
│   └── frontend-types       (WS5 — TypeScript type updates)
├── backend/
│   ├── provider             (WS1 — KeycloakOAuthProvider class)
│   ├── app-views            (WS1 — initiate + callback views for web)
│   ├── space-views          (WS1 — initiate + callback views for space)
│   └── url-routing          (WS1 — URL patterns + view exports)
├── frontend/
│   ├── web-oauth-hook       (WS6 — update useCoreOAuthConfig in web)
│   ├── space-oauth-hook     (WS6 — update useCoreOAuthConfig in space)
│   ├── admin-config-page    (WS7 — page.tsx + form.tsx)
│   ├── admin-config-toggle  (WS7 — keycloak-config.tsx list component)
│   └── admin-hooks-routes   (WS7 — update hooks + routes)
```

### Dependency encoding

- `backend/*` depends on `foundation/*` (all four)
- `frontend/*` depends on `foundation/frontend-types`
- `backend/app-views` and `backend/space-views` depend on `backend/provider`
- `backend/url-routing` depends on `backend/app-views` + `backend/space-views`
- `frontend/admin-config-page` depends on `frontend/admin-hooks-routes` (route must exist)

### Context each leaf task must carry

**All tasks**: "We are adding Keycloak as a new OAuth/OIDC provider to Plane. Follow the Gitea provider pattern for the provider class and the GitLab pattern for view classes. Keycloak adds one extra config: `KEYCLOAK_REALM`."

**Backend tasks**: Must reference `apps/api/plane/authentication/provider/oauth/gitea.py` as the primary template for the provider class (same OIDC scope pattern, URL validation), and `apps/api/plane/authentication/views/app/gitlab.py` for the view classes. Must know Keycloak OIDC endpoint URL patterns:

- Auth: `{HOST}/realms/{REALM}/protocol/openid-connect/auth`
- Token: `{HOST}/realms/{REALM}/protocol/openid-connect/token`
- UserInfo: `{HOST}/realms/{REALM}/protocol/openid-connect/userinfo`
- Scope: `"openid email profile"`
- UserInfo claims: `sub`, `email`, `given_name`, `family_name`, `picture`
- Must validate `KEYCLOAK_HOST` (URL scheme + trailing slash) and `KEYCLOAK_REALM` (non-empty, no `/`, `?`, `#`, whitespace)
- Unlike Gitea (OAuth2), Keycloak is OIDC and returns `id_token` in the token response. `set_token_data()` must include `id_token` in the dict passed to `super().set_token_data()` so it is stored in the Account record (see D1).
- No email fallback method is needed (unlike Gitea's `__get_email()`). Keycloak with `email` scope always returns email in the standard userinfo response.
- Claim mapping to Plane fields: `sub` → `provider_id` (string, not int — unlike Gitea's `id`), `email` → `email`, `given_name` → `first_name`, `family_name` → `last_name`, `picture` → `avatar`

**Frontend tasks**: Must reference corresponding GitLab/Gitea files as templates. Must know the config key is `IS_KEYCLOAK_ENABLED` and the auth URL is `/auth/keycloak/`.

**Admin tasks**: Must know the form fields: `KEYCLOAK_HOST`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `ENABLE_KEYCLOAK_SYNC`. Callback URL to display: `{instance_url}/auth/keycloak/callback/`.

### Splitting guidance

- `foundation/*` tasks are small (each touches 1-2 files) — keep as leaf tasks
- `backend/provider` is the meatiest task (~120 lines) — keep as one task, it's a single file
- `frontend/admin-config-page` could be large — form.tsx alone is ~230 lines. Keep as one task since it's a clone-and-modify job from GitLab form.

### Cross-cutting concerns to keep explicit

- Error code values (5113, 5124) must be consistent between `error.py` and `oauth.py`
- Config key names must be consistent across `core.py`, `instance.py`, `auth.ts`, `base.ts`, admin form
- The provider name string `"keycloak"` must be consistent everywhere (Python provider class, Account model, frontend types, URL routes)

---

## Appendix: Keycloak Client Configuration Guide

For the Plane admin to configure Keycloak, they need to:

1. **Create a new client** in Keycloak admin console:
   - Client ID: e.g., `plane`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Valid Redirect URIs: `https://<plane-domain>/auth/keycloak/callback/`

2. **Configure client scopes**: Ensure `email` and `profile` scopes are included in the default client scopes.

3. **Get credentials**: Copy the Client ID and Client Secret from the Keycloak client's "Credentials" tab.

4. **Configure Plane**: In the Plane admin dashboard, navigate to Authentication → Keycloak, and enter:
   - Host: `https://<keycloak-domain>` (no trailing slash)
   - Realm: e.g., `master` or your custom realm name
   - Client ID: from step 3
   - Client Secret: from step 3

5. **Enable**: Toggle Keycloak authentication on.
