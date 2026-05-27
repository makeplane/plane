"""V1 endpoints silo calls back into Django on.

Mounted under `/api/v1/` (see plane/urls.py → plane/api/urls). All
endpoints are workspace-scoped via the `<slug>` URL kwarg. Path names
match what silo's bundled client expects:

  /api/v1/workspaces/<slug>/workspace-credentials/
  /api/v1/workspaces/<slug>/workspace-credentials/<id>/
  /api/v1/workspaces/<slug>/workspace-credentials/token-verify/
  /api/v1/workspaces/<slug>/workspace-connections/
  /api/v1/workspaces/<slug>/workspace-connections/<id>/
  /api/v1/workspaces/<slug>/workspace-user-connections/
  /api/v1/workspaces/<slug>/workspace-user-connections/<id>/
  /api/v1/workspaces/<slug>/workspace-entity-connections/
  /api/v1/workspaces/<slug>/workspace-entity-connections/<id>/

Permission policy:
- Workspace ADMIN may write (POST/PATCH/DELETE) on workspace-level
  resources (credentials, connections, entity-connections).
- Any workspace member (ADMIN/MEMBER/GUEST) may read.
- Personal user-connections: only the owning user may write/delete
  their own rows; admins may delete any.
- Tokens are write-only on serializer output so they don't leak via
  list calls. silo stores them on POST and uses them server-side.
"""

from datetime import timedelta

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.app.views.base import BaseAPIView
from plane.app.permissions import ROLE, allow_permission
from plane.db.models import Workspace, WorkspaceMember

from .auth import IsSiloAuthenticated, SiloHMACAuthentication

from .models import (
    WorkspaceConnection,
    WorkspaceCredential,
    WorkspaceEntityConnection,
    WorkspaceUserConnection,
)
from .serializers import (
    WorkspaceConnectionSerializer,
    WorkspaceCredentialSerializer,
    WorkspaceEntityConnectionSerializer,
    WorkspaceUserConnectionSerializer,
)


def _workspace(slug):
    return get_object_or_404(Workspace, slug=slug)


# -- silo HMAC ping --------------------------------------------------------


class SiloPingEndpoint(BaseAPIView):
    """Liveness check for the silo↔Django HMAC channel.

    Bypasses APIKeyAuthentication / IsAuthenticated. Only callers that
    sign with SILO_HMAC_SECRET_KEY can reach this endpoint, so a 200
    proves the shared secret + signing scheme match end-to-end.
    """

    authentication_classes = [SiloHMACAuthentication]
    permission_classes = [IsSiloAuthenticated]

    def get(self, request):
        return Response({"ok": True, "principal": "silo"})


