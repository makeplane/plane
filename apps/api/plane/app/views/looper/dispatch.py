import json
import base64
from datetime import timedelta
from uuid import UUID

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ProjectEntityPermission, ROLE, allow_permission
from plane.db.models import (
    Issue,
    LooperDispatch,
    LooperNodeBinding,
    LooperNodeKey,
    LooperNodeSession,
    LooperProjectIntegration,
    LooperProjectRolePolicy,
    LooperWorkItemProtocol,
    ProjectMember,
    WorkspaceMember,
)
from plane.integrations.looper.dispatch import (
    DispatchConflict,
    claim_dispatch,
    create_dispatch,
    release_dispatch,
    request_stop,
    transition_dispatch,
)
from plane.integrations.looper.protocol import ProtocolError
from plane.integrations.looper.replay import consume_request_nonce
from plane.integrations.looper.security import verify_node_request

from .. import BaseAPIView


def dispatch_payload(dispatch):
    return {
        "id": str(dispatch.id),
        "issue_id": str(dispatch.issue_id),
        "revision": dispatch.revision,
        "state_version": dispatch.state_version,
        "state": dispatch.state,
        "health": dispatch.health,
        "requested_mode": dispatch.requested_mode,
        "active_role": dispatch.active_role,
        "owner_member_id": str(dispatch.owner_member_id) if dispatch.owner_member_id else None,
        "node_id": dispatch.node_id,
        "node_name": dispatch.node_name_snapshot,
        "node_binding_id": str(dispatch.node_binding_id) if dispatch.node_binding_id else None,
        "role_policy_revision": dispatch.role_policy_revision,
        "execution_attempt_id": (
            str(dispatch.execution_attempt_id) if dispatch.execution_attempt_id else None
        ),
        "fencing_token": dispatch.fencing_token,
        "claim_lease_expires_at": dispatch.claim_lease_expires_at,
        "updated_at": dispatch.updated_at,
    }


def _conflict_response(exc):
    payload = {"error": exc.code, "detail": exc.detail}
    if exc.dispatch is not None:
        payload["dispatch"] = dispatch_payload(exc.dispatch)
    return Response(payload, status=status.HTTP_409_CONFLICT)


