# Plane Page APIs and Work Item–Page Relations

Status: Page CRUD/global-Page changes, Work Item–Page relation, and the Work Item detail Pages widget are implemented in the local `pages-api-v1.4.2` checkout. Backend and frontend behavior were runtime-verified on the self-hosted Plane stack.

## Scope

This document covers the Page integration across three clients:

1. workspace/project Page CRUD, including workspace-global Pages;
2. the relation between a Plane Work Item and one or more Plane Pages; and
3. the Work Item detail UI for listing, attaching, opening, and detaching Pages.

The Page relation is available through the backend, the existing Plane MCP Page tool, and the Work Item detail UI. The backend routes are the runtime contract for all three clients.

Supported Work Item–Page operations:

- list Pages linked to a Work Item;
- attach a Page to a Work Item;
- detach a Page from a Work Item;
- reattach a previously detached Page without creating a duplicate relation.

## Page CRUD changes

The earlier Page patch expanded the backend from project-scoped Pages to two explicit scopes:

- project Page: `is_global=False`, linked through `ProjectPage`;
- workspace/global Page: `is_global=True`, with no `ProjectPage` row required.

The two scopes have separate routes and separate visibility querysets. Omitting `project_id` in the MCP Page tool selects the workspace/global scope; supplying it selects the project scope.

### Page data and content

- `Page.description_html` is the full HTML body returned by retrieve and accepted by create/update.
- HTML is validated and sanitized by `validate_html_content` before persistence.
- `description_stripped` is maintained by the Page model for text/search use.
- `external_source` + `external_id` provide integration identity. A duplicate pair in the same scope returns `409 Conflict` with the existing Page ID.
- `parent` creates a hierarchy. Parent validation rejects self/descendant cycles, wrong-project parents, and invalid workspace-global parents.
- Create/update queues `page_transaction` with the sanitized body so the Page transaction/history pipeline receives the same content stored by the API.

### Workspace/global Page REST contract

```http
GET   /api/v1/workspaces/{workspace_slug}/pages/
POST  /api/v1/workspaces/{workspace_slug}/pages/
GET   /api/v1/workspaces/{workspace_slug}/pages/{page_id}/
PATCH /api/v1/workspaces/{workspace_slug}/pages/{page_id}/
```

Create example:

```json
{
  "name": "Architecture Notes",
  "description_html": "<h1>Architecture Notes</h1><p>Content.</p>",
  "access": 0,
  "external_source": "mcp",
  "external_id": "architecture-001"
}
```

Behavior:

- `POST` returns `201 Created` and creates a global Page in the workspace.
- `GET` list returns the standard paginated envelope.
- `GET` detail returns Page metadata plus `description_html`.
- `PATCH` is partial; send only fields to change.
- `type` list filter accepts `all`, `public`, `private`, `shared`, or `archived`.
- `search` filters by Page name.
- Workspace list/detail expose only global, non-deleted Pages owned by the caller or marked public.
- Current backend routes do not expose workspace-level archive or delete endpoints. Workspace Page CRUD therefore means list/create/retrieve/update in this patch.

### Project Page REST contract

```http
GET    /api/v1/workspaces/{workspace_slug}/projects/{project_id}/pages/
POST   /api/v1/workspaces/{workspace_slug}/projects/{project_id}/pages/
GET    /api/v1/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/
PATCH  /api/v1/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/
DELETE /api/v1/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/
POST   /api/v1/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/archive/
DELETE /api/v1/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/archive/
```

Project create writes both the Page and its active `ProjectPage` membership in one transaction. Project listing requires an active project member, excludes archived projects and deleted project-page links, and returns the caller's own Pages plus public Pages.

### Page lifecycle and permissions

- Authentication and the existing `WorkspaceEntityPermission`/`ProjectEntityPermission` guards apply.
- A locked Page rejects every update except `{"is_locked": false}`.
- Only the owner can change `access`; another member changing it receives `400 Bad Request`.
- Project archive/unarchive is reversible and cascades to descendants. Unarchive detaches a child from a parent that remains archived.
- Project delete requires the Page to be archived first and permits only the owner or a project admin. It clears child parent references and related favorite/recent-visit records.
- Workspace-global Pages have no archive/delete route in the current backend patch.

### CRUD regression coverage

`apps/api/plane/tests/contract/api/test_pages.py` covers:

