# Tech Design — Pages imbriquées (nested pages)

> Intention technique avant implémentation. À valider avant /superpowers:write-plan.

## Approche pressentie

1. **API** : ajouter `SubPageViewSet`/endpoint `sub-pages/` (enfants directs, mêmes permissions que le detail de la page parente) ; ajouter la validation anti-cycle sur `parent` dans le serializer ; remplir `sub_pages` dans `page_version_task` (dict `{id: {name, archived_at}}` en parcourant `child_page`).
2. **Web** : étendre le navigation-pane en arbre (expand/collapse par page, lazy load des enfants via le nouvel endpoint) ; action « New sub-page » dans le menu contextuel d'une page (create + `parent` renseigné) ; breadcrumb du parent dans le header de page.
3. Laisser le list racine filtré (`parent__isnull=True`) — l'arbre se déplie à la demande.

## Points ouverts

- Représentation de `sub_pages_data` : snapshot plat des enfants directs ou arbre complet ?
- Droits : un enfant peut-il être `public` si le parent est `private` ?
- Interaction RETRO-061 (M2M projets) : contraindre parent et enfant au même projet en V1 ?

## Risques

- Moyen : toucher au list pages (régression possible sur l'UI existante) ; anti-cycle indispensable (sinon récursion infinie dans la cascade SQL).
