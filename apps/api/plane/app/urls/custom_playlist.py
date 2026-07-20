from django.urls import path

from plane.app.views import CustomPlaylistViewSet


urlpatterns = [
    path(
        "custom-playlists/",
        CustomPlaylistViewSet.as_view({"get": "list", "post": "create"}),
        name="custom-playlists",
    ),
    path(
        "custom-playlists/<uuid:pk>/",
        CustomPlaylistViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="custom-playlists-detail",
    ),
]
