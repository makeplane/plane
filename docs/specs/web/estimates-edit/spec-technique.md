# Spec Technique — Édition des estimations

| Champ      | Valeur              |
|------------|----------------------|
| Module     | web/estimates-edit  |
| Version    | 0.1.0               |
| Date       | 2026-07-07          |
| Statut     | IMPLÉMENTÉ v0.1.0 (2026-07-07, phase A) |

---

## Architecture

Remplacement de stubs CE (`@/plane-web/*` → `apps/web/ce/*`). Le store CE (`ce/store/estimates/estimate.ts`) est déjà complet pour la création — l'étendre pour update/delete de points.

## Fichiers concernés

| Fichier | Rôle | État CE actuel |
|---------|------|----------------|
| `apps/web/ce/components/estimates/update/modal.tsx` | Modal d'édition | ✅ implémenté (phase A) |
| `apps/web/ce/components/estimates/points/delete.tsx` | Suppression de point + re-mapping | ✅ implémenté (phase A) |
| `apps/web/ce/components/estimates/inputs/time-input.tsx` | Input système TIME | ✅ implémenté (phase B → module `web/estimates-time`) |
| `apps/web/ce/components/estimates/helper.tsx` | `isEstimateSystemEnabled` | TIME → `true` (phase B → module `web/estimates-time`) |
| `apps/web/ce/store/estimates/` | Store estimates CE | complet pour création |

## Schéma BDD

- Volet points : aucune migration.
- Volet TIME : livré par le module `web/estimates-time` (enum `EstimateType.TIME` + migration `0127_alter_estimate_type_time`, validation dans `plane/app/views/estimate/base.py`) — voir docs/specs/web/estimates-time/.

## API

- Existant : CRUD estimates fonctionnel en CE (`plane/app/views/estimate/base.py:64-101`).
- À vérifier : endpoint de mise à jour partielle des points + re-mapping des issues (sinon transaction côté client : update issues puis delete point).

## Tests

- Vitest : helper + logique de re-mapping.
- pytest (si volet TIME) : création d'une estimation TIME, validation enum.
