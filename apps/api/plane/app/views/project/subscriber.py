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

# Third Party imports


from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.app.views.base import BaseViewSet
from plane.app.serializers import ProjectSubscriberSerializer
from plane.app.permissions import ProjectAdminPermission
from plane.db.models import Workspace
from plane.ee.models import ProjectSubscriber
from plane.bgtasks.project_subscriber_task import add_project_subscribers_to_work_items_task


class ProjectSubscriberEndpoint(BaseViewSet):
    serializer_class = ProjectSubscriberSerializer
    model = ProjectSubscriber

    permission_classes = [ProjectAdminPermission]

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__archived_at__isnull=True)
            .order_by("-created_at")
            .accessible_to(self.request.user.id, self.kwargs["slug"])
            .distinct()
        )

    def list(self, request, slug, project_id):
        subscribers = self.get_queryset()
        serializer = ProjectSubscriberSerializer(subscribers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _get_existing_subscriber_ids(self, workspace: Workspace, project_id: str) -> set[str]:
        return set(
            list(
                ProjectSubscriber.objects.filter(
                    workspace=workspace,
                    project_id=project_id,
                ).values_list("subscriber_id", flat=True)
            )
        )

    def _remove_subscribers(self, workspace: Workspace, project_id: str, subscriber_ids: set[str]):
        if subscriber_ids:
            ProjectSubscriber.objects.filter(
                workspace=workspace,
                project_id=project_id,
                subscriber_id__in=subscriber_ids,
            ).delete()

    def _add_subscribers(self, workspace: Workspace, project_id: str, subscriber_ids: set[str]):
        if subscriber_ids:
            ProjectSubscriber.objects.bulk_create(
                [
                    ProjectSubscriber(
                        workspace=workspace,
                        project_id=project_id,
                        subscriber_id=subscriber_id,
                    )
                    for subscriber_id in subscriber_ids
                ],
                batch_size=10,
                ignore_conflicts=True,
            )

    def create_or_update(self, request, slug: str, project_id: str):
        subscriber_ids: list[str] = request.data.get("subscriber_ids", [])

        workspace = Workspace.objects.get(slug=slug)
        incoming_ids: set[str] = set(subscriber_ids)
        existing_ids: set[str] = self._get_existing_subscriber_ids(workspace, project_id)

        ids_to_remove: set[str] = existing_ids - incoming_ids
        ids_to_add: set[str] = incoming_ids - existing_ids

        self._remove_subscribers(workspace, project_id, ids_to_remove)
        self._add_subscribers(workspace, project_id, ids_to_add)

        # Subscribe new users to all existing work items in the project
        if ids_to_add:
            add_project_subscribers_to_work_items_task.delay(
                workspace_id=str(workspace.id),
                project_id=str(project_id),
                subscriber_ids=[str(uid) for uid in ids_to_add],
            )

        subscribers = ProjectSubscriber.objects.filter(
            workspace=workspace,
            project_id=project_id,
        )
        serializer = ProjectSubscriberSerializer(subscribers, many=True)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
