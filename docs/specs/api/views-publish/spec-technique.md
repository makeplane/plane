# Spec Technique — Publication de vues

| Champ      | Valeur            |
|------------|--------------------|
| Module     | api/views-publish |
| Version    | 0.1.0             |
| Date       | 2026-07-07        |
| Statut     | IMPLÉMENTÉ v0.1.0 (2026-07-07) |

---

## Architecture

Extension du pipeline anchor/deploy existant (utilisé pour les boards projet publiés sur space) au cas « vue ». Trois volets : API (publish), space (rendu public SSR), web (UI).

## Fichiers concernés

### API (apps/api)

| Fichier | Rôle |
|---------|------|
| `plane/db/models/` (DeployBoard ou équivalent anchor) | Vérifier le modèle existant de publication par anchor et son champ `entity_name`/`entity_identifier` — probablement extensible à `view` sans nouvelle table |
| `plane/app/views/view/base.py` | Ajouter publish/unpublish sur une vue |
| `plane/space/` | Vues publiques : ajouter la lecture d'une vue publiée par anchor |

### Web (apps/web)

| Fichier | Rôle | État CE actuel |
|---------|------|----------------|
| `apps/web/ce/components/views/publish/modal.tsx` | `PublishViewModal` | stub `<></>` |
| `apps/web/ce/components/views/publish/use-view-publish.tsx` | Hook | retourne `{ isPublishModalOpen: false, ... }` désactivé |

### Space (apps/space)

| Fichier | Rôle | État CE actuel |
|---------|------|----------------|
| `apps/space/app/routes.ts` | Routes publiques | 3 routes CE seulement — ajouter `views/:anchor` |

## Schéma BDD

À confirmer : si le modèle anchor existant (DeployBoard) accepte une entité `view`, aucune migration ; sinon migration d'extension d'enum/contrainte.

## API

- Nouveau : `POST/DELETE /api/workspaces/:slug/projects/:projectId/views/:viewId/publish/` + `GET /api/public/anchor/:anchor/views/...` côté space.

## Tests

- pytest : publish/unpublish, accès anonyme par anchor, révocation, non-fuite des données hors périmètre de la vue.
- space : rendu SSR de la route publique.

---

## État d'implémentation (2026-07-07)

Implémenté (API + space + web), vérifié statiquement (ruff, py_compile ; typecheck web + space OK). Test `tests/contract/app/test_view_publish_app.py` écrit (chemins legacy `filters` ET `rich_filters`, non-fuite, permissions) — **non exécuté** (pas d'env BDD).

Fichiers : `plane/app/views/view/{publish.py,base.py}`, `plane/app/serializers/view.py`, `plane/app/urls/views.py`, `plane/space/views/{view.py,issue.py}`, `plane/space/urls/view.py`, `packages/types/src/publish.ts`, `packages/services/src/view/*`, `apps/web/core/services/view.service.ts`, `apps/web/ce/components/views/publish/*`, `apps/space/app/views/[anchor]/*`.

### Décision de sécurité (spec-technique, hors ADR — invariant confiné au module views/space, cf. politique 06)

**Application serveur des filtres de la vue publiée — fail-closed.** Les endpoints publics (`ProjectIssuesPublicEndpoint`, `IssueRetrievePublicEndpoint`) appliquent les `rich_filters` de la vue via le même `ComplexFilterBackend`/`IssueFilterSet` que l'endpoint membre (helper `apply_published_view_filters`), avec repli sur le champ legacy `query` pour les vues anciennes. **Invariant** : un visiteur anonyme ne voit jamais d'issue hors du périmètre filtré de la vue. Si un filtre stocké est inapplicable, le queryset est **vidé** (`.none()`) plutôt que de fuiter. Un `filters` en query param ne peut que restreindre (AND), jamais élargir.
> Régression corrigée : la V1 initiale filtrait sur `query` seul (jamais renseigné par l'UI actuelle qui écrit `rich_filters`) → exposition anonyme de tout le backlog. Corrigé + test de régression `test_public_issues_respect_rich_filters`.

**Nettoyage à la suppression.** `IssueViewViewSet.destroy` supprime le `DeployBoard` `entity_name="view"` associé (pas de FK, donc pas de cascade) → l'anchor public ne survit pas à la suppression de la vue.

**Permissions.** publish/unpublish réservés à l'ADMIN projet (API) ; l'UI n'expose l'action « Publish » et le badge « Live » cliquable qu'aux admins.

### Reste à faire / points ouverts
- Exécuter pytest sur env BDD.
- V1 : vues **projet** uniquement (pas workspace) ; commentaires/réactions/votes non exposés ; layouts publics limités à list/kanban (une vue calendar s'affiche en list) ; re-publication après dépublication génère un nouvel anchor.
