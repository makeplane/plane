# Tech Design — SSO Zelian (Supabase OAuth 2.1)

> Intention technique. Source : `PLAN-SSO-SUPABASE-PLANE.md`.

## Décisions

1. **Clean-room depuis `gitea`** (provider OAuth CE host-configurable) — jamais de copie plane-ee (AGPL). Le provider gitea est le modèle exact ; on ajoute PKCE S256 + `client_secret_basic`.
2. **Seams front uniquement** (`extended.tsx`, `auth-ee.ts`, `EXTENDED_LOGIN_MEDIUM_LABELS`) → zéro modif de fichier core en v1 (revue + AGPL plus simples). `useOAuthConfig` fusionne déjà core + extended.
3. **Zéro migration** : config via `get_configuration_value` (fallback env), pattern identique aux autres providers.
4. **Space** : utiliser les endpoints space dédiés (`/auth/spaces/zelian/`) plutôt que reproduire l'incohérence du core gitea space (qui pointe sur `/auth/gitea/`).
5. **Exclu de v1** : l'auto-redirect « SSO sans clic » (§6 du plan) touche `auth-root.tsx` (core) → follow-up après validation E2E, avec les garde-fous (`?sso=0`, ne pas rediriger si `error_code`).

## Alternatives écartées (cf. plan §0)

Plane Commercial + OIDC natif (payant), Google OAuth CE (≠ SSO Supabase), reverse-proxy header (non supporté), réutilisation directe du cookie `.zelian.fr` (Plane = backend tiers hors domaine de confiance).

## Dépendances externes (BLOQUANTES pour l'E2E)

- **Supabase** (§2 du plan, humain) : activer OAuth Server, enregistrer le client `Plane` (Confidential, Redirect URIs exacts avec slash final), clés JWT asymétriques (ES256/RS256 pour `openid`), récupérer Client ID/Secret.
- **Page `/oauth/consent`** (§3) dans l'app du Site URL Supabase (repo externe).
- Vérifier le `.well-known/openid-configuration` réel (bêta) avant test.

## Gouvernance (hors code, à faire en parallèle — plan §9)

- **ADR** « Intégration Plane par l'identité — SSO via serveur OAuth 2.1 Supabase » (catégorie AUTH, whitelist ADR-policy) : étend doc 09 §9.9, amende `HUB-TOOLS-ANALYSE`.
- Registre `05-flux-de-donnees.md` §5.1, note AGPL (fork déjà publié), secrets en gestionnaire (règle 07).

## Risques

- Serveur OAuth Supabase en bêta (Cloud) : contrat susceptible d'évoluer ; re-vérifier si migration self-hosted (doc 09 §9.10).
- Clés JWT HS256 legacy partagées : la migration ES256 doit être coordonnée avec les autres apps Zelian.
