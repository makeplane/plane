from django.urls import path

from plane.app.views.issue.issue_type import ProjectIssueTypeListCreateAPIEndpoint, IssueTypePropertyListCreateAPIEndpoint, \
    IssuePropertyValueAPIEndpoint,IssueTypeViewSet,IssueTypePropertyViewSet

urlpatterns = [
    # Issue Type管理
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/",
        ProjectIssueTypeListCreateAPIEndpoint.as_view(),
        name="project-issue-types",
    ),
    
    # Issue Type属性配置
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:issue_type_id>/issue-properties/",
        IssueTypePropertyListCreateAPIEndpoint.as_view(),
        name="issue-type-properties",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:issue_type_id>/issue-properties/<uuid:property_id>/",
        IssueTypePropertyViewSet.as_view(),
        name="issue-type-properties",
    ),
    
    # Issue属性值存储
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/values/",
        IssuePropertyValueAPIEndpoint.as_view(),
        name="issue-property-values",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:issue_type_id>/",
        IssueTypeViewSet.as_view(),
        name="issue-type",
    ),
]