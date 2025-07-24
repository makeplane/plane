"""
OpenAPI authentication extensions for drf-spectacular.

This module provides authentication extensions that automatically register
custom authentication classes with the OpenAPI schema generator.
"""

from drf_spectacular.extensions import OpenApiAuthenticationExtension


class APIKeyAuthenticationExtension(OpenApiAuthenticationExtension):
    """
    OpenAPI authentication extension for plane.api.middleware.api_authentication.APIKeyAuthentication
    """

    target_class = "plane.api.middleware.api_authentication.APIKeyAuthentication"
    name = "ApiKeyAuthentication"
    priority = 1

    def get_security_definition(self, auto_schema):
        """
        Return the security definition for API key authentication.
        """
        return {
            "type": "apiKey",
            "in": "header",
            "name": "X-API-Key",
            "description": "API key authentication. Provide your API key in the X-API-Key header.",
        }
