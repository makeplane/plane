# Discovery — Plane v1.3.1

> Fichier généré automatiquement par retro-scanner. Usage interne uniquement.
> Ce fichier sera supprimé à la fin de la Phase 1-bis.

---

## Stack identifiée

| Composant | Valeur |
|-----------|--------|
| Framework (back) | Django 4.2.30 + Django REST Framework 3.15.2 |
| Framework (front) | React Router v7.15.1 (ex-Remix) — SSG pour web/admin, SSR pour space |
| Framework (live) | Express 4.22.0 + Hocuspocus 2.15.2 |
| Langage back | Python (contrainte via .mise.toml) |
| Langage front | TypeScript 5.8.3 |
| SGBD | PostgreSQL 15.7 |
| ORM | Django ORM natif (pas de SQLAlchemy) |
| Cache | Redis / Valkey 7.2 (fork open-source Redis) |
| Message broker | RabbitMQ 3.13 |
| Task queue | Celery 5.4.0 + django-celery-beat |
| Stockage objets | S3-compatible (MinIO en self-hosted, boto3 + django-storages) |
| Auth | Session Django + Magic link + OAuth (Google, GitHub, GitLab, Gitea) + API Keys |
| State management (front) | MobX 6.12.0 |
| Éditeur riche | Tiptap (package interne `@plane/editor`) + collaboration Y.js/CRDT |
| Reverse proxy | Caddy (Community Edition) |
| Build front | Vite 8.0.16 + Turborepo 2.9.18 |
| Tests back | pytest + pytest-django (47 fichiers de tests) |
| Tests front | Vitest 4.x (apps/live uniquement — 2 fichiers) |
| Linter JS/TS | oxlint 1.51.0 + oxfmt 0.35.0 |
| Linter Python | Ruff (lint + format, line-length=120) |
| Internationalisation | i18next — 19 langues (en, fr, de, es, zh-CN, zh-TW, ja, ko, ru, pt-BR, it, pl, cs, sk, ro, tr-TR, id, vi-VN, ua) |
| Licence | AGPL-3.0-only |

---

## Features identifiées

### 1. api/auth — Authentification multi-providers

**Description :** Système d'authentification hybride gérant email+mot de passe, magic link (code OTP à 6 chiffres stocké Redis), OAuth (Google, GitHub, GitLab, Gitea) et API keys. Session Django côté serveur avec middleware custom. Rate limiting spécifique (30/min anonyme, 60/min API key).

**Fichiers principaux :**
- `apps/api/plane/authentication/provider/credentials/email.py`
- `apps/api/plane/authentication/provider/credentials/magic_code.py`
- `apps/api/plane/authentication/provider/oauth/` (github.py, google.py, gitlab.py, gitea.py)
- `apps/api/plane/authentication/middleware/session.py`
- `apps/api/plane/authentication/views/app/`

---

### 2. api/workspaces — Gestion des workspaces

**Description :** Un workspace est le conteneur racine multi-tenant de Plane (équivalent "organisation"). Gère les membres (ADMIN/MEMBER/GUEST), les invitations, les thèmes, les préférences utilisateur par workspace, et un tableau de bord personnalisable (WorkspaceHomePreference).

**Fichiers principaux :**
- `apps/api/plane/db/models/workspace.py` (Workspace, WorkspaceMember, WorkspaceMemberInvite, Team, WorkspaceTheme, WorkspaceHomePreference)
- `apps/api/plane/app/views/workspace/base.py`
- `apps/api/plane/app/views/workspace/member.py`
- `apps/api/plane/app/views/workspace/invite.py`
- `apps/api/plane/app/views/workspace/home.py`

---

### 3. api/projects — Gestion des projets

**Description :** Un projet appartient à un workspace et regroupe des issues. Supporte les rôles par projet (ADMIN/MEMBER/GUEST), les invitations, la configuration de features activables (cycles, modules, pages, intake, views), les états personnalisés, et un "deploy board" permettant l'exposition publique du projet.

**Fichiers principaux :**
- `apps/api/plane/db/models/project.py` (Project, ProjectMember, ProjectMemberInvite, ProjectDeployBoard)
- `apps/api/plane/db/models/state.py` (State, StateGroup)
- `apps/api/plane/app/views/project/base.py`
- `apps/api/plane/app/views/project/member.py`
- `apps/api/plane/app/views/state/base.py`

