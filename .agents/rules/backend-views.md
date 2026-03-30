<!-- Scope: plane/app/views/**, plane/api/views/** -->

# Backend Views & Permissions

## Two Base Classes

```python
from plane.app.views.base import BaseViewSet, BaseAPIView
```

**`BaseViewSet`** (standard CRUD) inherits: `TimezoneMixin`, `ReadReplicaControlMixin`, `ModelViewSet`, `BasePaginator`

**`BaseAPIView`** (custom endpoints) — same base features, minus ModelViewSet CRUD.

Both provide:

```python
self.workspace_slug  # → self.kwargs.get("slug")
self.project_id      # → self.kwargs.get("project_id")
self.fields          # → parsed from ?fields=a,b,c
self.expand          # → parsed from ?expand=a,b,c
```

Both include: `SessionAuthentication` + `IsAuthenticated`, `DjangoFilterBackend` + `SearchFilter`, exception handling for `IntegrityError`, `ValidationError`, `ObjectDoesNotExist`, `KeyError`.

## Complete ViewSet Example

```python
class IssueViewSet(BaseViewSet):
    model = Issue
    webhook_event = "issue"
    search_fields = ["name"]
    filter_backends = (ComplexFilterBackend,)
    filterset_class = IssueFilterSet

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return IssueCreateSerializer
        return IssueSerializer

    def get_queryset(self):
        return Issue.issue_objects.filter(
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        ).distinct()

    @method_decorator(gzip_page)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        filters = issue_filters(request.query_params, "GET")
        issue_queryset = self.get_queryset().filter(**filters)
        order_by_param = request.GET.get("order_by", "-created_at")
        issue_queryset, _ = order_issue_queryset(issue_queryset, order_by_param)
        return self.paginate(request=request, queryset=issue_queryset, order_by=order_by_param)
```

## Post-Mutation Patterns (IMPORTANT)

After **create/update/delete**, always fire:

1. **`issue_activity.delay()`** — activity log + push notifications
2. **`model_activity.delay()`** — webhook events to external consumers
3. **`recent_visited_task.delay()`** — on retrieve/list for recent visit tracking

For `partial_update`, capture `current_instance` **BEFORE** update for activity diff:

```python
current_instance = json.dumps(IssueSerializer(issue).data, cls=DjangoJSONEncoder)
```

## Permission Patterns

### @allow_permission decorator (preferred):

```python
from plane.app.permissions import ROLE, allow_permission

@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")  # Workspace-level
@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])          # Project-level (default)
@allow_permission([ROLE.ADMIN, ROLE.MEMBER], creator=True, model=Issue)  # Creator bypass
```

### Available Permission Classes

| Class                       | Access                                                      |
| --------------------------- | ----------------------------------------------------------- |
| `WorkSpaceBasePermission`   | POST: auth'd; GET: member; PUT: admin+member; DELETE: admin |
| `WorkSpaceAdminPermission`  | Workspace admin only                                        |
| `WorkspaceEntityPermission` | Any active workspace member                                 |
| `ProjectEntityPermission`   | Any active project member                                   |
| `ProjectMemberPermission`   | Project admin + member (not guest)                          |
| `ProjectLitePermission`     | Read-only project access                                    |

### Role Values: ADMIN=20, MEMBER=15, GUEST=5

## Guest Access Pattern

```python
if (
    ProjectMember.objects.filter(
        workspace__slug=slug, project_id=project_id,
        member=request.user, role=5, is_active=True,
    ).exists()
    and not project.guest_view_all_features
):
    issue_queryset = issue_queryset.filter(created_by=request.user)
```

## Timezone Conversion

```python
from plane.utils.timezone_converter import user_timezone_converter
data = user_timezone_converter(data, ["created_at", "updated_at"], request.user.user_timezone)
```
