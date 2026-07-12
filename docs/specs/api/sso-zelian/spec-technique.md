# Spec Technique — SSO Zelian (Supabase OAuth 2.1 / OIDC)

| Champ      | Valeur              |
|------------|----------------------|
| Module     | api/sso-zelian      |
| Version    | 0.1.0               |
| Date       | 2026-07-12          |
| Statut     | IMPLÉMENTÉ (code, validé offline) — E2E bloqué sur config Supabase |

---

## Architecture

Réplication **clean-room** du provider OAuth `gitea` (host configurable) + 2 ajouts imposés par le serveur OAuth 2.1 de Supabase : **PKCE S256** et **`client_secret_basic`**. Zéro migration DB (config par `get_configuration_value` → fallback env). Frontend via les seams d'extension existants (aucune modif de fichier core).

## Fichiers créés

| Fichier | Rôle |
|---------|------|
| `apps/api/plane/authentication/provider/oauth/zelian.py` | `ZelianOAuthProvider` (auth URL + PKCE, token exchange Basic auth + `code_verifier`, mapping userinfo Supabase) |
| `apps/api/plane/authentication/views/app/zelian.py` | `ZelianOauthInitiateEndpoint` / `ZelianCallbackEndpoint` + helper `generate_pkce_pair()` (verifier/challenge S256 en session) |
| `apps/api/plane/authentication/views/space/zelian.py` | Variantes Space (réutilise `generate_pkce_pair`) |
| `apps/web/core/hooks/oauth/extended.tsx` | Hook seam web → bouton « Continue with Zelian », URL `/auth/zelian/` |
| `apps/space/hooks/oauth/extended.tsx` | Hook seam space → URL `/auth/spaces/zelian/` |
| `apps/{web,space}/app/assets/logos/zelian-logo.svg` | Logo (placeholder hexagone ⬡) |
| `apps/api/plane/tests/unit/test_zelian_oauth_provider.py` | 9 tests unitaires offline |

## Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `apps/api/plane/authentication/adapter/error.py` | `ZELIAN_NOT_CONFIGURED=5113`, `ZELIAN_OAUTH_PROVIDER_ERROR=5124` |
| `apps/api/plane/authentication/adapter/oauth.py` | branche `zelian` dans `authentication_error_code()` |
| `apps/api/plane/authentication/views/__init__.py` | exports app + space |
| `apps/api/plane/authentication/urls.py` | 4 routes : `zelian/`, `zelian/callback/`, `spaces/zelian/`, `spaces/zelian/callback/` |
| `apps/api/plane/license/api/views/instance.py` | `IS_ZELIAN_ENABLED` → `data["is_zelian_enabled"]` |
| `apps/api/.env.example` | doc des vars `IS_ZELIAN_ENABLED` / `ZELIAN_AUTH_BASE_URL` / `ZELIAN_CLIENT_ID` / `ZELIAN_CLIENT_SECRET` |
| `packages/types/src/instance/auth-ee.ts` | `TExtendedLoginMediums = "zelian"` |
| `packages/types/src/instance/base.ts` | `is_zelian_enabled: boolean` sur `IInstanceConfig` |
| `packages/constants/src/auth/extended.ts` | `EXTENDED_LOGIN_MEDIUM_LABELS.zelian = "Zelian"` |

## Contrat OAuth (endpoints Supabase)

Base = `ZELIAN_AUTH_BASE_URL` (ex. `https://<ref>.supabase.co/auth/v1`). authorize = `{base}/oauth/authorize`, token = `{base}/oauth/token`, userinfo = `{base}/oauth/userinfo`. Redirect URI construit serveur : `{scheme}://{host}/auth/zelian/callback/`.
- **initiate** : génère `state` + PKCE (`code_verifier` en session, `code_challenge` S256 dans l'URL), redirige vers authorize.
- **callback** : vérifie `state` (session) → échange `code` + `code_verifier` (Basic auth) → userinfo → `get_or_create` User + `Account(provider="zelian")` → session Django.

## Config (env)

`IS_ZELIAN_ENABLED`, `ZELIAN_AUTH_BASE_URL`, `ZELIAN_CLIENT_ID`, `ZELIAN_CLIENT_SECRET`. ⚠️ `/api/instances/` est caché 2 h → `cache.clear()` après activation.

## Tests / vérification

- **9 tests unitaires offline** (`test_zelian_oauth_provider.py`) : génération PKCE (S256, unicité), erreur si non configuré / scheme invalide, URL authorize (params PKCE + endpoints + redirect_uri), token/userinfo URLs, token exchange (Basic auth + `code_verifier` + `grant_type`), mapping userinfo (`sub`/name/picture + fallback local-part).
- Résolution des **4 routes** (URLconf à froid) → bonnes vues. `/api/instances/` expose `is_zelian_enabled`. py_compile + ruff clean. oxlint/oxfmt clean. turbo `check:types` web+space **12/12**.
- **NON testé** (nécessite un serveur OAuth Supabase configuré) : flux authorize→consent→callback→token→userinfo→user, apparition du bouton avec `IS_ZELIAN_ENABLED=1`.

## Pièges connus

- Flux **space** : le core gitea du space pointe (incohérence upstream) vers `/auth/gitea/` ; ici le flux space utilise correctement `/auth/spaces/zelian/` (host space via `request.session["host"]`).
- `runserver` ne recharge PAS les nouveaux modules (`views/app/zelian.py`…) → `docker restart plane-api-1` avant test live.
- PKCE : `code_verifier` doit survivre entre initiate et callback → stocké en session (comme `state`).
- Vérifier le `.well-known/openid-configuration` réel de Supabase (feature bêta) avant test — adapter si le contrat diffère.
