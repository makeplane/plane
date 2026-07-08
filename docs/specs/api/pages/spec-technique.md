# Spec Technique — pages

| Champ         | Valeur              |
|---------------|---------------------|
| Module        | api/pages           |
| Version       | 0.1.0               |
| Date          | 2026-06-30          |
| Source        | Rétro-ingénierie    |

---

## Architecture du module

Le module pages est réparti entre deux applications :

- **`apps/api`** (Django/Python) : gestion CRUD, permissions, versioning, transactions, archivage.
- **`apps/live`** (Express/TypeScript) : collaboration temps réel via Hocuspocus (Y.js/CRDT), persistance binaire, synchronisation des titres.

Les deux services communiquent via l'API REST Django : `apps/live` appelle les endpoints `/api/...pages.../description/` pour lire et écrire le contenu binaire.

### Flux d'écriture

```
Client (éditeur Tiptap)
  │
  ├─ WebSocket → apps/live (Hocuspocus)
  │     │  CRDT merge + debounce 10s
  │     └─ storeDocument → PATCH /api/.../description/
  │                           └─ PageBinaryUpdateSerializer
  │                           └─ page_transaction.delay() [Celery]
  │                           └─ track_page_version.delay() [Celery]
  │
  └─ REST → apps/api (Django)
        └─ PATCH /api/.../pages/{id}/  (métadonnées uniquement)
```

### Flux de lecture

```
Client
  └─ GET /api/.../pages/{id}/description/ → StreamingHttpResponse (octet-stream)
```

---

## Fichiers impactés

| Fichier | Rôle | Lignes |
|---------|------|--------|
| `apps/api/plane/db/models/page.py` | Modèles `Page`, `PageLog`, `PageLabel`, `ProjectPage`, `PageVersion` | ~183 |
| `apps/api/plane/db/models/description.py` | Modèles `Description`, `DescriptionVersion` (pattern triple-format partagé) | ~57 |
| `apps/api/plane/app/views/page/base.py` | ViewSets `PageViewSet`, `PageFavoriteViewSet`, `PagesDescriptionViewSet`, `PageDuplicateEndpoint` | ~640 |
| `apps/api/plane/app/views/page/version.py` | Endpoint `PageVersionEndpoint` (lecture seule) | ~32 |
| `apps/api/plane/app/permissions/page.py` | `ProjectPagePermission` — permission DRF custom | ~126 |
| `apps/api/plane/app/serializers/page.py` | `PageSerializer`, `PageDetailSerializer`, `PageBinaryUpdateSerializer`, `PageVersionSerializer`, `PageVersionDetailSerializer` | ~226 |
| `apps/api/plane/app/urls/page.py` | Routage des 11 endpoints page | ~77 |
| `apps/api/plane/bgtasks/page_transaction_task.py` | Tâche Celery : journalisation des mentions/images dans `PageLog` | ~143 |
| `apps/api/plane/bgtasks/page_version_task.py` | Tâche Celery : création/mise à jour `PageVersion` | ~82 |
| `apps/live/src/controllers/collaboration.controller.ts` | Contrôleur WebSocket `/collaboration/` → délègue à Hocuspocus | ~39 |
| `apps/live/src/extensions/database.ts` | Extension Hocuspocus : `fetchDocument` + `storeDocument` (lecture/écriture binaire via API) | ~141 |
| `apps/live/src/extensions/title-sync.ts` | Extension Hocuspocus : synchronisation du titre Y.js ↔ base de données | ~182 |
| `apps/live/src/hocuspocus.ts` | Singleton `HocusPocusServerManager` — configuration globale (debounce=10s) | ~70 |

---

## Schéma BDD

