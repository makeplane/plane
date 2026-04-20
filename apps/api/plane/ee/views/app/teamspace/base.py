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
import random
import json

# Django imports
from django.db import transaction
from django.db.models import OuterRef, Subquery, Exists, Q
from django.db.models.functions import Coalesce
from django.contrib.postgres.aggregates import ArrayAgg
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from rest_framework.exceptions import PermissionDenied
from plane.db.models import Workspace, WorkspaceMember, Project, ProjectMember
from plane.ee.models import Teamspace, TeamspaceProject, TeamspaceMember, TeamspacePage
from plane.ee.serializers import TeamspaceSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.permissions import ROLE
from plane.permissions import (
    PermissionMixin,
    can,
    TeamspacePermissions,
)
from plane.ee.bgtasks.team_space_activities_task import team_space_activity


def is_admin_or_teamspace_lead(request, slug, team_space_id):
    """Check if user is workspace admin or teamspace lead."""
    if WorkspaceMember.objects.filter(
        member=request.user, workspace__slug=slug, is_active=True, role=ROLE.ADMIN.value,
    ).exists():
        return True
    return Teamspace.objects.filter(pk=team_space_id, workspace__slug=slug, lead=request.user).exists()


def validate_page_in_teamspace(page_id, team_space_id):
    """Validate that a page belongs to the given teamspace via the bridge table.

    Raises PermissionDenied if the page is not linked to the teamspace.
    """
    if not TeamspacePage.objects.filter(page_id=page_id, team_space_id=team_space_id).exists():
        raise PermissionDenied("The page is not part of the team space.")


class TeamspaceBaseEndpoint(BaseAPIView):
    use_read_replica = True

    @property
    def team_space_id(self):
        return self.kwargs.get("team_space_id")

    def is_admin_or_teamspace_lead(self, request, slug, team_space_id):
        """Delegate to module-level function for reuse by non-subclass views."""
        return is_admin_or_teamspace_lead(request, slug, team_space_id)


