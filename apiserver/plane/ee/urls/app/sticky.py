from django.urls import path


from plane.ee.views import WorkspaceStickyViewSet


urlpatterns = [
    path(
        "workspaces/<str:slug>/stickies/",
        WorkspaceStickyViewSet.as_view({"get": "list", "post": "create"}),
        name="workspace-sticky",
    ),
    path(
        "workspaces/<str:slug>/stickies/<uuid:pk>/",
        WorkspaceStickyViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="workspace-sticky",
    ),
]
