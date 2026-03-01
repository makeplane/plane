# Dashboard V2 contract tests — CRUD, widgets, config, edge cases
import uuid

import pytest
from crum import impersonate
from django.urls import reverse
from rest_framework import status
from unittest.mock import patch

from plane.db.models import Dashboard, DashboardWidget, Project, User, WorkspaceMember


@pytest.fixture
def workspace_with_project(workspace, create_user):
    """Workspace + one project for dashboard scoping."""
    with impersonate(create_user):
        project = Project.objects.create(
            name="Test Project",
            workspace=workspace,
            identifier="TST",
        )
    return workspace, project


@pytest.fixture
def dashboard(workspace, create_user):
    """Pre-created dashboard for widget tests."""
    with impersonate(create_user):
        d = Dashboard.objects.create(
            name="Fixture Dashboard",
            workspace=workspace,
        )
    return d


@pytest.fixture
def widget(dashboard, workspace, create_user):
    """Pre-created widget."""
    with impersonate(create_user):
        return DashboardWidget.objects.create(
            name="Fixture Widget",
            dashboard=dashboard,
            workspace=workspace,
            chart_type="BAR_CHART",
            x_axis_property="priority",
            y_axis_metric="count",
        )


# ─── Phase 1: Dashboard CRUD ──────────────────────────────────────

