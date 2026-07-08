# Spec Fonctionnelle — Epics [PLAN]

| Champ   | Valeur     |
|---------|------------|
| Module  | api/epics  |
| Version | 0.1.0      |
| Date    | 2026-07-08 |
| Statut  | PLAN — à valider |
| Source  | Cadrage 2026-07-08 (doc Plane + blog migration mai 2026 + code CE) |

> ⚠️ Garde ADR-001 bypassée (décision dev). Réimplémentation CE (AGPL, sans code plane-ee) des **Epics** (feature Pro). Design cible = celui que les seams du fork v1.3.1 attendent (section Epics dédiée par projet, ère EE 1.x), avec les invariants du modèle moderne (epic = work item type `is_epic`).

---

## Contexte

- Upstream a migré (mai 2026, v3 Commercial only) : « Epic is now a work item type ». Notre fork v1.3.1 porte les seams du design **précédent** : services front qui génèrent des URLs `/epics/…` dès que `serviceType=EPICS`, stores `projectEpics`/`epicDetail` déjà instanciés (dummies), page détail `/browse/:workItem` qui route déjà vers EPICS si `is_epic`, liens `/projects/:id/epics` déjà émis à 5+ endroits (aujourd'hui → 404).
- Le module `api/work-item-types` (mergé) fournit déjà : type « Epic » seedé (`is_epic=True`, immuable, jamais défaut) à l'activation `/issue-types/enable/`, toggle projet `is_issue_type_enabled` (irréversible), `getProjectEpicId` côté web.
- Un epic EST une `Issue` dont `type.is_epic=True` — pas de nouveau modèle, **aucune migration**.

## Fonctionnel V1

1. **Section Epics du projet** : nouvelle entrée sidebar « Epics » (visible si `is_issue_type_enabled` ET type epic présent) → page `/projects/:projectId/epics` listant les epics du projet (layouts standard des work items ; liste au minimum, spreadsheet/kanban si gratuits via la réutilisation des stores).
2. **Création/édition** : modal epic dédiée (`CreateUpdateEpicModal`) — mêmes champs qu'un work item (name, description, state, priority, dates, assignees, labels), **type forcé au type epic du projet**, pas de sélection de parent. Boutons « + » des headers de groupes (list/kanban) déjà branchés.
3. **Détail d'un epic** : page `/browse/:workItem` existante (peek inclus) — description, propriétés, commentaires+réactions, liens, activité, sous-items : liste des **enfants** (work items dont `parent` = epic) avec **répartition par state group** (progress), ajout/retrait d'enfants.
4. **Hiérarchie (invariants)** : un epic n'a **pas de parent** ; les enfants d'un epic sont des work items **non-epic** du **même projet** ; pas d'epic dans un epic. Un work item affiche son epic parent (breadcrumb/sidebar existants).
5. **Cycles/modules** : un epic ne peut **pas** être ajouté à un cycle ni à un module (sémantique 1.x ; évite le double comptage des burndowns).
6. **Listes standards** : les epics n'apparaissent **plus** dans les listes de work items du projet (list/kanban/spreadsheet/vues internes) — ils vivent dans leur section. (L'API externe v1 reste inchangée : les epics y restent visibles comme tout work item, parité upstream moderne + non-breaking.)
7. **Suppression** : possible (palette et quick-actions déjà câblés). **Archivage d'un epic : hors V1** (bloqué avec message clair — l'écran d'archives CE les exclut ; l'incohérence actuelle « archivable mais invisible » est corrigée par le blocage).

## Permissions (matrice work items — pas de règle epic dédiée upstream)

| Action | Rôles |
|---|---|
| Créer un epic | Admin + Member (pas Guest) |
| Éditer | Admin (tous), Member (règles work item standard) |
| Supprimer | Admin (tous), auteur sinon (standard) |
| Rattacher/retirer des enfants | Admin + Member |
| Activer la feature | via work-item-types (Project Admin, irréversible) |

## Hors V1
- Archives d'epics (écran + désarchivage), analytics epics (enums présents mais orphelins), epics dans cycles/modules (interdit V1), endpoints externes v1 `/epics/` dédiés (les outils MCP passent par les work items standards ; PQL `childOf`/`type=` non supporté par la v1 CE — limitation documentée), custom properties sur les epics (dépend du croisement avec work-item-properties — à cadrer séparément), initiatives.

## Dépendances
| Dépendance | Spec | État |
|------------|------|------|
| api/work-item-types | docs/specs/api/work-item-types/ | ✅ mergé (type Epic seedé, `is_epic` immuable) |
| api/issues | docs/specs/api/issues/ | ✅ |

## Critères d'acceptation
- Endpoints internes `/epics/…` opérationnels pour tout ce que les services front appellent en V1 (CRUD, enfants + state_distribution, liens, commentaires, réactions, activité).
- Les invariants hiérarchie/cycles/modules/archive sont **imposés côté serveur** (pas seulement UI) et testés.
- Les epics disparaissent des listes internes standards ; un epic créé apparaît dans la section Epics ; ses enfants et sa progress s'affichent sur sa page détail.
- Sidebar, routes `/epics`, modal, empty states fonctionnels ; liens morts existants réparés.
- Isolation projet/workspace stricte (404 cross-projet) ; tests pytest exécutés dans Docker.
