# Spec Technique — Milestones (jalons projet)

| Champ      | Valeur              |
|------------|----------------------|
| Module     | api/milestones      |
| Version    | 0.1.0               |
| Date       | 2026-07-12          |
| Statut     | IMPLÉMENTÉ v0.1.0 (2026-07-12) |

---

## Architecture

Double couche backend sur modèles greenfield (calque cycles) : `plane/api` (v1 token/MCP, contrat SDK strict) + `plane/app` (interne session pour le web). Front net-new (type/service/store/UI) sur les accroches dormantes.

## Modèles (`plane/db/models/milestone.py`, migration `0128_milestones`)

- `Milestone(ProjectBaseModel)` : `name` CharField(255), `description` TextField(blank), `target_date` DateTimeField(null), `external_source`/`external_id` CharField(null), `sort_order` FloatField(65535, auto-décalé à la création comme Cycle). Table `milestones`.
- `MilestoneIssue(ProjectBaseModel)` : `issue` FK → `db.Issue` (related_name `issue_milestone`), `milestone` FK CASCADE (related_name `issue_milestone`). `unique_together (issue, milestone, deleted_at)` + `UniqueConstraint(issue, milestone) WHERE deleted_at IS NULL` (`milestone_issue_when_deleted_at_null`) — calque exact CycleIssue. Table `milestone_issues`.
- `Project.is_milestone_enabled` BooleanField(default=False) — exposé automatiquement par les serializers projet (`fields="__all__"`) + ajouté aux fields écrivibles du `ProjectCreateSerializer` v1.

## API v1 (SDK/MCP — `plane/api/{serializers,views,urls}/milestone.py`)

| Route (slash final) | Méthodes | Notes |
|---|---|---|
| `…/milestones/` | GET, POST | GET cursor-paginé (enveloppe BasePaginator) ; POST `{title req, target_date?, external_source?, external_id?}` → 201 ; 409 si dedup externe ; 400 si toggle off |
| `…/milestones/{id}/` | GET, PATCH, DELETE | PATCH partiel (title optionnel) → 200 ; DELETE → 204 ; 409 dedup externe au PATCH |
| `…/milestones/{id}/work-items/` | GET, POST, DELETE | GET cursor-paginé de `{id, issue, milestone}` ; POST `{issues:[uuid]}` AJOUTE (UUID + même-projet validés 400, déjà-liés ignorés, 201 = liens créés seulement) ; **DELETE avec body** `{issues:[uuid]}` → 204 |

- **`title` exposé via `serializers.CharField(source="name")`** en lecture ET écriture — LE point dur du contrat (le SDK Pydantic `Milestone.model_validate` exige `title`).
- Permission `ProjectEntityPermission` + scoping queryset `project__project_projectmember__member/is_active` ; `use_read_replica`.
- Annotations listes : `total_issues`/`completed_issues` (Count distinct, exclusions archived/draft/soft-deleted).
- Gate écritures : `_milestones_enabled()` → 400 `"Milestones are not enabled for this project."`.

## Couche app interne (`plane/app/{serializers,views,urls}/milestone*`)

- `GET/POST …/milestones/`, `GET/PATCH/DELETE …/milestones/:pk/`, `GET/POST …/milestones/:id/milestone-issues/`, `DELETE …/milestone-issues/:issue_id/` (retrait unitaire, pattern interne).
- `allow_permission([ADMIN, MEMBER])` écritures, `[…, GUEST]` lectures ; gate toggle sur écritures ; validation UUID + même-projet → 400 (parité v1, pas de drop silencieux) ; `validators=[]` sur les serializers MilestoneIssue (piège DRF UniqueTogetherValidator).

## Web

- `packages/types/src/milestone.ts` (`TMilestone`, champs annotés optionnels — code défensif), `is_milestone_enabled` sur le type projet partiel.
- `core/services/milestone.service.ts` (CRUD + issues), store MobX (`core/store/milestone.store.ts` + résolution CE, getters scopés projet), hook `use-milestone`.
- Page `app/(all)/…/projects/(detail)/[projectId]/milestones/` (route enregistrée, nav projet gatée `is_milestone_enabled`, état disabled avec CTA Manage features), toggle dans `project/settings/features-list.tsx`, composants `core/components/milestones/` (section, list-item, modal RHF, delete-modal, issues-list, attach via `ExistingIssuesListModal`).
- i18n : clés existantes réutilisées + 4 clés plates (`milestone_new`, `milestone_attach_work_items`, `milestone_empty_state`, `milestone_work_items_empty_state`) et bloc `disabled_project.empty_state.milestone` × 19 locales (`primary_button.text` réutilise la traduction locale existante de « Manage features »). Toasts/titres de modal en anglais dur = parité upstream (cycles/modules font pareil).

## Tests

- `plane/tests/contract/api/test_milestones_v1.py` (11) : title dans la réponse (PAS name), title requis, enveloppe cursor, retrieve/patch/delete, 409 dedup, gate 400, auth, work-items add/list/remove + dédup + rejet cross-projet + payload malformé.
- `plane/tests/contract/app/test_milestones_app.py` (7) : create/list avec compteurs, gate, guest lecture-seule, non-membre refusé, update/destroy, attach/detach, rejet issue étrangère.
- MCP EN DIRECT (instance locale) : create/update/list_milestones, manage/list_milestone_work_items — contrat Pydantic validé.
- `makemigrations --check` clean · turbo check:types 11/11 · oxlint 0/0 · UI navigateur.

## Pièges connus

- **`title` vs `name`** : toute nouvelle surface v1 milestones DOIT exposer `title` (source=name). L'interne continue en `name`.
- Le DELETE work-items v1 porte un BODY — DRF le parse via `request.data` (ne pas transformer en URL détail).
- `runserver` ne charge pas les nouveaux modules URL → `docker restart plane-api-1` après ajout de routes.
- Base de la branche : `feat/estimates-time` (la migration 0128 dépend de 0127) — merger #30 avant ce module.
