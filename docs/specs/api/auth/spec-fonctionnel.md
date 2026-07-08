# Spec Fonctionnelle — auth [DRAFT — à valider par le dev]

| Champ      | Valeur              |
|------------|---------------------|
| Module     | auth                |
| App        | api                 |
| Version    | 0.1.0               |
| Date       | 2026-06-30          |
| Auteur     | retro-documenter    |
| Statut     | DRAFT               |
| Source     | Rétro-ingénierie    |

> **[DRAFT — à valider par le dev]** Cette spec a été générée par rétro-ingénierie
> à partir du code existant. Elle doit être relue et validée par un développeur
> qui connaît le contexte métier.

---

## ADRs

| # | Titre | Catégorie | Statut |
|---|-------|-----------|--------|
| [RETRO-001](../../../adr/RETRO-001-auth-session-django.md) | Session Django server-side avec deux cookies séparés (app / admin) | AUTH | Documenté (rétro) |
| [RETRO-002](../../../adr/RETRO-002-auth-multi-provider-adapter-pattern.md) | Architecture multi-provider par pattern Adapter avec callback post-auth | AUTH | Documenté (rétro) |
| [RETRO-003](../../../adr/RETRO-003-auth-magic-link-redis-otp.md) | Magic link OTP 6 chiffres stocké Redis avec double compteur anti-brute-force | SECURITY | Documenté (rétro) |

---

## Contexte et objectif

Le module `api/auth` est la porte d'entrée unique pour toute authentification dans Plane. Il gère l'identité de l'utilisateur à travers cinq modes complémentaires (email+mot de passe, magic link OTP, Google, GitHub, GitLab, Gitea), produit une session Django serveur-side à l'issue de chaque authentification réussie, et applique un post-traitement uniforme (rejoindre les workspaces via invitation, enrichir la session avec les infos device).

Le module est dupliqué en deux contextes : `views/app/` pour l'application principale et `views/space/` pour l'espace public embarquable (Space), avec des configurations d'expiration de session potentiellement distinctes.

---

## Règles métier (déduites du code)

1. **Prérequis instance** : toute tentative d'authentification est bloquée si l'instance Plane n'est pas configurée (`Instance.is_setup_done = False`). L'erreur est renvoyée avec le code 5000 (`INSTANCE_NOT_CONFIGURED`).

2. **Activation conditionnelle des providers** : chaque provider est activable/désactivable indépendamment via la configuration de l'instance (`ENABLE_EMAIL_PASSWORD`, `ENABLE_MAGIC_LINK_LOGIN`, `ENABLE_SIGNUP`, et les credentials OAuth de chaque provider). Une désactivation lève une `AuthenticationException` typée.

3. **Normalisation des emails** : tout email est mis en minuscules et épuré (`strip().lower()`) avant tout traitement. Un email invalide (format Django `validate_email`) est rejeté avec le code 5005.

4. **Comptes désactivés bloqués** : un utilisateur dont `is_active = False` ET `last_logout_time is not None` (compte explicitement désactivé via l'API admin) ne peut pas se connecter, quel que soit le provider. Un compte jamais désactivé (`last_logout_time = None`) avec `is_active = False` est un compte provisionné non encore activé — il est autorisé à effectuer son premier login.

5. **Inscription conditionnelle** : si `ENABLE_SIGNUP = "0"`, la création d'un nouveau compte est bloquée, sauf si l'email figure dans `WorkspaceMemberInvite` (invitation active). Cette règle s'applique à tous les providers.

6. **Robustesse de l'email + mot de passe** : lors d'une inscription, le mot de passe doit atteindre un score zxcvbn ≥ 3. Un mot de passe trop faible est rejeté avec le code 5021 (`PASSWORD_TOO_WEAK`). Cette vérification ne s'applique pas aux providers OAuth ni au magic link (le mot de passe est alors autogénéré et `is_password_autoset = True`).

7. **Magic link : double protection anti-brute-force** :
   - Côté émission : au-delà de 2 tentatives de génération d'un code pour la même adresse (fenêtre de 10 minutes), la génération est bloquée (`EMAIL_CODE_ATTEMPT_EXHAUSTED`).
   - Côté vérification : un compteur atomique Redis (Lua script INCR + EXPIRE) limite à 5 tentatives de saisie par token. Au dépassement, le token est invalidé et la régénération est requise.
   - Un token expire au bout de 10 minutes (TTL Redis = 600 s).

8. **OAuth — vérification d'état CSRF** : pour les providers OAuth (GitHub, GitLab, Gitea, Google), un `state` UUID est généré à l'initiation, stocké en session, et vérifié au callback. Une discordance déclenche une erreur provider.

9. **GitHub — restriction par organisation** : si `GITHUB_ORGANIZATION_ID` est configuré, seuls les membres de cette organisation GitHub peuvent se connecter. Le scope `read:org` est ajouté automatiquement.

10. **GitLab — host configurable** : le FQDN de l'instance GitLab est paramétrable (`GITLAB_HOST`, défaut `https://gitlab.com`), ce qui permet de pointer vers une instance auto-hébergée.

11. **Gitea — validation de l'URL du host** : le `GITEA_HOST` doit contenir un schéma `http` ou `https` valide. Un host invalide est rejeté sans exposer les détails à l'utilisateur.

12. **Gitea — résolution de l'email** : si l'endpoint user de Gitea ne retourne pas d'email, un appel secondaire à `/api/v1/user/emails` est effectué, avec priorité : primary+verified > verified > primary > premier disponible.

13. **Synchronisation IDP** : pour les providers OAuth activés avec le flag `ENABLE_{PROVIDER}_SYNC`, si l'utilisateur existe déjà (login, pas signup), ses données de profil (nom, avatar) sont resynchronisées depuis le provider. L'avatar est téléchargé et réhébergé dans S3.

14. **Téléchargement d'avatar SSRF-safe** : le téléchargement des avatars OAuth passe par un client HTTP qui valide l'IP (protection SSRF — GHSA-cv9p-325g-wmv5), suit les redirections en revalidant à chaque saut, et impose un plafond de taille (`DATA_UPLOAD_MAX_MEMORY_SIZE`). Seuls les formats jpg/png/gif/webp sont acceptés.

15. **Rate limiting** : les endpoints d'authentification sont soumis à un throttle configurable via `AUTHENTICATION_RATE_LIMIT` (défaut 10/minute). La génération de codes de vérification email est limitée à 3/heure par utilisateur.

16. **Post-authentification** : à l'issue de chaque authentification réussie, `post_user_auth_workflow` est appelé pour traiter les invitations en attente (`WorkspaceMemberInvite`) pour cet email.

17. **Session enrichie avec device info** : après login, la session Django est enrichie avec `user_agent`, `ip_address` et `domain`.

18. **Redirection safe** : toutes les redirections post-auth utilisent `get_safe_redirect_url()` qui valide la destination pour éviter les open-redirect.

---

## Cas d'usage (déduits)

### CU-001 — Connexion email + mot de passe

Un utilisateur existant soumet email + mot de passe via POST. Le système vérifie la configuration de l'instance, normalise l'email, contrôle l'existence de l'utilisateur, vérifie le mot de passe (Django `check_password`), crée la session Django, et redirige vers la page cible ou la page d'accueil par défaut.

### CU-002 — Inscription email + mot de passe

Un nouvel utilisateur soumet email + mot de passe. Le système vérifie que l'inscription est activée (ou qu'une invitation est présente), que l'email n'existe pas déjà, que le mot de passe atteint un score zxcvbn ≥ 3, puis crée le compte, le profil, et la session.

