# Python imports
from urllib.parse import urlencode, urljoin

# Django imports
from django.http import HttpResponseRedirect, HttpResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.core.exceptions import ImproperlyConfigured
from django.contrib.auth import logout

# Module imports
from plane.authentication.adapter.saml import SAMLAdapter
from plane.authentication.adapter.base import AuthenticationException
from plane.authentication.utils.login import user_login
from plane.authentication.utils.workspace_project_join import (
    process_workspace_project_invitations,
)
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.license.models import Instance


class SAMLAuthInitiateEndpoint(View):
    def get(self, request):
        referer = request.META.get("HTTP_REFERER", "/")
        request.session["referer"] = referer

        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            url = urljoin(
                referer,
                "?"
                + urlencode(
                    {
                        "error_code": "INSTANCE_NOT_CONFIGURED",
                        "error_message": "Instance is not configured",
                    }
                ),
            )
            return HttpResponseRedirect(url)

        try:
            provider = SAMLAdapter(
                request=request,
            )
            return_url = provider.get_auth_url()
            return HttpResponseRedirect(return_url)
        except ImproperlyConfigured as e:
            url = urljoin(
                referer,
                "?"
                + urlencode(
                    {
                        "error_message": str(e),
                        "error_code": "IMPROPERLY_CONFIGURED",
                    }
                ),
            )
            return HttpResponseRedirect(url)


@method_decorator(csrf_exempt, name="dispatch")
class SAMLCallbackEndpoint(View):
    def post(self, request):
        referer = request.session.get("referer", "/")
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
            url = urljoin(referer, path)
            return HttpResponseRedirect(url)
        except AuthenticationException as e:
            url = urljoin(
                referer,
                "?"
                + urlencode(
                    {
                        "error_message": str(e.error_message),
                        "error_code": str(e.error_code),
                    }
                ),
            )
            return HttpResponseRedirect(url)
        except ImproperlyConfigured as e:
            url = urljoin(
                referer,
                "?"
                + urlencode(
                    {
                        "error_message": str(e),
                        "error_code": "IMPROPERLY_CONFIGURED",
                    }
                ),
            )
            return HttpResponseRedirect(url)


class SAMLLogoutView(View):
    def get(self, request, *args, **kwargs):
        logout(request=request)
        return HttpResponseRedirect(request.session.get("referer", "/"))


@method_decorator(csrf_exempt, name="dispatch")
class SAMLMetadataEndpoint(View):

    def get(self, request):
        xml_template = f"""<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="{request.scheme}://{request.get_host()}/auth/saml/">
    <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
        <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                  Location="{request.scheme}://{request.get_host()}/auth/saml/callback/"
                                  index="1"/>
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
</EntityDescriptor>"""

        return HttpResponse(xml_template, content_type="application/xml")
