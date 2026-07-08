# Spec Fonctionnelle — api/intake [DRAFT — à valider par le dev]

| Champ      | Valeur              |
|------------|---------------------|
| Module     | api/intake          |
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

| ADR | Titre | Statut |
|-----|-------|--------|
| [RETRO-031](../../../adr/RETRO-031-triple-format-description-storage.md) | Stockage triple format JSON+HTML+Binary pour les descriptions riches | Documenté (rétro) |
| [RETRO-032](../../../adr/RETRO-032-soft-delete-uuid-conditional-uniqueness.md) | Soft delete UUID-based avec UniqueConstraint conditionnel | Documenté (rétro) |
| [RETRO-101](../../../adr/RETRO-101-intake-deploy-board-xss-sanitization.md) | Sanitisation HTML nh3 obligatoire sur les soumissions publiques intake | Documenté (rétro) |
| [RETRO-102](../../../adr/RETRO-102-triage-state-group-dedicated.md) | État TRIAGE dédié, exclu du backlog et auto-créé à la soumission intake | Documenté (rétro) |

> *Table auto-générée par adr-linker. Ne pas éditer manuellement.*

ADR transverses impactant ce module (non générés pour cette feature) :

| ADR | Catégorie | Impact sur intake |
|-----|-----------|-------------------|
| [RETRO-021](../../../adr/RETRO-021-rbac-trois-niveaux-projet-workspace.md) | AUTH | `@allow_permission` gouverne tous les accès aux endpoints intake authentifiés |

---

## Contexte et objectif

