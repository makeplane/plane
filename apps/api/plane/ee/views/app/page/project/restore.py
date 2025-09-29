# Python imports
from datetime import timedelta

# Django imports
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import (
    Page,
    PageVersion,
)
from plane.ee.views.base import BaseAPIView
from plane.ee.bgtasks.page_update import nested_page_update
from plane.ee.utils.page_events import PageAction
from plane.ee.permissions.page import ProjectPagePermission


class ProjectPageRestoreEndpoint(BaseAPIView):
    permission_classes = [ProjectPagePermission]

    def post(self, request, slug, project_id, page_id, pk):
        page_version = PageVersion.objects.get(pk=pk, page_id=page_id)

        # Get the latest sub pages data
        latest_sub_pages = Page.all_objects.filter(
            parent_id=page_id, workspace__slug=slug, deleted_at__isnull=True
        ).values_list("id", flat=True)
        latest_sub_pages = set(str(i) for i in latest_sub_pages)

        # Get the version's sub pages data
        version_sub_pages = page_version.sub_pages_data
        version_sub_page_ids = [
            str(sub_page["id"])
            for sub_page in version_sub_pages
            if sub_page["deleted_at"] is None
        ]

        # Find pages that need to be restored (in old version but deleted in latest)
        pages_to_restore = set(version_sub_page_ids) - set(latest_sub_pages)

        # Find pages that need to be deleted (in latest but not in old version)
        pages_to_delete = set(latest_sub_pages) - set(version_sub_page_ids)

        # get the datetime at which the page was deleted and restore the page at that time with their children
        pages_to_restore = Page.all_objects.filter(id__in=pages_to_restore)

        for page in pages_to_restore:
            # Restore the parent page first
            deleted_at_time = page.deleted_at
            page.deleted_at = None
            page.parent_id = page_id
            page.save()

            if deleted_at_time:
                # Get all descendant pages using the recursive function
                descendant_pages = Page.objects.raw(
                    """
                    WITH RECURSIVE descendants AS (
                        SELECT id FROM pages WHERE parent_id = %s AND deleted_at BETWEEN %s AND %s
                        UNION ALL
                        SELECT pages.id FROM pages, descendants 
                        WHERE pages.parent_id = descendants.id 
                        AND pages.deleted_at BETWEEN %s AND %s
                    )
                    SELECT id FROM descendants;
                    """,
                    [
                        page.id,
                        deleted_at_time,
                        deleted_at_time + timedelta(minutes=2),
                        deleted_at_time,
                        deleted_at_time + timedelta(minutes=2),
                    ],
                )

                # Get list of descendant page IDs
                descendant_page_ids = [str(row.id) for row in descendant_pages]

                # restore the descendant pages by bulk update
                Page.all_objects.filter(id__in=descendant_page_ids).update(
                    deleted_at=None, updated_at=timezone.now(), updated_by=request.user
                )
                page_ids = descendant_page_ids + [str(page.id)]
                # restore the corresponding version of the descendant pages
                PageVersion.all_objects.filter(
                    page_id__in=page_ids,
                    workspace__slug=slug,
                ).update(
                    deleted_at=None, updated_at=timezone.now(), updated_by=request.user
                )

        # delete the pages that need to be deleted
        if pages_to_delete:
            pages_to_delete_ids = list(pages_to_delete)

            # Get all nested children recursively using raw SQL (whose deleted at is null)
            nested_children = Page.objects.raw(
                """
                WITH RECURSIVE nested_children AS (
                    SELECT id, parent_id
                    FROM pages
                    WHERE parent_id = ANY(%s) AND deleted_at IS NULL

                    UNION

                    SELECT p.id, p.parent_id
                    FROM pages p
                    INNER JOIN nested_children nc ON p.parent_id = nc.id
                    WHERE p.deleted_at IS NULL
                )
                SELECT id FROM nested_children
                """,
                [pages_to_delete_ids],
            )

            nested_child_ids = [str(row.id) for row in nested_children]
            pages_to_delete_ids.extend(nested_child_ids)

            Page.objects.filter(id__in=pages_to_delete_ids).delete()

        nested_page_update.delay(
            page_id=page_id,
            action=PageAction.RESTORED,
            slug=slug,
            project_id=project_id,
            user_id=request.user.id,
            extra={
                "deleted_page_ids": [
                    str(deleted_page) for deleted_page in pages_to_delete
                ],
            },
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
