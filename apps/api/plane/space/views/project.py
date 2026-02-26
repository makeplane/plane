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

# Django imports
from django.db.models import Exists, OuterRef

# Third Party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

# Module imports
from .base import BaseAPIView
from plane.app.serializers import DeployBoardSerializer
from plane.db.models import Project, DeployBoard, ProjectMember, WorkspaceMember
from plane.authentication.models import WorkspaceAppInstallation

# EE
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.models.intake import IntakeSetting


class DeployBoardPublicSettingsEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def check_feature_flags(self, deploy_board):
        if deploy_board.entity_name == "page" and not check_workspace_feature_flag(
            feature_key=FeatureFlag.PAGE_PUBLISH, slug=deploy_board.workspace.slug
        ):
            return False

        if deploy_board.entity_name == "view" and not check_workspace_feature_flag(
            feature_key=FeatureFlag.VIEW_PUBLISH, slug=deploy_board.workspace.slug
        ):
            return False

        if deploy_board.entity_name == "intake" and not (
            check_workspace_feature_flag(feature_key=FeatureFlag.INTAKE_FORM, slug=deploy_board.workspace.slug)
            and IntakeSetting.objects.filter(
                workspace=deploy_board.workspace,
                intake_id=deploy_board.entity_identifier,
                is_form_enabled=True,
            ).exists()
        ):
            return False

        return True

    def get_installed_apps(self, workspace_id):
        return list(
            WorkspaceAppInstallation.objects.filter(
                workspace_id=workspace_id,
                status=WorkspaceAppInstallation.Status.INSTALLED,
            )
            .values_list("application__slug", flat=True)
            .distinct()
        )

    def get(self, request, anchor):
        deploy_board = DeployBoard.objects.get(anchor=anchor)
        if deploy_board.entity_name in [
            "page",
            "view",
            "intake",
        ] and not self.check_feature_flags(deploy_board):
            return Response(
                {"message": "requested entity could not be found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = DeployBoardSerializer(deploy_board)
        data = serializer.data
        data["installed_apps"] = self.get_installed_apps(deploy_board.workspace_id)
        return Response(data, status=status.HTTP_200_OK)


class WorkspaceProjectDeployBoardEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def get(self, request, anchor):
        deploy_board = DeployBoard.objects.filter(anchor=anchor, entity_name="project").values_list
        projects = (
            Project.objects.filter(workspace=deploy_board.workspace)
            .annotate(
                is_public=Exists(
                    DeployBoard.objects.filter(anchor=anchor, project_id=OuterRef("pk"), entity_name="project")
                )
            )
            .filter(is_public=True)
        ).values(
            "id",
            "identifier",
            "name",
            "description",
            "emoji",
            "icon_prop",
            "cover_image",
        )

        return Response(projects, status=status.HTTP_200_OK)


class WorkspaceProjectAnchorEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def get(self, request, slug, project_id):
        project_deploy_board = DeployBoard.objects.get(
            workspace__slug=slug, project_id=project_id, entity_name="project"
        )
        serializer = DeployBoardSerializer(project_deploy_board)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProjectMembersEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def get(self, request, anchor):
        deploy_board = DeployBoard.objects.filter(anchor=anchor).first()
        if not deploy_board:
            return Response({"error": "Invalid anchor"}, status=status.HTTP_404_NOT_FOUND)

        if deploy_board.project:
            members = ProjectMember.objects.filter(
                project=deploy_board.project,
                workspace=deploy_board.workspace,
                is_active=True,
                role__gt=5,
            ).values(
                "id",
                "member",
                "member__first_name",
                "member__last_name",
                "member__display_name",
                "member__avatar",
                "project",
                "workspace",
            )
        else:
            members = WorkspaceMember.objects.filter(workspace=deploy_board.workspace, is_active=True).values(
                "id",
                "member",
                "member__first_name",
                "member__last_name",
                "member__display_name",
                "member__avatar",
                "workspace",
            )

        return Response(members, status=status.HTTP_200_OK)
