# Python imports
from django.db import transaction
import random
import json

# Django imports
from django.db.models import Q
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers import PageSerializer, PageDetailSerializer
from plane.db.models import Page, Workspace, Project, ProjectPage
from plane.ee.views.api.base import BaseServiceAPIView
from plane.bgtasks.page_transaction_task import page_transaction
from plane.ee.bgtasks.page_update import nested_page_update, PageAction
from plane.ee.models import Teamspace, TeamspacePage
from plane.ee.serializers import TeamspacePageDetailSerializer
from plane.ee.bgtasks.team_space_activities_task import team_space_activity


# Utility functions for common operations
def validate_list_input(data):
    """Validate that input is a list"""
    if not isinstance(data, list):
        return Response(
            {"error": "Expected a list of pages"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return None


def get_valid_update_fields():
    """Get list of fields that can be updated"""
    return [
        "name", "description", "description_html", "description_binary",
        "access", "color", "title", "parent_id", "is_favorite", "logo_props", "view_props"
    ]


def queue_common_background_tasks(pages_data, pages, slug, user_id, project_id=None):
    """Queue common background tasks for all page types"""
    page_tasks = []
    nested_page_tasks = []

    for i, page_data in enumerate(pages_data):
        page = pages[i]

        # Page transaction task
        page_tasks.append(page_transaction.s(page_data, None, page.id))

        # Nested page updates for sub-pages
        if page_data.get("parent_id"):
            nested_page_tasks.append(
                nested_page_update.s(
                    page_id=page.id,
                    action=PageAction.SUB_PAGE,
                    project_id=project_id,
                    slug=slug,
                    user_id=user_id,
                )
            )

    def execute_tasks():
        for task in page_tasks:
            task.delay()
        for task in nested_page_tasks:
            task.delay()

    return execute_tasks


class WikiBulkOperationAPIView(BaseServiceAPIView):
    """Global wiki pages bulk operations"""
    serializer_class = PageSerializer
    model = Page

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(moved_to_page__isnull=True)
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .select_related("workspace")
            .select_related("owned_by")
            .distinct()
        )

    def post(self, request, slug):
        error_response = validate_list_input(request.data)
        if error_response:
            return error_response

        try:
            workspace = Workspace.objects.get(slug=slug)
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        created_pages = []
        errors = []
        valid_pages = []
        valid_data = []

        # Validate all pages
        for index, page_data in enumerate(request.data):
            serializer = PageDetailSerializer(
                data=page_data,
                context={
                    "owned_by_id": page_data.get("owned_by", request.user.id),
                    "description": page_data.get("description", {}),
                    "description_binary": page_data.get("description_binary", None),
                    "description_html": page_data.get("description_html", "<p></p>"),
                },
            )

            if serializer.is_valid():
                valid_pages.append((index, serializer, page_data))

                data = serializer.validated_data
                data["owned_by_id"] = page_data.get("owned_by", request.user.id)
                data["is_global"] = True
                data["workspace_id"] = workspace.id

                valid_data.append(data)
            else:
                errors.append({"index": index, "errors": serializer.errors})

        if not valid_pages:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        # Create pages atomically
        with transaction.atomic():
            pages = Page.objects.bulk_create([Page(**data) for data in valid_data])

            # Prepare responses
            for page in pages:
                created_pages.append(PageDetailSerializer(page).data)

            # Queue background tasks
            execute_tasks = queue_common_background_tasks(
                [page_data for _, _, page_data in valid_pages],
                pages,
                slug,
                request.user.id
            )
            transaction.on_commit(execute_tasks)

        return Response(
            created_pages,
            status=status.HTTP_201_CREATED if not errors else status.HTTP_207_MULTI_STATUS,
        )

    def patch(self, request, slug):
        error_response = validate_list_input(request.data)
        if error_response:
            return error_response

        try:
            workspace = Workspace.objects.get(slug=slug)
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        updated_pages = []
        errors = []
        valid_pages = []
        pages_to_update = []

        # Get page IDs and fetch existing pages
        page_ids = [page_data.get("id") for page_data in request.data if page_data.get("id")]
        existing_pages = {
            str(page.id): page
            for page in Page.objects.filter(id__in=page_ids, workspace=workspace, is_global=True)
        }

        # Validate all updates
        for index, page_data in enumerate(request.data):
            page_id = page_data.get("id")
            if not page_id:
                errors.append({
                    "index": index,
                    "errors": {"id": ["Page ID is required for updates"]},
                })
                continue

            page = existing_pages.get(str(page_id))
            if not page:
                errors.append({
                    "index": index,
                    "errors": {"id": [f"Page with ID {page_id} not found"]},
                })
                continue

            serializer = PageDetailSerializer(
                page, data=page_data, partial=True,
                context={"slug": slug, "user_id": request.user.id}
            )

            if serializer.is_valid():
                valid_pages.append((index, page, serializer, page_data))

                for attr, value in serializer.validated_data.items():
                    setattr(page, attr, value)
                pages_to_update.append(page)
            else:
                errors.append({"index": index, "errors": serializer.errors})

        if not valid_pages:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        # Update pages atomically
        with transaction.atomic():
            update_fields = set()
            for _, _, _, page_data in valid_pages:
                update_fields.update(page_data.keys())

            valid_update_fields = [
                field for field in update_fields
                if field in get_valid_update_fields() and field != "id"
            ]

            if pages_to_update and valid_update_fields:
                Page.objects.bulk_update(pages_to_update, fields=valid_update_fields)

            for _, page, _, _ in valid_pages:
                updated_pages.append(PageDetailSerializer(page).data)

            # Queue background tasks
            execute_tasks = queue_common_background_tasks(
                [page_data for _, _, _, page_data in valid_pages],
                [page for _, page, _, _ in valid_pages],
                slug,
                request.user.id
            )
            transaction.on_commit(execute_tasks)

        return Response(
            updated_pages,
            status=status.HTTP_200_OK if not errors else status.HTTP_207_MULTI_STATUS,
        )


class ProjectPageBulkOperationAPIView(BaseServiceAPIView):
    """Project pages bulk operations"""

    def post(self, request, slug, project_id):
        error_response = validate_list_input(request.data)
        if error_response:
            return error_response

        try:
            workspace = Workspace.objects.get(slug=slug)
            project = Project.objects.get(id=project_id, workspace=workspace)
        except (Workspace.DoesNotExist, Project.DoesNotExist):
            return Response(
                {"error": "Workspace or project not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        created_pages = []
        errors = []
        valid_pages = []
        valid_data = []

        # Validate all pages
        for index, page_data in enumerate(request.data):
            serializer = PageDetailSerializer(
                data=page_data,
                context={
                    "owned_by_id": page_data.get("owned_by", request.user.id),
                    "description": page_data.get("description", {}),
                    "description_binary": page_data.get("description_binary", None),
                    "description_html": page_data.get("description_html", "<p></p>"),
                    "project_id": project.id,
                },
            )

            if serializer.is_valid():
                valid_pages.append((index, serializer, page_data))

                data = serializer.validated_data
                data["owned_by_id"] = page_data.get("owned_by", request.user.id)
                data["is_global"] = False
                data["workspace_id"] = workspace.id

                valid_data.append(data)
            else:
                errors.append({"index": index, "errors": serializer.errors})

        if not valid_pages:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        # Create pages atomically
        with transaction.atomic():
            pages = Page.objects.bulk_create([Page(**data) for data in valid_data])

            # Create project page associations
            ProjectPage.objects.bulk_create([
                ProjectPage(
                    workspace_id=page.workspace_id,
                    project_id=project.id,
                    page_id=page.id,
                    created_by_id=page.created_by_id,
                    updated_by_id=page.updated_by_id,
                )
                for page in pages
            ])

            # Prepare responses
            for page in pages:
                created_pages.append(PageDetailSerializer(page).data)

            # Queue background tasks
            execute_tasks = queue_common_background_tasks(
                [page_data for _, _, page_data in valid_pages],
                pages,
                slug,
                request.user.id,
                project.id
            )
            transaction.on_commit(execute_tasks)

        return Response(
            created_pages,
            status=status.HTTP_201_CREATED if not errors else status.HTTP_207_MULTI_STATUS,
        )

    def patch(self, request, slug, project_id):
        error_response = validate_list_input(request.data)
        if error_response:
            return error_response

        try:
            workspace = Workspace.objects.get(slug=slug)
            project = Project.objects.get(id=project_id, workspace=workspace)
        except (Workspace.DoesNotExist, Project.DoesNotExist):
            return Response(
                {"error": "Workspace or project not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        updated_pages = []
        errors = []
        valid_pages = []
        pages_to_update = []

        # Get page IDs and fetch existing pages
        page_ids = [page_data.get("id") for page_data in request.data if page_data.get("id")]
        existing_pages = {
            str(page.id): page
            for page in Page.objects.filter(
                id__in=page_ids,
                workspace=workspace,
                project_pages__project=project
            )
        }

        # Validate all updates
        for index, page_data in enumerate(request.data):
            page_id = page_data.get("id")
            if not page_id:
                errors.append({
                    "index": index,
                    "errors": {"id": ["Page ID is required for updates"]},
                })
                continue

            page = existing_pages.get(str(page_id))
            if not page:
                errors.append({
                    "index": index,
                    "errors": {"id": [f"Page with ID {page_id} not found"]},
                })
                continue

            serializer = PageDetailSerializer(
                page, data=page_data, partial=True,
                context={"slug": slug, "user_id": request.user.id}
            )

            if serializer.is_valid():
                valid_pages.append((index, page, serializer, page_data))

                for attr, value in serializer.validated_data.items():
                    setattr(page, attr, value)
                pages_to_update.append(page)
            else:
                errors.append({"index": index, "errors": serializer.errors})

        if not valid_pages:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        # Update pages atomically
        with transaction.atomic():
            update_fields = set()
            for _, _, _, page_data in valid_pages:
                update_fields.update(page_data.keys())

            valid_update_fields = [
                field for field in update_fields
                if field in get_valid_update_fields() and field != "id"
            ]

            if pages_to_update and valid_update_fields:
                Page.objects.bulk_update(pages_to_update, fields=valid_update_fields)

            for _, page, _, _ in valid_pages:
                updated_pages.append(PageDetailSerializer(page).data)

            # Queue background tasks
            execute_tasks = queue_common_background_tasks(
                [page_data for _, _, _, page_data in valid_pages],
                [page for _, page, _, _ in valid_pages],
                slug,
                request.user.id,
                project.id
            )
            transaction.on_commit(execute_tasks)

        return Response(
            updated_pages,
            status=status.HTTP_200_OK if not errors else status.HTTP_207_MULTI_STATUS,
        )


class TeamspacePageBulkOperationAPIView(BaseServiceAPIView):
    """Teamspace pages bulk operations"""

    def post(self, request, slug, team_space_id):
        error_response = validate_list_input(request.data)
        if error_response:
            return error_response

        try:
            workspace = Workspace.objects.get(slug=slug)
            teamspace = Teamspace.objects.get(id=team_space_id, workspace=workspace)
        except (Workspace.DoesNotExist, Teamspace.DoesNotExist):
            return Response(
                {"error": "Workspace or teamspace not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        created_pages = []
        errors = []
        valid_pages = []
        valid_data = []

        # Validate all pages
        for index, page_data in enumerate(request.data):
            page_data["workspace"] = workspace.id
            serializer = TeamspacePageDetailSerializer(
                data=page_data,
                context={
                    "owned_by_id": page_data.get("owned_by", request.user.id),
                    "description": page_data.get("description", {}),
                    "description_binary": page_data.get("description_binary", None),
                    "description_html": page_data.get("description_html", "<p></p>"),
                    "workspace_id": workspace.id,
                    "team_space_id": team_space_id,
                },
            )

            if serializer.is_valid():
                valid_pages.append((index, serializer, page_data))

                data = serializer.validated_data
                data["owned_by_id"] = page_data.get("owned_by", request.user.id)
                data["is_global"] = False
                data["workspace_id"] = workspace.id

                valid_data.append(data)
            else:
                errors.append({"index": index, "errors": serializer.errors})

        if not valid_pages:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        # Create pages atomically
        with transaction.atomic():
            pages = Page.objects.bulk_create([Page(**data) for data in valid_data])

            # Create teamspace page associations
            TeamspacePage.objects.bulk_create([
                TeamspacePage(
                    workspace=workspace,
                    page=page,
                    team_space_id=team_space_id,
                    sort_order=random.randint(0, 65535),
                )
                for page in pages
            ])

            # Prepare responses
            for page in pages:
                created_pages.append(TeamspacePageDetailSerializer(page).data)

            # Queue background tasks (including teamspace activities)
            def execute_tasks():
                # Common tasks
                common_execute = queue_common_background_tasks(
                    [page_data for _, _, page_data in valid_pages],
                    pages,
                    slug,
                    request.user.id
                )
                common_execute()

                # Teamspace-specific activity tracking
                for page in pages:
                    team_space_activity.delay(
                        type="page.activity.created",
                        slug=slug,
                        requested_data=json.dumps(
                            {"name": str(page.name), "id": str(page.id)},
                            cls=DjangoJSONEncoder
                        ),
                        actor_id=str(request.user.id),
                        team_space_id=str(team_space_id),
                        current_instance={},
                        epoch=int(timezone.now().timestamp()),
                    )

            transaction.on_commit(execute_tasks)

        return Response(
            created_pages,
            status=status.HTTP_201_CREATED if not errors else status.HTTP_207_MULTI_STATUS,
        )

    def patch(self, request, slug, team_space_id):
        error_response = validate_list_input(request.data)
        if error_response:
            return error_response

        try:
            workspace = Workspace.objects.get(slug=slug)
            teamspace = Teamspace.objects.get(id=team_space_id, workspace=workspace)
        except (Workspace.DoesNotExist, Teamspace.DoesNotExist):
            return Response(
                {"error": "Workspace or teamspace not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        updated_pages = []
        errors = []
        valid_pages = []
        pages_to_update = []

        # Get page IDs and fetch existing pages
        page_ids = [page_data.get("id") for page_data in request.data if page_data.get("id")]
        existing_pages = {
            str(page.id): page
            for page in Page.objects.filter(
                id__in=page_ids,
                workspace=workspace,
                team_spaces__team_space_id=team_space_id
            )
        }

        # Validate all updates
        for index, page_data in enumerate(request.data):
            page_id = page_data.get("id")
            if not page_id:
                errors.append({
                    "index": index,
                    "errors": {"id": ["Page ID is required for updates"]},
                })
                continue

            page = existing_pages.get(str(page_id))
            if not page:
                errors.append({
                    "index": index,
                    "errors": {"id": [f"Page with ID {page_id} not found"]},
                })
                continue

            serializer = TeamspacePageDetailSerializer(
                page, data=page_data, partial=True,
                context={"slug": slug, "user_id": request.user.id}
            )

            if serializer.is_valid():
                valid_pages.append((index, page, serializer, page_data))

                for attr, value in serializer.validated_data.items():
                    setattr(page, attr, value)
                pages_to_update.append(page)
            else:
                errors.append({"index": index, "errors": serializer.errors})

        if not valid_pages:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        # Update pages atomically
        with transaction.atomic():
            update_fields = set()
            for _, _, _, page_data in valid_pages:
                update_fields.update(page_data.keys())

            valid_update_fields = [
                field for field in update_fields
                if field in get_valid_update_fields() and field != "id"
            ]

            if pages_to_update and valid_update_fields:
                Page.objects.bulk_update(pages_to_update, fields=valid_update_fields)

            for _, page, _, _ in valid_pages:
                updated_pages.append(TeamspacePageDetailSerializer(page).data)

            # Queue background tasks (including teamspace activities)
            def execute_tasks():
                # Common tasks
                common_execute = queue_common_background_tasks(
                    [page_data for _, _, _, page_data in valid_pages],
                    [page for _, page, _, _ in valid_pages],
                    slug,
                    request.user.id
                )
                common_execute()

                # Teamspace-specific activity tracking
                for _, page, _, _ in valid_pages:
                    team_space_activity.delay(
                        type="page.activity.updated",
                        slug=slug,
                        requested_data=json.dumps(
                            {"name": str(page.name), "id": str(page.id)},
                            cls=DjangoJSONEncoder
                        ),
                        actor_id=str(request.user.id),
                        team_space_id=str(team_space_id),
                        current_instance={},
                        epoch=int(timezone.now().timestamp()),
                    )

            transaction.on_commit(execute_tasks)

        return Response(
            updated_pages,
            status=status.HTTP_200_OK if not errors else status.HTTP_207_MULTI_STATUS,
        )
