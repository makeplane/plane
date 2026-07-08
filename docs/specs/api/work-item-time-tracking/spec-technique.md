# Spec Technique — Time tracking / worklogs

| Champ   | Valeur                        |
|---------|-------------------------------|
| Module  | api/work-item-time-tracking   |
| Version | 1.0.0                         |
| Date    | 2026-07-08                    |
| Statut  | IMPLÉMENTÉ                    |
| Source  | Cadrage 2026-07-08 (code CE + doc développeurs + SDK plane-python-sdk/MCP publics) |

> ⚠️ Garde ADR-001 bypassée (décision dev). Réimplémentation CE (AGPL, sans code plane-ee) du **time tracking** (feature Pro). V1 = saisie/CRUD de worklogs + cumul. Les **approbations** (Business) sont hors V1.
> Révision 0.2.0 : alignement sur le cadrage vérifié (chemins réels du SDK, seam d'activité web, permissions matrix, rétention `logged_by`).
> **1.0.0 (IMPLÉMENTÉ)** : backend (modèle `IssueWorkLog`, migration `0125`, API interne + externe v1 alignée MCP) + web (types/store/service, 4 stubs CE, toggle projet, i18n 19 locales). **47 tests pytest verts** contre la BDD Docker, contrat vérifié sur l'API vivante, `check:types` web vert. Voir VERSIONNING.md.

---

## Contexte

`Project.is_time_tracking_enabled` existe (dormant, décoratif — exposé et modifiable via PATCH projet interne et externe, lu par personne). **Aucun modèle worklog** en CE (greenfield ; seuls seams : choix `ExporterHistory.type="issue_worklogs"` et clés i18n). Le web branche déjà sur `activity_type === "WORKLOG"` (`activity-comment-root.tsx:91`) et 4 points d'insertion consomment les stubs CE `apps/web/ce/components/issues/worklog/*`.

## Modèle (greenfield — 1 table)

```python
# apps/api/plane/db/models/worklog.py
class IssueWorkLog(ProjectBaseModel):
    issue = FK("db.Issue", CASCADE, related_name="issue_worklogs")
    logged_by = FK(AUTH_USER_MODEL, SET_NULL, null=True, related_name="worklogs")
    duration = PositiveIntegerField(default=0)   # MINUTES (entier — pas de decimal)
    description = TextField(blank=True, default="")
    external_source = CharField(max_length=255, null=True, blank=True)
    external_id = CharField(max_length=255, null=True, blank=True)
    class Meta:
        db_table = "issue_worklogs"
        indexes = [Index(fields=["issue"]), Index(fields=["project", "logged_by"])]
        ordering = ("-created_at",)
```

- Hérité de `ProjectBaseModel` : `id` UUID, `created_at/updated_at`, `created_by/updated_by`, `deleted_at` (**soft delete** — les sommes utilisent le manager `objects`, jamais `all_objects`), `project` + `workspace` dénormalisé (réécrit par `save()` ; en `bulk_create` fixer `workspace_id` explicitement).
- `logged_by` en **SET_NULL** (≠ plan 0.1.0 CASCADE) : un worklog est une donnée de facturation/audit, on ne la perd pas si l'utilisateur est supprimé (pattern `IssueActivity.actor`). Toujours imposé **côté serveur** (`serializer.save(logged_by=request.user)` à la création, jamais depuis le payload — `created_by` via crum n'est pas fiable en contexte Celery/scripts).
- Durée en **minutes entier** (pas de dérive float sur les rollups ; le web formate en « Xh Ym »). `created_at` = date du log (pas de champ date en V1).
- Export dans `db/models/__init__.py`. Migration `0125_issue_worklogs` (chaînée sur `0124_issue_properties`).

## API

