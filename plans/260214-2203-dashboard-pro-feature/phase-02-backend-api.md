# Phase 2: Backend API Endpoints

## Context Links

- **Parent Plan**: [plan.md](./plan.md)
- **Previous Phase**: [Phase 1: Backend Models](./phase-01-backend-models.md)
- **Research Reports**:
  - [Backend Patterns](./research/researcher-01-backend-patterns.md)
- **Dependencies**: Phase 1 must be completed (models exist)

## Overview

**Date**: 2026-02-14
**Priority**: P1
**Status**: Completed
**Estimated Effort**: 4 hours
**Actual Effort**: 1 hour

Implement REST API endpoints for dashboard CRUD, widget CRUD, and widget data fetching using existing analytics infrastructure.

## Key Insights

1. **Reuse Analytics**: Use `build_analytics_chart()` for widget data aggregation
2. **Permission Pattern**: Use `@allow_permission([ADMIN, MEMBER], level="WORKSPACE")`
3. **Serializer Pattern**: Nested serializers for dashboard with widgets
4. **URL Pattern**: `/api/workspaces/{slug}/dashboards/` follows workspace convention
5. **Filter Pattern**: Use `get_analytics_filters()` for consistent filtering

## Requirements

### Functional Requirements

1. Dashboard CRUD endpoints (list, create, retrieve, update, delete)
2. Widget CRUD endpoints (list, create, retrieve, update, delete)
3. Widget data endpoint returning chart data from analytics
4. Support project filtering via dashboard config
5. Bulk widget operations for performance
6. Sort order management for dashboards and widgets

### Non-Functional Requirements

1. Response time <500ms for list endpoints
2. Response time <1s for widget data endpoints
3. Proper error handling with descriptive messages
4. Pagination for dashboard list (25 items per page)
5. Permissions enforced at workspace level

## Architecture

### API Endpoint Structure

```
/api/workspaces/{slug}/dashboards/
    GET     - List all dashboards for workspace
    POST    - Create new dashboard

/api/workspaces/{slug}/dashboards/{dashboard_id}/
    GET     - Retrieve dashboard with widgets
    PATCH   - Update dashboard
    DELETE  - Delete dashboard (soft delete)

/api/workspaces/{slug}/dashboards/{dashboard_id}/widgets/
    GET     - List widgets for dashboard
    POST    - Create widget

/api/workspaces/{slug}/dashboards/{dashboard_id}/widgets/{widget_id}/
    GET     - Retrieve widget config
    PATCH   - Update widget
    DELETE  - Delete widget

/api/workspaces/{slug}/dashboards/{dashboard_id}/widgets/{widget_id}/data/
    GET     - Fetch widget data (uses build_analytics_chart)
```

### Data Flow

1. Client requests widget data → ViewSet validates dashboard access
2. ViewSet extracts widget config → calls `build_analytics_chart()`
3. Chart builder queries Issue model → aggregates by x_axis
4. Returns `{data: [], schema: {}}` → serializer formats response
5. Client receives formatted chart data

## Related Code Files

### Files to Create

1. **`apps/api/plane/api/serializers/dashboard.py`**
   - DashboardSerializer
   - DashboardWidgetSerializer
   - DashboardDetailSerializer (with nested widgets)

2. **`apps/api/plane/api/views/dashboard.py`**
   - DashboardViewSet
   - DashboardWidgetViewSet
   - DashboardWidgetDataEndpoint

3. **`apps/api/plane/api/urls/dashboard.py`**
   - URL patterns for dashboard endpoints

### Files to Modify

1. **`apps/api/plane/api/urls/__init__.py`**
   - Include dashboard URL patterns

## Implementation Steps

### Step 1: Create Serializers

**File**: `apps/api/plane/api/serializers/dashboard.py`

