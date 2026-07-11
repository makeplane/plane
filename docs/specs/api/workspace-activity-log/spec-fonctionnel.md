# Spec Fonctionnelle — Workspace Activity Log [PLAN]

| Champ   | Valeur                    |
|---------|---------------------------|
| Module  | api/workspace-activity-log |
| Version | 0.1.0                     |
| Date    | 2026-07-11                |
| Statut  | PLAN — à valider          |
| Source  | Cadrage 2026-07-11 (3 agents : backend/web/fonctionnel — matrice plans, doc plane.so, code CE exhaustif) |

> ⚠️ Garde ADR-001 bypassée (décision dev). Réimplémentation CE (AGPL, sans code plane-ee) de la feature **« Workspace Activity Logs »** (plan Business — matrice `plans.tsx:740` : *« See filterable activity logs for your entire workspace »*). Source de données = `IssueActivity` existant — **zéro migration**.

## ADRs

*Aucun ADR lié.*

> *Table auto-générée par adr-linker. Ne pas éditer manuellement.*

---

## Contexte

- Deux définitions divergent upstream : la matrice des plans CE décrit un **feed d'activité filtrable de tout le workspace** ; la doc members décrit un audit de gestion des membres (invitation/rôle/retrait). **Périmètre retenu (décision dev 2026-07-11) : le feed workspace filtrable**, le plus utile au quotidien (piloter l'équipe) et aligné avec le stub CE (`MembersActivityButton`, `mutateWorkspaceMembersActivity`). L'audit membres (nouveau modèle + signals) = module futur séparé.
- Tout le câblage CE existe : stub `ce/components/workspace/members/members-activity-button.tsx` (rend `<></>`), store no-op `mutateWorkspaceMembersActivity`, composants d'activité réutilisables (`profile/activity/*`, `common/activity/*`), service `userService.getUserProfileActivity` (endpoint per-user).
- Backend existant : `IssueActivity` (~30 types d'événements work items, produits par la tâche Celery `issue_activity()`), `WorkspaceUserActivityEndpoint` (interne, per-user, cross-projet), export CSV per-user, graphe self-only. **Aucune exposition v1/token au niveau workspace** (seul l'endpoint per-work-item existe en v1).

## Fonctionnel V1

1. **Bouton « Activity »** dans la barre d'actions de Settings → Members (remplace le stub `MembersActivityButton`), visible pour Admin + Member du workspace (pas Guest).
2. **Drawer « Workspace activity »** : liste chronologique (plus récent d'abord) des activités de work items de tout le workspace — chaque entrée = avatar + acteur + message d'action (mêmes rendus que l'activité du profil : créé/modifié tel champ, ancienne→nouvelle valeur) + lien vers le work item + horodatage relatif.
3. **Filtres** :
   - **Membre** : « All members » (défaut) ou un membre précis ;
   - **Projet** : tous (défaut) ou un/des projets ;
   - **Période** : présets Today / Last 7 days / Last 30 days / All time (défaut : Last 30 days).
4. **Pagination** : « Load more » par cursor (même pattern que l'activité du profil).
5. **Feed multi-membres** : nouvel endpoint interne `GET /api/workspaces/<slug>/activity/` (acteur optionnel — le per-user existant ne couvre qu'un membre figé dans l'URL).
6. **Filtre de dates sur le per-user existant** : `start_date`/`end_date` ajoutés à `WorkspaceUserActivityEndpoint` (additif, rétro-compatible) — la page profil pourra en bénéficier.
7. **API externe v1 + MCP** : `GET /api/v1/workspaces/<slug>/activities/` (token) avec les mêmes filtres, serializer v1 (`fields`/`expand`) — permet à un agent MCP de répondre « qu'a fait X cette semaine ? ».
8. **Store réel** : `mutateWorkspaceMembersActivity` revalide les données d'activité (SWR mutate), scoped au workspace courant.

## Permissions

| Action | Règle serveur |
|---|---|
| Lire le feed (interne + v1) | Tout **membre actif** du workspace (`WorkspaceEntityPermission` GET) |
| Portée des données | **Bornée aux projets où le demandeur est membre actif** (projets non archivés) — pattern de sécurité du per-user existant, aucune fuite cross-projet |
| Bouton UI | Admin + Member (`allowPermissions`) — cohérent avec la page Members |

> Un guest workspace qui atteindrait l'endpoint ne voit que l'activité des projets où il est membre — cohérent avec l'existant (`WorkspaceUserActivityEndpoint` est déjà ouvert à tout membre actif).

## Hors V1

- Audit de gestion des membres (invited/accepted/role_changed/removed) — nécessite un modèle `WorkspaceMemberActivity` + signals → module futur.
- Export CSV du feed workspace (l'export per-user + date exacte existe déjà ; un export du feed filtré = extension ultérieure).
- Graphe/heatmap par membre arbitraire (l'endpoint graphe existant est self-only ; la doc ne le mentionne pas pour cette feature).
- Inclusion des activités `comment`/`vote`/`reaction`/`draft` (exclues par tous les feeds existants — on garde la cohérence).
- Tri autre que `created_at`/`updated_at` (allowlist existante).

## Dépendances

| Dépendance | Spec | État |
|------------|------|------|
| Modèle `IssueActivity` + tâche Celery `issue_activity()` | RETRO (issues) | ✅ existant, non modifié |
| Composants web d'activité (profil) | — | ✅ existants, réutilisés |

## Critères d'acceptation

- Feed workspace opérationnel (interne) : multi-membres, filtres actor/project/start_date/end_date fonctionnels et **validés serveur** (dates invalides → 400), pagination cursor, tri sanitizé.
- **Aucune fuite** : un membre ne voit jamais l'activité d'un projet dont il n'est pas membre actif (testé), isolation cross-workspace stricte.
- `start_date`/`end_date` opérants sur le per-user existant sans régression (mêmes réponses qu'avant sans les params).
- v1 token : mêmes filtres + `fields`/`expand`, enveloppe paginée v1, testé avec APIToken réel dans Docker.
- Web : bouton visible Admin+Member, drawer avec les 3 filtres + load more, store `mutateWorkspaceMembersActivity` réel, i18n complète (les 19 locales via workflow translate).
- Tests pytest exécutés dans Docker (`makemigrations --check` = « No changes detected » — zéro migration).