---

### 4. api/issues — Issues (work items)

**Description :** Entité centrale de Plane. Une issue dispose d'un titre, d'une description riche (Tiptap/JSON+HTML+Binary), d'une priorité, d'états, d'assignees, de labels, de dates de début/fin, d'estimations, de relations (bloquant/bloqué par), de sous-issues, d'attachements, de liens, de commentaires (avec réactions), d'abonnés, et d'un historique complet d'activité. Supporte le soft delete, les versions et l'archivage.

**Fichiers principaux :**
- `apps/api/plane/db/models/issue.py` (Issue, IssueComment, IssueActivity, IssueRelation, IssueAttachment, IssueVersion, IssueDescriptionVersion, IssueSubscriber, ...)
- `apps/api/plane/app/views/issue/base.py`
- `apps/api/plane/app/views/issue/comment.py`
- `apps/api/plane/app/views/issue/relation.py`
- `apps/api/plane/app/views/issue/activity.py`

---

### 5. api/cycles — Cycles (sprints)

**Description :** Un cycle est un regroupement temporel d'issues dans un projet (équivalent "sprint" ou "itération"). Dispose d'une date de début/fin, d'un statut, et permet l'archivage. Les issues sont liées via CycleIssue. Un agrégat workspace expose tous les cycles d'un workspace.

**Fichiers principaux :**
- `apps/api/plane/db/models/cycle.py` (Cycle, CycleIssue, CycleUserProperties)
- `apps/api/plane/app/views/cycle/base.py`
- `apps/api/plane/app/views/cycle/issue.py`
- `apps/api/plane/app/views/cycle/archive.py`
- `apps/api/plane/app/views/workspace/cycle.py`

---

### 6. api/modules — Modules (feature grouping)

**Description :** Un module est un regroupement thématique d'issues (équivalent "epic" ou "milestone"). Dispose d'un statut (BACKLOG/IN_PROGRESS/PAUSED/COMPLETED/CANCELLED), de membres, de liens externes, et peut être archivé. Permet de regrouper des issues transversales à plusieurs cycles.

**Fichiers principaux :**
- `apps/api/plane/db/models/module.py` (Module, ModuleMember, ModuleIssue, ModuleLink, ModuleUserProperties)
- `apps/api/plane/app/views/module/base.py`
- `apps/api/plane/app/views/module/issue.py`
- `apps/api/plane/app/views/module/archive.py`

---

### 7. api/pages — Pages documentaires collaboratives

**Description :** Système de wiki/documentation collaboratif intégré. Une page contient un contenu riche (Tiptap, stocké en JSON+HTML+Binary), peut être publique ou privée, verrouillée, archivée, avoir des sous-pages, être partagée entre projets (many-to-many via ProjectPage), et être liée à des labels. Le serveur `apps/live` gère la collab temps réel via Y.js/CRDT.

**Fichiers principaux :**
- `apps/api/plane/db/models/page.py` (Page, avec description_json/description_binary/description_html)
- `apps/api/plane/app/views/page/base.py`
- `apps/api/plane/app/views/page/version.py`
- `apps/api/plane/db/models/description.py` (Description, DescriptionVersion)
- `apps/live/src/controllers/collaboration.controller.ts`

---

### 8. api/intake — Funnel de soumission d'issues (Intake/Inbox)

**Description :** Système de triage des issues soumises depuis l'extérieur ou l'intérieur. Une IntakeIssue passe par des statuts (PENDING → ACCEPTED/REJECTED/SNOOZED/DUPLICATE). Permet l'exposition publique via DeployBoard pour accepter des remontées externes. L'intake peut être configuré par projet.

**Fichiers principaux :**
- `apps/api/plane/db/models/intake.py` (Intake, IntakeIssue, IntakeIssueStatus)
- `apps/api/plane/app/views/intake/base.py`
- `apps/api/plane/db/models/deploy_board.py` (DeployBoard — exposition publique)
- `apps/api/plane/space/views/intake.py` (IntakeIssuePublicViewSet)

