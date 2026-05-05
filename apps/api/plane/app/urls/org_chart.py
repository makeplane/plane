from django.urls import path

from plane.app.views.workspace.org_chart import OrgChartEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/org-chart/",
        OrgChartEndpoint.as_view(http_method_names=["get"]),
        name="workspace-org-chart",
    ),
]
