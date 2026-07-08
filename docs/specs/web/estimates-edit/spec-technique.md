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
| `apps/web/ce/components/estimates/update/modal.tsx` | Modal d'édition | stub `<></>` |
| `apps/web/ce/components/estimates/points/delete.tsx` | Suppression de point + re-mapping | stub `<></>` |
| `apps/web/ce/components/estimates/inputs/time-input.tsx` | Input système TIME | stub `<></>` |
| `apps/web/ce/components/estimates/helper.tsx` | `isEstimateSystemEnabled` | TIME → `false` |
| `apps/web/ce/store/estimates/` | Store estimates CE | complet pour création |

## Schéma BDD

- Volet points : aucune migration.
- Volet TIME : ajout de `TIME` à `EstimateType` (`apps/api/plane/db/models/estimate.py:13-15`) → migration Django + adaptation `plane/app/views/estimate/base.py`.

## API

- Existant : CRUD estimates fonctionnel en CE (`plane/app/views/estimate/base.py:64-101`).
- À vérifier : endpoint de mise à jour partielle des points + re-mapping des issues (sinon transaction côté client : update issues puis delete point).

## Tests

- Vitest : helper + logique de re-mapping.
- pytest (si volet TIME) : création d'une estimation TIME, validation enum.
