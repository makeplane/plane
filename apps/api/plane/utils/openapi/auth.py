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


class OAuth2AuthenticationExtension(OpenApiAuthenticationExtension):
    """
    OpenAPI authentication extension for oauth2_provider.contrib.rest_framework.OAuth2Authentication
    """

    target_class = "oauth2_provider.contrib.rest_framework.OAuth2Authentication"
    name = "OAuth2Authentication"
    priority = 2

    def get_security_definition(self, auto_schema):
        """
        Return the security definition for OAuth2 authentication.
        """
        return {
            "type": "oauth2",
            "flows": {
                "authorizationCode": {
                    "authorizationUrl": "/auth/o/authorize-app/",
                    "tokenUrl": "/auth/o/token/",
                    "scopes": {
                        "read": "Read access to resources",
                        "write": "Write access to resources",
                    },
                },
                "clientCredentials": {
                    "tokenUrl": "/auth/o/token/",
                    "scopes": {
                        "read": "Read access to resources",
                        "write": "Write access to resources",
                    },
                },
            },
            "description": "OAuth2 authentication supporting both authorization code flow and client credentials flow. For client credentials flow, include 'app_installation_id' parameter in the token request payload to receive a bot token for workspace app installations.",
        }


class APITokenAuthenticationExtension(OpenApiAuthenticationExtension):
    """
    OpenAPI authentication extension for any additional token authentication classes.
    """

    target_class = "plane.authentication.api_token.APITokenAuthentication"
    name = "ApiTokenAuthentication"

    def get_security_definition(self, auto_schema):
        """
        Return the security definition for API token authentication.
        """
        return {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "Token",
            "description": 'API token authentication. Provide your token in the Authorization header as "Bearer <token>".',
        }