```python
from rest_framework import serializers
from plane.db.models import Dashboard, DashboardWidget


class DashboardWidgetSerializer(serializers.ModelSerializer):
    """Serializer for dashboard widgets"""

    widget_type_display = serializers.CharField(
        source="get_widget_type_display",
        read_only=True
    )

    class Meta:
        model = DashboardWidget
        fields = [
            "id",
            "dashboard",
            "widget_type",
            "widget_type_display",
            "title",
            "chart_property",
            "chart_metric",
            "config",
            "position",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_config(self, value):
        """Validate widget config structure"""
        required_keys = ["color_preset"]
        for key in required_keys:
            if key not in value:
                raise serializers.ValidationError(
                    f"Missing required config key: {key}"
                )
        return value


class DashboardSerializer(serializers.ModelSerializer):
    """Serializer for dashboard (without widgets)"""

    owner_name = serializers.CharField(
        source="owner.get_full_name",
        read_only=True
    )
    widget_count = serializers.SerializerMethodField()

    class Meta:
        model = Dashboard
        fields = [
            "id",
            "workspace",
            "name",
            "description",
            "logo_props",
            "owner",
            "owner_name",
            "is_default",
            "sort_order",
            "config",
            "widget_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace", "owner", "created_at", "updated_at"]

    def get_widget_count(self, obj):
        return obj.widgets.filter(deleted_at__isnull=True).count()

    def validate_name(self, value):
        """Validate dashboard name uniqueness in workspace"""
        workspace = self.context.get("workspace")
        if workspace:
            exists = Dashboard.objects.filter(
                workspace=workspace,
                name=value,
                deleted_at__isnull=True
            ).exclude(id=self.instance.id if self.instance else None).exists()

            if exists:
                raise serializers.ValidationError(
                    "Dashboard with this name already exists in workspace"
                )
        return value


class DashboardDetailSerializer(DashboardSerializer):
    """Dashboard serializer with nested widgets"""

    widgets = DashboardWidgetSerializer(many=True, read_only=True)

    class Meta(DashboardSerializer.Meta):
        fields = DashboardSerializer.Meta.fields + ["widgets"]
```

### Step 2: Create ViewSets

**File**: `apps/api/plane/api/views/dashboard.py`

