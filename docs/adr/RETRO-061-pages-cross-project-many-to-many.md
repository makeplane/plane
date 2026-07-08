# RETRO-061 — Partage cross-projet des pages via relation many-to-many ProjectPage

| Champ      | Valeur              |
|------------|---------------------|
| Statut     | Documenté (rétro)   |
| Date       | 2026-06-30          |
| Source     | Rétro-ingénierie    |
| Features   | pages               |

## Justification (politique ADR v2.3.0)

| Champ | Valeur |
|-------|--------|
| Catégorie | DATA-MODEL |
| Q1 — Coût de revert > 1j ? | OUI — revenir à une FK projet unique sur `Page` imposerait de modifier le schéma (`pages` + `project_pages`), tous les serializers (`PageSerializer`, `PageDetailSerializer`, `PageDuplicateEndpoint`), les vues (list/retrieve/duplicate/archive), les permissions (`ProjectPagePermission` qui filtre sur `projects__id`), et le front qui consomme `project_ids`. Refactoring transverse multi-couches estimé à plusieurs jours. |
| Q2 — Non-déductible du code ? | OUI — l'existence de `project_pages` comme table de liaison (et non d'une simple FK `project_id` sur `Page`) reflète une intention architecturale : une page est une ressource workspace, partageable entre projets, non possédée par un seul projet. Cette intention n'est pas lisible depuis `requirements/base.txt`. |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — au moins : `api/pages` (feature principale), `web/favorites-stickies` (les favoris de type "page" doivent fonctionner quelle que soit la liste de projets), `api/workspaces` (agrégat workspace-level des pages requiert le join via `project_pages`). |
| Q4 — Casse un invariant si ignoré ? | OUI — un dev qui ajouterait une FK directe `project_id` sur `Page` en pensant qu'une page est mono-projet casserait le partage existant : les pages déjà liées à plusieurs projets perdraient leurs liaisons. La contrainte unique conditionnelle `(project_id, page_id) WHERE deleted_at IS NULL` serait également violée. |

> Validé contre la politique `.claude/rules/06-adr-policy.md`.

## Contexte

Dans Plane, une page est un document de type wiki attaché au workspace, pas à un projet spécifique. La décision a été prise de permettre à une même page d'être accessible depuis plusieurs projets simultanément, ce qui nécessite une relation many-to-many entre `Page` et `Project`.

## Décision identifiée

Le modèle `Page` n'a pas de FK directe vers `Project`. La relation est portée par la table de liaison `ProjectPage` (champ `projects = ManyToManyField("db.Project", through="db.ProjectPage")`).

La table `project_pages` a une contrainte unique conditionnelle : `UNIQUE (project_id, page_id) WHERE deleted_at IS NULL`, ce qui permet le soft-delete sur la liaison (une page peut être retirée d'un projet sans être supprimée du workspace).

Les vues filtrent systématiquement sur `projects__id=project_id` et `project_pages__deleted_at__isnull=True` pour isoler les pages d'un projet donné.

La duplication d'une page (`PageDuplicateEndpoint`) crée automatiquement une entrée `ProjectPage` pour chacun des projets d'origine, préservant le partage multi-projet sur la copie.

## Conséquences observées

### Positives

- Une page créée dans un projet peut être rendue visible dans d'autres projets du même workspace sans dupliquer le contenu.
- Le soft-delete sur `ProjectPage` permet de "retirer" une page d'un projet sans la supprimer du workspace.
- La contrainte unique conditionnelle préserve l'intégrité même avec du soft-delete.

### Négatives / Dette

- Les requêtes de liste des pages font un JOIN supplémentaire (`project_pages`) par rapport à une FK directe, avec un `DISTINCT` nécessaire.
- La permission `ProjectPagePermission` doit filtrer sur `projects__project_projectmember__member` et `project_pages__deleted_at__isnull=True` simultanément, ce qui alourdit les requêtes.
- La sémantique du "propriétaire" reste mono-utilisateur (`owned_by`) même si la page est partagée multi-projet — potentielle source de confusion sur qui peut modifier l'accès.

## Recommandation

**Garder.** Le many-to-many est structurellement nécessaire pour le partage cross-projet. Si les performances de listing deviennent un problème, envisager un index partiel sur `project_pages(project_id, page_id)` WHERE `deleted_at IS NULL` (déjà couvert par la contrainte unique mais peut bénéficier d'un index dédié pour les SELECTs).
