# Django imports
from django.urls import path

# Module imports
from plane.ee.views.app.workflow import (
    ProjectWorkflowEndpoint,
    WorkflowTransitionEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/",
        ProjectWorkflowEndpoint.as_view(),
        name="project-workflows",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-transitions/",
        WorkflowTransitionEndpoint.as_view(),
        name="workflow-transitions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-transitions/<uuid:pk>/",
        WorkflowTransitionEndpoint.as_view(),
        name="workflow-transitions",
    ),

]