### Interne (app, session) — modelé sur les vues issue_property (plane/app/views/issue_property/base.py)
- `GET/POST /api/workspaces/:slug/projects/:project_id/issues/:issue_id/worklogs/`
- `PATCH/DELETE .../worklogs/:pk/`
- `GET /api/workspaces/:slug/projects/:project_id/total-worklogs/` — agrégat `[{issue_id, duration}]` (somme minutes par work item).
- Permissions (`@allow_permission`) : GET = ADMIN/MEMBER/GUEST ; POST = ADMIN/MEMBER ; PATCH/DELETE = `logged_by == request.user` OU rôle ADMIN (garde explicite dans la vue).
- **Gate écriture** : POST/PATCH/DELETE rejetés en **400** si `project.is_time_tracking_enabled` est False. Lectures autorisées.
- **Gate intake** : POST rejeté en 400 si le work item est en intake **non accepté** (IntakeIssue avec status ≠ 1).

### Externe (api v1, token — cible du serveur MCP officiel via plane-python-sdk 0.2.19)
- `POST/GET /api/v1/workspaces/:slug/projects/:project_id/work-items/:issue_id/worklogs/`
- `PATCH/DELETE .../work-items/:issue_id/worklogs/:pk/`
- `GET /api/v1/workspaces/:slug/projects/:project_id/total-worklogs/` → `[{"issue_id": uuid, "duration": int}]`
- Chemins **exactement** ceux construits par le SDK (`work_items/work_logs.py`, `projects.py`) : segment `work-items` (pas `issues` — l'alias historique du vieux MCP npm n'est pas fourni), endpoint summary **`total-worklogs/`**, trailing slash.
- Corps create/update : `duration` (int minutes) + `description` — champs `created_by`/`updated_by` du payload **ignorés**. Réponse : clés alignées sur le modèle pydantic `WorkItemWorkLog` du SDK (`id, created_at, updated_at, description, duration, created_by, updated_by, project_id, workspace_id, logged_by`) — attention au nommage `project_id`/`workspace_id` (pas `project`/`workspace`).
- L'unité du summary est la **minute** (le docstring SDK dit « seconds » mais contredit la doc worklog ; cohérence interne choisie : minutes partout — documenté).
- Mapping MCP : `create_work_log`, `list_work_logs`, `update_work_log`, `delete_work_log`, `get_project_worklog_summary`.
- Vues héritant de `plane/api/views/base.py::BaseAPIView` (X-Api-Key, throttle api_key, handle_exception maison) + mêmes gates/permissions que l'interne (via `ProjectEntityPermission` + gardes explicites).

### Activité — décision
**Pas de lignes `IssueActivity`** pour les worklogs (≠ plan 0.1.0). Le seam web attend des items de feed `{id, activity_type: "WORKLOG", created_at}` construits par le store d'activité CE (`buildActivityAndCommentItems`, méthode `protected` prévue pour ça) à partir du **store worklog** — le worklog EST l'entrée du feed, rendue par `IssueActivityWorklog`. Émettre en plus des `IssueActivity` doublerait les entrées de l'onglet « All ». (Contraste assumé avec work-item-properties qui a une tâche d'activité dédiée : les property values n'ont pas d'entrée de feed propre.)