---

### 9. api/analytics — Analytiques et tableaux de bord

**Description :** Module d'analytics permettant de visualiser l'avancement des issues par workspace ou projet. Offre des graphes d'activité utilisateur, des charts de complétion, des exports (CSV). Dispose de vues analytics sauvegardables (AnalyticView). Export asynchrone via Celery.

**Fichiers principaux :**
- `apps/api/plane/db/models/analytic.py` (AnalyticView)
- `apps/api/plane/app/views/analytic/base.py`
- `apps/api/plane/app/views/analytic/advance.py`
- `apps/api/plane/app/views/analytic/project_analytics.py`
- `apps/api/plane/bgtasks/analytic_plot_export.py`

---

### 10. api/notifications — Système de notifications

**Description :** Notifications in-app et email déclenchées par les activités sur les issues (commentaires, mentions, changements d'état, assignation). Gère les préférences par utilisateur (UserNotificationPreference). Les emails sont envoyés de façon asynchrone via Celery. Un log des emails (EmailNotificationLog) permet le suivi.

**Fichiers principaux :**
- `apps/api/plane/db/models/notification.py` (Notification, UserNotificationPreference, EmailNotificationLog)
- `apps/api/plane/app/views/notification/base.py`
- `apps/api/plane/bgtasks/notification_task.py`
- `apps/api/plane/bgtasks/email_notification_task.py`

---

### 11. api/views — Vues filtrées (filtres sauvegardés)

**Description :** Système de vues filtrées et triées sur les issues, sauvegardées au niveau workspace ou projet. Une IssueView stocke filtres, tri, groupement et layout. Disponibles en vues "globales" (workspace-views) ou "projet" (project views).

**Fichiers principaux :**
- `apps/api/plane/db/models/view.py` (IssueView — héritant WorkspaceBaseModel)
- `apps/api/plane/app/views/view/base.py`
- `apps/api/plane/app/views/workspace/` (workspace-level views)

---

### 12. api/webhooks — Webhooks sortants

**Description :** Système de webhooks permettant aux workspaces de s'abonner à des événements Plane (création/modification d'issues, commentaires, etc.) et de les pousser vers des URLs externes. Dispose d'un log (WebhookLog) et d'une clé secrète pour signer les payloads. Admin ROLE requis.

**Fichiers principaux :**
- `apps/api/plane/db/models/webhook.py` (Webhook, WebhookLog, ProjectWebhook)
- `apps/api/plane/app/views/webhook/base.py`
- `apps/api/plane/bgtasks/webhook_task.py`

---

### 13. api/draft-issues — Brouillons d'issues

**Description :** Issues en cours de création, non encore publiées dans un projet. Stockées au niveau workspace (DraftIssue). Permettent de préparer une issue avec ses assignees, labels, modules et cycles avant publication. Accessibles via workspace draft views.

**Fichiers principaux :**
- `apps/api/plane/db/models/draft.py` (DraftIssue, DraftIssueAssignee, DraftIssueLabel, DraftIssueModule, DraftIssueCycle)
- `apps/api/plane/app/views/workspace/draft.py`

---

### 14. api/exports — Export de données

**Description :** Exports asynchrones des données de projets (issues, commentaires, etc.) en format CSV/Excel. L'historique des exports est tracé (ExporterHistory). Les exports expirés sont nettoyés automatiquement.

**Fichiers principaux :**
- `apps/api/plane/db/models/exporter.py` (ExporterHistory)
- `apps/api/plane/app/views/exporter/base.py`
- `apps/api/plane/bgtasks/export_task.py`
- `apps/api/plane/bgtasks/exporter_expired_task.py`

---

### 15. api/estimates — Estimations

**Description :** Système d'estimation configurable par projet (points, story points, t-shirt sizes). Les EstimatePoints définissent les valeurs possibles. Plusieurs types d'estimation (EstimateType). Consultables au niveau workspace.

**Fichiers principaux :**
- `apps/api/plane/db/models/estimate.py` (Estimate, EstimatePoint, EstimateType)
- `apps/api/plane/app/views/estimate/base.py`

---

### 16. api/ai — Intégration IA (OpenAI)

