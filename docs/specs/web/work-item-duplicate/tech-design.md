# Tech Design — Duplication de work item

> Intention technique avant implémentation. À valider avant /superpowers:write-plan.

## Approche pressentie

1. `createCopyMenuWithDuplication` : transformer l'item de menu « Copy » en sous-menu { Copy link, Duplicate }.
2. `DuplicateWorkItemModal` : sélecteur de projet cible + options (labels, assignés, sous-items) ; à la confirmation, lire l'item source depuis le store MobX et appeler `issueService.create` sur le projet cible avec le mapping des champs.
3. Mapping inter-projets : état par défaut du projet cible si l'état source n'existe pas ; labels par nom si présents, sinon ignorés (V1).

## Points ouverts

- Cloner les sous-items (children) en V1 ou non ?
- Préfixer le titre (« Copy of … ») comme le fait Plane EE ?

## Risques

- Faible. Attention au triple format description (RETRO-031) : ne poster que `description_html`.
