# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Administrator surfaces for accounts: invite codes, roster import, profiles.

Everything here is gated by :func:`is_research_admin`, so a workspace
administrator and any holder of an instance administrator tag see the same
pages (SYS-ACC-01 ~ SYS-ACC-12).
"""

import csv

from django.db.models import Q
from django.http import HttpResponse
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import (
    OrgUnit,
    OrgUnitMember,
    ResearchInviteCode,
    ResearchUserProfile,
    User,
    UserImportBatch,
)
from plane.research.serializers import (
    InviteCodeSerializer,
    ResearchUserProfileSerializer,
    UserImportBatchSerializer,
    UserImportBatchSummarySerializer,
)
from plane.research.services.accounts import AccountError, issue_invite_code
from plane.research.services.user_import import parse_advisors, parse_students, run_import
from plane.research.utils.audit import ResearchAuditAction, ResearchResourceType, record_audit_event
from plane.research.utils.capabilities import NAV_SYSTEM
from plane.research.utils.errors import (
    ResearchErrorCode,
    research_error,
    research_not_found,
    research_permission_denied,
)
from plane.research.utils.roles import is_account_compat_admin
from plane.research.views.base import ResearchAPIView

ACCOUNT_SECTION = "org"


def _guard(self, request):
    """Resolve the workspace and require research configuration rights.

    The account lifecycle pages sit behind the "system management" navigation
    key as well, so the menu and the endpoints agree (v2.5.0).
    """
    workspace, error = self.get_workspace(section=ACCOUNT_SECTION, nav=NAV_SYSTEM)
    if error:
        return None, error
    if not is_account_compat_admin(request.user, workspace):
        return None, research_permission_denied()
    return workspace, None


def account_error_response(error: AccountError):
    http_status = status.HTTP_400_BAD_REQUEST
    if error.error_code == ResearchErrorCode.PUBLIC_WORKSPACE_MISSING:
        http_status = status.HTTP_409_CONFLICT
    return research_error(error.error_code, error.message, http_status)


class ResearchInviteCodeListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/invite-codes/``"""

    def get(self, request, slug):
        workspace, error = _guard(self, request)
        if error:
            return error
        codes = ResearchInviteCode.objects.filter(workspace=workspace).order_by("-created_at")
        if request.GET.get("status"):
            codes = codes.filter(status=str(request.GET["status"]).upper())
        data = list(codes[:200])
        return Response(
            {"results": InviteCodeSerializer(data, many=True).data, "count": len(data)},
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug):
        workspace, error = _guard(self, request)
        if error:
            return error

        org_unit = None
        org_unit_id = request.data.get("org_unit")
        if org_unit_id:
            org_unit = OrgUnit.objects.filter(workspace=workspace, pk=org_unit_id).first()
            if org_unit is None:
                return research_error(
                    ResearchErrorCode.INVITE_CODE_ORG_ROLE_INVALID,
                    "The org unit does not exist in this workspace.",
                )

        try:
            code = issue_invite_code(
                workspace,
                request.user,
                org_role=request.data.get("org_role") or "",
                org_unit=org_unit,
                max_uses=request.data.get("max_uses") or 1,
                expires_in_days=request.data.get("expires_in_days", 7),
                note=request.data.get("note") or "",
            )
        except AccountError as exc:
            return account_error_response(exc)
        return Response(InviteCodeSerializer(code).data, status=status.HTTP_201_CREATED)


