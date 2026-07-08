# Spec Fonctionnelle — pages [DRAFT — à valider par le dev]

| Champ      | Valeur              |
|------------|---------------------|
| Module     | api/pages           |
| Version    | 0.1.0               |
| Date       | 2026-06-30          |
| Auteur     | retro-documenter    |
| Statut     | DRAFT               |
| Source     | Rétro-ingénierie    |

> **[DRAFT — à valider par le dev]** Cette spec a été générée par rétro-ingénierie
> à partir du code existant. Elle doit être relue et validée par un développeur
> qui connaît le contexte métier.

---

## ADRs

| ADR | Titre | Statut |
|-----|-------|--------|
| [RETRO-031](../../../adr/RETRO-031-triple-format-description-storage.md) | Stockage triple format JSON+HTML+Binary pour les descriptions riches | Documenté (rétro) |
| [RETRO-061](../../../adr/RETRO-061-pages-cross-project-many-to-many.md) | Partage cross-projet des pages via relation many-to-many ProjectPage | Documenté (rétro) |

> *Table auto-générée par adr-linker. Ne pas éditer manuellement.*

---

## Contexte et objectif

Le module `api/pages` implémente un système de wiki/documentation collaboratif intégré à Plane. Une page est un document riche (Tiptap/ProseMirror) attaché à un workspace et partageable entre plusieurs projets. L'édition est collaborative et temps réel via Y.js/CRDT sur le serveur `apps/live`. La feature s'intègre à l'écosystème Plane (favoris, visites récentes, labels) et supporte l'archivage, le verrouillage, les sous-pages et la duplication.

---

## Règles métier (déduites du code)

1. **Propriétaire unique** : chaque page a un `owned_by` immuable à la création. Seul le propriétaire ou un ADMIN peut changer le niveau d'accès de la page, l'archiver, la désarchiver ou la supprimer.

2. **Accès PUBLIC/PRIVATE** : une page est soit publique (`access=0`, visible par tout membre actif du projet), soit privée (`access=1`, visible uniquement par son propriétaire). Seul le propriétaire peut modifier l'accès.

3. **Verrouillage** : une page verrouillée (`is_locked=True`) refuse toute mise à jour de son contenu binaire (description). Tout ADMIN ou MEMBER peut poser/lever un verrou.

4. **Archivage cascade** : l'archivage d'une page archive récursivement toutes ses sous-pages via une requête SQL récursive (CTE). La désarchivage d'une sous-page dont le parent est archivé détache la sous-page de son parent (parent mis à NULL).

5. **Suppression conditionnelle** : une page ne peut être supprimée que si elle est préalablement archivée. La suppression détache les sous-pages (parent = NULL), supprime les favoris et les visites récentes associées.

6. **Partage cross-projet** : une page appartient au workspace, pas à un seul projet. Elle est liée à un ou plusieurs projets via la table `project_pages` (many-to-many). La duplication reproduit la page dans tous les projets d'origine.

7. **Historique de versions** : toute modification du contenu déclenche en tâche de fond (`track_page_version`) la création ou la mise à jour d'une `PageVersion`. La même version est mise à jour si elle appartient au même utilisateur et a été modifiée dans les 10 minutes (600 secondes). Le nombre de versions est plafonné à 20 par page (la plus ancienne est supprimée au dépassement).

8. **Journal de transactions (PageLog)** : chaque création ou modification de contenu déclenche en tâche de fond (`page_transaction`) l'extraction des composants HTML (mentions, images) et leur journalisation dans `PageLog`. Les composants supprimés du contenu sont retirés du journal.

9. **Titre stocké dans le Y.js binaire** : le titre de la page est synchronisé dans le fragment Y.js `"title"` du document. `TitleSyncExtension` migre les anciens titres à l'ouverture (si le champ `"title"` est vide dans le CRDT) et synchronise les modifications en base avec un debounce ; un `forceSave` est déclenché avant le déchargement du document.

10. **Restriction GUEST** : un utilisateur avec le rôle GUEST ne peut voir que ses propres pages si la feature `guest_view_all_features` est désactivée au niveau du projet.

11. **Duplication** : la duplication d'une page privée n'est accessible qu'au propriétaire. Le binaire Y.js est effacé sur la copie (champ `description_binary = None`), ce qui force le serveur de collab à régénérer le binaire à partir du HTML au premier accès. Les assets S3 sont copiés de façon asynchrone.

