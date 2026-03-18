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

from django.db import transaction
from rest_framework import status
from rest_framework.response import Response

from plane.api.serializers import ReleaseSerializer
from plane.db.models import Release, ReleaseLabel, ReleaseLabelAssociation, ReleaseTag, Workspace
from plane.ee.models.workspace import WorkspaceFeature
from plane.silo.views.base import BaseServiceAPIView


def validate_list_input(data):
    """Validate that input is a list"""
    if not isinstance(data, list):
        return Response(
            {"error": "Expected a list of releases"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return None


class ReleaseBulkOperationAPIView(BaseServiceAPIView):
    """Bulk create/update endpoint for releases"""

    model = Release
    serializer_class = ReleaseSerializer

    def post(self, request, slug):
        error_response = validate_list_input(request.data)
        if error_response:
            return error_response

        try:
            workspace = Workspace.objects.get(slug=slug)
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Ensure release feature is enabled
        feature, _ = WorkspaceFeature.objects.get_or_create(workspace=workspace)
        if not feature.is_release_enabled:
            feature.is_release_enabled = True
            feature.save()

        created = []
        updated = []
        errored = []

        # 1. Resolve Tags and Labels in bulk
        all_labels = set()
        for release_data in request.data:
            if "labels" in release_data:
                all_labels.update(release_data["labels"])

        # Bulk create/get labels
        for label_name in all_labels:
            ReleaseLabel.objects.get_or_create(workspace=workspace, name=label_name)

        label_map = {label.name: label.id for label in ReleaseLabel.objects.filter(workspace=workspace)}

        # 2. Process releases
        for release_data in request.data:
            try:
                with transaction.atomic():
                    external_id = release_data.get("external_id")
                    external_source = release_data.get("external_source")

                    # Existing release lookup by external_id and external_source
                    existing_release = None
                    if external_id and external_source:
                        existing_release = Release.objects.filter(
                            workspace=workspace,
                            external_id=external_id,
                            external_source=external_source,
                        ).first()


                    # Existing release loookup by name, as we need same release
                    # to be created in plane, across different projects
                    name = release_data.get("name")
                    if not existing_release and name:
                        existing_release = Release.objects.filter(
                            workspace=workspace,
                            name=name,
                        ).first()

                    labels = release_data.pop("labels", [])
                    tag_name = release_data.pop("tag", None)

                    # Handle tag
                    tag_instance = None
                    if tag_name:
                        tag_instance, _ = ReleaseTag.objects.get_or_create(workspace=workspace, version=tag_name)

                    # Serialize
                    if existing_release:
                        serializer = self.serializer_class(
                            existing_release, data=release_data, partial=True, context={"workspace_id": workspace.id}
                        )
                    else:
                        serializer = self.serializer_class(data=release_data, context={"workspace_id": workspace.id})

                    if serializer.is_valid():
                        release = serializer.save(workspace=workspace, tag=tag_instance)

                        # Handle labels
                        if existing_release:
                            ReleaseLabelAssociation.objects.filter(release=release).delete()

                        associations = [
                            ReleaseLabelAssociation(release=release, label_id=label_map[label_name])
                            for label_name in labels
                            if label_name in label_map
                        ]
                        ReleaseLabelAssociation.objects.bulk_create(associations)

                        if existing_release:
                            updated.append(serializer.data)
                        else:
                            created.append(serializer.data)
                    else:
                        errored.append({"payload": release_data, "error": str(serializer.errors)})

            except Exception as e:
                errored.append({"payload": release_data, "error": str(e)})

        return Response(
            {
                "created": created,
                "updated": updated,
                "errored": errored,
            },
            status=status.HTTP_200_OK,
        )
