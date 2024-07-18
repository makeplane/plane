# Django imports
from django.urls import path

# Module imports
from plane.ee.views import ViewsPublicEndpoint

urlpatterns = [
    path(
        "anchor/<str:anchor>/views/",
        ViewsPublicEndpoint.as_view(),
        name="views-public",
    ),
]
