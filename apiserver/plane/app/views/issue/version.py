# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import (
    IssueVersion,
    IssueDescriptionVersion,
    Project,
    ProjectMember,
    Issue,
)
from ..base import BaseAPIView
from plane.app.serializers import (
    IssueVersionDetailSerializer,
    IssueDescriptionVersionDetailSerializer,
)
from plane.app.permissions import allow_permission, ROLE
from plane.utils.global_paginator import paginate
from plane.utils.timezone_converter import user_timezone_converter


class IssueVersionEndpoint(BaseAPIView):
    def process_paginated_result(self, fields, results, timezone):
        paginated_data = results.values(*fields)

        datetime_fields = ["created_at", "updated_at"]
        paginated_data = user_timezone_converter(
            paginated_data, datetime_fields, timezone
        )

        return paginated_data

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id, pk=None):
        if pk:
            issue_version = IssueVersion.objects.get(
                workspace__slug=slug, project_id=project_id, issue_id=issue_id, pk=pk
            )

            serializer = IssueVersionDetailSerializer(issue_version)
            return Response(serializer.data, status=status.HTTP_200_OK)

        cursor = request.GET.get("cursor", None)

        required_fields = [
            "id",
            "workspace",
            "project",
            "issue",
            "last_saved_at",
            "owned_by",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

        issue_versions_queryset = IssueVersion.objects.filter(
            workspace__slug=slug, project_id=project_id, issue_id=issue_id
        )

        paginated_data = paginate(
            base_queryset=issue_versions_queryset,
            queryset=issue_versions_queryset,
            cursor=cursor,
            on_result=lambda results: self.process_paginated_result(
                required_fields, results, request.user.user_timezone
            ),
        )

        return Response(paginated_data, status=status.HTTP_200_OK)


class WorkItemDescriptionVersionEndpoint(BaseAPIView):
    def process_paginated_result(self, fields, results, timezone):
        paginated_data = results.values(*fields)

        datetime_fields = ["created_at", "updated_at"]
        paginated_data = user_timezone_converter(
            paginated_data, datetime_fields, timezone
        )

        return paginated_data

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, work_item_id, pk=None):
        project = Project.objects.get(pk=project_id)
        issue = Issue.objects.get(
            workspace__slug=slug, project_id=project_id, pk=work_item_id
        )

        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=ROLE.GUEST.value,
                is_active=True,
            ).exists()
            and not project.guest_view_all_features
            and not issue.created_by == request.user
        ):
            return Response(
                {"error": "You are not allowed to view this issue"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if pk:
            issue_description_version = IssueDescriptionVersion.objects.get(
                workspace__slug=slug,
                project_id=project_id,
                issue_id=work_item_id,
                pk=pk,
            )

            serializer = IssueDescriptionVersionDetailSerializer(
                issue_description_version
            )
            return Response(serializer.data, status=status.HTTP_200_OK)

        cursor = request.GET.get("cursor", None)

        required_fields = [
            "id",
            "workspace",
            "project",
            "issue",
            "last_saved_at",
            "owned_by",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

        issue_description_versions_queryset = IssueDescriptionVersion.objects.filter(
            workspace__slug=slug, project_id=project_id, issue_id=work_item_id
        ).order_by("-created_at")
        paginated_data = paginate(
            base_queryset=issue_description_versions_queryset,
            queryset=issue_description_versions_queryset,
            cursor=cursor,
            on_result=lambda results: self.process_paginated_result(
                required_fields, results, request.user.user_timezone
            ),
        )
        return Response(paginated_data, status=status.HTTP_200_OK)
