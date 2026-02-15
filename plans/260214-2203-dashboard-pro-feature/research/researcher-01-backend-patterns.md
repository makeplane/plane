# Backend Patterns Research - Dashboard Pro Feature

**Date:** 2026-02-14
**Author:** Researcher Agent
**Context:** Plane.so backend patterns for implementing Dashboard feature

---

## Model Base Classes & Field Patterns

### BaseModel Pattern
All workspace models inherit from `BaseModel` which provides:
- UUID primary key (implicit)
- Soft delete support via `deleted_at` field
- Automatic timestamps: `created_at`, `updated_at`
- Soft delete override method available

### WorkspaceBaseModel Pattern
Used for workspace-scoped models (line 185-195):
- Extends `BaseModel`
- Auto-includes `workspace` FK to `db.Workspace`
- Auto-includes `project` FK to `db.Project` (nullable)
- Override `save()` to auto-populate workspace from project if provided

### Field Patterns Observed

**User-scoped preferences** (WorkspaceHomePreference, line 374-414):
- ForeignKey to workspace (CASCADE)
- ForeignKey to user (CASCADE)
- `key` CharField for preference type
- `config` JSONField with dict default for flexible data
- `is_enabled` BooleanField for toggle state
- `sort_order` FloatField (default 65535) for ordering

**Unique constraints pattern:**
```python
unique_together = ["workspace", "user", "key", "deleted_at"]
constraints = [
    models.UniqueConstraint(
        fields=["workspace", "user", "key"],
        condition=models.Q(deleted_at__isnull=True),
        name="workspace_user_home_preferences_unique_workspace_user_key_when_deleted_at_null",
    )
]
```

**TextChoices for enums** (line 377-382):
```python
class HomeWidgetKeys(models.TextChoices):
    QUICK_LINKS = "quick_links", "Quick Links"
    RECENTS = "recents", "Recents"
```

---

## ViewSet Patterns

### Base View Structure
Advanced analytics views use custom base view pattern (line 31-40):
- Inherit from `BaseAPIView` (not ModelViewSet)
- Use `initialize_workspace()` method to set workspace context
- Extract filters using utility: `get_analytics_filters()`
- Store workspace slug in `self._workspace_slug`
- Store computed filters in `self.filters`

### Permission Decorator
Use `@allow_permission` decorator (line 104, 158, 285):
```python
@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
def get(self, request: HttpRequest, slug: str) -> Response:
```

### Method Patterns

**Tab-based routing** (line 107-119):
```python
tab = request.GET.get("tab", "overview")
if tab == "overview":
    return Response(self.get_overview_data(), status=status.HTTP_200_OK)
elif tab == "work-items":
    return Response(self.get_work_items_stats(), status=status.HTTP_200_OK)
```

**Type-based routing** (line 288-318):
```python
type = request.GET.get("type", "projects")
if type == "projects":
    return Response(self.project_chart(), status=status.HTTP_200_OK)
elif type == "custom-work-items":
    # Custom logic with build_analytics_chart()
```

**Data aggregation pattern** (line 44-64):
- Create helper methods for filtered counts
- Return dict structure: `{"count": int, "filter_count": int}`
- Apply date range filters from `self.filters["analytics_date_range"]`

---

## URL Routing Conventions

### Workspace-scoped endpoints
Pattern: `workspaces/<str:slug>/<resource>/` (line 42-260)

**Examples:**
```python
# List/Create pattern
path("workspaces/<str:slug>/home-preferences/",
     WorkspaceHomePreferenceViewSet.as_view(), ...)

# Retrieve/Update/Delete pattern with key
path("workspaces/<str:slug>/home-preferences/<str:key>/",
     WorkspaceHomePreferenceViewSet.as_view(), ...)

# UUID-based detail
path("workspaces/<str:slug>/stickies/<uuid:pk>/",
     WorkspaceStickyViewSet.as_view({...}), ...)
```

**ViewSet method mapping:**
```python
{"get": "list", "post": "create"}  # Collection
{"get": "retrieve", "patch": "partial_update", "delete": "destroy"}  # Item
```

**Custom actions:**
```python
{"post": "create_draft_to_issue"}  # Custom action
```

---

## Chart Builder Utility Reusability

### build_analytics_chart() Function
Located: `plane.utils.build_chart` (line 153-194)

**Signature:**
```python
def build_analytics_chart(
    queryset: QuerySet[Issue],
    x_axis: str,
    group_by: Optional[str] = None,
    date_filter: Optional[str] = None,
) -> Dict[str, Union[List[Dict[str, Any]], Dict[str, str]]]
```

**Key features:**
1. **Validation:** Validates x_axis and group_by against `x_axis_mapper` (line 20-34)
2. **Field mapping:** Maps axis types to model fields via `get_x_axis_field()` (line 44-75)
3. **Additional filters:** Supports additional filters per axis type (e.g., soft delete checks)
4. **Aggregation:** Uses Count(distinct=True) by default
5. **Response types:**
   - Simple chart: `{"data": [...], "schema": {}}`
   - Grouped chart: `{"data": [...], "schema": {...}}`

