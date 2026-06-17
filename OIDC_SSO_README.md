# Generic OIDC SSO for self-hosted Plane (Keycloak / Kanidm / any standards-compliant IdP)

Patch base: `makeplane/plane` commit `f2feca61e838b011d3bb51cf76ee3c03cacf3f54` (2026-06-15).
If `git apply` complains about drift on your checkout, try `git apply --3way 0001-add-oidc-sso-support.patch`, or just copy the new files in manually — the edits to existing files are all small, additive blocks.

## What this adds

A fifth login provider, `oidc`, sitting alongside Google/GitHub/GitLab/Gitea in the existing OAuth provider pattern:

- `apps/api/plane/authentication/provider/oauth/oidc.py` — the provider. Takes either a single `OIDC_ISSUER` (auto-discovers the authorize/token/userinfo/JWKS endpoints from `<issuer>/.well-known/openid-configuration`) or explicit endpoint URLs if your IdP doesn't support discovery or you want to pin them. Explicit values always override discovered ones.
- ID token signature verification via JWKS (`jwt.PyJWKClient` + `jwt.decode`) whenever a `jwks_uri` is available, either configured or discovered. None of Plane's other four OAuth providers do this — they just trust whatever the userinfo endpoint returns over the access token. This is a real security improvement, not just parity.
- New views (`views/app/oidc.py`, `views/space/oidc.py`) and routes: `/auth/oidc/`, `/auth/oidc/callback/`, plus the `spaces/` equivalents, matching the existing per-provider pattern exactly.
- New error codes `OIDC_NOT_CONFIGURED` (5113) and `OIDC_OAUTH_PROVIDER_ERROR` (5124).
- Config keys registered the same way Google/GitHub/etc. are, so they're editable from the running instance, not just `.env`: `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_AUTHORIZATION_ENDPOINT`, `OIDC_TOKEN_ENDPOINT`, `OIDC_USERINFO_ENDPOINT`, `OIDC_JWKS_URI`, `OIDC_SCOPE`, `OIDC_DISPLAY_NAME`, `ENABLE_OIDC_SYNC`, plus the `IS_OIDC_ENABLED` toggle.
- A `/god-mode/authentication/oidc` admin page (mirrors the Google one) with fields for all of the above, including an Origin URL / Callback URI card so you can copy the exact redirect URI into Keycloak/Kanidm's client config.
- A "Continue with `{OIDC_DISPLAY_NAME}`" button wired into both the main web app and the public space app's sign-in screens, shown whenever `IS_OIDC_ENABLED` is on.

## Applying it

```
cd ~/Desktop/plane
git apply /path/to/0001-add-oidc-sso-support.patch
docker compose build api worker beat-worker migrator web admin space
docker compose up -d
```

You're rebuilding from your own `Dockerfile`s (your `docker-compose.yml` already does `build: context:` rather than pulling images), so this is a normal local-source change for your setup — no image swap needed.

## One bootstrap gotcha on your existing instance

`configure_instance` (run automatically by the API container on startup) only seeds the `IS_OIDC_ENABLED` row if *none* of `IS_GOOGLE_ENABLED` / `IS_GITHUB_ENABLED` / `IS_GITLAB_ENABLED` / `IS_GITEA_ENABLED` / `IS_OIDC_ENABLED` exist yet. Since your instance already has the first four seeded from 8+ days ago, it'll skip the whole block and `IS_OIDC_ENABLED` will never get created automatically. This is a pre-existing quirk in how Plane's seeding script checks "any of these exist" rather than each key individually — it'll bite anyone adding a 5th provider to an already-bootstrapped instance, not just this patch.

One-time fix after rebuilding:

```
docker compose exec api python manage.py shell -c "
from plane.license.models import InstanceConfiguration
InstanceConfiguration.objects.get_or_create(key='IS_OIDC_ENABLED', defaults={'value': '0', 'category': 'AUTHENTICATION', 'is_encrypted': False})
"
```

The other nine `OIDC_*` keys don't have this problem — they're seeded individually via `get_or_create` regardless.

## Configuring against Keycloak or Kanidm

In your IdP, create a confidential OAuth/OIDC client with redirect URI `https://<your-domain>/auth/oidc/callback/` (and `https://<your-domain>/auth/spaces/oidc/callback/` if you also want SSO on the public space portal). Then in Plane, go to `/god-mode/authentication/oidc` and fill in:

- **Display name**: whatever you want the login button to say, e.g. "Keycloak" or "Kanidm".
- **Client ID** / **Client secret**: from the client you just created.
- **Issuer URL**: for Keycloak this is `https://<host>/realms/<realm>`; for Kanidm it's whatever base URL Kanidm reports as its OIDC issuer for that client. Leave the four manual endpoint fields blank — discovery will fill them in.
- Only fill in the manual Authorization/Token/Userinfo/JWKS fields if your IdP doesn't expose `/.well-known/openid-configuration`, or you want to override discovery.

Save, flip the toggle on, and "Continue with Keycloak" (or whatever you named it) should show up on the sign-in page.

## Known gaps / things I didn't wire up

- `ENABLE_OIDC_SYNC` exists as a config key and is checked by the backend (re-pulls profile fields from the IdP on every login, same as the other providers), but I didn't add a switch for it to the admin form — the Google form has one (`ENABLE_GOOGLE_SYNC`), this one doesn't yet. Easy to add if you want it; it's the same `ControllerSwitch` pattern as `form.tsx` for Google.
- I verified the JWKS signature-verification logic end-to-end against the exact pinned `PyJWT==2.12.0` / `cryptography==46.0.7` versions in your `requirements/base.txt` (self-signed RSA keypair, real sign/verify/tamper-detection round trip), and syntax-checked every new/edited TS/TSX file with esbuild. I have not run this against a real build of the whole monorepo (would need the full pnpm workspace installed), so there's some residual risk of a type-level mismatch in the frontend pieces that only a real `pnpm build` would catch.
- Unrelated thing I noticed while building this: `views/space/google.py`'s callback view has a latent bug — it does `base_host = request.session.get("host")`, which shadows the imported `base_host` *function*, then later tries to call that string as `base_host(request=request, is_space=True)`. If that error path is ever hit, it'll throw `TypeError: 'str' object is not callable` instead of redirecting cleanly. I did not copy this into the new OIDC space view, and didn't fix it in `google.py` since that's out of scope here, but worth knowing about if Google space login ever misbehaves for you.
