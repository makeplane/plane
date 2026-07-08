# RETRO-031 — Stockage triple format JSON+HTML+Binary pour les descriptions riches

| Champ      | Valeur                                  |
|------------|-----------------------------------------|
| Statut     | Documenté (rétro)                       |
| Date       | 2026-06-30                              |
| Source     | Rétro-ingénierie                        |
| Features   | issues, pages, intake                   |
| App        | api                                     |

## Justification (politique ADR v2.3.0)

| Champ | Valeur |
|-------|--------|
| Catégorie | DATA-MODEL |
| Q1 — Coût de revert > 1j ? | OUI — migrer hors du triple format impose de modifier le schéma de `issues`, `issue_comments`, `issue_description_versions`, `descriptions`, `description_versions`, `pages` (6 tables), tous les serializers associés, le serveur `apps/live` (qui lit/écrit `description_binary` Y.js), et les clients front qui consomment `description_json` pour l'éditeur Tiptap. Refactoring transverse multi-app, estimé à plusieurs semaines. |
| Q2 — Non-déductible du code ? | OUI — la coexistence des trois formats reflète une intention architecturale non visible dans `requirements/base.txt` : HTML pour lecture rapide sans désérialisation, JSON ProseMirror pour l'éditeur Tiptap, binaire Y.js pour la réconciliation CRDT temps réel. Cette séparation de responsabilités n'est pas lisible depuis les dépendances seules. |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — au minimum `api/issues`, `api/pages`, `api/intake` (via `IntakeIssue → Issue`). Le modèle `Description` partagé (table `descriptions`) est utilisé par `IssueComment` et potentiellement par d'autres entités futures. |
| Q4 — Casse un invariant si ignoré ? | OUI — un dev qui mettrait à jour `description_html` sans mettre à jour `description_binary` casse la réconciliation Y.js dans `apps/live` (le CRDT diverge du HTML enregistré). Un dev qui ignorerait `description_json` casse le rechargement de l'éditeur Tiptap côté front. |

> Validé contre la politique `.claude/rules/06-adr-policy.md`.

## Contexte

L'éditeur riche de Plane est Tiptap (bibliothèque ProseMirror-based), avec une couche de collaboration temps réel Y.js gérée par le serveur `apps/live` (Hocuspocus). Trois usages distincts nécessitent trois représentations différentes du même contenu :

1. **Lecture API** : renvoyer du HTML prêt à afficher sans désérialisation côté client.
2. **Édition Tiptap** : l'éditeur consomme le format ProseMirror JSON pour reconstruire l'arbre de nœuds.
3. **Collaboration temps réel** : Hocuspocus synchronise des documents Y.js en binaire (CRDT). Ce format est la source de vérité pour la collab ; les autres formats en sont des projections.

La décision a été prise de stocker les trois représentations simultanément dans la base, plutôt que de recalculer les projections à la lecture.

## Décision identifiée

Tous les modèles portant un contenu riche (`Issue`, `IssueComment`, `IssueDescriptionVersion`, `Description`, `DescriptionVersion`) stockent **simultanément** :

- `description_json` (`JSONField`) — AST ProseMirror
- `description_html` (`TextField`) — HTML rendu
- `description_binary` (`BinaryField`, nullable) — document Y.js binaire
- `description_stripped` (`TextField`, nullable) — texte brut (strip_tags sur HTML)

Les quatre champs sont écrits ensemble lors de chaque sauvegarde. `description_stripped` est toujours calculé depuis `description_html` (via `strip_tags`) dans le `save()` des modèles concernés.

Le modèle `Description` (table `descriptions`) est partagé entre `IssueComment` (relation OneToOne) et potentiellement d'autres entités. `DescriptionVersion` en est l'historique.

## Conséquences observées

### Positives

- Lecture API rapide : `description_html` est directement sérialisable sans calcul.
- Séparation claire des responsabilités entre l'API REST (JSON/HTML) et le serveur de collab (binaire).
- `description_stripped` permet une recherche fulltext sans parser l'HTML.
- Le binaire Y.js est nullable : les issues créées via API sans passer par l'éditeur Tiptap ont `description_binary = NULL` sans erreur.

### Négatives / Dette

- Risque de désynchronisation entre les quatre champs si une mise à jour ne passe pas par le chemin standard (ex : migration directe SQL, import externe).
- Espace disque multiplié par 3-4 pour les contenus riches volumineux.
- Toute nouvelle entité portant un contenu riche doit répliquer ce pattern de quatre champs.
- Le champ `description_stripped` est recalculé à chaque `save()` même si `description_html` n'a pas changé — overhead systématique.

## Recommandation

**Garder.** Le triple format est structurellement couplé au serveur de collaboration Y.js. Toute simplification nécessiterait de revoir l'architecture de `apps/live`. Si le volume de données devient problématique, envisager de déplacer `description_binary` vers un stockage objet S3 (déjà disponible dans la stack) plutôt que PostgreSQL BinaryField.
