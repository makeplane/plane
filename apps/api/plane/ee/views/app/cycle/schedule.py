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

import uuid
from django.contrib.auth.hashers import make_password

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.models import CycleSettings
from plane.db.models import BotTypeEnum, User, Workspace, WorkspaceMember, ProjectMember
from plane.ee.views.base import BaseViewSet
from plane.ee.serializers import AutomatedCycleSerializer
from plane.ee.bgtasks.cycle_automation_task import backfill_automated_cycles
from plane.app.permissions import allow_permission, ROLE
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class AutomatedCycleViewSet(BaseViewSet):
    use_read_replica = True

    serializer_class = AutomatedCycleSerializer
    model = CycleSettings

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
        )

    @allow_permission([ROLE.ADMIN])
    @check_feature_flag(FeatureFlag.AUTO_SCHEDULE_CYCLES)
    def list(self, request, slug, project_id):
        automated_cycle = self.get_queryset().first()
        if automated_cycle is None:
            return Response({}, status=status.HTTP_200_OK)
        serializer = AutomatedCycleSerializer(automated_cycle)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    @check_feature_flag(FeatureFlag.AUTO_SCHEDULE_CYCLES)
    def create(self, request, slug, project_id):
        # check if the automation already exists
        if CycleSettings.objects.filter(project_id=project_id, workspace__slug=slug).exists():
            return Response(
                {"error": "Automated cycle already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cycle_automation_bot = ProjectMember.objects.filter(
            project_id=project_id, member__bot_type=BotTypeEnum.CYCLE_AUTOMATION_BOT
        ).first()
        if not cycle_automation_bot:
            # Create a automation bot
            cycle_automation_bot = User.objects.create(
                username=f"cycle-automation-bot-{uuid.uuid4().hex}",
                display_name="Cycle Automation Bot",
                first_name="Cycle Automation",
                last_name="Bot",
                is_bot=True,
                bot_type=BotTypeEnum.CYCLE_AUTOMATION_BOT,
                email=f"cycle-automation-bot-{uuid.uuid4().hex}@plane.so",
                password=make_password(uuid.uuid4().hex),
                is_password_autoset=True,
            )

            workspace_id = Workspace.objects.get(slug=slug).id
            # Add user to the workspace
            WorkspaceMember.objects.create(
                member_id=cycle_automation_bot.id,
                workspace_id=workspace_id,
                role=ROLE.ADMIN.value,
                is_active=True,
            )

            # add the user to the project
            ProjectMember.objects.create(
                project_id=project_id,
                workspace_id=workspace_id,
                member_id=cycle_automation_bot.id,
                role=ROLE.ADMIN.value,
                is_active=True,
            )

        serializer = AutomatedCycleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id)
            # when ever some one tries to schedule a cycle, we will schedule the first cycle
            backfill_automated_cycles.delay(
                automated_cycle_id=str(serializer.instance.id),
                project_id=str(project_id),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN])
    @check_feature_flag(FeatureFlag.AUTO_SCHEDULE_CYCLES)
    def partial_update(self, request, slug, project_id):
        automated_cycle = CycleSettings.objects.filter(project_id=project_id, workspace__slug=slug).first()
        if not automated_cycle:
            return Response(
                {"error": "Automated cycle not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AutomatedCycleSerializer(automated_cycle, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            backfill_automated_cycles.delay(
                automated_cycle_id=str(serializer.instance.id),
                project_id=str(project_id),
            )

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
