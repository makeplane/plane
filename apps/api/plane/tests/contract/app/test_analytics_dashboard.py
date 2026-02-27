# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from uuid import uuid4
from django.urls import reverse
from rest_framework import status
from unittest.mock import patch

from plane.db.models.analytics_dashboard import AnalyticsDashboard, AnalyticsDashboardWidget


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def dashboard(db, workspace, create_user):
    """Create a test analytics dashboard owned by create_user."""
    return AnalyticsDashboard.objects.create(
        workspace=workspace,
        name="Test Dashboard",
        description="Test description",
        owner=create_user,
    )


@pytest.fixture
def widget(db, dashboard):
    """Create a test widget attached to the dashboard fixture."""
    return AnalyticsDashboardWidget.objects.create(
        dashboard=dashboard,
        widget_type="bar",
        title="Test Widget",
        chart_property="priority",
        chart_metric="count",
        config={},
        position={"row": 0, "col": 0, "width": 6, "height": 2},
    )


# ---------------------------------------------------------------------------
# Dashboard CRUD
# ---------------------------------------------------------------------------

@pytest.mark.contract
class TestAnalyticsDashboardAPI:
    """Tests for /workspaces/<slug>/analytics-dashboards/ endpoints."""

    @pytest.mark.django_db
    def test_list_dashboards_empty(self, session_client, workspace):
        """GET returns 200 with empty list when no dashboards exist."""
        url = reverse("analytics-dashboards", kwargs={"slug": workspace.slug})
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data == []

    @pytest.mark.django_db
    @patch("plane.bgtasks.webhook_task.model_activity.delay")
    def test_create_dashboard(self, mock_activity, session_client, workspace):
        """POST with valid data creates dashboard and fires webhook."""
        url = reverse("analytics-dashboards", kwargs={"slug": workspace.slug})
        data = {"name": "My Dashboard", "description": "Test"}
        response = session_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "My Dashboard"
        assert AnalyticsDashboard.objects.count() == 1
        mock_activity.assert_called_once()

    @pytest.mark.django_db
    def test_create_dashboard_missing_name(self, session_client, workspace):
        """POST without name returns 400 validation error."""
        url = reverse("analytics-dashboards", kwargs={"slug": workspace.slug})
        response = session_client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_dashboard_invalid_workspace(self, session_client):
        """POST to nonexistent workspace slug returns 404."""
        url = reverse("analytics-dashboards", kwargs={"slug": "nonexistent-workspace-slug"})
        response = session_client.post(url, {"name": "Test"}, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_list_dashboards(self, session_client, workspace, dashboard):
        """GET returns list containing existing dashboard."""
        url = reverse("analytics-dashboards", kwargs={"slug": workspace.slug})
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["name"] == "Test Dashboard"

    @pytest.mark.django_db
    def test_list_dashboards_includes_widget_count(self, session_client, workspace, dashboard, widget):
        """Dashboard list response includes accurate widget_count."""
        url = reverse("analytics-dashboards", kwargs={"slug": workspace.slug})
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data[0]["widget_count"] == 1

    @pytest.mark.django_db
    def test_get_dashboard_detail(self, session_client, workspace, dashboard):
        """GET detail returns dashboard fields."""
        url = reverse("analytics-dashboard-detail", kwargs={"slug": workspace.slug, "dashboard_id": dashboard.id})
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Test Dashboard"
        assert response.data["description"] == "Test description"

    @pytest.mark.django_db
    def test_get_dashboard_detail_includes_widgets(self, session_client, workspace, dashboard, widget):
        """GET detail response includes nested widgets list."""
        url = reverse("analytics-dashboard-detail", kwargs={"slug": workspace.slug, "dashboard_id": dashboard.id})
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert "widgets" in response.data
        assert len(response.data["widgets"]) == 1
        assert response.data["widgets"][0]["title"] == "Test Widget"

    @pytest.mark.django_db
    def test_get_dashboard_not_found(self, session_client, workspace):
        """GET with unknown UUID returns 404."""
        url = reverse("analytics-dashboard-detail", kwargs={"slug": workspace.slug, "dashboard_id": uuid4()})
        response = session_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    @patch("plane.bgtasks.webhook_task.model_activity.delay")
    def test_update_dashboard(self, mock_activity, session_client, workspace, dashboard):
        """PATCH updates dashboard name and fires webhook."""
        url = reverse("analytics-dashboard-detail", kwargs={"slug": workspace.slug, "dashboard_id": dashboard.id})
        response = session_client.patch(url, {"name": "Updated Dashboard"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Updated Dashboard"
        mock_activity.assert_called_once()

    @pytest.mark.django_db
    @patch("plane.bgtasks.webhook_task.model_activity.delay")
    def test_update_dashboard_not_found(self, mock_activity, session_client, workspace):
        """PATCH with unknown dashboard UUID returns 404."""
        url = reverse("analytics-dashboard-detail", kwargs={"slug": workspace.slug, "dashboard_id": uuid4()})
        response = session_client.patch(url, {"name": "Whatever"}, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        mock_activity.assert_not_called()

    @pytest.mark.django_db
    @patch("plane.bgtasks.webhook_task.model_activity.delay")
    def test_delete_dashboard(self, mock_activity, session_client, workspace, dashboard):
        """DELETE soft-deletes dashboard (record survives via all_objects) and fires webhook."""
        url = reverse("analytics-dashboard-detail", kwargs={"slug": workspace.slug, "dashboard_id": dashboard.id})
        response = session_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        # Soft delete: still exists in all_objects but not in default manager
        assert AnalyticsDashboard.all_objects.filter(id=dashboard.id).exists()
        assert not AnalyticsDashboard.objects.filter(id=dashboard.id, deleted_at__isnull=True).exists()
        mock_activity.assert_called_once()

    @pytest.mark.django_db
    @patch("plane.bgtasks.webhook_task.model_activity.delay")
    def test_delete_dashboard_not_found(self, mock_activity, session_client, workspace):
        """DELETE with unknown dashboard UUID returns 404."""
        url = reverse("analytics-dashboard-detail", kwargs={"slug": workspace.slug, "dashboard_id": uuid4()})
        response = session_client.delete(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
        mock_activity.assert_not_called()

    @pytest.mark.django_db
    def test_unauthenticated_request_rejected(self, api_client, workspace):
        """Unauthenticated requests are rejected with 401/403."""
        url = reverse("analytics-dashboards", kwargs={"slug": workspace.slug})
        response = api_client.get(url)
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]


# ---------------------------------------------------------------------------
# Widget CRUD
# ---------------------------------------------------------------------------

@pytest.mark.contract
class TestAnalyticsDashboardWidgetAPI:
    """Tests for /analytics-dashboards/<id>/widgets/ endpoints."""

    @pytest.mark.django_db
    def test_list_widgets_empty(self, session_client, workspace, dashboard):
        """GET returns empty list when dashboard has no widgets."""
        url = reverse("analytics-dashboard-widgets", kwargs={"slug": workspace.slug, "dashboard_id": dashboard.id})
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data == []

    @pytest.mark.django_db
    @patch("plane.bgtasks.webhook_task.model_activity.delay")
    def test_create_widget(self, mock_activity, session_client, workspace, dashboard):
        """POST with valid payload creates widget and fires webhook."""
        url = reverse("analytics-dashboard-widgets", kwargs={"slug": workspace.slug, "dashboard_id": dashboard.id})
        data = {
            "widget_type": "bar",
            "title": "Priority Widget",
            "chart_property": "priority",
            "chart_metric": "count",
            "config": {"color_preset": "modern"},
            "position": {"row": 0, "col": 0, "width": 6, "height": 2},
        }
        response = session_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == "Priority Widget"
        assert response.data["widget_type"] == "bar"
        mock_activity.assert_called_once()

    @pytest.mark.django_db
    @patch("plane.bgtasks.webhook_task.model_activity.delay")
    def test_create_widget_missing_chart_property(self, mock_activity, session_client, workspace, dashboard):
        """POST without chart_property returns 400."""
        url = reverse("analytics-dashboard-widgets", kwargs={"slug": workspace.slug, "dashboard_id": dashboard.id})
        data = {"widget_type": "bar", "title": "Bad Widget"}
        response = session_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        mock_activity.assert_not_called()

    @pytest.mark.django_db
    @patch("plane.bgtasks.webhook_task.model_activity.delay")
    def test_create_widget_dashboard_not_found(self, mock_activity, session_client, workspace):
        """POST to unknown dashboard UUID returns 404."""
        url = reverse("analytics-dashboard-widgets", kwargs={"slug": workspace.slug, "dashboard_id": uuid4()})
        data = {"widget_type": "bar", "chart_property": "priority"}
        response = session_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        mock_activity.assert_not_called()

    @pytest.mark.django_db
    def test_list_widgets(self, session_client, workspace, dashboard, widget):
        """GET returns list with existing widget."""
        url = reverse("analytics-dashboard-widgets", kwargs={"slug": workspace.slug, "dashboard_id": dashboard.id})
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["title"] == "Test Widget"

    @pytest.mark.django_db
    def test_get_widget_detail(self, session_client, workspace, dashboard, widget):
        """GET detail returns widget with all expected fields."""
        url = reverse("analytics-dashboard-widget-detail", kwargs={
            "slug": workspace.slug,
            "dashboard_id": dashboard.id,
            "widget_id": widget.id,
        })
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Test Widget"
        assert response.data["chart_property"] == "priority"
        assert response.data["chart_metric"] == "count"

    @pytest.mark.django_db
    def test_get_widget_not_found(self, session_client, workspace, dashboard):
        """GET with unknown widget UUID returns 404."""
        url = reverse("analytics-dashboard-widget-detail", kwargs={
            "slug": workspace.slug,
            "dashboard_id": dashboard.id,
            "widget_id": uuid4(),
        })
        response = session_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    @patch("plane.bgtasks.webhook_task.model_activity.delay")
    def test_update_widget(self, mock_activity, session_client, workspace, dashboard, widget):
        """PATCH updates widget title and fires webhook."""
        url = reverse("analytics-dashboard-widget-detail", kwargs={
            "slug": workspace.slug,
            "dashboard_id": dashboard.id,
            "widget_id": widget.id,
        })
        response = session_client.patch(url, {"title": "Updated Widget"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Updated Widget"
        mock_activity.assert_called_once()

    @pytest.mark.django_db
    @patch("plane.bgtasks.webhook_task.model_activity.delay")
    def test_update_widget_not_found(self, mock_activity, session_client, workspace, dashboard):
        """PATCH with unknown widget UUID returns 404."""
        url = reverse("analytics-dashboard-widget-detail", kwargs={
            "slug": workspace.slug,
            "dashboard_id": dashboard.id,
            "widget_id": uuid4(),
        })
        response = session_client.patch(url, {"title": "Whatever"}, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        mock_activity.assert_not_called()

    @pytest.mark.django_db
    @patch("plane.bgtasks.webhook_task.model_activity.delay")
    def test_delete_widget(self, mock_activity, session_client, workspace, dashboard, widget):
        """DELETE soft-deletes widget and fires webhook."""
        url = reverse("analytics-dashboard-widget-detail", kwargs={
            "slug": workspace.slug,
            "dashboard_id": dashboard.id,
            "widget_id": widget.id,
        })
        response = session_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        # Soft delete: still accessible via all_objects
        assert AnalyticsDashboardWidget.all_objects.filter(id=widget.id).exists()
        assert not AnalyticsDashboardWidget.objects.filter(id=widget.id, deleted_at__isnull=True).exists()
        mock_activity.assert_called_once()

    @pytest.mark.django_db
    @patch("plane.bgtasks.webhook_task.model_activity.delay")
    def test_delete_widget_not_found(self, mock_activity, session_client, workspace, dashboard):
        """DELETE with unknown widget UUID returns 404."""
        url = reverse("analytics-dashboard-widget-detail", kwargs={
            "slug": workspace.slug,
            "dashboard_id": dashboard.id,
            "widget_id": uuid4(),
        })
        response = session_client.delete(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
        mock_activity.assert_not_called()


# ---------------------------------------------------------------------------
# Bulk Positions
# ---------------------------------------------------------------------------

@pytest.mark.contract
class TestAnalyticsDashboardBulkPositions:
    """Tests for PATCH /widgets/positions/ endpoint."""

    @pytest.mark.django_db
    def test_bulk_update_positions(self, session_client, workspace, dashboard, widget):
        """PATCH with valid positions updates all specified widgets."""
        url = reverse("analytics-dashboard-widget-bulk-positions", kwargs={
            "slug": workspace.slug,
            "dashboard_id": dashboard.id,
        })
        data = {
            "positions": [
                {"id": str(widget.id), "position": {"row": 2, "col": 3, "width": 4, "height": 3}}
            ]
        }
        response = session_client.patch(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["updated"] == 1
        widget.refresh_from_db()
        assert widget.position["row"] == 2
        assert widget.position["col"] == 3
        assert widget.position["width"] == 4
        assert widget.position["height"] == 3

    @pytest.mark.django_db
    def test_bulk_update_empty_positions(self, session_client, workspace, dashboard):
        """PATCH with empty positions list returns 400."""
        url = reverse("analytics-dashboard-widget-bulk-positions", kwargs={
            "slug": workspace.slug,
            "dashboard_id": dashboard.id,
        })
        response = session_client.patch(url, {"positions": []}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_bulk_update_missing_positions_key(self, session_client, workspace, dashboard):
        """PATCH without positions key returns 400."""
        url = reverse("analytics-dashboard-widget-bulk-positions", kwargs={
            "slug": workspace.slug,
            "dashboard_id": dashboard.id,
        })
        response = session_client.patch(url, {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_bulk_update_nonexistent_dashboard(self, session_client, workspace):
        """PATCH targeting unknown dashboard UUID returns 404."""
        url = reverse("analytics-dashboard-widget-bulk-positions", kwargs={
            "slug": workspace.slug,
            "dashboard_id": uuid4(),
        })
        data = {
            "positions": [{"id": str(uuid4()), "position": {"row": 0, "col": 0, "width": 1, "height": 1}}]
        }
        response = session_client.patch(url, data, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_bulk_update_skips_unknown_widget_ids(self, session_client, workspace, dashboard, widget):
        """PATCH with an unknown widget ID skips it and reports 0 updated."""
        url = reverse("analytics-dashboard-widget-bulk-positions", kwargs={
            "slug": workspace.slug,
            "dashboard_id": dashboard.id,
        })
        data = {
            "positions": [
                {"id": str(uuid4()), "position": {"row": 5, "col": 5, "width": 2, "height": 2}}
            ]
        }
        response = session_client.patch(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["updated"] == 0

    @pytest.mark.django_db
    def test_bulk_update_clamps_negative_values(self, session_client, workspace, dashboard, widget):
        """PATCH with negative position values clamps to zero/one minimum."""
        url = reverse("analytics-dashboard-widget-bulk-positions", kwargs={
            "slug": workspace.slug,
            "dashboard_id": dashboard.id,
        })
        data = {
            "positions": [
                {"id": str(widget.id), "position": {"row": -5, "col": -3, "width": -1, "height": 0}}
            ]
        }
        response = session_client.patch(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        widget.refresh_from_db()
        assert widget.position["row"] == 0
        assert widget.position["col"] == 0
        assert widget.position["width"] >= 1
        assert widget.position["height"] >= 1


# ---------------------------------------------------------------------------
# Dashboard Duplicate
# ---------------------------------------------------------------------------

@pytest.mark.contract
class TestAnalyticsDashboardDuplicate:
    """Tests for POST /analytics-dashboards/<id>/duplicate/ endpoint."""

    @pytest.mark.django_db
    def test_duplicate_dashboard(self, session_client, workspace, dashboard, widget):
        """POST clones dashboard with widgets; copy name gets (Copy) suffix."""
        url = reverse("analytics-dashboard-duplicate", kwargs={
            "slug": workspace.slug,
            "dashboard_id": dashboard.id,
        })
        response = session_client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Test Dashboard (Copy)"
        # Cloned widgets are attached to the new dashboard
        new_id = response.data["id"]
        assert AnalyticsDashboardWidget.objects.filter(dashboard_id=new_id).count() == 1

    @pytest.mark.django_db
    def test_duplicate_nonexistent_dashboard(self, session_client, workspace):
        """POST to unknown dashboard UUID returns 404."""
        url = reverse("analytics-dashboard-duplicate", kwargs={
            "slug": workspace.slug,
            "dashboard_id": uuid4(),
        })
        response = session_client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_duplicate_generates_unique_name_on_collision(self, session_client, workspace, dashboard, widget):
        """Successive duplicates generate incrementing copy names."""
        url = reverse("analytics-dashboard-duplicate", kwargs={
            "slug": workspace.slug,
            "dashboard_id": dashboard.id,
        })
        # First copy
        resp1 = session_client.post(url, {}, format="json")
        assert resp1.status_code == status.HTTP_201_CREATED
        assert resp1.data["name"] == "Test Dashboard (Copy)"
        # Second copy: name collision → incremented counter
        resp2 = session_client.post(url, {}, format="json")
        assert resp2.status_code == status.HTTP_201_CREATED
        assert resp2.data["name"] == "Test Dashboard (Copy 2)"

    @pytest.mark.django_db
    def test_duplicate_dashboard_without_widgets(self, session_client, workspace, dashboard):
        """POST on a dashboard with no widgets creates empty copy."""
        url = reverse("analytics-dashboard-duplicate", kwargs={
            "slug": workspace.slug,
            "dashboard_id": dashboard.id,
        })
        response = session_client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        new_id = response.data["id"]
        assert AnalyticsDashboardWidget.objects.filter(dashboard_id=new_id).count() == 0

    @pytest.mark.django_db
    def test_duplicate_preserves_dashboard_config(self, session_client, workspace, create_user):
        """POST copies dashboard config dict to the new dashboard."""
        src = AnalyticsDashboard.objects.create(
            workspace=workspace,
            name="Config Dashboard",
            owner=create_user,
            config={"project_ids": ["proj-123"]},
        )
        url = reverse("analytics-dashboard-duplicate", kwargs={
            "slug": workspace.slug,
            "dashboard_id": src.id,
        })
        response = session_client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        new_id = response.data["id"]
        new_dash = AnalyticsDashboard.objects.get(id=new_id)
        assert new_dash.config == {"project_ids": ["proj-123"]}


# ---------------------------------------------------------------------------
# Widget Data (chart aggregation)
# ---------------------------------------------------------------------------

@pytest.mark.contract
class TestAnalyticsDashboardWidgetData:
    """Tests for GET /widgets/<id>/data/ endpoint."""

    @pytest.mark.django_db
    def test_get_number_widget_data(self, session_client, workspace, dashboard, create_user):
        """GET on a number widget returns count metric."""
        number_widget = AnalyticsDashboardWidget.objects.create(
            dashboard=dashboard,
            widget_type="number",
            title="Issue Count",
            chart_property="priority",
            chart_metric="count",
        )
        url = reverse("analytics-dashboard-widget-data", kwargs={
            "slug": workspace.slug,
            "dashboard_id": dashboard.id,
            "widget_id": number_widget.id,
        })
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert "value" in response.data
        assert response.data["metric"] == "count"
        assert isinstance(response.data["value"], int)

    @pytest.mark.django_db
    def test_get_bar_widget_data(self, session_client, workspace, dashboard, widget):
        """GET on a bar chart widget returns chart data structure."""
        url = reverse("analytics-dashboard-widget-data", kwargs={
            "slug": workspace.slug,
            "dashboard_id": dashboard.id,
            "widget_id": widget.id,
        })
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_get_widget_data_invalid_chart_property(self, session_client, workspace, dashboard, create_user):
        """GET widget with unknown chart_property returns 400."""
        bad_widget = AnalyticsDashboardWidget.objects.create(
            dashboard=dashboard,
            widget_type="bar",
            chart_property="nonexistent_property",
            chart_metric="count",
        )
        url = reverse("analytics-dashboard-widget-data", kwargs={
            "slug": workspace.slug,
            "dashboard_id": dashboard.id,
            "widget_id": bad_widget.id,
        })
        response = session_client.get(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_get_widget_data_not_found(self, session_client, workspace, dashboard):
        """GET with unknown widget UUID returns 404."""
        url = reverse("analytics-dashboard-widget-data", kwargs={
            "slug": workspace.slug,
            "dashboard_id": dashboard.id,
            "widget_id": uuid4(),
        })
        response = session_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_get_number_widget_invalid_metric(self, session_client, workspace, dashboard, create_user):
        """GET number widget with unsupported metric returns 400."""
        invalid_widget = AnalyticsDashboardWidget.objects.create(
            dashboard=dashboard,
            widget_type="number",
            chart_property="priority",
            chart_metric="unsupported_metric",
        )
        url = reverse("analytics-dashboard-widget-data", kwargs={
            "slug": workspace.slug,
            "dashboard_id": dashboard.id,
            "widget_id": invalid_widget.id,
        })
        response = session_client.get(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
