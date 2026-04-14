from django.db import IntegrityError
from rest_framework import status
from rest_framework.response import Response

from plane.app.views.base import BaseAPIView
from plane.db.models import (
    Company,
    CompanySettings,
    CompanyMemberRole,
    WorkspaceMember,
    Workspace,
)
from plane.app.serializers import (
    CompanySerializer,
    CompanyLiteSerializer,
    CompanySettingsSerializer,
    CompanyMemberRoleSerializer,
)

# Plane role integer values (from workspace.py ROLE_CHOICES)
ADMIN_ROLE  = 20
MEMBER_ROLE = 15
GUEST_ROLE  = 5
MANAGE_ROLES = [ADMIN_ROLE]


def _get_workspace_member(user, slug):
    """Return the WorkspaceMember for this user in this workspace, or None."""
    return WorkspaceMember.objects.filter(
        workspace__slug=slug,
        member=user,
        is_active=True,
    ).first()


class CompanyViewSet(BaseAPIView):
    """
    CRUD for Companies scoped to a workspace.

    GET    /workspaces/<slug>/companies/           → list
    GET    /workspaces/<slug>/companies/<pk>/      → detail
    POST   /workspaces/<slug>/companies/           → create (Admin only)
    PATCH  /workspaces/<slug>/companies/<pk>/      → update (Admin or HR Manager)
    DELETE /workspaces/<slug>/companies/<pk>/      → delete (Admin only)
    """

    def _base_queryset(self, user, slug):
        member = _get_workspace_member(user, slug)
        if not member:
            return Company.objects.none()
        # Admins see all companies linked to the workspace
        if member.role in MANAGE_ROLES:
            return Company.objects.filter(workspaces__slug=slug).select_related("settings").distinct()
        # Others see only companies they have a role in
        return (
            Company.objects
            .filter(member_roles__member=member, workspaces__slug=slug)
            .select_related("settings")
            .distinct()
        )

    def get(self, request, slug, pk=None):
        if pk:
            company = self._base_queryset(request.user, slug).filter(pk=pk).first()
            if not company:
                return Response({"error": "Company not found."}, status=status.HTTP_404_NOT_FOUND)
            return Response(CompanySerializer(company).data)
        return Response(CompanySerializer(self._base_queryset(request.user, slug), many=True).data)

    def post(self, request, slug):
        member = _get_workspace_member(request.user, slug)
        if not member or member.role not in MANAGE_ROLES:
            return Response({"error": "Only workspace Admins can create companies."}, status=status.HTTP_403_FORBIDDEN)

        serializer = CompanySerializer(data=request.data)
        if serializer.is_valid():
            company = serializer.save()
            CompanySettings.objects.get_or_create(company=company)
            workspace = Workspace.objects.get(slug=slug)
            company.workspaces.add(workspace)
            return Response(CompanySerializer(company).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, slug, pk):
        company = self._base_queryset(request.user, slug).filter(pk=pk).first()
        if not company:
            return Response({"error": "Company not found."}, status=status.HTTP_404_NOT_FOUND)

        member = _get_workspace_member(request.user, slug)
        has_hr_role = CompanyMemberRole.objects.filter(
            company=company, member=member, role="hr_manager"
        ).exists()
        if not has_hr_role and member.role not in MANAGE_ROLES:
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        serializer = CompanySerializer(company, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, pk):
        member = _get_workspace_member(request.user, slug)
        if not member or member.role not in MANAGE_ROLES:
            return Response({"error": "Only workspace Admins can delete companies."}, status=status.HTTP_403_FORBIDDEN)

        company = Company.objects.filter(pk=pk, workspaces__slug=slug).first()
        if not company:
            return Response({"error": "Company not found."}, status=status.HTTP_404_NOT_FOUND)

        company.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CompanySettingsView(BaseAPIView):
    """
    GET   /workspaces/<slug>/companies/<company_pk>/settings/
    PATCH /workspaces/<slug>/companies/<company_pk>/settings/
    """

    def _get(self, request, slug, company_pk, require_write=False):
        member = _get_workspace_member(request.user, slug)
        if not member:
            return None, Response({"error": "Not a workspace member."}, status=status.HTTP_403_FORBIDDEN)

        company = Company.objects.filter(pk=company_pk, workspaces__slug=slug).first()
        if not company:
            return None, Response({"error": "Company not found."}, status=status.HTTP_404_NOT_FOUND)

        if require_write:
            has_role = CompanyMemberRole.objects.filter(company=company, member=member, role="hr_manager").exists()
            if not has_role and member.role not in MANAGE_ROLES:
                return None, Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        settings, _ = CompanySettings.objects.get_or_create(company=company)
        return settings, None

    def get(self, request, slug, company_pk):
        settings, err = self._get(request, slug, company_pk)
        if err:
            return err
        return Response(CompanySettingsSerializer(settings).data)

    def patch(self, request, slug, company_pk):
        settings, err = self._get(request, slug, company_pk, require_write=True)
        if err:
            return err
        serializer = CompanySettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CompanyMemberRoleView(BaseAPIView):
    """
    GET    /workspaces/<slug>/companies/<company_pk>/roles/
    POST   /workspaces/<slug>/companies/<company_pk>/roles/
    DELETE /workspaces/<slug>/companies/<company_pk>/roles/<role_pk>/
    """

    def get(self, request, slug, company_pk):
        member = _get_workspace_member(request.user, slug)
        if not member:
            return Response({"error": "Not a workspace member."}, status=status.HTTP_403_FORBIDDEN)

        roles = CompanyMemberRole.objects.filter(
            company__pk=company_pk,
            company__workspaces__slug=slug,
        ).select_related("member__member")
        return Response(CompanyMemberRoleSerializer(roles, many=True).data)

    def post(self, request, slug, company_pk):
        member = _get_workspace_member(request.user, slug)
        if not member or member.role not in MANAGE_ROLES:
            return Response({"error": "Only Admins can assign company roles."}, status=status.HTTP_403_FORBIDDEN)

        data = {**request.data, "company": company_pk}
        serializer = CompanyMemberRoleSerializer(data=data)
        if serializer.is_valid():
            try:
                serializer.save()
            except IntegrityError:
                return Response({"error": "This role assignment already exists."}, status=status.HTTP_400_BAD_REQUEST)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, company_pk, role_pk):
        member = _get_workspace_member(request.user, slug)
        if not member or member.role not in MANAGE_ROLES:
            return Response({"error": "Only Admins can remove company roles."}, status=status.HTTP_403_FORBIDDEN)

        role = CompanyMemberRole.objects.filter(pk=role_pk, company__pk=company_pk).first()
        if not role:
            return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        role.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
