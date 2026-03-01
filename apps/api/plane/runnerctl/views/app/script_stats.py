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

from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from plane.app.permissions import WorkSpaceAdminPermission
from plane.authentication.session import BaseSessionAuthentication
from plane.db.models import Workspace

from ...models import Script, ScriptExecution


class ScriptStatsView(APIView):
    """Get execution statistics for a script"""
    authentication_classes = [BaseSessionAuthentication]
    permission_classes = [WorkSpaceAdminPermission]

    @property
    def workspace_slug(self):
        return self.kwargs.get("slug")

    def get(self, request, slug, script_id):
        workspace = get_object_or_404(Workspace, slug=self.workspace_slug)
        script = get_object_or_404(Script, id=script_id, workspace=workspace)

        # Get all execution statistics for this script
        executions = ScriptExecution.objects.filter(script=script)

        total_executions = executions.count()
        success_count = executions.filter(status="completed").count()
        failure_count = executions.filter(status="errored").count()

        # Count by trigger type
        test_count = executions.filter(trigger_type="test").count()
        manual_count = executions.filter(trigger_type="manual").count()
        automation_count = executions.filter(trigger_type="automation").count()

        success_rate = (success_count / total_executions * 100) if total_executions > 0 else 0

        last_execution = executions.order_by("-created_at").first()
        last_execution_data = None
        if last_execution:
            last_execution_data = {
                "id": str(last_execution.id),
                "status": last_execution.status,
                "trigger_type": last_execution.trigger_type,
                "executed_at": last_execution.created_at.isoformat() if last_execution.created_at else None,
            }

        return Response({
            "total_executions": total_executions,
            "success_count": success_count,
            "failure_count": failure_count,
            "success_rate": round(success_rate, 1),
            "by_trigger_type": {
                "test": test_count,
                "manual": manual_count,
                "automation": automation_count,
            },
            "last_execution": last_execution_data,
        })
