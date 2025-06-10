# Python imports
import json
import uuid

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

# Django imports
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Module imports
from plane.db.models import (
    DeployBoard,
    Intake,
    IntakeIssue,
    Project,
    APIToken,
    FileAsset,
    Workspace,
)
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag_decorator import ErrorCodes
from plane.space.serializer.project import ProjectLiteSerializer
from plane.bgtasks.issue_activities_task import issue_activity
from plane.settings.storage import S3Storage
from plane.space.rate_limit import SpaceRateThrottle, AnchorBasedRateThrottle

## Enterprise imports
from plane.ee.serializers import IssueCreateSerializer
from plane.ee.views.base import BaseAPIView
from plane.ee.models import IntakeSetting
from plane.ee.bgtasks.intake_email_task import intake_email
from plane.ee.utils.intake_email_anchor import get_anchors


class IntakeMetaPublishedIssueEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def get(self, request, anchor):
        try:
            deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="intake")
        except DeployBoard.DoesNotExist:
            return Response(
                {"error": "Intake is not published"}, status=status.HTTP_404_NOT_FOUND
            )

        if check_workspace_feature_flag(
            feature_key=FeatureFlag.INTAKE_FORM, slug=deploy_board.workspace.slug
        ):
            try:
                project_id = deploy_board.project_id
                project = Project.objects.get(id=project_id)
            except Project.DoesNotExist:
                return Response(
                    {"error": "Intake is not published"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            serializer = ProjectLiteSerializer(project)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(
                {
                    "error": "Payment required",
                    "error_code": ErrorCodes.PAYMENT_REQUIRED.value,
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )


class IntakePublishedIssueEndpoint(BaseAPIView):
    permission_classes = [AllowAny]
    throttle_classes = [SpaceRateThrottle, AnchorBasedRateThrottle]

    def post(self, request, anchor):
        # Get the deploy board object
        deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="intake")
        project = Project.objects.get(
            workspace_id=deploy_board.workspace_id, pk=deploy_board.project_id
        )
        intake_settings = IntakeSetting.objects.filter(
            workspace_id=deploy_board.workspace_id, project_id=deploy_board.project_id
        ).first()
        if not intake_settings.is_form_enabled or not project.intake_view:
            return Response(
                {"error": "The current published url is disabled"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if the workspace has access to feature
        if check_workspace_feature_flag(
            feature_key=FeatureFlag.INTAKE_FORM, slug=deploy_board.workspace.slug
        ):
            intake = Intake.objects.filter(
                workspace_id=deploy_board.workspace_id,
                project_id=deploy_board.project_id,
            ).first()

            if request.data.get("name") is None:
                return Response(
                    {"error": "Name is required"}, status=status.HTTP_400_BAD_REQUEST
                )

            api_token = APIToken.objects.filter(
                workspace_id=deploy_board.workspace_id,
                user__is_bot=True,
                user__bot_type="INTAKE_BOT",
            ).first()
            issue_data = {
                "name": request.data.get("name"),
                "description_html": request.data.get("description_html", "<p></p>"),
            }

            serializer = IssueCreateSerializer(
                data=issue_data,
                context={
                    "project_id": deploy_board.project_id,
                    "workspace_id": deploy_board.workspace_id,
                    "default_assignee_id": deploy_board.project.default_assignee_id,
                    "created_by_id": api_token.user_id,
                    "slug": deploy_board.workspace.slug,
                },
            )

            if serializer.is_valid():
                serializer.save()

                # create an Intake issue
                intake_issue = IntakeIssue.objects.create(
                    intake_id=intake.id,
                    project_id=deploy_board.project_id,
                    issue_id=serializer.data["id"],
                    source=request.data.get("source", "FORMS"),
                    source_email=request.data.get("email", None),
                    extra={"username": request.data.get("username", None)},
                )
                # Create an Issue Activity
                issue_activity.delay(
                    type="issue.activity.created",
                    requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                    actor_id=str(api_token.user_id),
                    issue_id=str(serializer.data["id"]),
                    project_id=str(deploy_board.project_id),
                    current_instance=None,
                    epoch=int(timezone.now().timestamp()),
                    notification=True,
                    origin=request.META.get("HTTP_ORIGIN"),
                    intake=str(intake_issue.id),
                )
                return Response(status=status.HTTP_204_NO_CONTENT)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(
                {
                    "error": "Payment required",
                    "error_code": ErrorCodes.PAYMENT_REQUIRED.value,
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )


class IntakeEmailWebhookEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Handle email webhook logic here
        intake_email.delay(request.data)
        return Response({"message": "Email received"}, status=status.HTTP_200_OK)


class IntakeEmailAttachmentEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Get the publish anchor and workspace slug
        publish_anchor, workspace_slug = get_anchors(request.data.get("to", ""))

        # Check if publish anchor or workspace slug is empty
        if not publish_anchor or not workspace_slug:
            return Response(
                {"error": "Invalid email address"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Check if workspace has feature flag enabled
        if not check_workspace_feature_flag(
            feature_key=FeatureFlag.INTAKE_EMAIL, slug=workspace_slug
        ):
            return Response(
                {"error": "Payment required"}, status=status.HTTP_402_PAYMENT_REQUIRED
            )

        # Get the deploy boards
        deploy_board = DeployBoard.objects.get(
            workspace__slug=workspace_slug,
            anchor=publish_anchor,
            entity_name=DeployBoard.DeployBoardType.INTAKE_EMAIL,
        )
        api_token = APIToken.objects.filter(
            workspace_id=deploy_board.workspace_id,
            user__is_bot=True,
            user__bot_type="INTAKE_BOT",
        ).first()

        if not api_token:
            return Response(
                {"error": "Intake bot not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Get the workspace
        workspace = Workspace.objects.get(slug=workspace_slug)

        # Loop through assets
        name = request.data.get("name")
        type = request.data.get("type", "image/jpeg")
        size = request.data.get("size", 0)

        if name:
            # asset key
            asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"
        else:
            name = f"attachment-{uuid.uuid4().hex}"
            asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={"name": name, "type": type, "size": size},
            asset=asset_key,
            size=size,
            workspace=workspace,
            created_by=api_token.user,
            entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            project_id=deploy_board.project_id,
        )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        presigned_url = storage.generate_presigned_post(
            object_name=asset_key, file_type=type, file_size=size
        )
        # Return the presigned URL
        return Response(
            {"asset_id": str(asset.id), "presigned_url": presigned_url},
            status=status.HTTP_200_OK,
        )
