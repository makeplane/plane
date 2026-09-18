# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Administrator surfaces for accounts: invite codes, roster import, profiles.

Everything here is gated by :func:`is_research_admin`, so a workspace
administrator and any holder of an instance administrator tag see the same
pages (SYS-ACC-01 ~ SYS-ACC-12).
"""

import csv

from django.conf import settings
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
    UserImportRow,
    WorkspaceMember,
)
from plane.research.serializers import (
    InviteCodeSerializer,
    ResearchUserProfileSerializer,
    UserImportBatchSerializer,
    UserImportBatchSummarySerializer,
    UserImportRowSerializer,
)
from plane.research.services.accounts import AccountError, issue_invite_code
from plane.research.services.user_import import (
    approve_review_batch,
    bulk_exclude_review_rows,
    create_review_batch,
    parse_advisors,
    parse_students,
    reject_review_batch,
    update_review_row,
)
from plane.research.utils.audit import ResearchAuditAction, ResearchResourceType, record_audit_event
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
    workspace, error = self.get_workspace(section=ACCOUNT_SECTION, nav=None)
    if error:
        return None, error
    if not is_account_compat_admin(request.user, workspace):
        return None, research_permission_denied()
    return workspace, None


def account_error_response(error: AccountError):
    http_status = status.HTTP_400_BAD_REQUEST
    if error.error_code in (
        ResearchErrorCode.PUBLIC_WORKSPACE_MISSING,
        ResearchErrorCode.IMPORT_EXISTING_MEMBER,
        ResearchErrorCode.IMPORT_IN_PROGRESS,
        ResearchErrorCode.IMPORT_BATCH_NOT_REVIEWABLE,
        ResearchErrorCode.IMPORT_REVIEW_INCOMPLETE,
    ):
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

        profile_category = str(request.data.get("profile_category") or "STUDENT").strip().upper()
        if profile_category not in ResearchUserProfile.Category.values:
            return research_error(
                ResearchErrorCode.INVITE_CODE_INVALID,
                "Unknown research profile category.",
            )
        primary_advisor = None
        primary_advisor_id = request.data.get("primary_advisor")
        if primary_advisor_id:
            primary_advisor = User.objects.filter(
                pk=primary_advisor_id,
                member_workspace__workspace=workspace,
                member_workspace__is_active=True,
                member_workspace__deleted_at__isnull=True,
            ).first()
            if primary_advisor is None:
                return research_error(
                    ResearchErrorCode.INVITE_CODE_INVALID,
                    "The primary advisor must be an active member of this workspace.",
                )
        requested_role = str(request.data.get("org_role") or "").strip().upper()
        if requested_role not in ("", OrgUnitMember.OrgRole.REVIEWER):
            return research_error(
                ResearchErrorCode.INVITE_CODE_ORG_ROLE_INVALID,
                "New invite codes can only provision ordinary research members.",
            )

        try:
            code = issue_invite_code(
                workspace,
                request.user,
                org_role=OrgUnitMember.OrgRole.REVIEWER,
                org_unit=org_unit,
                provisioning_version=2,
                profile_category=profile_category,
                primary_advisor=primary_advisor,
                max_uses=request.data.get("max_uses") or 1,
                expires_in_days=request.data.get("expires_in_days", 7),
                note=request.data.get("note") or "",
            )
        except AccountError as exc:
            return account_error_response(exc)
        return Response(InviteCodeSerializer(code).data, status=status.HTTP_201_CREATED)


class ResearchAccountProvisioningOptionsEndpoint(ResearchAPIView):
    """Existing organisations and members usable by account provisioning flows."""

    def get(self, request, slug):
        workspace, error = _guard(self, request)
        if error:
            return error

        units = list(
            OrgUnit.objects.filter(workspace=workspace, is_active=True, deleted_at__isnull=True)
            .select_related("parent")
            .order_by("depth", "sort_order", "name")
        )
        units_by_id = {unit.id: unit for unit in units}

        def display_path(unit):
            names = []
            current = unit
            while current is not None:
                names.append(current.name)
                current = units_by_id.get(current.parent_id)
            return " / ".join(reversed(names))

        memberships = (
            WorkspaceMember.objects.filter(
                workspace=workspace,
                is_active=True,
                deleted_at__isnull=True,
                member__is_active=True,
            )
            .select_related("member")
            .order_by("member__display_name", "member__email")
        )
        return Response(
            {
                "profile_categories": [
                    {"value": value, "label": label}
                    for value, label in ResearchUserProfile.Category.choices
                ],
                "org_units": [
                    {
                        "id": str(unit.id),
                        "name": unit.name,
                        "display_path": display_path(unit),
                        "business_category": unit.business_category,
                    }
                    for unit in units
                ],
                "advisors": [
                    {
                        "id": str(membership.member_id),
                        "email": membership.member.email,
                        "display_name": membership.member.display_name,
                    }
                    for membership in memberships
                ],
            },
            status=status.HTTP_200_OK,
        )


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
            if org_role not in ("", OrgUnitMember.OrgRole.REVIEWER):
                return research_error(
                    ResearchErrorCode.INVITE_CODE_ORG_ROLE_INVALID,
                    "Invite codes can only provision ordinary research members.",
                )
            code.org_role = OrgUnitMember.OrgRole.REVIEWER
            code.provisioning_version = 2
            changed.append("org_role")
            changed.append("provisioning_version")
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
        if "profile_category" in request.data:
            profile_category = str(request.data.get("profile_category") or "STUDENT").upper()
            if profile_category not in ResearchUserProfile.Category.values:
                return research_error(ResearchErrorCode.INVITE_CODE_INVALID, "Unknown research profile category.")
            code.profile_category = profile_category
            code.org_role = OrgUnitMember.OrgRole.REVIEWER
            code.provisioning_version = 2
            changed.extend(("profile_category", "org_role", "provisioning_version"))
        if "primary_advisor" in request.data:
            advisor_id = request.data.get("primary_advisor")
            advisor = None
            if advisor_id:
                advisor = User.objects.filter(
                    pk=advisor_id,
                    is_active=True,
                    member_workspace__workspace=workspace,
                    member_workspace__is_active=True,
                    member_workspace__deleted_at__isnull=True,
                ).first()
                if advisor is None:
                    return research_error(
                        ResearchErrorCode.INVITE_CODE_INVALID,
                        "The primary advisor must be an active member of this workspace.",
                    )
            code.primary_advisor = advisor
            code.org_role = OrgUnitMember.OrgRole.REVIEWER
            code.provisioning_version = 2
            changed.extend(("primary_advisor", "org_role", "provisioning_version"))

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
        if advisors_file is None:
            return research_error(
                ResearchErrorCode.IMPORT_FILE_REQUIRED,
                "An advisor name-to-email mapping file is required.",
            )
        allowed_extensions = (".csv", ".xlsx")
        for uploaded in (students_file, advisors_file):
            if not str(uploaded.name or "").lower().endswith(allowed_extensions):
                return research_error(ResearchErrorCode.IMPORT_FILE_INVALID, "Only CSV and XLSX files are supported.")
            if uploaded.size > settings.FILE_SIZE_LIMIT:
                return research_error(ResearchErrorCode.IMPORT_FILE_INVALID, "The import file is too large.")
        reset_passwords = str(request.data.get("reset_passwords", "")).strip().lower() in (
            "1",
            "true",
            "yes",
            "on",
        )
        try:
            students = parse_students(students_file.read(), students_file.name)
            advisor_map = parse_advisors(advisors_file.read(), advisors_file.name)
        except AccountError as exc:
            return account_error_response(exc)

        try:
            batch = create_review_batch(
                workspace,
                request.user,
                students,
                advisor_map=advisor_map,
                source_filename=students_file.name,
                reset_passwords=reset_passwords,
            )
        except AccountError as exc:
            return account_error_response(exc)
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


class ResearchUserImportRowEndpoint(ResearchAPIView):
    """``PATCH .../user-imports/<pk>/rows/<row_id>/``"""

    def patch(self, request, slug, pk, row_id):
        workspace, error = _guard(self, request)
        if error:
            return error
        try:
            row = update_review_row(workspace, pk, row_id, request.data)
        except AccountError as exc:
            return account_error_response(exc)
        return Response(UserImportRowSerializer(row).data, status=status.HTTP_200_OK)


class ResearchUserImportApproveEndpoint(ResearchAPIView):
    """``POST .../user-imports/<pk>/approve/``"""

    def post(self, request, slug, pk):
        workspace, error = _guard(self, request)
        if error:
            return error
        try:
            batch = approve_review_batch(workspace, request.user, pk, request=request)
        except AccountError as exc:
            return account_error_response(exc)
        batch.prefetched_rows = list(batch.rows.select_related("user").all())
        return Response(UserImportBatchSerializer(batch).data, status=status.HTTP_200_OK)


class ResearchUserImportBulkExcludeEndpoint(ResearchAPIView):
    def post(self, request, slug, pk):
        workspace, error = _guard(self, request)
        if error:
            return error
        row_ids = request.data.get("row_ids")
        if not isinstance(row_ids, list) or len(row_ids) > 1000:
            return research_error(ResearchErrorCode.IMPORT_ROW_INVALID, "row_ids must contain at most 1000 rows.")
        try:
            updated = bulk_exclude_review_rows(workspace, pk, row_ids, request.data.get("note"))
        except AccountError as exc:
            return account_error_response(exc)
        return Response({"updated": updated}, status=status.HTTP_200_OK)


class ResearchUserImportRejectEndpoint(ResearchAPIView):
    """``POST .../user-imports/<pk>/reject/``"""

    def post(self, request, slug, pk):
        workspace, error = _guard(self, request)
        if error:
            return error
        reason = str(request.data.get("reason") or "").strip()
        if not reason:
            return research_error(ResearchErrorCode.IMPORT_ROW_INVALID, "A rejection reason is required.")
        try:
            batch = reject_review_batch(workspace, request.user, pk, reason, request=request)
        except AccountError as exc:
            return account_error_response(exc)
        batch.prefetched_rows = list(batch.rows.all())
        return Response(UserImportBatchSerializer(batch).data, status=status.HTTP_200_OK)


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
        if batch.status != UserImportBatch.Status.IMPORTED:
            return research_error(
                ResearchErrorCode.IMPORT_BATCH_NOT_REVIEWABLE,
                "The report is available after approval.",
                status.HTTP_409_CONFLICT,
            )

        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="import-{batch.id}.csv"'
        response.write("\ufeff")
        writer = csv.writer(response)
        writer.writerow(
            [
                "行号",
                "姓名",
                "邮箱",
                "学号",
                "手机号",
                "年级",
                "人员类别",
                "业务方向",
                "小组",
                "主导师",
                "联合导师1",
                "联合导师2",
                "状态",
                "说明",
                "初始密码",
            ]
        )
        for row in batch.rows.select_related("user").order_by("row_number"):
            report_status = "EXCLUDED" if row.review_decision == UserImportRow.ReviewDecision.EXCLUDED else row.status
            writer.writerow(
                [
                    row.row_number,
                    row.display_name,
                    row.email,
                    row.student_no,
                    row.raw.get("phone", ""),
                    row.raw.get("grade", ""),
                    row.raw.get("category", ""),
                    row.raw.get("business_category", ""),
                    row.raw.get("group", row.group_label),
                    row.raw.get("primary_advisor_name", row.advisor_name),
                    row.raw.get("co_advisor_1_name", ""),
                    row.raw.get("co_advisor_2_name", ""),
                    report_status,
                    row.message,
                    row.initial_password,
                ]
            )
        for source in batch.created_accounts.select_related("user").filter(
            kind="ADVISOR"
        ).order_by("created_at"):
            writer.writerow(
                [
                    "导师表",
                    source.user.display_name,
                    source.user.email,
                    "",
                    "",
                    "",
                    "ADVISOR",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "OK",
                    "导师账号",
                    source.initial_password,
                ]
            )
        return response


class ResearchUserProfileListEndpoint(ResearchAPIView):
    """``GET``/``PATCH /api/research/workspaces/<slug>/user-profiles/``"""

    def get(self, request, slug):
        workspace, error = _guard(self, request)
        if error:
            return error
        profiles = (
            ResearchUserProfile.objects.select_related("user")
            .filter(
                user__member_workspace__workspace=workspace,
                user__member_workspace__is_active=True,
                user__member_workspace__deleted_at__isnull=True,
            )
            .distinct()
            .order_by("created_at")
        )
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
        user_queryset = User.objects.filter(
            member_workspace__workspace=workspace,
            member_workspace__is_active=True,
            member_workspace__deleted_at__isnull=True,
        ).distinct()
        user = (
            user_queryset.filter(pk=request.data.get("user")).first()
            if request.data.get("user")
            else user_queryset.filter(email__iexact=str(request.data.get("email") or "")).first()
        )
        if user is None:
            return research_error(
                ResearchErrorCode.USER_NOT_FOUND,
                "User not found in this workspace.",
                status.HTTP_404_NOT_FOUND,
            )
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
