# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import hmac
import os

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Issue, IssueGitLabMeta, Project, ProjectGitLabConfig, State
from plane.utils.gitlab_sync import (
    get_or_create_project_gitlab_config,
    handle_merge_request_event,
    handle_push_event,
    serialize_gitlab_meta,
)


def _webhook_secret_ok(request) -> bool:
    expected = os.environ.get("GITLAB_WEBHOOK_SECRET", "")
    if not expected:
        return False
    provided = request.headers.get("X-Gitlab-Token", "") or ""
    # compare_digest raises ValueError when lengths differ — treat as invalid token.
    if len(provided) != len(expected):
        return False
    return hmac.compare_digest(provided, expected)


class GitLabWebhookEndpoint(APIView):
    """Inbound GitLab webhook (Merge Request + Push events).

    Configure in GitLab:
      URL: https://<plane-api>/api/hooks/gitlab/<workspace-slug>/
      Secret token: value of GITLAB_WEBHOOK_SECRET
      Triggers: Merge request events, Push events
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, slug):
        if not _webhook_secret_ok(request):
            return Response({"error": "Invalid webhook token"}, status=status.HTTP_401_UNAUTHORIZED)

        event = request.headers.get("X-Gitlab-Event", "")
        payload = request.data if isinstance(request.data, dict) else {}

        if event == "Merge Request Hook":
            result = handle_merge_request_event(slug, payload)
            return Response(result, status=status.HTTP_200_OK)

        if event == "Push Hook":
            result = handle_push_event(slug, payload)
            return Response(result, status=status.HTTP_200_OK)

        return Response({"ignored": True, "event": event}, status=status.HTTP_200_OK)


class ProjectGitLabConfigEndpoint(BaseAPIView):
    """Read/update per-project merge transition states."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        config = ProjectGitLabConfig.objects.filter(
            project_id=project_id, workspace__slug=slug, deleted_at__isnull=True
        ).first()
        return Response(
            {
                "merge_from_state_id": str(config.merge_from_state_id) if config and config.merge_from_state_id else None,
                "merge_to_state_id": str(config.merge_to_state_id) if config and config.merge_to_state_id else None,
                "webhook_url": f"/api/hooks/gitlab/{slug}/",
            },
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN])
    def patch(self, request, slug, project_id):
        project = Project.objects.filter(pk=project_id, workspace__slug=slug).first()
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        merge_from_state_id = request.data.get("merge_from_state_id", "__unset__")
        merge_to_state_id = request.data.get("merge_to_state_id", "__unset__")

        config = get_or_create_project_gitlab_config(project)

        update_fields = ["updated_at"]

        if merge_from_state_id != "__unset__":
            if merge_from_state_id in (None, ""):
                config.merge_from_state = None
            else:
                state = State.objects.filter(pk=merge_from_state_id, project_id=project_id).first()
                if not state:
                    return Response({"error": "Invalid merge_from_state_id"}, status=status.HTTP_400_BAD_REQUEST)
                config.merge_from_state = state
            update_fields.append("merge_from_state")

        if merge_to_state_id != "__unset__":
            if merge_to_state_id in (None, ""):
                config.merge_to_state = None
            else:
                state = State.objects.filter(pk=merge_to_state_id, project_id=project_id).first()
                if not state:
                    return Response({"error": "Invalid merge_to_state_id"}, status=status.HTTP_400_BAD_REQUEST)
                config.merge_to_state = state
            update_fields.append("merge_to_state")

        config.save(update_fields=update_fields)

        return Response(
            {
                "merge_from_state_id": str(config.merge_from_state_id) if config.merge_from_state_id else None,
                "merge_to_state_id": str(config.merge_to_state_id) if config.merge_to_state_id else None,
                "webhook_url": f"/api/hooks/gitlab/{slug}/",
            },
            status=status.HTTP_200_OK,
        )


class IssueGitLabMetaEndpoint(BaseAPIView):
    """Read GitLab MR status + commit count for a work item."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id):
        issue = Issue.issue_objects.filter(
            pk=issue_id, project_id=project_id, workspace__slug=slug
        ).first()
        if not issue:
            return Response({"error": "Issue not found"}, status=status.HTTP_404_NOT_FOUND)

        meta = IssueGitLabMeta.objects.filter(issue_id=issue_id, deleted_at__isnull=True).first()
        return Response(serialize_gitlab_meta(meta), status=status.HTTP_200_OK)
