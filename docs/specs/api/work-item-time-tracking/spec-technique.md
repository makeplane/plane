# Spec Technique — Time tracking / worklogs

| Champ   | Valeur                        |
|---------|-------------------------------|
| Module  | api/work-item-time-tracking   |
| Version | 0.1.0                         |
| Date    | 2026-07-08                    |
| Statut  | PLAN — à valider              |
| Source  | Cadrage 2026-07-08 (code CE ; tiers : Pro=base, Business=approbations) |

> ⚠️ Garde ADR-001 bypassée (décision dev). Réimplémentation CE (AGPL, sans code plane-ee) du **time tracking** (feature Pro). V1 = saisie/CRUD de worklogs + rollup. Les **approbations** (Business) sont hors V1.

---

## Contexte

`Project.is_time_tracking_enabled` existe (dormant, décoratif). **Aucun modèle worklog** en CE (greenfield). Des seams web sont déjà pré-câblés : l'activité branche sur `activity_type === "WORKLOG"` (`activity-comment-root.tsx`), les clés i18n `common.worklogs`/`no_worklogs` et l'illustration empty-state sont livrées. Les 4 stubs CE `apps/web/ce/components/issues/worklog/*` rendent `<></>`.

## Modèle (greenfield — 1 table)

```python
# apps/api/plane/db/models/worklog.py
class IssueWorkLog(ProjectBaseModel):
    issue = FK("db.Issue", CASCADE, related_name="issue_worklogs")
    logged_by = FK(AUTH_USER_MODEL, CASCADE, related_name="worklogs")
    duration = PositiveIntegerField(default=0)   # MINUTES (entier — pas de decimal)
    description = TextField(blank=True, default="")
    external_source = CharField(max_length=255, null=True, blank=True)
    external_id = CharField(max_length=255, null=True, blank=True)
    class Meta:
        db_table = "issue_worklogs"
        indexes = [Index(fields=["issue"]), Index(fields=["project", "logged_by"])]
        ordering = ("-created_at",)
```
Durée en **minutes entier** (pas de dérive float sur les rollups ; le web formate en « Xh Ym »). `created_at` = date du log (pas de champ date en V1). Export dans `db/models/__init__.py`. Migration `0125_issue_worklogs` (chaînée sur `0124`).

## API

### Interne (app, session) — modelé sur `IssueCommentViewSet`
- `GET/POST /api/workspaces/:slug/projects/:project_id/issues/:issue_id/worklogs/`
- `GET/PATCH/DELETE .../worklogs/:pk/`
- `GET .../projects/:project_id/total-worklogs/` — rollup (par membre + total minutes) → `get_project_worklog_summary`.
- Permissions : create par tout membre pouvant éditer le work item ; update/delete réservés à `logged_by` OU admin projet ; lecture = appartenance projet.
- **Gate** : rejeter les écritures si `Project.is_time_tracking_enabled` est False (400).

### Externe (api v1, token — MCP)
- `POST/GET /api/workspaces/:slug/projects/:project_id/work-items/:issue_id/worklogs/` (create/list)
- `PATCH/DELETE .../worklogs/:pk/` (update/delete)
- `GET .../projects/:project_id/worklog-summary/` (ou équivalent) → summary
- Mapping MCP : `create_work_log`, `list_work_logs`, `update_work_log`, `delete_work_log`, `get_project_worklog_summary`.

### Activité
Émettre `issue_activity` type `WORKLOG` sur create/update/delete (`bgtasks/issue_activities_task.py`) — le rendu web est déjà branché.

## Web (apps/web)
- Toggle : ajouter l'entrée Time Tracking à `PROJECT_FEATURES_LIST` (`project/settings/features-list.tsx`) sur `is_time_tracking_enabled` ; ajouter `is_time_tracking_enabled` à `IProject` (`packages/types/src/project/projects.ts`).
- Stubs CE à implémenter : `worklog/activity/root.tsx`, `worklog/activity/worklog-create-button.tsx`, `worklog/property/root.tsx` (total dans la sidebar), `worklog/activity/filter-root.tsx` (filtre WORKLOG).
- Constante : ajouter `WORKLOG` à `EActivityFilterType` + `ACTIVITY_FILTER_TYPE_OPTIONS` (`packages/constants/src/issue/filter.ts`).
- Service + store worklog (aucun n'existe) ; types `TWorklog`/`TWorklogSummary`.
- Saisie : durée en « Xh Ym » (parse → minutes) + description ; total agrégé affiché.

## Tests (pytest, exécutés contre la BDD Docker)
- Modèle + migration ; CRUD interne + v1 ; gate `is_time_tracking_enabled` ; permissions (auteur/admin vs autre) ; rollup summary ; isolation projet ; activité émise.

## Hors V1
- Approbations de worklogs (Business), rollups sur cycle/module, estimation vs temps passé, timer live.
