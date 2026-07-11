# Spec Technique — Work item types

| Champ   | Valeur              |
|---------|---------------------|
| Module  | api/work-item-types |
| Version | 0.1.0               |
| Date    | 2026-07-08          |
| Statut  | IMPLÉMENTÉ v0.1.0 (2026-07-08) |

---

## État d'implémentation (2026-07-08)

Implémenté (backend interne + externe v1/MCP + web), vérifié statiquement (ruff, py_compile ; typecheck web + space OK, oxlint/oxfmt). Tests pytest écrits (contract app + api, unit seeding + write) — non exécutés (pas d'env BDD).

**Revue sécurité adversariale** : 4 findings confirmés, tous corrigés avant commit :
1. (major) `type_id` non scopé au projet → IDOR cross-tenant : ajout d'un contrôle `IssueType.objects.filter(project_issue_types__project_id=..., pk=...)` dans `IssueCreateSerializer.validate()` (parité avec state/parent/estimate).
2. (major) PATCH permettait de promouvoir un Epic en type par défaut (vue interne) → garde `is_epic && is_default` ajoutée.
3. (major) Gardes de protection du défaut contournables (`request.data` brut vs coercion DRF) → validation via serializer d'abord, gardes évaluées sur `serializer.validated_data` (booléens coercés), sur les deux vues (interne + v1).
4. (minor) PATCH v1 permettait un Epic en défaut → même garde epic.
Rejeté (non corrigé) : race check-then-act du seeding/défaut (préconditions concurrentes irréalistes en pratique ; à revoir si besoin via contrainte DB).

---

## Schéma (existant, dormant — AUCUNE nouvelle table en V1)

- `IssueType` (`apps/api/plane/db/models/issue_type.py:14-32`) : workspace FK, name, description, logo_props (JSON), is_epic, is_default, is_active, level, external_source/id. Table `issue_types` (migration 0070 ; is_active en 0071).
- `ProjectIssueType` (`:35-55`) : issue_type FK, project, level, is_default ; unique (project, issue_type, deleted_at). Table `project_issue_types` (migration 0074). **NB : pas ré-exporté dans `db/models/__init__.py`** → ajouter l'export.
- `Issue.type` FK SET_NULL (`issue.py:164-170`), `Project.is_issue_type_enabled` (`project.py:99`).

→ V1 : pas de migration de schéma. Éventuel micro-ajustement : ré-export `ProjectIssueType`.

## API à créer

### Interne (app, session) — pour l'UI
- `GET/POST /api/workspaces/:slug/projects/:project_id/issue-types/`
- `GET/PATCH/DELETE .../issue-types/:type_id/`
- Exposer `type_id` dans les serializers/`.values()` issue web internes (aujourd'hui omis) — sinon le front ne reçoit jamais le type.
- Toggle projet : `is_issue_type_enabled` via `ProjectSerializer` (déjà `__all__`) + endpoint/action d'activation qui déclenche le seeding.

### Externe (api v1, token — MCP)
- `GET/POST /api/v1/workspaces/:slug/projects/:project_id/work-item-types/`
- `GET/PATCH/DELETE .../work-item-types/:type_id/`  (list/create/update/delete/resolve_work_item_type)
- Convention d'URL alignée sur `apps/api/plane/api/urls/work_item.py` (préfixe `work-items`).

### Permissions
- Mutations (create/update/delete/activation) : ADMIN projet (`ProjectEntityPermission`/`allow_permission([ADMIN])`).
- Lecture : appartenance projet.
- Invariants : un seul `is_default` par projet (transaction) ; le défaut non supprimable/désactivable ; `is_epic` non modifiable après création.

## Seeding

À l'activation de `is_issue_type_enabled` (idempotent) : créer `IssueType` « Work Item » (is_default) + `ProjectIssueType`, et `IssueType` « Epic » (is_epic). S'inspirer d'un éventuel util existant ; sinon fonction dédiée `plane/utils/` appelée par l'endpoint d'activation.

## Serializers

- `IssueTypeSerializer` (interne + v1) : id, name, description, logo_props, is_epic, is_default, is_active, level, project_ids/level via ProjectIssueType.

## Activité

Ajouter un verbe d'activité « type » (changement de type d'un work item) dans `bgtasks/issue_activities_task.py` (mapper). Émettre à l'update de `Issue.type`.

## Web (apps/web)

Remplacer les stubs CE (résolus via `@/plane-web/* -> ./ce/*`) :
- `ce/components/issues/issue-modal/issue-type-select.tsx` — sélecteur de type (défaut pré-sélectionné).
- `ce/components/issues/issue-details/issue-type-switcher.tsx`, `issue-identifier.tsx` — badge/switch de type.
- `ce/components/issues/filters/issue-types.tsx` + `applied-filters/issue-types.tsx` — filtre par type.
- `ce/components/issues/issue-details/issue-type-activity.tsx` — rendu activité type.
- Store + service : `issue-type` (MobX) + `packages/services/src/issue-type/`.
- Types partagés : `IIssueType` dans `@plane/types` (aujourd'hui seul `type_id`/`is_epic` sur TIssue).
- Toggle projet dans les settings (`project/settings/features-list` — l'entrée existe, la câbler avec confirmation irréversible + `UpgradeBadge` retiré).
- **Ne PAS** implémenter les composants custom-properties (provider no-op laissé tel quel) — module suivant.

## Pitfalls identifiés

- **`computedFn`/`DeepMap` — arité d'appel constante (web)** : `getProjectIssueTypes` dans `core/store/issue-type.store.ts` est un `computedFn` mémoïsé par une `DeepMap` MobX ; cette structure exige que tous les appels utilisent **exactement le même nombre d'arguments**. Toujours passer les deux arguments `(projectId, activeOnly)` même quand `activeOnly=false` est la valeur par défaut — omettre le second argument sur un seul call-site déclenche `DeepMap should be used with functions with a consistent length` selon l'ordre de rendu. Reproduit et corrigé (fix/issue-type-computedfn-arity, 2026-07-11).

## Tests

- pytest : CRUD interne + v1, permissions (admin vs member), un seul défaut, seeding à l'activation, exposition `type_id` sur issue, resolve par name. Non exécutés en local (pas d'env BDD).

## Reste à faire / suites
- Module `api/work-item-properties` (custom properties : 3 modèles greenfield).
- `import_work_item_types_to_project`, scope workspace (Enterprise Grid).
