# Spec Technique — Relation work item ↔ pages

| Champ   | Valeur              |
|---------|---------------------|
| Module  | api/work-item-pages |
| Version | 0.1.0               |
| Date    | 2026-07-08          |
| Statut  | IMPLÉMENTÉ          |

---

## Modèle de données

Table de jointure **pure**, intra-workspace, sans colonne de permission propre.

```python
# apps/api/plane/db/models/page.py
class IssuePage(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=CASCADE, related_name="workspace_issue_pages")
    project   = models.ForeignKey("db.Project",   on_delete=CASCADE, related_name="project_issue_pages")
    issue     = models.ForeignKey("db.Issue",     on_delete=CASCADE, related_name="issue_pages")
    page      = models.ForeignKey("db.Page",      on_delete=CASCADE, related_name="page_issues")
    # created_by / updated_by / created_at / updated_at / deleted_at hérités de BaseModel (SoftDeleteModel)

    class Meta:
        unique_together = ["issue", "page", "deleted_at"]        # tolère N soft-deletes + 1 actif
        constraints = [UniqueConstraint(
            fields=["issue", "page"],
            condition=Q(deleted_at__isnull=True),
            name="issue_page_unique_issue_page_when_deleted_at_null",
        )]
        db_table = "issue_pages"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["page"],  name="issue_pages_page_id_idx"),
            models.Index(fields=["issue"], name="issue_pages_issue_id_idx"),
        ]
```

- FK vers `Page` (pas `ProjectPage`) — compatible wiki futur. En CE, la page ciblée a toujours un `ProjectPage`.
- Invariant applicatif : `issue.workspace_id == page.workspace_id` (validé en vue, pas en contrainte DB).
- Soft-delete via `SoftDeleteModel` (manager filtre `deleted_at__isnull=True`) — le `detach` est un soft-delete, pas un hard-delete. Cela permet le ré-attachement d'une page précédemment détachée sans violer la contrainte d'unicité partielle.
- Hérite de `BaseModel > AuditModel > SoftDeleteModel`. Le `delete()` de l'instance pose `deleted_at = now()`.
- Exporté dans `apps/api/plane/db/models/__init__.py`.

## API

Deux surfaces distinctes — même logique d'accès, deux classes de vues séparées.

### Interne (app, session-auth) — pour l'UI web

Classe : `IssuePageEndpoint(BaseAPIView)` — `apps/api/plane/app/views/issue/page.py`
Permission : `ProjectEntityPermission`

| Méthode | URL | Comportement |
|---------|-----|--------------|
| GET | `/api/workspaces/:slug/projects/:project_id/issues/:issue_id/issue-pages/` | Renvoie les pages attachées filtrées par `readable_issue_pages` |
| POST | `/api/workspaces/:slug/projects/:project_id/issues/:issue_id/issue-pages/` | Body `{ page_id }` — attache une page ; 404 si page inaccessible/inexistante ; idempotent via `get_or_create` |
| DELETE | `/api/workspaces/:slug/projects/:project_id/issues/:issue_id/issue-pages/:page_id/` | Soft-delete du lien |

Routes déclarées dans `apps/api/plane/app/urls/issue.py`.

### Externe (api v1, token-auth) — surface MCP / API publique

Classes : `WorkItemPageLinkListCreateAPIEndpoint`, `WorkItemPageLinkDetailAPIEndpoint` — `apps/api/plane/api/views/page_link.py`
Permission : `ProjectEntityPermission`
Pagination : activée (`self.paginate(...)`) sur le GET.
OpenAPI : `operation_id` documentés (`list_work_item_pages`, `attach_page_to_work_item`, `detach_page_from_work_item`).

| Méthode | URL | operation_id |
|---------|-----|--------------|
| GET | `/api/v1/workspaces/:slug/projects/:project_id/issues/:issue_id/pages/` | `list_work_item_pages` |
| POST | `/api/v1/workspaces/:slug/projects/:project_id/issues/:issue_id/pages/` | `attach_page_to_work_item` |
| DELETE | `/api/v1/workspaces/:slug/projects/:project_id/issues/:issue_id/pages/:page_id/` | `detach_page_from_work_item` |

