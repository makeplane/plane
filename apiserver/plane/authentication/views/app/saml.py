# Python imports
from urllib.parse import urlencode, urljoin

# Django imports
from django.http import HttpResponseRedirect, HttpResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from django.contrib.auth import logout

# Module imports
from plane.authentication.adapter.saml import SAMLAdapter
from plane.authentication.utils.login import user_login
from plane.authentication.utils.workspace_project_join import (
    process_workspace_project_invitations,
)
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.license.models import Instance
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.authentication.utils.host import base_host


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
            url = urljoin(
                base_host(request=request, is_app=True), "?" + urlencode(params)
            )
            return HttpResponseRedirect(url)


@method_decorator(csrf_exempt, name="dispatch")
class SAMLCallbackEndpoint(View):
    def post(self, request):
        host = request.session.get("host", "/")
        try:
            provider = SAMLAdapter(request=request)
            user = provider.authenticate()
            # Login the user and record his device info
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
        xml_template = f"""<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="{request.scheme}://{request.get_host()}/auth/saml/metadata/">
    <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
        <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                  Location="{request.scheme}://{request.get_host()}/auth/saml/callback/"
                                  index="1"/>
        <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
                             Location="{request.scheme}://{request.get_host()}/auth/saml/logout/"/>
        <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
        <AttributeConsumingService index="1">
            <ServiceName xml:lang="en">Plane</ServiceName>
            <RequestedAttribute Name="user.firstName"
                                FriendlyName="first_name"
                                NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"
                                isRequired="false"/>
            <RequestedAttribute Name="user.lastName"
                                FriendlyName="last_name"
                                NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"
                                isRequired="false"/>
            <RequestedAttribute Name="user.email"
                                FriendlyName="email"
                                NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"
                                isRequired="true"/>
        </AttributeConsumingService>
    </SPSSODescriptor>
</EntityDescriptor>
"""
        return HttpResponse(xml_template, content_type="application/xml")
