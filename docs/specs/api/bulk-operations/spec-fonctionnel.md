# Spec Fonctionnelle — Bulk operations [PLAN]

| Champ   | Valeur              |
|---------|---------------------|
| Module  | api/bulk-operations |
| Version | 0.1.0               |
| Date    | 2026-07-11          |
| Statut  | PLAN — à valider    |
| Source  | Cadrage 2026-07-11 (3 agents : backend/web/fonctionnel — docs.plane.so/bulk-ops, matrice plans, code CE) |

> ⚠️ Garde ADR-001 bypassée (décision dev). Réimplémentation CE (AGPL, sans code plane-ee) des **Bulk operations** (feature Pro : *« edit properties of several work items at once »*). Réutilise `Issue`/`IssueAssignee`/`IssueLabel`/`CycleIssue`/`ModuleIssue`/`IssueActivity` — **zéro migration**.

---

## Contexte

- **L'infra de sélection multiple est déjà 100% construite en CE** (`store/multiple_select.store.ts`, `hooks/use-multiple-select.ts`) : checkbox par ligne, select-all groupe (empty/partial/complete), shift-click plage, Shift+flèches. Câblée dans les layouts **List** et **Spreadsheet**. Elle est seulement **bridée** par `useBulkOperationStatus() → false` (dur, `core/hooks/use-bulk-operation-status.ts`).
- Le stub `ce/components/issues/bulk-operations/root.tsx` ne rend qu'une **bannière d'upgrade**.
- Le service front `issue.service.ts#bulkOperations` appelle déjà `POST /bulk-operation-issues/` avec `TBulkOperationsPayload = {issue_ids, properties}` — mais **l'endpoint backend n'existe pas en CE** (c'est le manque central).

## Fonctionnel V1

1. **Activer la sélection** : lever le gate → la multi-sélection (déjà codée) devient active dans **List + Spreadsheet** ; sur les layouts epic, elle reste désactivée (comportement existant `isEpic`).
2. **Toolbar d'action** (remplace la bannière) : barre sticky en bas quand ≥1 work item est sélectionné → **compteur** de sélection + dropdowns d'édition + **bouton « Update »** + actions **Archive** / **Delete** + **clear**.
3. **Édition de propriétés en masse** (décision dev 2026-07-11 : **scalaires = SET**, **multi-valeurs = ADD/append** — sémantique native de Plane, révélée par le store optimiste upstream `uniq([...old, ...new])`) : l'utilisateur choisit des valeurs qui s'accumulent localement (rien n'est envoyé avant « Update »). Au clic, un seul appel applique les propriétés **présentes** à tous les work items sélectionnés :
   - Scalaires : `state`, `priority`, `start_date`, `target_date`, `cycle`, `estimate point` → **remplacent** la valeur existante.
   - Multi-valeurs (`assignés`, `labels`, `modules`) → **s'ajoutent** à l'ensemble existant (append dédupliqué) ; une liste vide est un no-op (ne vide pas).
   - Champs **absents** du payload = inchangés.
4. **Champs V1** : tous ceux de `TBulkIssueProperties` (state, priority, assignés, labels, start/target date, cycle, module, estimate point), **chacun gaté par la dispo projet** (estimate si activé, cycle/module si leur vue est activée).
5. **Archive / Delete en masse** : réutilisent les endpoints CE existants (`bulk-archive-issues/`, `bulk-delete-issues/`). Delete garde une confirmation (irréversible) ; archive valide déjà que l'état est completed/cancelled.
6. **API externe v1 + MCP** : nouvel endpoint token `POST /api/v1/.../bulk-issues/` (mêmes payload/validations) pour qu'un agent MCP puisse éditer N work items en une requête (le MCP officiel wrappe `/api/v1/`).
7. **Activité / realtime** : chaque work item modifié émet son activité (`issue_activity.delay` par item, comme bulk-archive) → fil d'activité, notifications et temps réel reflètent les changements de masse.

## Permissions (rôles projet)

| Action | Rôle |
|---|---|
| Édition de propriétés en masse (interne + v1) | **ADMIN + MEMBER** (parité édition unitaire / bulk-archive) ; Guest exclu |
| Archive en masse | ADMIN + MEMBER (existant) |
| Delete en masse | ADMIN (existant) |

## Validation (échoue fermé, atomique — tout le lot rejeté si invalide, comme bulk-archive)

- Tous les `issue_ids` appartiennent au projet (sinon 400).
- `state_id` appartient au projet ; `priority` dans l'ensemble autorisé ; `assignee_ids` = membres actifs du projet ; `label_ids` = labels du projet ; `module_ids`/`cycle_id` = du projet ; `estimate_point` = de l'estimation active du projet (si estimate activé).
- Cohérence dates : si `start_date` et `target_date` fournis, `start ≤ target` ; si un seul fourni, validé par-item contre la valeur existante (clé i18n `invalid_issue_start_date` / `invalid_issue_target_date`).
- Payload vide (`properties` sans clé) ou `issue_ids` vide → 400.

## Hors V1

- Sémantique **SET / remplacement** et **REMOVE** pour les champs multi-valeurs (V1 = ADD/append) — évolution future (permettrait de vider/retirer en masse).
- **Bulk-subscribe** (`bulk-subscribe-issues/`, référencé par le front, absent CE) — hors périmètre V1 (petit add-on possible ultérieurement).
- Bulk **cross-projet** (workspace) — les endpoints sont scoping `/projects/<id>/` ; V1 = intra-projet (la sélection multiple est déjà par projet).
- Bulk sur layouts **Board/Calendar/Gantt** — V1 = List + Spreadsheet (seuls câblés).
- Exposition v1 des **archive/delete** en masse — V1 v1 = édition de propriétés seulement (archive/delete restent interne app).
- **Undo** — aucun (la doc Plane indique la suppression irréversible).

## Dépendances

| Dépendance | État |
|------------|------|
| Modèles `Issue`/`IssueAssignee`/`IssueLabel`/`CycleIssue`/`ModuleIssue`/`IssueActivity` | ✅ existants, non modifiés |
| Infra sélection multiple web (`multiple_select.store`, `use-multiple-select`) | ✅ existante, réutilisée |
| `issue_activity` (tâche Celery, ACTIVITY_MAPPER) | ✅ existante, réutilisée |

## Critères d'acceptation

- `POST /bulk-operation-issues/` applique les propriétés présentes (scalaires SET, M2M ADD) à N work items (≤100), en transaction, avec activité par item dispatchée sur commit ; validations serveur → 400 (état/membre/label/module/cycle/estimate hors projet, dates incohérentes, lot vide/hors borne, payload malformé).
- Isolation projet stricte (un `issue_id` d'un autre projet → 400, aucune fuite) ; permissions ADMIN+MEMBER imposées (guest/viewer → 403).
- v1 token : même contrat, testé avec APIToken réel dans Docker ; aligne un futur outil MCP bulk.
- Web : gate levé, toolbar fonctionnelle (compteur, dropdowns gatés par features projet, Update, archive/delete, clear) dans List + Spreadsheet ; `check:types` EXIT=0 ; i18n complète.
- Tests pytest exécutés dans Docker (`makemigrations --check` = « No changes detected »).