- project create/list/retrieve/update/delete;
- HTML content persistence and transaction task dispatch;
- invalid payloads and external-ID conflicts;
- private/public visibility;
- locked Page behavior and owner-only access changes;
- archive/unarchive, descendant cascade, and parent detachment;
- owner/admin delete authorization;
- workspace/global list/create/retrieve/update;
- exclusion of project Pages and other users' private workspace Pages.

## Source changes

| Area | File | Change |
| --- | --- | --- |
| Container build | `apps/api/Dockerfile.api` | Adds `libxml2-dev` and `libxslt-dev` to Alpine build dependencies so `lxml==6.1.0` can compile on ARM64 when performing a clean image build. |
| Page routes | `apps/api/plane/api/urls/page.py` | Adds workspace-scoped list/create and retrieve/update routes while retaining project-scoped CRUD and archive routes. |
| Page views | `apps/api/plane/api/views/page.py` | Adds global-Page querysets and workspace list/create/detail/update behavior; keeps project visibility, archive, unarchive, and delete rules. |
| Page serializer | `apps/api/plane/api/serializers/page.py` | Allows project or workspace creation, marks global Pages with `is_global`, validates parent scope, sanitizes HTML, and adds Work Item–Page serializers. |
| Page regression coverage | `apps/api/plane/tests/contract/api/test_pages.py` | Covers project CRUD/lifecycle plus workspace/global list/create/retrieve/update, visibility, locking, access, hierarchy, and authorization. |
| Data model | `apps/api/plane/db/models/page.py` | Adds `WorkItemPage`, linking `Issue`, `Page`, `Project`, and `Workspace`. Uses soft deletion and an active `(issue, page)` uniqueness constraint. |
| Migration | `apps/api/plane/db/migrations/0123_workitempage.py` | Creates `work_item_pages`. |
| Work Item–Page view | `apps/api/plane/api/views/work_item_page.py` | Implements list/create/detail/delete behavior, visibility checks, cross-project checks, and soft-delete restore. |
| Work Item–Page URL/export wiring | `apps/api/plane/api/urls/work_item.py`, `apps/api/plane/api/views/__init__.py`, `apps/api/plane/api/serializers/__init__.py`, `apps/api/plane/db/models/__init__.py` | Registers the relation endpoint, serializer, view, and model. |
| Work Item–Page regression coverage | `apps/api/plane/tests/contract/api/test_work_item_pages.py` | Covers list, attach, readback, detach, and cross-project rejection. Reattach is implemented but not covered by this contract test. |
| Session/API compatibility routes | `apps/api/plane/app/urls/page.py`, `apps/api/plane/app/urls/issue.py`, `apps/api/plane/app/views/page/workspace.py`, `apps/api/plane/app/views/issue/work_item_page.py` | Exposes the `/api` routes consumed by the authenticated web UI without changing the MCP `/api/v1` contract. |
| Work Item detail Pages widget | `apps/web/core/components/issues/issue-detail-widgets/pages/`, `apps/web/core/services/issue/issue_page.service.ts`, `apps/web/core/services/page/workspace-page.service.ts` | Lists linked Pages, opens project Pages, supports workspace/global Page picker, attaches with `page_id`, detaches with the relation ID, and refreshes local state. |
| Widget registration/state | `apps/web/core/components/issues/issue-detail-widgets/issue-detail-widget-collapsibles.tsx`, `apps/web/core/store/issue/issue-details/root.store.ts`, `packages/types/src/issues/issue.ts` | Registers the Pages widget and keeps it available/open by default in Work Item detail. |

The existing Page CRUD changes remain in `apps/api/plane/api/urls/page.py`, `apps/api/plane/api/views/page.py`, `apps/api/plane/api/serializers/page.py`, and `apps/api/plane/tests/contract/api/test_pages.py`.

## Work Item detail UI

The authenticated web UI calls the session-authenticated `/api` routes, not the MCP/API-key `/api/v1` routes:

```http
GET  /api/workspaces/{workspace_slug}/pages/
GET  /api/workspaces/{workspace_slug}/projects/{project_id}/work-items/{work_item_id}/pages/
POST /api/workspaces/{workspace_slug}/projects/{project_id}/work-items/{work_item_id}/pages/
DELETE /api/workspaces/{workspace_slug}/projects/{project_id}/work-items/{work_item_id}/pages/{work_item_page_id}/
```

