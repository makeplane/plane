# Public project Pages API

## Status

This document records the maintenance decisions and version history for the
public project Pages collection API introduced for Plane issue #9484.

Slice 6 is complete: the API-key-authenticated public `GET` and `POST`
collection routes, allowlisted read/write serializers, privacy-aware query,
atomic persistence, archival filtering, generated OpenAPI schema, and focused
automated coverage are implemented.

## Scope

The supported surface is limited to:

- `GET /api/v1/workspaces/{slug}/projects/{project_id}/pages/`
- `POST /api/v1/workspaces/{slug}/projects/{project_id}/pages/`

The endpoints authenticate through `X-API-Key`. Page detail, PATCH, DELETE,
workspace Pages, MCP, versions, favorites, archive/lock actions, and UI-only
behaviors are intentionally excluded.

## Implementation map

The final implementation should follow existing public API patterns:

- `plane.api.urls` registers the Pages URL module below `/api/v1/`.
- `plane.api.views.page` hosts API-key-authenticated list/create views using
  `BaseAPIView`.
- `plane.api.serializers.page.ProjectPageListSerializer` owns the list response
  boundary; `ProjectPageCreateSerializer` owns the narrow create-input
  boundary and atomic `Page` plus `ProjectPage` persistence.
- `Page` stores the document and `ProjectPage` establishes the active project
  relationship. Every list query must constrain both workspace/project and the
  non-soft-deleted `ProjectPage` link.
- Existing `ProjectPagePermission` defines the Page-specific role and privacy
  behavior that the public path must preserve or reproduce explicitly.

## Security and data rules

- A token identifies the caller; clients never control `owned_by`, workspace,
  timestamps, lock/archive state, or other internal fields.
- Active project guests may read public Pages. Private Pages are owner-only.
- Active project members and admins may create; guests and non-members may not.
- Public list output is metadata only. It must exclude description bodies,
  binary state, favorites, recent visits, and internal aggregation fields.
- Description HTML in create requests uses Plane's existing content-validation
  and sanitization path.
- Do not resolve Page IDs outside the project and active link in the URL.

## TDD and validation

For every implementation component, add or update a failing unit test first,
then write the smallest production change that makes it pass, then run the API
contract test for the assembled behavior.

Validation layers:

1. Unit tests cover serializer field boundaries, input validation, and policy
   helpers.
2. Contract tests cover HTTP, API-key authentication, permissions, persistence,
   privacy, and project isolation.
3. A disposable Compose smoke run covers the real HTTP/container path after the
   collection endpoints are complete.

## Resource-change ledger

Append a new entry for every change to a runtime, API, data, test, or deployment
resource. Do not rewrite existing entries. Never put token values, credentials,
or generated secret material in this ledger.

| Version | Date       | Change                                                                                                                                                                                                                                                                                                                                                                                    | Validation                                                                                                                                                                                            | Compatibility / rollback                                                                                                                                                                                                                  |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1     | 2026-09-29 | Locked GET/POST collection contract; added red public contract and serializer unit tests. No runtime endpoint, database schema, container, or deployed AIO resource changed.                                                                                                                                                                                                              | GET contract test returns expected pre-implementation 404; serializer unit test is red because the public serializer does not yet exist.                                                              | Remove the unimplemented tests and docs only if the candidate is abandoned; no runtime rollback required.                                                                                                                                 |
| 0.2     | 2026-09-29 | Added the public `GET` project Pages collection: URL registration, metadata-only serializer, visibility-constrained query, and focused unit/contract tests. No database schema, container, or deployed AIO resource changed.                                                                                                                                                              | Serializer unit test passes; six isolated Compose API contract tests pass for successful listing, project isolation, soft-deleted links, private Pages, missing key, and non-member access.           | Additive `/api/v1` `GET` surface. Roll back by reverting the URL, view, serializer, and tests; no migration or data rollback is needed.                                                                                                   |
| 0.3     | 2026-09-29 | Added the public `POST` project Pages collection: explicit writable-field allowlist, server-derived ownership and workspace, HTML sanitization, and atomic `Page` plus active `ProjectPage` persistence. No database schema, container, or deployed AIO resource changed.                                                                                                                 | Three serializer unit tests and eleven isolated Compose API contract tests pass, including POST-to-GET flow, persistence, guest denial, invalid input, server-field rejection, and HTML sanitization. | Additive `/api/v1` `POST` surface. Roll back by reverting the POST handler, create serializer, route method registration, and related tests; no migration or data rollback is needed.                                                     |
| 0.4     | 2026-09-29 | Hardened the bounded collection surface against archived Page leakage by excluding archived Page records from the list query. Added regressions for revoked/expired API-key rejection, inactive membership, content/UI-state non-leakage, cross-project and lifecycle-field injection, and unsupported mutation methods. No database schema, container, or deployed AIO resource changed. | The new archived-Page regression failed before the query change and passes after it. The isolated Compose API contract suite covers all collection security paths.                                    | Compatible tightening of collection visibility: archived Pages no longer appear. Roll back by reverting the archival predicate and Slice 4 tests only if this boundary is intentionally changed; no migration or data rollback is needed. |
| 0.5     | 2026-09-29 | Added OpenAPI annotations for the existing GET/POST collection operations, including API-key security, path/pagination parameters, request/response schemas, and validated examples. Enabled drf-spectacular only in the disposable test Compose service so schema generation is tested without altering the deployed AIO runtime. No database schema or deployed AIO resource changed.   | The schema contract was red at 404 before enabling the test-only schema surface. It validates the two operations, request fields, auth scheme, and example serializer compatibility after the change. | Additive documentation metadata and test-only configuration. Roll back by reverting annotations, OpenAPI tag metadata, test Compose flag, and schema tests; product routes and persisted data are unaffected.                             |
| 0.6     | 2026-09-29 | Added a disposable real-network smoke runner, an isolated Compose overlay, and an idempotent management-command seed. The runner generates an ephemeral API key, makes requests through a service-name curl client, and always performs `down -v`; no database schema, host port, or deployed AIO resource changed.                                                                       | The seed-command unit test passes. A clean Compose run produced `401` without a key, `201` for create, and `200` for a subsequent list, then left no Slice 6 containers, volumes, or networks.        | Test-only operational tooling. Roll back by removing the runner, overlay, seed command, and its test; product routes, persisted data, and the existing AIO deployment are unaffected.                                                     |

## Maintenance procedure

When changing this feature:

1. Add a ledger row with the version, date, resource impact, validation, and
   rollback/compatibility statement.
2. Add a red unit test before changing production code.
3. Update the relevant API contract test and run it in the isolated Compose
   project.
4. Preserve the existing Plane AIO deployment and port 80; use a separate
   Compose project and clean it with `down -v`.
5. Keep generated `.env` files, logs, Docker artifacts, and credentials out of
   version control and this document.