### Table `pages`

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `id` | UUID (PK) | NOT NULL | Hérité de `BaseModel` |
| `workspace_id` | UUID (FK) | CASCADE | Lien vers `workspaces` |
| `name` | TextField | blank=True | Titre de la page |
| `description_json` | JSONField | default=dict | AST ProseMirror (Tiptap) |
| `description_binary` | BinaryField | nullable | Document Y.js binaire (CRDT) |
| `description_html` | TextField | default="<p></p>" | HTML rendu |
| `description_stripped` | TextField | nullable | Texte brut (calculé au `save()`) |
| `owned_by_id` | UUID (FK) | CASCADE | Propriétaire (`auth_users`) |
| `access` | SmallInt | default=0 | 0=Public, 1=Private |
| `color` | CharField(255) | blank=True | Couleur de la page |
| `parent_id` | UUID (FK self) | nullable, CASCADE | Référence récursive pour sous-pages |
| `archived_at` | DateField | nullable | Date d'archivage |
| `is_locked` | BooleanField | default=False | Verrouillage édition |
| `view_props` | JSONField | default=get_view_props | Propriétés d'affichage (`full_width`) |
| `logo_props` | JSONField | default=dict | Propriétés du logo/emoji |
| `is_global` | BooleanField | default=False | Usage non déterminé (voir zones d'incertitude) |
| `moved_to_page` | UUIDField | nullable | UUID destination (déplacement, non implémenté) |
| `moved_to_project` | UUIDField | nullable | UUID projet destination (non implémenté) |
| `sort_order` | FloatField | default=65535 | Ordre d'affichage |
| `external_id` | CharField(255) | nullable | ID source externe (import) |
| `external_source` | CharField(255) | nullable | Nom source externe |
| `created_at`, `updated_at`, `created_by_id`, `updated_by_id`, `deleted_at` | Hérités de `BaseModel` | | |

### Table `project_pages` (Many-to-Many Page ↔ Project)

| Colonne | Type | Contrainte |
|---------|------|------------|
| `id` | UUID (PK) | |
| `project_id` | UUID (FK) | CASCADE |
| `page_id` | UUID (FK) | CASCADE |
| `workspace_id` | UUID (FK) | CASCADE |
| `deleted_at` | DateTimeField | nullable |

Contrainte unique : `(project_id, page_id)` WHERE `deleted_at IS NULL`.

### Table `page_versions`

| Colonne | Type |
|---------|------|
| `id` | UUID (PK) |
| `workspace_id` | UUID (FK) |
| `page_id` | UUID (FK) |
| `last_saved_at` | DateTimeField |
| `owned_by_id` | UUID (FK) |
| `description_binary` | BinaryField (nullable) |
| `description_html` | TextField |
| `description_json` | JSONField |
| `description_stripped` | TextField (nullable) |
| `sub_pages_data` | JSONField (default=dict) |

Règle applicative : maximum 20 versions par page (la plus ancienne est supprimée).

### Table `page_logs`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID (PK) | |
| `transaction` | UUID | ID du composant dans le HTML (mention/image) |
| `page_id` | UUID (FK) | |
| `entity_identifier` | UUID (nullable) | ID de l'entité référencée |
| `entity_name` | CharField(30) | Type de composant (mention-component, image-component) |
| `entity_type` | CharField(30) (nullable) | Sous-type |
| `workspace_id` | UUID (FK) | |

Index : `(entity_type)`, `(entity_identifier)`, `(entity_name)`, `(entity_type, entity_identifier)`, `(entity_name, entity_identifier)`.
Contrainte unique : `(page_id, transaction)`.

### Table `page_labels` (Many-to-Many Page ↔ Label)

| Colonne | Type |
|---------|------|
| `label_id` | UUID (FK) |
| `page_id` | UUID (FK) |
| `workspace_id` | UUID (FK) |

---

## API / Endpoints

Préfixe : `/api/workspaces/<slug>/projects/<project_id>/`

| Méthode | Route | Description | Auth/Permission |
|---------|-------|-------------|-----------------|
| GET | `pages-summary/` | Agrégat : comptage pages public/privées/archivées | ProjectPagePermission |
| GET | `pages/` | Liste des pages du projet (top-level uniquement, hors archivées) | ProjectPagePermission |
| POST | `pages/` | Créer une page | ADMIN ou MEMBER |
| GET | `pages/<page_id>/` | Détail d'une page (avec issue_ids du PageLog) | ProjectPagePermission |
| PATCH | `pages/<page_id>/` | Mettre à jour les métadonnées d'une page | ProjectPagePermission |
| DELETE | `pages/<page_id>/` | Supprimer une page archivée | Propriétaire ou ADMIN |
| POST | `favorite-pages/<page_id>/` | Ajouter aux favoris | ADMIN ou MEMBER |
| DELETE | `favorite-pages/<page_id>/` | Retirer des favoris | ADMIN ou MEMBER |
| POST | `pages/<page_id>/archive/` | Archiver (cascade sur sous-pages) | Propriétaire ou ADMIN |
| DELETE | `pages/<page_id>/archive/` | Désarchiver | Propriétaire ou ADMIN |
| POST | `pages/<page_id>/lock/` | Verrouiller la page | ProjectPagePermission |
| DELETE | `pages/<page_id>/lock/` | Déverrouiller la page | ProjectPagePermission |
| POST | `pages/<page_id>/access/` | Changer public/privé | Propriétaire uniquement |
| GET | `pages/<page_id>/description/` | Télécharger le binaire Y.js (StreamingHttpResponse octet-stream) | Propriétaire ou Public |
| PATCH | `pages/<page_id>/description/` | Mettre à jour binaire+HTML+JSON (chemin live) | Propriétaire ou Public, non archivée, non verrouillée |
| GET | `pages/<page_id>/versions/` | Lister les versions (sans contenu) | ProjectPagePermission |
| GET | `pages/<page_id>/versions/<pk>/` | Détail d'une version (avec contenu complet) | ProjectPagePermission |
| POST | `pages/<page_id>/duplicate/` | Dupliquer la page dans tous ses projets | ProjectPagePermission |

**WebSocket** : `ws://live-host/collaboration/` — connexion Hocuspocus (gérée par `CollaborationController`).

---

## Patterns identifiés

- **Triple format de contenu** : `description_json` + `description_html` + `description_binary` stockés simultanément. Décision couverte par RETRO-031 (partagé avec `api/issues`).
- **Streaming HTTP pour le binaire** : `PagesDescriptionViewSet.retrieve` retourne un `StreamingHttpResponse` (`application/octet-stream`) plutôt qu'une réponse JSON pour éviter la sérialisation du binaire.
- **SQL récursif (CTE)** : l'archivage/désarchivage en cascade utilise une CTE PostgreSQL via `connection.cursor()` direct (hors ORM), nécessaire pour la récursivité sur `parent_id`.
- **Debounce côté serveur Hocuspocus** : `debounce=10000ms` configuré dans `HocusPocusServerManager`. La sauvegarde ne déclenche pas de requête HTTP à chaque frappe.
- **Fallback HTML → binaire** : si le document n'a pas encore de `description_binary` (ancienne page), `fetchDocument` convertit le HTML en binaire Y.js via `@plane/editor` et sauvegarde le résultat immédiatement.
- **Migration de titre à la demande** : `TitleSyncExtension.onLoadDocument` migre les titres non encore présents dans le fragment CRDT `"title"` en les injectant depuis l'API Django.
- **Versioning avec fenêtre temporelle** : `track_page_version` met à jour la version existante du même utilisateur si elle date de moins de 10 minutes, créant sinon une nouvelle version.
- **PageLog diff incrémental** : `page_transaction` compare les composants de l'ancien et du nouveau HTML en un seul passage BeautifulSoup (single-pass), insère les nouveaux et supprime les absents.
- **Singleton Hocuspocus** : `HocusPocusServerManager` est un singleton pour garantir une instance unique du serveur CRDT par processus Node.

---

## Décisions techniques documentées ici (non promues en ADR)

- **Validation du binaire en entrée** : `PageBinaryUpdateSerializer` décode le base64, valide le binaire Y.js via `validate_binary_data`, et sanitize le HTML via `validate_html_content` avant persistance. Ce niveau de validation est une heuristique d'implémentation (AP-3) ; aucun ADR créé.
- **Plafond de 20 versions** : la limite de 20 versions par page est un choix de configuration produit (suppression FIFO de la plus ancienne). Décision locale à une seule tâche, pas transverse.
- **`debounce=10000ms`** : configuration du serveur Hocuspocus. Valeur ajustable sans impact architectural transverse.
- **Tri `is_favorite DESC, created_at DESC`** : convention d'affichage API, non-architecturale (AP-6).
- **`content_too_large` (HTTP 413) force-close** : traitement d'erreur local à `database.ts` — forçage de la fermeture des connexions WebSocket en cas de payload trop grand. Workaround local (AP-4).

---

## Tests existants

| Fichier | Ce qu'il teste | Statut |
|---------|---------------|--------|
| Aucun fichier de tests spécifique pages trouvé dans `apps/api/plane/tests/` | — | Absent |
| `apps/live/src/*.test.ts` | Tests unitaires sur les extensions live (2 fichiers Vitest) | Partiels — non spécifiques aux pages |

> Absence de tests dédiés à la feature pages côté API Django. Le comportement est couvert indirectement par les tests de contrat généraux.
