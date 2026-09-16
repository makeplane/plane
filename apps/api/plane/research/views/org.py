# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import MentorBinding, OrgUnit, OrgUnitMember
from plane.research.serializers import (
    MentorBindingSerializer,
    OrgUnitMemberSerializer,
    OrgUnitSerializer,
)
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)
from plane.research.utils.capabilities import NAV_ORG
from plane.research.utils.errors import (
    ResearchErrorCode,
    research_conflict,
    research_error,
    research_not_found,
    research_permission_denied,
)
from plane.research.utils.org import (
    build_path,
    descendants_queryset,
    ensure_root_org_unit,
    is_descendant_of,
    move_subtree,
    user_can_manage_org_unit,
)
from plane.research.utils.roles import sync_main_pi_workspace_seat
from plane.research.views.base import (
    ResearchAPIView,
    parse_date,
    resolve_user,
    truthy,
)

MANAGED_UNIT_TYPES = (
    OrgUnit.UnitType.INSTITUTE,
    OrgUnit.UnitType.LAB,
    OrgUnit.UnitType.GROUP,
    OrgUnit.UnitType.TEAM,
)


def _unit_payload(payload):
    """Extract and normalise the writable fields of an org unit."""
    data = {}
    if "name" in payload:
        data["name"] = str(payload.get("name") or "").strip()
    if "unit_type" in payload:
        data["unit_type"] = str(payload.get("unit_type") or "").strip().upper()
    if "sort_order" in payload:
        try:
            data["sort_order"] = float(payload.get("sort_order"))
        except (TypeError, ValueError):
            data["sort_order"] = None
    if "is_active" in payload:
        data["is_active"] = truthy(payload.get("is_active"))
    return data


def _serialize_units(units):
    return {"results": OrgUnitSerializer(units, many=True).data, "count": len(units)}


class ResearchOrgUnitListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/org-units/``

    The tree itself stays readable for every member: the research project list
    filters by node. Writing the tree needs the "organisation" navigation key
    on top of the existing node management rights (v2.5.0).
    """

    def get(self, request, slug):
        workspace, error = self.get_workspace(section="org")
        if error:
            return error

        # P0-ORG-01: every workspace owns exactly one root node.
        ensure_root_org_unit(workspace, actor=request.user)

        units = OrgUnit.objects.filter(workspace=workspace)
        if not truthy(request.GET.get("include_inactive")):
            units = units.filter(is_active=True)
        units = units.order_by("path", "sort_order")
        return Response(_serialize_units(list(units)), status=status.HTTP_200_OK)

    def post(self, request, slug):
        workspace, error = self.get_workspace(section="org", nav=NAV_ORG)
        if error:
            return error

        data = _unit_payload(request.data)
        name = data.get("name")
        if not name:
            return research_error(ResearchErrorCode.ORG_UNIT_TYPE_INVALID, "Name is required.")
        if len(name) > 255:
            return research_error(ResearchErrorCode.ORG_UNIT_TYPE_INVALID, "Name is too long.")

        parent_id = request.data.get("parent")
        parent = None
        if parent_id:
            parent = OrgUnit.objects.filter(workspace=workspace, pk=parent_id).first()
            if parent is None or not parent.is_active:
                return research_error(
                    ResearchErrorCode.ORG_UNIT_PARENT_INVALID,
                    "Parent org unit does not exist.",
                )

        unit_type = data.get("unit_type") or ""
        if parent is None:
            if unit_type and unit_type != OrgUnit.UnitType.ROOT:
                return research_error(
                    ResearchErrorCode.ORG_UNIT_TYPE_INVALID,
                    "Top level org unit must be of type ROOT.",
                )
            unit_type = OrgUnit.UnitType.ROOT
            if not self.request.user.is_authenticated:
                return research_permission_denied()
            from plane.research.utils.roles import is_research_admin

            if not is_research_admin(request.user, workspace.id):
                return research_permission_denied()
            if OrgUnit.objects.filter(workspace=workspace, unit_type=OrgUnit.UnitType.ROOT).exists():
                return research_error(
                    ResearchErrorCode.ORG_UNIT_ROOT_EXISTS,
                    "This workspace already has a root org unit.",
                )
        else:
            unit_type = unit_type or OrgUnit.UnitType.GROUP
            if unit_type not in MANAGED_UNIT_TYPES:
                return research_error(
                    ResearchErrorCode.ORG_UNIT_TYPE_INVALID,
                    "Child org unit type must be one of INSTITUTE, LAB, GROUP, TEAM.",
                )
            if not user_can_manage_org_unit(request.user, workspace, parent):
                return research_permission_denied()

        sort_order = data.get("sort_order")
        if sort_order is None:
            sort_order = OrgUnit._meta.get_field("sort_order").get_default()

        try:
            with transaction.atomic():
                unit = OrgUnit(
                    workspace=workspace,
                    name=name,
                    parent=parent,
                    unit_type=unit_type,
                    sort_order=sort_order,
                    depth=(parent.depth + 1) if parent else 0,
                    path="",
                )
                unit.path = build_path(unit.id, parent.path if parent else None)
                unit.save()
        except IntegrityError:
            return research_error(
                ResearchErrorCode.ORG_UNIT_DUPLICATE_NAME,
                "An org unit with the same name already exists under this parent.",
            )

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.ORG_UNIT_CREATE,
            resource_type=ResearchResourceType.ORG_UNIT,
            resource_id=unit.id,
            org_unit=unit,
            actor=request.user,
            metadata={
                "name": unit.name,
                "unit_type": unit.unit_type,
                "parent": str(parent.id) if parent else None,
                "depth": unit.depth,
            },
            request=request,
        )
        return Response(OrgUnitSerializer(unit).data, status=status.HTTP_201_CREATED)


class ResearchOrgUnitDetailEndpoint(ResearchAPIView):
    """``GET``/``PATCH``/``DELETE /api/research/workspaces/<slug>/org-units/<pk>/``"""

    nav_capability = NAV_ORG

    def _get_unit(self, workspace, pk):
        return OrgUnit.objects.filter(workspace=workspace, pk=pk).first()

    def get(self, request, slug, pk):
        workspace, error = self.get_workspace(section="org")
        if error:
            return error
        unit = self._get_unit(workspace, pk)
        if unit is None:
            return research_not_found(ResearchErrorCode.ORG_UNIT_NOT_FOUND, "Org unit not found.")
        payload = OrgUnitSerializer(unit).data
        payload["member_count"] = OrgUnitMember.objects.filter(org_unit=unit).count()
        payload["children_count"] = descendants_queryset(unit).count()
        return Response(payload, status=status.HTTP_200_OK)

    def patch(self, request, slug, pk):
        workspace, error = self.get_workspace(section="org")
        if error:
            return error
        unit = self._get_unit(workspace, pk)
        if unit is None:
            return research_not_found(ResearchErrorCode.ORG_UNIT_NOT_FOUND, "Org unit not found.")
        if not user_can_manage_org_unit(request.user, workspace, unit):
            return research_permission_denied()

        data = _unit_payload(request.data)
        previous = {"name": unit.name, "parent": str(unit.parent_id) if unit.parent_id else None}
        fields = []

        if "name" in data:
            if not data["name"]:
                return research_error(ResearchErrorCode.ORG_UNIT_TYPE_INVALID, "Name is required.")
            if data["name"] != unit.name:
                unit.name = data["name"]
                fields.append("name")

        if "unit_type" in data and data["unit_type"]:
            unit_type = data["unit_type"]
            allowed = (OrgUnit.UnitType.ROOT,) if unit.parent_id is None else MANAGED_UNIT_TYPES
            if unit_type not in allowed:
                return research_error(
                    ResearchErrorCode.ORG_UNIT_TYPE_INVALID,
                    "Org unit type is not allowed for this node.",
                )
            if unit_type != unit.unit_type:
                unit.unit_type = unit_type
                fields.append("unit_type")

        if "sort_order" in data:
            if data["sort_order"] is None:
                return research_error(
                    ResearchErrorCode.ORG_UNIT_TYPE_INVALID,
                    "sort_order must be a number.",
                )
            unit.sort_order = data["sort_order"]
            fields.append("sort_order")

        if "is_active" in data:
            unit.is_active = data["is_active"]
            fields.append("is_active")

        if "parent" in request.data:
            parent_id = request.data.get("parent")
            moved = False
            if parent_id:
                new_parent = OrgUnit.objects.filter(workspace=workspace, pk=parent_id).first()
                if new_parent is None or not new_parent.is_active:
                    return research_error(
                        ResearchErrorCode.ORG_UNIT_PARENT_INVALID,
                        "Parent org unit does not exist.",
                    )
                if new_parent.id == unit.id or is_descendant_of(new_parent, unit):
                    return research_error(
                        ResearchErrorCode.ORG_UNIT_CYCLE_DETECTED,
                        "Parent cannot be the node itself or one of its descendants.",
                    )
                moved = new_parent.id != unit.parent_id
            else:
                if unit.parent_id is None:
                    moved = False
                elif unit.unit_type == OrgUnit.UnitType.ROOT:
                    moved = True
                else:
                    return research_error(
                        ResearchErrorCode.ORG_UNIT_TYPE_INVALID,
                        "Only the ROOT org unit can live at the top level.",
                    )
            if moved:
                if not user_can_manage_org_unit(request.user, workspace, unit):
                    return research_permission_denied()
                if parent_id:
                    new_parent = OrgUnit.objects.get(pk=parent_id)
                    if not user_can_manage_org_unit(request.user, workspace, new_parent):
                        return research_permission_denied()
                    move_subtree(unit, new_parent)
                    unit.refresh_from_db()
                    record_audit_event(
                        workspace=workspace,
                        action=ResearchAuditAction.ORG_UNIT_MOVE,
                        resource_type=ResearchResourceType.ORG_UNIT,
                        resource_id=unit.id,
                        org_unit=unit,
                        actor=request.user,
                        metadata={"from": previous.get("parent"), "to": str(new_parent.id)},
                        request=request,
                    )

        if fields:
            try:
                unit.save(update_fields=[*fields, "updated_at"])
            except IntegrityError:
                return research_error(
                    ResearchErrorCode.ORG_UNIT_DUPLICATE_NAME,
                    "An org unit with the same name already exists under this parent.",
                )
            record_audit_event(
                workspace=workspace,
                action=ResearchAuditAction.ORG_UNIT_UPDATE,
                resource_type=ResearchResourceType.ORG_UNIT,
                resource_id=unit.id,
                org_unit=unit,
                actor=request.user,
                metadata={"previous": previous, "name": unit.name},
                request=request,
            )

        return Response(OrgUnitSerializer(unit).data, status=status.HTTP_200_OK)

    def delete(self, request, slug, pk):
        workspace, error = self.get_workspace(section="org")
        if error:
            return error
        unit = self._get_unit(workspace, pk)
        if unit is None:
            return research_not_found(ResearchErrorCode.ORG_UNIT_NOT_FOUND, "Org unit not found.")
        if not user_can_manage_org_unit(request.user, workspace, unit):
            return research_permission_denied()
        if unit.parent_id is None:
            return research_error(
                ResearchErrorCode.ORG_UNIT_ROOT_UNDELETABLE,
                "The root org unit cannot be deleted.",
            )

        subtree = list(descendants_queryset(unit)) + [unit]
        now = timezone.now()
        OrgUnit.all_objects.filter(pk__in=[node.id for node in subtree]).update(
            is_active=False,
            deleted_at=now,
            updated_at=now,
        )
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.ORG_UNIT_DELETE,
            resource_type=ResearchResourceType.ORG_UNIT,
            resource_id=unit.id,
            org_unit=unit,
            actor=request.user,
            metadata={"name": unit.name, "descendants": len(subtree) - 1},
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResearchOrgUnitMemberListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/org-units/<pk>/members/``"""

    nav_capability = NAV_ORG

    def _get_unit(self, workspace, pk):
        return OrgUnit.objects.filter(workspace=workspace, pk=pk).first()

    def get(self, request, slug, pk):
        workspace, error = self.get_workspace(section="org")
        if error:
            return error
        unit = self._get_unit(workspace, pk)
        if unit is None:
            return research_not_found(ResearchErrorCode.ORG_UNIT_NOT_FOUND, "Org unit not found.")
        members = (
            OrgUnitMember.objects.filter(org_unit=unit)
            .select_related("user")
            .order_by("org_role", "created_at")
        )
        if request.GET.get("org_role"):
            members = members.filter(org_role=request.GET["org_role"].upper())
        data = list(members)
        return Response(
            {"results": OrgUnitMemberSerializer(data, many=True).data, "count": len(data)},
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug, pk):
        workspace, error = self.get_workspace(section="org")
        if error:
            return error
        unit = self._get_unit(workspace, pk)
        if unit is None:
            return research_not_found(ResearchErrorCode.ORG_UNIT_NOT_FOUND, "Org unit not found.")
        if not user_can_manage_org_unit(request.user, workspace, unit):
            return research_permission_denied()

        user = resolve_user(request.data.get("user") or request.data.get("email"))
        if user is None:
            return research_error(ResearchErrorCode.USER_NOT_FOUND, "User not found.")

        org_role = str(request.data.get("org_role") or OrgUnitMember.OrgRole.PI).strip().upper()
        if org_role not in OrgUnitMember.OrgRole.values:
            return research_error(
                ResearchErrorCode.ORG_MEMBER_INVALID,
                "Unknown organisation role.",
            )

        effective_from, error = parse_date(request.data.get("effective_from"), "effective_from")
        if error:
            return error
        effective_to, error = parse_date(request.data.get("effective_to"), "effective_to")
        if error:
            return error
        if effective_from and effective_to and effective_to < effective_from:
            return research_error(
                ResearchErrorCode.ORG_MEMBER_INVALID,
                "effective_to cannot be earlier than effective_from.",
            )

        exists = OrgUnitMember.objects.filter(org_unit=unit, user=user, org_role=org_role).exists()
        if exists:
            return research_error(
                ResearchErrorCode.ORG_MEMBER_EXISTS,
                "This member already holds the role in the org unit.",
            )

        is_primary = truthy(request.data.get("is_primary"))
        try:
            with transaction.atomic():
                if is_primary:
                    OrgUnitMember.objects.filter(workspace=workspace, user=user, is_primary=True).update(
                        is_primary=False
                    )
                member = OrgUnitMember.objects.create(
                    workspace=workspace,
                    org_unit=unit,
                    user=user,
                    org_role=org_role,
                    is_primary=is_primary,
                    effective_from=effective_from or timezone.localdate(),
                    effective_to=effective_to,
                )
        except IntegrityError:
            return research_conflict(
                ResearchErrorCode.ORG_MEMBER_PRIMARY_CONFLICT,
                "The member already has a primary org unit in this workspace.",
            )

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.ORG_MEMBER_ADD,
            resource_type=ResearchResourceType.ORG_UNIT_MEMBER,
            resource_id=member.id,
            org_unit=unit,
            actor=request.user,
            metadata={"user": str(user.id), "org_role": org_role, "is_primary": is_primary},
            request=request,
        )
        # An organisation owner / main PI belongs to the main PI workspace too.
        sync_main_pi_workspace_seat(user, actor=request.user)
        return Response(OrgUnitMemberSerializer(member).data, status=status.HTTP_201_CREATED)


