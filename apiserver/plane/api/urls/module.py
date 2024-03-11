from django.urls import path

from plane.api.views import ModuleAPIEndpoint, ModuleIssueAPIEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/modules/",
        ModuleAPIEndpoint.as_view(),
        name="modules",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/modules/<uuid:pk>/",
        ModuleAPIEndpoint.as_view(),
        name="modules",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/modules/<uuid:module_id>/module-issues/",
        ModuleIssueAPIEndpoint.as_view(),
        name="module-issues",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/modules/<uuid:module_id>/module-issues/<uuid:issue_id>/",
        ModuleIssueAPIEndpoint.as_view(),
        name="module-issues",
    ),
]
