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
import os
from urllib.parse import urlencode, urljoin
from xml.sax.saxutils import escape as xml_escape
import time

# Django imports
from django.http import HttpResponseRedirect, HttpResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils.http import http_date
from django.conf import settings
from django.contrib.auth import logout


# Module imports
from plane.authentication.adapter.saml import SAMLAdapter, DEFAULT_ATTRIBUTE_MAPPING, DEFAULT_NAME_ID_FORMAT
from plane.authentication.utils.login import user_login
from plane.authentication.utils.workspace_project_join import (
    process_workspace_project_invitations,
)
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.license.models import Instance, InstanceAdmin
from plane.license.utils.instance_value import get_configuration_value
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.authentication.utils.host import base_host


def build_metadata_requested_attributes_xml(attribute_mapping):
    """Build XML RequestedAttribute elements from an attribute mapping dict."""
    xml_parts = []
    for plane_field, idp_attr in attribute_mapping.items():
        if not idp_attr:
            continue
        is_required = "true" if plane_field == "email" else "false"
        xml_parts.append(
            f'            <RequestedAttribute Name="{xml_escape(idp_attr)}"\n'
            f'                                FriendlyName="{xml_escape(plane_field)}"\n'
            f'                                NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"\n'
            f'                                isRequired="{is_required}"/>'
        )
    return "\n".join(xml_parts)


class SAMLAuthInitiateEndpoint(View):
    def get(self, request):
        request.session["host"] = base_host(request=request, is_app=True)
        next_path = request.GET.get("next_path")
        if next_path:
            request.session["next_path"] = str(next_path)

        try:
            # Check instance configuration
            instance = Instance.objects.first()
            if instance is None or not instance.is_setup_done:
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                    error_message="INSTANCE_NOT_CONFIGURED",
                )
            # Provider
            provider = SAMLAdapter(request=request)
            # Get the auth url
            return_url = provider.get_auth_url()
            return HttpResponseRedirect(return_url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(base_host(request=request, is_app=True), "?" + urlencode(params))
            return HttpResponseRedirect(url)


@method_decorator(csrf_exempt, name="dispatch")
class SAMLCallbackEndpoint(View):
    def post(self, request):
        relay_state = request.POST.get("RelayState", "")
        is_admin = relay_state == "admin"
        if is_admin:
            host = base_host(request=request, is_admin=True)
        else:
            host = base_host(request=request, is_app=True)
        try:
            provider = SAMLAdapter(request=request)
            user = provider.authenticate()

            # Admin flow: verify instance admin and redirect to admin panel
            if is_admin:
                if not InstanceAdmin.is_instance_admin(user):
                    raise AuthenticationException(
                        error_code=AUTHENTICATION_ERROR_CODES["ADMIN_NOT_INSTANCE_ADMIN"],
                        error_message="ADMIN_NOT_INSTANCE_ADMIN",
                    )
                # Login the user as admin
                user_login(request=request, user=user, is_admin=True)
                url = urljoin(host, "general/")
                response = HttpResponseRedirect(url)
                # for paths containing "instances"
                max_age = settings.ADMIN_SESSION_COOKIE_AGE
                response.set_cookie(
                    settings.ADMIN_SESSION_COOKIE_NAME,
                    request.session.session_key,
                    max_age=max_age,
                    expires=http_date(time.time() + max_age),
                    domain=settings.SESSION_COOKIE_DOMAIN,
                    path=settings.SESSION_COOKIE_PATH,
                    secure=settings.SESSION_COOKIE_SECURE or None,
                    httponly=settings.SESSION_COOKIE_HTTPONLY or None,
                    samesite=settings.SESSION_COOKIE_SAMESITE,
                )
                return response
            # App flow: login, process invitations, redirect to dashboard
            user_login(request=request, user=user)
            # Process workspace and project invitations
            process_workspace_project_invitations(user=user)
            # Get the redirection path
            path = get_redirection_path(user=user)
            # redirect to referer path
            url = urljoin(host, path)
            return HttpResponseRedirect(url)
        except AuthenticationException as e:
            url = urljoin(host, "?" + urlencode(e.get_error_dict()))
            return HttpResponseRedirect(url)


@method_decorator(csrf_exempt, name="dispatch")
class SAMLLogoutEndpoint(View):
    def get(self, request, *args, **kwargs):
        logout(request=request)
        return HttpResponseRedirect(base_host(request=request, is_app=True))


@method_decorator(csrf_exempt, name="dispatch")
class SAMLMetadataEndpoint(View):
    def get(self, request):
        # Fetch configurable NameID format and attribute mapping from instance config
        (SAML_NAME_ID_FORMAT, SAML_ATTRIBUTE_MAPPING) = get_configuration_value(
            [
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

        name_id_format = SAML_NAME_ID_FORMAT or DEFAULT_NAME_ID_FORMAT
        attribute_mapping = DEFAULT_ATTRIBUTE_MAPPING.copy()
        if SAML_ATTRIBUTE_MAPPING:
            try:
                parsed = json.loads(SAML_ATTRIBUTE_MAPPING)
                if isinstance(parsed, dict):
                    attribute_mapping = parsed
            except (json.JSONDecodeError, TypeError):
                pass

        requested_attrs_xml = build_metadata_requested_attributes_xml(attribute_mapping)

        xml_template = f"""<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="{request.scheme}://{request.get_host()}/auth/saml/metadata/">
    <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
        <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                  Location="{request.scheme}://{request.get_host()}/auth/saml/callback/"
                                  index="1"/>
        <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
                             Location="{request.scheme}://{request.get_host()}/auth/saml/logout/"/>
        <NameIDFormat>{xml_escape(name_id_format)}</NameIDFormat>
        <AttributeConsumingService index="1">
            <ServiceName xml:lang="en">Plane</ServiceName>
{requested_attrs_xml}
        </AttributeConsumingService>
    </SPSSODescriptor>
</EntityDescriptor>
"""
        return HttpResponse(xml_template, content_type="application/xml")
