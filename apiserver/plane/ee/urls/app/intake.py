# Django imports
from django.urls import path

# Module imports
from plane.ee.views.app.intake import ProjectInTakePublishViewSet, IntakeSettingEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/publish-intake-regenerate/<str:type>/",
        ProjectInTakePublishViewSet.as_view({"post": "regenerate"}),
        name="project-intake-regenerate",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/intake-settings/",
        IntakeSettingEndpoint.as_view(),
        name="project-intake-settings",
    ),
]
