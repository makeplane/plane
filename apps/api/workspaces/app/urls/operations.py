# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Routes for the Engineering Operations layer.

Workspace-scoped throughout, except deployments, which hang off a project
because a release without an application is not a thing anybody can act on.
`workspaces.app.urls` is mounted at `api/`, so these are `/api/workspaces/<slug>/...`.
"""

from django.urls import path

from workspaces.app.views import (
    DeliveryAnalyticsEndpoint,
    DeveloperDashboardEndpoint,
    DevOpsDashboardEndpoint,
    MissingWorkLogEndpoint,
    MyWorkLogEndpoint,
    OperationsBootstrapEndpoint,
    OperationsRecordViewSet,
    OperationsReportEndpoint,
    OperationsSettingEndpoint,
    OperationsStateMappingEndpoint,
    OperationsTicketActivityEndpoint,
    OperationsTicketCommentViewSet,
    OperationsTicketConvertEndpoint,
    OperationsTicketTransitionEndpoint,
    OperationsTicketViewSet,
    PMDashboardEndpoint,
    ProductivityAnalyticsEndpoint,
    ProjectDeploymentViewSet,
    QADashboardEndpoint,
    QualityAnalyticsEndpoint,
    TeamAnalyticsEndpoint,
    TeamAvailabilityEndpoint,
    WorkLogSubmitEndpoint,
    WorkLogViewSet,
    WorkspaceDeploymentEndpoint,
)

urlpatterns = [
    # ----------------------------------------------------------------- Work logs
    path(
        "workspaces/<str:slug>/work-logs/",
        WorkLogViewSet.as_view({"get": "list", "post": "create"}),
        name="operations-work-logs",
    ),
    # Before the `<uuid:pk>` routes: "me" and "missing" are not ids, and a
    # UUID converter would not match them anyway -- but keeping them first
    # makes the intent obvious to the next person editing this file.
    path("workspaces/<str:slug>/work-logs/me/", MyWorkLogEndpoint.as_view(), name="operations-my-work-log"),
    path(
        "workspaces/<str:slug>/work-logs/missing/",
        MissingWorkLogEndpoint.as_view(),
        name="operations-missing-work-logs",
    ),
    path(
        "workspaces/<str:slug>/work-logs/<uuid:pk>/",
        WorkLogViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="operations-work-log",
    ),
    path(
        "workspaces/<str:slug>/work-logs/<uuid:pk>/submit/",
        WorkLogSubmitEndpoint.as_view(),
        name="operations-work-log-submit",
    ),
    # ---------------------------------------------------------- Operations tickets
    path(
        "workspaces/<str:slug>/operations-tickets/",
        OperationsTicketViewSet.as_view({"get": "list", "post": "create"}),
        name="operations-tickets",
    ),
    path(
        "workspaces/<str:slug>/operations-tickets/<uuid:pk>/",
        OperationsTicketViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="operations-ticket",
    ),
    path(
        "workspaces/<str:slug>/operations-tickets/<uuid:pk>/transition/",
        OperationsTicketTransitionEndpoint.as_view(),
        name="operations-ticket-transition",
    ),
    path(
        "workspaces/<str:slug>/operations-tickets/<uuid:pk>/convert/",
        OperationsTicketConvertEndpoint.as_view(),
        name="operations-ticket-convert",
    ),
    path(
        "workspaces/<str:slug>/operations-tickets/<uuid:ticket_id>/comments/",
        OperationsTicketCommentViewSet.as_view({"get": "list", "post": "create"}),
        name="operations-ticket-comments",
    ),
    path(
        "workspaces/<str:slug>/operations-tickets/<uuid:ticket_id>/comments/<uuid:pk>/",
        OperationsTicketCommentViewSet.as_view({"delete": "destroy"}),
        name="operations-ticket-comment",
    ),
    path(
        "workspaces/<str:slug>/operations-tickets/<uuid:ticket_id>/activities/",
        OperationsTicketActivityEndpoint.as_view(),
        name="operations-ticket-activities",
    ),
    # ------------------------------------------------------------------- Records
    path(
        "workspaces/<str:slug>/operations-records/",
        OperationsRecordViewSet.as_view({"get": "list", "post": "create"}),
        name="operations-records",
    ),
    path(
        "workspaces/<str:slug>/operations-records/<uuid:pk>/",
        OperationsRecordViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="operations-record",
    ),
    # --------------------------------------------------------------- Deployments
    path(
        "workspaces/<str:slug>/deployments/",
        WorkspaceDeploymentEndpoint.as_view(),
        name="operations-workspace-deployments",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/deployments/",
        ProjectDeploymentViewSet.as_view({"get": "list", "post": "create"}),
        name="operations-project-deployments",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/deployments/<uuid:pk>/",
        ProjectDeploymentViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="operations-project-deployment",
    ),
    # ---------------------------------------------------------------- Dashboards
    path(
        "workspaces/<str:slug>/operations/dashboards/pm/",
        PMDashboardEndpoint.as_view(),
        name="operations-dashboard-pm",
    ),
    path(
        "workspaces/<str:slug>/operations/dashboards/developer/",
        DeveloperDashboardEndpoint.as_view(),
        name="operations-dashboard-developer",
    ),
    path(
        "workspaces/<str:slug>/operations/dashboards/qa/",
        QADashboardEndpoint.as_view(),
        name="operations-dashboard-qa",
    ),
    path(
        "workspaces/<str:slug>/operations/dashboards/devops/",
        DevOpsDashboardEndpoint.as_view(),
        name="operations-dashboard-devops",
    ),
    # ----------------------------------------------------------------- Analytics
    path(
        "workspaces/<str:slug>/operations/analytics/delivery/",
        DeliveryAnalyticsEndpoint.as_view(),
        name="operations-analytics-delivery",
    ),
    path(
        "workspaces/<str:slug>/operations/analytics/quality/",
        QualityAnalyticsEndpoint.as_view(),
        name="operations-analytics-quality",
    ),
    path(
        "workspaces/<str:slug>/operations/analytics/productivity/",
        ProductivityAnalyticsEndpoint.as_view(),
        name="operations-analytics-productivity",
    ),
    path(
        "workspaces/<str:slug>/operations/analytics/team/",
        TeamAnalyticsEndpoint.as_view(),
        name="operations-analytics-team",
    ),
    # ------------------------------------------------------------------- Reports
    path(
        "workspaces/<str:slug>/operations/reports/<str:report_type>/",
        OperationsReportEndpoint.as_view(),
        name="operations-report",
    ),
    # ------------------------------------------------------------------ Settings
    path(
        "workspaces/<str:slug>/operations/settings/",
        OperationsSettingEndpoint.as_view(),
        name="operations-settings",
    ),
    path(
        "workspaces/<str:slug>/operations/settings/states/",
        OperationsStateMappingEndpoint.as_view(),
        name="operations-settings-states",
    ),
    path(
        "workspaces/<str:slug>/operations/bootstrap/",
        OperationsBootstrapEndpoint.as_view(),
        name="operations-bootstrap",
    ),
    # -------------------------------------------------------- Team availability
    path(
        "workspaces/<str:slug>/operations/team-availability/",
        TeamAvailabilityEndpoint.as_view(),
        name="operations-team-availability",
    ),
]
