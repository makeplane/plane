# Authentication Module

Multi-factor authentication, OAuth, SSO, session management, and API access control.

## Authentication Methods

| Method         | Provider                    |
| -------------- | --------------------------- |
| Email/Password | `credentials/email.py`      |
| Magic Link     | `credentials/magic_code.py` |
| LDAP           | `credentials/ldap.py`       |
| GitHub OAuth   | `oauth/github.py`           |
| Google OAuth   | `oauth/google.py`           |
| GitLab OAuth   | `oauth/gitlab.py`           |
| OIDC           | `oauth/oidc.py`             |
| SAML           | `adapter/saml.py`           |

## OAuth Models

- **Application**: Third-party OAuth apps with marketplace fields
- **AccessToken**: OAuth 2.0 access tokens
- **RefreshToken**: Token rotation
- **Grant**: Authorization code grants
- **IDToken**: OpenID Connect tokens
- **WorkspaceAppInstallation**: App installation per workspace

## SSO Models

- **Domain**: Workspace domain with DNS verification
- **IdentityProvider**: OIDC/SAML provider configuration
- **IdentityProviderDomain**: Provider-domain mapping

## Rate Limiting

| Throttle                  | Rate        |
| ------------------------- | ----------- |
| AuthenticationThrottle    | 30/minute   |
| EmailVerificationThrottle | 3/hour      |
| OAuthTokenRateThrottle    | 5000/minute |

## Key Endpoints

```
/sign-in/                    # Email password signin
/sign-up/                    # Email password signup
/google/callback/            # Google OAuth
/github/callback/            # GitHub OAuth
/oidc/, /oidc/callback/      # OIDC flows
/saml/, /saml/callback/      # SAML flows
/ldap/                       # LDAP auth
/magic-generate/             # Magic link generation
/sso/workspaces/<slug>/providers/  # SSO management
```

## Error Handling

70+ error codes in `AuthenticationException`:

- Global: INSTANCE_NOT_CONFIGURED, INVALID_EMAIL
- Sign Up/In: USER_ALREADY_EXIST, AUTHENTICATION_FAILED
- OAuth: GOOGLE_NOT_CONFIGURED, GITHUB_NOT_CONFIGURED
- SSO: DOMAIN_NOT_VERIFIED, OIDC_PROVIDER_ERROR

## Feature Docs

- **OIDC Group Syncing**: [docs/OIDC_GROUP_SYNCING.md](../../../../../docs/OIDC_GROUP_SYNCING.md)
