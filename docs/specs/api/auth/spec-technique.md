# Spec Technique — auth

| Champ         | Valeur              |
|---------------|---------------------|
| Module        | auth                |
| App           | api                 |
| Version       | 0.1.0               |
| Date          | 2026-06-30          |
| Source        | Rétro-ingénierie    |

---

## Architecture du module

Le module est structuré en couches :

```
plane/authentication/
├── adapter/          # Couche abstraite (pattern Template Method)
│   ├── base.py       # Adapter — logique commune sign-in/sign-up, SSRF-safe avatar download
│   ├── credential.py # CredentialAdapter — spécialise Adapter pour email/magic
│   ├── oauth.py      # OauthAdapter — spécialise Adapter pour les providers OAuth2
│   ├── error.py      # AUTHENTICATION_ERROR_CODES (dict) + AuthenticationException
│   └── exception.py  # Handling exceptions
├── provider/         # Implémentations concrètes
│   ├── credentials/
│   │   ├── email.py       # EmailProvider (email+password)
│   │   └── magic_code.py  # MagicCodeProvider (OTP Redis)
│   └── oauth/
│       ├── github.py   # GitHubOAuthProvider
│       ├── google.py   # GoogleOAuthProvider
│       ├── gitlab.py   # GitLabOAuthProvider
│       └── gitea.py    # GiteaOAuthProvider
├── middleware/
│   └── session.py    # SessionMiddleware custom (double cookie app/admin)
├── views/
│   ├── app/          # Endpoints pour l'app principale
│   │   ├── check.py              # EmailCheckEndpoint
│   │   ├── email.py              # SignInAuthEndpoint, SignUpAuthEndpoint
│   │   ├── magic.py              # MagicGenerateEndpoint, MagicSignInEndpoint, MagicSignUpEndpoint
│   │   ├── github.py             # GitHubOauthInitiateEndpoint, GitHubCallbackEndpoint
│   │   ├── google.py             # GoogleOauthInitiateEndpoint, GoogleCallbackEndpoint
│   │   ├── gitlab.py             # GitLabOauthInitiateEndpoint, GitLabCallbackEndpoint
│   │   ├── gitea.py              # GiteaOauthInitiateEndpoint, GiteaCallbackEndpoint
│   │   ├── password_management.py # ForgotPasswordEndpoint, ResetPasswordEndpoint, ChangePasswordEndpoint
│   │   └── signout.py            # SignOutAuthEndpoint
│   └── space/        # Endpoints dupliqués pour le contexte Space (public)
│       └── ...       # Structure miroir de views/app/
├── utils/
│   ├── host.py                   # base_host() — calcul du host de redirection
│   ├── login.py                  # user_login() — wraps django.contrib.auth.login + device_info
│   ├── redirection_path.py       # get_redirection_path() — chemin post-login
│   ├── user_auth_workflow.py     # post_user_auth_workflow() — callback post-auth
│   └── workspace_project_join.py # process_workspace_project_invitations()
├── rate_limit.py     # AuthenticationThrottle, EmailVerificationThrottle
├── session.py        # BaseSessionAuthentication (CSRF désactivé pour DRF)
└── urls.py           # Routage — 26 routes auth (app + space)
```

**Flux d'une authentification credential (email/magic)** :
```
View → Provider.__init__() (config check) → Provider.set_user_data()
     → Adapter.complete_login_or_signup() (create/find user, signup check, avatar)
     → callback (post_user_auth_workflow)
     → user_login() (session Django)
     → HttpResponseRedirect
```

**Flux OAuth** :
```
InitiateView → Provider.__init__() → provider.get_auth_url() → HttpResponseRedirect(provider)
CallbackView → Provider(code=code) → OauthAdapter.authenticate()
             → set_token_data() + set_user_data() + complete_login_or_signup()
             → create_update_account() (Account model)
             → user_login() → HttpResponseRedirect
```

---

## Fichiers impactés

