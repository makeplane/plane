# API Module

External/public REST API layer for third-party integrations.

## Purpose

Provides programmatic access to Plane's core functionality for external clients and third-party integrations via HTTP endpoints.

## Authentication

- **API Key**: Header `X-Api-Key: <token>` validated against `APIToken` model
- **OAuth2**: Scope-based permissions `["read", "write"]`

## Rate Limiting

- API Key: 60 requests/minute (configurable via `API_KEY_RATE_LIMIT`)
- Service Token: 300 requests/minute
- Response headers: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Key Endpoints

| Resource       | Endpoints                                               |
| -------------- | ------------------------------------------------------- |
| Projects       | `GET/POST /workspaces/<slug>/projects/`                 |
| Work Items     | `GET/POST /workspaces/<slug>/projects/<id>/work-items/` |
| Cycles         | `GET/POST /workspaces/<slug>/projects/<id>/cycles/`     |
| Modules        | `GET/POST /workspaces/<slug>/projects/<id>/modules/`    |
| Members        | `GET /workspaces/<slug>/members/`                       |
| Customers (EE) | `GET/POST /workspaces/<slug>/customers/`                |

## Serializer Features

- **Field filtering**: `?fields=id,name,project`
- **Dynamic expansion**: `?expand=user,workspace`
- Lite serializers for minimal data in relations

## Key Patterns

- REST pattern: `workspaces/<slug>/[projects/<id>/][<resource>/]`
- Dual URL patterns: `issues/` (legacy) and `work-items/` (current)
- Read replica support via `use_read_replica = True`
- OpenAPI/Swagger docs via `drf-spectacular`
