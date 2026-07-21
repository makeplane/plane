import json
import secrets
from datetime import timedelta
from urllib.parse import urlsplit

from django.conf import settings
from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ProjectEntityPermission, ROLE, allow_permission
from plane.db.models import (
    LooperConnectionSession,
    LooperNodeBinding,
    LooperNodeSession,
    Project,
    ProjectMember,
)
from plane.integrations.looper.binding import binding_payload, create_active_binding, verify_link_request
from plane.integrations.looper.directory import DirectoryUnavailable, get_directory_snapshot
from plane.integrations.looper.protocol import ProtocolError

from .. import BaseAPIView
from .binding import LINK_REQUEST_MEDIA_TYPE, _trust_key_ring


CONNECTION_TTL = timedelta(minutes=10)
CURRENT_BINDING_STATES = ("pending", "active", "revocation_pending")


def _origin(request):
    parsed = urlsplit(request.build_absolute_uri("/"))
    return f"{parsed.scheme}://{parsed.netloc}"


def _expire_if_needed(connection):
    if connection.status in {"created", "cli_connected", "binding_created"} and connection.expires_at <= timezone.now():
        connection.status = "expired"
        connection.error_code = "connection_expired"
        connection.error_detail = "The connection code expired. Start a new connection from Plane."
        connection.save(update_fields=("status", "error_code", "error_detail", "updated_at"))
    return connection


def _member_payload(member):
    display_name = member.display_name.strip() or member.email or str(member.id)
    return {"id": str(member.id), "display_name": display_name, "avatar": member.avatar_url}


def _connection_checks(connection):
    binding = connection.binding
    node_online = False
    strict_dispatch = False
    inbox_verified = False
    if binding is not None:
        inbox_verified = LooperNodeSession.objects.filter(
            binding=binding,
            state="active",
            lease_expires_at__gte=timezone.now(),
        ).exists()
        try:
            presence = get_directory_snapshot().node(binding.node_id)
        except DirectoryUnavailable:
            presence = None
        node_online = inbox_verified or bool(presence and presence.online)
        strict_dispatch = inbox_verified or bool(presence and presence.strict_dispatch_v1)
    return {
        "identity_verified": True,
        "cli_connected": connection.status not in {"created", "expired", "cancelled"},
        "key_verified": binding is not None,
        "node_online": node_online,
        "strict_dispatch": strict_dispatch,
        "inbox_verified": inbox_verified,
    }


def connection_payload(connection, request, *, include_command=True):
    connection = _expire_if_needed(connection)
    binding = connection.binding
    command = ""
    if include_command and connection.status in {"created", "cli_connected"}:
        command = f"looper plane connect {_origin(request)} --code {connection.connect_code}"
    node = None
    if binding is not None or connection.node_id:
        node = {
            "id": binding.node_id if binding else connection.node_id,
            "name": binding.node_name_snapshot if binding else connection.node_name,
            "binding_id": str(binding.id) if binding else None,
        }
    return {
        "id": str(connection.id),
        "status": connection.status,
        "command": command,
        "expires_at": connection.expires_at,
        "owner": _member_payload(connection.member),
        "node": node,
        "checks": _connection_checks(connection),
        "error_code": connection.error_code or None,
        "error_detail": connection.error_detail or None,
    }


def _connection_by_code(code, *, for_update=False):
    queryset = LooperConnectionSession.objects
    if for_update:
        queryset = queryset.select_for_update()
    connection = queryset.select_related("member", "project", "workspace").filter(
        connect_code=str(code).strip()
    ).first()
    if connection is None:
        raise ProtocolError("Connection code is invalid or no longer available.")
    _expire_if_needed(connection)
    if connection.status in {"expired", "cancelled", "failed", "device_exists"}:
        raise ProtocolError(connection.error_detail or "Connection session is not active.")
    return connection


class LooperConnectionCollectionEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @transaction.atomic
    def post(self, request, slug, project_id):
        project = get_object_or_404(Project, id=project_id, workspace__slug=slug)
        if not ProjectMember.objects.filter(project=project, member=request.user, is_active=True).exists():
            return Response({"error": "not_project_member"}, status=status.HTTP_403_FORBIDDEN)
        existing = LooperNodeBinding.objects.filter(
            project=project,
            member=request.user,
            state__in=CURRENT_BINDING_STATES,
        ).first()
        LooperConnectionSession.objects.filter(
            project=project,
            member=request.user,
            status__in=("created", "cli_connected"),
        ).update(status="cancelled")
        connection_status = "device_exists" if existing else "created"
        connection = LooperConnectionSession.objects.create(
            workspace=project.workspace,
            project=project,
            member=request.user,
            connect_code=secrets.token_urlsafe(24),
            status=connection_status,
            expires_at=timezone.now() + CONNECTION_TTL,
            binding=existing,
            node_id=existing.node_id if existing else "",
            node_name=existing.node_name_snapshot if existing else "",
            error_code="active_device_exists" if existing else "",
            error_detail=(
                "This project already has an active Looper computer for your account."
                if existing
                else ""
            ),
        )
        response_status = status.HTTP_200_OK if existing else status.HTTP_201_CREATED
        return Response(
            {"connection": connection_payload(connection, request)},
            status=response_status,
        )


class LooperConnectionDetailEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    def _connection(self, request, slug, project_id, connection_id):
        return get_object_or_404(
            LooperConnectionSession.objects.select_related("member", "binding"),
            id=connection_id,
            project_id=project_id,
            workspace__slug=slug,
            member=request.user,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id, connection_id):
        connection = self._connection(request, slug, project_id, connection_id)
        return Response({"connection": connection_payload(connection, request)})

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @transaction.atomic
    def delete(self, request, slug, project_id, connection_id):
        connection = self._connection(request, slug, project_id, connection_id)
        if connection.status in {"completed", "binding_created", "device_exists"}:
            return Response(
                {"error": "connection_not_cancellable"},
                status=status.HTTP_409_CONFLICT,
            )
        connection.status = "cancelled"
        connection.save(update_fields=("status", "updated_at"))
        return Response(status=status.HTTP_204_NO_CONTENT)


class LooperConnectionExchangeEndpoint(BaseAPIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = []

    @transaction.atomic
    def post(self, request):
        try:
            connection = _connection_by_code(request.data.get("code"), for_update=True)
            if connection.status == "created":
                connection.status = "cli_connected"
                connection.save(update_fields=("status", "updated_at"))
        except (AttributeError, ProtocolError) as exc:
            return Response(
                {"error": "invalid_connection_code", "detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "connection_id": str(connection.id),
                "status": connection.status,
                "workspace": connection.workspace.slug,
                "workspace_id": str(connection.workspace_id),
                "project_id": str(connection.project_id),
                "member_id": str(connection.member_id),
                "binding_id": str(connection.binding_id) if connection.binding_id else None,
                "node_id": connection.node_id or None,
                "expires_at": connection.expires_at,
            }
        )


class LooperConnectionLinkEndpoint(BaseAPIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = []

    @transaction.atomic
    def post(self, request):
        content_type = request.META.get("CONTENT_TYPE", "").replace(" ", "").lower()
        if content_type != LINK_REQUEST_MEDIA_TYPE:
            return Response(
                {"error": "unsupported_media_type", "detail": f"Content-Type must be {LINK_REQUEST_MEDIA_TYPE}"},
                status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            )
        try:
            connection = _connection_by_code(
                request.headers.get("X-Looper-Connect-Code"), for_update=True
            )
            if connection.status not in {"created", "cli_connected"}:
                raise ProtocolError("Connection session cannot create another binding.")
            current_time = timezone.now()
            verified = verify_link_request(
                request.body,
                trust_key_ring=_trust_key_ring(),
                now_ms=int(current_time.timestamp() * 1000),
                expected_network_id=settings.LOOPERNET_NETWORK_ID,
                workspace_id=connection.workspace_id,
                project_id=connection.project_id,
                member_id=connection.member_id,
            )
            binding = create_active_binding(
                project=connection.project,
                member=connection.member,
                verified=verified,
                node_name=request.headers.get("X-Looper-Node-Name", ""),
                now=current_time,
            )
            connection.binding = binding
            connection.node_id = binding.node_id
            connection.node_name = binding.node_name_snapshot
            connection.status = "binding_created"
            connection.save(
                update_fields=("binding", "node_id", "node_name", "status", "updated_at")
            )
        except IntegrityError:
            return Response(
                {"error": "active_device_exists", "detail": "Only one computer can be connected per user and project."},
                status=status.HTTP_409_CONFLICT,
            )
        except ProtocolError as exc:
            return Response(
                {"error": "invalid_link_request", "detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {"connection_id": str(connection.id), "binding": binding_payload(binding)},
            status=status.HTTP_201_CREATED,
        )


class LooperConnectionCompleteEndpoint(BaseAPIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = []

    @transaction.atomic
    def post(self, request):
        try:
            raw = request.body
            body = json.loads(raw or b"{}")
            connection = _connection_by_code(body.get("code"), for_update=True)
            if connection.status != "binding_created" or connection.binding_id is None:
                raise ProtocolError("The local binding has not been created yet.")
            if not LooperNodeSession.objects.filter(
                binding_id=connection.binding_id,
                state="active",
                lease_expires_at__gte=timezone.now(),
            ).exists():
                return Response(
                    {
                        "error": "node_not_ready",
                        "detail": "Looper restarted but has not opened its signed Plane inbox session yet.",
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            connection.status = "completed"
            connection.completed_at = timezone.now()
            connection.save(update_fields=("status", "completed_at", "updated_at"))
        except (json.JSONDecodeError, UnicodeDecodeError, AttributeError, ProtocolError) as exc:
            return Response(
                {"error": "invalid_connection_completion", "detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"connection_id": str(connection.id), "status": connection.status})