@pytest.mark.django_db
@pytest.mark.contract
class TestDashboardCRUD:

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_create_dashboard_name_only(self, mock_activity, session_client, workspace):
        url = reverse("workspace-dashboards", kwargs={"slug": workspace.slug})
        resp = session_client.post(url, {"name": "Alpha", "access": 0}, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["name"] == "Alpha"
        assert "id" in resp.data

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_create_dashboard_with_description(self, mock_activity, session_client, workspace):
        url = reverse("workspace-dashboards", kwargs={"slug": workspace.slug})
        resp = session_client.post(url, {"name": "Beta", "description": "Desc", "access": 0}, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["description"] == "Desc"

    def test_create_dashboard_empty_name_rejected(self, session_client, workspace):
        url = reverse("workspace-dashboards", kwargs={"slug": workspace.slug})
        resp = session_client.post(url, {"name": "", "access": 0}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_list_dashboards(self, mock_activity, session_client, workspace):
        url = reverse("workspace-dashboards", kwargs={"slug": workspace.slug})
        # create two
        session_client.post(url, {"name": "D1"}, format="json")
        session_client.post(url, {"name": "D2"}, format="json")
        resp = session_client.get(url)
        assert resp.status_code == status.HTTP_200_OK
        # response may be list or paginated
        data = resp.data if isinstance(resp.data, list) else resp.data.get("results", resp.data)
        assert len(data) >= 2

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_update_dashboard_rename(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard", kwargs={"slug": workspace.slug, "pk": dashboard.id})
        resp = session_client.patch(url, {"name": "Renamed"}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["name"] == "Renamed"

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_update_dashboard_description(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard", kwargs={"slug": workspace.slug, "pk": dashboard.id})
        resp = session_client.patch(url, {"description": "New desc"}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["description"] == "New desc"

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_delete_dashboard(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard", kwargs={"slug": workspace.slug, "pk": dashboard.id})
        resp = session_client.delete(url)
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert not Dashboard.objects.filter(pk=dashboard.id, deleted_at__isnull=True).exists()

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_delete_dashboard_with_widgets(self, mock_activity, session_client, workspace, dashboard, widget):
        url = reverse("workspace-dashboard", kwargs={"slug": workspace.slug, "pk": dashboard.id})
        resp = session_client.delete(url)
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        # Dashboard soft-deleted: gone from default manager, present in all_objects
        assert Dashboard.all_objects.filter(pk=dashboard.id, deleted_at__isnull=False).exists()


# ─── Phase 2: Widget CRUD ─────────────────────────────────────────

@pytest.mark.django_db
@pytest.mark.contract
class TestWidgetCRUD:

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_create_bar_chart_widget(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard-widgets", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        payload = {
            "name": "Priority Bars",
            "chart_type": "BAR_CHART",
            "x_axis_property": "priority",
            "y_axis_metric": "count",
        }
        resp = session_client.post(url, payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["chart_type"] == "BAR_CHART"

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_widget_persists(self, mock_activity, session_client, workspace, dashboard, widget):
        url = reverse("workspace-dashboard-widget", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id, "pk": widget.id,
        })
        resp = session_client.get(url)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["name"] == widget.name

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_create_multiple_widget_types(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard-widgets", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        for ct in ["BAR_CHART", "LINE_CHART", "DONUT_CHART"]:
            resp = session_client.post(url, {
                "name": f"{ct} Widget",
                "chart_type": ct,
                "x_axis_property": "priority",
                "y_axis_metric": "count",
            }, format="json")
            assert resp.status_code == status.HTTP_201_CREATED

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_edit_widget_chart_type(self, mock_activity, session_client, workspace, dashboard, widget):
        url = reverse("workspace-dashboard-widget", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id, "pk": widget.id,
        })
        resp = session_client.patch(url, {"chart_type": "LINE_CHART"}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["chart_type"] == "LINE_CHART"

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_edit_widget_property(self, mock_activity, session_client, workspace, dashboard, widget):
        url = reverse("workspace-dashboard-widget", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id, "pk": widget.id,
        })
        resp = session_client.patch(url, {"x_axis_property": "state_group"}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["x_axis_property"] == "state_group"

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_edit_widget_metric(self, mock_activity, session_client, workspace, dashboard, widget):
        url = reverse("workspace-dashboard-widget", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id, "pk": widget.id,
        })
        resp = session_client.patch(url, {"y_axis_metric": "estimate_points"}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["y_axis_metric"] == "estimate_points"

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_edit_widget_name(self, mock_activity, session_client, workspace, dashboard, widget):
        url = reverse("workspace-dashboard-widget", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id, "pk": widget.id,
        })
        resp = session_client.patch(url, {"name": "Updated Name"}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["name"] == "Updated Name"

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_delete_widget(self, mock_activity, session_client, workspace, dashboard, widget):
        url = reverse("workspace-dashboard-widget", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id, "pk": widget.id,
        })
        resp = session_client.delete(url)
        assert resp.status_code == status.HTTP_204_NO_CONTENT

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_list_widgets_empty(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard-widgets", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        resp = session_client.get(url)
        assert resp.status_code == status.HTTP_200_OK

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_widget_default_config(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard-widgets", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        resp = session_client.post(url, {
            "name": "Default Config",
            "chart_type": "BAR_CHART",
            "x_axis_property": "priority",
            "y_axis_metric": "count",
        }, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["config"] == {}
        assert resp.data["width"] == 2
        assert resp.data["height"] == 2


# ─── Phase 3: Chart Types × Properties ─────────────────────────────

CHART_TYPES = ["BAR_CHART", "LINE_CHART", "AREA_CHART", "DONUT_CHART", "PIE_CHART", "NUMBER"]
PROPERTIES = ["priority", "state_group", "assignee", "labels"]


@pytest.mark.django_db
@pytest.mark.contract
class TestChartTypesProperties:

    @patch("plane.app.views.dashboard.model_activity.delay")
    @pytest.mark.parametrize("chart_type", CHART_TYPES)
    def test_chart_type_creation(self, mock_activity, session_client, workspace, dashboard, chart_type):
        url = reverse("workspace-dashboard-widgets", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        resp = session_client.post(url, {
            "name": f"{chart_type}-priority",
            "chart_type": chart_type,
            "x_axis_property": "priority",
            "y_axis_metric": "count",
        }, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["chart_type"] == chart_type

    @patch("plane.app.views.dashboard.model_activity.delay")
    @pytest.mark.parametrize("prop", PROPERTIES)
    def test_property_values(self, mock_activity, session_client, workspace, dashboard, prop):
        url = reverse("workspace-dashboard-widgets", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        resp = session_client.post(url, {
            "name": f"BAR-{prop}",
            "chart_type": "BAR_CHART",
            "x_axis_property": prop,
            "y_axis_metric": "count",
        }, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["x_axis_property"] == prop


# ─── Phase 4: Filters & Metrics ────────────────────────────────────

@pytest.mark.django_db
@pytest.mark.contract
class TestFiltersMetrics:

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_metric_count(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard-widgets", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        resp = session_client.post(url, {
            "name": "Metric Count",
            "chart_type": "BAR_CHART",
            "x_axis_property": "priority",
            "y_axis_metric": "count",
        }, format="json")
        assert resp.status_code == status.HTTP_201_CREATED

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_metric_estimate_points(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard-widgets", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        resp = session_client.post(url, {
            "name": "Metric EP",
            "chart_type": "BAR_CHART",
            "x_axis_property": "priority",
            "y_axis_metric": "estimate_points",
        }, format="json")
        assert resp.status_code == status.HTTP_201_CREATED

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_single_priority_filter(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard-widgets", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        resp = session_client.post(url, {
            "name": "Filter Single",
            "chart_type": "BAR_CHART",
            "x_axis_property": "priority",
            "y_axis_metric": "count",
            "filters": {"priority": ["high"]},
        }, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["filters"]["priority"] == ["high"]

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_multi_priority_filter(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard-widgets", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        resp = session_client.post(url, {
            "name": "Filter Multi",
            "chart_type": "BAR_CHART",
            "x_axis_property": "priority",
            "y_axis_metric": "count",
            "filters": {"priority": ["high", "medium"]},
        }, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["filters"]["priority"] == ["high", "medium"]

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_state_group_filter(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard-widgets", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        resp = session_client.post(url, {
            "name": "Filter SG",
            "chart_type": "BAR_CHART",
            "x_axis_property": "state_group",
            "y_axis_metric": "count",
            "filters": {"state_group": ["started", "backlog"]},
        }, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["filters"]["state_group"] == ["started", "backlog"]


# ─── Phase 5: Widget Config ────────────────────────────────────────

@pytest.mark.django_db
@pytest.mark.contract
class TestWidgetConfig:

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_color_preset(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard-widgets", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        resp = session_client.post(url, {
            "name": "Config Color",
            "chart_type": "BAR_CHART",
            "x_axis_property": "priority",
            "y_axis_metric": "count",
            "config": {"color_preset": "modern"},
        }, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["config"]["color_preset"] == "modern"

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_chart_options(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard-widgets", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        config = {
            "fill_opacity": 0.8,
            "show_borders": True,
            "smoothing": "cubic",
            "show_markers": True,
            "show_legend": True,
            "show_tooltip": True,
        }
        resp = session_client.post(url, {
            "name": "Config Options",
            "chart_type": "LINE_CHART",
            "x_axis_property": "priority",
            "y_axis_metric": "count",
            "config": config,
        }, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        for key, value in config.items():
            assert resp.data["config"][key] == value

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_grid_size(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard-widgets", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        resp = session_client.post(url, {
            "name": "Grid Size",
            "chart_type": "BAR_CHART",
            "x_axis_property": "priority",
            "y_axis_metric": "count",
            "width": 4,
            "height": 3,
        }, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["width"] == 4
        assert resp.data["height"] == 3


# ─── Phase 6: Edge Cases ───────────────────────────────────────────

@pytest.mark.django_db
@pytest.mark.contract
class TestEdgeCases:

    def test_invalid_dashboard_id_404(self, session_client, workspace):
        url = reverse("workspace-dashboard", kwargs={
            "slug": workspace.slug, "pk": uuid.uuid4(),
        })
        resp = session_client.get(url)
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_invalid_widget_id_404(self, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard-widget", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id, "pk": uuid.uuid4(),
        })
        resp = session_client.get(url)
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_private_dashboard_access(self, mock_activity, session_client, workspace):
        url = reverse("workspace-dashboards", kwargs={"slug": workspace.slug})
        resp = session_client.post(url, {"name": "Private", "access": 0}, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["access"] == 0

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_public_dashboard_toggle(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard", kwargs={"slug": workspace.slug, "pk": dashboard.id})
        resp = session_client.patch(url, {"access": 1}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["access"] == 1

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_long_widget_name(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard-widgets", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        long_name = "A" * 255
        resp = session_client.post(url, {
            "name": long_name,
            "chart_type": "BAR_CHART",
            "x_axis_property": "priority",
            "y_axis_metric": "count",
        }, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["name"] == long_name

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_special_chars_in_name(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard-widgets", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        special_name = "Test @#$%^&*() Widget"
        resp = session_client.post(url, {
            "name": special_name,
            "chart_type": "BAR_CHART",
            "x_axis_property": "priority",
            "y_axis_metric": "count",
        }, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["name"] == special_name

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_rapid_widget_creation(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard-widgets", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        for i in range(3):
            resp = session_client.post(url, {
                "name": f"Rapid-{i}",
                "chart_type": "BAR_CHART",
                "x_axis_property": "priority",
                "y_axis_metric": "count",
            }, format="json")
            assert resp.status_code == status.HTTP_201_CREATED

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_sequential_widget_updates(self, mock_activity, session_client, workspace, dashboard, widget):
        url = reverse("workspace-dashboard-widget", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id, "pk": widget.id,
        })
        for name in ["Update1", "Update2", "Update3"]:
            resp = session_client.patch(url, {"name": name}, format="json")
            assert resp.status_code == status.HTTP_200_OK
        # Last update wins
        resp = session_client.get(url)
        assert resp.data["name"] == "Update3"

    def test_private_dashboard_isolation(self, workspace, create_user):
        """User B cannot see user A's private dashboard (access=0)."""
        from rest_framework.test import APIClient

        # Create user B with workspace membership
        unique = uuid.uuid4().hex[:8]
        user_b = User.objects.create(
            email=f"userb-{unique}@test.com",
            username=f"userb_{unique}",
            first_name="B",
        )
        user_b.set_password("test")
        user_b.save()
        WorkspaceMember.objects.create(workspace=workspace, member=user_b, role=15)

        # User A creates private dashboard
        with impersonate(create_user):
            d = Dashboard.objects.create(name="Private A", workspace=workspace, access=0)

        # User B tries to retrieve it
        client_b = APIClient()
        client_b.force_authenticate(user=user_b)
        url = reverse("workspace-dashboard", kwargs={"slug": workspace.slug, "pk": d.id})
        resp = client_b.get(url)
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# ─── Phase 7: BRD Gap Features ─────────────────────────────────────

@pytest.mark.django_db
@pytest.mark.contract
class TestBRDGapFeatures:

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_project_picker_create(self, mock_activity, session_client, workspace_with_project):
        workspace, project = workspace_with_project
        url = reverse("workspace-dashboards", kwargs={"slug": workspace.slug})
        resp = session_client.post(url, {
            "name": "Scoped Dashboard",
            "project_ids": [str(project.id)],
        }, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        # projects should include the project
        assert str(project.id) in [str(p) for p in resp.data["projects"]]

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_project_picker_update(self, mock_activity, session_client, workspace_with_project, create_user):
        workspace, project = workspace_with_project
        with impersonate(create_user):
            d = Dashboard.objects.create(name="No Projects", workspace=workspace)
        url = reverse("workspace-dashboard", kwargs={"slug": workspace.slug, "pk": d.id})
        resp = session_client.patch(url, {"project_ids": [str(project.id)]}, format="json")
        assert resp.status_code == status.HTTP_200_OK

    @patch("plane.app.views.dashboard.model_activity.delay")
    @pytest.mark.parametrize("metric", ["count", "estimate_points"])
    def test_number_widget_metrics(self, mock_activity, session_client, workspace, dashboard, metric):
        url = reverse("workspace-dashboard-widgets", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        resp = session_client.post(url, {
            "name": f"Number-{metric}",
            "chart_type": "NUMBER",
            "x_axis_property": "priority",
            "y_axis_metric": metric,
        }, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["y_axis_metric"] == metric

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_bulk_position_update(self, mock_activity, session_client, workspace, dashboard, create_user):
        with impersonate(create_user):
            w1 = DashboardWidget.objects.create(
                name="W1", dashboard=dashboard, workspace=workspace,
                chart_type="BAR_CHART", x_axis_property="priority",
                y_axis_metric="count",
            )
            w2 = DashboardWidget.objects.create(
                name="W2", dashboard=dashboard, workspace=workspace,
                chart_type="LINE_CHART", x_axis_property="state_group",
                y_axis_metric="count",
            )
        url = reverse("workspace-dashboard-widget-positions", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        resp = session_client.patch(url, {
            "widgets": [
                {"id": str(w1.id), "x_axis_coord": 0, "y_axis_coord": 0, "width": 4, "height": 3},
                {"id": str(w2.id), "x_axis_coord": 4, "y_axis_coord": 0, "width": 2, "height": 2},
            ]
        }, format="json")
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        w1.refresh_from_db()
        w2.refresh_from_db()
        assert w1.width == 4
        assert w1.height == 3
        assert w2.x_axis_coord == 4

    def test_bulk_position_empty_list_rejected(self, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard-widget-positions", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        resp = session_client.patch(url, {"widgets": []}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_widget_config_drill_down(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard-widgets", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        resp = session_client.post(url, {
            "name": "Drill Down",
            "chart_type": "BAR_CHART",
            "x_axis_property": "priority",
            "y_axis_metric": "count",
            "config": {"enable_drill_down": True},
        }, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["config"]["enable_drill_down"] is True

    @patch("plane.app.views.dashboard.model_activity.delay")
    def test_widget_config_variants(self, mock_activity, session_client, workspace, dashboard):
        url = reverse("workspace-dashboard-widgets", kwargs={
            "slug": workspace.slug, "dashboard_id": dashboard.id,
        })
        configs = [
            {"chart_model": "GROUPED"},
            {"config": {"line_type": "dashed"}},
            {"config": {"orientation": "horizontal"}},
            {"config": {"text_align": "left", "text_color": "#ff0000"}},
        ]
        for extra in configs:
            payload = {
                "name": f"Variant-{extra}",
                "chart_type": "BAR_CHART",
                "x_axis_property": "priority",
                "y_axis_metric": "count",
                **extra,
            }
            resp = session_client.post(url, payload, format="json")
            assert resp.status_code == status.HTTP_201_CREATED
