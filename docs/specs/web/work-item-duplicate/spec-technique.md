# Spec Technique — Duplication de work item

| Champ      | Valeur                  |
|------------|--------------------------|
| Module     | web/work-item-duplicate |
| Version    | 0.1.0                   |
| Date       | 2026-07-07              |
| Statut     | IMPLÉMENTÉ v0.1.0 (2026-07-07) |

---

## Architecture

Remplacement de stubs CE (`@/plane-web/*` → `apps/web/ce/*`). V1 sans changement API : clonage orchestré côté client (lecture de l'item source + création via endpoint existant).

## Fichiers concernés

| Fichier | Rôle | État CE actuel |
|---------|------|----------------|
| `apps/web/ce/components/issues/issue-layouts/quick-action-dropdowns/copy-menu-helper.tsx` | `createCopyMenuWithDuplication` — construction du sous-menu | retourne `baseItem` tel quel |
| `apps/web/ce/components/issues/issue-layouts/quick-action-dropdowns/duplicate-modal.tsx` | `DuplicateWorkItemModal` | stub `return <></>` |

## Schéma BDD

Aucune migration.

## API

- Existant : `GET`/`POST` issues (création avec `description_html` — attention au triple format RETRO-031 : envoyer le HTML, l'API régénère les autres formats).
- Aucun nouvel endpoint en V1.

## Tests

- Composant : modal + injection du sous-menu.
- Logique de clonage (mapping des champs) : test unitaire Vitest sur l'helper.
