# Python imports
import socket
import ipaddress
from urllib.parse import urlparse

# Django imports
from django.db import IntegrityError

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.permissions import WorkSpaceAdminPermission
from plane.db.models import Workspace, Webhook
from plane.ee.views.base import BaseAPIView


class InternalWebhookEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    # create or get the workspace webhook based on the url
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        url = request.data.get("url", None)

        if not url:
            return Response(
                {"error": "URL is required to create a webhook"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Extract the hostname from the URL
        hostname = urlparse(url).hostname
        if not hostname:
            return Response(
                {"url": "Invalid URL: No hostname found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Resolve the hostname to IP addresses
        try:
            ip_addresses = socket.getaddrinfo(hostname, None)
        except socket.gaierror:
            return Response(
                {"url": "Hostname could not be resolved."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not ip_addresses:
            return Response(
                {"url": "No IP addresses found for the hostname."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for addr in ip_addresses:
            ip = ipaddress.ip_address(addr[4][0])
            # if ip.is_loopback:
            #     return Response(
            #         {"url": "URL resolves to a blocked IP address."},
            #         status=status.HTTP_400_BAD_REQUEST,
            #     )

            # if in cloud environment, private IP addresses are also not allowed
            # if settings.IS_MULTI_TENANT and ip.is_private:
            #     return Response(
            #         {"url": "URL resolves to a blocked IP address."},
            #         status=status.HTTP_400_BAD_REQUEST,
            #     )

        # Additional validation for multiple request domains and their subdomains
        disallowed_domains = ["plane.so"]  # Add your disallowed domains here
        if request:
            request_host = request.get_host().split(":")[0]  # Remove port if present
            disallowed_domains.append(request_host)

        # Check if hostname is a subdomain or exact match of any disallowed domain
        # if any(
        #     hostname == domain or hostname.endswith("." + domain)
        #     for domain in disallowed_domains
        # ):
        #     return Response({"url": "URL domain or its subdomain is not allowed."})

        try:
            existing_webhooks = Webhook.objects.filter(
                workspace_id=workspace.id, url=url
            ).first()

            if existing_webhooks is not None:
                return Response(
                    {"id": existing_webhooks.id, "is_connected": True},
                    status=status.HTTP_200_OK,
                )

            webhook = Webhook.objects.create(workspace_id=workspace.id, **request.data)
            return Response(
                {"id": webhook.id, "is_connected": True}, status=status.HTTP_200_OK
            )
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"error": "URL already exists for the workspace"},
                    status=status.HTTP_410_GONE,
                )
            raise IntegrityError

    def delete(self, request, slug, pk):
        webhook = Webhook.objects.get(pk=pk, workspace__slug=slug)
        webhook.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
