# Spec Fonctionnelle — api/issues [DRAFT — à valider par le dev]

| Champ      | Valeur              |
|------------|---------------------|
| Module     | api/issues          |
| Version    | 0.1.0               |
| Date       | 2026-06-30          |
| Auteur     | retro-documenter    |
| Statut     | DRAFT               |
| Source     | Rétro-ingénierie    |

> **[DRAFT — à valider par le dev]** Cette spec a été générée par rétro-ingénierie
> à partir du code existant. Elle doit être relue et validée par un développeur
> qui connaît le contexte métier.

---

## ADRs

| ADR | Titre | Catégorie | Statut |
|-----|-------|-----------|--------|
| [RETRO-031](../../../adr/RETRO-031-triple-format-description-storage.md) | Stockage triple format JSON+HTML+Binary pour les descriptions riches | DATA-MODEL | Documenté (rétro) |
| [RETRO-032](../../../adr/RETRO-032-soft-delete-uuid-conditional-uniqueness.md) | Soft delete UUID-based avec UniqueConstraint conditionnel | DB-STRATEGY | Documenté (rétro) |

---

## Contexte et objectif

Les issues (work items) constituent l'entité centrale de Plane. Toute la plateforme est organisée autour d'elles : les cycles les regroupent temporellement, les modules les regroupent thématiquement, les vues les filtrent, les notifications les observent, et les analytiques les mesurent.

Une issue représente une unité de travail traçable, appartenant à un projet lui-même rattaché à un workspace. Elle dispose d'un cycle de vie complet (état, priorité, assignation, dates), d'une description riche collaborative, d'un historique immutable de toutes les modifications, et de plusieurs types de relations avec d'autres issues.

## Règles métier (déduites du code)

1. **Appartenance hiérarchique** : une issue appartient obligatoirement à un projet et, via celui-ci, à un workspace. Elle peut avoir un parent (sous-issue) via une auto-référence.

2. **Séquence human-readable par projet** : chaque issue reçoit à la création un `sequence_id` entier croissant par projet (ex : `PRJ-42`). Ce numéro est garanti unique au niveau du projet via un advisory lock PostgreSQL. La table `IssueSequence` conserve la séquence même après suppression de l'issue pour éviter la réutilisation de numéros.

3. **État obligatoire** : si aucun état n'est fourni à la création, le système assigne automatiquement l'état par défaut du projet (marqué `default=True`). Les issues en état de groupe `TRIAGE` sont exclues du manager standard (`IssueManager`) — elles ne sont visibles que depuis l'intake.

4. **completed_at synchronisé** : le champ `completed_at` est automatiquement renseigné (ou effacé) à chaque sauvegarde lorsque l'état passe dans (ou sort du) groupe `COMPLETED`, via le `ChangeTrackerMixin` qui suit `state_id`.

5. **Priorités** : 5 niveaux — `urgent`, `high`, `medium`, `low`, `none` (défaut). Stockés en string.

6. **Modes d'affichage** : une issue peut être dans trois états orthogonaux — active, archivée (`archived_at` non null) ou brouillon (`is_draft=True`). Le manager `IssueManager` exclut systématiquement les archivées, les brouillons, les issues dont le projet est archivé, et celles en état TRIAGE.

7. **Soft delete préservant les relations** : la suppression est soft (`deleted_at = now()`). Les contraintes d'unicité conditionnelles sur les tables de relations (IssueAssignee, IssueRelation, IssueSubscriber, etc.) permettent de recréer une relation sur une issue non supprimée même si elle existait sur une version supprimée.

8. **Contrôle d'accès GUEST** : les membres avec le rôle GUEST (niveau 5) ne voient que leurs propres issues si `project.guest_view_all_features` est `False`. Ils peuvent créer des commentaires uniquement sur les issues dont ils sont créateurs dans ce cas.

9. **Description riche multi-format** : la description est stockée simultanément en JSON ProseMirror (`description_json`), HTML (`description_html`), binaire Y.js (`description_binary`) et texte brut (`description_stripped`). Les quatre champs doivent rester cohérents.

10. **Versioning de la description** : à chaque mise à jour de la description, une tâche Celery (`issue_description_version_task`) crée ou met à jour une version dans `IssueDescriptionVersion`. Si le même utilisateur modifie dans les 10 minutes suivantes, la version existante est mise à jour plutôt qu'une nouvelle créée.

11. **Versioning des métadonnées** : de façon similaire, `IssueVersion` capture un snapshot complet des métadonnées de l'issue (état, priorité, assignees, labels, cycle, modules) à chaque modification. Même règle de déduplication 10 minutes / même auteur.

12. **Relations bidirectionnelles** : les relations entre issues (`blocked_by`, `relates_to`, `duplicate`, `start_before`, `finish_before`, `implemented_by`) sont stockées de façon unidirectionnelle en base. L'API expose les deux directions calculées au moment de la lecture (blocking = issue B qui a `blocked_by` → issue A). Les relations `duplicate` et `relates_to` sont symétriques.

13. **Activité immutable** : toute modification d'une issue (état, priorité, assignees, labels, dates, description, relations, commentaires) génère une entrée `IssueActivity` via Celery. La relation `IssueActivity.issue` est `on_delete=DO_NOTHING` pour préserver les activités même après suppression de l'issue.

14. **Portée des relations cross-project** : lors de la création d'une relation, les issues cibles sont validées uniquement au niveau du workspace (pas du projet). Les relations peuvent donc être cross-projet.

15. **Commentaires hiérarchiques** : les commentaires peuvent avoir un parent (`IssueComment.parent`). Ils supportent `access` (INTERNAL / EXTERNAL) et `external_source` pour les commentaires issus d'intake.

