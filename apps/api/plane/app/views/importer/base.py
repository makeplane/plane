# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .. import BaseAPIView
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import ImportJobSerializer
from plane.bgtasks.jira_import_task import jira_import_task
from plane.db.models import ImportJob, Workspace
from plane.utils.jira import JiraClient, JiraError, map_priority, map_status_group


def _client_from_request(request):
    domain = request.data.get("domain")
    email = request.data.get("email")
    token = request.data.get("token")
    if not (domain and email and token):
        return None, Response(
            {"error": "domain, email and token are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return JiraClient(domain, email, token), None


class JiraConnectEndpoint(BaseAPIView):
    """Verify Jira credentials."""

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        client, error = _client_from_request(request)
        if error:
            return error
        ok, message = client.test_connection()
        if ok:
            return Response({"is_connected": True, "user": message}, status=status.HTTP_200_OK)
        return Response({"is_connected": False, "error": message}, status=status.HTTP_400_BAD_REQUEST)


class JiraBoardsEndpoint(BaseAPIView):
    """List Jira boards available to the credentials."""

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        client, error = _client_from_request(request)
        if error:
            return error
        try:
            boards = client.boards()
        except JiraError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        result = [
            {
                "id": board.get("id"),
                "name": board.get("name"),
                "type": board.get("type"),
                "project_key": (board.get("location") or {}).get("projectKey"),
                "project_name": (board.get("location") or {}).get("projectName"),
            }
            for board in boards
        ]
        return Response(result, status=status.HTTP_200_OK)


class JiraMetadataEndpoint(BaseAPIView):
    """Return the data needed to configure an import: statuses, priorities,
    users, sprints and issue count for a board."""

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        client, error = _client_from_request(request)
        if error:
            return error
        board_id = request.data.get("board_id")
        if not board_id:
            return Response({"error": "board_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            board = client.board(board_id)
            project_key = (board.get("location") or {}).get("projectKey")
            if not project_key:
                projects = client.board_projects(board_id)
                project_key = projects[0].get("key") if projects else None
            if not project_key:
                return Response({"error": "No Jira project found for this board"}, status=status.HTTP_400_BAD_REQUEST)

            statuses = {}
            for issue_type in client.project_statuses(project_key):
                for st in issue_type.get("statuses", []):
                    statuses[st["id"]] = {
                        "id": st["id"],
                        "name": st["name"],
                        "suggested_group": map_status_group((st.get("statusCategory") or {}).get("key")),
                    }
            priorities = [
                {"id": p.get("id"), "name": p.get("name"), "suggested_priority": map_priority(p.get("name"))}
                for p in client.priorities()
            ]
            users = [
                {
                    "account_id": u.get("accountId"),
                    "display_name": u.get("displayName"),
                    "email": u.get("emailAddress"),
                }
                for u in client.assignable_users(project_key)
            ]
            sprints = [
                {"id": s.get("id"), "name": s.get("name"), "state": s.get("state")}
                for s in client.sprints(board_id)
            ]
            issue_count = client.issue_count(f'project = "{project_key}"')
        except JiraError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "project_key": project_key,
                "statuses": list(statuses.values()),
                "priorities": priorities,
                "users": users,
                "sprints": sprints,
                "issue_count": issue_count,
            },
            status=status.HTTP_200_OK,
        )


class ImportJobEndpoint(BaseAPIView):
    """List import jobs and create (enqueue) a new one."""

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        jobs = ImportJob.objects.filter(workspace__slug=slug).select_related("workspace", "initiated_by")
        if request.GET.get("per_page", False) and request.GET.get("cursor", False):
            return self.paginate(
                order_by=request.GET.get("order_by", "-created_at"),
                request=request,
                queryset=jobs,
                on_results=lambda results: ImportJobSerializer(results, many=True).data,
            )
        return Response(ImportJobSerializer(jobs, many=True).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        domain = request.data.get("domain")
        email = request.data.get("email")
        token = request.data.get("token")
        board_id = request.data.get("board_id")
        if not (domain and email and token and board_id):
            return Response(
                {"error": "domain, email, token and board_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        config = {
            "domain": domain,
            "email": email,
            "token": token,
            "board_id": board_id,
            "target": request.data.get("target", {"type": "new"}),
            "user_import": request.data.get("user_import", "invite"),
            "state_map": request.data.get("state_map", {}),
            "priority_map": request.data.get("priority_map", {}),
            "auto_create_states": request.data.get("auto_create_states", True),
            "flags": request.data.get("flags", {}),
        }
        job = ImportJob.objects.create(
            workspace=workspace,
            source="jira",
            initiated_by=request.user,
            config=config,
            external_id=str(board_id),
        )
        jira_import_task.delay(job_id=str(job.id))
        return Response(ImportJobSerializer(job).data, status=status.HTTP_201_CREATED)


class ImportJobReRunEndpoint(BaseAPIView):
    """Re-run an import (incremental, idempotent). Requires a fresh token since
    credentials are scrubbed when a job completes."""

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug, pk):
        job = ImportJob.objects.get(pk=pk, workspace__slug=slug)
        token = request.data.get("token") or (job.config or {}).get("token")
        if not token:
            return Response(
                {"error": "A Jira API token is required to re-run this import"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        config = job.config or {}
        config["token"] = token
        if request.data.get("email"):
            config["email"] = request.data.get("email")
        job.config = config
        job.status = "queued"
        job.reason = ""
        job.save(update_fields=["config", "status", "reason"])
        jira_import_task.delay(job_id=str(job.id))
        return Response(ImportJobSerializer(job).data, status=status.HTTP_200_OK)