class ResearchInviteCodeDetailEndpoint(ResearchAPIView):
    """``GET``/``PATCH``/``DELETE /api/research/workspaces/<slug>/invite-codes/<pk>/``"""

    def _get(self, workspace, pk):
        return ResearchInviteCode.objects.filter(workspace=workspace, pk=pk).first()

    def get(self, request, slug, pk):
        workspace, error = _guard(self, request)
        if error:
            return error
        code = self._get(workspace, pk)
        if code is None:
            return research_not_found(ResearchErrorCode.INVITE_CODE_NOT_FOUND, "Invite code not found.")
        return Response(InviteCodeSerializer(code).data, status=status.HTTP_200_OK)

    def patch(self, request, slug, pk):
        workspace, error = _guard(self, request)
        if error:
            return error
        code = self._get(workspace, pk)
        if code is None:
            return research_not_found(ResearchErrorCode.INVITE_CODE_NOT_FOUND, "Invite code not found.")

        changed = []
        if "status" in request.data:
            new_status = str(request.data.get("status") or "").upper()
            if new_status not in ResearchInviteCode.Status.values:
                return research_error(
                    ResearchErrorCode.INVITE_CODE_INVALID,
                    "status must be ACTIVE or DISABLED.",
                )
            code.status = new_status
            changed.append("status")
        if "note" in request.data:
            code.note = str(request.data.get("note") or "")[:255]
            changed.append("note")
        if "max_uses" in request.data:
            try:
                max_uses = int(request.data.get("max_uses"))
            except (TypeError, ValueError):
                return research_error(ResearchErrorCode.INVITE_CODE_INVALID, "max_uses must be a number.")
            if max_uses < 1:
                return research_error(
                    ResearchErrorCode.INVITE_CODE_INVALID,
                    "max_uses must be at least 1.",
                )
            code.max_uses = max_uses
            changed.append("max_uses")
        if "org_role" in request.data:
            org_role = str(request.data.get("org_role") or "").upper()
            if org_role and org_role not in OrgUnitMember.OrgRole.values:
                return research_error(
                    ResearchErrorCode.INVITE_CODE_ORG_ROLE_INVALID,
                    "Unknown organisation role.",
                )
            code.org_role = org_role
            changed.append("org_role")
        if "org_unit" in request.data:
            unit_id = request.data.get("org_unit")
            if unit_id:
                unit = OrgUnit.objects.filter(workspace=workspace, pk=unit_id).first()
                if unit is None:
                    return research_error(
                        ResearchErrorCode.INVITE_CODE_ORG_ROLE_INVALID,
                        "The org unit does not exist in this workspace.",
                    )
                code.org_unit = unit
            else:
                code.org_unit = None
            changed.append("org_unit")

        if changed:
            code.save(update_fields=sorted(set(changed) | {"updated_at"}))
            record_audit_event(
                workspace=workspace,
                action=ResearchAuditAction.INVITE_CODE_UPDATE,
                resource_type=ResearchResourceType.INVITE_CODE,
                resource_id=code.id,
                actor=request.user,
                metadata={"fields": sorted(set(changed))},
                request=request,
            )
        return Response(InviteCodeSerializer(code).data, status=status.HTTP_200_OK)

    def delete(self, request, slug, pk):
        workspace, error = _guard(self, request)
        if error:
            return error
        code = self._get(workspace, pk)
        if code is None:
            return research_not_found(ResearchErrorCode.INVITE_CODE_NOT_FOUND, "Invite code not found.")
        code.delete()
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.INVITE_CODE_DELETE,
            resource_type=ResearchResourceType.INVITE_CODE,
            resource_id=code.id,
            actor=request.user,
            metadata={"code_suffix": code.code[-4:]},
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

class ResearchInviteCodeToggleEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/invite-codes/<pk>/enable|disable/``"""

    def post(self, request, slug, pk, action):
        workspace, error = _guard(self, request)
        if error:
            return error
        code = ResearchInviteCode.objects.filter(workspace=workspace, pk=pk).first()
        if code is None:
            return research_not_found(ResearchErrorCode.INVITE_CODE_NOT_FOUND, "Invite code not found.")

        action = str(action or "").lower()
        if action not in ("enable", "disable"):
            return research_error(ResearchErrorCode.INVITE_CODE_INVALID, "Unknown action.")

        code.status = (
            ResearchInviteCode.Status.ACTIVE
            if action == "enable"
            else ResearchInviteCode.Status.DISABLED
        )
        code.save(update_fields=["status", "updated_at"])
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.INVITE_CODE_UPDATE,
            resource_type=ResearchResourceType.INVITE_CODE,
            resource_id=code.id,
            actor=request.user,
            metadata={"status": code.status},
            request=request,
        )
        return Response(InviteCodeSerializer(code).data, status=status.HTTP_200_OK)


class ResearchUserImportListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/user-imports/``"""

    def get(self, request, slug):
        workspace, error = _guard(self, request)
        if error:
            return error
        batches = UserImportBatch.objects.filter(workspace=workspace).order_by("-created_at")[:50]
        data = list(batches)
        return Response(
            {"results": UserImportBatchSummarySerializer(data, many=True).data, "count": len(data)},
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug):
        workspace, error = _guard(self, request)
        if error:
            return error

        students_file = request.FILES.get("students")
        if students_file is None:
            return research_error(
                ResearchErrorCode.IMPORT_FILE_REQUIRED,
                "A student roster file is required.",
            )
        advisors_file = request.FILES.get("advisors")
        dry_run = str(request.data.get("dry_run", "")).strip().lower() in ("1", "true", "yes", "on")
        reset_passwords = str(request.data.get("reset_passwords", "")).strip().lower() in (
            "1",
            "true",
            "yes",
            "on",
        )

        try:
            students = parse_students(students_file.read(), students_file.name)
            advisor_map = parse_advisors(advisors_file.read(), advisors_file.name) if advisors_file else {}
        except AccountError as exc:
            return account_error_response(exc)

        batch = run_import(
            workspace,
            request.user,
            students,
            advisor_map=advisor_map,
            dry_run=dry_run,
            source_filename=students_file.name,
            request=request,
            reset_passwords=reset_passwords,
        )
        batch.prefetched_rows = list(batch.rows.all())
        return Response(
            UserImportBatchSerializer(batch).data,
            status=status.HTTP_201_CREATED,
        )


class ResearchUserImportDetailEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/user-imports/<pk>/``"""

    def get(self, request, slug, pk):
        workspace, error = _guard(self, request)
        if error:
            return error
        batch = self._batch(workspace, pk)
        if batch is None:
            return research_not_found(
                ResearchErrorCode.IMPORT_BATCH_NOT_FOUND,
                "Import batch not found.",
            )
        batch.prefetched_rows = list(batch.rows.select_related("user").all())
        return Response(UserImportBatchSerializer(batch).data, status=status.HTTP_200_OK)

    def _batch(self, workspace, pk):
        return UserImportBatch.objects.filter(workspace=workspace, pk=pk).first()


class ResearchUserImportReportEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/user-imports/<pk>/report/``

    CSV report: per-row outcome plus the one-time credentials handed out to
    newly created accounts (administrators only).
    """

    def get(self, request, slug, pk):
        workspace, error = _guard(self, request)
        if error:
            return error
        batch = UserImportBatch.objects.filter(workspace=workspace, pk=pk).first()
        if batch is None:
            return research_not_found(
                ResearchErrorCode.IMPORT_BATCH_NOT_FOUND,
                "Import batch not found.",
            )

        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="import-{batch.id}.csv"'
        response.write("\ufeff")
        writer = csv.writer(response)
        writer.writerow(
            ["行号", "姓名", "邮箱", "学号", "分组", "负责导师", "状态", "说明", "初始密码"]
        )
        for row in batch.rows.select_related("user").order_by("row_number"):
            writer.writerow(
                [
                    row.row_number,
                    row.display_name,
                    row.email,
                    row.student_no,
                    row.group_label,
                    row.advisor_name,
                    row.status,
                    row.message,
                    row.initial_password,
                ]
            )
        return response


class ResearchUserProfileListEndpoint(ResearchAPIView):
    """``GET``/``PATCH /api/research/workspaces/<slug>/user-profiles/``"""

    def get(self, request, slug):
        workspace, error = _guard(self, request)
        if error:
            return error
        profiles = ResearchUserProfile.objects.select_related("user").order_by("created_at")
        search = request.GET.get("search")
        if search:
            profiles = profiles.filter(
                Q(student_no__icontains=search)
                | Q(user__email__icontains=search)
                | Q(user__display_name__icontains=search)
                | Q(group_label__icontains=search)
            )
        if request.GET.get("category"):
            profiles = profiles.filter(category=str(request.GET["category"]).upper())
        data = list(profiles[:500])
        return Response(
            {"results": ResearchUserProfileSerializer(data, many=True).data, "count": len(data)},
            status=status.HTTP_200_OK,
        )

    def patch(self, request, slug):
        workspace, error = _guard(self, request)
        if error:
            return error
        user = (
            User.objects.filter(pk=request.data.get("user")).first()
            if request.data.get("user")
            else User.objects.filter(email__iexact=str(request.data.get("email") or "")).first()
        )
        if user is None:
            return research_error(ResearchErrorCode.USER_NOT_FOUND, "User not found.")
        profile, _created = ResearchUserProfile.objects.get_or_create(user=user)
        changed = []
        for field_name in ("student_no", "grade", "degree", "phone", "group_label"):
            if field_name in request.data:
                setattr(profile, field_name, str(request.data.get(field_name) or "").strip())
                changed.append(field_name)
        if "category" in request.data:
            category = str(request.data.get("category") or "").upper()
            if category not in ResearchUserProfile.Category.values:
                return research_error(ResearchErrorCode.USER_PROFILE_NOT_FOUND, "Unknown category.")
            profile.category = category
            changed.append("category")
        if changed:
            profile.save(update_fields=sorted(set(changed) | {"updated_at"}))
            record_audit_event(
                workspace=workspace,
                action=ResearchAuditAction.USER_PROFILE_UPDATE,
                resource_type=ResearchResourceType.USER_PROFILE,
                resource_id=profile.id,
                actor=request.user,
                metadata={"user": str(user.id), "fields": sorted(set(changed))},
                request=request,
            )
        return Response(ResearchUserProfileSerializer(profile).data, status=status.HTTP_200_OK)
