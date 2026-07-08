# Spec Technique — Pages imbriquées (nested pages)

| Champ      | Valeur           |
|------------|-------------------|
| Module     | api/pages-nested |
| Version    | 0.1.0            |
| Date       | 2026-07-07       |
| Statut     | IMPLÉMENTÉ v0.1.0 (2026-07-07) |

---

## Architecture

Activation d'un schéma dormant CE : l'écriture de `parent` fonctionne déjà (validation dans `partial_update`), la cascade archive est en SQL récursif. Il manque la lecture de l'arbre (API) et l'UI.

## Fichiers concernés

### API (apps/api)

| Fichier | Rôle | État CE actuel |
|---------|------|----------------|
| `plane/db/models/page.py` | `Page.parent` self-FK (l.40-46), `PageVersion.sub_pages_data` (l.167) | schéma présent, dormant |
| `plane/app/views/page/base.py` | List pages | filtre `parent__isnull=True` (l.97 et l.429) — à conserver pour les racines, ajouter un endpoint sub-pages |
| `plane/bgtasks/page_version_task.py` | Snapshot de version | `sub_pages = {}` figé (l.29, écrit l.47 et l.69) — à remplir en parcourant `child_page` |
| `plane/app/urls/page.py` | Routage | ajouter `.../pages/<page_id>/sub-pages/` |

### Web (apps/web)

| Fichier | Rôle | État CE actuel |
|---------|------|----------------|
| `apps/web/ce/components/pages/` | Stubs pages EE (move, modals, navigation-pane tab-panels) | null |
| `apps/web/ce/store/pages/extended-base-page.ts` | Extension du store page | `asJSONExtended()` retourne `{}` |
| `apps/web/core/components/pages/` (navigation-pane) | Arbre à enrichir | liste plate actuelle |

## Schéma BDD

Aucune migration : `parent_id` et `sub_pages_data` existent (migration 0093). Index sur FK déjà géré par Django.

## API

- Nouveau : `GET /api/workspaces/:slug/projects/:projectId/pages/:pageId/sub-pages/` (enfants directs + compteurs).
- Existant : `PATCH .../pages/:pageId/` accepte `parent` (validation anti-cycle à ajouter).
- Existant : archive/unarchive cascade (ne pas toucher).

## Tests

- pytest : list racines inchangé, sub-pages endpoint, anti-cycle, cascade archive avec enfants, sub_pages_data rempli au versionnage.
- Web : rendu de l'arbre, création de sous-page.

---

## État d'implémentation (2026-07-07)

Implémenté et vérifié statiquement (ruff, py_compile ; typecheck web OK). Tests pytest écrits (`tests/contract/app/test_page_app.py`, `tests/unit/bg_tasks/test_page_version_task.py`) — **non exécutés** (pas d'env Postgres/Django sur le poste).

Fichiers : `plane/app/views/page/base.py` (endpoint `sub-pages/` + validation parent), `plane/app/urls/page.py`, `plane/bgtasks/page_version_task.py` (remplissage `sub_pages_data`), `apps/web/core/{services/page/project-page.service.ts, store/pages/project-page.store.ts, components/pages/list/*}`, `apps/web/ce/store/pages/extended-base-page.ts`, `packages/types/src/page/extended.ts`.

### Décisions de sécurité/correctness (spec-technique, hors ADR — invariants confinés au module pages, cf. politique 06)

1. **Filtre d'accès sur le parent.** La validation d'un `parent` (en `create` ET `partial_update`) applique `Q(owned_by=request.user) | Q(access=0)` + `archived_at__isnull=True` + même projet. Invariant : impossible de rattacher une sous-page sous la page privée d'un autre utilisateur, ni d'utiliser la réponse 201/400 comme oracle d'existence d'UUID de pages privées.
2. **Anti-cycle robuste.** La remontée d'ancêtres borne les cycles pré-existants via un set de visités (pas de boucle infinie/DoS). Le re-parentage est sérialisé par `transaction.atomic()` + `select_for_update()` verrouillant la page **et** le parent prospectif dans l'ordre des pk → empêche la course A↔B créant un cycle persistant.
3. **Lecture de l'arbre.** Le list racine conserve `parent__isnull=True` ; les enfants ne sont servis que par l'endpoint `sub-pages/` (mêmes permissions/annotations que le list). Web : arbre lazy-load par tab ; une sous-page archivée reste atteignable dans l'onglet Archived et n'apparaît pas sous un parent actif.

### Points d'entrée UI « New sub-page »
- Liste des pages : menu « … » de chaque ligne (`core/components/pages/list/block-item-action.tsx`, clé dans `optionsOrder`).
- Page ouverte : menu « … » de la barre d'outils de l'éditeur (`core/components/pages/editor/toolbar/options-dropdown.tsx`) — **ajouté en v0.1.1** (l'action était définie dans `dropdowns/actions.tsx` mais absente de cet `optionsOrder`, donc jamais rendue en vue détail).
> Rappel : une action `TPageActions` n'apparaît que si sa clé figure dans l'`optionsOrder` du call site — l'ajouter à `MENU_ITEMS` ne suffit pas.

### Reste à faire
- Exécuter les tests pytest sur un env avec BDD.
- UI : arbre des sous-pages **dans la page ouverte** (panneau de navigation — stub CE `navigation-pane/tab-panels` non implémenté) ; breadcrumb parent ; drag & drop de déplacement ; annotation `sub_pages_count` pour n'afficher le chevron que sur les pages ayant des enfants.