class ResearchOrgUnitMemberDetailEndpoint(ResearchAPIView):
    """``PATCH``/``DELETE /api/research/workspaces/<slug>/org-units/<pk>/members/<member_id>/``"""

    nav_capability = NAV_ORG

    def _get_member(self, workspace, pk, member_id):
        return (
            OrgUnitMember.objects.filter(workspace=workspace, org_unit_id=pk, pk=member_id)
            .select_related("user")
            .first()
        )

    def patch(self, request, slug, pk, member_id):
        workspace, error = self.get_workspace(section="org")
        if error:
            return error
        member = self._get_member(workspace, pk, member_id)
        if member is None:
            return research_not_found(ResearchErrorCode.ORG_MEMBER_NOT_FOUND, "Member not found.")
        if not user_can_manage_org_unit(request.user, workspace, member.org_unit):
            return research_permission_denied()

        fields = []
        previous = {"org_role": member.org_role, "is_primary": member.is_primary}

        org_role = request.data.get("org_role")
        if org_role:
            org_role = str(org_role).strip().upper()
            if org_role not in OrgUnitMember.OrgRole.values:
                return research_error(
                    ResearchErrorCode.ORG_MEMBER_INVALID,
                    "Unknown organisation role.",
                )
            if org_role != member.org_role:
                duplicate = OrgUnitMember.objects.filter(
                    org_unit=member.org_unit,
                    user=member.user,
                    org_role=org_role,
                ).exists()
                if duplicate:
                    return research_error(
                        ResearchErrorCode.ORG_MEMBER_EXISTS,
                        "This member already holds the role in the org unit.",
                    )
                member.org_role = org_role
                fields.append("org_role")

        if "is_primary" in request.data:
            is_primary = truthy(request.data.get("is_primary"))
            if is_primary != member.is_primary:
                member.is_primary = is_primary
                fields.append("is_primary")

        for date_field in ("effective_from", "effective_to"):
            if date_field in request.data:
                value, error = parse_date(request.data.get(date_field), date_field)
                if error:
                    return error
                setattr(member, date_field, value)
                fields.append(date_field)

        if member.effective_from and member.effective_to and member.effective_to < member.effective_from:
            return research_error(
                ResearchErrorCode.ORG_MEMBER_INVALID,
                "effective_to cannot be earlier than effective_from.",
            )

        if not fields:
            return Response(OrgUnitMemberSerializer(member).data, status=status.HTTP_200_OK)

        try:
            with transaction.atomic():
                if member.is_primary:
                    OrgUnitMember.objects.filter(
                        workspace=workspace, user=member.user, is_primary=True
                    ).exclude(pk=member.pk).update(is_primary=False)
                member.save(update_fields=[*fields, "updated_at"])
        except IntegrityError:
            return research_conflict(
                ResearchErrorCode.ORG_MEMBER_PRIMARY_CONFLICT,
                "The member already has a primary org unit in this workspace.",
            )

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.ORG_MEMBER_UPDATE,
            resource_type=ResearchResourceType.ORG_UNIT_MEMBER,
            resource_id=member.id,
            org_unit=member.org_unit,
            actor=request.user,
            metadata={"previous": previous, "org_role": member.org_role, "is_primary": member.is_primary},
            request=request,
        )
        return Response(OrgUnitMemberSerializer(member).data, status=status.HTTP_200_OK)

    def delete(self, request, slug, pk, member_id):
        workspace, error = self.get_workspace(section="org")
        if error:
            return error
        member = self._get_member(workspace, pk, member_id)
        if member is None:
            return research_not_found(ResearchErrorCode.ORG_MEMBER_NOT_FOUND, "Member not found.")
        if not user_can_manage_org_unit(request.user, workspace, member.org_unit):
            return research_permission_denied()

        member.deleted_at = timezone.now()
        member.save(update_fields=["deleted_at", "updated_at"])
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.ORG_MEMBER_REMOVE,
            resource_type=ResearchResourceType.ORG_UNIT_MEMBER,
            resource_id=member.id,
            org_unit=member.org_unit,
            actor=request.user,
            metadata={"user": str(member.user_id), "org_role": member.org_role},
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResearchOrgUnitPiTransferEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/org-units/<pk>/pi/``

    Sets the principal investigator set of a node. Transferring a PI role is a
    pure role change: historical reports and approvals keep their original
    author and reviewer.
    """

    nav_capability = NAV_ORG

    def post(self, request, slug, pk):
        workspace, error = self.get_workspace(section="org")
        if error:
            return error
        unit = OrgUnit.objects.filter(workspace=workspace, pk=pk).first()
        if unit is None:
            return research_not_found(ResearchErrorCode.ORG_UNIT_NOT_FOUND, "Org unit not found.")
        if not user_can_manage_org_unit(request.user, workspace, unit):
            return research_permission_denied()

        raw_ids = request.data.get("user_ids")
        if raw_ids is None:
            raw_ids = []
        if not isinstance(raw_ids, (list, tuple)):
            return research_error(ResearchErrorCode.ORG_MEMBER_INVALID, "user_ids must be a list.")

        resolved = []
        for value in raw_ids:
            user = resolve_user(value)
            if user is None:
                return research_error(
                    ResearchErrorCode.USER_NOT_FOUND,
                    "One of the provided users does not exist.",
                )
            resolved.append(user)

        target_user_ids = {user.id for user in resolved}
        existing = list(OrgUnitMember.objects.filter(org_unit=unit, org_role=OrgUnitMember.OrgRole.PI))
        existing_user_ids = {member.user_id for member in existing}

        added = target_user_ids - existing_user_ids
        removed = existing_user_ids - target_user_ids

        with transaction.atomic():
            now = timezone.now()
            for member in existing:
                if member.user_id in removed:
                    member.deleted_at = now
                    member.save(update_fields=["deleted_at", "updated_at"])
            for user in resolved:
                if user.id in added:
                    OrgUnitMember.objects.create(
                        workspace=workspace,
                        org_unit=unit,
                        user=user,
                        org_role=OrgUnitMember.OrgRole.PI,
                        effective_from=timezone.localdate(),
                    )

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.ORG_PI_TRANSFER,
            resource_type=ResearchResourceType.ORG_UNIT,
            resource_id=unit.id,
            org_unit=unit,
            actor=request.user,
            metadata={
                "added": [str(user_id) for user_id in added],
                "removed": [str(user_id) for user_id in removed],
            },
            request=request,
        )

        for user in resolved:
            sync_main_pi_workspace_seat(user, actor=request.user)

        members = OrgUnitMember.objects.filter(
            org_unit=unit, org_role=OrgUnitMember.OrgRole.PI
        ).select_related("user")
        data = list(members)
        return Response(
            {"results": OrgUnitMemberSerializer(data, many=True).data, "count": len(data)},
            status=status.HTTP_200_OK,
        )


class ResearchMentorBindingListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/mentors/``"""

    nav_capability = NAV_ORG

    def get(self, request, slug):
        workspace, error = self.get_workspace(section="org")
        if error:
            return error
        bindings = MentorBinding.objects.filter(workspace=workspace).select_related("mentee", "mentor")
        if request.GET.get("mentee"):
            bindings = bindings.filter(mentee_id=request.GET["mentee"])
        if request.GET.get("mentor"):
            bindings = bindings.filter(mentor_id=request.GET["mentor"])
        if request.GET.get("org_unit"):
            bindings = bindings.filter(org_unit_id=request.GET["org_unit"])
        if truthy(request.GET.get("active_only")):
            today = timezone.localdate()
            bindings = bindings.filter(effective_from__lte=today).filter(
                Q(effective_to__isnull=True) | Q(effective_to__gte=today)
            )
        data = list(bindings.order_by("created_at"))
        return Response(
            {"results": MentorBindingSerializer(data, many=True).data, "count": len(data)},
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug):
        workspace, error = self.get_workspace(section="org")
        if error:
            return error

        mentee = resolve_user(request.data.get("mentee"))
        mentor = resolve_user(request.data.get("mentor"))
        if mentee is None or mentor is None:
            return research_error(ResearchErrorCode.USER_NOT_FOUND, "Mentee or mentor not found.")
        if mentee.id == mentor.id:
            return research_error(
                ResearchErrorCode.MENTOR_BINDING_INVALID,
                "A research owner cannot be their own direct advisor.",
            )

        org_unit = None
        if request.data.get("org_unit"):
            org_unit = OrgUnit.objects.filter(workspace=workspace, pk=request.data["org_unit"]).first()
            if org_unit is None:
                return research_error(
                    ResearchErrorCode.ORG_UNIT_NOT_FOUND,
                    "Org unit not found.",
                )

        managed = org_unit is not None and user_can_manage_org_unit(request.user, workspace, org_unit)
        if not managed:
            mentee_unit_ids = set(
                OrgUnitMember.objects.filter(
                    workspace=workspace,
                    user=mentee,
                ).values_list("org_unit_id", flat=True)
            )
            managed = any(
                user_can_manage_org_unit(request.user, workspace, unit_id) for unit_id in mentee_unit_ids
            )
        if not managed:
            return research_permission_denied()

        effective_from, error = parse_date(request.data.get("effective_from"), "effective_from")
        if error:
            return error
        effective_to, error = parse_date(request.data.get("effective_to"), "effective_to")
        if error:
            return error
        if effective_from and effective_to and effective_to < effective_from:
            return research_error(
                ResearchErrorCode.MENTOR_BINDING_INVALID,
                "effective_to cannot be earlier than effective_from.",
            )

        if MentorBinding.objects.filter(workspace=workspace, mentee=mentee, mentor=mentor).exists():
            return research_error(
                ResearchErrorCode.MENTOR_BINDING_EXISTS,
                "This direct advisor binding already exists.",
            )

        binding = MentorBinding.objects.create(
            workspace=workspace,
            mentee=mentee,
            mentor=mentor,
            org_unit=org_unit,
            effective_from=effective_from or timezone.localdate(),
            effective_to=effective_to,
        )
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.MENTOR_BINDING_CREATE,
            resource_type=ResearchResourceType.MENTOR_BINDING,
            resource_id=binding.id,
            org_unit=org_unit,
            actor=request.user,
            metadata={"mentee": str(mentee.id), "mentor": str(mentor.id)},
            request=request,
        )
        return Response(MentorBindingSerializer(binding).data, status=status.HTTP_201_CREATED)


