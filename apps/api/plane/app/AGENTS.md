# App Module

Internal REST API layer for the Plane web interface.

## Purpose

Core REST API backend powering the Plane web application. Provides endpoints for all user-facing features.

## Permission System

**Roles** (ROLE enum):

- `ADMIN`: 20
- `MEMBER`: 15
- `GUEST`: 5

**Decorator Usage**:

```python
@allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
def my_view(request):
    ...
```

## Key Endpoints

| Feature    | Endpoint Pattern                            |
| ---------- | ------------------------------------------- |
| Workspaces | `/workspaces/`, `/workspaces/<slug>/`       |
| Projects   | `/workspaces/<slug>/projects/`              |
| Issues     | `/workspaces/<slug>/projects/<id>/issues/`  |
| Cycles     | `/workspaces/<slug>/projects/<id>/cycles/`  |
| Modules    | `/workspaces/<slug>/projects/<id>/modules/` |
| Pages      | `/workspaces/<slug>/projects/<id>/pages/`   |
| Views      | `/workspaces/<slug>/projects/<id>/views/`   |
| Search     | `/workspaces/<slug>/search/`                |
| Analytics  | `/workspaces/<slug>/analytics/`             |

## Base Classes

- `BaseViewSet`: ModelViewSet with pagination, filtering, timezone support
- `BaseAPIView`: Custom endpoints, exception handling
- `DynamicBaseSerializer`: Field filtering and nested expansion

## Key Features

- Session and API key authentication
- Dynamic field selection (`?fields=`, `?expand=`)
- Timezone-aware operations
- Read replica support
- Comprehensive audit logging
