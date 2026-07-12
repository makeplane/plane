# Tech Design — Estimations TIME

> Intention technique (cadrage vague 1, avant implémentation).

## Approche pressentie

1. **Deux verrous CE à lever** : `ce/components/estimates/helper.tsx` (`isEstimateSystemEnabled(TIME)` → true) et `ce/components/estimates/inputs/time-input.tsx` (stub → widget h/min).
2. **Constantes** : `time.is_ee` → false ; CORRIGER le template hours (valeurs 1..6 → 60..360, le pipeline d'affichage interprète des minutes).
3. **Stockage en minutes** (contrat des surfaces d'affichage existantes) via les utils datetime de `packages/utils`.
4. AUCUN backend prévu au cadrage (le create interne écrit `type` sans validation ; v1 estimates non monté).

## Écarts constatés à l'implémentation / revue

- Ajout d'un template `custom` caché pour TIME : le bouton « start from scratch » exposé par `is_ee:false` résout `templates['custom']` sans garde → crash sinon.
- La revue adversariale (SEC-1) a requalifié le « aucun backend » : sans `TIME` dans `EstimateType`, les lignes créées sont hors enum déclaré et la surface v1/MCP rejette `time` (asymétrie). → enum + validation + montage des routes v1 (fichier d'URLs upstream jamais inclus) + migration state-only 0127.
- COR-1/COR-2 : l'activité `estimate_time` tombait dans un stub CE invisible, et le tooltip du dropdown affichait les minutes brutes.

## Risques identifiés

- Fichier constants partagé entre les 3 systèmes → risque de régression POINTS/CATEGORIES (couvert : diff minimal, typecheck, revue).
- Widget : resync asynchrone nécessaire (update.tsx seed la valeur un render après le mount).
