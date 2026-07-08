# Tech Design — Publication de vues

> Intention technique avant implémentation. À valider avant /superpowers:write-plan.

## Approche pressentie

1. **Reco préalable** : lire le modèle DeployBoard/anchor existant (publication de boards projet) et confirmer qu'il porte un couple `entity_name`/`entity_identifier` généralisable à `view`.
2. **API** : endpoints publish/unpublish sur ViewViewSet (génération d'anchor, permission ADMIN projet) + endpoint public space (issues de la vue avec les filtres figés de la vue, serializers publics existants).
3. **Web** : remplir `use-view-publish` (état modal + entrée de menu contextuelle) et `PublishViewModal` (toggle publish, URL copiable `SPACE_BASE_URL/views/:anchor`).
4. **Space** : route SSR `views/:anchor` réutilisant les composants du board public (layouts spreadsheet/kanban readonly).

## Points ouverts

- Les filtres de la vue sont-ils évalués au moment de la requête publique (dynamique) ou figés à la publication ?
- Réutiliser les réglages du deploy board (commentaires/votes/réactions) ou les omettre en V1 ?

## Risques

- Moyen : surface publique → revue sécurité indispensable (fuite de données hors filtre, XSS — appliquer RETRO-101).