The **Linked pages** section appears in Work Item detail. It shows linked Pages, opens project-scoped Pages through the existing Page route, and displays workspace/global Pages without inventing a project URL. The picker merges project Pages with visible workspace/global Pages, filters by name, and excludes already-linked Pages.

Attach behavior:

- selecting a Page sends `POST` with `{"page_id": "<page-uuid>"}`;
- the option uses a direct click handler because the existing Headless UI `Combobox` path did not reliably emit `onChange` for this picker;
- a local ref prevents duplicate attach requests while the first request is pending;
- successful attach closes the picker, refreshes the linked list, and updates the count;
- detach sends the relation ID (`work_item_page_id`), not the Page ID;
- failed attach/detach displays the existing localized toast messages.

This UI layer does not change the MCP package. It reuses the existing Page service/router and keeps global Pages represented by `projects: null` as workspace-level artifacts.

## REST contract

Base path:

```text
/api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/{work_item_id}/pages/
```

### List linked Pages

```http
GET /api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/{work_item_id}/pages/
```

The response uses Plane's standard pagination envelope. The collection route matches Plane's documented Work Item Pages endpoint.[5] Each result contains the relation ID plus a nested Page summary:

```json
{
  "results": [
    {
      "id": "work-item-page-link-uuid",
      "page": {
        "id": "page-uuid",
        "name": "Feature Specification",
        "access": 0,
        "is_locked": false,
        "archived_at": null
      },
      "issue": "work-item-uuid",
      "project": "project-uuid",
      "workspace": "workspace-uuid",
      "created_at": "2026-09-13T08:48:39Z",
      "updated_at": "2026-09-13T08:48:39Z"
    }
  ]
}
```

### Attach a Page

```http
POST /api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/{work_item_id}/pages/
Content-Type: application/json

{"page_id": "page-uuid"}
```

Returns `201 Created` for a new relation. If the same relation was soft-deleted earlier, the existing relation is restored and returned with `200 OK`.

### Retrieve one link

```http
GET /api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/{work_item_id}/pages/{work_item_page_id}/
```

`work_item_page_id` is the relation ID returned by list/attach, not the Page ID.

### Detach a Page

```http
DELETE /api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/{work_item_id}/pages/{work_item_page_id}/
```

Returns `204 No Content`. Detach soft-deletes the relation. The Page itself is not deleted.

## Scope and access rules

- The Work Item, project, and workspace must match the URL scope.
- The caller must pass the existing `ProjectEntityPermission` check for the target project.
- An attachable Page must belong to the same workspace.
- A Page is accepted when it is either a workspace/global Page or has an active `ProjectPage` link to the target project.
- The caller can use a Page they own or a public Page.
- A Page from another project is rejected with `404`; it is never silently attached.
- Soft-deleted Pages and soft-deleted project links are excluded.
- Detaching removes only the Work Item–Page relation.

## MCP impact

The existing `page` MCP tool supports both Page CRUD and Work Item–Page relations. No MCP package source change was required for the backend additions.

### Page CRUD mapping

```text
page(action="list", project_id="...")
page(action="retrieve", project_id="...", page_id="...")
page(action="create", project_id="...", name="...", description_html="...")
page(action="update", project_id="...", page_id="...", name="...", description_html="...")
page(action="archive", project_id="...", page_id="...", archive=true|false)
page(action="delete", project_id="...", page_id="...")
```

- Omit `project_id` for workspace/global Page CRUD.
- Supply `project_id` for project Page CRUD.
- `create` requires `name` and `description_html`.
- `update` requires `page_id` plus `name`, `description_html`, or both; `description_html` replaces the full body.
- `archive` is reversible; `delete` requires the Page to be archived first.
- `parent_id` and `collection_id` are mutually exclusive. Collections are workspace-only.
- The MCP SDK version inspected calls `PUT` for Page update, while this backend route is registered as `PATCH`. The local runtime workaround patched the SDK transport to `_patch()`; this is not a permanent upstream dependency fix. Any fresh MCP deployment must verify its SDK method and HTTP verb before claiming update support.

### Work Item–Page actions

```text
page(action="list_workitem_pages", project_id, workitem_id)
page(action="attach_to_workitem", project_id, workitem_id, page_id)
page(action="detach_from_workitem", project_id, workitem_id, workitem_page_id)
```

The MCP action-to-REST mapping is:

