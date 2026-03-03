# Phase A1: Types + Instance Config

## Context Links

- [Instance auth types](../../packages/types/src/instance/auth.ts)
- [Instance base types](../../packages/types/src/instance/base.ts)
- [Config variables](../../apps/api/plane/utils/instance_config_variables/core.py)
- [Instance view](../../apps/api/plane/license/api/views/instance.py)

## Overview

- **Priority:** P1 — foundation for all subsequent phases
- **Status:** pending
- **Description:** Add Swing SSO type definitions, 5 config keys to instance config, expose `is_swing_sso_enabled` boolean to frontend

## Key Insights

- Pattern identical to LDAP: string config keys in admin (`"0"/"1"`), exposed as boolean in `IInstanceConfig` for web app
- `TInstanceAuthenticationMethodKeys` is a union type — just add `"IS_SWING_SSO_ENABLED"`
- Config keys follow `{CATEGORY}_{FIELD}` pattern with `is_encrypted` for secrets

## Requirements

**Functional:**

- TypeScript types for Swing SSO config keys
- 5 backend config entries seeded into DB
- `is_swing_sso_enabled` boolean exposed in public instance config
- Admin `formattedConfig` automatically picks up new keys (no extra work)

**Non-functional:**

- No breaking changes to existing types

## Architecture

```
packages/types/src/instance/auth.ts   → add types
packages/types/src/instance/base.ts   → add boolean field
apps/api/.../core.py                  → add 5 config entries
apps/api/.../instance.py              → load + expose config
```

## Related Code Files

**Files to modify:**

- `/Volumes/Data/SHBVN/plane.so/packages/types/src/instance/auth.ts`
- `/Volumes/Data/SHBVN/plane.so/packages/types/src/instance/base.ts`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/utils/instance_config_variables/core.py`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/api/views/instance.py`

## Implementation Steps

### Step 1: Add TypeScript types (`packages/types/src/instance/auth.ts`)

1a. Add `"swing-sso"` to `TCoreInstanceAuthenticationModeKeys`:

```typescript
export type TCoreInstanceAuthenticationModeKeys =
  | "unique-codes"
  | "passwords-login"
  | "google"
  | "github"
  | "gitlab"
  | "gitea"
  | "ldap"
  | "swing-sso"; // ADD
```

1b. Add `"IS_SWING_SSO_ENABLED"` to `TInstanceAuthenticationMethodKeys`:

```typescript
export type TInstanceAuthenticationMethodKeys =
  | "ENABLE_SIGNUP"
  | "ENABLE_MAGIC_LINK_LOGIN"
  | "ENABLE_EMAIL_PASSWORD"
  | "IS_GOOGLE_ENABLED"
  | "IS_GITHUB_ENABLED"
  | "IS_GITLAB_ENABLED"
  | "IS_GITEA_ENABLED"
  | "IS_LDAP_ENABLED"
  | "IS_SWING_SSO_ENABLED"; // ADD
```

1c. Add new config keys type (after `TInstanceLDAPAuthenticationConfigurationKeys`):

```typescript
export type TInstanceSwingSSOAuthenticationConfigurationKeys =
  | "SWING_SSO_URL"
  | "SWING_SSO_CLIENT_ID"
  | "SWING_SSO_CLIENT_SECRET"
  | "SWING_SSO_COMPANY_CODE";
```

1d. Add to `TInstanceAuthenticationConfigurationKeys` union:

```typescript
export type TInstanceAuthenticationConfigurationKeys =
  | TInstanceGoogleAuthenticationConfigurationKeys
  | TInstanceGithubAuthenticationConfigurationKeys
  | TInstanceGitlabAuthenticationConfigurationKeys
  | TInstanceGiteaAuthenticationConfigurationKeys
  | TInstanceLDAPAuthenticationConfigurationKeys
  | TInstanceSwingSSOAuthenticationConfigurationKeys; // ADD
```

### Step 2: Add boolean to IInstanceConfig (`packages/types/src/instance/base.ts`)

Add after `is_ldap_enabled`:

```typescript
export interface IInstanceConfig {
  // ... existing fields ...
  is_ldap_enabled: boolean;
  is_swing_sso_enabled: boolean; // ADD
  // ... rest ...
}
```

