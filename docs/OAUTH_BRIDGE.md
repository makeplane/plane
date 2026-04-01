Here's the full plan:

# Plan: OAuth Bridge — Workspace-Level OAuth App for External IdP Token Validation

## Context

A customer uses an internal identity provider (IdP) that issues OAuth 2.0/OIDC JWTs (for example, via Microsoft ADFS). Their apps need to call Plane's API using these externally-issued tokens. Jira solves this via the **MiniOrange plugin** — we'll build an equivalent as a **first-party OAuth app** that workspace admins install from the integrations tab.

**Flow (same as MiniOrange for Jira):**

1. Client app gets access token from external IdP (IDAnywhere/Azure AD)
2. Client calls Plane API with `Authorization: Bearer <external_token>`
3. OAuth Bridge (installed in the workspace) validates the JWT via JWKS
4. Maps the JWT's identifier claim (e.g., email) to a real Plane user
5. Request proceeds as that user — client uses direct Plane URLs, no proxy

---

## Architecture

### Workspace-Level OAuth App

Uses the existing `WorkspaceAppInstallation` pattern (same as runner, cursor, slack):

- Registered as `Application` with `is_internal=True` via migration
- Workspace admin installs from integrations tab → creates `WorkspaceAppInstallation` (with bot user, webhook, etc.)
- Per-workspace IdP config stored in `ExternalTokenProvider` model (linked to workspace)
- `ExternalOIDCTokenAuthentication` hardwired in `BaseAPIView` auth chain

### User Identity

External JWT claims map to **real Plane users** (not the app bot). The admin configures which JWT claim contains the user identifier (default: `email`). The auth class looks up the Plane user by that identifier. Bot user from `WorkspaceAppInstallation` exists per standard pattern but is not used for external token auth.

---

## Detailed Design

### New Django App: `apps/api/plane/oauth_bridge/`

```
apps/api/plane/oauth_bridge/
├── __init__.py
├── apps.py                          # Django AppConfig
├── models/
│   ├── __init__.py
│   └── provider.py                  # ExternalTokenProvider model
├── authentication.py                # ExternalOIDCTokenAuthentication DRF auth class
├── views.py                         # Provider CRUD endpoints
├── serializers.py                   # DRF serializers
├── urls.py                          # URL patterns
└── migrations/
    ├── __init__.py
    ├── 0001_initial.py              # ExternalTokenProvider model
    └── 0002_create_oauth_bridge_app.py  # Register as internal OAuth app
```

### Model: `ExternalTokenProvider`

**File**: `apps/api/plane/oauth_bridge/models/provider.py`

Per-workspace IdP configuration, linked to the workspace where OAuth Bridge is installed.

```python
class ExternalTokenProvider(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="external_token_providers",
    )
    name               = models.CharField(max_length=255)     # "IDAnywhere Production"
    is_enabled         = models.BooleanField(default=True)

    # Token validation
    issuer             = models.CharField(max_length=512)     # Expected `iss` claim
    audience           = models.JSONField(default=list)       # Expected `aud` claim(s)
    jwks_url           = models.URLField()                    # Public key endpoint (HTTPS only)
    allowed_algorithms = models.JSONField(default=list)       # Default: ["RS256"]

    # User mapping
    user_claim         = models.CharField(max_length=100, default="email")
    # ^ Which JWT claim identifies the Plane user (email, upn, preferred_username, etc.)

    # Options
    jwks_cache_ttl     = models.IntegerField(default=86400)   # Key cache TTL (seconds)

    class Meta:
        db_table = "external_token_providers"
        unique_together = [("workspace", "issuer")]           # One config per issuer per workspace
```

### Register as Internal OAuth App

**Migration**: `apps/api/plane/oauth_bridge/migrations/0002_create_oauth_bridge_app.py`

Pattern from `apps/api/plane/silo/migrations/0011_create_runner_app.py` using `generate_application()`.

**Add to `APPLICATIONS`** in `apps/api/plane/silo/utils/constants.py`:

```python
"oauth-bridge": {
    "key": "oauth-bridge",
    "name": "OAuth Bridge",
    "slug": "oauth-bridge",
    "short_description": "Validate external IdP tokens for API access",
    "description_html": "<p>Accept OAuth/OIDC tokens from external identity providers...</p>",
    "setup_url": "",
    "redirect_uris": "",
    "skip_authorization": True,
    "resource_permissions": ["read", "write"],
}
```

### Authentication Class

**File**: `apps/api/plane/oauth_bridge/authentication.py`

