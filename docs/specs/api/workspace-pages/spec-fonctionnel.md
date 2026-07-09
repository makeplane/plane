# Spec Fonctionnelle — Wiki workspace pages [PLAN]

| Champ   | Valeur              |
|---------|---------------------|
| Module  | api/workspace-pages |
| Version | 0.1.0               |
| Date    | 2026-07-09          |
| Statut  | PLAN — à valider    |
| Source  | Cadrage 2026-07-09 (doc Plane + pricing + API développeurs + SDK/MCP + code CE exhaustif) |

> ⚠️ Garde ADR-001 bypassée (décision dev). Réimplémentation CE (AGPL, sans code plane-ee) du **Wiki workspace** (feature Pro) + complétion des nested pages au niveau workspace. Une page workspace = `Page` avec `is_global=True` et **aucune ligne `ProjectPage`** — zéro migration.

---

## Contexte

- Les project pages sont CE (mergées : module pages-nested = sous-pages, anti-cycle, `sub_pages_data`). Le **Wiki workspace** (Pro upstream) n'a **aucune vue/URL Django CE**, mais tout le reste est prêt : modèle `Page` workspace-first (`workspace` FK directe, `projects` M2M optionnelle, `is_global` dormant), types front (`documentType: "workspace_page"` déjà dans l'union), i18n `wiki.json` + assets empty-state livrés dans les 19 locales, seams de chemin `/:ws/wiki/:pageId` déjà codés (command palette, power-k, `isWikiPath`).
- Le serveur live (Hocuspocus) ne gère que `project_page` ; `getPageService` est le switch à étendre ; `extended.service.ts` est un seam EE explicite (« Implementation found in the enterprise repository »).

## Fonctionnel V1

1. **Section Wiki** : entrée « Wiki » dans la sidebar workspace → page `/:workspaceSlug/wiki` listant les pages workspace en sections **Public / Private / Archived** (mêmes vues que la liste project pages, storeType workspace), recherche/tri existants.
2. **CRUD** : création (« New page »), édition collaborative temps réel (multi-curseurs via live), renommage, duplication, suppression. Toutes les capacités des project pages : **favoris, archivage/désarchivage, verrouillage, access public/private, historique de versions, sous-pages imbriquées** (arbre latéral, breadcrumbs existants de l'éditeur).
3. **Nested pages complet** : sous-pages au niveau workspace (création via « + » et `/page` dans l'éditeur), archivage cascade, `sub_pages_data` versionné — **invariant conteneur** : une sous-page vit dans le même conteneur que son parent (jamais de mixte wiki↔projet).
4. **Access levels** (parité project pages) : Public = visible de tous les membres du workspace ; Private = visible du seul créateur. Guests workspace : **aucun accès au Wiki** (matrice upstream).
5. **API externe v1 + MCP** : endpoints documentés upstream fournis en CE — list/create/get (+ delete, SDK) au scope **workspace** ET au scope **projet** (les outils MCP `create_page`/`list_pages`/`retrieve_page` basculent selon `project_id` ; aujourd'hui la v1 CE n'a AUCUN CRUD pages).
6. **Recents** : les visites de pages wiki alimentent l'activité récente (`workspace_page` attendu par le front).

## Permissions (matrice upstream, rôles workspace Owner/Admin=20, Member=15, Guest=5)

| Action | Rôles |
|---|---|
| Voir une page publique / lister | Admin + Member (Guest : **exclu du wiki**) |
| Voir une page privée | Créateur uniquement |
| Créer / éditer | Admin + Member |
| Lock, access, archive, delete | Admin (toutes) ; Member (les **siennes**) |
| Duplication | Comme la lecture + création |

## Hors V1
- Collections + Wiki Home (Recents/Stickies dédiés) — les clés i18n `wiki_collections.*` existent mais c'est un chantier UI séparé.
- Publication publique des pages (DeployBoard type "page" dormant, aucun flux CE — module futur).
- Partage sélectif de pages privées can view/comment/edit (Business).
- Move inter-conteneurs projet↔wiki (`moved_to_page`/`moved_to_project` dormants).
- PATCH/update sur l'API externe v1 (non documenté upstream, aucune méthode SDK).

## Bug préexistant découvert (traité hors module, branche `fix/`)
- La recherche workspace (`filter_pages`) ne filtre ni `access` ni `owned_by` : les **titres des pages privées fuient** vers les autres membres du projet. Correctif sur branche `fix/search-private-pages-leak` + PR séparée.

## Dépendances
| Dépendance | Spec | État |
|------------|------|------|
| api/pages (+pages-nested) | docs/specs/api/pages/, api/pages-nested/ | ✅ mergés |
| live/realtime-collaboration | docs/specs/live/realtime-collaboration/ (RETRO-071) | ✅ (à étendre) |

## Critères d'acceptation
- CRUD + sous-pages + favoris + archive + lock + access + versions + duplicate opérationnels au niveau workspace (API interne), avec permissions ci-dessus **imposées serveur** et testées (guest exclu, private=owner-only, member-own vs admin-all).
- Éditeur collaboratif fonctionnel sur une page wiki (live `workspace_page` : auth, fetch, store, title sync) — tests vitest handler/service.
- Invariant conteneur imposé serveur (parent wiki ↛ page projet et inversement) ; cascade archive ne traverse jamais la frontière.
- API externe v1 alignée doc/SDK (list paginé type/search/cursor, create, get, delete — 2 scopes) ; outils MCP pages opérants sur l'instance.
- Sidebar Wiki, routes `/wiki`, favoris de pages workspace avec liens corrects ; listes projet inchangées (aucune page wiki n'y apparaît, et réciproquement).
- Isolation workspace stricte (404 cross-workspace) ; tests pytest exécutés dans Docker.