### Webhooks
Hors V1 (le modèle `Webhook` n'a pas de flag worklog ; cohérent avec les property values non webhookées).

### Décisions issues de la revue sécurité adversariale (2026-07-08)
- **Lectures non gatées par le toggle** (décision assumée, BK-1) : désactiver `is_time_tracking_enabled` bloque les écritures (400) mais laisse les lectures/agrégats accessibles aux membres du projet — les données restent scopées membres, aucune fuite cross-tenant ; c'est un soft-gate produit, pas une frontière de sécurité.
- **Identité externe create-only + contrainte DB** (BK-2, corrigé) : `external_source`/`external_id` sont ignorés en PATCH (serializers), la dédup 409 s'applique aux deux surfaces de création, et une `UniqueConstraint` partielle `(project, external_source, external_id) WHERE deleted_at IS NULL` (migration `0126`) garantit l'idempotence d'import contre les races.
- **Listes non paginées non bornées** (décision assumée, BK-3) : le contrat SDK/MCP impose un tableau simple ; pas de cap serveur en V1 (tailles pratiques bornées par le rythme de saisie humaine). À réévaluer si un usage machine massif apparaît.
- **Worklog sur work item archivé possible** (BK-4, info) : non bloqué en V1 (l'upstream ne documente rien) ; les lectures excluent déjà les projets archivés.
- **Description vide en édition** (WB-1, corrigé) : `worklog-form-modal.tsx` envoie toujours le champ `description` en PATCH (même vide) — sans ça, un champ absent est ignoré par le serializer et la description ne peut pas être effacée.
- **Types `logged_by` nullables** (WB-3, corrigé) : `TIssueWorklog.logged_by` et `logged_by_detail` sont `null | …` dans `packages/types` pour refléter le `SET_NULL` Django ; les rendus de l'auteur doivent gérer le cas absent (utilisateur supprimé).

## Web (apps/web — tout en `ce/` + `core/`, PAS de dossier `ee/` ; alias `@/plane-web/*` → `./ce/*`)

- **Types** : `TIssueWorklog`, `TIssueWorklogSummary` dans `packages/types` ; ajouter `is_time_tracking_enabled?: boolean` à `IProject` (`packages/types/src/project/projects.ts`, absent aujourd'hui) → rebuild `@plane/types`.
- **Constantes** : ajouter `WORKLOG` à `EActivityFilterType` + entrée dans `ACTIVITY_FILTER_TYPE_OPTIONS` (Record exhaustif — erreur de compile sinon) + `defaultActivityFilters` (`packages/constants/src/issue/filter.ts`). ⚠️ localStorage `issue_activity_filters` : les utilisateurs existants ont une valeur stockée sans WORKLOG → fusionner WORKLOG à la lecture (limitation documentée sinon).
- **Service** : `apps/web/core/services/worklog.service.ts` (pattern issue-property.service.ts, API interne).
- **Store** : store worklog MobX (map par issueId + sommes computed) instancié dans **les deux constructeurs** du RootStore (`root.store.ts` ~l.132 et ~l.169) + shim `ce/store` ; étendre `IssueActivityStore.buildActivityAndCommentItems` (ce/store/issue/issue-details/activity.store.ts:87) pour injecter les items WORKLOG.
- **Stubs CE à implémenter** :
  - `worklog/activity/worklog-create-button.tsx` — bouton « + Log work » + modal heures/minutes/description (gaté sur `is_time_tracking_enabled` du projet : aucun call-site ne le vérifie).
  - `worklog/activity/root.tsx` — rendu d'une entrée worklog du feed + menu « … » Edit/Delete (droits : auteur ou admin).
  - `worklog/activity/filter-root.tsx` — **étendre** (pas remplacer : c'est un composant fonctionnel) : option Worklogs si toggle projet actif.
  - `worklog/property/root.tsx` — ligne « Tracked time » complète (icône+label+valeur) : rendu NU dans sidebar.tsx:262 et peek-overview/properties.tsx:256 (non enveloppé dans SidebarPropertyListItem).
- **Toggle** : entrée Time Tracking dans `PROJECT_FEATURES_LIST` (`project/settings/features-list.tsx`, pattern toggle simple réversible — pas le pattern modal irréversible de work-item-types) ; clés i18n `project_settings.features.time_tracking.*` déjà livrées. L'activité projet affiche déjà « enabled/disabled time tracking » (`common/activity/helper.tsx:280`).
- **i18n** : toute nouvelle clé (formulaire Log time, validations) à ajouter aux **19 locales** (CI i18n-sync-check ; skill translate).

## Tests (pytest, exécutés dans le conteneur Docker plane-api-1)
- Modèle + migration (makemigrations --check).
- CRUD interne + externe v1 (chemins SDK exacts, shape de réponse `project_id`/`workspace_id`).
- Gate `is_time_tracking_enabled` (400 en écriture, lecture OK) ; gate intake.
- Permissions : auteur vs autre membre vs guest vs admin ; `logged_by` imposé serveur (payload ignoré).
- Summary : agrégat minutes par issue, exclut les soft-deleted, isolation projet.
- Isolation cross-projet/workspace (worklog_id d'un autre projet → 404).

## Hors V1
- Approbations de worklogs (Business), timesheet workspace + export (seam ExporterHistory), rollups cycle/module, estimé vs loggé, roll-up sous-items, timer live, webhooks, alias externe `/issues/:id/worklogs/` (vieux MCP npm).
