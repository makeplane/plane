from django.urls import path
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from plane.app.views import ApiTokenEndpoint, ServiceApiTokenEndpoint


class ConfigsEndpoint(APIView):
    """
    Proxy endpoint for /api/configs/ that redirects to /api/instances/
    This maintains compatibility with frontend code that expects /api/configs/
    """
    permission_classes = [AllowAny]

    def get(self, request):
        # Import here to avoid circular imports
        from plane.license.api.views.instance import InstanceEndpoint
        
        # Create an instance of InstanceEndpoint and call its get method
        instance_endpoint = InstanceEndpoint()
        instance_endpoint.request = request
        return instance_endpoint.get(request)


urlpatterns = [
    # Configs endpoint (proxy to instances)
    path("configs/", ConfigsEndpoint.as_view(), name="configs"),
    # API Tokens
    path(
        "users/api-tokens/",
        ApiTokenEndpoint.as_view(),
        name="api-tokens",
    ),
    path(
        "users/api-tokens/<uuid:pk>/",
        ApiTokenEndpoint.as_view(),
        name="api-tokens-details",
    ),
    path(
        "workspaces/<str:slug>/service-api-tokens/",
        ServiceApiTokenEndpoint.as_view(),
        name="service-api-tokens",
    ),
    ## End API Tokens
]
