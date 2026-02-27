# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import WorkSpaceBasePermission, allow_permission, ROLE
from plane.app.views.base import BaseAPIView
from plane.db.models import DashboardWidget
from plane.utils.dashboard_chart_aggregation import aggregate_chart_data


class DashboardWidgetChartEndpoint(BaseAPIView):
    """Returns aggregated chart data for a dashboard widget."""

    permission_classes = [WorkSpaceBasePermission]

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, dashboard_id, widget_id):
        try:
            widget = DashboardWidget.objects.select_related("dashboard").get(
                pk=widget_id, dashboard_id=dashboard_id, workspace__slug=slug
            )
        except DashboardWidget.DoesNotExist:
            return Response({"error": "Widget not found"}, status=status.HTTP_404_NOT_FOUND)

        # Verify user has access to the parent dashboard
        dashboard = widget.dashboard
        if dashboard.created_by != request.user and dashboard.access != 1:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        formatted_data = aggregate_chart_data(widget, slug)
        return Response({"data": formatted_data})
