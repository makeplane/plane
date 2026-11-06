# plane.nexus: the paid-plan public API, implemented for Nexus Operations

Plane's MCP server (`apps/mcp`) and `plane-sdk` call public `/api/v1` endpoints
that only Plane's paid plans serve: customers, releases, initiatives, milestones,
work item types and custom properties, templates, pages and collections, work
logs, PQL filtering, and more. Community Edition does not serve them, so a tool
that calls one fails. This app implements them inside our fork so every MCP tool
works.

## Rules

| Rule | Why |
|---|---|
| **The wire format is `plane-sdk`'s.** Paths, methods, request bodies and response fields match what `plane-sdk==0.3.1` sends and parses. | The MCP tools are unchanged upstream code. A field the SDK requires and we omit fails the tool call. |
| Every response is checked in a test with `sdk("plane.models.<module>.<Model>", res.data)`. | It runs the genuine SDK model in an isolated interpreter (see `tests/contract/nexus/conftest.py`). |
| Views subclass `NexusAPIView` (workspace scope) or `NexusProjectAPIView` (project scope) from `views/base.py`. | Same API-key auth, rate limit, error mapping and cursor pagination as stock `/api/v1`. |
| List endpoints that the SDK pages through use `self.paginated(...)`. | It returns `next_cursor`, `results`, `total_count` and the other fields the SDK's `Paginated*Response` models require. |
| Reuse Plane's own models where CE already has the table (`Page`, `Estimate`, `IssueType`, `IssueRelation`, archived `Issue`, …). New tables live in `models/<group>.py`, with `db_table = "nexus_<name>"`. | Data the web app already shows stays one source of truth. |
| Permissions follow Plane: workspace guests read only where Plane lets them, members write, admins configure. Every query is filtered by `workspace__slug` (and by `project_id` when there is one). | An id from another workspace must 404, not leak. |
| Mounted after `plane.api.urls` (`plane/urls.py`). | A Nexus route can never shadow a stock one. |
| Migrations live in `migrations/`, generated with `makemigrations nexus`. | Tests run with `--nomigrations`, so models are exercised before a migration exists. |

## Layout

One feature group per file in `models/`, `serializers/`, `views/` and `urls/`:

| Group | Resources |
|---|---|
| `features` | workspace and project feature switches |
| `customer` | customers, customer properties and values, customer requests, customer ↔ work item links |
| `release` | releases, release labels and tags, changelogs, milestones, initiatives |
| `work_item_type` | work item types, custom properties, options and values, work item / page / project templates (one table, told apart by `template_type`), relation definitions (CE's `relates_to` and `duplicate` are listed first, with stable ids, flagged `is_built_in`) |
| `page` | workspace and project pages, work item ↔ page links, collections, estimates |
| `work_item` | workspace work-item list with PQL, count, archive, dependencies and relations, work logs, intake status, roles, workspace states |

## Changes to stock `/api/v1` endpoints

The MCP tools also call a few stock endpoints, changed in place:

| Endpoint | Change |
|---|---|
| project, cycle and module work item lists | apply PQL through `plane.nexus.pql` |
| `members/`, `members-lite/`, `project-members-lite/` | honour plane-sdk's member filters (`email`, `first_name`, `last_name`, `display_name`, `role_slug`, `is_active`, `is_bot`, `order_by`); they ignored them and returned everyone |
| `work-items/<id>/relations/` (POST) | only links work items the caller may view, as GET already only lists them |

## Tests

```bash
# from the repo root, with the docker-compose-test.yml stack up
docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/tests/contract/nexus
```
