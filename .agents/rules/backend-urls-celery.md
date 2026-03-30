<!-- Scope: plane/app/urls/**, plane/api/urls/**, plane/bgtasks/** -->

# Backend URLs & Background Tasks

## URL Convention

```python
# plane/app/urls/my_domain.py
from django.urls import path
from plane.app.views import MyViewSet

urlpatterns = [
    # Workspace-scoped: List + Create
    path(
        "workspaces/<str:slug>/my-models/",
        MyViewSet.as_view({"get": "list", "post": "create"}),
        name="my-models",
    ),
    # Workspace-scoped: Detail
    path(
        "workspaces/<str:slug>/my-models/<uuid:pk>/",
        MyViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="my-model-detail",
    ),
    # Project-scoped
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/my-models/",
        MyViewSet.as_view({"get": "list", "post": "create"}),
        name="project-my-models",
    ),
]
```

### URL Registration — 3 places to update:

1. Create `plane/app/urls/my_domain.py`
2. Import in `plane/app/urls/__init__.py`:
   ```python
   from .my_domain import urlpatterns as my_domain_urls
   ```
3. Add to combined urlpatterns:
   ```python
   urlpatterns = [..., *my_domain_urls, ...]
   ```

### URL Rules:

- **Workspace scope**: `workspaces/<str:slug>/...`
- **Project scope**: `workspaces/<str:slug>/projects/<uuid:project_id>/...`
- **kebab-case** for URL segments
- **UUID** for entity IDs: `<uuid:pk>`, `<uuid:project_id>`

## Background Tasks (Celery)

```python
# plane/bgtasks/my_task.py
from celery import shared_task
from plane.utils.exception_logger import log_exception

@shared_task
def my_task(model_id):
    """Always pass IDs as strings, never model instances."""
    try:
        obj = MyModel.objects.get(id=model_id)
        # process...
    except MyModel.DoesNotExist:
        return
    except Exception as e:
        log_exception(e)
        raise
```

### Trigger from views:

```python
my_task.delay(str(obj.id))  # Always str() for UUID
```

### Celery Beat (scheduled tasks):

Configured via `django_celery_beat` in INSTALLED_APPS. Use Django admin or migrations to add periodic tasks.

## Activity Tracking After Mutations

After **create/update/delete**, always fire:

1. **`issue_activity.delay()`** — issue-specific: activity log + push notifications
2. **`model_activity.delay()`** — general: webhook events to external consumers

For non-issue models, use `model_activity.delay()` at minimum for webhook support.
