from django.urls import path


from plane.app.views import StickyViewSet


urlpatterns = [
    path(
        "workspaces/<str:slug>/stickies/",
        StickyViewSet.as_view({"get": "list", "post": "create"}),
        name="workspace-sticky",
    ),
    path(
        "workspaces/<str:slug>/stickies/<uuid:pk>/",
        StickyViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="workspace-sticky",
    ),
]