**Description :** Intégration OpenAI pour des fonctionnalités d'aide à la rédaction ou de suggestion sur les issues/pages. Marquée comme deprecated dans les configs. Gère plusieurs providers LLM (LLMProvider base class). Accessible via la configuration de l'instance admin.

**Fichiers principaux :**
- `apps/api/plane/app/views/external/base.py`
- `apps/admin/app/(all)/(dashboard)/ai/page.tsx`
- `apps/admin/app/(all)/(dashboard)/ai/form.tsx`

---

### 17. admin/instance — Administration instance Plane

**Description :** Interface d'administration de l'instance Plane (panneau superadmin). Permet de configurer le SMTP, les providers OAuth (Google, GitHub, GitLab, Gitea), l'IA, les images, les workspaces. Séparé de l'app web principale, tournant sur le port 3001.

**Fichiers principaux :**
- `apps/admin/app/(all)/(dashboard)/authentication/` (gitea, github, gitlab, google)
- `apps/admin/app/(all)/(dashboard)/email/page.tsx`
- `apps/admin/app/(all)/(dashboard)/general/page.tsx`
- `apps/api/plane/license/api/views/` (admin.py, configuration.py, instance.py)

---

### 18. space/public-board — Vue publique embarquable

**Description :** App SSR dédiée à l'exposition publique de projets Plane (boards, issues, intake) pour les utilisateurs non authentifiés. Supporte les réactions, commentaires et votes publics via DeployBoard. Embarquable sur des sites externes via un "anchor" UUID unique.

**Fichiers principaux :**
- `apps/space/app/issues/[anchor]/page.tsx`
- `apps/space/app/[workspaceSlug]/[projectId]/page.tsx`
- `apps/api/plane/space/views/issue.py` (IssueVotePublicViewSet, IssueReactionPublicViewSet)
- `apps/api/plane/space/views/project.py` (ProjectDeployBoardPublicSettingsEndpoint)

---

### 19. live/realtime-collaboration — Collaboration temps réel

**Description :** Serveur Hocuspocus (Y.js/CRDT) pour l'édition collaborative des pages documentaires. Gère l'authentification des connexions WebSocket, la persistance des documents Y.js en base, la synchronisation des titres en temps différé (debounce 10s), et l'export PDF serveur-side via @react-pdf/renderer.

**Fichiers principaux :**
- `apps/live/src/hocuspocus.ts`
- `apps/live/src/controllers/collaboration.controller.ts`
- `apps/live/src/controllers/pdf-export.controller.ts`
- `apps/live/src/extensions/database.ts`
- `apps/live/src/extensions/title-sync.ts`

---

### 20. web/favorites-stickies — Favoris et notes rapides

**Description :** Système de favoris permettant aux utilisateurs d'épingler des issues, projets, cycles, modules, vues et pages (UserFavorite). Les "stickies" sont des notes adhésives personnelles au niveau workspace (Sticky), accessibles depuis la sidebar.

**Fichiers principaux :**
- `apps/api/plane/db/models/favorite.py` (UserFavorite)
- `apps/api/plane/db/models/sticky.py` (Sticky)
- `apps/api/plane/app/views/workspace/favorite.py`
- `apps/api/plane/app/views/workspace/sticky.py`
- `apps/web/app/(all)/[workspaceSlug]/(projects)/stickies/page.tsx`

---

## Décisions techniques clés

1. **Architecture monorepo Turborepo** — 6 apps + 14 packages internes gérés via pnpm workspaces + Turborepo. Les packages `@plane/ui`, `@plane/editor`, `@plane/types`, `@plane/services` centralisent le code partagé entre les 3 apps front. Les versions de dépendances sont centralisées dans `pnpm-workspace.yaml` (catalog).

2. **Séparation stricte app/api** — La logique métier principale est sous `plane/app/` (vues DRF, sérialiseurs, permissions), tandis que `plane/api/` expose une API externe publique distincte, et `plane/space/` expose une API spécifique pour les vues publiques non authentifiées.

3. **Système RBAC à 3 niveaux** — Rôles ADMIN (20), MEMBER (15), GUEST (5) appliqués au niveau workspace ET projet via un décorateur `@allow_permission`. Les permissions sont vérifiées dans les vues via injection directe, sans middleware global.