### Step 3: Add 5 config entries (`apps/api/plane/utils/instance_config_variables/core.py`)

Add after `ldap_config_variables`:

```python
swing_sso_config_variables = [
    {
        "key": "IS_SWING_SSO_ENABLED",
        "value": os.environ.get("IS_SWING_SSO_ENABLED", "0"),
        "category": "SWING_SSO",
        "is_encrypted": False,
    },
    {
        "key": "SWING_SSO_URL",
        "value": os.environ.get("SWING_SSO_URL", ""),
        "category": "SWING_SSO",
        "is_encrypted": False,
    },
    {
        "key": "SWING_SSO_CLIENT_ID",
        "value": os.environ.get("SWING_SSO_CLIENT_ID", ""),
        "category": "SWING_SSO",
        "is_encrypted": False,
    },
    {
        "key": "SWING_SSO_CLIENT_SECRET",
        "value": os.environ.get("SWING_SSO_CLIENT_SECRET", ""),
        "category": "SWING_SSO",
        "is_encrypted": True,
    },
    {
        "key": "SWING_SSO_COMPANY_CODE",
        "value": os.environ.get("SWING_SSO_COMPANY_CODE", "sh"),
        "category": "SWING_SSO",
        "is_encrypted": False,
    },
]
```

Add to `core_config_variables`:

```python
core_config_variables = [
    # ... existing ...
    *ldap_config_variables,
    *swing_sso_config_variables,  # ADD
    *smtp_config_variables,
    # ... rest ...
]
```

### Step 4: Expose in instance config response (`apps/api/plane/license/api/views/instance.py`)

4a. Add `IS_SWING_SSO_ENABLED` to `get_configuration_value()` call:

```python
(
    # ... existing vars ...
    IS_LDAP_ENABLED,
    IS_SWING_SSO_ENABLED,  # ADD
    IS_INTERCOM_ENABLED,
    # ...
) = get_configuration_value(
    [
        # ... existing ...
        {"key": "IS_LDAP_ENABLED", "default": os.environ.get("IS_LDAP_ENABLED", "0")},
        {"key": "IS_SWING_SSO_ENABLED", "default": os.environ.get("IS_SWING_SSO_ENABLED", "0")},  # ADD
        {"key": "IS_INTERCOM_ENABLED", "default": os.environ.get("IS_INTERCOM_ENABLED", "1")},
        # ...
    ]
)
```

4b. Set boolean in response data (after `is_ldap_enabled`):

```python
data["is_ldap_enabled"] = IS_LDAP_ENABLED == "1"
data["is_swing_sso_enabled"] = IS_SWING_SSO_ENABLED == "1"  # ADD
```

## Todo List

- [ ] Add `"swing-sso"` to `TCoreInstanceAuthenticationModeKeys`
- [ ] Add `"IS_SWING_SSO_ENABLED"` to `TInstanceAuthenticationMethodKeys`
- [ ] Add `TInstanceSwingSSOAuthenticationConfigurationKeys` type
- [ ] Add to `TInstanceAuthenticationConfigurationKeys` union
- [ ] Add `is_swing_sso_enabled: boolean` to `IInstanceConfig`
- [ ] Add 5 config entries in `core.py`
- [ ] Add to `core_config_variables` spread
- [ ] Load `IS_SWING_SSO_ENABLED` in instance view
- [ ] Expose `is_swing_sso_enabled` boolean in response

## Success Criteria

- `pnpm check:lint` passes for types package
- Backend starts without errors
- GET `/api/instances/` returns `is_swing_sso_enabled: false` by default
- Admin config page loads without errors (new keys visible in `formattedConfig`)

## Risk Assessment

- **Low risk**: additive changes only, no breaking modifications
- Config key naming must be consistent — use `SWING_SSO_` prefix everywhere

## Security Considerations

- `SWING_SSO_CLIENT_SECRET` marked `is_encrypted: True` — stored encrypted in DB
- Default `companyCode` is `"sh"` but configurable by admin

## Next Steps

- Phase A2: Backend auth provider uses these config keys
