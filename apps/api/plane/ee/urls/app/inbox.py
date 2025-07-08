from django.urls import path


from plane.ee.views import InboxViewSet


urlpatterns = [
    path(
        "workspaces/<str:slug>/inbox/",
        InboxViewSet.as_view({"patch": "partial_update"}),
        name="inbox",
    ),
    path(
        "workspaces/<str:slug>/inbox/read/",
        InboxViewSet.as_view({"post": "mark_read", "delete": "mark_unread"}),
        name="inbox",
    ),
    path(
        "workspaces/<str:slug>/inbox/archive/",
        InboxViewSet.as_view({"post": "archive", "delete": "unarchive"}),
        name="inbox",
    ),
]
