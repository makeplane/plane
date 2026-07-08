# Audit Initial — Plane v1.3.1

| Champ             | Valeur                    |
|-------------------|---------------------------|
| Date              | 2026-06-30                |
| Auditeur          | retro-auditor             |
| Source            | Rétro-ingénierie          |
| Features auditées | 13 (sur 20 identifiées)   |
| ADRs identifiés   | 16                        |

---

## Résumé exécutif

Plane est un monorepo mature à 6 applications (Django API, 3 fronts React Router v7, Express temps réel, Caddy) formant une alternative open-source à Jira/Linear sous licence AGPL-3.0. L'architecture est structurée et cohérente : séparation stricte des domaines, RBAC documenté, sécurité active (HMAC, anti-SSRF, sanitisation XSS). Le principal risque opérationnel est l'absence quasi-totale de tests sur les 3 apps front et la couverture partielle côté API : plusieurs features critiques (webhooks, analytics, cycles, modules, notifications, pages, intake) n'ont aucun test identifié. Une migration Next.js vers React Router v7 est en cours mais inachevée, laissant des shims de compatibilité actifs dans deux apps. Sept features identifiées restent sans documentation et une feature (webhooks niveau projet) est partiellement implémentée.

---

## Stack et architecture

**Backend** : Django 4.2 + DRF 3.15 sur PostgreSQL 15.7, avec Celery 5.4 / RabbitMQ 3.13 pour les 30 tâches asynchrones et Redis/Valkey 7.2 pour le cache et les sessions. Stockage objet S3-compatible (MinIO en self-hosted).

**Frontend** : Trois apps React Router v7 (SSG pour web/admin, SSR pour space) construites avec Vite 8 et Turborepo 2.9. State management MobX 6.12. 15 packages internes partagés (`@plane/ui`, `@plane/editor`, `@plane/types`, etc.).

**Temps réel** : Serveur Express + Hocuspocus 2.15 (CRDT Y.js) dans `apps/live`, isolé du backend Django.

**Patterns architecturaux observés** :
- RBAC décorateur à 3 niveaux (ADMIN=20 / MEMBER=15 / GUEST=5) appliqué méthode par méthode
- Soft delete généralisé via `deleted_at` + contraintes d'unicité conditionnelles
- Triple format de contenu riche (JSON ProseMirror + HTML + binaire Y.js)
- Compute-on-read systématique pour les statistiques (pas de matérialisation)
- UUID comme clé primaire sur tous les modèles
- Tâches Celery pour tous les effets de bord (activité, notifications, webhooks, exports)

**Infrastructure** : Caddy en reverse proxy, Docker Compose complet avec 13 services, CI/CD GitHub Actions (lint, build, CodeQL, i18n sync). Observabilité OpenTelemetry + Scout APM + PostHog.

---

## Cartographie fonctionnelle

| # | Feature | État | Complexité | Tests API | Spec |
|---|---------|------|-----------|-----------|------|
| 1 | api/auth | Fonctionnel | Haute | À vérifier (47 fichiers pytest, couverture auth non confirmée) | docs/specs/api/auth/ |
| 2 | api/workspaces | Fonctionnel | Moyenne | À vérifier | docs/specs/api/workspaces/ |
| 3 | api/projects | Fonctionnel | Moyenne | À vérifier | docs/specs/api/projects/ |
| 4 | api/issues | Fonctionnel | Haute | À vérifier (contrats) | docs/specs/api/issues/ |
| 5 | api/cycles | Fonctionnel | Moyenne | Absent (confirmé) | docs/specs/api/cycles/ |
| 6 | api/modules | Fonctionnel | Moyenne | Absent (confirmé) | docs/specs/api/modules/ |
| 7 | api/pages | Fonctionnel | Haute | Absent (confirmé) | docs/specs/api/pages/ |
| 8 | api/intake | Fonctionnel | Haute | Absent (confirmé) | docs/specs/api/intake/ |
| 9 | api/analytics | Fonctionnel | Haute | Absent (confirmé) | docs/specs/api/analytics/ |
| 10 | api/notifications | Fonctionnel | Haute | Partiel (cleanup task seulement) | docs/specs/api/notifications/ |
| 11 | api/views | Fonctionnel | Moyenne | Absent (confirmé) | docs/specs/api/views/ |
| 12 | api/webhooks | Partiel (ProjectWebhook non câblé) | Moyenne | Absent (confirmé) | docs/specs/api/webhooks/ |
| 13 | live/realtime-collaboration | Fonctionnel | Haute | Partiel (2 fichiers Vitest) | docs/specs/live/realtime-collaboration/ |
| 14 | api/draft-issues | Non documenté | Faible | Inconnu | — |
| 15 | api/exports | Non documenté | Faible | Inconnu | — |
| 16 | api/estimates | Non documenté | Faible | Inconnu | — |
| 17 | api/ai | Non documenté (deprecated) | Faible | Inconnu | — |
| 18 | admin/instance | Non documenté | Haute | Inconnu | — |
| 19 | space/public-board | Non documenté | Haute | Inconnu | — |
| 20 | web/favorites-stickies | Non documenté | Faible | Inconnu | — |

---

## Points forts

