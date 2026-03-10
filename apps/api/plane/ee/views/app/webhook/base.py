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
from urllib.parse import urlparse

# Django imports
from django.conf import settings
from django.db import IntegrityError

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.permissions import WorkSpaceAdminPermission
from plane.db.models import Workspace, Webhook
from plane.ee.views.base import BaseAPIView
from plane.utils.ip_address import validate_url


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

        # Validate URL against SSRF
        try:
            validate_url(url, block_private=not settings.IS_SELF_MANAGED)
        except ValueError as e:
            return Response(
                {"url": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Additional validation for disallowed domains
        hostname = urlparse(url).hostname
        disallowed_domains = ["plane.so"]
        if request:
            request_host = request.get_host().split(":")[0]
            disallowed_domains.append(request_host)

        if any(hostname == domain or hostname.endswith("." + domain) for domain in disallowed_domains):
            return Response(
                {"url": "URL domain or its subdomain is not allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            existing_webhooks = Webhook.objects.filter(workspace_id=workspace.id, url=url).first()

            if existing_webhooks is not None:
                return Response(
                    {"id": existing_webhooks.id, "is_connected": True},
                    status=status.HTTP_200_OK,
                )

            webhook = Webhook.objects.create(workspace_id=workspace.id, **request.data)
            return Response({"id": webhook.id, "is_connected": True}, status=status.HTTP_200_OK)
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
