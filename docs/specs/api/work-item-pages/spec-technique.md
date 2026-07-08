# Spec Technique — Relation work item ↔ pages

| Champ   | Valeur              |
|---------|---------------------|
| Module  | api/work-item-pages |
| Version | 0.1.0               |
| Date    | 2026-07-08          |
| Statut  | PLAN — à valider    |

---

## Modèle de données

Nouvelle table de jointure **pure**, intra-workspace, sans permission.

```python
# apps/api/plane/db/models/page.py (ou issue.py)
class IssuePage(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=CASCADE, related_name="workspace_issue_pages")
    project   = models.ForeignKey("db.Project",   on_delete=CASCADE, related_name="project_issue_pages")  # projet du work item
    issue     = models.ForeignKey("db.Issue",     on_delete=CASCADE, related_name="issue_pages")
    page      = models.ForeignKey("db.Page",      on_delete=CASCADE, related_name="page_issues")
    # created_by / created_at / updated_at hérités de BaseModel
    class Meta:
        unique_together = ["issue", "page"]
        db_table = "issue_pages"
        indexes = [models.Index(fields=["page"]), models.Index(fields=["issue"])]
```

- FK vers `Page` (pas `ProjectPage`) → compatible wiki futur. En CE, la page ciblée a toujours un `ProjectPage`.
- Invariant applicatif : `issue.workspace_id == page.workspace_id` (validé au serializer, pas en contrainte DB).
- Soft-delete cohérent avec le reste (BaseModel + manager) — cf. RETRO-032.

## API

Deux surfaces, même logique (une classe de service partagée pour éviter la duplication) :

### Interne (app, session-auth) — pour l'UI web
- `GET    /api/workspaces/:slug/projects/:project_id/issues/:issue_id/issue-pages/`
- `POST   /api/workspaces/:slug/projects/:project_id/issues/:issue_id/issue-pages/`  body `{ page_id }`
- `DELETE /api/workspaces/:slug/projects/:project_id/issues/:issue_id/issue-pages/:page_id/`

### Externe (api v1, token-auth) — pour le MCP
- `GET    /api/v1/workspaces/:slug/projects/:project_id/issues/:issue_id/pages/`      → `list_work_item_pages`
- `POST   /api/v1/workspaces/:slug/projects/:project_id/issues/:issue_id/pages/`      → `attach_page_to_work_item`  body `{ page_id }`
- `DELETE /api/v1/workspaces/:slug/projects/:project_id/issues/:issue_id/pages/:page_id/` → `detach_page_from_work_item`

> L'API externe (`apps/api/plane/api/`) n'a **aucun** endpoint page aujourd'hui : ces routes sont entièrement nouvelles. C'est ce qui rend les outils MCP opérants sur l'instance CE.

### Contrôles d'accès (par opération)
- `attach` : `ProjectEntityPermission` write sur le work item + lecture effective de la page (`Q(owned_by=user) | Q(access=PUBLIC)` + appartenance projet). Refus 400/403 sans divulguer l'existence.
- `detach` : write sur le work item.
- `list` : filtrage **par ligne** des pages selon la visibilité pour le demandeur (ne jamais renvoyer une page privée d'autrui).
- Validation `issue.workspace == page.workspace` sinon 400.

### Sérialisation
- `IssuePageSerializer` renvoie la page « allégée » (id, name, logo_props, project_ids, access, archived_at) — réutiliser `PageSerializer` réduit.

## Activité / audit

- Émettre `issue_activity` sur `attach` (verb « created », field « page ») et `detach` (verb « deleted ») via le pipeline existant (`plane/bgtasks/issue_activity_task` ou équivalent). Acteur = utilisateur (ou système si MCP token de service).
- La trace vit dans l'activité, pas seulement dans la ligne (le `detach` supprime la ligne).

## Web (apps/web)

- **Section « Pages »** dans le work item, à côté de Links/Attachments : composant `issue-detail-widgets/pages/` (root + liste + bouton).
- **Modale Link/Create** : recherche de pages du projet (réutiliser la recherche d'entités existante), multi-sélection, + « Create new page » (crée la page puis l'attache).
- **Store** : `useIssueDetail` étendu avec `pages` (map issueId → pageIds) + `fetchIssuePages` / `attachPage` / `detachPage` ; service `issue.service.ts` (méthodes) + `page` service.
- CE : pas de stub à remplacer (feature nouvelle) — vit dans `core/` (ou `ce/` si un point d'extension EE homonyme existe, à vérifier).

## Tests

- pytest : model (invariant workspace, unicité), 3 endpoints × (auth OK / refus write / refus read page privée / 404 cross-workspace), activité émise sur attach+detach, list filtré par visibilité. Sur l'API externe **et** interne.
- Web : pas d'infra de test (constat récurrent).

## Schéma BDD

- 1 migration : création table `issue_pages` + index. Aucune donnée à migrer. À écrire à la main (pas d'env makemigrations) en imitant la dernière migration.