### CU-003 — Connexion / Inscription par magic link

L'utilisateur demande un OTP (POST `/magic-generate/`). Un code 6 chiffres est stocké dans Redis sous la clé `magic_<email>` (TTL 10 min) et envoyé par email via Celery. L'utilisateur soumet le code ; s'il correspond et n'est pas expiré (ni les tentatives épuisées), la session est créée.

### CU-004 — Connexion OAuth (GitHub / GitLab / Google / Gitea)

L'utilisateur clique sur "Se connecter avec X". Le système génère un `state` UUID, redirige vers le provider. Au retour du callback, le `state` est vérifié, le token d'accès est obtenu, les données utilisateur sont récupérées, un compte OAuth est créé/mis à jour (`Account`), et la session Django est créée.

### CU-005 — Email check (préqualification)

Le frontend appelle `/email-check/` avec l'email. Le système retourne `{ existing: bool, status: "MAGIC_CODE" | "CREDENTIAL" }` pour décider du flux à afficher (formulaire mot de passe ou formulaire code OTP).

### CU-006 — Réinitialisation de mot de passe

L'utilisateur demande une réinitialisation via `/forgot-password/`. Un token signé (Django `PasswordResetTokenGenerator`) est envoyé par email. L'utilisateur accède au lien `/reset-password/<uidb64>/<token>/` et soumet un nouveau mot de passe (score zxcvbn ≥ 3 requis).

### CU-007 — Déconnexion

POST `/sign-out/` vide et invalide la session Django.

---

## Dépendances

- `plane.db.models.User` — modèle utilisateur custom (`AUTH_USER_MODEL = "db.User"`)
- `plane.db.models.Profile` — profil utilisateur créé après signup
- `plane.db.models.Account` — tokens OAuth par provider par utilisateur
- `plane.db.models.WorkspaceMemberInvite` — invitations pour débloquer l'inscription si `ENABLE_SIGNUP = "0"`
- `plane.db.models.FileAsset` — stockage des avatars téléchargés
- `plane.license.models.Instance` — configuration globale de l'instance
- `plane.license.utils.instance_value.get_configuration_value` — lecture des paramètres de configuration (SMTP, OAuth credentials, feature flags)
- `plane.settings.redis.redis_instance` — accès Redis pour le magic link
- `plane.bgtasks.magic_link_code_task.magic_link` — envoi asynchrone (Celery) du code OTP
- `plane.bgtasks.forgot_password_task.forgot_password` — envoi asynchrone du lien de reset
- `plane.bgtasks.user_activation_email_task.user_activation_email` — email d'activation du compte
- `plane.settings.storage.S3Storage` — hébergement des avatars
- `plane.utils.url_security.pinned_fetch_following_redirects` — téléchargement SSRF-safe
- `plane.authentication.middleware.session.SessionMiddleware` — gestion du cookie de session
- Module `zxcvbn` — évaluation de la robustesse des mots de passe

---

## Zones d'incertitude

> Les points suivants n'ont pas pu être déterminés par le code seul :

- La durée exacte d'expiration de session pour l'app principale (`SESSION_COOKIE_AGE` dans `settings/`) n'a pas été lue — elle peut différer de celle de l'admin (`ADMIN_SESSION_COOKIE_AGE`).
- La logique complète de `get_redirection_path()` (vers quelle page un utilisateur est redirigé en fonction de son état d'onboarding) n'a pas été explorée.
- Les vues `views/space/` sont présentes mais non détaillées ici — elles semblent dupliquer le comportement de `views/app/` pour le contexte Space (vue publique), mais avec potentiellement des différences de session.
- La politique exacte de suppression/rotation des tokens `Account` (OAuth) n'est pas visible dans ce module seul.
- La raison pour laquelle `BaseSessionAuthentication` désactive le CSRF pour les API REST n'est pas documentée (choix architectural ou contrainte technique à valider).
