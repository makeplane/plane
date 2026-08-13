# P5A Jira Importer Vertical Slice

## Summary

P5A adds a backend Jira Cloud importer slice for self-hosted deployments. The implementation provides the app API endpoints expected by the existing frontend Jira importer service, validates Jira credentials through bounded outbound requests, queues an asynchronous import job, records progress on the existing `Importer` model, supports cancellation, and imports Jira issues idempotently by `external_source="jira"` and Jira issue key.

## Backend Contract

- `GET /api/workspaces/:workspaceSlug/importers/` lists workspace importers for workspace admins and members.
- `GET /api/workspaces/:workspaceSlug/importers/jira` validates Jira metadata and returns a Jira project summary.
- `POST /api/workspaces/:workspaceSlug/projects/importers/jira/` creates a queued Jira importer for an authorized project admin/member and enqueues `jira_import_task`.
- `DELETE /api/workspaces/:workspaceSlug/importers/:service/:importerId/` marks queued or processing importers as `cancelled`.

The endpoints are implemented in `apps/api/plane/app/views/importer/base.py` and registered through `apps/api/plane/app/urls/importer.py`.

## Import Behavior

- Jira credentials are accepted only at the request boundary and passed to the queued task payload.
- Stored importer metadata is redacted to `cloud_hostname`, `project_key`, and `email`; `api_token` is not stored in `Importer.metadata`.
- Jira HTTP calls use `pinned_fetch`, a 10 second timeout, an allow-listed Jira host, bounded retry, and `429` `Retry-After` handling.
- Imported work items use Jira issue keys as `external_id` with `external_source="jira"`, so retries update existing imported issues instead of duplicating them.
- Imported Jira statuses are mapped to project states by Jira external ID, then by existing same-name project state, then by creating a new project state.
- Imported Jira labels are linked to imported issues without removing unrelated existing labels.
- Jira descriptions are converted from Atlassian Document Format text nodes and escaped before being stored as issue HTML.
- The first slice imports a bounded issue subset: summary, description text, status, priority, and labels.

## Authorization And Tenant Scope

- Workspace importer listing, preview, create, and cancel operations require workspace admin/member roles.
- Importer creation additionally requires admin/member membership in the target project.
- Project lookup is scoped by workspace slug and rejects cross-workspace project IDs.
- The background task loads the importer with its workspace and project and writes only through those scoped model references.

## Self-Hosted Capability Policy

No plan, subscription, license, billing, edition, enterprise, or upgrade gate was added. Contract coverage includes a Community instance preview path to prevent introducing a commercial gate for self-hosted users.

## Tests

Added `apps/api/plane/tests/contract/app/test_jira_importer_app.py` covering:

- Community instance Jira metadata preview without a plan gate.
- importer creation with token redaction and Celery enqueueing;
- cross-workspace project rejection;
- guest denial;
- cancellation through the existing delete route;
- task idempotency by Jira `external_id` and HTML escaping.

Command run:

```bash
docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/tests/contract/app/test_jira_importer_app.py
```

Result: `6 passed`.

## Limitations

- This is a Jira Cloud backend slice only; GitHub import, frontend wizard changes, arbitrary credential storage, attachments, comments, epics-to-modules, users, and full Jira migration parity remain out of scope.
- Cancellation is cooperative; the task checks the importer status between Jira issue records.
- Credentials are not persisted for resumable retries after worker loss; stored progress and external IDs keep persistence idempotent once a task is running.