| Fichier | Rôle | Lignes |
|---------|------|--------|
| `apps/api/plane/authentication/adapter/base.py` | Adapter — logique centrale sign-up/sign-in, avatar SSRF-safe, sync IDP | ~396 |
| `apps/api/plane/authentication/adapter/oauth.py` | OauthAdapter — échange de token, récupération userinfo, création Account | ~136 |
| `apps/api/plane/authentication/adapter/credential.py` | CredentialAdapter — délégation simple à Adapter | ~19 |
| `apps/api/plane/authentication/adapter/error.py` | Catalogue d'erreurs (74 codes 5000–5999) + AuthenticationException | ~87 |
| `apps/api/plane/authentication/provider/credentials/email.py` | EmailProvider — signin/signup email+password | ~97 |
| `apps/api/plane/authentication/provider/credentials/magic_code.py` | MagicCodeProvider — OTP Redis, double compteur anti-brute-force | ~212 |
| `apps/api/plane/authentication/provider/oauth/github.py` | GitHubOAuthProvider — scope, org check, email secondaire | ~184 |
| `apps/api/plane/authentication/provider/oauth/google.py` | GoogleOAuthProvider — standard OAuth2 Google | ~116 |
| `apps/api/plane/authentication/provider/oauth/gitlab.py` | GitLabOAuthProvider — host configurable | ~125 |
| `apps/api/plane/authentication/provider/oauth/gitea.py` | GiteaOAuthProvider — host configurable, URL validation, email fallback | ~174 |
| `apps/api/plane/authentication/middleware/session.py` | SessionMiddleware custom — double cookie (app vs admin) | ~93 |
| `apps/api/plane/authentication/session.py` | BaseSessionAuthentication — CSRF désactivé pour DRF | ~10 |
| `apps/api/plane/authentication/rate_limit.py` | AuthenticationThrottle (10/min, configurable) + EmailVerificationThrottle (3/h) | ~69 |
| `apps/api/plane/authentication/views/app/email.py` | SignInAuthEndpoint + SignUpAuthEndpoint (django.views.View, redirect-based) | ~239 |
| `apps/api/plane/authentication/views/app/magic.py` | MagicGenerateEndpoint (APIView) + MagicSignInEndpoint + MagicSignUpEndpoint (View) | ~224 |
| `apps/api/plane/authentication/views/app/check.py` | EmailCheckEndpoint — préqualification email | ~104 |
| `apps/api/plane/authentication/views/app/password_management.py` | ForgotPasswordEndpoint + ResetPasswordEndpoint | ~177 |
| `apps/api/plane/authentication/views/app/github.py` | GitHubOauthInitiateEndpoint + GitHubCallbackEndpoint | ~107 |
| `apps/api/plane/authentication/views/app/google.py` | GoogleOauthInitiateEndpoint + GoogleCallbackEndpoint | ~(similaire) |
| `apps/api/plane/authentication/views/app/gitlab.py` | GitLabOauthInitiateEndpoint + GitLabCallbackEndpoint | ~(similaire) |
| `apps/api/plane/authentication/views/app/gitea.py` | GiteaOauthInitiateEndpoint + GiteaCallbackEndpoint | ~(similaire) |
| `apps/api/plane/authentication/views/app/signout.py` | SignOutAuthEndpoint | ~(court) |
| `apps/api/plane/authentication/views/space/` | Miroir de views/app/ pour le contexte Space | ~(idem) |
| `apps/api/plane/authentication/urls.py` | 26 routes auth (app + space) | ~154 |
| `apps/api/plane/authentication/utils/login.py` | user_login() — wraps django login + stocke device_info en session | ~28 |
| `apps/api/plane/authentication/utils/user_auth_workflow.py` | post_user_auth_workflow() — traitement invitations post-auth | ~8 |
| `apps/api/plane/authentication/utils/workspace_project_join.py` | process_workspace_project_invitations() | ~(non lu en détail) |

---

## Schéma BDD (modèles impliqués)

| Modèle | Table Django | Usage dans ce module |
|--------|-------------|----------------------|
| `User` (`db.User`) | `db_user` | Création, lookup, activation, save_user_data |
| `Profile` | `db_profile` | Création au signup, vérification `is_onboarded` |
| `Account` | `db_account` | Stockage tokens OAuth par provider (create/update) |
| `WorkspaceMemberInvite` | `db_workspacememberinvite` | Vérification invitation pour débloquer signup |
| `FileAsset` | `db_fileasset` | Stockage avatars hébergés (création + suppression old) |
| `Instance` | `license_instance` | Vérification `is_setup_done` avant chaque auth |

