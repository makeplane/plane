# Django imports
from django.urls import path

# Module imports
from plane.ee.views.app.automation import (
    AutomationEndpoint,
    AutomationNodeEndpoint,
    AutomationEdgeEndpoint,
    AutomationActivityEndpoint,
    AutomationStatusEndpoint,
)

urlpatterns = [
    ## Automation endpoints
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/",
        AutomationEndpoint.as_view(),
        name="automations",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/<uuid:pk>/",
        AutomationEndpoint.as_view(),
        name="automations",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/<uuid:pk>/status/",
        AutomationStatusEndpoint.as_view(),
        name="automation-status",
    ),
    ### Automation Node endpoints
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/<uuid:automation_id>/nodes/",
        AutomationNodeEndpoint.as_view(),
        name="automation-nodes",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/<uuid:automation_id>/nodes/<uuid:pk>/",
        AutomationNodeEndpoint.as_view(),
        name="automation-nodes",
    ),
    ### Automation Edge endpoints
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/<uuid:automation_id>/edges/",
        AutomationEdgeEndpoint.as_view(),
        name="automation-edges",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/<uuid:automation_id>/edges/<uuid:pk>/",
        AutomationEdgeEndpoint.as_view(),
        name="automation-edges",
    ),
    ### Automation Activity endpoints
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/<uuid:automation_id>/activities/",
        AutomationActivityEndpoint.as_view(),
        name="automation-activities",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/<uuid:automation_id>/activities/<uuid:pk>/",
        AutomationActivityEndpoint.as_view(),
        name="automation-activities",
    ),
]
