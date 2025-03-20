# Python imports
import os
import uuid

# Django imports
from django.contrib.auth.hashers import make_password

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.models import IntakeSetting
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
from plane.app.permissions import allow_permission, ROLE
from plane.ee.serializers.app.intake import IntakeSettingSerializer


class IntakeSettingEndpoint(BaseAPIView):
    def get_intake_email_domain(self):
        return os.environ.get("EMAIL_DOMAIN", "example.com")

    def create_intake_user_bot(self, workspace, request, slug):
        # Create or retrieve the user for the intake bot
        user, new_user = User.objects.get_or_create(
            email=f"{workspace.id}-intake@plane.so",
            is_bot=True,
            bot_type="INTAKE_BOT",
            defaults={
                "username": uuid.uuid4().hex,
                "password": make_password(uuid.uuid4().hex),
                "is_password_autoset": True,
                "is_bot": True,
            },
        )
        if new_user:
            APIToken.objects.get_or_create(
                user=user, user_type=1, workspace_id=workspace.id
            )
            WorkspaceMember.objects.get_or_create(
                workspace_id=workspace.id, member_id=user.id, role=ROLE.ADMIN
            )
            project_ids = Project.objects.filter(workspace__slug=slug).values_list(
                "pk", flat=True
            )
            ProjectMember.objects.bulk_create(
                [
                    ProjectMember(
                        project_id=project_id,
                        workspace_id=workspace.id,
                        member_id=user.id,
                        role=ROLE.ADMIN,
                        created_by_id=request.user.id,
                        updated_by_id=request.user.id,
                    )
                    for project_id in project_ids
                ],
                ignore_conflicts=True,
                batch_size=10,
            )

        return

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    @check_feature_flag(FeatureFlag.INTAKE_SETTINGS)
    def get(self, request, slug, project_id):
        intake = Intake.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).first()

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
            intake_setting = IntakeSetting.objects.create(
                project_id=project_id, intake=intake
            )

        deployboards = DeployBoard.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            entity_name__in=["intake", "intake_email"],
        ).values("entity_name", "anchor")

        for deployboard in deployboards:
            if deployboard["entity_name"] == "intake_email":
                deployboard["anchor"] = (
                    f"{slug}-{deployboard['anchor']}@{self.get_intake_email_domain()}"
                )

        data = IntakeSettingSerializer(intake_setting).data
        data["anchors"] = {
            deployboard["entity_name"]: deployboard["anchor"]
            for deployboard in deployboards
        }

        return Response(data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    @check_feature_flag(FeatureFlag.INTAKE_SETTINGS)
    def patch(self, request, slug, project_id):
        intake = Intake.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).first()

        if not intake:
            return Response(
                {"error": "Intake does not exist"}, status=status.HTTP_400_BAD_REQUEST
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
                    # create the user botß
                self.create_intake_user_bot(
                    workspace=workspace, request=request, slug=slug
                )

            # If the email is enabled, create a deploy board for the intake email
            if request.data.get("is_email_enabled"):
                deploy_board = DeployBoard.objects.filter(
                    entity_identifier=intake.id,
                    entity_name="intake_email",
                    project_id=project_id,
                    workspace__slug=slug,
                ).first()
                if not deploy_board:
                    deploy_board = DeployBoard.objects.create(
                        entity_identifier=intake.id,
                        entity_name="intake_email",
                        project_id=project_id,
                        workspace=workspace,
                    )
                    # create the user bot
                self.create_intake_user_bot(
                    workspace=workspace, request=request, slug=slug
                )

        # Get the deployboards for the project
        deployboards = DeployBoard.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            entity_name__in=["intake", "intake_email"],
        ).values("entity_name", "anchor")

        # for the intake email return the complete email address
        for deployboard in deployboards:
            if deployboard["entity_name"] == "intake_email":
                deployboard["anchor"] = (
                    f"{slug}-{deployboard['anchor']}@{self.get_intake_email_domain()}"
                )

        # Validate the intake setting data
        serializer = IntakeSettingSerializer(
            intake_setting, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            data = serializer.data
            # Serializer and return
            data["anchors"] = {
                deployboard["entity_name"]: deployboard["anchor"]
                for deployboard in deployboards
            }
            return Response(data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