1. **Architecture multi-tenant propre** : séparation stricte workspace/projet, UUID primaires universels, soft delete généralisé avec contraintes conditionnelles — le modèle de données est rigoureux.
2. **Sécurité active et documentée** : protection anti-SSRF par DNS-pinning sur les webhooks (RETRO-122), sanitisation XSS nh3/Rust sur les soumissions publiques (RETRO-101), signatures HMAC-SHA256 sur les payloads webhooks (RETRO-121), rate limiting auth, CodeQL en CI, Trivy sur les images.
3. **Monorepo bien structuré** : Turborepo avec catalog pnpm centralisé, 15 packages internes cohérents (`@plane/editor`, `@plane/ui`, `@plane/i18n`), séparation claire des apps.
4. **Internationalisation mature** : 19 langues supportées via `@plane/i18n`, synchronisation vérifiée en CI par `i18n-sync-check.yml`.
5. **Collaboration temps réel isolée** : serveur Hocuspocus dans `apps/live` séparé du backend Django, architecture extensible (point d'extension enterprise documenté dans `PageService`).
6. **Observabilité complète** : OpenTelemetry + Scout APM + PostHog + JSON logging structuré — le projet est opérationnellement observable.
7. **16 ADRs RETRO documentés** couvrant les décisions architecturales clés (auth, RBAC, triple format, soft delete, collaboration, sécurité).

---

## Risques identifiés

| # | Risque | Criticité | Impact | Feature(s) |
|---|--------|-----------|--------|------------|
| 1 | Absence totale de tests front (web, admin, space) | CRITIQUE | Régressions non détectées en CI sur les 3 apps front — aucun filet de sécurité | web/\*, admin/\*, space/\* |
| 2 | Couverture test API très lacunaire : 9 features sans test identifié | CRITIQUE | Cycles, modules, pages, intake, analytics, webhooks, views, notifications (partiel) — modifications risquées | api/cycles, api/modules, api/pages, api/intake, api/analytics, api/webhooks, api/views, api/notifications |
| 3 | Migration Next.js → React Router v7 inachevée (shims compat/next/) | MAJEUR | Code mort et dette de migration dans web et admin — complexité accrue, risque de régression lors de la suppression des shims | apps/web, apps/admin |
| 4 | `ProjectWebhook` non câblé | MAJEUR | Feature annoncée mais non opérationnelle — risque de confusion lors de l'activation | api/webhooks |
| 5 | Format JSONB `progress_snapshot` des cycles sans schéma de validation | MAJEUR | Changements de structure silencieux, incompatibilités futures, cycle source illisible après transfert | api/cycles |
| 6 | CSRF désactivé dans `BaseSessionAuthentication` sans documentation de la raison | MAJEUR | Potentielle surface d'attaque CSRF sur les endpoints DRF exposés aux navigateurs — décision non documentée | api/auth + toute l'API |
| 7 | `description_json` (AST ProseMirror) non validé structurellement sur la voie publique intake | MAJEUR | Vecteur XSS JSON potentiel si le rendu Tiptap interprète des nœuds malveillants — asymétrie voie pub/interne | api/intake, space/public-board |
| 8 | 7 features sans documentation (draft-issues, exports, estimates, ai, admin/instance, space/public-board, favorites-stickies) | MINEUR | Périmètre flou pour les nouveaux développeurs — risque de doublon ou de contradiction avec le code existant | Toutes |
| 9 | Champ AI marqué deprecated mais toujours présent dans le code et l'interface admin | MINEUR | Code mort non retiré — confusion et surface d'attaque potentielle si un credential OpenAI est configuré | api/ai, admin/instance |
| 10 | `sender` notifications encodé en chaîne libre (`in_app:issue_activities:mentioned`) | MINEUR | Filtrage fragile par `icontains="mentioned"` — cassable par un renommage de catégorie | api/notifications |
| 11 | `WorkspaceViewViewSet.retrieve` sans `@allow_permission` explicite | MINEUR | Potentielle zone grise d'accès — un utilisateur non membre pourrait tenter un accès direct par UUID | api/views |
| 12 | Double couche analytics legacy/avancée coexistant sans stratégie de migration documentée | MINEUR | Complexité de maintenance, comportements incohérents entre les deux couches | api/analytics |
| 13 | Dépendance sur `requests >= 2.32` (méthode `get_connection_with_tls_context`) non documentée pour le DNS-pinning | MINEUR | Mise à jour de `requests` peut casser silencieusement la protection anti-SSRF | api/webhooks |
| 14 | TODO HMAC en commentaire dans `auth-middleware.ts` (`apps/live`) — auth par clé statique | MINEUR | Authentification des endpoints admin du serveur live par clé partagée non signée | live/realtime-collaboration |

---

## Recommandations stratégiques

1. **Sécuriser le risque test en priorité absolue** : établir une stratégie de test par couche (pytest pour les features API sans couverture, Vitest pour les composants front critiques, Playwright pour les parcours E2E auth et issue creation) — sans tests, toute intervention sur le code est à risque élevé de régression silencieuse.

2. **Finaliser la migration Next.js → React Router v7** : identifier et supprimer les shims `compat/next/` dans `apps/web` et `apps/admin` une fois les dépendances clientes migrées — chaque shim est un point de friction et un risque de comportement non standard à la prochaine mise à jour React Router.

3. **Documenter les 7 features manquantes avant toute modification** : `admin/instance` et `space/public-board` sont des surfaces critiques (administration et exposition publique) — les documenter en priorité avant d'envisager des évolutions, pour éviter les régressions non détectées.
