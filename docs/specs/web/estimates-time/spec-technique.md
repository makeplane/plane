# Spec Technique — Estimations TIME (heures/minutes)

| Champ      | Valeur              |
|------------|----------------------|
| Module     | web/estimates-time  |
| Version    | 0.1.0               |
| Date       | 2026-07-12          |
| Statut     | IMPLÉMENTÉ v0.1.0 (2026-07-12) |

---

## Architecture

Déblocage d'un système d'estimation déjà à moitié câblé : le pipeline d'affichage TIME (« Xh Ym ») existait sur toutes les surfaces, seuls les verrous CE (helper + is_ee) et le widget de saisie manquaient. Volet backend ajouté en revue : déclaration de `TIME` dans l'enum + validation d'écriture + montage des routes v1 estimates.

## Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `apps/web/ce/components/estimates/helper.tsx` | `isEstimateSystemEnabled` → true pour TIME |
| `apps/web/ce/components/estimates/inputs/time-input.tsx` | Widget heures/minutes (était un stub) |
| `packages/constants/src/estimates.ts` | `time.is_ee` → false ; template hours en minutes (60..360) ; template custom caché pour TIME (anti-crash) |
| `apps/web/core/components/issues/issue-detail/issue-activity/activity/activity-list.tsx` | `case "estimate_time"` → `IssueEstimateActivity` (revue COR-1) |
| `apps/web/core/components/issues/issue-detail/issue-activity/activity/actions/estimate.tsx` | Formatage « Xh Ym » des valeurs `estimate_time` (revue COR-1) |
| `apps/web/core/components/dropdowns/estimate.tsx` | Libellé unique bouton + tooltip (`selectedEstimateLabel`) — le tooltip affichait les minutes brutes (revue COR-2) |
| `apps/api/plane/db/models/estimate.py` | `EstimateType.TIME = "time"` (revue SEC-1) |
| `apps/api/plane/db/migrations/0127_alter_estimate_type_time.py` | AlterField choices (state-only, aucun SQL de données) |
| `apps/api/plane/app/views/estimate/base.py` | Validation `type ∈ EstimateType.values` sur create/partial_update + garde payload `estimate` manquant → 400 (revue SEC-1) |
| `apps/api/plane/api/urls/__init__.py` | Montage des routes v1 estimates (le fichier `urls/estimate.py` existait, jamais inclus) |
| `apps/api/plane/tests/contract/app/test_estimate_type_app.py` | 4 tests validation interne |
| `apps/api/plane/tests/contract/api/test_estimates_v1.py` | 3 tests contrat v1 (time accepté, inconnu 400, auth) |

## Contrat de valeur

- Point TIME = chaîne décimale de MINUTES (`"150"` = 2h30). `EstimateInputRoot` passe `value={parseInt(value)}` au widget ; le widget émet `handleEstimateInputValue(String(totalMinutes))` (ou `""` si 0).
- Conversions : `convertHoursMinutesToMinutes` / `convertMinutesToHoursAndMinutes` / `convertMinutesToHoursMinutesString` (`packages/utils/src/datetime.ts`).
- Sites d'affichage (préexistants, inchangés) : points/preview, estimate-list-item, dropdowns/estimate, readonly, points/delete — tous via `convertMinutesToHoursMinutesString(Number(value))`.
- Activité : le backend enregistre `field="estimate_" + estimate.type` avec la valeur brute en minutes ; le front formate pour `estimate_time` (activité + notification).

## API

- Interne (session) : `POST/PATCH /api/workspaces/:slug/projects/:pid/estimates/` — `type` validé contre `EstimateType.values` (400 sinon) ; payload `estimate` manquant → 400.
- **v1 (token/MCP), montées par ce module** : `GET/POST/PATCH/DELETE .../estimates/` + `GET/POST .../estimate-points/` + `PATCH/DELETE .../estimate-points/:id/` — validation par ModelSerializer (choices du modèle, donc `time` accepté). Outils MCP `get_project_estimate`, `create_project_estimate`, `create_project_estimate_points`… fonctionnels (avant : 404, gap SDK 0.2.19).
- NB : le PATCH v1 de l'estimate ne permet que `name`/`description` (ALLOWED_FIELDS upstream) — le `type` v1 se fixe à la création.

## Schéma BDD

- Migration `0127_alter_estimate_type_time` : AlterField `Estimate.type` (ajout du choice `time`). State-only — aucune donnée modifiée, aucun index.

## Tests

- pytest Docker : 7 tests (`test_estimate_type_app.py` + `test_estimates_v1.py`) — time accepté interne+v1, type inconnu 400 interne+v1 (create et patch), payload manquant 400, auth v1.
- Vérif navigateur : création template Hours (POST 200, valeurs 60..360), édition 2h30 (PATCH `"150"`), rendu « 2h 30m », chemin Custom sans crash, clamps saisie (90→59 min, 4 chiffres heures), dropdown work item (options 1h..6h, écriture, sidebar « 2h »).
- MCP local : `get_project_estimate` → `type: "time"` ✓.

## Pièges connus

- Le template custom TIME est caché (`hide: true`) : il n'alimente QUE le chemin `templates['custom']` du stage-one (modal.tsx résout sans garde). Sa clé `i18n_title` n'existe pas dans les locales — jamais rendue. Ne pas le rendre visible sans ajouter la clé × 19 locales.
- Le champ minutes clampe 0..59 SANS report (taper 90 → 59) — choix UX assumé, cohérent avec l'aperçu « Xh Ym ».
- Crash préexistant `track_estimate_points` (suppression d'estimation → `new_estimate.estimate` sur None, activités du PATCH perdues) : hors périmètre, branche fix/ dédiée.
- Page Profil → Activity : la map `activityDetails` ne connaît que la clé legacy `estimate_point` (messages vides pour points/categories/time) — préexistant, branche fix/ dédiée.
