from django.urls import path


from plane.app.views import GlobalSearchEndpoint, IssueSearchEndpoint, SearchEndpoint


urlpatterns = [
    path(
        "workspaces/<str:slug>/search/",
        GlobalSearchEndpoint.as_view(),
        name="global-search",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/search-issues/",
        IssueSearchEndpoint.as_view(),
        name="project-issue-search",
    ),
    path(
        "workspaces/<str:slug>/entity-search/",
        SearchEndpoint.as_view(),
        name="entity-search",
    ),
]
