# RETRO-001 — Session Django server-side avec deux cookies séparés (app / admin)

| Champ      | Valeur              |
|------------|---------------------|
| Statut     | Documenté (rétro)   |
| Date       | 2026-06-30          |
| Source     | Rétro-ingénierie    |
| Features   | api/auth            |

## Justification (politique ADR v2.3.0)

| Champ | Valeur |
|-------|--------|
| Catégorie | AUTH |
| Q1 — Coût de revert > 1j ? | OUI — migrer vers JWT ou changer la stratégie de session touche tous les modules API qui dépendent de `request.user`, le `SessionMiddleware` custom, et les trois apps front (web, admin, space) qui gèrent chacune un cookie distinct |
| Q2 — Non-déductible du code ? | OUI — `requirements/base.txt` montre `django-redis 5.4.0` (sessions Redis) mais ne révèle pas le choix de la double-cookie ni la distinction entre `SESSION_COOKIE_NAME` et `ADMIN_SESSION_COOKIE_NAME` avec des durées d'expiration différentes |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — l'ensemble des specs api/* (workspaces, projects, issues, analytics…) dépend de la session Django pour l'authentification de chaque requête ; la spec `space/public-board` utilise la session espace distincte |
| Q4 — Casse un invariant si ignoré ? | OUI — un dev ajoutant un endpoint d'administration (`/instances/`) sans connaître la logique du double-cookie dans `SessionMiddleware` lirait `SESSION_COOKIE_NAME` au lieu de `ADMIN_SESSION_COOKIE_NAME`, cassant silencieusement l'isolation de la session admin |

> Validé contre la politique `.claude/rules/06-adr-policy.md`.

## Contexte

Plane est une application Django + DRF avec trois applications frontend distinctes (web, admin, space). L'interface d'administration de l'instance (`apps/admin`, port 3001) nécessite une session isolée de la session utilisateur principale pour éviter qu'une session utilisateur ne donne accès au panneau admin, et pour permettre des durées d'expiration distinctes.

## Décision identifiée

Un `SessionMiddleware` custom (`plane/authentication/middleware/session.py`) remplace le middleware Django standard. Il distingue les paths `/instances/` (panneau admin) de tous les autres paths pour lire et écrire deux cookies de session distincts :
- `SESSION_COOKIE_NAME` — sessions utilisateur (web + space), durée standard Django
- `ADMIN_SESSION_COOKIE_NAME` — sessions admin, durée `ADMIN_SESSION_COOKIE_AGE`

La session Django (côté serveur, stockée dans Redis via `django-redis`) est le seul mécanisme de maintien de l'identité. Il n'y a pas de JWT côté client pour les requêtes web/admin/space. Les API keys constituent un mécanisme d'authentification séparé (hors de ce middleware).

## Conséquences observées

### Positives
- Isolation garantie entre la session admin et la session utilisateur : impossible d'accéder à `/instances/` avec un cookie utilisateur standard
- Durées d'expiration différenciées sans complexité client
- Révocation immédiate côté serveur (invalidation de la session Redis)
- Comportement standard Django (pas de lib externe supplémentaire)

### Négatives / Dette
- Duplication de code : les vues auth sont dupliquées en `views/app/` et `views/space/`, avec des chemins de session potentiellement différents non documentés
- Le choix de désactiver CSRF dans `BaseSessionAuthentication` (DRF) pour les API REST n'est pas documenté — risque si des endpoints DRF sont exposés à des clients navigateur non contrôlés
- Absence de rotation automatique de l'identifiant de session après authentification (à vérifier) — potentiel session fixation si non géré par Django par défaut

## Recommandation

Garder — la session Django server-side est cohérente avec la stack Django et simplifie la révocation. Documenter la raison du CSRF désactivé dans `BaseSessionAuthentication`.