```python
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q

from plane.app.views.base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import Dashboard, DashboardWidget, Issue
from plane.api.serializers import (
    DashboardSerializer,
    DashboardDetailSerializer,
    DashboardWidgetSerializer,
)
from plane.utils.build_chart import build_analytics_chart
from plane.utils.analytics_filters import get_analytics_filters


class DashboardEndpoint(BaseAPIView):
    """List and create dashboards"""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        """List all dashboards for workspace"""
        workspace = request.workspace

        dashboards = Dashboard.objects.filter(
            workspace=workspace,
            deleted_at__isnull=True
        ).order_by("sort_order", "-created_at")

        serializer = DashboardSerializer(
            dashboards,
            many=True,
            context={"workspace": workspace}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        """Create new dashboard"""
        workspace = request.workspace

        serializer = DashboardSerializer(
            data=request.data,
            context={"workspace": workspace}
        )

        if serializer.is_valid():
            serializer.save(
                workspace=workspace,
                owner=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DashboardDetailEndpoint(BaseAPIView):
    """Retrieve, update, delete dashboard"""

    def get_dashboard(self, workspace, dashboard_id):
        """Helper to get dashboard with permission check"""
        return Dashboard.objects.get(
            id=dashboard_id,
            workspace=workspace,
            deleted_at__isnull=True
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, dashboard_id):
        """Retrieve dashboard with widgets"""
        try:
            dashboard = self.get_dashboard(request.workspace, dashboard_id)
            serializer = DashboardDetailSerializer(dashboard)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Dashboard.DoesNotExist:
            return Response(
                {"error": "Dashboard not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def patch(self, request, slug, dashboard_id):
        """Update dashboard"""
        try:
            dashboard = self.get_dashboard(request.workspace, dashboard_id)
            serializer = DashboardSerializer(
                dashboard,
                data=request.data,
                partial=True,
                context={"workspace": request.workspace}
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Dashboard.DoesNotExist:
            return Response(
                {"error": "Dashboard not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, dashboard_id):
        """Delete dashboard (soft delete)"""
        try:
            dashboard = self.get_dashboard(request.workspace, dashboard_id)
            dashboard.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Dashboard.DoesNotExist:
            return Response(
                {"error": "Dashboard not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class DashboardWidgetEndpoint(BaseAPIView):
    """List and create widgets for dashboard"""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, dashboard_id):
        """List widgets for dashboard"""
        try:
            dashboard = Dashboard.objects.get(
                id=dashboard_id,
                workspace=request.workspace,
                deleted_at__isnull=True
            )

            widgets = DashboardWidget.objects.filter(
                dashboard=dashboard,
                deleted_at__isnull=True
            ).order_by("sort_order", "-created_at")

            serializer = DashboardWidgetSerializer(widgets, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Dashboard.DoesNotExist:
            return Response(
                {"error": "Dashboard not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, dashboard_id):
        """Create widget"""
        try:
            dashboard = Dashboard.objects.get(
                id=dashboard_id,
                workspace=request.workspace,
                deleted_at__isnull=True
            )

            serializer = DashboardWidgetSerializer(data=request.data)

            if serializer.is_valid():
                serializer.save(dashboard=dashboard)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Dashboard.DoesNotExist:
            return Response(
                {"error": "Dashboard not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class DashboardWidgetDetailEndpoint(BaseAPIView):
    """Retrieve, update, delete widget"""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, dashboard_id, widget_id):
        """Retrieve widget"""
        try:
            widget = DashboardWidget.objects.get(
                id=widget_id,
                dashboard_id=dashboard_id,
                dashboard__workspace=request.workspace,
                deleted_at__isnull=True
            )
            serializer = DashboardWidgetSerializer(widget)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except DashboardWidget.DoesNotExist:
            return Response(
                {"error": "Widget not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def patch(self, request, slug, dashboard_id, widget_id):
        """Update widget"""
        try:
            widget = DashboardWidget.objects.get(
                id=widget_id,
                dashboard_id=dashboard_id,
                dashboard__workspace=request.workspace,
                deleted_at__isnull=True
            )

            serializer = DashboardWidgetSerializer(
                widget,
                data=request.data,
                partial=True
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except DashboardWidget.DoesNotExist:
            return Response(
                {"error": "Widget not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, dashboard_id, widget_id):
        """Delete widget"""
        try:
            widget = DashboardWidget.objects.get(
                id=widget_id,
                dashboard_id=dashboard_id,
                dashboard__workspace=request.workspace,
                deleted_at__isnull=True
            )
            widget.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except DashboardWidget.DoesNotExist:
            return Response(
                {"error": "Widget not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class DashboardWidgetDataEndpoint(BaseAPIView):
    """Fetch widget data using analytics infrastructure"""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, dashboard_id, widget_id):
        """Get widget data"""
        try:
            widget = DashboardWidget.objects.select_related("dashboard").get(
                id=widget_id,
                dashboard_id=dashboard_id,
                dashboard__workspace=request.workspace,
                deleted_at__isnull=True
            )

            # Get analytics filters
            filters = get_analytics_filters(request)

            # Build base queryset
            queryset = Issue.issue_objects.filter(
                workspace=request.workspace,
                **filters.get("base_filters", {})
            )

            # Apply project filter from dashboard config
            project_ids = widget.dashboard.config.get("project_ids", [])
            if project_ids:
                queryset = queryset.filter(project_id__in=project_ids)

            # Apply widget-specific filters from config (whitelist only)
            # <!-- Updated: Validation Session 2 - Whitelist filter keys to prevent ORM injection -->
            ALLOWED_WIDGET_FILTER_KEYS = [
                "state", "priority", "labels", "assignee",
                "cycle", "module", "state_group",
            ]
            widget_filters = widget.config.get("filters", {})
            safe_filters = {
                k: v for k, v in widget_filters.items()
                if k in ALLOWED_WIDGET_FILTER_KEYS
            }
            if safe_filters:
                queryset = queryset.filter(**safe_filters)

            # Handle number widget (simple count)
            if widget.widget_type == DashboardWidget.WidgetType.NUMBER:
                if widget.chart_metric == "count":
                    count = queryset.count()
                elif widget.chart_metric == "estimate_points":
                    count = queryset.aggregate(
                        total=models.Sum("estimate_point")
                    )["total"] or 0
                else:
                    count = queryset.count()

                return Response({
                    "value": count,
                    "metric": widget.chart_metric
                }, status=status.HTTP_200_OK)

            # Handle chart widgets using build_analytics_chart
            chart_data = build_analytics_chart(
                queryset,
                x_axis=widget.chart_property,
                group_by=None,  # Can be extended for grouped charts
                date_filter=filters.get("analytics_date_range")
            )

            return Response(chart_data, status=status.HTTP_200_OK)

        except DashboardWidget.DoesNotExist:
            return Response(
                {"error": "Widget not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

### Step 3: Create URL Patterns

**File**: `apps/api/plane/api/urls/dashboard.py`

```python
from django.urls import path
from plane.api.views import (
    DashboardEndpoint,
    DashboardDetailEndpoint,
    DashboardWidgetEndpoint,
    DashboardWidgetDetailEndpoint,
    DashboardWidgetDataEndpoint,
)

