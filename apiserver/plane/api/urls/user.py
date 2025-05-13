from django.urls import path

from plane.api.views import UserEndpoint

urlpatterns = [
    path("users/me/", UserEndpoint.as_view(), name="users"),
]
