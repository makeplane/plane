from django.urls import path

from plane.app.views.timer import (
    IssueTimerActionEndpoint,
    UserTimerListView,
    UserTimerExportView,
    AdminTimerListView,
    AdminTimerExportView,
    ActiveTimerListView,
)

urlpatterns = [
    # Issue-scoped timer actions (start, pause, resume, stop, get current)
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/timer/",
        IssueTimerActionEndpoint.as_view(),
        name="issue-timer",
    ),
    
    # Member workspace-level views
    path(
        "workspaces/<str:slug>/timers/me/",
        UserTimerListView.as_view(),
        name="user-timers",
    ),
    path(
        "workspaces/<str:slug>/timers/me/export/",
        UserTimerExportView.as_view(),
        name="user-timers-export",
    ),
    
    # Admin workspace-level views
    path(
        "workspaces/<str:slug>/timers/admin/",
        AdminTimerListView.as_view(),
        name="admin-timers",
    ),
    path(
        "workspaces/<str:slug>/timers/admin/export/",
        AdminTimerExportView.as_view(),
        name="admin-timers-export",
    ),
    
    # Lightweight active timers for badge
    path(
        "workspaces/<str:slug>/timers/active/",
        ActiveTimerListView.as_view(),
        name="active-timers",
    ),
]