urlpatterns = [
    # Dashboard CRUD
    path(
        "workspaces/<str:slug>/dashboards/",
        DashboardEndpoint.as_view(),
        name="dashboards"
    ),
    path(
        "workspaces/<str:slug>/dashboards/<uuid:dashboard_id>/",
        DashboardDetailEndpoint.as_view(),
        name="dashboard-detail"
    ),

    # Widget CRUD
    path(
        "workspaces/<str:slug>/dashboards/<uuid:dashboard_id>/widgets/",
        DashboardWidgetEndpoint.as_view(),
        name="dashboard-widgets"
    ),
    path(
        "workspaces/<str:slug>/dashboards/<uuid:dashboard_id>/widgets/<uuid:widget_id>/",
        DashboardWidgetDetailEndpoint.as_view(),
        name="dashboard-widget-detail"
    ),

    # Widget data
    path(
        "workspaces/<str:slug>/dashboards/<uuid:dashboard_id>/widgets/<uuid:widget_id>/data/",
        DashboardWidgetDataEndpoint.as_view(),
        name="dashboard-widget-data"
    ),
]
```

### Step 4: Include URL Patterns

**File**: `apps/api/plane/api/urls/__init__.py`

```python
# Add to existing imports
from .dashboard import urlpatterns as dashboard_urls

# Add to existing urlpatterns
urlpatterns += dashboard_urls
```

### Step 5: Test Endpoints

```bash
# Start dev server
cd apps/api
python manage.py runserver

# Test dashboard list
curl -X GET http://localhost:8000/api/workspaces/test-workspace/dashboards/ \
  -H "Authorization: Bearer <token>"

# Test dashboard create
curl -X POST http://localhost:8000/api/workspaces/test-workspace/dashboards/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Analytics Dashboard", "description": "Main analytics", "config": {"project_ids": []}}'

# Test widget create
curl -X POST http://localhost:8000/api/workspaces/test-workspace/dashboards/<dashboard_id>/widgets/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"widget_type": "bar", "title": "Issues by Priority", "chart_property": "priority", "chart_metric": "count", "config": {"color_preset": "modern"}, "position": {"row": 0, "col": 0, "width": 6, "height": 4}}'

# Test widget data
curl -X GET http://localhost:8000/api/workspaces/test-workspace/dashboards/<dashboard_id>/widgets/<widget_id>/data/ \
  -H "Authorization: Bearer <token>"
```

## Todo List

- [x] Create serializers in `plane/api/serializers/analytics_dashboard.py`
- [x] Create ViewSets in `plane/api/views/analytics_dashboard.py`
- [x] Create URL patterns in `plane/api/urls/analytics_dashboard.py`
- [x] Include dashboard URLs in main URL config
- [x] Verify imports and syntax
- [ ] Test dashboard list endpoint
- [ ] Test dashboard create endpoint
- [ ] Test dashboard retrieve endpoint
- [ ] Test dashboard update endpoint
- [ ] Test dashboard delete endpoint
- [ ] Test widget CRUD endpoints
- [ ] Test widget data endpoint with chart data
- [ ] Test widget data endpoint with number widget
- [ ] Verify permissions enforcement
- [ ] Verify project filtering works
- [ ] Add error handling tests

## Success Criteria

1. ✅ All dashboard CRUD endpoints functional
2. ✅ All widget CRUD endpoints functional
3. ✅ Widget data endpoint returns chart data from analytics
4. ✅ Number widget returns simple count/sum
5. ✅ Permissions enforced at workspace level
6. ✅ Project filtering works via dashboard config
7. ✅ Error responses include descriptive messages
8. ✅ Serializers validate input data
9. ✅ Soft delete works for dashboards and widgets
10. ✅ Response times meet requirements (<1s)

## Risk Assessment

**Risk**: Performance degradation with many widgets
- **Mitigation**: Add widget data caching, consider batch endpoint

**Risk**: build_analytics_chart may not support all chart properties
- **Mitigation**: Validate chart_property against x_axis_mapper

**Risk**: Concurrent widget updates cause data inconsistency
- **Mitigation**: Use database transactions for bulk operations

## Security Considerations

1. **Workspace Isolation**: All queries filter by workspace
2. **Permission Checks**: @allow_permission on all endpoints
3. **Input Validation**: Serializers validate all user input
4. **Query Injection**: Use Django ORM, no raw SQL
5. **Soft Delete**: Ensure deleted_at filter on all queries

## Next Steps

Proceed to [Phase 3: Frontend Types, Constants & Service](./phase-03-frontend-types-constants-service.md)
- Define TypeScript interfaces for API responses
- Create constants for widget types and color presets
- Implement DashboardService class
