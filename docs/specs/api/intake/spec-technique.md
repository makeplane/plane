# Spec Technique — api/intake

| Champ         | Valeur              |
|---------------|---------------------|
| Module        | api/intake          |
| Version       | 0.1.0               |
| Date          | 2026-06-30          |
| Source        | Rétro-ingénierie    |

---

## Architecture du module

Le module intake est découpé en deux surfaces d'exposition indépendantes partageant les mêmes modèles de données :

```
plane/db/models/
  intake.py          ← Intake, IntakeIssue, IntakeIssueStatus, SourceType
  deploy_board.py    ← DeployBoard (exposition publique)

plane/app/           ← Surface authentifiée (membres du projet)
  views/intake/
    base.py          ← IntakeViewSet, IntakeIssueViewSet, IntakeWorkItemDescriptionVersionEndpoint
  urls/
    intake.py        ← Routing des endpoints authentifiés
  serializers/
    intake.py        ← IntakeSerializer, IntakeIssueSerializer, IntakeIssueDetailSerializer,
                        IntakeIssueLiteSerializer, IssueStateIntakeSerializer

plane/space/         ← Surface publique (utilisateurs non authentifiés via DeployBoard)
  views/
    intake.py        ← IntakeIssuePublicViewSet
  urls/
    intake.py        ← Routing des endpoints publics
```

**Séparation stricte app/space** : la logique métier de triage avancé (gestion fine des rôles, versions de description, sérialisation détaillée) est dans `plane/app/`. La surface publique (`plane/space/`) expose un sous-ensemble réduit, sans vérification RBAC (authentification déléguée au router DRF space).

---

## Fichiers impactés

| Fichier | Rôle | Lignes |
|---------|------|--------|
| `apps/api/plane/db/models/intake.py` | Modèles Intake, IntakeIssue, enums IntakeIssueStatus, SourceType | ~85 |
| `apps/api/plane/db/models/deploy_board.py` | Modèle DeployBoard (exposition publique multi-entité) | ~58 |
| `apps/api/plane/app/views/intake/base.py` | Vues DRF authentifiées (IntakeViewSet, IntakeIssueViewSet, IntakeWorkItemDescriptionVersionEndpoint) | ~641 |
| `apps/api/plane/space/views/intake.py` | Vue DRF publique (IntakeIssuePublicViewSet) | ~287 |
| `apps/api/plane/app/serializers/intake.py` | Sérialiseurs (5 classes) | ~138 |
| `apps/api/plane/app/urls/intake.py` | Routing authentifié (10 routes, alias intake + inbox) | ~67 |
| `apps/api/plane/space/urls/intake.py` | Routing public (3 routes anchor + 1 workspace-project-boards) | ~36 |
| `apps/api/plane/utils/content_validator.py` | Sanitisation HTML nh3 (anti-XSS GHSA-hh2r-3hwp-mvq3) | ~262 |

---

## Schéma BDD

### Table `intakes`

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `id` | UUID | PK | Hérité de BaseModel |
| `name` | VARCHAR(255) | NOT NULL | Nom de l'intake |
| `description` | TEXT | blank | Description |
| `is_default` | BOOLEAN | default=False | Intake principal non supprimable |
| `view_props` | JSONB | default={} | Propriétés de vue (layout, filtres) |
| `logo_props` | JSONB | default={} | Props du logo |
| `project_id` | UUID | FK → projects | Projet parent |
| `workspace_id` | UUID | FK → workspaces | Workspace |
| `deleted_at` | TIMESTAMPTZ | nullable | Soft delete |
| `created_at`, `updated_at` | TIMESTAMPTZ | | Hérité BaseModel |

Contrainte unique : `(name, project)` où `deleted_at IS NULL`.

### Table `intake_issues`

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `id` | UUID | PK | |
| `intake_id` | UUID | FK → intakes CASCADE | Intake parent |
| `issue_id` | UUID | FK → issues CASCADE | Issue sous-jacente |
| `status` | INTEGER | default=-2 | -2 PENDING, -1 REJECTED, 0 SNOOZED, 1 ACCEPTED, 2 DUPLICATE |
| `snoozed_till` | TIMESTAMPTZ | nullable | Date de dé-snooze |
| `duplicate_to_id` | UUID | FK → issues SET_NULL | Issue dont c'est le doublon |
| `source` | VARCHAR(255) | default='IN_APP' | Provenance (SourceType) |
| `source_email` | TEXT | nullable | Email source pour soumissions mail (futur ?) |
| `external_source` | VARCHAR(255) | nullable | Source externe (intégration tierce) |
| `external_id` | VARCHAR(255) | nullable | ID externe |
| `extra` | JSONB | default={} | Métadonnées supplémentaires non structurées |
| `project_id` | UUID | FK → projects | |
| `workspace_id` | UUID | FK → workspaces | |
| `deleted_at` | TIMESTAMPTZ | nullable | Soft delete |

