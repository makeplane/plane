from uuid import UUID

from django.conf import settings
from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ProjectAdminPermission, ProjectEntityPermission, ROLE, allow_permission
from plane.db.models import (
    LooperNodeBinding,
    LooperProjectIntegration,
    LooperProjectRolePolicy,
    LooperWorkItemProtocol,
    Issue,
    Project,
    ProjectMember,
)
from plane.integrations.looper.binding import (
    binding_payload,
    create_active_binding,
    verify_link_request,
)
from plane.integrations.looper.directory import DirectoryUnavailable, get_directory_snapshot
from plane.integrations.looper.protocol import ProtocolError
from plane.integrations.looper.security import TrustKeyRing

from .. import BaseAPIView


LINK_REQUEST_MEDIA_TYPE = "application/vnd.looper.link-request+cbor;v=1"
ALLOWED_NODE_ROLES = {"planner", "worker"}


def _project(slug, project_id):
    return get_object_or_404(Project, id=project_id, workspace__slug=slug)


def _trust_key_ring():
    path = settings.LOOPERNET_TRUST_ROOTS_FILE
    if not path or not settings.LOOPERNET_NETWORK_ID:
        raise ProtocolError("Looper binding is not configured on this Plane environment")
    return TrustKeyRing.from_file(path)


class LooperNodeBindingLinkEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        content_type = request.META.get("CONTENT_TYPE", "").replace(" ", "").lower()
        if content_type != LINK_REQUEST_MEDIA_TYPE:
            return Response(
                {"error": "unsupported_media_type", "detail": f"Content-Type must be {LINK_REQUEST_MEDIA_TYPE}"},
                status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            )
        project = _project(slug, project_id)
        try:
            current_time = timezone.now()
            verified = verify_link_request(
                request.body,
                trust_key_ring=_trust_key_ring(),
                now_ms=int(current_time.timestamp() * 1000),
                expected_network_id=settings.LOOPERNET_NETWORK_ID,
                workspace_id=project.workspace_id,
                project_id=project.id,
                member_id=request.user.id,
            )
            binding = create_active_binding(
                project=project,
                member=request.user,
                verified=verified,
                node_name=request.headers.get("X-Looper-Node-Name", ""),
                now=current_time,
            )
        except IntegrityError:
            return Response(
                {"error": "binding_conflict", "detail": "This member or Node already has a current binding."},
                status=status.HTTP_409_CONFLICT,
            )
        except ProtocolError as exc:
            return Response(
                {"error": "invalid_link_request", "detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(binding_payload(binding), status=status.HTTP_201_CREATED)


class LooperNodeBindingApprovalEndpoint(BaseAPIView):
    permission_classes = [ProjectAdminPermission]

    @transaction.atomic
    def post(self, request, slug, project_id, binding_id):
        project = _project(slug, project_id)
        binding = get_object_or_404(
            LooperNodeBinding.objects.select_for_update().select_related("member"),
            id=binding_id,
            project=project,
        )
        roles = request.data.get("allowed_roles")
        allow_offline_queue = request.data.get("allow_offline_queue", False)
        if (
            not isinstance(roles, list)
            or not roles
            or any(not isinstance(role, str) for role in roles)
            or not set(roles).issubset(ALLOWED_NODE_ROLES)
            or type(allow_offline_queue) is not bool
        ):
            return Response(
                {"error": "invalid_binding_policy"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if binding.state != "pending":
            return Response({"error": "binding_not_pending"}, status=status.HTTP_409_CONFLICT)
        if not ProjectMember.objects.filter(project=project, member=binding.member, is_active=True).exists():
            return Response({"error": "binding_owner_not_member"}, status=status.HTTP_409_CONFLICT)
        binding.allowed_roles = sorted(set(roles))
        binding.allow_offline_queue = allow_offline_queue
        binding.state = "active"
        binding.approved_by = request.user
        binding.approved_at = timezone.now()
        binding.revision += 1
        try:
            # Keep an IntegrityError from poisoning the endpoint's outer
            # transaction so the conflict response can still be rendered.
            with transaction.atomic():
                binding.save()
        except IntegrityError:
            return Response({"error": "binding_conflict"}, status=status.HTTP_409_CONFLICT)
        return Response(binding_payload(binding), status=status.HTTP_200_OK)


class LooperTargetsEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        project = _project(slug, project_id)
        bindings = LooperNodeBinding.objects.filter(
            project=project,
            member=request.user,
            state="active",
        ).order_by("-updated_at")
        return Response(
            {"targets": [binding_payload(binding) for binding in bindings]},
            status=status.HTTP_200_OK,
        )


def _policy_payload(policy):
    if policy is None:
        return None
    return {
        "id": str(policy.id),
        "revision": policy.revision,
        "product_member_id": str(policy.product_member_id),
        "design_member_id": str(policy.design_member_id),
        "engineering_member_rule": "dispatch_owner",
        "qa_member_id": str(policy.qa_member_id),
        "updated_at": policy.updated_at,
    }


class LooperProjectRolePolicyEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        project = _project(slug, project_id)
        policy = LooperProjectRolePolicy.objects.filter(project=project).first()
        return Response({"policy": _policy_payload(policy)}, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    @transaction.atomic
    def put(self, request, slug, project_id):
        project = _project(slug, project_id)
        field_names = ("product_member_id", "design_member_id", "qa_member_id")
        try:
            member_ids = {field: UUID(str(request.data[field])) for field in field_names}
        except (KeyError, ValueError, TypeError, AttributeError):
            return Response({"error": "invalid_role_policy"}, status=status.HTTP_400_BAD_REQUEST)
        active_member_ids = set(
            ProjectMember.objects.filter(
                project=project,
                member_id__in=member_ids.values(),
                is_active=True,
            ).values_list("member_id", flat=True)
        )
        if active_member_ids != set(member_ids.values()):
            return Response({"error": "role_member_not_active"}, status=status.HTTP_409_CONFLICT)
        policy = LooperProjectRolePolicy.objects.select_for_update().filter(project=project).first()
        if policy is None:
            policy = LooperProjectRolePolicy(project=project)
        else:
            policy.revision += 1
        policy.product_member_id = member_ids["product_member_id"]
        policy.design_member_id = member_ids["design_member_id"]
        policy.qa_member_id = member_ids["qa_member_id"]
        policy.save()
        return Response({"policy": _policy_payload(policy)}, status=status.HTTP_200_OK)


def _integration_payload(integration):
    if integration is None:
        return {
            "state": "unconfigured",
            "strict_epoch": None,
            "activation_checklist_revision": 0,
            "paused_reason": "",
        }
    return {
        "id": str(integration.id),
        "state": integration.state,
        "strict_epoch": integration.strict_epoch,
        "activation_checklist_revision": integration.activation_checklist_revision,
        "effective_legacy_trigger_label_ids": integration.effective_legacy_trigger_label_ids,
        "node_capability_revisions": integration.node_capability_revisions,
        "paused_reason": integration.paused_reason,
        "updated_at": integration.updated_at,
    }


class LooperProjectIntegrationEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        project = _project(slug, project_id)
        integration = LooperProjectIntegration.objects.filter(project=project).first()
        return Response({"integration": _integration_payload(integration)}, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    @transaction.atomic
    def put(self, request, slug, project_id):
        project = Project.objects.select_for_update().get(id=project_id, workspace__slug=slug)
        action = request.data.get("action")
        integration = LooperProjectIntegration.objects.select_for_update().filter(project=project).first()
        if integration is None:
            integration = LooperProjectIntegration(project=project)
        if action == "activate":
            checklist_revision = request.data.get("activation_checklist_revision")
            legacy_label_ids = request.data.get("effective_legacy_trigger_label_ids", [])
            if (
                type(checklist_revision) is not int
                or checklist_revision <= 0
                or not isinstance(legacy_label_ids, list)
            ):
                return Response({"error": "invalid_activation_checklist"}, status=status.HTTP_400_BAD_REQUEST)
            if not LooperProjectRolePolicy.objects.filter(project=project).exists():
                return Response({"error": "role_policy_required"}, status=status.HTTP_409_CONFLICT)
            bindings = list(LooperNodeBinding.objects.filter(project=project, state="active"))
            if not bindings:
                return Response({"error": "active_binding_required"}, status=status.HTTP_409_CONFLICT)
            node_ids = {binding.node_id for binding in bindings}
            try:
                directory = get_directory_snapshot()
            except DirectoryUnavailable:
                return Response({"error": "node_directory_unavailable"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            incompatible = sorted(
                node_id
                for node_id in node_ids
                if directory.node(node_id) is None
                or not directory.node(node_id).online
                or not directory.node(node_id).strict_dispatch_v1
            )
            if incompatible:
                return Response(
                    {"error": "node_capability_attestation_incomplete", "node_ids": incompatible},
                    status=status.HTTP_409_CONFLICT,
                )
            if not {"planner", "worker"}.issubset({role for binding in bindings for role in binding.allowed_roles}):
                return Response({"error": "planner_and_worker_bindings_required"}, status=status.HTTP_409_CONFLICT)
            now = timezone.now()
            if integration.strict_epoch is None:
                integration.strict_epoch = now
                existing_issue_ids = Issue.objects.filter(project=project).values_list("id", flat=True)
                classified_ids = LooperWorkItemProtocol.objects.filter(project=project).values_list(
                    "issue_id", flat=True
                )
                LooperWorkItemProtocol.objects.bulk_create(
                    [
                        LooperWorkItemProtocol(
                            project=project,
                            workspace_id=project.workspace_id,
                            issue_id=issue_id,
                            protocol="legacy",
                            classified_at=now,
                            classified_by=request.user,
                            project_strict_epoch=now,
                        )
                        for issue_id in set(existing_issue_ids) - set(classified_ids)
                    ]
                )
            integration.state = "active"
            integration.activation_checklist_revision = checklist_revision
            integration.node_capability_revisions = {
                node_id: int(directory.node(node_id).last_heartbeat_at.timestamp() * 1000)
                for node_id in node_ids
            }
            integration.effective_legacy_trigger_label_ids = legacy_label_ids
            integration.paused_reason = ""
        elif action in {"pause", "read_only"}:
            integration.state = "paused" if action == "pause" else "read_only"
            integration.paused_reason = str(request.data.get("reason", "")).strip()
            if action == "pause" and not integration.paused_reason:
                return Response({"error": "pause_reason_required"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"error": "invalid_integration_action"}, status=status.HTTP_400_BAD_REQUEST)
        integration.save()
        return Response({"integration": _integration_payload(integration)}, status=status.HTTP_200_OK)