| MCP action | REST operation | Important ID |
| --- | --- | --- |
| `list_workitem_pages` | `GET .../work-items/{work_item_id}/pages/` | Work Item UUID |
| `attach_to_workitem` | `POST .../work-items/{work_item_id}/pages/` | Page UUID in `page_id` |
| `detach_from_workitem` | `DELETE .../work-items/{work_item_id}/pages/{work_item_page_id}/` | Relation UUID, not Page UUID |

Recommended MCP sequence:

1. Retrieve the Work Item by identifier, for example `INGAT-31`.
2. Record its canonical Work Item UUID and project UUID.
3. Retrieve or otherwise validate the target Page UUID.
4. List existing links before attaching.
5. Attach with the Page UUID.
6. List again and record the returned `work_item_page_id`.
7. Detach with that relation ID.
8. List again and verify the relation is absent.

The MCP client previously advertised the actions while the deployed backend returned `404`. After the backend route was deployed, the same MCP actions completed successfully against the live stack.

## Use cases

### Feature specification

Link a Page containing requirements, acceptance criteria, or UX decisions to the Work Item implementing them. The Work Item remains the execution record; the Page remains the long-form artifact.

### Meeting or decision artifact

Link a meeting notes Page to the Work Item created from that meeting. This preserves a navigable relation without copying the complete notes into the Work Item description.

### QA and delivery evidence

Link a Page containing test evidence, screenshots, rollout notes, or an incident follow-up. Detach the evidence when it is obsolete without deleting the historical Page.

### Cross-tool automation

An MCP worker can create/update a Page, resolve a Work Item identifier, attach the Page, and verify the relation through a subsequent list call. Retries are safe for an already-detached relation because reattach restores the soft-deleted link instead of creating an active duplicate.

## Runtime evidence

Verified on 2026-09-14 against the local self-hosted Plane stack:

- migration: `db.0123_workitempage` applied successfully;
- backend services recreated: `api`, `worker`, and `beat-worker`;
- frontend service recreated separately for the picker event fix: `web` only;
- backend runtime image: `makeplane/plane-backend:pages-ui-api-wip`;
- frontend runtime image: `makeplane/plane-frontend:pages-ui-api-attach-fix`;
- image platform: `linux/arm64`;
- backend image digest: `sha256:85d23c597cf1c64d7c2bb1e1134fa23cb356751bfb931407b3b4524764fa4b73`;
- frontend image digest: `sha256:66421ff273c576b5eb5afee54a93dfb7ee0573b71ed1e24b609bc22653f42a00`;
- frontend container: `plane-app-web-1` healthy;
- Work Item: `INGAT-31` (`4461a313-758a-45f9-9a60-c2dffcc5b3ed`);
- Page: `0f27ecbb-c71c-4393-afd9-eee1ce1fbc10` (`Test MCP`);
- attach relation: `2de68b3e-0905-46da-bf4d-7e5c1c7eedc2`;
- MCP list before attach: empty;
- MCP list after attach: one relation;
- MCP detach: successful;
- MCP list after detach: empty.

## Verification limits

- Python compile and `git diff --check` passed for the changed paths.
- Host pytest was blocked because the host interpreter lacks `celery`; use the repository's Docker test stack described in `apps/api/tests/RUNNING_TESTS.md` for a clean contract-suite run.
- The clean Dockerfile rebuild was blocked by a long ARM64 Alpine toolchain build. The live smoke used an ARM64 overlay image based on `local/plane-backend:pages-api-v1.4.3`, with the changed backend files copied into it. The Dockerfile dependency fix remains required for a future clean rebuild.
- No MCP source file was changed in this task; MCP runtime verification proves compatibility with the deployed backend, not package provenance or release publication.

## References

- Official list endpoint: <https://developers.plane.so/api-reference/work-item-pages/list-work-item-pages>
- Backend route: `apps/api/plane/api/urls/work_item.py`
- Backend implementation: `apps/api/plane/api/views/work_item_page.py`
- Data model and migration: `apps/api/plane/db/models/page.py`, `apps/api/plane/db/migrations/0123_workitempage.py`
- MCP implementation: `plane_mcp/tools/page.py` (`list_workitem_pages`, `attach_to_workitem`, `detach_from_workitem`)

## Sources

[5] https://developers.plane.so/api-reference/work-item-pages/list-work-item-pages — Plane API: List work item pages
