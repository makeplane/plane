import uuid

# Django imports
from django.contrib.auth.hashers import make_password

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.models import IntakeSetting
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.db.models import (
    User,
    APIToken,
    WorkspaceMember,
    ProjectMember,
    Project,
    Inbox,
    Workspace,
    DeployBoard,
)
from plane.ee.serializers.app.intake import IntakeSettingSerializer
from rest_framework import status
from rest_framework.response import Response


class IntakeSettingEndpoint(BaseAPIView):

    @check_feature_flag(FeatureFlag.INTAKE_SETTINGS)
    def get(self, request, slug, project_id):
        intake = Inbox.objects.filter(
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

        intake_settings, _ = IntakeSetting.objects.get_or_create(
            workspace__slug=slug,
            project_id=project_id,
            intake=intake,
        )

        intake_settings = (
            IntakeSetting.objects.filter(id=intake_settings.id)
            .annotate(
                anchor=DeployBoard.objects.filter(
                    entity_name="intake",
                    entity_identifier=intake.id,
                    project_id=project_id,
                    workspace__slug=slug,
                ).values("anchor")
            )
            .first()
        )

        return Response(
            IntakeSettingSerializer(intake_settings).data,
            status=status.HTTP_200_OK,
        )

    @check_feature_flag(FeatureFlag.INTAKE_SETTINGS)
    def patch(self, request, slug, project_id):
        intake = Inbox.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).first()

        if not intake:
            return Response(
                {"error": "Intake does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        intake_settings = (
            IntakeSetting.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                intake=intake,
            )
            .annotate(
                anchor=DeployBoard.objects.filter(
                    entity_name="intake",
                    entity_identifier=intake.id,
                    project_id=project_id,
                    workspace__slug=slug,
                ).values("anchor")
            )
            .first()
        )

        workspace = Workspace.objects.get(slug=slug)

        if intake_settings is not None and request.data.get("is_form_enabled"):
            deploy_board, created = DeployBoard.objects.get_or_create(
                entity_identifier=intake.id,
                entity_name="intake",
                project_id=project_id,
                workspace__slug=slug,
            )

            if created:
                intake_settings = (
                    IntakeSetting.objects.filter(
                        workspace__slug=slug,
                        project_id=project_id,
                        intake=intake,
                    )
                    .annotate(
                        anchor=DeployBoard.objects.filter(
                            entity_name="intake",
                            entity_identifier=intake.id,
                            project_id=project_id,
                            workspace__slug=slug,
                        ).values("anchor")
                    )
                    .first()
                )

            user, new_user = User.objects.get_or_create(
                email=f"{intake.id}-intake@plane.so",
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
                    user=user,
                    user_type=1,
                    workspace_id=workspace.id,
                )
                WorkspaceMember.objects.get_or_create(
                    workspace_id=workspace.id,
                    member_id=user.id,
                    role=20,
                )
                project_ids = Project.objects.filter(
                    workspace__slug=slug
                ).values_list("pk", flat=True)
                ProjectMember.objects.bulk_create(
                    [
                        ProjectMember(
                            project_id=project_id,
                            workspace_id=workspace.id,
                            member_id=user.id,
                            role=20,
                            created_by_id=request.user.id,
                            updated_by_id=request.user.id,
                        )
                        for project_id in project_ids
                    ],
                    ignore_conflicts=True,
                    batch_size=10,
                )

        serializer = IntakeSettingSerializer(
            intake_settings, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