4. **Stockage de contenu riche en triple format** — Les descriptions Tiptap sont stockées simultanément en `description_json` (ProseMirror), `description_html` (HTML rendu) et `description_binary` (Y.js binaire pour CRDT). Cela permet lecture rapide (HTML), collaboration temps réel (binary) et sérialisation API (JSON).

5. **Collaboration via CRDT Y.js** — L'édition collaborative des pages est gérée par un serveur Hocuspocus dédié (`apps/live`), indépendant de l'API Django. Les changements Y.js sont persistés en base via l'extension `database.ts`, avec un debounce de 10 secondes pour la synchronisation des titres.

6. **Tâches asynchrones Celery massivement utilisées** — 30 tâches Celery couvrent : notifications email, webhooks, exports, activités issues, versioning de descriptions, nettoyage de fichiers, magic link, events PostHog. Le beat scheduler gère les tâches récurrentes (nettoyage, expiration).

7. **Multi-auth avec fallback magic link** — L'authentification supporte 5 modes (email/password, magic link OTP, Google, GitHub, GitLab, Gitea). Le magic link utilise Redis comme store temporaire avec rate limiting par tentatives (MAX_VERIFY_ATTEMPTS=5).

8. **Migration depuis Next.js vers React Router v7** — Les 3 apps front contiennent des shims de compatibilité `app/compat/next/` (Link, Image, Script) indiquant une migration récente. Des fichiers `.d.ts` simulent `next/link` et `next/navigation`. L'app `web` est en SSG et `space` est restée en SSR.

9. **Soft delete généralisé** — Le modèle Issue utilise un `SoftDeletionManager` et un champ `deleted_at`. Les contraintes d'unicité utilisent `UniqueConstraint` avec `condition=Q(deleted_at__isnull=True)` pour tolérer les suppressions (visible aussi sur Intake, State).

10. **UUID primaires sur tous les modèles** — Tous les modèles héritent de `BaseModel` avec `id = UUIDField(primary_key=True, default=uuid4)`. La conversion UUID → integer est disponible pour la génération de `sequence_id` human-readable sur les issues.

11. **Instance license system** — Un sous-système de gestion de licences (`plane/license/`) gère la configuration globale de l'instance (SMTP, OAuth, features), accessible uniquement depuis `apps/admin`. Sépare la configuration instance de la configuration workspace.

12. **Observable/OpenTelemetry** — Observabilité multi-stack : OpenTelemetry (traces + métriques OTLP), Scout APM, PostHog (analytics produit via Celery task), JSON logging structuré. RequestLoggerMiddleware custom pour logger toutes les requêtes.

---

## Évaluation qualité globale

| Critère | État |
|---------|------|
| Tests présents | Partiels — 47 fichiers pytest pour l'API (contrats + smoke + unitaires), 2 fichiers Vitest pour `apps/live` uniquement. Apps web (web/admin/space) : aucun test trouvé. |
| Structure | Bien organisée — claire séparation par domaine dans `plane/app/views/`, stores MobX par entité dans `core/store/`. La structure monorepo est cohérente avec packages partagés bien définis. |
| Gestion d'erreurs | Centralisée côté API (BaseAPIView, BaseViewSet, middleware RequestLogger, utils/exception_logger.py). Des `AuthenticationException` custom. Côté front : gestion locale dans les stores MobX. |
| Documentation | Partielle — README à la racine, règles `.claude/rules/` bien documentées (stack, testing, git), mais pas de documentation API en dehors du schéma OpenAPI (drf-spectacular). Pas de CHANGELOG visible. |
| Internationalisation | Mature — 19 langues supportées via `@plane/i18n`, synchronisation vérifiée en CI (`i18n-sync-check.yml`). |
| Sécurité | CodeQL en CI, Trivy pour les images Docker, rate limiting sur les endpoints auth, signatures HMAC sur les webhooks. Aucune faille évidente identifiée au scan. |
| CI/CD | GitHub Actions couvre : lint Python, lint/build JS, build sur push, CodeQL, i18n sync check. Pas de pipeline de déploiement continu visible (community edition). |