Tri par défaut : `-created_at`.

### Table `deploy_boards`

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `id` | UUID | PK | |
| `entity_identifier` | UUID | nullable | UUID de l'entité exposée (project_id, issue_id, etc.) |
| `entity_name` | VARCHAR(30) | nullable | Type exposé : 'project', 'issue', 'module', 'cycle', 'page', 'view', 'intake' |
| `anchor` | VARCHAR(255) | UNIQUE, INDEX | Identifiant public URL (hex UUID aléatoire) |
| `is_comments_enabled` | BOOLEAN | default=False | |
| `is_reactions_enabled` | BOOLEAN | default=False | |
| `intake_id` | UUID | FK → intakes SET_NULL | Intake lié (si entity_name='project') |
| `is_votes_enabled` | BOOLEAN | default=False | |
| `view_props` | JSONB | default={} | |
| `is_activity_enabled` | BOOLEAN | default=True | |
| `is_disabled` | BOOLEAN | default=False | |
| `workspace_id` | UUID | FK → workspaces | |
| `deleted_at` | TIMESTAMPTZ | nullable | Soft delete |

Contrainte unique : `(entity_name, entity_identifier)` où `deleted_at IS NULL`.

---

## API / Endpoints

### Surface authentifiée (`/api/v1/`)

| Méthode | Route | Vue | Auth | Rôles requis |
|---------|-------|-----|------|--------------|
| GET | `/workspaces/{slug}/projects/{project_id}/intakes/` | `IntakeViewSet.list` | Session | ADMIN, MEMBER |
| POST | `/workspaces/{slug}/projects/{project_id}/intakes/` | `IntakeViewSet.create` | Session | ADMIN, MEMBER |
| GET | `/workspaces/{slug}/projects/{project_id}/intakes/{pk}/` | `IntakeViewSet.retrieve` | Session | ADMIN, MEMBER |
| PATCH | `/workspaces/{slug}/projects/{project_id}/intakes/{pk}/` | `IntakeViewSet.partial_update` | Session | ADMIN, MEMBER |
| DELETE | `/workspaces/{slug}/projects/{project_id}/intakes/{pk}/` | `IntakeViewSet.destroy` | Session | ADMIN, MEMBER |
| GET | `/workspaces/{slug}/projects/{project_id}/intake-issues/` | `IntakeIssueViewSet.list` | Session | ADMIN, MEMBER, GUEST |
| POST | `/workspaces/{slug}/projects/{project_id}/intake-issues/` | `IntakeIssueViewSet.create` | Session | ADMIN, MEMBER, GUEST |
| GET | `/workspaces/{slug}/projects/{project_id}/intake-issues/{pk}/` | `IntakeIssueViewSet.retrieve` | Session | ADMIN, MEMBER, GUEST (propre) |
| PATCH | `/workspaces/{slug}/projects/{project_id}/intake-issues/{pk}/` | `IntakeIssueViewSet.partial_update` | Session | ADMIN (triage) ou créateur |
| DELETE | `/workspaces/{slug}/projects/{project_id}/intake-issues/{pk}/` | `IntakeIssueViewSet.destroy` | Session | ADMIN ou créateur |
| GET | `/workspaces/{slug}/projects/{project_id}/intake-work-items/{work_item_id}/description-versions/` | `IntakeWorkItemDescriptionVersionEndpoint` | Session | ADMIN, MEMBER, GUEST |
| GET | `/workspaces/{slug}/projects/{project_id}/intake-work-items/{work_item_id}/description-versions/{pk}/` | `IntakeWorkItemDescriptionVersionEndpoint` | Session | ADMIN, MEMBER, GUEST |

Note : les routes `/inboxes/`, `/inbox-issues/` sont des aliases identiques aux routes `/intakes/`, `/intake-issues/`.

### Surface publique (`/space/api/`)

| Méthode | Route | Vue | Auth | Notes |
|---------|-------|-----|------|-------|
| GET | `/anchor/{anchor}/intakes/{intake_id}/intake-issues/` | `IntakeIssuePublicViewSet.list` | Aucune | DeployBoard.intake requis |
| POST | `/anchor/{anchor}/intakes/{intake_id}/intake-issues/` | `IntakeIssuePublicViewSet.create` | Aucune | Sanitisation HTML nh3 |
| GET | `/anchor/{anchor}/intakes/{intake_id}/intake-issues/{pk}/` | `IntakeIssuePublicViewSet.retrieve` | Aucune | |
| PATCH | `/anchor/{anchor}/intakes/{intake_id}/intake-issues/{pk}/` | `IntakeIssuePublicViewSet.partial_update` | Aucune | Créateur uniquement |
| DELETE | `/anchor/{anchor}/intakes/{intake_id}/intake-issues/{pk}/` | `IntakeIssuePublicViewSet.destroy` | Aucune | Créateur uniquement |
| GET | `/anchor/{anchor}/intakes/{intake_id}/inbox-issues/` | alias de intake-issues | Aucune | |

