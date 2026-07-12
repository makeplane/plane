# VERSIONNING — api/sso-zelian

| Version | Date | Type | Description | Fichiers touchés |
|---------|------|------|-------------|------------------|
| 0.1.0 | 2026-07-12 | feat | SSO Zelian via serveur OAuth 2.1 Supabase, clean-room depuis `gitea` + PKCE S256 + `client_secret_basic`. Backend (provider + views app/space + routes + erreurs + `is_zelian_enabled`) + frontend (seams web/space, types, label, logo). Zéro migration. Validé offline (9 tests unitaires, routes, config, typecheck 12/12) ; E2E bloqué sur config Supabase. | apps/api/plane/authentication/{provider/oauth/zelian.py, views/app/zelian.py, views/space/zelian.py, adapter/error.py, adapter/oauth.py, views/__init__.py, urls.py}, apps/api/plane/license/api/views/instance.py, apps/api/.env.example, apps/api/plane/tests/unit/test_zelian_oauth_provider.py, packages/types/src/instance/{auth-ee.ts, base.ts}, packages/constants/src/auth/extended.ts, apps/web/core/hooks/oauth/extended.tsx, apps/space/hooks/oauth/extended.tsx, apps/{web,space}/app/assets/logos/zelian-logo.svg |

> Table mise à jour par @update-writer-after-implement après chaque implémentation.