12. **Tri favori en premier** : la liste des pages est triée par `is_favorite DESC, created_at DESC` pour placer les pages favorites en tête.

---

## Cas d'usage (déduits)

### CU-001 — Créer une page dans un projet

Un MEMBER ou ADMIN crée une page dans un projet. Le contenu initial (JSON, HTML, binaire) est fourni à la création. La page est automatiquement liée au projet via `ProjectPage`. Les mentions présentes dans le HTML sont journalisées de façon asynchrone via `page_transaction`.

### CU-002 — Éditer le contenu collaborativement

Un ou plusieurs utilisateurs connectés via WebSocket au serveur `apps/live` éditent simultanément le contenu. Hocuspocus synchronise les deltas CRDT. À chaque sauvegarde (`debounce=10s`), `storeDocument` écrit les trois formats (binaire, HTML, JSON) via l'API Django (`PATCH /description/`). `track_page_version` crée ou met à jour une version en arrière-plan.

### CU-003 — Verrouiller/déverrouiller une page

Un MEMBER ou ADMIN pose un verrou sur une page. Toute tentative de mise à jour du contenu binaire renvoie `PAGE_LOCKED`. Le verrou est levable de la même façon.

### CU-004 — Archiver une page et ses sous-pages

Le propriétaire ou un ADMIN archive une page. Toutes les sous-pages sont archivées en cascade (SQL récursif). Les favoris de la page archivée sont supprimés. La page n'est plus listée dans les pages actives.

### CU-005 — Désarchiver une sous-page orpheline

Un utilisateur désarchive une sous-page dont le parent est archivé. La sous-page est détachée de son parent (parent mis à NULL) avant d'être désarchivée, préservant son accès sans réarchiver automatiquement.

### CU-006 — Supprimer une page archivée

Seul le propriétaire ou un ADMIN peut supprimer une page déjà archivée. Les sous-pages sont détachées (parent = NULL), les favoris et visites récentes sont supprimés.

### CU-007 — Dupliquer une page

Un utilisateur duplique une page publique (ou une page privée dont il est propriétaire). La copie est créée dans tous les projets de la page d'origine, avec le binaire Y.js réinitialisé et les assets S3 copiés de façon asynchrone.

### CU-008 — Consulter l'historique des versions

Un utilisateur liste les versions d'une page (`GET /versions/`). Il peut consulter le contenu complet (HTML, JSON, binaire) d'une version spécifique pour restauration manuelle.

---

## Dépendances

- `apps/api` — Django + DRF : modèles `Page`, `PageLog`, `PageLabel`, `PageVersion`, `ProjectPage`, `UserFavorite`, `UserRecentVisit`, `ProjectMember`, `Project`
- `apps/live` — Hocuspocus + Y.js : collaboration temps réel, persistance du binaire, synchronisation des titres
- `@plane/editor` — conversion binaire ↔ HTML ↔ JSON côté live
- Celery (workers) — tâches `page_transaction`, `track_page_version`, `recent_visited_task`, `copy_s3_objects_of_description_and_assets`
- Redis/Valkey — broker Celery + extension `@hocuspocus/extension-redis` pour la synchronisation multi-instance du serveur live
- S3/MinIO — stockage des assets embarqués dans les pages
- `UserFavorite` — système de favoris transverse (api/workspaces)
- `UserRecentVisit` — historique de navigation transverse

---

## Zones d'incertitude

> Les points suivants n'ont pas pu être déterminés par le code seul :
- **Intentionnalité du `is_global`** : le champ `is_global` existe sur `Page` mais aucune vue ne l'utilise explicitement dans la base de code analysée. Son rôle exact (pages workspace-wide, sans projet ?) nécessite validation.
- **Restauration de version** : l'API expose les versions en lecture seule. Un mécanisme de restauration (réécrire le contenu depuis une version) n'est pas visible dans le code ; il existe peut-être côté front ou est absent.
- **Limite de taille du document** : le code gère une erreur HTTP 413 ("content too large") côté live mais la limite exacte n'est pas visible dans ce code source.
- **`moved_to_page` / `moved_to_project`** : ces champs existent sur `Page` mais aucune vue n'y écrit. Ils semblent prévus pour un mécanisme de déplacement cross-projet non encore implémenté.
- **`external_id` / `external_source`** : champs présents sur `Page`, probablement pour une intégration d'import (GitHub, Notion ?), sans usage visible dans les vues analysées.