class ResearchMentorBindingDetailEndpoint(ResearchAPIView):
    """``DELETE /api/research/workspaces/<slug>/mentors/<pk>/``"""

    nav_capability = NAV_ORG

    def delete(self, request, slug, pk):
        workspace, error = self.get_workspace(section="org")
        if error:
            return error
        binding = MentorBinding.objects.filter(workspace=workspace, pk=pk).select_related("mentee").first()
        if binding is None:
            return research_not_found(
                ResearchErrorCode.MENTOR_BINDING_NOT_FOUND,
                "Mentor binding not found.",
            )

        managed = binding.org_unit_id and user_can_manage_org_unit(
            request.user, workspace, binding.org_unit_id
        )
        if not managed:
            mentee_unit_ids = set(
                OrgUnitMember.objects.filter(
                    workspace=workspace,
                    user_id=binding.mentee_id,
                ).values_list("org_unit_id", flat=True)
            )
            managed = any(
                user_can_manage_org_unit(request.user, workspace, unit_id) for unit_id in mentee_unit_ids
            )
        if not managed:
            return research_permission_denied()

        binding.deleted_at = timezone.now()
        binding.save(update_fields=["deleted_at", "updated_at"])
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.MENTOR_BINDING_DELETE,
            resource_type=ResearchResourceType.MENTOR_BINDING,
            resource_id=binding.id,
            org_unit=binding.org_unit,
            actor=request.user,
            metadata={"mentee": str(binding.mentee_id), "mentor": str(binding.mentor_id)},
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
