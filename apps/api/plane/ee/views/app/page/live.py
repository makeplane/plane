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
import base64
import logging

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import OuterRef, Q, Value, UUIDField, Func, F, Exists
from django.http import HttpResponse
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models.functions import Coalesce

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

# Module imports
from plane.app.serializers import (
    PageLiteSerializer,
)
from plane.db.models import (
    Page,
)
from plane.ee.views.base import BaseViewSet
from plane.bgtasks.page_transaction_task import page_transaction
from plane.bgtasks.page_version_task import page_version
from plane.authentication.secret import SecretKeyAuthentication
from plane.ee.models import PageUser

logger = logging.getLogger(__name__)


class PagesLiveServerSubPagesViewSet(BaseViewSet):
    authentication_classes = [SecretKeyAuthentication]
    permission_classes = [AllowAny]

    def retrieve(self, request, page_id):
        pages = (
            Page.all_objects.filter(parent_id=page_id)
            .annotate(
                project_ids=Coalesce(
                    ArrayAgg(
                        "project_pages__project_id", distinct=True, filter=Q(project_pages__deleted_at__isnull=True)
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                )
            )
            .annotate(
                sub_pages_count=Page.objects.filter(parent=OuterRef("id"))
                .filter(archived_at__isnull=True)
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                is_shared=Exists(
                    PageUser.objects.filter(
                        page_id=OuterRef("id"),
                    )
                )
            )
        )
        serializer = PageLiteSerializer(pages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PagesLiveServerDescriptionViewSet(BaseViewSet):
    authentication_classes = [SecretKeyAuthentication]
    permission_classes = [AllowAny]

    def retrieve(self, request, page_id):
        page = (
            Page.objects.filter(pk=page_id)
            .only("description_binary")
            .first()
        )
        if page is None:
            return Response({"error": "Page not found"}, status=404)
        binary_data = page.description_binary
        logger.info(
            "Page description retrieved (live)",
            extra={"page_id": page_id, "size": len(binary_data) if binary_data else 0},
        )
        response = HttpResponse(binary_data or b"", content_type="application/octet-stream")
        response["Content-Disposition"] = 'attachment; filename="page_description.bin"'
        return response

    def partial_update(self, request, page_id):
        page = Page.objects.filter(pk=page_id).first()

        if page is None:
            return Response({"error": "Page not found"}, status=404)

        # Serialize the existing instance
        existing_instance = json.dumps({"description_html": page.description_html}, cls=DjangoJSONEncoder)

        # Get the base64 data from the request
        base64_data = request.data.get("description_binary")

        # If base64 data is provided
        if base64_data:
            # Decode the base64 data to bytes
            new_binary_data = base64.b64decode(base64_data)
            # capture the page transaction
            if request.data.get("description_html"):
                page_transaction.delay(
                    new_description_html=request.data.get("description_html", "<p></p>"),
                    old_description_html=page.description_html,
                    page_id=page_id,
                )
            # Store the updated binary data
            page.name = request.data.get("name", page.name)
            page.description_binary = new_binary_data
            page.description_html = request.data.get("description_html")
            page.description_json = request.data.get("description_json")
            page.save()
            # Return a success response
            page_version.delay(
                page_id=page.id,
                existing_instance=existing_instance,
                user_id=page.owned_by_id,
            )
            return Response({"message": "Updated successfully"})
        else:
            return Response({"error": "No binary data provided"})
