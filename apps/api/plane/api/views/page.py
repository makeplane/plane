# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import json

# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Exists, OuterRef, Q, UUIDField, Value
from django.db.models.functions import Coalesce
from django.utils import timezone

# Third party imports
from drf_spectacular.utils import OpenApiRequest, OpenApiResponse
from rest_framework import status
from rest_framework.permissions import SAFE_METHODS
from rest_framework.response import Response

# Module imports
from plane.api.serializers import (
    IssuePageCreateSerializer,
    IssuePageSerializer,
    PageCreateSerializer,
    PageSerializer,
    PageUpdateSerializer,
)
from plane.api.views.issue import guest_cannot_view_issue, is_restricted_guest
from plane.app.permissions import (
    ProjectEntityPermission,
    ProjectPagePermission as AppProjectPagePermission,
    ROLE,
)
from plane.app.views.page.base import unarchive_archive_page_and_descendants
from plane.bgtasks.page_transaction_task import page_transaction
from plane.bgtasks.page_version_task import track_page_version
from plane.db.models import (
    Issue,
    IssuePage,
    Page,
    Project,
    ProjectMember,
    ProjectPage,
    UserFavorite,
    UserRecentVisit,
)
from plane.utils.host import base_host  # noqa: F401
from plane.utils.openapi import (
    ARCHIVED_RESPONSE,
    CURSOR_PARAMETER,
    DELETED_RESPONSE,
    EXPAND_PARAMETER,
    EXTERNAL_ID_PARAMETER,
    EXTERNAL_SOURCE_PARAMETER,
    FIELDS_PARAMETER,
    FORBIDDEN_RESPONSE,
    INVALID_REQUEST_RESPONSE,
    ISSUE_ID_PARAMETER,
    ISSUE_NOT_FOUND_RESPONSE,
    NOT_FOUND_RESPONSE,
    ORDER_BY_PARAMETER,
    PAGE_ID_PARAMETER,
    PER_PAGE_PARAMETER,
    PROJECT_NOT_FOUND_RESPONSE,
    UNARCHIVED_RESPONSE,
    WORK_ITEM_PAGE_ID_PARAMETER,
    create_paginated_response,
    page_docs,
    work_item_page_docs,
)
from plane.utils.order_queryset import PAGE_ORDER_BY_ALLOWLIST, sanitize_order_by
from .base import BaseAPIView


class ProjectPagePermission(AppProjectPagePermission):
    """ProjectPagePermission adapted for public API v1 endpoints.

    Reads `page_id` or `pk` from URL kwargs. Returns 403 when the caller is not
    an active member of the URL project or lacks the role for the HTTP method,
    and raises Page.DoesNotExist (mapped to 404 by BaseAPIView) when a target
    page ID is not bound to the URL workspace + project.
    """

    def has_permission(self, request, view):
        if request.user.is_anonymous:
            return False

        user_id = request.user.id
        slug = view.kwargs.get("slug")
        page_id = view.kwargs.get("page_id") or view.kwargs.get("pk")
        project_id = view.kwargs.get("project_id")

        extended_access, role = self._check_access_and_get_role(request, slug, project_id)
        if extended_access is False:
            return False

        if page_id:
            page = Page.objects.filter(
                id=page_id,
                workspace__slug=slug,
                project_pages__project_id=project_id,
                project_pages__deleted_at__isnull=True,
            ).first()
            if page is None:
                if role == ROLE.GUEST.value and request.method not in SAFE_METHODS:
                    return False
                raise Page.DoesNotExist()

            if page.owned_by_id == user_id:
                return True

            if (
                role == ROLE.GUEST.value
                and not Project.objects.filter(pk=project_id, guest_view_all_features=True).exists()
            ):
                if request.method in SAFE_METHODS:
                    raise Page.DoesNotExist()
                return False

            if page.access == Page.PRIVATE_ACCESS:
                return self._has_private_page_action_access(request, slug, page, project_id)

        return self._has_public_page_action_access(request, role)


