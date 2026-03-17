# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
import json
import logging
import os
from typing import Optional

# Django imports
from django.conf import settings

# Third party imports
from onelogin.saml2.auth import OneLogin_Saml2_Auth

# Module imports
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.license.utils.instance_value import get_configuration_value
from plane.utils.exception_logger import log_exception
from plane.authentication.models.sso import IdentityProvider, Domain


# local module imports
from .base import Adapter

logger = logging.getLogger("plane.authentication")

DEFAULT_ATTRIBUTE_MAPPING = {
    "email": "email",
    "first_name": "first_name",
    "last_name": "last_name",
}

DEFAULT_NAME_ID_FORMAT = "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"


def build_requested_attributes(attribute_mapping):
    """Build the requestedAttributes list from a mapping dict."""
    requested = []
    for plane_field, idp_attr in attribute_mapping.items():
        if not idp_attr:
            continue
        requested.append(
            {
                "name": idp_attr,
                "friendlyName": plane_field,
                "isRequired": plane_field == "email",
                "nameFormat": "urn:oasis:names:tc:SAML:2.0:attrname-format:basic",
            }
        )
    return requested


def get_attribute_value(attributes, attribute_mapping, plane_field, default=""):
    """Extract an attribute value using the configured mapping."""
    idp_attr = attribute_mapping.get(plane_field, plane_field)
    if not idp_attr:
        return default
    values = attributes.get(idp_attr)
    if values and len(values):
        return values[0]
    return default


