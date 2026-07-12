# Spec Technique — Vues publiques/privées (views-access)

| Champ      | Valeur              |
|------------|----------------------|
| Module     | api/views-access    |
| Version    | 0.1.0               |
| Date       | 2026-07-12          |
| Statut     | IMPLÉMENTÉ v0.1.0 (2026-07-12) |

---

## Architecture

Déblocage d'une plomberie déjà en place : modèle, migration, queryset de visibilité et gardes d'édition existaient. Le travail = 1 ligne serializer + 2 stubs CE. **Zéro migration.**

## Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `apps/api/plane/app/serializers/view.py` | `access` retiré de `read_only_fields` (LA modification backend) — `is_locked` y reste |
| `apps/web/ce/components/views/access-controller.tsx` | Sélecteur Public/Private (Controller RHF `name="access"` → composant upstream `AccessField` + `VIEW_ACCESS_SPECIFIERS`) |
| `apps/web/ce/components/views/filters/access-filter.tsx` | Facette de filtre par accès (pattern FilterHeader/FilterOption des facettes voisines) |
| `apps/api/plane/tests/contract/app/test_views_access_app.py` | 10 tests |

## Points de contrat

- `IssueViewSerializer` est partagé par les DEUX viewsets (`WorkspaceViewViewSet`, `IssueViewViewSet`) → une seule édition couvre vues projet et workspace.
- Validation : DRF dérive un ChoiceField des choices du modèle (`(0, "Private"), (1, "Public")`) → valeur hors énum = 400 sans code custom.
- Visibilité (préexistante, inchangée) : `get_queryset` filtre `Q(owned_by=user) | Q(access=1)` des deux côtés ; guests restreints à leurs propres vues.
- Garde d'édition (préexistante) : owner-only — 400 (workspace, check explicite) / 403 (projet, `@allow_permission(creator=True)`).
- `AccessController` : prop `control: Control<T extends { access?: EViewAccess }>` — les deux formulaires (projet `IProjectView`, workspace `IWorkspaceView`) compilent sans modification ; valeur émise `EViewAccess.PRIVATE=0 / PUBLIC=1` ; undefined affiché comme Public (aligné sur les DEFAULT_VALUES).
- `FilterByAccess` : consomme les props déjà passées par `filter-selection.tsx:95-103` (`appliedFilters`, `handleUpdate`, `searchQuery`, `accessFilters`).

## Tests

- pytest Docker (10) : create access=0 persisté, toggle owner, refus non-owner (400/403 selon surface), access invalide 400, vue privée cachée aux autres / visible au owner (projet + workspace), `is_locked` non inscriptible (create + patch).
- Navigateur : création « Vue privee test » → POST `access:0` persisté ; facette « Access | Private | Public » rendue ; tsc EXIT=0.

## Pièges connus

- **Mapping inversé** : 0=Private, 1=Public (ne pas « corriger » ce sens).
- Le PATCH par un non-owner renvoie 400 côté workspace mais **403** côté projet (gardes différentes préexistantes) — les tests couvrent les deux.
- Casts délibérés aux frontières CE↔core (`control as unknown as ...`) — pattern identique aux autres composants CE ; à supprimer si le typage core s'élargit.