**Champs notables de `User`** (déduits du code) :
- `email` — identifiant unique
- `username` — UUID hex autogénéré (pas exposé à l'utilisateur)
- `is_password_autoset` — True si mot de passe généré automatiquement (OAuth/magic link)
- `is_email_verified` — True après authentification réussie
- `last_login_medium` — provider utilisé pour la dernière connexion
- `last_login_time`, `last_active`, `last_login_ip`, `last_login_uagent` — audit trail
- `token_updated_at` — timestamp pour invalidation de token
- `last_logout_time` — discriminateur compte désactivé explicitement vs non-activé
- `is_active` — flag d'activation
- `avatar` / `avatar_asset` — avatar URL externe ou FileAsset hébergé

---

## API / Endpoints

### Contexte app (`/auth/`)

| Méthode | Route | Vue | Description | Auth |
|---------|-------|-----|-------------|------|
| POST | `/auth/sign-in/` | `SignInAuthEndpoint` | Connexion email+password. Retourne HttpResponseRedirect. | Non |
| POST | `/auth/sign-up/` | `SignUpAuthEndpoint` | Inscription email+password. Retourne HttpResponseRedirect. | Non |
| POST | `/auth/sign-out/` | `SignOutAuthEndpoint` | Déconnexion. | Oui |
| POST | `/auth/magic-generate/` | `MagicGenerateEndpoint` (APIView) | Génère et envoie un OTP. Retourne `{ key }`. | Non |
| POST | `/auth/magic-sign-in/` | `MagicSignInEndpoint` (View) | Connexion par OTP. Retourne HttpResponseRedirect. | Non |
| POST | `/auth/magic-sign-up/` | `MagicSignUpEndpoint` (View) | Inscription par OTP. Retourne HttpResponseRedirect. | Non |
| GET | `/auth/google/` | `GoogleOauthInitiateEndpoint` | Lance le flow OAuth Google. Retourne redirect. | Non |
| GET | `/auth/google/callback/` | `GoogleCallbackEndpoint` | Callback OAuth Google. | Non |
| GET | `/auth/github/` | `GitHubOauthInitiateEndpoint` | Lance le flow OAuth GitHub. | Non |
| GET | `/auth/github/callback/` | `GitHubCallbackEndpoint` | Callback OAuth GitHub + vérification state. | Non |
| GET | `/auth/gitlab/` | `GitLabOauthInitiateEndpoint` | Lance le flow OAuth GitLab. | Non |
| GET | `/auth/gitlab/callback/` | `GitLabCallbackEndpoint` | Callback OAuth GitLab. | Non |
| GET | `/auth/gitea/` | `GiteaOauthInitiateEndpoint` | Lance le flow OAuth Gitea. | Non |
| GET | `/auth/gitea/callback/` | `GiteaCallbackEndpoint` | Callback OAuth Gitea. | Non |
| POST | `/auth/email-check/` | `EmailCheckEndpoint` | Préqualification email. Retourne `{ existing, status }`. | Non |
| POST | `/auth/forgot-password/` | `ForgotPasswordEndpoint` | Envoie email de reset. | Non |
| POST | `/auth/reset-password/<uidb64>/<token>/` | `ResetPasswordEndpoint` | Réinitialise le mot de passe. | Non |
| POST | `/auth/change-password/` | `ChangePasswordEndpoint` | Change le mot de passe (utilisateur connecté). | Oui |
| POST | `/auth/set-password/` | `SetUserPasswordEndpoint` | Définit un premier mot de passe (compte autoset). | Oui |
| GET | `/auth/get-csrf-token/` | `CSRFTokenEndpoint` | Fournit le token CSRF. | Non |

Les routes `/auth/spaces/*` dupliquent les routes app pour le contexte Space (public embed).

---

## Patterns identifiés

- **Template Method pattern** : `Adapter.complete_login_or_signup()` est la méthode template invoquée par `CredentialAdapter.authenticate()` et `OauthAdapter.authenticate()`. Chaque sous-classe implémente `set_user_data()` et optionnellement `set_token_data()`.

- **Callback post-auth** : toutes les vues injectent `callback=post_user_auth_workflow` au provider. La méthode `complete_login_or_signup()` appelle ce callback après la création/mise à jour de l'utilisateur, permettant une extension sans modifier les providers.

- **Redirect-based flow (non-SPA)** : les vues email et magic link (sign-in/sign-up) héritent de `django.views.View` et retournent des `HttpResponseRedirect`, transportant les erreurs dans les query params. `MagicGenerateEndpoint` est l'exception : elle hérite de DRF `APIView` et retourne du JSON (utilisée en mode fetch/XHR par le frontend).

- **Throttle appliqué manuellement** : les vues `View` (non-APIView) ne bénéficient pas du pipeline DRF. La fonction `authentication_throttle_allows()` applique manuellement `AuthenticationThrottle` à ces vues.

- **Double cookie de session** : `SessionMiddleware` distingue les paths `/instances/` (panneau admin) et le reste pour utiliser `ADMIN_SESSION_COOKIE_NAME` ou `SESSION_COOKIE_NAME`. La durée d'expiration de l'admin est aussi distincte (`ADMIN_SESSION_COOKIE_AGE`).

- **SSRF mitigation sur téléchargement d'avatar** : `pinned_fetch_following_redirects()` est utilisé à la place de `requests.get()` pour valider l'IP de destination (contre DNS rebinding) et revalider chaque saut de redirection.

- **Lua script Redis atomique** : le compteur de tentatives de vérification du magic link utilise un script Lua `INCR + EXPIRE` pour éviter une race condition entre plusieurs requêtes parallèles avec un mauvais code.

- **Valeur de configuration en cascade** : `get_configuration_value()` lit d'abord la configuration de l'instance (base de données), avec fallback sur les variables d'environnement. Toutes les feature flags auth passent par ce mécanisme.

---

## Configuration

| Variable / Clé | Défaut | Effet |
|---------------|--------|-------|
| `ENABLE_EMAIL_PASSWORD` | env | Active/désactive le provider email+password |
| `ENABLE_MAGIC_LINK_LOGIN` | `"1"` | Active/désactive le magic link OTP |
| `ENABLE_SIGNUP` | `"1"` | Active/désactive la création de nouveaux comptes |
| `EMAIL_HOST` | env | SMTP requis pour magic link et forgot-password |
| `AUTHENTICATION_RATE_LIMIT` | `"10/minute"` | Throttle sur les endpoints auth |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | env | Active le provider Google |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | env | Active le provider GitHub |
| `GITHUB_ORGANIZATION_ID` | env | Restreint GitHub auth aux membres de l'org |
| `GITLAB_CLIENT_ID` / `GITLAB_CLIENT_SECRET` / `GITLAB_HOST` | env | Active le provider GitLab |
| `GITEA_CLIENT_ID` / `GITEA_CLIENT_SECRET` / `GITEA_HOST` | env | Active le provider Gitea |
| `ENABLE_GOOGLE_SYNC` / `ENABLE_GITHUB_SYNC` / `ENABLE_GITLAB_SYNC` / `ENABLE_GITEA_SYNC` | `"0"` | Active la synchronisation IDP au login |

---

## Tests existants

| Fichier | Ce qu'il teste | Statut |
|---------|---------------|--------|
| `apps/api/tests/authentication/` (si présent) | Auth workflows | À vérifier — non exploré dans cette rétro |

D'après le `discovery.md`, 47 fichiers pytest existent dans l'API. La couverture des endpoints auth n'a pas pu être vérifiée dans le cadre de cette rétro.

---

## Décisions techniques documentées ici (candidats rejetés comme ADR)

Les décisions suivantes ont été identifiées mais ne passent pas la politique ADR `06-adr-policy.md` et sont donc documentées ici uniquement :

- **Redirect-based flow (non-JSON) pour les vues email/magic** (AP-6 — style de contrat API, confiné à ce module, Q3=NON) : les vues email et magic link retournent des `HttpResponseRedirect` plutôt que du JSON, transportant les erreurs dans les query params. Ce choix est probablement lié au support des navigateurs sans JS, mais la raison exacte n'est pas documentée dans le code.

- **zxcvbn comme évaluateur de robustesse de mot de passe** (AP-1 — choix de lib hors stack majeur) : le score minimum est 3 sur 4. Ce seuil est codé en dur dans deux endroits (`Adapter.validate_password()` et `ResetPasswordEndpoint`).

- **CSRF désactivé sur `BaseSessionAuthentication`** (AP-2 — configuration d'outil DRF, Q3 incertain) : `BaseSessionAuthentication.enforce_csrf()` retourne sans vérification. Décision probablement liée à l'usage de sessions Django avec un client React séparé, mais non documentée.

- **UUID hex comme `username`** (AP-7 — détail de schéma non-architectural) : à la création, `username = uuid.uuid4().hex`. Ce champ n'est pas exposé à l'utilisateur mais répond à une contrainte Django d'unicité du username.

- **Priorité d'email Gitea** (AP-3 — heuristique d'implémentation) : primary+verified > verified > primary > premier disponible. Choix d'implémentation interne sans impact transverse.
