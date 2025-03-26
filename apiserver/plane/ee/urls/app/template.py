# Django imports
from django.urls import path

# module imports
from plane.ee.views.app.template import TemplateEndpoint, ProjectTemplateEndpoint


urlpatterns = [
    path(
        "workspaces/<str:slug>/templates/", TemplateEndpoint.as_view(), name="templates"
    ),
    path(
        "workspaces/<str:slug>/templates/<uuid:pk>/",
        TemplateEndpoint.as_view(),
        name="templates",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/templates/",
        ProjectTemplateEndpoint.as_view(),
        name="project_templates",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/templates/<uuid:pk>/",
        ProjectTemplateEndpoint.as_view(),
        name="project_templates",
    ),
]
