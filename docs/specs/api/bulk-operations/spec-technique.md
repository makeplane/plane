# Spec Technique — Bulk operations

| Champ   | Valeur              |
|---------|---------------------|
| Module  | api/bulk-operations |
| Version | 0.1.0               |
| Date    | 2026-07-11          |
| Statut  | PLAN — à valider    |
| Source  | Cadrage 2026-07-11 (fichier:ligne vérifiés) |

> ⚠️ Garde ADR-001 bypassée. **Zéro migration** (leaf `0126` intact) : réutilise les modèles issue existants. Module 2 surfaces : API Django (interne + v1/MCP) + web.

---

## Modèle — rien à créer

- `Issue` (scalaires : `state`, `priority`, `start_date`, `target_date`, `estimate_point`, `parent`…).
- M2M via through models : `IssueAssignee` (`issue.py:345`, `unique_together` issue+assignee+deleted_at, `UniqueConstraint` deleted_at null), `IssueLabel` (`issue.py:543`), `CycleIssue`, `ModuleIssue`. Tous soft-delete (`mixins.py`).
- `IssueActivity` : produit par `issue_activity.delay(...)` (tâche Celery, ACTIVITY_MAPPER).

## Backend — API interne (app, session)

### Nouveau : `BulkIssueOperationEndpoint`

- Route : `POST /api/workspaces/<slug>/projects/<project_id>/bulk-operation-issues/` (`plane/app/urls/issue.py`, à côté de `bulk-archive-issues/`).
- Vue : `plane/app/views/issue/base.py` (à côté de `BulkArchiveIssuesEndpoint`/`IssueBulkUpdateDateEndpoint`).
- Permission : `ProjectEntityPermission` + `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` (parité bulk-archive).
- Payload : `{issue_ids: [uuid], properties: {state_id?, priority?, label_ids?, assignee_ids?, start_date?, target_date?, module_ids?, cycle_id?, estimate_point?}}`.
- Logique (transaction) :
  1. Charger `Issue.objects.filter(id__in=issue_ids, project_id=project_id, workspace__slug=slug)` — si count ≠ len(set(issue_ids)) → 400 (id hors projet/inexistant).
  2. Valider chaque clé présente contre le projet (state/label/assignee actif/module/cycle/estimate). Assignés = `ProjectMember.member` actifs. Rejet global (400) si une valeur est invalide.
  3. Scalaires (`state`, `priority`, `start_date`, `target_date`, `estimate_point`) → `Issue.objects.filter(id__in=...).update(**changed)` OU boucle + `bulk_update` (pour capturer old/new par item pour l'activité).
  4. M2M **SET/remplacer** (mirroir `IssueCreateSerializer.update` `serializers/issue.py:322-376`) : soft-delete des through rows existantes (`filter(issue__in=...).delete()`) puis `bulk_create` des nouvelles (`ignore_conflicts=True`). Idem `CycleIssue`/`ModuleIssue`.
  5. `cycle_id` scalaire → une seule affectation de cycle (remplacer la `CycleIssue` existante).
  6. Cohérence dates : si les 2 fournis → `start ≤ target` (400) ; si un seul → validation par-item contre l'existant (clés i18n existantes).
- **Activité** : pour chaque issue et chaque champ changé, `issue_activity.delay(type="issue.activity.updated", requested_data, current_instance, ...)` — capturer `current_instance` AVANT modif (comme le flux unitaire). Émet realtime/notif/webhook via le pipeline `issue_activities_task`.
- Réponse : 200. (Forme exacte alignée sur ce qu'attend `issue.service.ts#bulkOperations` — à lire à l'implémentation ; défaut : `{}` ou liste des ids modifiés ; le store front re-fetch/mutate.)

### Épics
Pas de restriction epic spécifique (l'UI désactive déjà la sélection sur les layouts epic ; l'endpoint valide state/champs par projet, suffisant). À confirmer à l'implémentation.

## Backend — API externe v1 (token, MCP)

### Nouveau : `BulkIssueOperationAPIEndpoint`

- Route : `POST /api/v1/workspaces/<slug>/projects/<project_id>/bulk-issues/` (`plane/api/urls/work_item.py` ; nouveau fichier de vue `plane/api/views/issue.py` ou dédié).
- `BaseAPIView` v1 (APIKeyAuthentication + throttling). Permission : ADMIN+MEMBER projet (réutiliser le mécanisme v1 existant).
- Même payload/validations/activité que l'interne (extraire un **helper partagé** — ex. `plane/utils/bulk_issue.py` — pour la validation + application + activité, appelé par les 2 vues).
- Aligne un futur outil MCP `bulk_update_work_items` (le serveur MCP wrappe `/api/v1/`).

## Web (apps/web)

| Fichier | Action |
|---|---|
| `core/hooks/use-bulk-operation-status.ts` | `useBulkOperationStatus = () => true` (CE self-hosted : bulk toujours dispo). Lève le gate → sélection active dans List/Spreadsheet. |
| `ce/components/issues/bulk-operations/root.tsx` | REMPLIR : `IssueBulkOperationsRoot` = toolbar sticky réelle au lieu de la bannière. Compteur sélection (depuis `multiple_select.store`), dropdowns d'édition, bouton Update, actions archive/delete, clear. |
| `ce/components/issues/bulk-operations/*` (nouveaux) | Sous-composants toolbar : dropdowns state/priority/assignés/labels/dates/cycle/module/estimate (réutiliser les dropdowns issue existants), accumulation locale d'un `properties` en attente, appliqué via `bulkOperations` au clic Update. Gater chaque dropdown par la dispo feature projet. |
| `core/services/issue/issue.service.ts` | `bulkOperations` existe déjà (POST bulk-operation-issues/) — réutiliser tel quel (l'endpoint existe désormais). |
| `packages/i18n/src/locales/*` | Réutiliser `bulk_operations.*` existant + ajouter les libellés toolbar manquants (compteur, Update, clear, tooltips) — 19 locales via skill translate. |

## Sécurité (checklist revue adversariale)

1. **Isolation projet** : un `issue_id` d'un autre projet/workspace → 400, jamais appliqué (le filtre `project_id` + count strict le garantit — test dédié anti-fuite).
2. **Validation des valeurs** : state/label/assignee/module/cycle/estimate hors projet → 400 (jamais d'assignation cross-projet). UUID malformés → 400, pas 500.
3. **Permissions** : ADMIN+MEMBER imposé sur les 2 surfaces ; guest/viewer → 403.
4. **Atomicité** : transaction — un échec de validation ne laisse aucune modif partielle.
5. **M2M SET** : la soft-delete + bulk_create respecte l'`UniqueConstraint` deleted_at null (réutiliser exactement le pattern serializer existant pour éviter le piège d'intégrité).
6. **Activité** : capturer `current_instance` avant modif, sinon old/new faux dans le fil.

## Tests (pytest, Docker, ~25-30 tests)

- **Interne** : set state/priority/dates/estimate/cycle (scalaires) ; SET assignés/labels/modules (remplacement — vérifier soft-delete de l'ancien + présence du nouveau) ; partial (clé absente inchangée) ; multi-issues ; **anti-fuite** (issue_id hors projet → 400) ; valeurs hors projet → 400 (state/label/assignee/module/cycle/estimate) ; dates incohérentes → 400 ; lot vide → 400 ; **activité émise** par item (mock `issue_activity.delay`) ; permissions (guest/viewer → 403, member OK) ; idempotence M2M (rejouer le même SET ne duplique pas).
- **v1** : auth token OK / absente → 401, même contrat/validations, permissions, isolation projet.
- `makemigrations --check --dry-run` = « No changes detected ».
