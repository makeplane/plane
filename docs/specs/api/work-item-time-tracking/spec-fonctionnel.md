# Spec Fonctionnelle — Time tracking / worklogs [PLAN]

| Champ   | Valeur                        |
|---------|-------------------------------|
| Module  | api/work-item-time-tracking   |
| Version | 0.1.0                         |
| Date    | 2026-07-08                    |
| Statut  | IMPLÉMENTÉ                    |
| Source  | Cadrage 2026-07-08 (doc Plane Pro + permissions matrix + API développeurs + SDK/MCP publics) |

> ⚠️ Garde ADR-001 bypassée (décision dev). Réimplémentation CE (AGPL, sans code plane-ee) du **time tracking** (feature Pro). V1 = worklogs par work item + cumul « Tracked time » + résumé projet API. Approbations (Business) hors V1.

---

## Contexte

Le toggle `Project.is_time_tracking_enabled` existe en CE (colonne réelle, purement décorative). Aucun modèle worklog n'existe (greenfield). Le web CE contient des stubs pré-câblés (`apps/web/ce/components/issues/worklog/*`) et le feed d'activité branche déjà sur `activity_type === "WORKLOG"`. Les clés i18n génériques (time tracking, worklogs, empty states) sont déjà traduites en 19 locales.

## Fonctionnel V1 (fidèle à la doc Plane Pro)

1. **Activation par projet** : Project Settings → Features → toggle « Time Tracking », réservé au **Project Admin**. Sans le toggle, aucune UI worklog n'apparaît et l'API refuse les écritures.
2. **Saisie** : sur la page de détail du work item, bouton « + Log work » → saisie **heures + minutes + description optionnelle**. Pas de champ date : la date du log = date de création de l'entrée. La durée est stockée en **minutes (entier)**.
3. **Cumul** : propriété « Tracked time » dans la sidebar (et le peek overview) du work item = somme des worklogs, mise à jour après chaque création/édition/suppression.
4. **Fil d'activité** : les worklogs apparaissent dans l'onglet « All » (mêlés aux commentaires/activités) et via un filtre « Worklogs » dédié ; chaque entrée porte un menu « … » → Edit (heures/minutes/description) / Delete.
5. **Résumé projet (API)** : total loggé par work item du projet (`total-worklogs`), consommé par l'outil MCP `get_project_worklog_summary`. Pas d'écran de reporting projet dans l'UI (fidèle à l'upstream — gap confirmé par l'issue GitHub makeplane#8045).

## Permissions (matrice officielle Plane)

| Action | Rôles |
|---|---|
| Activer/désactiver le toggle | Project Admin (20) |
| Créer un worklog | Project Admin + Member (15) ; **interdit aux Guests** ; **bloqué sur les work items en intake non acceptés** |
| Modifier un worklog | Auteur (`logged_by`) ou Project Admin (déviation CE assumée : la matrice ne documente que « own » ; l'admin est ajouté pour la modération) |
| Supprimer un worklog | Auteur ou Project Admin (même déviation) |
| Lire les worklogs d'un work item | Tout membre du projet (Admin/Member/Guest) — le fil d'activité n'est pas restreint |

## Hors V1
- Approbations et « Historical Worklogs » (Business/Enterprise).
- Écran timesheet workspace + export Excel/CSV (le seam `ExporterHistory.type="issue_worklogs"` existe, candidat V2).
- Comparaison estimé (système TIME) vs loggé, rollups cycle/module, roll-up des sous-items (non documenté upstream).
- Timer start/stop (seule la saisie manuelle est documentée upstream).
- Webhooks worklog (cohérent avec work-item-properties, non webhooké).

## Dépendances
| Dépendance | Spec | État |
|------------|------|------|
| api/issues | docs/specs/api/issues/ | ✅ |
| api/projects (toggle) | docs/specs/api/projects/ | ✅ (colonne existante) |

## Critères d'acceptation
- CRUD worklog interne (session) + externe v1 (token API) aligné sur les outils MCP `create/list/update/delete_work_log`, `get_project_worklog_summary` (chemins exacts du SDK `plane-python-sdk` : `work-items/:id/worklogs/`, `total-worklogs/`).
- Gate `is_time_tracking_enabled` : écritures refusées (400) quand désactivé ; lectures autorisées.
- Permissions ci-dessus vérifiées par tests (auteur vs autre membre vs guest vs admin ; intake bloqué).
- « Tracked time » visible et à jour dans la sidebar + peek overview ; entrées visibles dans le feed (onglet All + filtre Worklogs) ; edit/delete via menu « … ».
- Toggle « Time Tracking » fonctionnel dans Project Settings → Features.
- Isolation projet/workspace stricte (pas d'IDOR cross-projet sur worklog_id/issue_id).
