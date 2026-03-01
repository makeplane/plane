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

from rest_framework.response import Response
from rest_framework import status

from plane.api.views.base import BaseViewSet
from plane.agents.models import AgentRun
from plane.agents.serializers.api import AgentRunAPISerializer
from plane.app.permissions import WorkSpaceAdminPermission
from plane.db.models import Workspace, BotTypeEnum, User, IssueComment
from plane.authentication.models.oauth import Application

from plane.authentication.permissions.oauth import TokenHasScopeIfOAuth
from plane.utils.oauth import READ_SCOPE, WRITE_SCOPE, AGENT_RUNS_READ_SCOPE, AGENT_RUNS_WRITE_SCOPE


class AgentRunAPIViewSet(BaseViewSet):
    serializer_class = AgentRunAPISerializer
    model = AgentRun
    permission_classes = [WorkSpaceAdminPermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [AGENT_RUNS_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [AGENT_RUNS_WRITE_SCOPE]],
        "PUT": [[WRITE_SCOPE], [AGENT_RUNS_WRITE_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [AGENT_RUNS_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [AGENT_RUNS_WRITE_SCOPE]],
    }

    def get_queryset(self):
        queryset = super().get_queryset().filter(workspace__slug=self.kwargs.get("slug"))
        return self.filter_queryset(queryset)

    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        agent_slug = request.data.get("agent_slug")
        comment_id = request.data.get("comment")

        if not comment_id:
            return Response({"error": "comment is required"}, status=status.HTTP_400_BAD_REQUEST)

        if comment_id:
            comment = IssueComment.objects.get(id=comment_id, workspace=workspace)
            if not comment:
                return Response({"error": "Comment not found"}, status=status.HTTP_404_NOT_FOUND)
            elif comment.parent:
                return Response(
                    {"error": "Comment is a reply and cannot be part of an agent run"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            else:
                agent_run = comment.comment_agent_runs.first()
                if agent_run:
                    return Response(
                        {"error": "Comment is already part of an agent run"}, status=status.HTTP_400_BAD_REQUEST
                    )

        if not agent_slug:
            return Response({"error": "Agent slug is required"}, status=status.HTTP_400_BAD_REQUEST)

        agent_user = User.objects.get(
            username=f"{workspace.slug}_{agent_slug}_bot", is_bot=True, bot_type=BotTypeEnum.APP_BOT
        )
        agent_application = Application.objects.filter(slug=agent_slug).first()
        if not agent_user or not agent_application or not agent_application.is_mentionable:
            return Response({"error": "Agent not found"}, status=status.HTTP_404_NOT_FOUND)

        comment = IssueComment.objects.get(id=comment_id, workspace=workspace) if comment_id else None

        serializer = self.get_serializer(
            data=request.data,
            context={
                "workspace": workspace,
                "agent_user": agent_user,
                "comment": comment,
                "source_comment": comment,
                "issue": comment.issue,
                "project": comment.project,
                "creator": request.user,
            },
        )
        if serializer.is_valid():
            serializer.save(workspace_id=workspace.id, creator_id=request.user.id, agent_user_id=agent_user.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, slug, pk):
        run = self.get_queryset().get(id=pk)
        if not run:
            return Response({"error": "Run not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(run, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)