def _json_body(request):
    raw_body = request.body
    try:
        value = json.loads(raw_body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise ProtocolError("request body must be a JSON object") from exc
    if not isinstance(value, dict):
        raise ProtocolError("request body must be a JSON object")
    return raw_body, value


def _active_membership(binding):
    return ProjectMember.objects.filter(
        project_id=binding.project_id, member_id=binding.member_id, is_active=True
    ).exists() and WorkspaceMember.objects.filter(
        workspace_id=binding.workspace_id, member_id=binding.member_id, is_active=True
    ).exists()


def _decode_instance_nonce(value):
    if not isinstance(value, str) or not value or "=" in value:
        raise ProtocolError("instance_nonce must be unpadded base64url")
    try:
        decoded = base64.b64decode(value + "=" * (-len(value) % 4), altchars=b"-_", validate=True)
    except (ValueError, TypeError) as exc:
        raise ProtocolError("instance_nonce is invalid") from exc
    if len(decoded) != 16:
        raise ProtocolError("instance_nonce must contain 16 bytes")
    return decoded


def _require_active_session(binding, session_id, instance_nonce):
    session = LooperNodeSession.objects.filter(
        binding=binding,
        session_id=session_id,
        instance_nonce=instance_nonce,
        state="active",
        lease_expires_at__gte=timezone.now(),
    ).first()
    if session is None:
        raise ProtocolError("Node session is missing, expired, or belongs to another instance")
    return session


def _verify_signed_node_request(
    request,
    *,
    project_id,
    raw_body,
    dispatch=None,
    expected_state_version=None,
    expected_attempt_id=None,
    expected_fencing_token=None,
    allow_recovery_key=False,
):
    signature = request.META.get("HTTP_LOOPER_SIGNATURE", "")
    if not signature:
        raise ProtocolError("Looper-Signature header is required")
    # Parse the binding identity without trusting it, then load the exact key
    # that must verify the full canonical request transcript.
    from plane.integrations.looper.protocol import parse_signature_header

    parsed = parse_signature_header(signature)
    key_states = ("active", "recovery_only") if allow_recovery_key else ("active",)
    key = get_object_or_404(
        LooperNodeKey.objects.select_related("binding"),
        binding_id=parsed["binding_id"],
        key_revision=parsed["key_revision"],
        state__in=key_states,
    )
    binding = key.binding
    if binding.project_id != project_id:
        raise ProtocolError("Node binding belongs to another project")
    if binding.state != "active" and not allow_recovery_key:
        raise ProtocolError("Node binding is not active")
    if not _active_membership(binding):
        raise ProtocolError("Node owner is no longer an active project member")
    verified = verify_node_request(
        Ed25519PublicKey.from_public_bytes(bytes(key.public_key)),
        signature,
        method=request.method,
        path=request.path_info,
        query=request.META.get("QUERY_STRING", ""),
        raw_body=raw_body,
        now_ms=int(timezone.now().timestamp() * 1000),
        dispatch_id=dispatch.id if dispatch else None,
        dispatch_revision=dispatch.revision if dispatch else None,
        state_version=expected_state_version,
        execution_attempt_id=expected_attempt_id,
        fencing_token=expected_fencing_token,
    )
    return binding, verified


class IssueLooperDispatchEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, issue_id):
        try:
            idempotency_key = UUID(str(request.data.get("idempotency_key")))
        except (ValueError, TypeError, AttributeError):
            return Response({"error": "invalid_idempotency_key"}, status=status.HTTP_400_BAD_REQUEST)
        requested_mode = request.data.get("requested_mode", "auto")
        if requested_mode not in {"auto", "worker"}:
            return Response({"error": "invalid_requested_mode"}, status=status.HTTP_400_BAD_REQUEST)
        if requested_mode == "worker":
            return Response(
                {
                    "error": "planner_required",
                    "detail": "Direct implementation needs a current approved technical spec or Bug waiver.",
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        issue = get_object_or_404(
            Issue.objects.select_related("state", "project", "workspace"),
            id=issue_id,
            project_id=project_id,
            workspace__slug=slug,
        )
        if issue.archived_at is not None or issue.state.group in {"completed", "cancelled"}:
            return Response({"error": "work_item_not_open"}, status=status.HTTP_409_CONFLICT)
        integration = LooperProjectIntegration.objects.filter(project_id=project_id).first()
        if integration is None or integration.state != "active":
            return Response({"error": "integration_not_active"}, status=status.HTTP_409_CONFLICT)
        protocol = LooperWorkItemProtocol.objects.filter(issue=issue).first()
        if protocol is None or protocol.protocol != "strict_v1":
            return Response({"error": "strict_protocol_required"}, status=status.HTTP_409_CONFLICT)
        binding = LooperNodeBinding.objects.filter(
            project_id=project_id,
            member=request.user,
            state="active",
        ).first()
        if binding is None:
            return Response({"error": "active_owner_binding_required"}, status=status.HTTP_409_CONFLICT)
        if "planner" not in binding.allowed_roles:
            return Response({"error": "node_role_not_allowed"}, status=status.HTTP_409_CONFLICT)
        if not _active_membership(binding):
            return Response({"error": "binding_owner_not_member"}, status=status.HTTP_409_CONFLICT)
        role_policy = LooperProjectRolePolicy.objects.filter(project_id=project_id).first()
        if role_policy is None:
            return Response({"error": "role_policy_required"}, status=status.HTTP_409_CONFLICT)
        try:
            dispatch, created = create_dispatch(
                issue=issue,
                binding=binding,
                role_policy=role_policy,
                actor=request.user,
                requested_mode=requested_mode,
                idempotency_key=idempotency_key,
            )
        except DispatchConflict as exc:
            return _conflict_response(exc)
        return Response(
            {"dispatch": dispatch_payload(dispatch), "created": created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class LooperDispatchOwnerActionEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, dispatch_id, action):
        dispatch = get_object_or_404(
            LooperDispatch, id=dispatch_id, project_id=project_id, workspace__slug=slug
        )
        try:
            if action == "stop":
                dispatch, changed = request_stop(dispatch=dispatch, actor=request.user)
            elif action == "release":
                dispatch, changed = release_dispatch(
                    dispatch=dispatch,
                    actor=request.user,
                    reason=str(request.data.get("reason", "")).strip(),
                )
            else:
                return Response({"error": "unknown_action"}, status=status.HTTP_404_NOT_FOUND)
        except DispatchConflict as exc:
            return _conflict_response(exc)
        return Response({"dispatch": dispatch_payload(dispatch), "changed": changed})


class LooperDispatchInboxEndpoint(BaseAPIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = []

    @transaction.atomic
    def get(self, request, slug, project_id):
        node_id = request.query_params.get("node_id", "")
        try:
            session_id = UUID(str(request.query_params.get("session_id", "")))
            instance_nonce = _decode_instance_nonce(request.query_params.get("instance_nonce", ""))
        except (ValueError, TypeError, AttributeError, ProtocolError) as exc:
            return Response({"error": "invalid_session", "detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        if not node_id:
            return Response({"error": "node_id_required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            binding, verified = _verify_signed_node_request(
                request, project_id=project_id, raw_body=b""
            )
            if binding.node_id != node_id:
                raise ProtocolError("signed binding does not own the requested Node inbox")
            _require_active_session(binding, session_id, instance_nonce)
            consume_request_nonce(
                binding_id=verified.binding_id,
                key_revision=verified.key_revision,
                nonce=verified.nonce,
            )
        except ProtocolError as exc:
            return Response(
                {"error": "invalid_node_request", "detail": str(exc)},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        integration = LooperProjectIntegration.objects.filter(project_id=project_id).first()
        if integration is None or integration.state != "active":
            return Response({"dispatches": [], "integration_state": "read_only"})
        dispatches = LooperDispatch.objects.filter(
            project_id=project_id,
            node_binding=binding,
            state__in=LooperDispatch.HOLDING_STATES,
        ).order_by("created_at")
        return Response(
            {
                "dispatches": [dispatch_payload(dispatch) for dispatch in dispatches],
                "integration_state": integration.state,
            }
        )


class LooperDispatchClaimEndpoint(BaseAPIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = []

    @transaction.atomic
    def post(self, request, slug, project_id, dispatch_id):
        dispatch = get_object_or_404(LooperDispatch, id=dispatch_id, project_id=project_id)
        try:
            raw_body, body = _json_body(request)
            expected_state_version = int(body["expected_state_version"])
            idempotency_key = UUID(str(body["claim_idempotency_key"]))
            session_id = UUID(str(body["session_id"]))
            instance_nonce = _decode_instance_nonce(body["instance_nonce"])
            binding, verified = _verify_signed_node_request(
                request,
                project_id=project_id,
                raw_body=raw_body,
                dispatch=dispatch,
                expected_state_version=expected_state_version,
            )
            _require_active_session(binding, session_id, instance_nonce)
            consume_request_nonce(
                binding_id=verified.binding_id,
                key_revision=verified.key_revision,
                nonce=verified.nonce,
            )
            claimed, created = claim_dispatch(
                dispatch=dispatch,
                binding=binding,
                expected_revision=dispatch.revision,
                expected_state_version=expected_state_version,
                idempotency_key=idempotency_key,
            )
        except (KeyError, ValueError, TypeError, ProtocolError) as exc:
            if isinstance(exc, DispatchConflict):
                return _conflict_response(exc)
            return Response(
                {"error": "invalid_node_request", "detail": str(exc)},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response({"dispatch": dispatch_payload(claimed), "claimed": created})


class LooperDispatchTransitionEndpoint(BaseAPIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = []

    @transaction.atomic
    def post(self, request, slug, project_id, dispatch_id):
        dispatch = get_object_or_404(LooperDispatch, id=dispatch_id, project_id=project_id)
        try:
            raw_body, body = _json_body(request)
            expected_state_version = int(body["expected_state_version"])
            execution_attempt_id = UUID(str(body["execution_attempt_id"]))
            fencing_token = int(body["fencing_token"])
            session_id = UUID(str(body["session_id"]))
            instance_nonce = _decode_instance_nonce(body["instance_nonce"])
            binding, verified = _verify_signed_node_request(
                request,
                project_id=project_id,
                raw_body=raw_body,
                dispatch=dispatch,
                expected_state_version=expected_state_version,
                expected_attempt_id=execution_attempt_id,
                expected_fencing_token=fencing_token,
                allow_recovery_key=dispatch.state == "stop_requested",
            )
            if dispatch.node_binding_id != binding.id:
                raise ProtocolError("dispatch belongs to another Node binding")
            _require_active_session(binding, session_id, instance_nonce)
            consume_request_nonce(
                binding_id=verified.binding_id,
                key_revision=verified.key_revision,
                nonce=verified.nonce,
            )
            transitioned = transition_dispatch(
                dispatch=dispatch,
                expected_revision=dispatch.revision,
                expected_state_version=expected_state_version,
                execution_attempt_id=execution_attempt_id,
                fencing_token=fencing_token,
                new_state=body.get("state"),
                wait_kind=body.get("wait_kind"),
            )
        except (KeyError, ValueError, TypeError, ProtocolError) as exc:
            if isinstance(exc, DispatchConflict):
                return _conflict_response(exc)
            return Response(
                {"error": "invalid_node_request", "detail": str(exc)},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response({"dispatch": dispatch_payload(transitioned)})


class LooperNodeSessionEndpoint(BaseAPIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = []

    @transaction.atomic
    def post(self, request, slug, project_id):
        try:
            raw_body, body = _json_body(request)
            session_id = UUID(str(body["session_id"]))
            instance_nonce = _decode_instance_nonce(body["instance_nonce"])
            binding, verified = _verify_signed_node_request(
                request, project_id=project_id, raw_body=raw_body
            )
            consume_request_nonce(
                binding_id=verified.binding_id,
                key_revision=verified.key_revision,
                nonce=verified.nonce,
            )
            current = (
                LooperNodeSession.objects.select_for_update()
                .filter(binding=binding, state="active")
                .first()
            )
            now = timezone.now()
            if current is not None:
                same_instance = current.session_id == session_id and bytes(current.instance_nonce) == instance_nonce
                holding = LooperDispatch.objects.filter(
                    node_binding=binding, state__in=LooperDispatch.HOLDING_STATES
                ).exists()
                if not same_instance and (current.lease_expires_at >= now or holding):
                    raise ProtocolError("another Node instance owns this binding session")
                if same_instance:
                    current.lease_expires_at = now + timedelta(seconds=90)
                    current.last_renewed_at = now
                    current.save(update_fields=("lease_expires_at", "last_renewed_at", "updated_at"))
                    session = current
                else:
                    current.state = "closed"
                    current.save(update_fields=("state", "updated_at"))
                    session = LooperNodeSession.objects.create(
                        project_id=binding.project_id,
                        workspace_id=binding.workspace_id,
                        binding=binding,
                        session_id=session_id,
                        instance_nonce=instance_nonce,
                        lease_expires_at=now + timedelta(seconds=90),
                        last_renewed_at=now,
                    )
            else:
                session = LooperNodeSession.objects.create(
                    project_id=binding.project_id,
                    workspace_id=binding.workspace_id,
                    binding=binding,
                    session_id=session_id,
                    instance_nonce=instance_nonce,
                    lease_expires_at=now + timedelta(seconds=90),
                    last_renewed_at=now,
                )
        except (KeyError, ValueError, TypeError, ProtocolError) as exc:
            return Response(
                {"error": "invalid_node_session", "detail": str(exc)},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(
            {
                "session_id": str(session.session_id),
                "lease_expires_at": session.lease_expires_at,
                "state": session.state,
            }
        )