**Supported x_axis types:**
- STATES, STATE_GROUPS, LABELS, ASSIGNEES
- ESTIMATE_POINTS, CYCLES, MODULES, PRIORITY
- START_DATE, TARGET_DATE, CREATED_AT, COMPLETED_AT, CREATED_BY

**Reusability:** Highly reusable for any Issue-based analytics. Can be adapted for Dashboard widgets.

---

## Recommendations for Dashboard Model & API

### Model Design

**Dashboard Model:**
```python
class Dashboard(WorkspaceBaseModel):
    """Pro feature dashboard for workspace analytics"""

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_dashboards"
    )
    is_default = models.BooleanField(default=False)
    is_pro_feature = models.BooleanField(default=True)
    config = models.JSONField(default=dict)  # Layout, filters, etc.

    class Meta:
        unique_together = ["workspace", "name", "deleted_at"]
        constraints = [...]
        db_table = "dashboards"
        ordering = ("-created_at",)
```

**DashboardWidget Model:**
```python
class DashboardWidget(BaseModel):
    """Widget configuration for dashboard"""

    class WidgetType(models.TextChoices):
        WORK_ITEMS_CHART = "work_items_chart", "Work Items Chart"
        ANALYTICS_OVERVIEW = "analytics_overview", "Analytics Overview"
        PROJECT_STATS = "project_stats", "Project Stats"
        # Add more types

    dashboard = models.ForeignKey(
        "db.Dashboard",
        on_delete=models.CASCADE,
        related_name="widgets"
    )
    widget_type = models.CharField(max_length=50, choices=WidgetType.choices)
    title = models.CharField(max_length=255)
    config = models.JSONField(default=dict)  # x_axis, group_by, filters
    sort_order = models.FloatField(default=65535)
    size = models.JSONField(default=dict)  # {"width": 6, "height": 4}

    class Meta:
        db_table = "dashboard_widgets"
        ordering = ("sort_order",)
```

### API Design

**Views structure:**
```python
# Base view for dashboard operations
class DashboardBaseView(BaseAPIView):
    def initialize_dashboard(self, slug: str, dashboard_id: str):
        self._workspace_slug = slug
        self._dashboard_id = dashboard_id
        # Load dashboard, check pro access

# List/Create dashboards
class DashboardEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        # List all dashboards for workspace

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        # Create dashboard (check pro feature access)

# Dashboard detail operations
class DashboardDetailEndpoint(DashboardBaseView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, dashboard_id):
        # Retrieve dashboard with widgets

# Widget data endpoint
class DashboardWidgetDataEndpoint(DashboardBaseView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, dashboard_id, widget_id):
        # Use build_analytics_chart() for chart widgets
        # Return formatted data based on widget_type
```

**URL patterns:**
```python
path("workspaces/<str:slug>/dashboards/",
     DashboardEndpoint.as_view(), name="dashboards"),

path("workspaces/<str:slug>/dashboards/<uuid:dashboard_id>/",
     DashboardDetailEndpoint.as_view(), name="dashboard-detail"),

path("workspaces/<str:slug>/dashboards/<uuid:dashboard_id>/widgets/",
     DashboardWidgetEndpoint.as_view(), name="dashboard-widgets"),

path("workspaces/<str:slug>/dashboards/<uuid:dashboard_id>/widgets/<uuid:widget_id>/data/",
     DashboardWidgetDataEndpoint.as_view(), name="dashboard-widget-data"),
```

### Chart Integration

**Reuse build_analytics_chart():**
```python
def get_widget_data(self, widget):
    if widget.widget_type == "work_items_chart":
        queryset = Issue.issue_objects.filter(**self.filters["base_filters"])
        return build_analytics_chart(
            queryset,
            x_axis=widget.config.get("x_axis", "PRIORITY"),
            group_by=widget.config.get("group_by", None)
        )
    elif widget.widget_type == "analytics_overview":
        # Reuse logic from AdvanceAnalyticsEndpoint
        return self.get_overview_data()
```

---

## Key Takeaways

1. **Model inheritance:** Use WorkspaceBaseModel for workspace-scoped dashboards
2. **Soft delete:** All models support soft delete with unique constraints
3. **JSONField:** Use for flexible config storage (filters, layout, preferences)
4. **Permissions:** Use @allow_permission decorator at WORKSPACE level
5. **URL structure:** Follow `workspaces/<slug>/<resource>/` pattern
6. **Chart utility:** build_analytics_chart() is ready for reuse with Issue querysets
7. **Filter pattern:** Use get_analytics_filters() for consistent date/project filtering
8. **Response format:** Follow `{"data": [...], "schema": {...}}` for chart responses

---

## Unresolved Questions

1. **Pro feature gating:** How is pro feature access validated? Need to check license/subscription models
2. **Serializers:** What serializer patterns are used for workspace endpoints? Need to check serializers folder
3. **Permissions:** Is there a PRO_FEATURE permission level or role check needed?
4. **Real-time updates:** Are there WebSocket patterns for dashboard real-time updates?
5. **Export functionality:** Should dashboards support export like WorkspaceUserActivity (line 143)?