---

## Patterns identifiés

- **ViewSet DRF avec `@allow_permission` méthode par méthode** : conformément au pattern RBAC (RETRO-021), chaque méthode de `IntakeViewSet` et `IntakeIssueViewSet` porte son propre décorateur. `IntakeIssuePublicViewSet` n'utilise pas `@allow_permission` (surface publique sans authentification obligatoire).

- **Soft delete hérité** : `Intake` et `IntakeIssue` héritent de `ProjectBaseModel` qui hérite du mixin soft delete (RETRO-032). La suppression physique de l'issue sous-jacente est gérée explicitement dans `IntakeIssueViewSet.destroy()` selon le statut courant.

- **Transition d'état métier dans le serializer** : la logique de bascule TRIAGE → état par défaut lors de l'acceptation est implémentée dans `IntakeIssueSerializer.update()` et non dans la vue — pattern "fat serializer".

- **Auto-création de l'état TRIAGE** : si le projet n'a pas d'état TRIAGE, il est créé à la volée lors de la soumission (vue `IntakeIssueViewSet.create()` et `IntakeIssuePublicViewSet.create()`). Couleur codée en dur : `#4E5355`, séquence : 65000.

- **Double queryset** : `IntakeIssueViewSet.list()` opère sur `IntakeIssue` (sérialiseur simplifié), tandis que `get_queryset()` opère sur `Issue` avec annotations agrégées (compteurs, IDs de labels/assignees). Incohérence partielle entre le queryset de base et la logique de listing.

- **Sanitisation HTML Rust-based** : `validate_html_content()` utilise la bibliothèque Python `nh3` (wrapping de la lib Rust `ammonia`) avec une allowlist personnalisée de tags et attributs spécifiques à l'éditeur Tiptap. Réference CVE : GHSA-hh2r-3hwp-mvq3 (commentaire dans le code de la vue publique).

- **Pagination** : `IntakeIssueViewSet.list()` utilise le paginateur custom `self.paginate()` hérité de `BaseViewSet`. La vue publique ne pagine pas (retour d'une liste complète via `IssueStateIntakeSerializer(issues, many=True)`).

- **Tâches asynchrones Celery** : deux tâches systématiquement déclenchées lors des mutations :
  - `issue_activity.delay()` — type `issue.activity.created` / `issue.activity.updated` / `intake.activity.created`
  - `issue_description_version_task.delay()` — sauvegarde d'une version de description

---

## Configuration DeployBoard

Le `DeployBoard` est une entité générique pouvant exposer plusieurs types d'entités Plane (project, issue, module, cycle, page, view, intake). Pour la feature intake, seul le type `entity_name="project"` est utilisé. Le lien `DeployBoard.intake` connecte le board à l'Intake actif du projet.

L'`anchor` (hex UUID 32 caractères, généré par `uuid4().hex`) est l'identifiant public immuable permettant d'accéder au DeployBoard sans authentification. Il est unique et indexé en base.

---

## Tests existants

| Fichier | Ce qu'il teste | Statut |
|---------|---------------|--------|
| Aucun fichier de test identifié pour `api/intake` | — | Absent |

La recherche dans `apps/api/tests/` n'a pas retourné de fichier couvrant les vues ou modèles intake. Cette fonctionnalité n'est pas couverte par les tests automatisés identifiés lors de la rétro.

---

## Décisions techniques locales (non éligibles ADR)

- **Double alias d'URL intake/inbox** : les routes `/intakes/` + `/intake-issues/` et `/inboxes/` + `/inbox-issues/` pointent vers les mêmes ViewSets. Il s'agit vraisemblablement d'une rétrocompatibilité lors d'un renommage de "Inbox" vers "Intake". Décision confinée au fichier de routing.

- **Filtre de statut via query param CSV** : `IntakeIssueViewSet.list()` accepte `?status=-2,-1,0,1,2` comme valeur séparée par virgules. Le split + filtre est implémenté manuellement dans la vue (pas via DRF filterset).

- **`skip_activity` flag** : `IntakeIssueViewSet.partial_update()` accepte un flag `skip_activity` dans le body pour court-circuiter le log d'activité lors d'une mise à jour de description considérée comme migration. Usage interne, non documenté dans l'API publique.

- **`extra` JSONField** : champ présent sur IntakeIssue, jamais utilisé dans les sérialiseurs exposés. Probablement réservé pour des métadonnées d'intégrations tierces futures.
