# Spec Technique — Wiki workspace pages

| Champ   | Valeur              |
|---------|---------------------|
| Module  | api/workspace-pages |
| Version | 1.0.0               |
| Date    | 2026-07-09          |
| Statut  | IMPLÉMENTÉ          |
| Source  | Cadrage 2026-07-09 (code CE exhaustif + doc/SDK/MCP publics) |

> ⚠️ Garde ADR-001 bypassée (décision dev). Page workspace = `Page(is_global=True)` sans lignes `ProjectPage` — **aucune migration** (leaf `0126` intact). Module full-stack : API Django + apps/live + web.
> **1.0.0 (IMPLÉMENTÉ)** : backend (API interne miroir + `WorkspacePagePermission` + garde anti-IDOR `is_global`/`projects__isnull` + invariant conteneur + `access/` durci + v1 2 scopes) + live (`workspace_page` + `WorkspacePageService`, 42 tests vitest) + web (routes `/wiki`, stores `EPageStoreType.WORKSPACE`, sidebar, nested généralisé). **72 tests pytest + 37 non-régression** (Docker) + gardes de sécurité validés E2E sur l'API vivante. Revue adversariale menée en parallèle — corrections éventuelles en `fix(...)`.

---

## Modèle — rien à migrer, un discriminant à verrouiller

`Page` : `workspace` FK directe non-nullable ; `projects` M2M via `ProjectPage` (optionnelle) ; `is_global` Boolean défaut False (seam EE — seul consommateur actuel : recherche advanced `query_type=page` filtre `is_global=True`) ; `parent` self-FK ; `access` 0=Public/1=Private ; `owned_by`, `is_locked`, `archived_at`, soft delete. `PageVersion`/`PageLog`/`UserFavorite` ont tous une FK workspace → réutilisables tels quels.