```python
class ExternalOIDCTokenAuthentication(BaseAuthentication):

    def authenticate(self, request):
        # 1. Extract Bearer token from Authorization header
        #    → return None if not "Bearer <token>"

        # 2. Decode JWT header (unverified) — must have "kid" field
        #    Plane's own OAuth tokens don't have "kid", so this avoids conflict
        #    → return None if not a JWKS-signed JWT

        # 3. Resolve workspace from URL (same pattern as APIKeyAuthentication)

        # 4. Check OAuth Bridge is installed in this workspace
        #    + find matching ExternalTokenProvider by issuer claim
        #    → return None if no match

        # 5. Validate JWT via JWKS (PyJWKClient, cached per provider)
        #    Verify: signature, expiry, issuer, audience, algorithm

        # 6. Extract user identifier from claims[provider.user_claim]

        # 7. Map to Plane user (User.objects.filter(email=identifier))
        #    - If not found + auto_provision → create user
        #    - If not found + no auto-provision → raise AuthenticationFailed

        # 8. Verify workspace membership

        # 9. Return (user, payload)
```

**JWKS Client Caching** (module-level, using PyJWKClient built-in cache):

```python
_jwk_clients: dict[str, PyJWKClient] = {}

def get_cached_jwk_client(provider):
    key = str(provider.id)
    if key not in _jwk_clients:
        _jwk_clients[key] = PyJWKClient(
            provider.jwks_url, cache_jwk_set=True, lifespan=provider.jwks_cache_ttl
        )
    return _jwk_clients[key]
```

### Wire into Auth Chain

**File**: `apps/api/plane/api/views/base.py` (line 66)

```python
authentication_classes = [
    APIKeyAuthentication,                # X-Api-Key header
    OAuth2Authentication,                # Plane-issued OAuth Bearer tokens
    ExternalOIDCTokenAuthentication,     # External IdP Bearer tokens (fallback)
]
```

**Auth chain ordering — no Bearer token conflict**:

1. `APIKeyAuthentication` → checks `X-Api-Key` header → no overlap
2. `OAuth2Authentication` → checks Bearer against Plane's `AccessToken` table → returns `None` if not found
3. `ExternalOIDCTokenAuthentication` → checks if JWT has `kid` header + matching issuer → validates via JWKS

### Provider Admin Endpoints

**File**: `apps/api/plane/oauth_bridge/views.py`

| Method | URL                                                        | Action                 |
| ------ | ---------------------------------------------------------- | ---------------------- |
| GET    | `/api/workspaces/<slug>/oauth-bridge/providers/`           | List IdP providers     |
| POST   | `/api/workspaces/<slug>/oauth-bridge/providers/`           | Add provider           |
| GET    | `/api/workspaces/<slug>/oauth-bridge/providers/<pk>/`      | Get provider details   |
| PATCH  | `/api/workspaces/<slug>/oauth-bridge/providers/<pk>/`      | Update provider        |
| DELETE | `/api/workspaces/<slug>/oauth-bridge/providers/<pk>/`      | Delete provider        |
| POST   | `/api/workspaces/<slug>/oauth-bridge/providers/<pk>/test/` | Test JWKS connectivity |

Permission: `WorkSpaceAdminPermission`

### Rate Limiting

New `ExternalTokenRateThrottle(SimpleRateThrottle)`:

- Default: `120/minute` per user
- Added to `get_throttles()` in `BaseAPIView` when auth is via external token

### Security

- **Algorithm allowlist**: Only asymmetric — `RS256`, `RS384`, `RS512`, `ES256`, `ES384`, `ES512`. Never `HS256`/`none`.
- **JWKS URL**: Must be HTTPS (validated in serializer)
- **Audience + Issuer validation**: Both mandatory
- **Workspace membership**: User must be an active workspace member
- **App installation check**: OAuth Bridge must be installed in the workspace
- **Logging**: All auth attempts via `plane.oauth_bridge` logger

---

## How the Full Flow Works

