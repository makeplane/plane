# Tech Design — Édition des estimations

> Intention technique avant implémentation. À valider avant /superpowers:write-plan.

## Approche pressentie

1. **Phase A (web only)** : implémenter `UpdateEstimateModal` (renommage + édition des points) et `EstimatePointDelete` (sélecteur de point de remplacement, mise à jour des issues affectées puis suppression du point).
2. **Phase B (optionnelle, api+web)** : ajouter `TIME` à l'enum `EstimateType` (migration), passer `isEstimateSystemEnabled(TIME)` à `true`, implémenter `EstimateTimeInput` (hh:mm).

## Points ouverts

- L'API expose-t-elle un delete de point avec `new_estimate_point_id` (re-mapping serveur) ou faut-il le faire client-side ?
- Le système TIME vaut-il l'effort sans time tracking (worklogs) derrière ?

## Risques

- Faible en phase A ; phase B introduit une migration → respecter 01-database.md.
