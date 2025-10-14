from django.urls import path

from plane.app.views.custom.project_analytics import CustomProjectAdvanceAnalyticsEndpoint
from plane.app.views.custom.simple_api import SimpleTestAPIView, HealthCheckAPIView

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/analytics/",
        CustomProjectAdvanceAnalyticsEndpoint.as_view(),
        name="analytics",
    ),
    # 新增的简单API接口
    path(
        "test/simple/",
        SimpleTestAPIView.as_view(),
        name="simple_test_api",
    ),
    path(
        "test/health/",
        HealthCheckAPIView.as_view(),
        name="health_check_api",
    ),
]