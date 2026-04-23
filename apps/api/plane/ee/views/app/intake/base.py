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
import uuid
from django.db import transaction

# Django imports
from django.contrib.auth.hashers import make_password
from django.conf import settings

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.models import IntakeSetting, IntakeEmail
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.db.models import (
    Intake,
    Workspace,
    DeployBoard,
    User,
    APIToken,
    WorkspaceMember,
    Project,
    ProjectMember,
)
from plane.app.permissions import ROLE  # ROLE.ADMIN.value used in create_intake_user_bot
from plane.permissions import can, IntakePermissions, get_permission_conditions
from plane.ee.serializers.app.intake import IntakeSettingSerializer
from plane.payment.flags.flag_decorator import check_workspace_feature_flag


class IntakeSettingEndpoint(BaseAPIView):
    use_read_replica = False

    def get_intake_email_domain(self):
        return settings.INTAKE_EMAIL_DOMAIN

    def get_create_user(self, workspace) -> User:
        workspace_user_email = f"{workspace.id}-intake@plane.so"
        new_user = User.objects.filter(email=workspace_user_email).first()

        # create user if not exists
        if not new_user:
            new_user = User.objects.create(
                email=workspace_user_email,
                is_bot=True,
                bot_type="INTAKE_BOT",
                username=uuid.uuid4().hex,
                password=make_password(uuid.uuid4().hex),
                is_password_autoset=True,
            )

        return new_user

    def get_create_api_token(self, user: User, workspace: Workspace) -> APIToken:
        api_token = APIToken.objects.filter(user=user, user_type=1, workspace_id=workspace.id).first()

        # create api token if not exists
        if not api_token:
            api_token = APIToken.objects.create(user=user, user_type=1, workspace_id=workspace.id)

        return api_token

    @transaction.atomic
    def create_intake_user_bot(self, workspace, request, slug):
        try:
            # Create or retrieve the user for the intake bot
            user = self.get_create_user(workspace)

            # Create or get API token
            _ = self.get_create_api_token(user, workspace)

            # Add user to workspace as admin if not already a member
            workspace_member = WorkspaceMember.objects.filter(
                workspace_id=workspace.id, member_id=user.id, role=ROLE.ADMIN.value
            ).first()

            if not workspace_member:
                WorkspaceMember.objects.create(workspace_id=workspace.id, member_id=user.id, role=ROLE.ADMIN.value)

            # Get all project IDs in a single query
            project_ids = list(Project.objects.filter(workspace__slug=slug).values_list("pk", flat=True))

            # Create project members in bulk if they don't exist
            if project_ids:
                existing_members = set(
                    ProjectMember.objects.filter(
                        workspace_id=workspace.id,
                        member_id=user.id,
                        project_id__in=project_ids,
                    ).values_list("project_id", flat=True)
                )

                new_members = [
                    ProjectMember(
                        project_id=project_id,
                        workspace_id=workspace.id,
                        member_id=user.id,
                        role=ROLE.ADMIN.value,
                        created_by_id=request.user.id,
                        updated_by_id=request.user.id,
                    )
                    for project_id in project_ids
                    if project_id not in existing_members
                ]

                if new_members:
                    ProjectMember.objects.bulk_create(new_members, batch_size=100, ignore_conflicts=True)

            return True
        except Exception as e:
            # Log the error here if needed
            raise e

    @check_feature_flag(FeatureFlag.INTAKE_FORM)
    @check_feature_flag(FeatureFlag.INTAKE_EMAIL)
    @can(IntakePermissions.VIEW, resource_param="project_id", defer_conditions=True)
    def get(self, request, slug, project_id):
        # Settings are project-level config, not per-item. Consume any creator
        # condition from guest's intake:view+creator grant without applying it —
        # there is no row to filter.
        get_permission_conditions(request)
        intake = Intake.objects.filter(workspace__slug=slug, project_id=project_id).first()

        if not intake:
            return Response(
                {
                    "is_form_enabled": False,
                    "is_email_enabled": False,
                    "is_in_app_enabled": True,
                },
                status=status.HTTP_200_OK,
            )

        # Initialize intake_setting if it doesn't exist
        intake_setting = IntakeSetting.objects.filter(
            workspace__slug=slug, project_id=project_id, intake=intake
        ).first()

        # Initialize intake_setting if it doesn't exist
        if not intake_setting:
            intake_setting = IntakeSetting.objects.create(project_id=project_id, intake=intake)

        data = IntakeSettingSerializer(intake_setting).data
        data["anchors"] = {}

        # Get intake form anchor from DeployBoard
        intake_deploy_board = (
            DeployBoard.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                entity_name="intake",
            )
            .values("anchor")
            .first()
        )

        if intake_deploy_board and check_workspace_feature_flag(FeatureFlag.INTAKE_FORM, slug, user_id=request.user.id):
            data["anchors"]["intake"] = intake_deploy_board["anchor"]

        # Get intake email anchor from IntakeEmail
        intake_email = (
            IntakeEmail.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                intake=intake,
            )
            .values("anchor")
            .first()
        )

        if intake_email and check_workspace_feature_flag(FeatureFlag.INTAKE_EMAIL, slug, user_id=request.user.id):
            data["anchors"]["intake_email"] = f"{slug}-{intake_email['anchor']}@{self.get_intake_email_domain()}"

        return Response(data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.INTAKE_FORM)
    @check_feature_flag(FeatureFlag.INTAKE_EMAIL)
    @can(IntakePermissions.CONFIGURE, resource_param="project_id")
    def patch(self, request, slug, project_id):
        intake = Intake.objects.filter(workspace__slug=slug, project_id=project_id).first()

        if not intake:
            return Response({"error": "Intake does not exist"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if the form or email is enabled
        request_data = request.data.copy()

        if request_data.get("is_form_enabled") and not check_workspace_feature_flag(
            FeatureFlag.INTAKE_FORM, slug, user_id=request.user.id
        ):
            return Response(
                {"error": "INTAKE_FORM is not enabled"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Only keep email enabled if feature flag is active
        if request_data.get("is_email_enabled") and not check_workspace_feature_flag(
            FeatureFlag.INTAKE_EMAIL, slug, user_id=request.user.id
        ):
            return Response(
                {"error": "INTAKE_EMAIL is not enabled"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # If the intake setting exists, update it
        intake_setting = IntakeSetting.objects.filter(
            workspace__slug=slug, project_id=project_id, intake=intake
        ).first()
        workspace = Workspace.objects.get(slug=slug)

        # Check if the form or email is enabled
        if intake_setting:
            # If the form is enabled, create a deploy board for the intake form
            if request.data.get("is_form_enabled"):
                deploy_board = DeployBoard.objects.filter(
                    entity_identifier=intake.id,
                    entity_name="intake",
                    project_id=project_id,
                    workspace__slug=slug,
                ).first()
                if not deploy_board:
                    deploy_board = DeployBoard.objects.create(
                        entity_identifier=intake.id,
                        entity_name="intake",
                        project_id=project_id,
                        workspace=workspace,
                    )
                    # create the user bot
                self.create_intake_user_bot(workspace=workspace, request=request, slug=slug)

            # If the email is enabled, create an IntakeEmail record
            if request.data.get("is_email_enabled"):
                intake_email_obj = IntakeEmail.objects.filter(
                    intake=intake,
                    project_id=project_id,
                    workspace__slug=slug,
                ).first()
                if not intake_email_obj:
                    intake_email_obj = IntakeEmail.objects.create(
                        intake=intake,
                        project_id=project_id,
                        workspace=workspace,
                    )
                    # create the user bot
                self.create_intake_user_bot(workspace=workspace, request=request, slug=slug)

        # Build anchors response
        anchors = {}

        # Get intake form anchor from DeployBoard
        intake_deploy_board = (
            DeployBoard.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                entity_name="intake",
            )
            .values("anchor")
            .first()
        )

        if intake_deploy_board:
            anchors["intake"] = intake_deploy_board["anchor"]

        # Get intake email anchor from IntakeEmail
        intake_email_obj = (
            IntakeEmail.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                intake=intake,
            )
            .values("anchor")
            .first()
        )

        if intake_email_obj:
            anchors["intake_email"] = f"{slug}-{intake_email_obj['anchor']}@{self.get_intake_email_domain()}"

        serializer = IntakeSettingSerializer(intake_setting, data=request_data, partial=True)
        if serializer.is_valid():
            serializer.save()
            data = serializer.data
            # Serializer and return
            data["anchors"] = anchors
            return Response(data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