def _project_pages_queryset(user, slug, project_id):
    queryset = (
        Page.objects.filter(workspace__slug=slug)
        .filter(
            Exists(
                ProjectPage.objects.filter(
                    page_id=OuterRef("pk"),
                    project_id=project_id,
                    workspace__slug=slug,
                    deleted_at__isnull=True,
                    project__archived_at__isnull=True,
                    project__project_projectmember__member=user,
                    project__project_projectmember__is_active=True,
                )
            )
        )
        .filter(Q(owned_by=user) | Q(access=Page.PUBLIC_ACCESS))
        .select_related("workspace", "owned_by")
        .annotate(
            project_ids=Coalesce(
                ArrayAgg(
                    "project_pages__project_id",
                    distinct=True,
                    filter=Q(project_pages__deleted_at__isnull=True),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            )
        )
    )
    if is_restricted_guest(user.id, project_id, slug):
        queryset = queryset.filter(owned_by=user)
    return queryset


class PageListCreateAPIEndpoint(BaseAPIView):
    """Project Page List and Create Endpoint"""

    serializer_class = PageSerializer
    model = Page
    permission_classes = [ProjectPagePermission]
    use_read_replica = True

    def get_queryset(self):
        return _project_pages_queryset(
            user=self.request.user,
            slug=self.kwargs.get("slug"),
            project_id=self.kwargs.get("project_id"),
        )

    @page_docs(
        operation_id="list_project_pages",
        summary="List project pages",
        description="Retrieve a paginated list of pages in a project, including child pages.",
        parameters=[
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            ORDER_BY_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
            EXTERNAL_ID_PARAMETER,
            EXTERNAL_SOURCE_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                PageSerializer,
                "PaginatedPageResponse",
                "Paginated list of project pages",
                "Paginated Pages",
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: PROJECT_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id):
        """List project pages

        Retrieve a paginated list of pages in a project.
        """
        unsupported_filters = [param for param in ("pql", "filters") if request.GET.get(param)]
        if unsupported_filters:
            return Response(
                {
                    "pql": (
                        "PQL and structured filters are not supported on this Plane edition. "
                        "Remove the pql/filters parameter and filter results client-side, or use "
                        "a Plane edition that supports query filtering."
                    ),
                    "unsupported_parameters": unsupported_filters,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = self.get_queryset()
        if request.GET.get("archived", "false").lower() not in ("true", "1"):
            queryset = queryset.filter(archived_at__isnull=True)

        external_id = request.GET.get("external_id")
        external_source = request.GET.get("external_source")
        if external_id:
            queryset = queryset.filter(external_id=external_id)
        if external_source:
            queryset = queryset.filter(external_source=external_source)

        order_by = sanitize_order_by(
            request.GET.get("order_by", "-created_at"),
            PAGE_ORDER_BY_ALLOWLIST,
            default="-created_at",
        )
        queryset = queryset.order_by(order_by, "id")

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda pages: PageSerializer(pages, many=True, fields=self.fields, expand=self.expand).data,
        )

    @page_docs(
        operation_id="create_project_page",
        summary="Create project page",
        description="Create a new page in a project.",
        request=OpenApiRequest(request=PageCreateSerializer),
        responses={
            201: OpenApiResponse(
                description="Page created successfully",
                response=PageSerializer,
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: PROJECT_NOT_FOUND_RESPONSE,
        },
    )
    def post(self, request, slug, project_id):
        """Create project page

        Create a new page in a project and link it via ProjectPage.
        """
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        if project.archived_at:
            return Response(
                {"error": "Project is archived"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PageCreateSerializer(
            data=request.data,
            context={
                "slug": slug,
                "project_id": project_id,
                "owned_by_id": request.user.id,
            },
        )
        if serializer.is_valid():
            page = serializer.save()
            page_transaction.delay(
                new_description_html=page.description_html,
                old_description_html=None,
                page_id=page.id,
            )
            page = self.get_queryset().get(pk=page.id)
            return Response(
                PageSerializer(page, fields=self.fields, expand=self.expand).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PageDetailAPIEndpoint(BaseAPIView):
    """Project Page Detail Endpoint"""

    serializer_class = PageSerializer
    model = Page
    permission_classes = [ProjectPagePermission]
    use_read_replica = True

    def get_queryset(self):
        return _project_pages_queryset(
            user=self.request.user,
            slug=self.kwargs.get("slug"),
            project_id=self.kwargs.get("project_id"),
        )

    @page_docs(
        operation_id="retrieve_project_page",
        summary="Retrieve project page",
        description="Retrieve details of a specific page in a project.",
        parameters=[
            PAGE_ID_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="Page details",
                response=PageSerializer,
            ),
            404: NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id, pk):
        """Retrieve project page

        Retrieve details of a specific project page, including child pages.
        """
        page = self.get_queryset().get(pk=pk)
        return Response(
            PageSerializer(page, fields=self.fields, expand=self.expand).data,
            status=status.HTTP_200_OK,
        )

    def _update(self, request, slug, project_id, pk):
        page = self.get_queryset().get(pk=pk)

        only_changes_is_locked = set(request.data.keys()) == {"is_locked"}
        if page.is_locked and not only_changes_is_locked:
            return Response(
                {"error": "Page is locked"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page.archived_at is not None and not only_changes_is_locked:
            return Response(
                {"error": "Page is archived"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            "access" in request.data
            and page.access != request.data.get("access")
            and page.owned_by_id != request.user.id
        ):
            return Response(
                {"error": "Access cannot be updated since this page is owned by someone else"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_description_html = page.description_html
        existing_instance = json.dumps(
            {"description_html": old_description_html},
            cls=DjangoJSONEncoder,
        )

        serializer = PageUpdateSerializer(page, data=request.data, partial=True)
        if serializer.is_valid():
            html_changed = "description_html" in serializer.validated_data
            page = serializer.save()
            if html_changed:
                page_transaction.delay(
                    new_description_html=page.description_html,
                    old_description_html=old_description_html,
                    page_id=page.id,
                )
                track_page_version.delay(
                    page_id=page.id,
                    existing_instance=existing_instance,
                    user_id=request.user.id,
                )
            page = self.get_queryset().get(pk=page.id)
            return Response(
                PageSerializer(page, fields=self.fields, expand=self.expand).data,
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @page_docs(
        operation_id="update_project_page",
        summary="Update project page",
        description="Update fields of a project page (partial update semantics).",
        parameters=[PAGE_ID_PARAMETER],
        request=OpenApiRequest(request=PageUpdateSerializer),
        responses={
            200: OpenApiResponse(
                description="Page updated successfully",
                response=PageSerializer,
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def put(self, request, slug, project_id, pk):
        """Update project page

        Update fields of a project page using partial semantics.
        """
        return self._update(request, slug, project_id, pk)

    @page_docs(
        operation_id="partial_update_project_page",
        summary="Partially update project page",
        description="Partially update fields of a project page.",
        parameters=[PAGE_ID_PARAMETER],
        request=OpenApiRequest(request=PageUpdateSerializer),
        responses={
            200: OpenApiResponse(
                description="Page updated successfully",
                response=PageSerializer,
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def patch(self, request, slug, project_id, pk):
        """Partially update project page

        Partially update fields of a project page.
        """
        return self._update(request, slug, project_id, pk)

    @page_docs(
        operation_id="delete_project_page",
        summary="Delete project page",
        description="Delete an archived page from a project.",
        parameters=[PAGE_ID_PARAMETER],
        responses={
            204: DELETED_RESPONSE,
            400: INVALID_REQUEST_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id, pk):
        """Delete project page

        Permanently delete a project page. The page must be archived first.
        """
        page = self.get_queryset().get(pk=pk)

        if page.archived_at is None:
            return Response(
                {"error": "The page should be archived before deleting"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page.owned_by_id != request.user.id and (
            not ProjectMember.objects.filter(
                workspace__slug=slug,
                member=request.user,
                role=ROLE.ADMIN.value,
                project_id=project_id,
                is_active=True,
            ).exists()
        ):
            return Response(
                {"error": "Only admin or owner can delete the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        Page.objects.filter(
            parent_id=pk,
            workspace__slug=slug,
            project_pages__project_id=project_id,
            project_pages__deleted_at__isnull=True,
        ).update(parent=None)

        page.delete()
        UserFavorite.objects.filter(
            project=project_id,
            workspace__slug=slug,
            entity_identifier=pk,
            entity_type="page",
        ).delete()
        UserRecentVisit.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            entity_identifier=pk,
            entity_name="page",
        ).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PageArchiveUnarchiveAPIEndpoint(BaseAPIView):
    """Project Page Archive and Unarchive Endpoint"""

    permission_classes = [ProjectPagePermission]

    @page_docs(
        operation_id="archive_project_page",
        summary="Archive project page",
        description="Archive a project page and all its descendants.",
        parameters=[PAGE_ID_PARAMETER],
        request={},
        responses={
            200: ARCHIVED_RESPONSE,
            400: INVALID_REQUEST_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def post(self, request, slug, project_id, pk):
        """Archive project page

        Archive a project page and all its descendants.
        """
        page = _project_pages_queryset(request.user, slug, project_id).get(pk=pk)

        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                is_active=True,
                role__lte=ROLE.MEMBER.value,
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only the owner or admin can archive the page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        UserFavorite.objects.filter(
            entity_type="page",
            entity_identifier=pk,
            project_id=project_id,
            workspace__slug=slug,
        ).delete()

        archived_at = timezone.now().date()
        unarchive_archive_page_and_descendants(pk, archived_at)

        return Response({"archived_at": str(archived_at)}, status=status.HTTP_200_OK)

    @page_docs(
        operation_id="unarchive_project_page",
        summary="Unarchive project page",
        description="Restore an archived project page and all its descendants.",
        parameters=[PAGE_ID_PARAMETER],
        request={},
        responses={
            204: UNARCHIVED_RESPONSE,
            400: INVALID_REQUEST_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id, pk):
        """Unarchive project page

        Restore an archived project page and all its descendants.
        """
        page = _project_pages_queryset(request.user, slug, project_id).get(pk=pk)

        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                is_active=True,
                role__lte=ROLE.MEMBER.value,
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only the owner or admin can un archive the page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page.parent_id and page.parent.archived_at:
            page.parent = None
            page.save(update_fields=["parent"])

        unarchive_archive_page_and_descendants(pk, None)

        return Response(status=status.HTTP_204_NO_CONTENT)


class IssuePageListCreateAPIEndpoint(BaseAPIView):
    """Work Item Page Link List and Create Endpoint"""

    serializer_class = IssuePageSerializer
    model = IssuePage
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        slug = self.kwargs.get("slug")
        project_id = self.kwargs.get("project_id")
        issue_id = self.kwargs.get("issue_id")
        issue = Issue.issue_objects.get(
            workspace__slug=slug,
            project_id=project_id,
            pk=issue_id,
        )
        if guest_cannot_view_issue(self.request.user.id, issue, slug):
            raise Issue.DoesNotExist()
        return (
            IssuePage.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_id=issue_id,
            )
            .filter(
                Exists(
                    ProjectPage.objects.filter(
                        page_id=OuterRef("page_id"),
                        project_id=project_id,
                        workspace__slug=slug,
                        deleted_at__isnull=True,
                    )
                )
            )
            .filter(Q(page__owned_by=self.request.user) | Q(page__access=Page.PUBLIC_ACCESS))
            .select_related("page", "issue", "project", "workspace")
            .order_by("-created_at")
        )

    @work_item_page_docs(
        operation_id="list_work_item_pages",
        summary="List work item page links",
        description="Retrieve a paginated list of pages linked to a work item.",
        parameters=[
            ISSUE_ID_PARAMETER,
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                IssuePageSerializer,
                "PaginatedWorkItemPageResponse",
                "Paginated list of work item page links",
                "Paginated Work Item Pages",
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: ISSUE_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id, issue_id):
        """List work item page links

        Retrieve all pages linked to a work item.
        """
        unsupported_filters = [param for param in ("pql", "filters") if request.GET.get(param)]
        if unsupported_filters:
            return Response(
                {
                    "pql": (
                        "PQL and structured filters are not supported on this Plane edition. "
                        "Remove the pql/filters parameter and filter results client-side, or use "
                        "a Plane edition that supports query filtering."
                    ),
                    "unsupported_parameters": unsupported_filters,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return self.paginate(
            request=request,
            queryset=self.get_queryset(),
            on_results=lambda issue_pages: IssuePageSerializer(
                issue_pages, many=True, fields=self.fields, expand=self.expand
            ).data,
        )

    @work_item_page_docs(
        operation_id="create_work_item_page",
        summary="Link page to work item",
        description="Attach a project page to a work item.",
        parameters=[ISSUE_ID_PARAMETER],
        request=OpenApiRequest(request=IssuePageCreateSerializer),
        responses={
            200: OpenApiResponse(
                description="Existing work item page link returned",
                response=IssuePageSerializer,
            ),
            201: OpenApiResponse(
                description="Work item page link created successfully",
                response=IssuePageSerializer,
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def post(self, request, slug, project_id, issue_id):
        """Link page to work item

        Link an existing project page to a work item.
        """
        issue = Issue.issue_objects.get(
            workspace__slug=slug,
            project_id=project_id,
            pk=issue_id,
        )
        if guest_cannot_view_issue(request.user.id, issue, slug):
            raise Issue.DoesNotExist()

        serializer = IssuePageCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        page_id = serializer.validated_data["page_id"]
        page = (
            Page.objects.filter(
                Q(owned_by=request.user) | Q(access=Page.PUBLIC_ACCESS),
                pk=page_id,
                workspace__slug=slug,
            )
            .filter(
                Exists(
                    ProjectPage.objects.filter(
                        page_id=OuterRef("pk"),
                        project_id=project_id,
                        workspace__slug=slug,
                        deleted_at__isnull=True,
                    )
                )
            )
            .first()
        )
        if page is None:
            raise Page.DoesNotExist()

        existing = (
            IssuePage.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue=issue,
                page=page,
            )
            .select_related("page", "issue", "project", "workspace")
            .first()
        )
        if existing is not None:
            return Response(
                IssuePageSerializer(existing, fields=self.fields, expand=self.expand).data,
                status=status.HTTP_200_OK,
            )

        issue_page = IssuePage.objects.create(
            issue=issue,
            page=page,
            project_id=project_id,
            workspace_id=issue.workspace_id,
        )
        issue_page = IssuePage.objects.select_related("page", "issue", "project", "workspace").get(pk=issue_page.id)
        return Response(
            IssuePageSerializer(issue_page, fields=self.fields, expand=self.expand).data,
            status=status.HTTP_201_CREATED,
        )


class IssuePageDetailAPIEndpoint(BaseAPIView):
    """Work Item Page Link Detail Endpoint"""

    serializer_class = IssuePageSerializer
    model = IssuePage
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        slug = self.kwargs.get("slug")
        project_id = self.kwargs.get("project_id")
        issue_id = self.kwargs.get("issue_id")
        issue = Issue.issue_objects.get(
            workspace__slug=slug,
            project_id=project_id,
            pk=issue_id,
        )
        if guest_cannot_view_issue(self.request.user.id, issue, slug):
            raise Issue.DoesNotExist()
        return (
            IssuePage.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_id=issue_id,
            )
            .filter(
                Exists(
                    ProjectPage.objects.filter(
                        page_id=OuterRef("page_id"),
                        project_id=project_id,
                        workspace__slug=slug,
                        deleted_at__isnull=True,
                    )
                )
            )
            .filter(Q(page__owned_by=self.request.user) | Q(page__access=Page.PUBLIC_ACCESS))
            .select_related("page", "issue", "project", "workspace")
            .order_by("-created_at")
        )

    @work_item_page_docs(
        operation_id="retrieve_work_item_page",
        summary="Retrieve work item page link",
        description="Retrieve details of a specific work item page link.",
        parameters=[
            ISSUE_ID_PARAMETER,
            WORK_ITEM_PAGE_ID_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="Work item page link details",
                response=IssuePageSerializer,
            ),
            404: NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id, issue_id, pk):
        """Retrieve work item page link

        Retrieve details of a specific work item page link.
        """
        issue_page = self.get_queryset().get(pk=pk)
        return Response(
            IssuePageSerializer(issue_page, fields=self.fields, expand=self.expand).data,
            status=status.HTTP_200_OK,
        )

    @work_item_page_docs(
        operation_id="delete_work_item_page",
        summary="Delete work item page link",
        description="Remove a page link from a work item.",
        parameters=[
            ISSUE_ID_PARAMETER,
            WORK_ITEM_PAGE_ID_PARAMETER,
        ],
        responses={
            204: DELETED_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id, issue_id, pk):
        """Delete work item page link

        Remove a page link from a work item.
        """
        issue = Issue.issue_objects.get(
            workspace__slug=slug,
            project_id=project_id,
            pk=issue_id,
        )
        if guest_cannot_view_issue(request.user.id, issue, slug):
            raise Issue.DoesNotExist()
        issue_page = IssuePage.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            pk=pk,
        )
        issue_page.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
