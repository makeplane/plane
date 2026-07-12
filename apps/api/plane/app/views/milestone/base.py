# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db.models import Count, Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .. import BaseViewSet
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import MilestoneSerializer, MilestoneWriteSerializer
from plane.db.models import Milestone, Project

MILESTONES_DISABLED_ERROR = "Milestones are not enabled for this project."


def milestones_enabled(project_id):
    return Project.objects.filter(pk=project_id, is_milestone_enabled=True).exists()


class MilestoneViewSet(BaseViewSet):
    serializer_class = MilestoneSerializer
    model = Milestone

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(project__archived_at__isnull=True)
            .select_related("project", "workspace")
            .annotate(
                total_issues=Count(
                    "issue_milestone__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_milestone__issue__archived_at__isnull=True,
                        issue_milestone__issue__is_draft=False,
                        issue_milestone__deleted_at__isnull=True,
                        issue_milestone__issue__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                completed_issues=Count(
                    "issue_milestone__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_milestone__issue__state__group="completed",
                        issue_milestone__issue__archived_at__isnull=True,
                        issue_milestone__issue__is_draft=False,
                        issue_milestone__deleted_at__isnull=True,
                        issue_milestone__issue__deleted_at__isnull=True,
                    ),
                )
            )
            .order_by("-created_at")
            .distinct()
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        milestones = self.get_queryset()
        serializer = MilestoneSerializer(milestones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        if not milestones_enabled(project_id):
            return Response({"error": MILESTONES_DISABLED_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        serializer = MilestoneWriteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id)
            milestone = self.get_queryset().filter(pk=serializer.instance.id).first()
            return Response(MilestoneSerializer(milestone).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def retrieve(self, request, slug, project_id, pk):
        milestone = self.get_queryset().filter(pk=pk).first()
        if milestone is None:
            return Response({"error": "Milestone not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = MilestoneSerializer(milestone)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def partial_update(self, request, slug, project_id, pk):
        if not milestones_enabled(project_id):
            return Response({"error": MILESTONES_DISABLED_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        milestone = Milestone.objects.get(workspace__slug=slug, project_id=project_id, pk=pk)
        serializer = MilestoneWriteSerializer(milestone, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            milestone = self.get_queryset().filter(pk=pk).first()
            return Response(MilestoneSerializer(milestone).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, pk):
        if not milestones_enabled(project_id):
            return Response({"error": MILESTONES_DISABLED_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        milestone = Milestone.objects.get(workspace__slug=slug, project_id=project_id, pk=pk)
        milestone.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