16. **Validation des dates** : lors d'une mise à jour bulk de dates, `start_date` ne peut pas être postérieure à `target_date`.

17. **Tri et ordonnancement** : chaque issue possède un `sort_order` (float, défaut 65535, incrément +10000 à la création). Cela permet un glisser-déposer sans renumérotation complète.

## Cas d'usage (déduits)

### CU-001 — Créer une issue

**Acteur** : ADMIN ou MEMBER  
**Flux principal** :
1. L'utilisateur soumet `name`, optionnellement `description_html`/`description_json`/`description_binary`, `priority`, `state_id`, `assignees`, `labels`, `start_date`, `target_date`, `parent`.
2. Si aucun état fourni, l'état par défaut du projet est assigné.
3. Un advisory lock PostgreSQL est pris sur le projet pour calculer le `sequence_id`.
4. L'issue est sauvegardée avec `sort_order = max_sort_order + 10000`.
5. Une `IssueActivity` de type `issue.activity.created` est émise via Celery.
6. Un webhook `model_activity` est déclenché.
7. Une version initiale de description est créée via `issue_description_version_task`.

### CU-002 — Mettre à jour une issue

**Acteur** : ADMIN ou MEMBER (ou le créateur de l'issue)  
**Flux principal** :
1. PATCH avec les champs à modifier.
2. Si `description_html` change, une version de description est enregistrée (ou mise à jour si même auteur dans les 10 min).
3. Une `IssueActivity` détaillée est émise pour chaque champ modifié (nom, état, priorité, dates, assignees, labels, description).
4. Exception : si `skip_activity=True` ET mise à jour de description uniquement (flag migration), aucune activité ni version n'est créée.

### CU-003 — Supprimer une issue

**Acteur** : ADMIN uniquement (ou le créateur)  
**Flux** : soft delete (`deleted_at = now()`). Les activités associées restent. L'issue disparaît du manager standard. Elle reste visible via `Issue.all_objects` ou `DeletedIssuesListViewSet`.

### CU-004 — Consulter l'activité d'une issue

**Acteur** : ADMIN, MEMBER, GUEST  
**Flux** : l'endpoint fusionne et trie chronologiquement les `IssueActivity` (hors champs comment/vote/reaction/draft) et les `IssueComment`. Filtrable par `activity_type` (issue-property / issue-comment) et `created_at__gt`.

### CU-005 — Créer une relation entre issues

**Acteur** : ProjectEntityPermission  
**Flux** : création bulk d'`IssueRelation`. Le type de relation est normalisé via `get_actual_relation()` (ex : `blocking` → stocké `blocked_by` avec issue/related_issue inversés). Les IDs cibles sont validés au niveau workspace uniquement.

### CU-006 — Commenter une issue

**Acteur** : ADMIN, MEMBER, ou GUEST (si créateur de l'issue ou `guest_view_all_features`)  
**Flux** : crée un `IssueComment` avec son `Description` associé dans une transaction atomique. Déclenche une `IssueActivity` de type `comment.activity.created` et un webhook.

### CU-007 — Lister les issues (paginé)

**Acteur** : ADMIN, MEMBER, GUEST  
**Flux** : filtrage multicritère (priorité, état, groupe d'état, assignees, labels, dates, abonné), tri configurable, groupement simple ou double (group_by + sub_group_by). Pagination offset. Les GUESTs sans `guest_view_all_features` ne voient que leurs propres issues.

### CU-008 — Accéder à une issue par son identifiant human-readable

**Flux** : résolution `project_identifier` (ex : `PRJ`) + `sequence_id` (ex : `42`) → issue UUID, avec vérification membership projet.

## Dépendances

- `api/projects` — appartenance obligatoire à un projet et vérification des rôles membres
- `api/auth` — authentification et contexte utilisateur courant (via `crum`)
- `api/cycles` — `CycleIssue` lié aux issues, annoté dans les listes
- `api/modules` — `ModuleIssue` lié aux issues, annoté dans les listes
- `api/intake` — `IntakeIssue` lié pour filtrage du count (statuts) et annotation `is_intake`
- `api/notifications` — abonnés (`IssueSubscriber`) déclenchent des notifications
- `api/webhooks` — `model_activity` est déclenché sur create/update/delete
- `api/estimates` — `EstimatePoint` lié à l'issue
- `apps/live` — serveur Hocuspocus consomme/produit `description_binary` (Y.js)

## Zones d'incertitude

> Les points suivants n'ont pas pu être déterminés par le code seul :

- **Intention du champ `point`** : `Issue.point` (int 0-12) coexiste avec `estimate_point` (FK EstimatePoint). Lequel est utilisé en priorité dans l'interface ? Sont-ils mutuellement exclusifs ?
- **Comportement du `sort_order` lors d'un changement d'état** : le code ne recalcule le `sort_order` qu'à la création. Un changement d'état dans le kanban devrait-il réinitialiser le `sort_order` dans la nouvelle colonne ?
- **Portée des notifications sur sous-issues** : les abonnés d'une issue parente reçoivent-ils des notifications pour les sous-issues ?
- **Cycle de vie des `IssueVersion`** : il n'y a pas de TTL visible. Les versions s'accumulent indéfiniment ?
- **`access` INTERNAL vs EXTERNAL sur les commentaires** : la distinction est stockée mais le code de filtrage ne l'exploite pas explicitement dans les vues — quelle logique la gouverne ?
- **`external_source` et `external_id`** : présents sur Issue, IssueComment, IssueAttachment — quelle intégration les peuple (GitHub ? autre importeur) ?