Le module `api/intake` (aussi appelé "Inbox" dans les alias d'URL) est un funnel de triage des issues soumises depuis l'intérieur ou l'extérieur d'un projet. Il permet à des contributeurs internes (membres du projet) ou à des utilisateurs anonymes (via un DeployBoard public) de soumettre des issues qui ne sont pas immédiatement intégrées dans le backlog du projet, mais transitent par un état de revue.

Le module comprend deux surfaces d'exposition :

1. **Surface authentifiée** (`plane/app/`) — accessible uniquement aux membres du projet (ADMIN, MEMBER, GUEST) via l'API DRF standard avec session Django.
2. **Surface publique** (`plane/space/`) — accessible sans authentification via un DeployBoard identifié par un `anchor` UUID unique, à condition que l'administrateur du projet ait activé l'intake sur ce DeployBoard.

Chaque projet possède un Intake unique (le `is_default=True` est protégé contre la suppression). Les issues soumises sont des `IntakeIssue`, liées à une `Issue` réelle en état "Triage", et suivent un cycle de triage avant d'être acceptées dans le backlog ou rejetées.

---

## Règles métier (déduites du code)

1. **Unicité de l'Intake par projet** : un seul Intake actif par projet (contrainte unique sur `name + project` avec filtre `deleted_at IS NULL`). L'Intake par défaut (`is_default=True`) ne peut pas être supprimé.

2. **Cycle de statuts de triage** : une `IntakeIssue` passe par des statuts entiers distincts :
   - `-2` (PENDING) — état initial, en attente de décision
   - `-1` (REJECTED) — rejetée par un trieur
   - `0` (SNOOZED) — reportée jusqu'à une date (`snoozed_till`)
   - `1` (ACCEPTED) — acceptée dans le backlog
   - `2` (DUPLICATE) — marquée doublon d'une issue existante (`duplicate_to`)

3. **Transition automatique vers l'état par défaut à l'acceptation** : quand une `IntakeIssue` passe au statut ACCEPTED (`1`), l'issue sous-jacente passe automatiquement de l'état TRIAGE vers le premier état `default=True` du projet. Si aucun état par défaut n'existe, l'acceptation est bloquée avec une erreur de validation.

4. **État TRIAGE obligatoire à la création** : toute issue soumise dans un intake est automatiquement placée en état TRIAGE. Si cet état n'existe pas pour le projet, il est créé automatiquement (couleur `#4E5355`, séquence 65000).

5. **Suppression conditionnelle de l'issue sous-jacente** : quand une IntakeIssue est supprimée, l'issue sous-jacente est co-supprimée uniquement si le statut est PENDING (-2), REJECTED (-1), SNOOZED (0) ou DUPLICATE (2). Les issues ACCEPTED (1) sont préservées car elles ont intégré le backlog.

6. **Contrôle d'accès différencié pour les GUESTs** :
   - En lecture (list) : un GUEST ne voit que ses propres soumissions, sauf si `Project.guest_view_all_features=True`.
   - En écriture (partial_update) : un GUEST ne peut modifier que `name`, `description_html` et `description_json` de ses propres issues. Les champs de triage (statut, snooze, doublon) restent réservés aux membres ayant un rôle supérieur à MEMBER ou aux admins workspace.
   - Création : ouverte à tous les rôles projet (ADMIN, MEMBER, GUEST).

7. **Voie publique via DeployBoard** :
   - L'accès public est conditionné à l'existence d'un `DeployBoard` avec `entity_name="project"` et à la présence d'un lien `DeployBoard.intake` non nul.
   - Les soumissions publiques sont identifiées par l'`anchor` UUID du DeployBoard, qui est unique et indexé.
   - En voie publique, seul le créateur peut modifier ou supprimer sa propre soumission.

8. **Sanitisation HTML obligatoire sur la voie publique** : les soumissions publiques via `IntakeIssuePublicViewSet.create()` font l'objet d'une sanitisation du champ `description_html` via `nh3` (bibliothèque Rust-based) avant persistance. Cette sanitisation n'est pas appliquée sur la voie authentifiée interne (qui passe par `IssueCreateSerializer`).

9. **Traçabilité via activités** : toute création et modification d'une IntakeIssue déclenche une tâche Celery `issue_activity.delay()` pour créer une entrée dans le journal d'activité. Les modifications de description déclenchent en plus `issue_description_version_task.delay()`.

10. **Source de soumission** : le champ `source` de l'IntakeIssue enregistre la provenance (`IN_APP` par défaut, `external_source` + `external_id` pour les intégrations tierces potentielles). La voie publique utilise également `SourceType.IN_APP`.

11. **Filtre anti-snooze** : les issues snoozées avec une date expirée (`snoozed_till < now()`) sont exclues de la liste publique (`get_queryset()` filtre `snoozed_till__gte=now() OR snoozed_till IS NULL`).

---

## Cas d'usage (déduits)

### CU-001 — Soumission interne d'une issue en attente de triage

Un membre du projet (ADMIN, MEMBER ou GUEST) soumet une issue via la surface authentifiée. L'issue est créée en état TRIAGE avec statut PENDING dans la file d'intake. Elle est visible dans la liste d'intake filtrée par statut.

**Flux** :
1. `POST /workspaces/{slug}/projects/{project_id}/intake-issues/` avec `{"issue": {"name": "...", "priority": "low", ...}}`
2. Validation : nom requis, priorité dans la liste autorisée
3. Récupération ou création de l'état TRIAGE du projet
4. Création de l'Issue avec `state=TRIAGE`
5. Création de l'IntakeIssue avec `status=-2` (PENDING), `source=IN_APP`
6. Déclenchement de `issue_activity` et `issue_description_version_task` en asynchrone
7. Retour : `IntakeIssueDetailSerializer`

### CU-002 — Triage d'une issue (ACCEPT / REJECT / SNOOZE / DUPLICATE)

Un ADMIN ou MEMBER du projet (rôle > GUEST) modifie le statut d'une IntakeIssue.

**Flux** :
1. `PATCH /workspaces/{slug}/projects/{project_id}/intake-issues/{pk}/` avec `{"status": 1}` (ACCEPTED)
2. Validation du statut via `IntakeIssueSerializer.validate()` : si status=1 et issue en TRIAGE, vérification d'un état `default=True` dans le projet
3. Sauvegarde : `IntakeIssueSerializer.update()` bascule automatiquement l'issue vers l'état par défaut
4. Déclenchement d'une activité `intake.activity.created` en asynchrone
5. Retour : `IntakeIssueDetailSerializer`

### CU-003 — Soumission publique via DeployBoard

Un utilisateur externe (non authentifié) soumet une issue via la surface publique d'un projet exposé.

**Flux** :
1. `POST /anchor/{anchor}/intakes/{intake_id}/intake-issues/` avec `{"issue": {"name": "...", ...}}`
2. Vérification du DeployBoard (anchor valide, intake configuré)
3. Sanitisation de `description_html` via `validate_html_content()` (nh3)
4. Création de l'Issue en état TRIAGE (auto-création si absent)
5. Création de l'IntakeIssue avec `source=IN_APP`
6. Déclenchement de `issue_activity` en asynchrone
7. Retour : `IssueStateIntakeSerializer`

### CU-004 — Consultation de la liste des soumissions publiques

Un utilisateur externe navigue les soumissions existantes d'un DeployBoard.

**Flux** :
1. `GET /anchor/{anchor}/intakes/{intake_id}/intake-issues/`
2. Vérification du DeployBoard
3. Retour des issues filtrées : snoozées non expirées incluses, snoozées expirées exclues
4. Tri par `snoozed_till, status`

### CU-005 — Consultation de l'historique des versions de description

Un membre du projet (ADMIN, MEMBER, GUEST) consulte les versions de description d'une issue en intake.

**Flux** :
1. `GET /workspaces/{slug}/projects/{project_id}/intake-work-items/{work_item_id}/description-versions/`
2. Vérification du rôle (GUEST limité à ses propres issues sauf `guest_view_all_features`)
3. Retour paginé des `IssueDescriptionVersion`

---

## Dépendances

- `api/issues` — `IntakeIssue` référence une `Issue` réelle ; les activités, les versions de description et le soft delete sont gérés par la feature issues
- `api/projects` — `Project.guest_view_all_features` gouverne la visibilité GUEST ; `DeployBoard` est rattaché à un projet
- `api/auth` / RBAC — le décorateur `@allow_permission` (RETRO-021) gouverne tous les accès authentifiés
- `apps/live` (collab) — les descriptions stockées en triple format (RETRO-031) s'appliquent aux issues créées via intake
- Celery / `bgtasks` — `issue_activity`, `issue_description_version_task` (notifications, audit trail)

---

## Zones d'incertitude

> Les points suivants n'ont pas pu être déterminés par le code seul :

- **Activation de l'intake par projet** : le modèle `Project` dispose d'un champ `features` (ou équivalent) permettant d'activer/désactiver l'intake. La condition d'accès à la liste des intakes par projet (si intake désactivé) n'est pas vérifiée dans la vue — à valider.
- **Comportement du champ `source`** : `IN_APP` est la seule valeur de `SourceType` définie dans le code. Le champ `external_source` + `external_id` suggère une intégration tierce possible mais aucun code d'injection externe n'a été identifié dans ce périmètre.
- **Politique de snooze** : à quelle fréquence les issues snoozées expirées repassent-elles en PENDING ? Aucun tâche Celery de réactivation n'a été identifiée — peut-être un comportement à implémenter ou géré côté front.
- **Gestion de la voie publique authentifiée** : `IntakeIssuePublicViewSet` ne vérifie pas d'authentification explicitement ; l'authentification de la requête publique (utilisateur anonyme vs connecté) dépend de la configuration DRF du router `space/`. À clarifier.
- **Champ `extra` sur IntakeIssue** : champ JSONField non documenté et non utilisé dans les sérialiseurs exposés. Usage inconnu.
- **Double alias d'URL** : les endpoints `/intakes/` et `/inboxes/`, `/intake-issues/` et `/inbox-issues/` pointent vers les mêmes vues. La raison du double nommage (migration, rétrocompatibilité ?) n'est pas visible dans le code.