class SiloSlackInstallEndpoint(BaseAPIView):
    """Persist a Slack workspace install completed by silo.

    Silo handles the OAuth dance and posts the resulting team token
    here. Idempotent on (workspace, source='slack', source_identifier
    = slack team id) for the credential and (workspace,
    connection_type='slack', connection_id=team id) for the
    connection.
    """

    authentication_classes = [SiloHMACAuthentication]
    permission_classes = [IsSiloAuthenticated]

    def post(self, request):
        from plane.db.models import User

        data = request.data or {}
        slug = data.get("workspace_slug")
        team_id = data.get("team_id")
        team_name = data.get("team_name") or ""
        bot_user_id = data.get("bot_user_id") or ""
        access_token = data.get("access_token")
        refresh_token = data.get("refresh_token") or ""
        expires_in = data.get("expires_in")
        scope = data.get("scope") or ""
        installer_user_id = data.get("installer_user_id")
        if not (slug and team_id and access_token and installer_user_id):
            return Response(
                {"detail": "workspace_slug, team_id, access_token, installer_user_id required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ws = get_object_or_404(Workspace, slug=slug)
        installer = get_object_or_404(User, pk=installer_user_id)

        expires_at = None
        if isinstance(expires_in, (int, float)) and expires_in > 0:
            expires_at = timezone.now() + timedelta(seconds=int(expires_in))

        cred, _ = WorkspaceCredential.objects.update_or_create(
            workspace=ws,
            source="slack",
            source_identifier=team_id,
            defaults={
                "user": installer,
                "source_access_token": access_token,
                "source_refresh_token": refresh_token,
                "source_token_expires_at": expires_at,
                "source_authorization_type": (
                    "OAUTH_ROTATING" if refresh_token else "OAUTH"
                ),
                "is_pat": False,
                "is_active": True,
            },
        )
        conn, _ = WorkspaceConnection.objects.update_or_create(
            workspace=ws,
            connection_type="slack",
            connection_id=team_id,
            defaults={
                "credential": cred,
                "connection_slug": team_name,
                "connection_data": {"bot_user_id": bot_user_id, "team_name": team_name},
                "scopes": [s for s in scope.split(",") if s],
                "config": {},
            },
        )
        return Response(
            {
                "credential_id": str(cred.id),
                "connection_id": str(conn.id),
            },
            status=status.HTTP_200_OK,
        )


class SiloSlackTeamContextEndpoint(BaseAPIView):
    """Resolve a Slack team_id to the Plane workspace and projects.

    Silo calls this when handling slash commands / interactivity to
    open a modal. Returns the bot token (so silo can call Slack APIs)
    plus the project list (so the modal can show a project picker).

    Tokens are HMAC-gated to silo only and never leave the server-to-
    server channel.
    """

    authentication_classes = [SiloHMACAuthentication]
    permission_classes = [IsSiloAuthenticated]

    def post(self, request):
        from plane.db.models import Project

        team_id = (request.data or {}).get("team_id")
        if not team_id:
            return Response(
                {"detail": "team_id required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        conn = (
            WorkspaceConnection.objects.select_related("workspace", "credential")
            .filter(connection_type="slack", connection_id=team_id)
            .first()
        )
        if not conn:
            return Response(
                {"detail": "no Slack connection for that team_id"},
                status=status.HTTP_404_NOT_FOUND,
            )

        ws = conn.workspace
        projects = list(
            Project.objects.filter(workspace=ws)
            .order_by("name")
            .values("id", "name", "identifier")
        )
        return Response(
            {
                "workspace_id": str(ws.id),
                "workspace_slug": ws.slug,
                "workspace_name": ws.name,
                "bot_token": conn.credential.source_access_token if conn.credential else None,
                "refresh_token": conn.credential.source_refresh_token if conn.credential else None,
                "token_expires_at": (
                    conn.credential.source_token_expires_at.isoformat()
                    if conn.credential and conn.credential.source_token_expires_at
                    else None
                ),
                "bot_user_id": (conn.connection_data or {}).get("bot_user_id", ""),
                "installer_user_id": (
                    str(conn.credential.user_id) if conn.credential and conn.credential.user_id else None
                ),
                "projects": [
                    {"id": str(p["id"]), "name": p["name"], "identifier": p["identifier"]}
                    for p in projects
                ],
            }
        )


class SiloSlackPersistTokensEndpoint(BaseAPIView):
    """Persist a refreshed Slack bot token pair from silo.

    Silo handles the `oauth.v2.access` refresh call (it owns the
    Slack client_secret), then sends the new pair here for storage.
    Idempotent on (workspace, source='slack', source_identifier=team_id).
    """

    authentication_classes = [SiloHMACAuthentication]
    permission_classes = [IsSiloAuthenticated]

    def post(self, request):
        data = request.data or {}
        team_id = data.get("team_id")
        access_token = data.get("access_token")
        refresh_token = data.get("refresh_token") or ""
        expires_in = data.get("expires_in")

        if not (team_id and access_token):
            return Response(
                {"detail": "team_id and access_token required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cred = WorkspaceCredential.objects.filter(
            source="slack", source_identifier=team_id
        ).first()
        if not cred:
            return Response(
                {"detail": "no Slack credential for that team_id"},
                status=status.HTTP_404_NOT_FOUND,
            )

        cred.source_access_token = access_token
        if refresh_token:
            cred.source_refresh_token = refresh_token
        if isinstance(expires_in, (int, float)) and expires_in > 0:
            cred.source_token_expires_at = timezone.now() + timedelta(seconds=int(expires_in))
        cred.save(
            update_fields=[
                "source_access_token",
                "source_refresh_token",
                "source_token_expires_at",
                "updated_at",
            ]
        )
        return Response({"ok": True}, status=status.HTTP_200_OK)


class SiloSlackUserConnectEndpoint(BaseAPIView):
    """Persist a per-user Slack ↔ Plane mapping completed by silo.

    Silo handles the user-scope OAuth dance and posts the resulting
    Slack user_id here for storage. The mapping is keyed on
    (workspace, user, connection_type='slack'). We do NOT store the
    user-scope access token — silo never needs to call Slack as the
    user; the binding is purely for attribution (Slack user_id ->
    Plane user when creating work items, mirroring comments, etc.).
    """

    authentication_classes = [SiloHMACAuthentication]
    permission_classes = [IsSiloAuthenticated]

    def post(self, request):
        from plane.db.models import User

        data = request.data or {}
        slug = data.get("workspace_slug")
        plane_user_id = data.get("plane_user_id")
        slack_team_id = data.get("slack_team_id")
        slack_user_id = data.get("slack_user_id")
        slack_user_email = data.get("slack_user_email") or ""

        if not (slug and plane_user_id and slack_team_id and slack_user_id):
            return Response(
                {"detail": "workspace_slug, plane_user_id, slack_team_id, slack_user_id required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ws = get_object_or_404(Workspace, slug=slug)
        user = get_object_or_404(User, pk=plane_user_id)

        # Reuse the workspace-level Slack credential — there is no
        # per-user token to keep separate.
        cred = (
            WorkspaceCredential.objects.filter(
                workspace=ws, source="slack", source_identifier=slack_team_id
            )
            .first()
        )
        if not cred:
            return Response(
                {"detail": "Slack workspace not connected; install workspace-level first"},
                status=status.HTTP_404_NOT_FOUND,
            )

        conn, created = WorkspaceUserConnection.objects.update_or_create(
            workspace=ws,
            user=user,
            connection_type="slack",
            defaults={
                "credential": cred,
                "connection_id": slack_user_id,
                "connection_data": {
                    "slack_team_id": slack_team_id,
                    "slack_user_email": slack_user_email,
                },
                "scopes": [],
                "config": {},
            },
        )
        return Response(
            {"id": str(conn.id), "created": created},
            status=status.HTTP_200_OK,
        )


class SiloCreateCommentEndpoint(BaseAPIView):
    """Create an IssueComment on behalf of silo (e.g. Slack Reply button).

    Same actor-resolution rules as SiloCreateWorkItemEndpoint:
    explicit actor_user_id → slack_user_id mapping → installer fallback.
    """

    authentication_classes = [SiloHMACAuthentication]
    permission_classes = [IsSiloAuthenticated]

    def post(self, request):
        from bs4 import BeautifulSoup
        from plane.db.models import Issue, IssueComment, Project, User

        data = request.data or {}
        slug = data.get("workspace_slug")
        project_id = data.get("project_id")
        issue_id = data.get("issue_id")
        comment_html = (data.get("comment_html") or "").strip()
        actor_id = data.get("actor_user_id")
        slack_user_id = data.get("slack_user_id")
        slack_team_id = data.get("slack_team_id")

        if not (slug and project_id and issue_id and comment_html):
            return Response(
                {"detail": "workspace_slug, project_id, issue_id, comment_html required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ws = get_object_or_404(Workspace, slug=slug)
        project = get_object_or_404(Project, pk=project_id, workspace=ws)
        issue = get_object_or_404(Issue, pk=issue_id, project=project)

        # Same actor resolution as create-work-item.
        actor = None
        if actor_id:
            actor = User.objects.filter(pk=actor_id).first()
        if not actor and slack_user_id:
            uc = (
                WorkspaceUserConnection.objects.filter(
                    workspace=ws,
                    connection_type="slack",
                    connection_id=slack_user_id,
                )
                .select_related("user")
                .first()
            )
            if uc:
                actor = uc.user
        if not actor and slack_team_id:
            cred = WorkspaceCredential.objects.filter(
                workspace=ws, source="slack", source_identifier=slack_team_id
            ).first()
            if cred:
                actor = cred.user
        if not actor:
            return Response(
                {"detail": "could not resolve actor"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comment_stripped = BeautifulSoup(comment_html, "html.parser").get_text(separator="\n").strip()

        comment = IssueComment.objects.create(
            issue=issue,
            project=project,
            workspace=ws,
            actor=actor,
            comment_html=comment_html,
            comment_stripped=comment_stripped,
        )
        # BaseModel.save clobbered created_by — fix it.
        IssueComment.objects.filter(pk=comment.id).update(created_by_id=actor.id, actor_id=actor.id)

        # Fire activity so silo notification fan-out runs.
        from plane.bgtasks.issue_activities_task import issue_activity
        import json as _json
        from django.utils import timezone as _tz

        try:
            issue_activity.delay(
                type="comment.activity.created",
                requested_data=_json.dumps({"comment_html": comment_html}),
                actor_id=str(actor.id),
                issue_id=str(issue.id),
                project_id=str(project.id),
                current_instance=_json.dumps({"id": str(comment.id)}),
                epoch=int(_tz.now().timestamp()),
            )
        except Exception:
            pass

        return Response(
            {"id": str(comment.id)},
            status=status.HTTP_201_CREATED,
        )


class SiloProjectMappingsEndpoint(BaseAPIView):
    """List entity-connection mappings for a project (silo-internal).

    Mirrors `WorkspaceEntityConnectionListCreateEndpoint`'s GET but
    over the silo HMAC channel — used by silo when fanning out
    work-item events to bound channels. Filters by project_id +
    type (e.g. 'slack-channel-notification').
    """

    authentication_classes = [SiloHMACAuthentication]
    permission_classes = [IsSiloAuthenticated]

    def post(self, request):
        data = request.data or {}
        slug = data.get("workspace_slug")
        project_id = data.get("project_id")
        mapping_type = data.get("type")

        if not (slug and project_id):
            return Response(
                {"detail": "workspace_slug and project_id required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ws = get_object_or_404(Workspace, slug=slug)
        qs = WorkspaceEntityConnection.objects.filter(workspace=ws, project_id=project_id)
        if mapping_type:
            qs = qs.filter(type=mapping_type)

        # Also fetch the workspace_connection for slack-channel mappings
        # so silo gets the team_id without a second roundtrip.
        out = []
        for m in qs.select_related("workspace_connection"):
            wc = m.workspace_connection
            out.append(
                {
                    "id": str(m.id),
                    "workspace_connection_id": str(wc.id),
                    "connection_type": wc.connection_type,
                    "connection_team_id": wc.connection_id,
                    "project_id": str(m.project_id) if m.project_id else None,
                    "type": m.type,
                    "entity_type": m.entity_type,
                    "entity_id": m.entity_id,
                    "entity_slug": m.entity_slug,
                    "config": m.config or {},
                }
            )
        return Response({"mappings": out})


class SiloWorkItemLookupEndpoint(BaseAPIView):
    """Resolve a Plane work-item URL to its display fields.

    Used by silo's `link_shared` Events handler to build an unfurl
    card. Silo parses the URL on its side; we just take the parsed
    pieces and look up the issue.
    """

    authentication_classes = [SiloHMACAuthentication]
    permission_classes = [IsSiloAuthenticated]

    def post(self, request):
        from plane.db.models import Project, Issue, State

        data = request.data or {}
        slug = data.get("workspace_slug")
        project_id = data.get("project_id")
        sequence_id = data.get("sequence_id")
        issue_id = data.get("issue_id")

        if not slug or not project_id or (not sequence_id and not issue_id):
            return Response(
                {"detail": "workspace_slug, project_id, and one of sequence_id/issue_id required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ws = get_object_or_404(Workspace, slug=slug)
        project = get_object_or_404(Project, pk=project_id, workspace=ws)

        qs = Issue.objects.filter(workspace=ws, project=project)
        if issue_id:
            qs = qs.filter(pk=issue_id)
        else:
            qs = qs.filter(sequence_id=int(sequence_id))
        issue = qs.select_related("state").first()
        if not issue:
            return Response({"detail": "not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(
            {
                "id": str(issue.id),
                "sequence_id": issue.sequence_id,
                "name": issue.name,
                "project_identifier": project.identifier,
                "state_name": issue.state.name if issue.state_id else None,
                "state_group": issue.state.group if issue.state_id else None,
                "priority": issue.priority,
                "workspace_slug": slug,
                "project_id": str(project.id),
            }
        )


class SiloCreateWorkItemEndpoint(BaseAPIView):
    """Create a Plane work item on behalf of silo.

    Used by the Slack `/plane` modal submit (and later GitHub label
    automation). Silo passes the workspace slug, project id, title,
    optional description, and the user-id to attribute the create to
    (resolved via the Slack user → Plane user mapping; falls back to
    the integration installer).
    """

    authentication_classes = [SiloHMACAuthentication]
    permission_classes = [IsSiloAuthenticated]

    def post(self, request):
        from plane.api.serializers import IssueSerializer
        from plane.db.models import Project, Issue, User

        data = request.data or {}
        slug = data.get("workspace_slug")
        project_id = data.get("project_id")
        title = (data.get("title") or "").strip()
        description = data.get("description") or ""
        actor_id = data.get("actor_user_id")
        slack_user_id = data.get("slack_user_id")
        slack_team_id = data.get("slack_team_id")

        if not (slug and project_id and title):
            return Response(
                {"detail": "workspace_slug, project_id, title required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ws = get_object_or_404(Workspace, slug=slug)
        project = get_object_or_404(Project, pk=project_id, workspace=ws)

        # Actor resolution priority:
        #   1. Explicit actor_user_id (caller-specified Plane user).
        #   2. Slack user_id → WorkspaceUserConnection → Plane user.
        #   3. Fall back to the integration installer
        #      (workspace-level credential's user).
        actor = None
        if actor_id:
            actor = User.objects.filter(pk=actor_id).first()
        if not actor and slack_user_id:
            uc = (
                WorkspaceUserConnection.objects.filter(
                    workspace=ws,
                    connection_type="slack",
                    connection_id=slack_user_id,
                )
                .select_related("user")
                .first()
            )
            if uc:
                actor = uc.user
        if not actor and slack_team_id:
            cred = WorkspaceCredential.objects.filter(
                workspace=ws, source="slack", source_identifier=slack_team_id
            ).first()
            if cred:
                actor = cred.user
        if not actor:
            return Response(
                {"detail": "could not resolve actor; provide actor_user_id or slack_user_id"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = IssueSerializer(
            data={
                "name": title[:255],
                "description_html": f"<p>{description}</p>" if description else "<p></p>",
            },
            context={
                "project_id": str(project.id),
                "workspace_id": str(ws.id),
                "default_assignee_id": project.default_assignee_id,
            },
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()

        # BaseModel.save() looks up the current user via crum and would
        # clobber created_by back to None for silo (anonymous principal).
        # Use queryset .update() to bypass model save entirely.
        Issue.objects.filter(pk=serializer.data["id"]).update(created_by_id=actor.id)
        issue = Issue.objects.get(pk=serializer.data["id"])

        # Fire the same activity hook as the public IssueListCreate
        # endpoint so downstream listeners (the silo Slack-notification
        # fan-out, in particular) see the create event.
        from plane.bgtasks.issue_activities_task import issue_activity
        import json as _json
        from django.utils import timezone as _tz

        try:
            issue_activity.delay(
                type="issue.activity.created",
                requested_data=_json.dumps(
                    {"name": issue.name, "description_html": issue.description_html or ""}
                ),
                actor_id=str(actor.id),
                issue_id=str(issue.id),
                project_id=str(project.id),
                current_instance=None,
                epoch=int(_tz.now().timestamp()),
            )
        except Exception:
            # Best-effort — activity logging failure shouldn't fail the
            # create. log_exception is overkill since this hits the
            # eager-mode path in dev.
            pass

        return Response(
            {
                "id": str(issue.id),
                "sequence_id": issue.sequence_id,
                "project_identifier": project.identifier,
                "name": issue.name,
                "url": f"/{slug}/projects/{project.id}/issues/{issue.id}",
            },
            status=status.HTTP_201_CREATED,
        )


# -- credentials -----------------------------------------------------------


class WorkspaceCredentialListCreateEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        ws = _workspace(slug)
        qs = WorkspaceCredential.objects.filter(workspace=ws)
        if source := request.query_params.get("source"):
            qs = qs.filter(source=source)
        if user_id := request.query_params.get("user_id"):
            qs = qs.filter(user_id=user_id)
        return Response(WorkspaceCredentialSerializer(qs, many=True).data)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        ws = _workspace(slug)
        serializer = WorkspaceCredentialSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(workspace=ws, user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class WorkspaceCredentialDetailEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug, pk):
        cred = get_object_or_404(WorkspaceCredential, workspace__slug=slug, pk=pk)
        return Response(WorkspaceCredentialSerializer(cred).data)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, pk):
        cred = get_object_or_404(WorkspaceCredential, workspace__slug=slug, pk=pk)
        serializer = WorkspaceCredentialSerializer(cred, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, pk):
        WorkspaceCredential.objects.filter(workspace__slug=slug, pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceCredentialTokenVerifyEndpoint(BaseAPIView):
    """Lightweight liveness check for a credential row.

    silo can later add provider-specific verification (auth.test for
    Slack, /user for GitHub) at this endpoint. Phase 1 just reports
    row existence + is_active.
    """

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request, slug):
        cred_id = request.data.get("credential_id")
        if not cred_id:
            return Response(
                {"isAuthenticated": False, "isOAuthEnabled": False},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cred = WorkspaceCredential.objects.filter(workspace__slug=slug, pk=cred_id).first()
        return Response(
            {
                "isAuthenticated": bool(cred and cred.is_active),
                "isOAuthEnabled": bool(cred and not cred.is_pat),
            }
        )


# -- workspace connections -------------------------------------------------


class WorkspaceConnectionListCreateEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        qs = WorkspaceConnection.objects.filter(workspace__slug=slug).select_related("credential")
        if ct := request.query_params.get("connection_type"):
            qs = qs.filter(connection_type=ct)
        return Response(WorkspaceConnectionSerializer(qs, many=True).data)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        ws = _workspace(slug)
        serializer = WorkspaceConnectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(workspace=ws)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class WorkspaceConnectionDetailEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, pk):
        conn = get_object_or_404(WorkspaceConnection, workspace__slug=slug, pk=pk)
        return Response(WorkspaceConnectionSerializer(conn).data)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, pk):
        conn = get_object_or_404(WorkspaceConnection, workspace__slug=slug, pk=pk)
        serializer = WorkspaceConnectionSerializer(conn, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, pk):
        WorkspaceConnection.objects.filter(workspace__slug=slug, pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# -- per-user connections --------------------------------------------------


class WorkspaceUserConnectionListCreateEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        qs = WorkspaceUserConnection.objects.filter(workspace__slug=slug)
        # Members see their own; admins see all.
        is_admin = WorkspaceMember.objects.filter(
            workspace__slug=slug, member=request.user, role=ROLE.ADMIN.value, is_active=True
        ).exists()
        if not is_admin:
            qs = qs.filter(user=request.user)
        if ct := request.query_params.get("connection_type"):
            qs = qs.filter(connection_type=ct)
        return Response(WorkspaceUserConnectionSerializer(qs, many=True).data)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request, slug):
        ws = _workspace(slug)
        serializer = WorkspaceUserConnectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(workspace=ws, user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class WorkspaceUserConnectionDetailEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, pk):
        conn = get_object_or_404(WorkspaceUserConnection, workspace__slug=slug, pk=pk)
        if conn.user_id != request.user.id:
            is_admin = WorkspaceMember.objects.filter(
                workspace=conn.workspace, member=request.user, role=ROLE.ADMIN.value, is_active=True
            ).exists()
            if not is_admin:
                return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(WorkspaceUserConnectionSerializer(conn).data)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def delete(self, request, slug, pk):
        conn = get_object_or_404(WorkspaceUserConnection, workspace__slug=slug, pk=pk)
        if conn.user_id != request.user.id:
            is_admin = WorkspaceMember.objects.filter(
                workspace=conn.workspace, member=request.user, role=ROLE.ADMIN.value, is_active=True
            ).exists()
            if not is_admin:
                return Response(status=status.HTTP_403_FORBIDDEN)
        conn.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# -- entity connections (project ↔ channel/repo bindings) ------------------


class WorkspaceEntityConnectionListCreateEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        qs = WorkspaceEntityConnection.objects.filter(workspace__slug=slug)
        if wc := request.query_params.get("workspace_connection_id"):
            qs = qs.filter(workspace_connection_id=wc)
        if pid := request.query_params.get("project_id"):
            qs = qs.filter(project_id=pid)
        if ct := request.query_params.get("type"):
            qs = qs.filter(type=ct)
        return Response(WorkspaceEntityConnectionSerializer(qs, many=True).data)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        ws = _workspace(slug)
        serializer = WorkspaceEntityConnectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(workspace=ws)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class WorkspaceEntityConnectionDetailEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, pk):
        conn = get_object_or_404(WorkspaceEntityConnection, workspace__slug=slug, pk=pk)
        return Response(WorkspaceEntityConnectionSerializer(conn).data)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, pk):
        conn = get_object_or_404(WorkspaceEntityConnection, workspace__slug=slug, pk=pk)
        serializer = WorkspaceEntityConnectionSerializer(conn, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, pk):
        WorkspaceEntityConnection.objects.filter(workspace__slug=slug, pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)