# Python imports
import os

# Django imports
from django.conf import settings

# Third party imports
from onelogin.saml2.auth import OneLogin_Saml2_Auth

# Module imports
from plane.license.utils.instance_value import get_configuration_value
from .base import Adapter
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.utils.exception_logger import log_exception


class SAMLAdapter(Adapter):
    provider = "saml"
    auth = None
    saml_config = {}

    def __init__(self, request):
        (SAML_ENTITY_ID, SAML_SSO_URL, SAML_LOGOUT_URL, SAML_CERTIFICATE) = (
            get_configuration_value(
                [
                    {
                        "key": "SAML_ENTITY_ID",
                        "default": os.environ.get("SAML_ENTITY_ID"),
                    },
                    {"key": "SAML_SSO_URL", "default": os.environ.get("SAML_SSO_URL")},
                    {
                        "key": "SAML_LOGOUT_URL",
                        "default": os.environ.get("SAML_LOGOUT_URL"),
                    },
                    {
                        "key": "SAML_CERTIFICATE",
                        "default": os.environ.get("SAML_CERTIFICATE"),
                    },
                ]
            )
        )

        if not (SAML_ENTITY_ID and SAML_SSO_URL and SAML_CERTIFICATE):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SAML_NOT_CONFIGURED"],
                error_message="SAML_NOT_CONFIGURED",
            )

        super().__init__(request, self.provider)
        req = self.prepare_saml_request(self.request)
        saml_config = self.generate_saml_configuration(
            request=request,
            entity_id=SAML_ENTITY_ID,
            sso_url=SAML_SSO_URL,
            logout_url=SAML_LOGOUT_URL,
            idp_certificate=SAML_CERTIFICATE,
        )

        # Generate configuration
        self.saml_config = saml_config
        auth = OneLogin_Saml2_Auth(req, saml_config)
        self.auth = auth

    def generate_saml_configuration(
        self, request, entity_id, sso_url, logout_url, idp_certificate
    ):
        return {
            "strict": True,
            "debug": settings.DEBUG,
            "sp": {
                "entityId": f"{request.scheme}://{request.get_host()}/auth/saml/metadata/",
                "assertionConsumerService": {
                    "url": f"{request.scheme}://{request.get_host()}/auth/saml/callback/",
                    "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
                },
            },
            "idp": {
                "entityId": entity_id,
                "singleSignOnService": {
                    "url": sso_url,
                    "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
                },
                "singleLogoutService": {
                    "url": logout_url,
                    "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
                },
                "x509cert": idp_certificate,
            },
            "attributeConsumingService": {
                "serviceName": "Plane SAML",
                "serviceDescription": "Plane SAML",
                "requestedAttributes": [
                    {
                        "name": "first_name",
                        "friendlyName": "user.firstName",
                        "isRequired": False,
                        "nameFormat": "urn:oasis:names:tc:SAML:2.0:attrname-format:basic",
                    },
                    {
                        "name": "last_name",
                        "friendlyName": "user.lastName",
                        "isRequired": False,
                        "nameFormat": "urn:oasis:names:tc:SAML:2.0:attrname-format:basic",
                    },
                    {
                        "name": "email",
                        "friendlyName": "user.email",
                        "isRequired": True,
                        "nameFormat": "urn:oasis:names:tc:SAML:2.0:attrname-format:basic",
                    },
                ],
            },
        }

    def prepare_saml_request(self, request):
        return {
            "https": "on" if request.is_secure() else "off",
            "http_host": request.get_host(),
            "script_name": request.path,
            "get_data": request.GET.copy(),
            "post_data": request.POST.copy(),
        }

    def get_auth_url(self):
        return self.auth.login()

    def authenticate(self):
        self.auth.process_response()
        errors = self.auth.get_errors()
        if errors:
            if not self.auth.is_authenticated():
                # Log the errors
                log_exception(Exception(errors))
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["SAML_PROVIDER_ERROR"],
                    error_message="SAML_PROVIDER_ERROR",
                )
            # Log the errors
            log_exception(Exception(errors))
            raise AuthenticationException(
                error_message=AUTHENTICATION_ERROR_CODES["SAML_PROVIDER_ERROR"],
                error_code="SAML_PROVIDER_ERROR",
            )
        attributes = self.auth.get_attributes()

        email = (
            attributes.get("email")[0]
            if attributes.get("email") and len(attributes.get("email"))
            else None
        )

        if not email:
            raise AuthenticationException(
                error_message=AUTHENTICATION_ERROR_CODES["SAML_PROVIDER_ERROR"],
                error_code="SAML_PROVIDER_ERROR",
            )

        first_name = (
            attributes.get("first_name")[0]
            if attributes.get("first_name") and len(attributes.get("first_name"))
            else ""
        )

        last_name = (
            attributes.get("last_name")[0]
            if attributes.get("last_name") and len(attributes.get("last_name"))
            else ""
        )

        super().set_user_data(
            {
                "email": email,
                "user": {
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": email,
                    "is_password_autoset": True,
                },
            }
        )
        return self.complete_login_or_signup()

    def logout(self):
        try:
            return self.auth.logout()
        except Exception:
            return False