Routes déclarées dans `apps/api/plane/api/urls/page_link.py`, incluses dans `apps/api/plane/api/urls/__init__.py`.

### Contrôles d'accès (par opération)

- `list` (GET) : filtrage **par ligne** via `readable_issue_pages(queryset, user)` — helper dans `apps/api/plane/utils/page_access.py`. Ne renvoie jamais une page privée appartenant à quelqu'un d'autre.
- `attach` (POST) : vérifie `can_read_page(user, page)` → 404 si la page est absente ou privée d'un autre utilisateur (non-divulgation d'existence). Vérifie `issue.workspace_id == page.workspace_id` → 400 si cross-workspace.
- `detach` (DELETE) : `ProjectEntityPermission` seule — write sur le work item.

Helper `apps/api/plane/utils/page_access.py` :
- `can_read_page(user, page)` : public ou `owned_by == user` + appartenance active à un projet non archivé.
- `readable_issue_pages(queryset, user)` : même logique en queryset, avec `.distinct()`.

### Sérialisation

`IssuePageSerializer` — `apps/api/plane/app/serializers/page.py` (l. 136).
Champs : `id`, `name`, `logo_props`, `access`, `archived_at`, `project_ids` (SerializerMethodField, liste d'UUID).
Classe légère, indépendante de `PageSerializer`.

## Activité / audit

Les deux surfaces émettent `issue_activity.delay(...)` via `apps/api/plane/bgtasks/issue_activities_task.py` :

| Événement | type |
|-----------|------|
| Attach    | `page.activity.created` |
| Detach    | `page.activity.deleted` |

Différence : l'endpoint interne passe `notification=True` et `origin=base_host(...)` ; l'endpoint externe ne les passe pas.
Idempotence `get_or_create` : si la page est déjà attachée (lien actif), l'activité n'est PAS ré-émise (guard `if created:`).

## Web (apps/web)

- Widget `apps/web/core/components/issues/issue-detail-widgets/pages/`
- Sous-store `apps/web/core/store/issue/issue-details/issue-page.store.ts` + enregistrement dans `root.store.ts`
- Service `apps/web/core/services/issue/issue.service.ts`
- Types dans `packages/types/src/issues/issue.ts`

## Tests

Écrits, non exécutés (pas d'env BDD disponible) :

- `plane/tests/unit/models/test_issue_page_model.py`
- `plane/tests/contract/app/test_issue_pages_app.py`
- `plane/tests/contract/api/test_issue_pages.py`

## État d'implémentation

### Décisions de sécurité documentées

1. **Table sans permission propre** : la table `issue_pages` ne porte aucune colonne de permission. Le filtrage d'accès est délégué entièrement à `can_read_page` / `readable_issue_pages` au moment de la lecture — pas de permission stockée sur la jointure elle-même.
2. **Accès par ligne au read** : le `list` filtre chaque ligne individuellement via `readable_issue_pages`. Un appelant ne peut jamais découvrir qu'une page privée lui est attachée.
3. **Invariant intra-workspace** : validé en vue (`issue.workspace_id != page.workspace_id` → 400) ; pas de contrainte DB (impossible sans FK cross-table coûteuse). Invariant applicatif, pas DB.
4. **Non-divulgation d'existence** : `attach` renvoie 404 (pas 403) pour une page privée d'autrui ou inexistante, évitant l'oracle d'existence.
5. **Unicité soft-delete** : `unique_together(issue, page, deleted_at)` + `UniqueConstraint(issue, page) WHERE deleted_at IS NULL` — pattern identique à `ProjectPage`. Permet le ré-attachement après détachement sans violer l'unicité.

### Reste à faire

- Exécuter les tests pytest dans un environnement avec BDD (`pytest plane/tests/`).
- Vérifier si les outils MCP attendent les routes sous `/work-items/` (alias) plutôt que `/issues/` — si oui, ajouter un alias ou corriger les routes externes.

## Schéma BDD

Migration `0123_issue_pages.py`, chaînée sur `0122_alter_intakeissue_source`.
Création de la table `issue_pages` + 2 index + 1 UniqueConstraint partielle. Aucune donnée à migrer.