class SAMLAdapter(Adapter):
    provider = "saml"
    auth = None
    saml_config = {}

    def __init__(
        self,
        request,
        entity_uri: Optional[str] = None,
        redirect_uri: Optional[str] = None,
    ):
        (
            SAML_ENTITY_ID,
            SAML_SSO_URL,
            SAML_LOGOUT_URL,
            SAML_CERTIFICATE,
            SAML_DISABLE_REQUESTED_AUTHN_CONTEXT,
            SAML_NAME_ID_FORMAT,
            SAML_ATTRIBUTE_MAPPING,
        ) = get_configuration_value(
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
                {
                    "key": "SAML_DISABLE_REQUESTED_AUTHN_CONTEXT",
                    "default": os.environ.get("SAML_DISABLE_REQUESTED_AUTHN_CONTEXT", "1"),
                },
                {
                    "key": "SAML_NAME_ID_FORMAT",
                    "default": os.environ.get("SAML_NAME_ID_FORMAT", DEFAULT_NAME_ID_FORMAT),
                },
                {
                    "key": "SAML_ATTRIBUTE_MAPPING",
                    "default": os.environ.get("SAML_ATTRIBUTE_MAPPING", ""),
                },
            ]
        )

        if not (SAML_ENTITY_ID and SAML_SSO_URL and SAML_CERTIFICATE):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SAML_NOT_CONFIGURED"],
                error_message="SAML_NOT_CONFIGURED",
            )

        # Parse attribute mapping from JSON string
        attribute_mapping = DEFAULT_ATTRIBUTE_MAPPING.copy()
        if SAML_ATTRIBUTE_MAPPING:
            try:
                parsed = json.loads(SAML_ATTRIBUTE_MAPPING)
                if isinstance(parsed, dict):
                    attribute_mapping = parsed
            except (json.JSONDecodeError, TypeError):
                pass
        self.attribute_mapping = attribute_mapping

        super().__init__(request, self.provider)
        req = self.prepare_saml_request(self.request)
        # Parse the disable_requested_authn_context setting (defaults to True)
        disable_authn_context = SAML_DISABLE_REQUESTED_AUTHN_CONTEXT == "1"
        name_id_format = SAML_NAME_ID_FORMAT or DEFAULT_NAME_ID_FORMAT
        saml_config = self.generate_saml_configuration(
            request=request,
            entity_id=SAML_ENTITY_ID,
            sso_url=SAML_SSO_URL,
            logout_url=SAML_LOGOUT_URL,
            idp_certificate=SAML_CERTIFICATE,
            entity_uri=entity_uri,
            redirect_uri=redirect_uri,
            disable_requested_authn_context=disable_authn_context,
            attribute_mapping=attribute_mapping,
            name_id_format=name_id_format,
        )

        # Generate configuration
        self.saml_config = saml_config
        auth = OneLogin_Saml2_Auth(req, saml_config)
        self.auth = auth

    def generate_saml_configuration(
        self,
        request,
        entity_id,
        sso_url,
        logout_url,
        idp_certificate,
        entity_uri: Optional[str] = None,
        redirect_uri: Optional[str] = None,
        disable_requested_authn_context: bool = True,
        attribute_mapping: Optional[dict] = None,
        name_id_format: Optional[str] = None,
    ):
        if entity_uri is None:
            entity_uri = f"{request.scheme}://{request.get_host()}/auth/saml/metadata/"

        if redirect_uri is None:
            redirect_uri = f"{request.scheme}://{request.get_host()}/auth/saml/callback/"

        if attribute_mapping is None:
            attribute_mapping = DEFAULT_ATTRIBUTE_MAPPING

        if name_id_format is None:
            name_id_format = DEFAULT_NAME_ID_FORMAT

        config = {
            "strict": True,
            "debug": settings.DEBUG,
            "sp": {
                "entityId": entity_uri,
                "assertionConsumerService": {
                    "url": redirect_uri,
                    "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
                },
                "NameIDFormat": name_id_format,
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
                "requestedAttributes": build_requested_attributes(attribute_mapping),
            },
        }

        if disable_requested_authn_context:
            # Disable RequestedAuthnContext to allow any authentication method
            # This fixes Azure AD error AADSTS75011 when users authenticate with
            # MFA, certificates, or other non-password methods
            config["security"] = {"requestedAuthnContext": False}

        return config

    def prepare_saml_request(self, request):
        return {
            "https": "on" if request.is_secure() else "off",
            "http_host": request.get_host(),
            "script_name": request.path,
            "get_data": request.GET.copy(),
            "post_data": request.POST.copy(),
        }

    def get_auth_url(self, return_to=None):
        return self.auth.login(return_to=return_to)

    def authenticate(self):
        self.auth.process_response()
        errors = self.auth.get_errors()
        if errors:
            reason = self.auth.get_last_error_reason()
            logger.error(
                "SAML response validation failed",
                extra={
                    "errors": errors,
                    "reason": reason,
                },
            )
            log_exception(Exception(f"SAML errors: {errors}, reason: {reason}"))
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SAML_PROVIDER_ERROR"],
                error_message="SAML_PROVIDER_ERROR",
            )
        attributes = self.auth.get_attributes()

        email = get_attribute_value(attributes, self.attribute_mapping, "email", default=None)

        if not email:
            logger.warning(
                "Email not found in SAML attributes",
                extra={
                    "error_code": AUTHENTICATION_ERROR_CODES["SAML_PROVIDER_ERROR"],
                    "error_message": "SAML_PROVIDER_ERROR",
                },
            )
            raise AuthenticationException(
                error_message=AUTHENTICATION_ERROR_CODES["SAML_PROVIDER_ERROR"],
                error_code="SAML_PROVIDER_ERROR",
            )

        first_name = get_attribute_value(attributes, self.attribute_mapping, "first_name")
        last_name = get_attribute_value(attributes, self.attribute_mapping, "last_name")

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


