# Tech Design / Plan — api/workspace-pages

> Wiki workspace = `Page(is_global=True)` sans `ProjectPage`, zéro migration. Full-stack : Django (interne + v1/MCP) → live (workspace_page) → web (wiki). Fix préexistant (fuite recherche) = branche `fix/` séparée AVANT le module.

## Stage 0 — fix/search-private-pages-leak (hors module, PR séparée)
- `filter_pages` (plane/app/views/search/base.py ~l.164-208) : ajouter `Q(access=0) | Q(owned_by=user)` (parité avec `query_type=page` projet qui filtre déjà access=0).
- Test pytest de non-fuite + non-régression recherche. Branche `fix/search-private-pages-leak` basée `preview`, PR dédiée.

## Stage 1 — Backend interne (worktree)
- `WorkspacePagePermission` + vues workspace pages (sous-classes paramétrées des viewsets pages projet — pattern epics) + `plane/app/urls/workspace_page.py` + registres.
- Invariants : create force `is_global=True`/aucun ProjectPage ; validation parent même-conteneur (étendre la validation pages-nested) ; querysets dédiés `projects__isnull=True`.
- Périphériques : `page_access.py` (pages sans projet), `recent_visited_task` (+ whitelist `workspace_page`).
- **Vérif** : ruff, py_compile.

## Stage 2 — Backend externe v1 + tests
- Serializers/vues/URLs v1 pages (2 scopes, enveloppe paginée, type/search/cursor, create/get/delete) alignés SDK au caractère près.
- Tests pytest (~35-40) : matrice spec-technique complète.
- Intégration + **tests réels Docker** (`makemigrations --check` = « No changes detected », suites pages existantes rejouées).

## Stage 3 — apps/live (worktree)
- `TDocumentTypes += "workspace_page"`, `WorkspacePageService`, branchement handler, pdf-export (décision au call-site).
- **Tests vitest** handler/service/auth + `pnpm --filter live build && test`.

## Stage 4 — Web (worktree)
- `EPageStoreType.WORKSPACE`, stores/services, routes `/wiki` + `/wiki/:pageId`, sidebar, généralisation nested (PageListBlock, handleCreateSubPage), favoris, empty states.
- **Vérif** : `pnpm --filter web check:types`, oxlint, i18n sync.

## Stage 5 — Revue + doc + PR
- Revue sécurité adversariale (2 auditeurs + double vérif) : IDOR cross-workspace, private=owner-only partout (y compris description/ binaire = garde réelle du realtime), guest exclu, invariant conteneur/cascade, v1 isolation, query params live.
- Vérif E2E sur l'API vivante (client Django in-process) + MCP si possible.
- Doc-sync : spec IMPLÉMENTÉ, VERSIONNING, CHANGELOG (pas de schema.md — zéro migration).
- PR `feat/wiki-workspace-pages` → `preview`.

## Décisions
- Discriminant `is_global=True` (seam EE confirmé par la recherche advanced) plutôt qu'un nouveau champ → zéro migration.
- Réutilisation par sous-classes paramétrées (pattern epics validé) ; permissions workspace dédiées (l'ancrage projet des permissions pages est structurel).
- Chemin web canonique `/wiki` (seams EE existants) ; guests exclus du wiki (matrice upstream).
- Pas d'ADR : aucune décision hors politique 06 (pas de nouveau modèle ; conventions existantes).

## Risques
- La permission `description/` binaire est LE garde-fou du realtime (le live forwarde le cookie) — tests dédiés.
- Généralisation des composants nested web sans régresser les pages projet (signatures rétro-compatibles).
- `shared` (filtre v1 upstream) sans équivalent CE → liste vide documentée.
- Gros module 3 surfaces : intégrer et tester surface par surface (backend d'abord, live ensuite, web enfin).
