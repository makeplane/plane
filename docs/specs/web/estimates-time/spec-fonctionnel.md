# Spec Fonctionnelle — Estimations TIME (heures/minutes)

| Champ      | Valeur                                      |
|------------|---------------------------------------------|
| Module     | web/estimates-time                          |
| Version    | 0.1.0                                       |
| Date       | 2026-07-12                                  |
| Auteur     | session roadmap vague 1                     |
| Statut     | IMPLÉMENTÉ v0.1.0 (2026-07-12)              |
| Source     | NOTE-features-payantes-points-entree-ce.md (phase B d'estimates-edit) |

> ⚠️ Garde ADR-001 bypassée sur décision du dev. Feature équivalente au plan Pro de Plane, réimplémentée en CE (AGPL, aucun code plane-ee).

---

## ADRs

_Aucun ADR. Prolonge web/estimates-edit (phase B annoncée dans son tech-design)._

---

## Contexte et objectif

En CE, le système d'estimation TIME était masqué (option grisée + badge Pro : `isEstimateSystemEnabled(TIME)` → false, `time.is_ee=true`) et son input était un stub. Objectif : débloquer TIME de bout en bout — création (template « Hours » ou custom), saisie heures/minutes, affichage « Xh Ym » sur toutes les surfaces, contrat backend cohérent.

## Règles métier

1. **La valeur d'un point TIME est stockée en MINUTES** (chaîne décimale, ex. « 150 » = 2h30) — contrat du pipeline d'affichage existant (`convertMinutesToHoursMinutesString`).
2. Le widget de saisie expose deux champs : heures (≤ 4 chiffres) et minutes (0..59, clamp sans report automatique).
3. Un point TIME doit être strictement positif (0h00 interdit) ; la détection de doublons compare les minutes totales.
4. Le backend ne persiste que des types d'estimation déclarés : `categories`, `points`, `time` — toute autre valeur → 400 (surfaces interne ET v1).
5. Les activités d'estimation TIME s'affichent en « Xh Ym » (fil d'activité du work item, notifications).

## User Stories

- En tant qu'admin projet, je crée un système TIME via le template Hours (1h..6h) ou en custom, puis j'édite chaque point en heures/minutes.
- En tant que membre, j'estime un work item à « 2h 30m » depuis le dropdown, et toutes les surfaces (chip, tooltip, spreadsheet, activité) affichent « 2h 30m ».
- En tant qu'intégrateur MCP/v1, je crée/lis une estimation `type="time"` par l'API token.

## Cas limites

- Clic « Custom / start from scratch » avec TIME → pas de crash (template custom caché seedé 1h/2h).
- Saisie 90 dans minutes → clampé à 59 ; heures limitées à 4 chiffres.
- Valeur existante rechargée en édition → pré-remplissage h/min depuis les minutes (resync asynchrone).
- `type` inconnu envoyé à l'API (interne ou v1) → 400, rien n'est persisté.
- Payload `estimate` absent sur le POST interne → 400 (plus de 500 AttributeError).

## Interfaces

- Modale de création d'estimation : option Time sélectionnable, templates Hours + Custom.
- Widget `EstimateTimeInput` (heures/minutes) dans création et édition de points.
- Dropdown d'estimation des work items : options et bouton/tooltip en « Xh Ym ».
- Fil d'activité du work item : entrées `estimate_time` visibles et formatées.

## Dépendances

| Dépendance | Spec | État |
|------------|------|------|
| web/estimates-edit | docs/specs/web/estimates-edit/ | ✅ livré (phase A — update modal, delete point) |
| api/estimates (v1) | — | montée par ce module (routes existaient, non incluses) |

## Hors scope

- Rollups de temps (somme des estimations TIME sur cycles/modules) — dépend d'analytics.
- Conversion automatique entre systèmes (POINTS → TIME).
- Correction du crash préexistant `track_estimate_points` à la suppression d'estimation (branche fix/ séparée).

## Critères d'acceptation

- [x] Création d'une estimation TIME via template Hours → points 60..360, rendus « 1h..6h » (vérifié navigateur + POST 200).
- [x] Édition d'un point à 2h30 → PATCH `value="150"`, rendu « 2h 30m » partout (vérifié navigateur).
- [x] Chemin Custom sans crash, seed 1h/2h (vérifié navigateur).
- [x] `type` hors enum → 400 interne et v1 (7 tests pytest Docker).
- [x] Outil MCP `get_project_estimate` opérationnel en local (routes v1 montées).