**Invariants à imposer serveur** :
1. Page workspace ⇔ `is_global=True` ET aucune `ProjectPage` ; page projet ⇔ `is_global=False` ET ≥1 `ProjectPage`. Jamais d'hybride.
2. **Conteneur des sous-pages** : `parent` d'une page workspace = page workspace du même workspace ; `parent` d'une page projet = page projet du même projet (validation existante pages-nested à étendre — aujourd'hui contrainte « même projet » seulement). La cascade archive/unarchive (SQL récursif `parent_id` sans scoping) ne traverse alors jamais la frontière.

## Backend — API interne (app, session)

Nouvelles routes `workspaces/<slug>/pages/…` **miroir exact** du set projet (`plane/app/urls/page.py`), en réutilisant les viewsets existants paramétrés (sous-classes, pattern du module epics) :
- `pages-summary/` GET — stats public/private/archived.
- `pages/` GET (sections type=public|private|archived) + POST (create : `is_global=True` forcé serveur, aucun `ProjectPage`, `owned_by=request.user`).
- `pages/<page_id>/` GET / PATCH / DELETE.
- `pages/<page_id>/sub-pages/` GET (module pages-nested) ; création de sous-page = POST `pages/` avec `parent` (invariant conteneur validé).
- `favorite-pages/<page_id>/` POST/DELETE (`UserFavorite` — `project_id` null).
- `pages/<page_id>/archive/` POST + DELETE (cascade descendants existante).
- `pages/<page_id>/lock/` POST/DELETE ; `pages/<page_id>/access/` POST.
- `pages/<page_id>/description/` GET (stream binaire Y.js) + PATCH — **requis par le serveur live**.
- `pages/<page_id>/versions/[<pk>/]` GET ; `pages/<page_id>/duplicate/` POST (sans réplication `ProjectPage` ; copie S3 async existante).

**`WorkspacePagePermission`** (nouvelle, `plane/app/permissions/page.py`) basée `WorkspaceMember` : owner de la page → tout ; page privée non-owner → refus dur (parité `_has_private_page_action_access`) ; page publique → GET pour ADMIN+MEMBER (**GUEST workspace exclu** — matrice upstream), POST/PATCH ADMIN+MEMBER, lock/access/archive/DELETE = ADMIN toutes / MEMBER les siennes. Querysets : `filter(workspace__slug, projects__isnull=True, is_global=True)` + `Q(owned_by=user) | Q(access=0)` — **ne pas** hériter du `get_base_queryset` projet (inner join `projects__…` exclut mécaniquement les pages workspace).

**Périphériques** :
- `plane/utils/page_access.py` (`can_read_page`, `readable_issue_pages`) : gérer les pages sans projet — lisible si `WorkspaceMember` actif (rôle ≥ MEMBER) et (public ou owner). Débloque l'attache d'une page wiki à un work item (module work-item-pages).
- `recent_visited_task` : accepter `project_id=None` + ajouter `workspace_page` à la whitelist `recent_visit.py` (le type front existe déjà).
- Pas de webhooks pages (aucun n'existe), pas d'activité nouvelle.

## Backend — API externe v1 (token, MCP)

Contrat = doc developers.plane.so + SDK plane-python-sdk (chemins au caractère près, slash final) :
- `GET/POST workspaces/<slug>/pages/` — list (enveloppe **paginée** standard, query `type=all|public|private|shared|archived`, `search`, `per_page` ≤100, `cursor`) + create (body : `name` requis, `description_html`, `access`, `color`, `logo_props`, `view_props`, `external_id/source` ; `shared` → traité comme vide en CE, partage Business hors périmètre).
- `GET workspaces/<slug>/pages/<page_id>/` + `DELETE` (SDK).
- `GET/POST workspaces/<slug>/projects/<project_id>/pages/` + `GET/DELETE <page_id>/` — **le CRUD v1 pages projet n'existe pas non plus en CE**, à créer (mêmes serializers).
- Pas de PATCH (non documenté upstream, aucune méthode SDK). Permissions : mêmes règles que l'interne (token = user).
- Outils MCP couverts : `create_page`, `list_pages`, `retrieve_page` (bascule workspace/projet selon `project_id`).

## apps/live (Hocuspocus)

- `TDocumentTypes` (src/types/index.ts) : + `"workspace_page"` (PAS `team_page` — EE). Fallback `AppError` conservé pour types inconnus.
- `WorkspacePageService` (nouveau, `src/services/page/workspace-page.service.ts`) : `basePath=/api/workspaces/${slug}` , throw si `!workspaceSlug` ; mêmes méthodes que `ProjectPageService` (fetch description binaire, update, formats, title).
- `getPageService` (handler.ts) : brancher `workspace_page`. `pdf-export` : accepter le type (ou le laisser projet-only V1 — trancher à l'implémentation selon le call-site web).
- **Sécurité** : le serveur fait confiance aux query params WS ; le contrôle réel = permissions Django des endpoints appelés avec le cookie forwardé → les endpoints workspace `description/` DOIVENT porter `WorkspacePagePermission` (c'est le vrai garde-fou du realtime).
- **Tests vitest** (harnais prêt, quasi rien d'existant) : handler (résolution type/erreur), WorkspacePageService (URLs, erreurs), auth (contexte workspace sans projectId).

## Web (apps/web)

- **Stores** : `EPageStoreType.WORKSPACE` ; `WorkspacePageStore` (miroir `ProjectPageStore`, keyé workspace) + classe `WorkspacePage` (bag `TBasePageServices` → nouveau `WorkspacePageService` web `/api/workspaces/:slug/pages/…`) ; enregistrement root store (**2 constructeurs**) ; `usePageStore(WORKSPACE)`.
- **Routes** : `/:workspaceSlug/wiki` (liste, réutilise `pages-list-view` paramétrée par storeType) + `/:workspaceSlug/wiki/:pageId` (détail éditeur) — chemin canonique EE attendu par les seams (command palette, power-k, `isWikiPath`). `webhookConnectionParams = { documentType: "workspace_page", workspaceSlug }`.
- **Sidebar workspace** : item « Wiki » (clé `sidebar.pages` existante ou clé wiki dédiée) dans les items statiques ; empty states wiki (assets + i18n `empty_state.wiki` livrés).
- **Nested pages web** : généraliser `PageListBlock` (fetchSubPages par storeType, plus de `useParams().projectId` obligatoire) et `handleCreateSubPage` (redirect `/wiki/:id` quand workspace) — signatures rétro-compatibles pour les pages projet.
- **Favoris** : `use-favorite-item-details` + `FAVORITE_ITEM_LINKS.page` : page sans `project_ids` → lien `/:ws/wiki/:id` (sinon liens `/projects/undefined/…` cassés).
- **i18n** : réutiliser `wiki.json`/`empty-state.json` existants (19 locales) ; ne PAS réutiliser `wiki.upgrade_flow.*` (contresens upsell) ; nouvelles clés éventuelles ×19 locales.

## Tests
- **pytest (Docker)** : CRUD workspace pages + permissions (guest exclu, private owner-only, member-own/admin-all), invariant conteneur (parent cross-conteneur → 400), sous-pages + cascade archive scoped, favoris/lock/access/versions/duplicate, description binaire GET/PATCH, v1 (2 scopes : list paginée + filtres type/search, create, get, delete, isolation cross-workspace 404), listes projet inchangées, `can_read_page` wiki + work-item-pages, non-régression suites pages existantes.
- **vitest (apps/live)** : handler/service/auth workspace_page.

## Hors V1
Collections, Wiki Home, publication de pages (space), partage Business, move inter-conteneurs, PATCH v1, webhooks pages, PDF export wiki (si call-site absent).
