# Spec Technique — Epics

| Champ   | Valeur     |
|---------|------------|
| Module  | api/epics  |
| Version | 0.1.0      |
| Date    | 2026-07-08 |
| Statut  | PLAN — à valider |
| Source  | Cadrage 2026-07-08 (code CE exhaustif + doc/blog upstream + SDK/MCP publics) |

> ⚠️ Garde ADR-001 bypassée (décision dev). Epic = `Issue` avec `type.is_epic=True` — **aucun nouveau modèle, aucune migration** (sauf si un guard DB s'avère nécessaire ; leaf actuel sur cette branche : `0124_issue_properties` — ⚠️ la PR #15 non mergée porte `0125`/`0126`).

---

## Architecture — réutilisation maximale

Les services front interpolent `${serviceType}` dans leurs URLs (`issue.service.ts:47-50, 262-332`, `issue_activity/comment/reaction/attachment/archive.service.ts`) : quand `serviceType=EPICS`, ils appellent des chemins internes `/api/workspaces/:ws/projects/:pid/epics/…` qui n'existent pas en CE. Le backend V1 = **fournir ces routes** en réutilisant les viewsets issues existants (sous-classes/mixins filtrés `type__is_epic=True`), PAS de nouveau modèle.

### Endpoints internes à fournir (app, session) — exactement les chemins générés par les services front
Vérifier chaque chemin dans les services au moment de l'implémentation (la source de vérité est le front) :
- `GET/POST workspaces/:slug/projects/:project_id/epics/` — liste (mêmes annotations que `IssueViewSet.get_queryset` filtrées `type__is_epic=True`) / création (type forcé au type epic du projet, `parent=None` imposé).
- `GET/PATCH/DELETE .../epics/:pk/` (+ variante détail enrichie si le front appelle `epics-detail/` ou `v2/epics/` — à confirmer sur `issue.service.ts:47-50,71,119-122`).
- `GET/POST .../epics/:epic_id/issues/` — enfants : GET = miroir de `SubIssuesEndpoint` (annotations complètes + `state_distribution` par state group, `sub_issue.py:37-202`) filtré `parent_id=epic` ; POST = rattachement en masse `issue_ids` (miroir `sub_issue.py:205-250`) avec **guards** : enfants non-epic, même projet, epic cible bien epic.
- `GET/POST .../epics/:epic_id/links/` + `PATCH/DELETE .../links/:pk/` — miroir issue links.
- `GET/POST .../epics/:epic_id/comments/` + `PATCH/DELETE` + réactions de commentaires — miroir issue comments (`epic-comment` activité).
- `GET .../epics/:epic_id/history/` — miroir issue activity.
- Réactions epic : `.../epics/:epic_id/reactions/` (+ DELETE) — miroir issue reactions.
- Attachments v2 : `.../epics/:epic_id/attachments/` — miroir assets issue (si le détail V1 en a besoin — vérifier le call-site).
- **Archive : PAS de route epics** (hors V1) + guard anti-archivage d'epic sur la route standard.

Implémentation recommandée : paramétrer les viewsets existants (attribut de classe ou kwarg d'URL `is_epic=True`) plutôt que dupliquer la logique ; toute la logique commune reste dans les classes issues. Le create/patch force `type_id` (type epic du projet) et ignore `parent` du payload.

### Guards transverses (imposés serveur, les deux surfaces quand applicable)
1. **Exclusion des listes standards internes** : `IssueViewSet.get_queryset`, `IssueListEndpoint`, `IssuePaginatedViewSet`, vues workspace — ajouter `.filter(Q(type__isnull=True) | Q(type__is_epic=False))` (pattern existant `archive.py:99`). ⚠️ NE PAS toucher `IssueManager.issue_objects` (le détail/browse d'un epic doit continuer de fonctionner) ni l'API externe v1 (non-breaking, parité upstream moderne).
2. **Hiérarchie** : au create/update d'une issue standard : `parent` ne peut être qu'un work item du même projet, et si le parent est un epic c'est permis ; une issue de type epic ne peut pas recevoir de `parent` (strippé/400) ; un epic ne peut pas être passé en `sub_issue_ids` de `SubIssuesEndpoint.post` (400) ; le POST `/epics/:id/issues/` refuse les enfants epic (400).
3. **Cycles/modules** : `CycleIssue`/`ModuleIssue` (vues d'ajout) refusent les issues `type__is_epic=True` (400, message clair).
4. **Archive** : `IssueArchiveViewSet.archive` + `BulkArchiveIssuesEndpoint` refusent les epics (400) — corrige l'orphelinage actuel (archivable mais exclu de la liste `archive.py:99`).
5. **Suppression du type Epic** : déjà protégé par work-item-types ? Vérifier qu'on ne peut pas supprimer/désactiver le type epic quand des epics existent (sinon guard).
6. `is_epic` **writable au POST /issue-types/** (les deux surfaces) : verrouiller — le seul type epic est celui du seeding (strip `is_epic` du payload de création, pattern des guards PATCH existants `issue_type/base.py:84`) — évite N types epic par projet.

### API externe v1 / MCP
- **Aucun endpoint v1 `/epics/` en V1** (les routes documentées upstream sont cloud/EE). Les outils MCP manipulent les epics via les endpoints work items standards : `create_work_item(type_id=<epic>)` fonctionne déjà ; `resolve_work_item_type` (module types) fonctionne ; `list_work_items` v1 **inclut** les epics (inchangé). Limitation documentée : PQL `type=`/`childOf()` non supporté par la v1 CE (le parsing PQL n'existe pas dans ce codebase — `grep pql = 0`).
- Ajouter `is_epic` (lecture) au serializer v1 des issues si absent du détail (déjà présent sur `RelatedIssueSerializer` v1) — utile aux clients pour distinguer.

## Web (apps/web)

- **Stores** : remplacer les dummies `ce/store/issue/epic/{issue,filter}.store.ts` par des implémentations réelles : `ProjectEpics extends ProjectIssues` avec `serviceType=EPICS` propagé aux services (vérifier comment `BaseIssuesStore` choisit ses services) ; clé de persistance des filtres distincte de celle des issues projet (piège relevé au cadrage).
- **Routes** : `projects/:projectId/epics` (liste, layouts réutilisés avec `EIssuesStoreType.EPIC`) dans `app/routes/extended.ts` (ou core) ; le détail réutilise `/browse/:workItem` existant (redirection des liens `/epics/:epicId` si nécessaire — convention param `epicId` vs query à trancher à l'implémentation).
- **Sidebar** : entrée « Epics » via le seam `additionalNavigationItems` de `ce/components/.../project-navigation-root.tsx` (clé `epics` déjà testée par `isActive`), gated `is_issue_type_enabled && getProjectEpicId`.
- **Modal** : `CreateUpdateEpicModal` réelle (`ce/components/epics/epic-modal/modal.tsx`, interface `EpicModalProps` existante) — formulaire issue simplifié, `type_id` forcé, pas de parent picker ; réutiliser le form issue existant si le fallback `base.tsx:56-59` (EPIC→PROJECT store) peut être levé proprement, sinon form dédié léger.
- **Empty state** : `ProjectEpicsEmptyState` (core, actuellement `<></>`) — assets `empty-state/epics/*.webp` et i18n (`empty-state.json epics.*`) déjà livrés.
- **i18n** : quasi tout existe (`sidebar.epics`, `common.epic(s)`, blocs `epics`/`epic_work_items`, `work-item.json epic.*`) — n'ajouter que le manquant, dans les 19 locales.
- **Pièges connus** : fallback modal `base.tsx:56-59` ; sélecteur de types du modal issue filtre `is_epic` (`issue-type-select.tsx:64`) — ne pas casser ; `useWorkItemProperties` no-op appelé avec EPICS (lien module properties : hors V1) ; enums analytics EPICS orphelins (hors V1).

## Tests (pytest, Docker)
- CRUD epics internes (+ type forcé, parent strippé) ; liste epics = seulement des epics ; listes standards = plus d'epics.
- Enfants : GET state_distribution correcte ; POST rattachement (guards enfant-epic→400, cross-projet→404/400, epic-cible-non-epic→404).
- Guards : epic dans cycle→400, module→400, archive epic→400, `parent` sur epic→strippé/400, epic en sub_issue→400, `is_epic` au POST /issue-types→strippé (2 surfaces).
- Permissions (guest ne crée pas ; member crée ; règles standard) ; isolation cross-projet/workspace.
- Non-régression : v1 list_work_items contient toujours les epics ; création v1 avec type_id epic OK.

## Hors V1
Archives epics, analytics epics, v1 `/epics/` dédiés, PQL, custom properties sur epics, initiatives, epics dans cycles/modules.
