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

# Standard library imports
import uuid
import json

# Django imports
from django.db import transaction
from django.db import IntegrityError
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Prefetch

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
from plane.ee.models import (
    Automation,
    AutomationRun,
    AutomationStatusChoices,
    RunStatusChoices,
    AutomationNode,
    NodeTypeChoices,
    AutomationProjectAssociation,
)
from plane.app.permissions import allow_permission, ROLE
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.utils.exception_logger import log_exception
from plane.ee.bgtasks.automation_activity_task import automation_activity
from plane.db.models import Workspace


class AutomationEndpoint(BaseAPIView):
    use_read_replica = True

    def enhance_automation_data(self, automations: list[Automation], data: list[dict]) -> list[dict]:
        # get all automation runs for the automations
        runs = AutomationRun.objects.filter(automation__in=automations).values(
            "automation_id", "status", "started_at", "completed_at"
        )
        for automation in data:
            automation_runs = [run for run in runs if str(run.get("automation_id")) == str(automation.get("id"))]
            if automation_runs:
                automation["last_run_status"] = automation_runs[0].get("status")
                # Calculate average run time only for runs with both timestamps
                run_times = [
                    (run.get("completed_at") - run.get("started_at")).total_seconds()
                    for run in automation_runs
                    if run.get("completed_at") and run.get("started_at")
                ]
                automation["average_run_time"] = sum(run_times) / len(run_times) if run_times else 0

                automation["run_count"] = len(automation_runs)
                automation["total_success_count"] = sum(
                    1 for run in automation_runs if run.get("status") == RunStatusChoices.SUCCESS.value
                )
                automation["total_failed_count"] = sum(
                    1 for run in automation_runs if run.get("status") == RunStatusChoices.FAILED.value
                )
            else:
                automation["last_run_status"] = None
                automation["average_run_time"] = 0
                automation["run_count"] = 0
                automation["total_success_count"] = 0
                automation["total_failed_count"] = 0

        return data

    @check_feature_flag(FeatureFlag.PROJECT_AUTOMATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request: Request, slug: str, project_id: uuid.UUID, pk=None):
        if pk:
            automation = (
                Automation.objects.filter(
                    id=pk,
                    automation_projects__project_id=project_id,
                    workspace__slug=slug,
                    is_global=False,
                )
                .prefetch_related(
                    Prefetch(
                        "automation_projects",
                        queryset=AutomationProjectAssociation.objects.all(),
                        to_attr="project_associations",
                    )
                )
                .first()
            )
            if not automation:
                return Response({"error": "Automation not found"}, status=status.HTTP_404_NOT_FOUND)

            serializer = AutomationDetailReadSerializer(automation)
            return Response(serializer.data, status=status.HTTP_200_OK)
        automations = Automation.objects.filter(
            workspace__slug=slug,
            automation_projects__project_id=project_id,
            is_global=False,
        ).prefetch_related(
            Prefetch(
                "automation_projects",
                queryset=AutomationProjectAssociation.objects.all(),
                to_attr="project_associations",
            )
        )
        serializer = AutomationReadSerializer(automations, many=True)
        automation_data = self.enhance_automation_data(automations, serializer.data)
        return Response(automation_data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.PROJECT_AUTOMATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN])
    def post(self, request: Request, slug: str, project_id: uuid.UUID):
        data = request.data.copy()
        data["project_ids"] = [project_id]
        serializer = AutomationWriteSerializer(data=data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    serializer.save(project_id=project_id, is_global=False)
                    # Create a base version for the automation
                    version = serializer.instance.create_new_version()
                    serializer.instance.current_version = version
                    serializer.instance.save()
                    automation_activity.delay(
                        type="automation.activity.created",
                        requested_data=json.dumps(data, cls=DjangoJSONEncoder),
                        actor_id=str(request.user.id),
                        automation_id=str(serializer.instance.id),
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
        automation = (
            Automation.objects.filter(
                id=pk,
                automation_projects__project_id=project_id,
                workspace__slug=slug,
                is_global=False,
            )
            .prefetch_related(
                Prefetch(
                    "automation_projects",
                    queryset=AutomationProjectAssociation.objects.all(),
                    to_attr="project_associations",
                )
            )
            .first()
        )
        if not automation:
            return Response({"error": "Automation not found"}, status=status.HTTP_404_NOT_FOUND)
        current_instance = json.dumps(AutomationReadSerializer(automation).data, cls=DjangoJSONEncoder)
        data = request.data.copy()
        data["project_ids"] = [project_id]
        serializer = AutomationWriteSerializer(automation, data=data, partial=True)
        if serializer.is_valid():
            try:
                serializer.save(is_global=False)
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
                requested_data=json.dumps(data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                automation_id=str(pk),
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
            automation_projects__project_id=project_id,
            workspace__slug=slug,
            is_global=False,
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
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            slug=slug,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceAutomationsEndpoint(BaseAPIView):
    def enhance_automation_data(self, automations: list[Automation], data: list[dict]) -> list[dict]:
        # get all automation runs for the automations
        runs = AutomationRun.objects.filter(automation__in=automations).values(
            "automation_id", "status", "started_at", "completed_at"
        )
        for automation in data:
            automation_runs = [run for run in runs if str(run.get("automation_id")) == str(automation.get("id"))]
            if automation_runs:
                automation["last_run_status"] = automation_runs[0].get("status")
                # Calculate average run time only for runs with both timestamps
                run_times = [
                    (run.get("completed_at") - run.get("started_at")).total_seconds()
                    for run in automation_runs
                    if run.get("completed_at") and run.get("started_at")
                ]
                automation["average_run_time"] = sum(run_times) / len(run_times) if run_times else 0

                automation["run_count"] = len(automation_runs)
                automation["total_success_count"] = sum(
                    1 for run in automation_runs if run.get("status") == RunStatusChoices.SUCCESS.value
                )
                automation["total_failed_count"] = sum(
                    1 for run in automation_runs if run.get("status") == RunStatusChoices.FAILED.value
                )
            else:
                automation["last_run_status"] = None
                automation["average_run_time"] = 0
                automation["run_count"] = 0
                automation["total_success_count"] = 0
                automation["total_failed_count"] = 0

        return data

    @check_feature_flag(FeatureFlag.WORKSPACE_AUTOMATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request: Request, slug: str, pk=None):
        if pk:
            automation = (
                Automation.objects.filter(
                    id=pk,
                    workspace__slug=slug,
                )
                .prefetch_related(
                    Prefetch(
                        "automation_projects",
                        queryset=AutomationProjectAssociation.objects.all(),
                        to_attr="project_associations",
                    )
                )
                .first()
            )
            if not automation:
                return Response({"error": "Automation not found"}, status=status.HTTP_404_NOT_FOUND)

            serializer = AutomationDetailReadSerializer(automation)

            return Response(serializer.data, status=status.HTTP_200_OK)
        automations = Automation.objects.filter(
            workspace__slug=slug,
        ).prefetch_related(
            Prefetch(
                "automation_projects",
                queryset=AutomationProjectAssociation.objects.all(),
                to_attr="project_associations",
            )
        )
        serializer = AutomationReadSerializer(automations, many=True)
        automation_data = self.enhance_automation_data(automations, serializer.data)
        return Response(automation_data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_AUTOMATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request: Request, slug: str):
        workspace = Workspace.objects.get(slug=slug)
        serializer = AutomationWriteSerializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    serializer.save(workspace=workspace, is_global=True)
                    # Create a base version for the automation
                    version = serializer.instance.create_new_version()
                    serializer.instance.current_version = version
                    serializer.instance.save()
                    automation_activity.delay(
                        type="automation.activity.created",
                        requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                        actor_id=str(request.user.id),
                        automation_id=str(serializer.instance.id),
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

    @check_feature_flag(FeatureFlag.WORKSPACE_AUTOMATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request: Request, slug: str, pk: uuid.UUID):
        automation = (
            Automation.objects.filter(
                id=pk,
                workspace__slug=slug,
            )
            .prefetch_related(
                Prefetch(
                    "automation_projects",
                    queryset=AutomationProjectAssociation.objects.all(),
                    to_attr="project_associations",
                )
            )
            .first()
        )
        if not automation:
            return Response({"error": "Automation not found"}, status=status.HTTP_404_NOT_FOUND)
        current_instance = json.dumps(AutomationReadSerializer(automation).data, cls=DjangoJSONEncoder)
        serializer = AutomationWriteSerializer(automation, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                serializer.save(is_global=True)
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
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
                slug=slug,
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.WORKSPACE_AUTOMATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request: Request, slug: str, pk: uuid.UUID):
        automation = Automation.objects.get(
            id=pk,
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
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            slug=slug,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class AutomationStatusEndpoint(BaseAPIView):
    """
    This endpoint will be used to toggle the status of the automation`
    """

    use_read_replica = True

    @check_feature_flag(FeatureFlag.PROJECT_AUTOMATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN])
    def post(self, request, slug, project_id, pk: uuid.UUID):
        automation = Automation.objects.get(
            pk=pk, workspace__slug=slug, automation_projects__project_id=project_id, is_global=False
        )

        is_enabled = request.data.get("is_enabled")

        # check if trigger and action exist
        if is_enabled and not (
            AutomationNode.objects.filter(
                workspace__slug=slug,
                version=automation.current_version,
                node_type=NodeTypeChoices.ACTION,
            ).exists()
            and AutomationNode.objects.filter(
                workspace__slug=slug,
                version=automation.current_version,
                node_type=NodeTypeChoices.TRIGGER,
            ).exists()
        ):
            return Response(
                {"error": "Automation cannot be published since it does not contain a trigger and an action"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        automation.is_enabled = is_enabled
        automation.status = AutomationStatusChoices.PUBLISHED if is_enabled else AutomationStatusChoices.DISABLED
        automation.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceAutomationStatusEndpoint(BaseAPIView):
    """
    This endpoint will be used to toggle the status of the automation`
    """

    @check_feature_flag(FeatureFlag.WORKSPACE_AUTOMATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug, pk: uuid.UUID):
        automation = Automation.objects.get(pk=pk, workspace__slug=slug)

        is_enabled = request.data.get("is_enabled")

        # check if trigger and action exist
        if is_enabled and not (
            AutomationNode.objects.filter(
                workspace__slug=slug,
                version=automation.current_version,
                node_type=NodeTypeChoices.ACTION,
            ).exists()
            and AutomationNode.objects.filter(
                workspace__slug=slug,
                version=automation.current_version,
                node_type=NodeTypeChoices.TRIGGER,
            ).exists()
        ):
            return Response(
                {"error": "Automation cannot be published since it does not contain a trigger and an action"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        automation.is_enabled = is_enabled
        automation.status = AutomationStatusChoices.PUBLISHED if is_enabled else AutomationStatusChoices.DISABLED
        automation.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AutomationBaseEndpoint(BaseAPIView):
    use_read_replica = True

    def get_automation_version(self, automation_id: uuid.UUID):
        automation = Automation.objects.filter(
            id=automation_id,
            workspace__slug=self.kwargs["slug"],
        )
        # If project_id is present in kwargs, filter by project_id as well (for project automations)
        if self.kwargs.get("project_id"):
            automation = automation.get(is_global=False, automation_projects__project_id=self.kwargs["project_id"])
        else:
            automation = automation.get(is_global=True)
        return automation.current_version

    def get_workspace(self):
        return Workspace.objects.get(slug=self.kwargs["slug"])
