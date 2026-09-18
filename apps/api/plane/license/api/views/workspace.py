# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError, transaction
from django.db.models import OuterRef, Func, F
from django.utils import timezone

# Module imports
from plane.app.views.base import BaseAPIView
from plane.license.api.permissions import InstanceAdminPermission
from plane.db.models import Workspace, WorkspaceMember, WorkspaceResearchSetting, Project
from plane.license.api.serializers import WorkspaceSerializer
from plane.utils.constants import RESTRICTED_WORKSPACE_SLUGS


class InstanceWorkSpaceAvailabilityCheckEndpoint(BaseAPIView):
    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        slug = request.GET.get("slug", False)

        if not slug or slug == "":
            return Response(
                {"error": "Workspace Slug is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.filter(slug__iexact=slug).exists() or slug in RESTRICTED_WORKSPACE_SLUGS
        return Response({"status": not workspace}, status=status.HTTP_200_OK)


class InstanceWorkSpaceEndpoint(BaseAPIView):
    model = Workspace
    serializer_class = WorkspaceSerializer
    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        project_count = (
            Project.objects.filter(workspace_id=OuterRef("id"))
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count")
        )

        member_count = (
            WorkspaceMember.objects.filter(workspace=OuterRef("id"), member__is_bot=False, is_active=True)
            .select_related("owner")
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count")
        )

        workspaces = (
            Workspace.objects.select_related("research_setting")
            .prefetch_related("research_setting__private_access_grants")
            .annotate(
                total_projects=project_count,
                total_members=member_count,
            )
        )

        # Add search functionality
        search = request.query_params.get("search", None)
        if search:
            workspaces = workspaces.filter(name__icontains=search)

        return self.paginate(
            request=request,
            queryset=workspaces,
            on_results=lambda results: WorkspaceSerializer(results, many=True).data,
            max_per_page=10,
            default_per_page=10,
        )

    def post(self, request):
        try:
            serializer = WorkspaceSerializer(data=request.data)

            slug = request.data.get("slug", False)
            name = request.data.get("name", False)

            if not name or not slug:
                return Response(
                    {"error": "Both name and slug are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if len(name) > 80 or len(slug) > 48:
                return Response(
                    {"error": "The maximum length for name is 80 and for slug is 48"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if serializer.is_valid(raise_exception=True):
                purpose = str(request.data.get("research_purpose") or WorkspaceResearchSetting.Purpose.GENERAL)
                if purpose not in WorkspaceResearchSetting.Purpose.values:
                    return Response({"error": "Invalid research_purpose"}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
                if purpose == WorkspaceResearchSetting.Purpose.PI_PRIVATE and WorkspaceResearchSetting.objects.filter(
                    purpose=purpose,
                    deleted_at__isnull=True,
                ).exists():
                    return Response(
                        {"error": "Only one PI-private workspace is allowed"},
                        status=status.HTTP_409_CONFLICT,
                    )
                with transaction.atomic():
                    workspace = serializer.save(owner=request.user)
                    WorkspaceResearchSetting.objects.create(
                        workspace=workspace,
                        purpose=purpose,
                        module_enabled=False,
                        created_by=request.user,
                    )
                    # Create Workspace member
                    _ = WorkspaceMember.objects.create(
                        workspace=workspace,
                        member=request.user,
                        role=20,
                        company_role=request.data.get("company_role", ""),
                    )
                return Response(WorkspaceSerializer(workspace).data, status=status.HTTP_201_CREATED)
            return Response(
                [serializer.errors[error][0] for error in serializer.errors],
                status=status.HTTP_400_BAD_REQUEST,
            )

        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"slug": "The workspace with the slug already exists"},
                    status=status.HTTP_409_CONFLICT,
                )


class InstanceWorkspaceResearchEndpoint(BaseAPIView):
    """Configure workspace purpose, main PI and explicit private access."""

    permission_classes = [InstanceAdminPermission]

    @transaction.atomic
    def patch(self, request, pk):
        workspace = Workspace.objects.select_for_update().filter(pk=pk, deleted_at__isnull=True).first()
        if workspace is None:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        setting, _ = WorkspaceResearchSetting.objects.select_for_update().get_or_create(
            workspace=workspace,
            defaults={"created_by": request.user},
        )
        requested_purpose = (
            str(request.data.get("purpose") or "")
            if "purpose" in request.data
            else setting.purpose
        )
        if requested_purpose not in WorkspaceResearchSetting.Purpose.values:
            return Response({"error": "Invalid purpose"}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        if request.data.get("main_pi") and requested_purpose == WorkspaceResearchSetting.Purpose.GENERAL:
            return Response(
                {"error": "A general workspace cannot have a main PI"},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        if "private_access_users" in request.data and requested_purpose != WorkspaceResearchSetting.Purpose.PI_PRIVATE:
            return Response(
                {"error": "Private access grants are only valid for a PI-private workspace"},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        previous_main_pi = setting.main_pi
        previous_purpose = setting.purpose
        changed_admission = False
        admission_user_ids = set()
        purpose = setting.purpose
        if "purpose" in request.data:
            purpose = requested_purpose
            if purpose == WorkspaceResearchSetting.Purpose.PI_PRIVATE and WorkspaceResearchSetting.objects.filter(
                purpose=purpose,
                deleted_at__isnull=True,
            ).exclude(pk=setting.pk).exists():
                return Response(
                    {"error": "Only one PI-private workspace is allowed"},
                    status=status.HTTP_409_CONFLICT,
                )
            if purpose != setting.purpose:
                admission_user_ids.update(
                    WorkspaceMember.objects.filter(workspace=workspace).values_list("member_id", flat=True)
                )
                changed_admission = True
            setting.purpose = purpose
            if purpose == WorkspaceResearchSetting.Purpose.PI_PRIVATE:
                setting.module_enabled = False
            if previous_purpose == WorkspaceResearchSetting.Purpose.PI_PRIVATE and purpose != previous_purpose:
                revoked_user_ids = list(
                    setting.private_access_grants.values_list("user_id", flat=True)
                )
                if previous_main_pi is not None:
                    revoked_user_ids.append(previous_main_pi.id)
                admission_user_ids.update(revoked_user_ids)
                setting.private_access_grants.update(deleted_at=timezone.now())
                WorkspaceMember.objects.filter(
                    workspace=workspace,
                    member_id__in=revoked_user_ids,
                    is_active=True,
                ).update(is_active=False)
            if purpose == WorkspaceResearchSetting.Purpose.GENERAL:
                setting.main_pi = None
                if (
                    previous_purpose == WorkspaceResearchSetting.Purpose.PUBLIC_RESEARCH
                    and previous_main_pi is not None
                ):
                    paired_private = WorkspaceResearchSetting.objects.filter(
                        purpose=WorkspaceResearchSetting.Purpose.PI_PRIVATE,
                        main_pi=previous_main_pi,
                        deleted_at__isnull=True,
                    ).first()
                    if paired_private is not None:
                        paired_private.main_pi = None
                        paired_private.save(update_fields=["main_pi", "updated_at"])
                    admission_user_ids.add(previous_main_pi.id)
        if "main_pi" in request.data:
            from plane.db.models import User

            main_pi = None
            if request.data.get("main_pi"):
                main_pi_reference = str(request.data["main_pi"]).strip()
                if "@" in main_pi_reference:
                    main_pi = User.objects.filter(email__iexact=main_pi_reference, is_active=True).first()
                else:
                    try:
                        main_pi = User.objects.filter(pk=main_pi_reference, is_active=True).first()
                    except (TypeError, ValueError):
                        main_pi = None
                if main_pi is None:
                    return Response({"error": "Main PI not found"}, status=status.HTTP_404_NOT_FOUND)
            setting.main_pi = main_pi
            if purpose in (
                WorkspaceResearchSetting.Purpose.PUBLIC_RESEARCH,
                WorkspaceResearchSetting.Purpose.PI_PRIVATE,
            ):
                paired_purpose = (
                    WorkspaceResearchSetting.Purpose.PI_PRIVATE
                    if purpose == WorkspaceResearchSetting.Purpose.PUBLIC_RESEARCH
                    else WorkspaceResearchSetting.Purpose.PUBLIC_RESEARCH
                )
                paired_setting = WorkspaceResearchSetting.objects.filter(
                    purpose=paired_purpose,
                    deleted_at__isnull=True,
                ).first()
                if paired_setting is not None:
                    admission_user_ids.update(
                        candidate
                        for candidate in (paired_setting.main_pi_id, main_pi.id if main_pi else None)
                        if candidate is not None
                    )
                    paired_setting.main_pi = main_pi
                    paired_setting.save(update_fields=["main_pi", "updated_at"])
            changed_admission = True
        if "module_enabled" in request.data:
            module_enabled = request.data.get("module_enabled")
            if not isinstance(module_enabled, bool):
                return Response(
                    {"error": "`module_enabled` must be a boolean"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if purpose == WorkspaceResearchSetting.Purpose.PI_PRIVATE and module_enabled:
                return Response(
                    {"error": "Research is disabled for PI-private workspaces"},
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )
            setting.module_enabled = module_enabled
        setting.save()

        if "private_access_users" in request.data:
            from plane.db.models import ResearchWorkspaceAccessGrant, User

            raw_users = request.data.get("private_access_users") or []
            if not isinstance(raw_users, list):
                return Response({"error": "private_access_users must be a list"}, status=status.HTTP_400_BAD_REQUEST)
            admission_user_ids.update(setting.private_access_grants.values_list("user_id", flat=True))
            requested_user_ids = {str(user_id) for user_id in raw_users}
            users = list(User.objects.filter(pk__in=requested_user_ids, is_active=True))
            if len(users) != len(requested_user_ids):
                return Response({"error": "One or more users were not found"}, status=status.HTTP_404_NOT_FOUND)
            ResearchWorkspaceAccessGrant.objects.filter(setting=setting).exclude(user__in=users).update(
                deleted_at=timezone.now()
            )
            for user in users:
                grant = ResearchWorkspaceAccessGrant.all_objects.filter(
                    setting=setting,
                    user=user,
                    deleted_at__isnull=False,
                ).first()
                if grant:
                    grant.deleted_at = None
                    grant.granted_by = request.user
                    grant.save(update_fields=["deleted_at", "granted_by", "updated_at"])
                else:
                    ResearchWorkspaceAccessGrant.objects.get_or_create(
                        setting=setting,
                        user=user,
                        defaults={"granted_by": request.user, "created_by": request.user},
                    )
            changed_admission = True

        if changed_admission:
            from plane.research.utils.roles import sync_admin_workspace_membership

            user_ids = set(setting.private_access_grants.values_list("user_id", flat=True))
            user_ids.update(admission_user_ids)
            if previous_main_pi is not None:
                user_ids.add(previous_main_pi.id)
            if setting.main_pi_id:
                user_ids.add(setting.main_pi_id)
            from plane.db.models import User

            for user in User.objects.filter(id__in=user_ids):
                sync_admin_workspace_membership(user, actor=request.user)

            if setting.main_pi_id and purpose == WorkspaceResearchSetting.Purpose.PUBLIC_RESEARCH:
                member, created = WorkspaceMember.objects.get_or_create(
                    workspace=workspace,
                    member_id=setting.main_pi_id,
                    defaults={"role": 15, "created_by": request.user},
                )
                if not created and not member.is_active:
                    member.is_active = True
                    member.save(update_fields=["is_active", "updated_at"])
            if setting.main_pi_id and purpose == WorkspaceResearchSetting.Purpose.PI_PRIVATE:
                paired_public = WorkspaceResearchSetting.objects.filter(
                    purpose=WorkspaceResearchSetting.Purpose.PUBLIC_RESEARCH,
                    main_pi_id=setting.main_pi_id,
                    deleted_at__isnull=True,
                ).select_related("workspace").first()
                if paired_public is not None:
                    member, created = WorkspaceMember.objects.get_or_create(
                        workspace=paired_public.workspace,
                        member_id=setting.main_pi_id,
                        defaults={"role": 15, "created_by": request.user},
                    )
                    if not created and not member.is_active:
                        member.is_active = True
                        member.save(update_fields=["is_active", "updated_at"])

        return Response(WorkspaceSerializer(workspace).data, status=status.HTTP_200_OK)
