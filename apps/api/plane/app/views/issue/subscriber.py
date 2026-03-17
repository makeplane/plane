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
from typing import Any


from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseViewSet
from plane.app.serializers import IssueSubscriberSerializer
from plane.app.permissions import ProjectEntityPermission, ProjectLitePermission

from plane.db.models import IssueSubscriber, ProjectMember, WorkspaceMember
from plane.ee.models import TeamspaceMember, TeamspaceProject

from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class IssueSubscriberViewSet(BaseViewSet):
    serializer_class = IssueSubscriberSerializer
    model = IssueSubscriber

    permission_classes = [ProjectEntityPermission]

    def get_permissions(self):
        if self.action in ["subscribe", "unsubscribe", "subscription_status"]:
            self.permission_classes = [ProjectLitePermission]
        else:
            self.permission_classes = [ProjectEntityPermission]

        return super(IssueSubscriberViewSet, self).get_permissions()

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            issue_id=self.kwargs.get("issue_id"),
        )

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("issue_id"))
            .filter(project__archived_at__isnull=True)
            .order_by("-created_at")
            .accessible_to(self.request.user.id, self.kwargs["slug"])
            .distinct()
        )

    def list(self, request, slug, project_id, issue_id):
        # fetch all the subscribers for the issue
        subscribers = IssueSubscriber.objects.filter(
            workspace__slug=slug, project_id=project_id, issue_id=issue_id
        ).values_list("subscriber_id", flat=True)
        # fetch all the project members that are subscribed to the issue
        subscribed_project_members = ProjectMember.objects.filter(
            project_id=project_id,
            member_id__in=subscribers,
            is_active=True,
        ).values_list("member_id", flat=True)
        # fetch all the teamspaces that are part of the project
        teamspace_ids = TeamspaceProject.objects.filter(project_id=project_id).values_list("team_space_id", flat=True)
        # fetch all the teamspace members that are subscribed to the issue
        subscribed_teamspace_members = TeamspaceMember.objects.filter(
            team_space_id__in=teamspace_ids,
            member_id__in=subscribers,
        ).values_list("member_id", flat=True)
        # combine the project members and teamspace members and remove duplicates
        subscribed_users = set(list(subscribed_project_members) + list(subscribed_teamspace_members))
        return Response(subscribed_users, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.MANAGE_ISSUE_SUBSCRIBERS)
    def update(self, request, slug, project_id, issue_id):
        subscriber_ids = request.data.get("subscriber_ids", [])

        # check if the subscriber IDs are part of the project members
        workspace_members = WorkspaceMember.objects.filter(
            workspace__slug=slug,
            member_id__in=subscriber_ids,
            is_active=True,
        ).values_list("member_id", flat=True)
        workspace_member_ids = [str(uuid_obj) for uuid_obj in workspace_members]
        print(workspace_member_ids)
        print(subscriber_ids)
        if set[Any](workspace_member_ids) != set[Any](subscriber_ids):
            return Response(
                {
                    "message": "Subscriber IDs are not part of the workspace members.",
                    "code": "SUBSCRIBER_NOT_WORKSPACE_MEMBER",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get existing subscriber IDs
        existing_subscriber_uuids = IssueSubscriber.objects.filter(
            project=project_id,
            workspace__slug=slug,
            issue=issue_id,
        ).values_list("subscriber_id", flat=True)

        existing_subscriber_ids = [str(uuid_obj) for uuid_obj in existing_subscriber_uuids]

        # Add new subscribers
        subscriber_ids_to_add = set(subscriber_ids) - set(existing_subscriber_ids)
        for subscriber_id in subscriber_ids_to_add:
            IssueSubscriber.objects.create(
                issue_id=issue_id,
                subscriber_id=subscriber_id,
                project_id=project_id,
            )

        # Remove subscribers that are not in the new list
        subscriber_ids_to_remove = set(existing_subscriber_ids) - set(subscriber_ids)
        for subscriber_id in subscriber_ids_to_remove:
            IssueSubscriber.objects.filter(
                project=project_id,
                subscriber=subscriber_id,
                workspace__slug=slug,
                issue=issue_id,
            ).delete()

        subscribers = IssueSubscriber.objects.filter(
            project=project_id,
            workspace__slug=slug,
            issue=issue_id,
        ).values_list("subscriber_id", flat=True)
        return Response(subscribers, status=status.HTTP_200_OK)

    def subscribe(self, request, slug, project_id, issue_id):
        # Check if the subscriber is a member of the project
        if not ProjectMember.is_member(project_id, request.user.id):
            return Response(
                {"message": "User is not member of the project.", "code": "SUBSCRIBE_NOT_PROJECT_MEMBER"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the current user is already subscribed to the issue
        if IssueSubscriber.is_subscribed(issue_id, request.user.id):
            return Response(
                {"message": "Already subscribed to the issue.", "code": "SUBSCRIBER_ALREADY_EXISTS"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Create a new subscription for the current user to the issue
        subscriber = IssueSubscriber.objects.create(
            issue_id=issue_id, subscriber_id=request.user.id, project_id=project_id
        )
        serializer = IssueSubscriberSerializer(subscriber)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def unsubscribe(self, request, slug, project_id, issue_id):
        issue_subscriber = IssueSubscriber.objects.get(
            project=project_id,
            subscriber=request.user,
            issue=issue_id,
        )
        issue_subscriber.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def subscription_status(self, request, slug, project_id, issue_id):
        is_subscribed = IssueSubscriber.is_subscribed(issue_id, request.user.id)
        return Response({"subscribed": is_subscribed}, status=status.HTTP_200_OK)
