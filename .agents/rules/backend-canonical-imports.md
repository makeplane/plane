## <!-- Scope: apps/api/** -->

## description: Canonical backend import paths -- prevent hallucination/slopsquatting

# Backend Canonical Imports

| Package                         | Import                     | Usage                         |
| ------------------------------- | -------------------------- | ----------------------------- |
| `plane.app.views.base`          | `BaseViewSet, BaseAPIView` | App-level views               |
| `plane.license.api.views`       | `BaseAPIView`              | Instance/God Mode views       |
| `plane.app.permissions`         | `ROLE, allow_permission`   | Workspace/project permissions |
| `plane.license.api.permissions` | `InstanceAdminPermission`  | Instance admin permission     |
| `plane.bgtasks.*`               | `@shared_task`             | Background tasks              |
| `plane.utils.exception_logger`  | `log_exception`            | Error logging                 |
| `celery`                        | `shared_task`              | Task decorator                |

NEVER use `from rest_framework.views import APIView` directly -- use Plane's `BaseAPIView`
NEVER use `from rest_framework.viewsets import ModelViewSet` directly -- use `BaseViewSet`