class TeamspaceEndpoint(PermissionMixin, TeamspaceBaseEndpoint):
    use_read_replica = True

    model = Teamspace
    serializer_class = TeamspaceSerializer

    def get_team_space(self, slug, team_space_id):
        """
        Get team space by pk
        """
        return (
            Teamspace.objects.annotate(
                project_ids=Coalesce(
                    Subquery(
                        TeamspaceProject.objects.filter(
                            team_space=OuterRef("pk"), workspace__slug=slug, project__archived_at__isnull=True
                        )
                        .values("team_space")
                        .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                        .values("project_ids")
                    ),
                    [],
                )
            )
            .annotate(
                is_member=Exists(
                    TeamspaceMember.objects.filter(team_space=OuterRef("pk"), member_id=self.request.user.id)
                ),
                is_workspace_admin=Exists(
                    WorkspaceMember.objects.filter(
                        workspace__slug=slug, member=self.request.user, role=ROLE.ADMIN.value, is_active=True
                    )
                ),
            )
            .filter(Q(is_member=True) | Q(is_workspace_admin=True))
            .get(workspace__slug=slug, pk=team_space_id)
        )

    def get_team_spaces(self, slug):
        """
        Get all team spaces in workspace
        """
        return (
            Teamspace.objects.filter(
                workspace__slug=slug,
                members__member_id=self.request.user.id,
                members__deleted_at__isnull=True,
            )
            .annotate(
                project_ids=Coalesce(
                    Subquery(
                        TeamspaceProject.objects.filter(
                            team_space=OuterRef("pk"), workspace__slug=slug, project__archived_at__isnull=True
                        )
                        .values("team_space")
                        .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                        .values("project_ids")
                    ),
                    [],
                )
            )
            .distinct()
        )

    def get_add_remove_team_space_projects(self, slug, team_space_id, request_project_ids):
        # Update team space projects
        existing_project_ids = [
            str(project_id)
            for project_id in TeamspaceProject.objects.filter(
                team_space_id=team_space_id, workspace__slug=slug
            ).values_list("project_id", flat=True)
        ]

        # Get the list of project ids to be added
        project_ids_to_be_added = set(request_project_ids) - set(existing_project_ids)
        # Get the list of project ids to be removed
        project_ids_to_be_removed = set(existing_project_ids) - set(request_project_ids)

        return project_ids_to_be_added, project_ids_to_be_removed

    def get_accessible_project_ids(self, slug, user_id, project_ids):
        project_ids = [str(project_id) for project_id in project_ids]

        direct_project_ids = ProjectMember.objects.filter(
            workspace__slug=slug,
            member_id=user_id,
            is_active=True,
            project_id__in=project_ids,
        ).values_list("project_id", flat=True)

        teamspace_ids = TeamspaceMember.objects.filter(
            workspace__slug=slug,
            member_id=user_id,
            deleted_at__isnull=True,
        ).values_list("team_space_id", flat=True)

        teamspace_project_ids = TeamspaceProject.objects.filter(
            workspace__slug=slug,
            team_space_id__in=teamspace_ids,
            project_id__in=project_ids,
        ).values_list("project_id", flat=True)

        accessible_project_ids = set(map(str, direct_project_ids))
        accessible_project_ids.update(map(str, teamspace_project_ids))
        return accessible_project_ids

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    @can(TeamspacePermissions.BROWSE, resource_param="workspace_id")
    def get(self, request, slug, team_space_id=None):
        # Get team space by pk
        if team_space_id:
            team_space = self.get_team_space(slug, team_space_id)
            serializer = TeamspaceSerializer(team_space, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all team spaces in workspace
        team_spaces = self.get_team_spaces(slug)
        serializer = TeamspaceSerializer(team_spaces, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    @can(TeamspacePermissions.CREATE, resource_param="workspace_id")
    def post(self, request, slug):
        try:
            workspace = Workspace.objects.get(slug=slug)
            request.data.pop("project_ids", [])

            # Create team space
            serializer = TeamspaceSerializer(data=request.data)

            # Validate serializer
            if serializer.is_valid():
                team_space = serializer.save(workspace=workspace)

                # Add the creating user as the first member of the team space
                TeamspaceMember.objects.create(
                    team_space=team_space,
                    workspace=workspace,
                    member_id=request.user.id,
                )

                # Add the lead to the team space if provided and not the creating user
                if request.data.get("lead_id") and str(request.data.get("lead_id")) != str(request.user.id):
                    TeamspaceMember.objects.create(
                        team_space=team_space,
                        workspace=workspace,
                        member_id=request.data.get("lead_id"),
                    )

                # Track the teamspace creation activity
                team_space_activity.delay(
                    type="team_space.activity.created",
                    slug=slug,
                    requested_data=json.dumps(self.request.data, cls=DjangoJSONEncoder),
                    actor_id=str(request.user.id),
                    team_space_id=str(team_space.id),
                    current_instance=None,
                    epoch=int(timezone.now().timestamp()),
                )

                # Refetch team space with project_ids
                team_space = self.get_team_space(slug, team_space.pk)

                serializer = TeamspaceSerializer(team_space, context={"request": request})
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    @can(TeamspacePermissions.EDIT, resource_param="team_space_id")
    def patch(self, request, slug, team_space_id):
        try:
            # # Check if user is workspace admin or teamspace lead
            # is_admin_or_lead = self.is_admin_or_teamspace_lead(request, slug, team_space_id)
            # if not is_admin_or_lead:
            #     return Response(
            #         {"error": "You don't have permission to edit this teamspace."},
            #         status=status.HTTP_403_FORBIDDEN,
            #     )

            is_workspace_admin = WorkspaceMember.objects.filter(
                member=request.user,
                workspace__slug=slug,
                is_active=True,
                role=ROLE.ADMIN.value,
            ).exists()

            # Get team space by pk
            team_space = self.get_team_space(slug, team_space_id)
            # Get workspace
            workspace = Workspace.objects.get(slug=slug)

            current_instance = json.dumps(TeamspaceSerializer(team_space).data, cls=DjangoJSONEncoder)
            requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)

            serializer = TeamspaceSerializer(team_space, data=request.data, partial=True)
            if serializer.is_valid():
                with transaction.atomic():
                    team_space = serializer.save()

                    # Get the lead id from request
                    lead_id = request.data.get("lead_id", None)
                    # Add the lead to the team space if provided and not the creating user
                    if (
                        lead_id
                        and TeamspaceMember.objects.filter(team_space=team_space, member_id=lead_id).exists() is False
                    ):
                        TeamspaceMember.objects.create(team_space=team_space, workspace=workspace, member_id=lead_id)

                    # Get the list of project ids for request if it exists
                    if "project_ids" in request.data:
                        # Get the list of project ids for request
                        project_ids = request.data.pop("project_ids", [])

                        # Update team space projects
                        project_ids_to_be_added, project_ids_to_be_removed = self.get_add_remove_team_space_projects(
                            slug, team_space.pk, project_ids
                        )

                        valid_workspace_project_ids = {
                            str(project_id)
                            for project_id in Project.objects.filter(
                                workspace__slug=slug,
                                id__in=project_ids_to_be_added,
                                archived_at__isnull=True,
                            ).values_list("id", flat=True)
                        }

                        invalid_project_ids = set(project_ids_to_be_added) - valid_workspace_project_ids
                        if invalid_project_ids:
                            raise ValueError("One or more provided project IDs are invalid for this workspace.")

                        if not is_workspace_admin:
                            accessible_project_ids = self.get_accessible_project_ids(
                                slug,
                                request.user.id,
                                project_ids_to_be_added,
                            )

                            unauthorized_project_ids = set(project_ids_to_be_added) - accessible_project_ids
                            if unauthorized_project_ids:
                                raise PermissionError(
                                    "You don't have permission to add one or more projects to this teamspace."
                                )

                        # Create team space projects
                        TeamspaceProject.objects.bulk_create(
                            [
                                TeamspaceProject(
                                    team_space=team_space,
                                    workspace=workspace,
                                    project_id=project_id,
                                    sort_order=random.randint(1, 65535),
                                )
                                for project_id in project_ids_to_be_added
                            ],
                            ignore_conflicts=True,
                            batch_size=100,
                        )

                        # Delete team space projects
                        TeamspaceProject.objects.filter(
                            team_space_id=team_space.pk,
                            workspace__slug=slug,
                            project_id__in=project_ids_to_be_removed,
                        ).delete()

                team_space_activity.delay(
                    type="team_space.activity.updated",
                    slug=slug,
                    requested_data=requested_data,
                    actor_id=str(request.user.id),
                    team_space_id=str(team_space_id),
                    notification=True,
                    current_instance=current_instance,
                    epoch=int(timezone.now().timestamp()),
                )

                # Refetch team space with project_ids
                team_space = self.get_team_space(slug, team_space.pk)
                serializer = TeamspaceSerializer(team_space, context={"request": request})
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Teamspace.DoesNotExist:
            return Response({"error": "Team space not found"}, status=status.HTTP_404_NOT_FOUND)

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    @can(TeamspacePermissions.DELETE, resource_param="team_space_id")
    def delete(self, request, slug, team_space_id):
        """
        Delete team space by pk
        """
        try:
            # Get team space by pk
            team_space = Teamspace.objects.get(workspace__slug=slug, pk=team_space_id)

            team_space_activity.delay(
                type="team_space.activity.deleted",
                slug=slug,
                requested_data=json.dumps({"team_space_id": str(team_space_id)}),
                actor_id=str(request.user.id),
                team_space_id=str(team_space_id),
                current_instance={},
                epoch=int(timezone.now().timestamp()),
            )

            # Delete team space
            team_space.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Teamspace.DoesNotExist:
            return Response({"error": "Team space not found"}, status=status.HTTP_404_NOT_FOUND)
