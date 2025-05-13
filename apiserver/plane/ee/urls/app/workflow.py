# Django imports
from django.urls import path

# Module imports
from plane.ee.views.app.workflow import (
    WorkflowEndpoint,
    WorkflowActivityEndpoint,
    WorkflowTransitionEndpoint,
    WorkflowTransitionApproverEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/workflow-states/",
        WorkflowEndpoint.as_view(),
        name="project-workflows",
    ),
    path(
        "workspaces/<str:slug>/workflow-states/<uuid:state_id>/",
        WorkflowEndpoint.as_view(),
        name="project-workflows",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-reset/",
        WorkflowEndpoint.as_view(),
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
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-transitions/<uuid:workflow_transition_id>/approvers/",
        WorkflowTransitionApproverEndpoint.as_view(),
        name="workflow-transition-approver",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-activity/",
        WorkflowActivityEndpoint.as_view(),
        name="workflow-activity",
    ),
]
