# Spec Fonctionnelle — Work item types [PLAN]

| Champ   | Valeur              |
|---------|---------------------|
| Module  | api/work-item-types |
| Version | 0.1.0               |
| Date    | 2026-07-08          |
| Statut  | PLAN — à valider    |
| Source  | Cadrage 2026-07-08 (schéma dormant + doc Plane Pro) |

> ⚠️ Garde ADR-001 bypassée (décision dev). Réimplémentation CE (AGPL, sans code plane-ee) de la feature **Pro** « Work Item Types ». Périmètre V1 = **types uniquement** ; les **custom properties** font l'objet d'un module suivant (`api/work-item-properties`).

---

## Contexte

Les modèles `IssueType` + `ProjectIssueType` existent et sont migrés (tables `issue_types`/`project_issue_types`), `Issue.type` (FK) et `Project.is_issue_type_enabled` aussi — mais **aucun CRUD** n'existe en CE, et le type n'est pas exposé par l'API interne web. Objectif : rendre les work item types pleinement utilisables (définir des types par projet, en choisir un à la création/édition d'un work item, filtrer dessus), et exposer les endpoints attendus par le MCP.

## Règles métier (doc Plane Pro)

1. **Activation par projet, irréversible** : `Project.is_issue_type_enabled` passe à `true` (confirmation UI « ne peut pas être désactivé »). À l'activation, **seeding** d'un type par défaut « Work Item » (Task) + un type « Epic » (`is_epic=true`).
2. Un type = `name`, `description`, `logo_props` (icône + couleur), `is_epic`, `is_default`, `is_active`, `level`.
3. **Un seul type par défaut** par projet (pré-sélectionné à la création d'un work item) ; le défaut ne peut être ni désactivé ni supprimé.
4. Types désactivables (`is_active`) plutôt que supprimés ; suppression = soft-delete.
5. Scope **projet** (le scope workspace = Enterprise Grid, hors V1).
6. Accès : gestion réservée aux **admins projet** ; lecture selon appartenance projet.

## Hors V1

- Custom properties (module `api/work-item-properties` à suivre).
- Scope workspace / hiérarchie de types (Enterprise Grid).
- `import_work_item_types_to_project` (copie inter-projets) — Phase ultérieure.

## Dépendances

| Dépendance | Spec | État |
|------------|------|------|
| api/issues | docs/specs/api/issues/ | ✅ |
| api/projects | docs/specs/api/projects/ | ✅ |

## Critères d'acceptation

- CRUD type (create/list/update/delete/resolve) fonctionnel en API interne **et** externe v1 (mapping MCP).
- Activation projet → seeding default + epic.
- `type_id` exposé et éditable sur les work items (API interne web incluse).
- UI : sélecteur de type dans la modale, switcher/identifier dans le détail, filtre par type, toggle projet.
