# Standard library imports
import uuid
import json

# Django imports
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.db import IntegrityError
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.request import Request

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.serializers import (
    AutomationDetailReadSerializer,
    AutomationWriteSerializer,
    AutomationReadSerializer,
)
from plane.db.models import User, BotTypeEnum, WorkspaceMember
from plane.ee.models import (
    Automation,
    AutomationRun,
    AutomationStatusChoices,
    RunStatusChoices,
    AutomationNode,
    NodeTypeChoices,
)
from plane.app.permissions import allow_permission, ROLE
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.utils.exception_logger import log_exception
from plane.ee.bgtasks.automation_activity_task import automation_activity


class AutomationEndpoint(BaseAPIView):

    def enhance_automation_data(
        self, automations: list[Automation], data: list[dict]
    ) -> list[dict]:
        # get all automation runs for the automations
        runs = AutomationRun.objects.filter(automation__in=automations).values(
            "automation_id", "status", "started_at", "completed_at"
        )
        for automation in data:
            automation_runs = [
                run
                for run in runs
                if str(run.get("automation_id")) == str(automation.get("id"))
            ]
            if automation_runs:
                automation["last_run_status"] = automation_runs[0].get("status")
                # Calculate average run time only for runs with both timestamps
                run_times = [
                    (run.get("completed_at") - run.get("started_at")).total_seconds()
                    for run in automation_runs
                    if run.get("completed_at") and run.get("started_at")
                ]
                automation["average_run_time"] = (
                    sum(run_times) / len(run_times) if run_times else 0
                )

                automation["total_success_count"] = sum(
                    1
                    for run in automation_runs
                    if run.get("status") == RunStatusChoices.SUCCESS.value
                )
                automation["total_failed_count"] = sum(
                    1
                    for run in automation_runs
                    if run.get("status") == RunStatusChoices.FAILED.value
                )
            else:
                automation["last_run_status"] = None
                automation["average_run_time"] = 0
                automation["total_success_count"] = 0
                automation["total_failed_count"] = 0

        return data

    @check_feature_flag(FeatureFlag.PROJECT_AUTOMATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request: Request, slug: str, project_id: uuid.UUID, pk=None):
        if pk:
            automation = Automation.objects.filter(
                id=pk,
                project_id=project_id,
            ).first()
            if not automation:
                return Response(
                    {"error": "Automation not found"}, status=status.HTTP_404_NOT_FOUND
                )

            serializer = AutomationDetailReadSerializer(automation)

            return Response(serializer.data, status=status.HTTP_200_OK)
        automations = Automation.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
        )
        serializer = AutomationReadSerializer(automations, many=True)
        automation_data = self.enhance_automation_data(automations, serializer.data)
        return Response(automation_data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.PROJECT_AUTOMATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN])
    def post(self, request: Request, slug: str, project_id: uuid.UUID):
        serializer = AutomationWriteSerializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    serializer.save(project_id=project_id)
                    # Create a base version for the automation
                    version = serializer.instance.create_new_version()
                    serializer.instance.current_version = version
                    serializer.instance.save()
                    automation_activity.delay(
                        type="automation.activity.created",
                        requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                        actor_id=str(request.user.id),
                        automation_id=str(serializer.instance.id),
                        project_id=str(project_id),
                        current_instance=None,
                        epoch=int(timezone.now().timestamp()),
                        slug=slug,
                    )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except IntegrityError as e:
                if "automation_unique_workspace_name_when_not_deleted" in str(e):
                    return Response(
                        {"error": "Automation with this name already exists."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                raise e
            except Exception as e:
                log_exception(e)
                return Response(
                    {"error": "Failed to create automation."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.PROJECT_AUTOMATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN])
    def patch(self, request: Request, slug: str, project_id: uuid.UUID, pk: uuid.UUID):
        automation = Automation.objects.get(
            id=pk,
            project_id=project_id,
            workspace__slug=slug,
        )
        current_instance = json.dumps(
            AutomationWriteSerializer(automation).data, cls=DjangoJSONEncoder
        )
        serializer = AutomationWriteSerializer(
            automation, data=request.data, partial=True
        )
        if serializer.is_valid():
            try:
                serializer.save()
            except IntegrityError as e:
                if "automation_unique_workspace_name_when_not_deleted" in str(e):
                    return Response(
                        {"error": "Automation with this name already exists."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                raise e
            except Exception as e:
                log_exception(e)
                return Response(
                    {"error": "Failed to update automation."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            automation_activity.delay(
                type="automation.activity.updated",
                requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                automation_id=str(pk),
                project_id=str(project_id),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
                slug=slug,
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.PROJECT_AUTOMATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN])
    def delete(self, request: Request, slug: str, project_id: uuid.UUID, pk: uuid.UUID):
        automation = Automation.objects.get(
            id=pk,
            project_id=project_id,
            workspace__slug=slug,
        )
        # Validation: Do not allow deletion if automation is enabled
        if automation.is_enabled:
            return Response(
                {"error": "Cannot delete an enabled automation. Please disable it first."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        automation.delete()
        automation_activity.delay(
            type="automation.activity.deleted",
            requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            automation_id=str(pk),
            project_id=str(project_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            slug=slug,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class AutomationStatusEndpoint(BaseAPIView):
    """
    This endpoint will be used to toggle the status of the automation`
    """

    @check_feature_flag(FeatureFlag.PROJECT_AUTOMATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN])
    def post(self, request, slug, project_id, pk: uuid.UUID):
        automation = Automation.objects.get(pk=pk)

        is_enabled = request.data.get("is_enabled")

        # check if trigger and action exist
        if is_enabled and not (
            AutomationNode.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                version=automation.current_version,
                node_type=NodeTypeChoices.ACTION,
            ).exists()
            and AutomationNode.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                version=automation.current_version,
                node_type=NodeTypeChoices.TRIGGER,
            ).exists()
        ):
            return Response(
                {
                    "error": "Automation cannot be published since it does not contain a trigger and an action"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        automation.is_enabled = is_enabled
        automation.status = (
            AutomationStatusChoices.PUBLISHED
            if is_enabled
            else AutomationStatusChoices.DISABLED
        )
        automation.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AutomationBaseEndpoint(BaseAPIView):
    def get_automation_version(self, automation_id: uuid.UUID):
        automation = Automation.objects.get(
            id=automation_id,
            project_id=self.kwargs["project_id"],
            workspace__slug=self.kwargs["slug"],
        )
        return automation.current_version