```
1. Workspace admin installs OAuth Bridge from integrations tab
   → Creates WorkspaceAppInstallation(application="oauth-bridge", status="installed")
   → Creates bot user (standard pattern, not used for external token auth)

2. Workspace admin configures an IdP provider via workspace settings
   → POST /api/workspaces/acme/oauth-bridge/providers/
   → Creates ExternalTokenProvider(
        workspace=acme, issuer="https://adfs.jpmc.com/...",
        jwks_url="https://...", audience=["JPMC:URI:RS-..."],
        user_claim="email"
     )

3. External client calls Plane API:
   GET /api/v1/workspaces/acme/issues/
   Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ii...

4. DRF auth chain processes:
   a) APIKeyAuthentication → no X-Api-Key header → returns None
   b) OAuth2Authentication → token not in Plane's AccessToken table → returns None
   c) ExternalOIDCTokenAuthentication:
      - JWT has "kid" header → it's an external JWT
      - Workspace slug = "acme", issuer from JWT matches provider config
      - OAuth Bridge is installed in workspace "acme" → proceed
      - Validates JWT signature via JWKS, checks exp/iss/aud
      - Extracts email from "email" claim → finds Plane user mary@jpmc.com
      - Verifies mary is a workspace member → returns (user, payload)

5. Request proceeds as mary@jpmc.com. Done.
```

---

## Files to Create

| File                                                                     | Purpose                                          |
| ------------------------------------------------------------------------ | ------------------------------------------------ |
| `apps/api/plane/oauth_bridge/__init__.py`                                | Package init                                     |
| `apps/api/plane/oauth_bridge/apps.py`                                    | Django AppConfig                                 |
| `apps/api/plane/oauth_bridge/models/__init__.py`                         | Models package                                   |
| `apps/api/plane/oauth_bridge/models/provider.py`                         | `ExternalTokenProvider` model                    |
| `apps/api/plane/oauth_bridge/authentication.py`                          | `ExternalOIDCTokenAuthentication` DRF auth class |
| `apps/api/plane/oauth_bridge/views.py`                                   | Provider CRUD + test endpoints                   |
| `apps/api/plane/oauth_bridge/serializers.py`                             | DRF serializers                                  |
| `apps/api/plane/oauth_bridge/urls.py`                                    | URL patterns                                     |
| `apps/api/plane/oauth_bridge/migrations/0001_initial.py`                 | ExternalTokenProvider model                      |
| `apps/api/plane/oauth_bridge/migrations/0002_create_oauth_bridge_app.py` | Register as internal OAuth app                   |

## Files to Modify

| File                                                  | Change                                              |
| ----------------------------------------------------- | --------------------------------------------------- |
| `apps/api/plane/settings/common.py`                   | Add `plane.oauth_bridge` to `INSTALLED_APPS`        |
| `apps/api/plane/api/views/base.py`                    | Add `ExternalOIDCTokenAuthentication` to auth chain |
| `apps/api/plane/api/rate_limit.py`                    | Add `ExternalTokenRateThrottle`                     |
| `apps/api/plane/silo/utils/constants.py`              | Add `oauth-bridge` to `APPLICATIONS` dict           |
| `apps/api/plane/urls.py` or `apps/api/plane/ee/urls/` | Include oauth_bridge URLs                           |

## Key Existing Files to Reuse

| File                                                       | Pattern to follow                         |
| ---------------------------------------------------------- | ----------------------------------------- |
| `apps/api/plane/api/middleware/api_authentication.py`      | DRF `BaseAuthentication` pattern          |
| `apps/api/plane/silo/migrations/0011_create_runner_app.py` | Internal OAuth app registration migration |
| `apps/api/plane/silo/services/generate_application.py`     | `generate_application()` service          |
| `apps/api/plane/silo/utils/constants.py`                   | `APPLICATIONS` dict                       |
| `apps/api/plane/authentication/models/oauth.py`            | `WorkspaceAppInstallation` (used as-is)   |
| `apps/api/plane/ee/views/app/oauth/application.py`         | `OAuthApplicationInstallEndpoint`         |
| `apps/api/plane/app/permissions/workspace.py`              | `WorkSpaceAdminPermission`                |

---

## Implementation Order

1. Django app scaffold (`apps/api/plane/oauth_bridge/`)
2. `ExternalTokenProvider` model + migration
3. Register OAuth Bridge as internal OAuth app (migration + constants)
4. `ExternalOIDCTokenAuthentication` auth class
5. Wire into `BaseAPIView` auth chain
6. Provider CRUD endpoints (views + serializers + URLs)
7. Rate limiting
8. Register in `INSTALLED_APPS` and URL config

---

## Verification

1. **Unit test**: Create `ExternalTokenProvider`, sign JWT with test RSA key, mock JWKS endpoint, verify auth class validates and maps to Plane user
2. **Negative tests**: Expired token, wrong issuer, wrong audience, unknown `kid`, disabled provider, app not installed, non-member user
3. **Integration test**: Install OAuth Bridge via workspace API, create a provider, call Plane's API with external Bearer token
4. **Manual E2E**: Configure with a real Azure AD / ADFS instance and verify the full flow