class SAMLAuthCloudAdapter(Adapter):
    provider = "saml"
    auth = None
    saml_config = {}
    workspace_id = None

    def __init__(self, request, workspace_id):
        # Get the SAML provider for the workspace
        identity_provider = IdentityProvider.objects.filter(
            workspace_id=workspace_id, provider=IdentityProvider.SAML, is_enabled=True
        ).first()
        if not identity_provider:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SAML_NOT_CONFIGURED"],
                error_message="SAML_NOT_CONFIGURED",
            )
        if not identity_provider.is_enabled:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SAML_NOT_CONFIGURED"],
                error_message="SAML_NOT_CONFIGURED",
            )

        self.workspace_id = workspace_id

        # Parse attribute mapping from the provider
        attribute_mapping = identity_provider.attribute_mapping or DEFAULT_ATTRIBUTE_MAPPING.copy()
        self.attribute_mapping = attribute_mapping

        super().__init__(request, self.provider)
        req = self.prepare_saml_request(self.request)
        name_id_format = identity_provider.name_id_format or DEFAULT_NAME_ID_FORMAT
        saml_config = self.generate_saml_configuration(
            request=request,
            entity_id=identity_provider.entity_id,
            workspace_id=workspace_id,
            sso_url=identity_provider.sso_url,
            logout_url=identity_provider.logout_url,
            idp_certificate=identity_provider.certificate,
            disable_requested_authn_context=identity_provider.disable_requested_authn_context,
            attribute_mapping=attribute_mapping,
            name_id_format=name_id_format,
        )

        # Generate configuration
        self.saml_config = saml_config
        auth = OneLogin_Saml2_Auth(req, saml_config)
        self.auth = auth

    def generate_saml_configuration(
        self,
        request,
        entity_id,
        workspace_id,
        sso_url,
        logout_url,
        idp_certificate,
        disable_requested_authn_context: bool = True,
        attribute_mapping: Optional[dict] = None,
        name_id_format: Optional[str] = None,
    ):
        if attribute_mapping is None:
            attribute_mapping = DEFAULT_ATTRIBUTE_MAPPING

        if name_id_format is None:
            name_id_format = DEFAULT_NAME_ID_FORMAT

        config = {
            "strict": True,
            "debug": settings.DEBUG,
            "sp": {
                "entityId": f"{request.scheme}://{request.get_host()}/auth/sso/saml/metadata/{workspace_id}/",
                "assertionConsumerService": {
                    "url": f"{request.scheme}://{request.get_host()}/auth/sso/saml/callback/{workspace_id}/",
                    "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
                },
                "NameIDFormat": name_id_format,
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
                "requestedAttributes": build_requested_attributes(attribute_mapping),
            },
        }

        if disable_requested_authn_context:
            # Disable RequestedAuthnContext to allow any authentication method
            # This fixes Azure AD error AADSTS75011 when users authenticate with
            # MFA, certificates, or other non-password methods
            config["security"] = {"requestedAuthnContext": False}

        return config

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
            reason = self.auth.get_last_error_reason()
            logger.error(
                "SAML response validation failed",
                extra={
                    "errors": errors,
                    "reason": reason,
                },
            )
            log_exception(Exception(f"SAML errors: {errors}, reason: {reason}"))
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SAML_PROVIDER_ERROR"],
                error_message="SAML_PROVIDER_ERROR",
            )
        attributes = self.auth.get_attributes()

        email = get_attribute_value(attributes, self.attribute_mapping, "email", default=None)

        if not email:
            logger.warning(
                "Email not found in SAML attributes",
                extra={
                    "error_code": AUTHENTICATION_ERROR_CODES["SAML_PROVIDER_ERROR"],
                    "error_message": "SAML_PROVIDER_ERROR",
                    "attributes": attributes,
                },
            )
            raise AuthenticationException(
                error_message=AUTHENTICATION_ERROR_CODES["SAML_PROVIDER_ERROR"],
                error_code="SAML_PROVIDER_ERROR",
            )

        # split the email and domain
        email_parts = email.split("@")
        if len(email_parts) != 2:
            logger.warning("Invalid email")
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_EMAIL"],
                error_message="INVALID_EMAIL",
                payload={"email": str(email)},
            )

        email_domain = email_parts[1]

        # Check if the domain is configured with sso
        domain = Domain.objects.filter(domain=email_domain, verification_status=Domain.VERIFIED).first()
        if not domain:
            logger.warning("Domain not configured")
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["DOMAIN_NOT_CONFIGURED"],
                error_message="DOMAIN_NOT_CONFIGURED",
                payload={"email": str(email)},
            )

        # Get the workspace id
        workspace_id = domain.workspace_id

        # Check if there is a sso provider configured for the workspace
        is_saml_configured = IdentityProvider.is_saml_configured(workspace_id)
        if not is_saml_configured:
            logger.warning(
                "SAML not configured",
                extra={
                    "workspace_id": str(workspace_id),
                    "domain": str(domain.domain),
                },
            )
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SAML_NOT_CONFIGURED"],
                error_message="SAML_NOT_CONFIGURED",
                payload={"email": str(email)},
            )

        first_name = get_attribute_value(attributes, self.attribute_mapping, "first_name")
        last_name = get_attribute_value(attributes, self.attribute_mapping, "last_name")

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
