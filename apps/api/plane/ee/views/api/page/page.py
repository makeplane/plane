# Python imports
import json
from django.db import transaction

# Django imports
from django.core.serializers.json import DjangoJSONEncoder

# Django imports
from django.db.models import Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers import PageSerializer, PageDetailSerializer
from plane.db.models import Page, Project, ProjectPage, Workspace
from plane.ee.views.api.base import BaseServiceAPIView
from plane.bgtasks.page_transaction_task import page_transaction
from plane.ee.bgtasks.page_update import nested_page_update, PageAction
from plane.app.permissions import ProjectEntityPermission


class WikiBulkOperationAPIView(BaseServiceAPIView):
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
        if not isinstance(request.data, list):
            return Response(
                {"error": "Expected a list of pages"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created_pages = []
        errors = []
        valid_pages = []
        valid_data = []

        # Get workspace from slug (required for all pages)
        try:
            workspace = Workspace.objects.get(slug=slug)
            workspace_id = workspace.id
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # First validate all pages
        for index, page_data in enumerate(request.data):
            serializer = PageDetailSerializer(
                data=page_data,
                context={
                    "owned_by_id": page_data.get("owned_by", None),
                    "description": page_data.get("description", {}),
                    "description_binary": page_data.get("description_binary", None),
                    "description_html": page_data.get("description_html", "<p></p>"),
                },
            )

            if serializer.is_valid():
                valid_pages.append((index, serializer, page_data))

                # Add common fields directly to validated_data
                data = serializer.validated_data
                data["owned_by_id"] = page_data.get("owned_by", None)
                data["is_global"] = (
                    True  # Always global since we're removing project_id
                )
                data["workspace_id"] = workspace_id

                valid_data.append(data)
            else:
                errors.append({"index": index, "errors": serializer.errors})

        # If no valid pages, return errors
        if not valid_pages:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        # Use transaction to ensure atomicity
        with transaction.atomic():
            # Bulk create with prepared data
            pages = Page.objects.bulk_create([Page(**data) for data in valid_data])

            # Prepare background tasks
            page_tasks = []
            nested_page_tasks = []

            # Process each created page
            for i, (index, serializer, page_data) in enumerate(valid_pages):
                page = pages[i]

                # Queue background tasks instead of executing immediately
                page_tasks.append(page_transaction.s(page_data, None, page.id))

                if page_data.get("parent_id"):
                    nested_page_tasks.append(
                        nested_page_update.s(
                            page_id=page.id,
                            action=PageAction.SUB_PAGE,
                            slug=slug,
                            user_id=page_data.get("owned_by", None),
                        )
                    )

                created_pages.append(PageDetailSerializer(page).data)

            # Execute all background tasks after transaction completes
            if page_tasks:
                transaction.on_commit(lambda: [task.delay() for task in page_tasks])
            if nested_page_tasks:
                transaction.on_commit(
                    lambda: [task.delay() for task in nested_page_tasks]
                )

        return Response(
            created_pages,
            status=status.HTTP_201_CREATED
            if not errors
            else status.HTTP_207_MULTI_STATUS,
        )

    def patch(self, request, slug):
        """
        Update multiple pages partially with a list of page data.
        Each page object in the list must include an ID.
        """
        if not isinstance(request.data, list):
            return Response(
                {"error": "Expected a list of pages"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated_pages = []
        errors = []
        valid_pages = []
        pages_to_update = []

        # Get all page IDs to update
        page_ids = [
            page_data.get("id") for page_data in request.data if page_data.get("id")
        ]

        # Fetch existing pages in a single query
        existing_pages = {}
        if page_ids:
            for page in Page.objects.filter(id__in=page_ids):
                existing_pages[str(page.id)] = page

        # Validate all updates
        for index, page_data in enumerate(request.data):
            page_id = page_data.get("id")
            if not page_id:
                errors.append(
                    {
                        "index": index,
                        "errors": {"id": ["Page ID is required for updates"]},
                    }
                )
                continue

            page = existing_pages.get(str(page_id))
            if not page:
                errors.append(
                    {
                        "index": index,
                        "errors": {"id": [f"Page with ID {page_id} not found"]},
                    }
                )
                continue

            serializer = PageDetailSerializer(
                page,
                data=page_data,
                partial=True,
                context={
                    "slug": slug,
                    "user_id": page_data.get("owned_by", None),
                },
            )

            if serializer.is_valid():
                valid_pages.append((index, page, serializer, page_data))

                # Update fields
                for attr, value in serializer.validated_data.items():
                    setattr(page, attr, value)

                pages_to_update.append(page)
            else:
                errors.append({"index": index, "errors": serializer.errors})

        # If no valid updates, return errors
        if not valid_pages:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        # Use transaction to ensure atomicity
        with transaction.atomic():
            # Determine fields to update based on data provided in requests
            update_fields = set()
            for _, _, _, page_data in valid_pages:
                update_fields.update(page_data.keys())

            # Filter to only valid fields
            valid_update_fields = [
                field
                for field in update_fields
                if field
                in [
                    "name",
                    "description",
                    "description_html",
                    "description_binary",
                    "access",
                    "color",
                    "title",
                    "parent_id",
                    "is_favorite",
                    "logo_props",
                ]
                and field != "id"  # Exclude id from update fields
            ]

            # Update pages
            if pages_to_update and valid_update_fields:
                Page.objects.bulk_update(pages_to_update, fields=valid_update_fields)

            # Initialize task lists
            page_tasks = []
            nested_page_tasks = []

            # Process each updated page
            for index, page, serializer, page_data in valid_pages:
                # Queue background tasks
                page_tasks.append(page_transaction.s(page_data, None, page.id))

                # Handle parent changes if parent_id was in the update data
                if "parent_id" in page_data:
                    nested_page_tasks.append(
                        nested_page_update.s(
                            page_id=page.id,
                            action=PageAction.SUB_PAGE,
                            project_id=None,  # No project_id for global pages
                            slug=slug,
                            user_id=page_data.get("owned_by", None),
                        )
                    )

                updated_pages.append(PageDetailSerializer(page).data)

            # Execute all background tasks after transaction completes
            if page_tasks:
                transaction.on_commit(lambda: [task.delay() for task in page_tasks])
            if nested_page_tasks:
                transaction.on_commit(
                    lambda: [task.delay() for task in nested_page_tasks]
                )

        return Response(
            updated_pages,
            status=status.HTTP_200_OK if not errors else status.HTTP_207_MULTI_STATUS,
        )
