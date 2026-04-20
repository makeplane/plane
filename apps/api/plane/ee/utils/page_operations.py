# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""
Utility functions for page operations across different page types
(workspace, project, teamspace pages).

These functions handle both single page operations and bulk operations
for transferring pages and sub-pages with a unified, optimized approach.

Usage Examples:

    # Single page operations (e.g., in move.py)
    from plane.ee.utils.page_operations import (
        delete_teamspace_page,
        create_project_page,
        move_page_entities,
    )

    delete_teamspace_page([page_id], workspace_id)
    create_project_page([page_id], project_id, workspace_id, user_id)
    move_page_entities([page_id], "project", slug, user_id, project_id=project_id)

    # Bulk operations for sub-pages (e.g., in page_update.py background task)
    from plane.ee.utils.page_operations import (
        delete_teamspace_page,
        create_project_page,
        move_page_entities,
    )

    descendant_ids = ['page-id-1', 'page-id-2', 'page-id-3']
    delete_teamspace_page(descendant_ids, workspace_id)
    create_project_page(descendant_ids, project_id, workspace_id, user_id)
    move_page_entities(descendant_ids, "project", slug, user_id, project_id=project_id)
"""

from typing import Dict, List, Optional
from django.db import transaction
from django.db.models import Max
from django.utils import timezone

from plane.db.models import (
    Page,
    ProjectPage,
    ProjectMember,
    FileAsset,
    UserFavorite,
    DeployBoard,
    UserRecentVisit,
)
from plane.ee.models import (
    Collection,
    CollectionMember,
    TeamspacePage,
    WorkItemPage,
    PageUser,
    TeamspaceMember,
    PageComment,
    PageCommentReaction,
    PageCollection,
)


# ====================
# Page Operations
# ====================


PAGE_COLLECTION_SORT_ORDER_INCREMENT = 10000
PAGE_COLLECTION_EMPTY_SORT_ORDER_BASELINE = 65535


def unlink_pages_from_teamspace(page_ids: List[str], workspace_id: str) -> None:
    """Unlink TeamspacePage associations for one or more pages."""
    TeamspacePage.objects.filter(page_id__in=page_ids, workspace_id=workspace_id).delete()


def link_pages_to_teamspace(
    page_ids: List[str], teamspace_id: str, workspace_id: str, user_id: str, batch_size: int = 10
) -> None:
    """Create TeamspacePage associations for one or more pages."""
    TeamspacePage.objects.bulk_create(
        [
            TeamspacePage(
                team_space_id=teamspace_id,
                page_id=page_id,
                workspace_id=workspace_id,
                created_by_id=user_id,
                updated_by_id=user_id,
            )
            for page_id in page_ids
        ],
        batch_size=batch_size,
        ignore_conflicts=True,
    )


def unlink_pages_from_project(page_ids: List[str], workspace_id: str) -> None:
    """unlink ProjectPage associations for one or more pages."""
    ProjectPage.objects.filter(page_id__in=page_ids, workspace_id=workspace_id).delete()


def link_pages_to_project(
    page_ids: List[str], project_id: str, workspace_id: str, user_id: str, batch_size: int = 10
) -> None:
    """Create ProjectPage associations for one or more pages."""
    ProjectPage.objects.bulk_create(
        [
            ProjectPage(
                project_id=project_id,
                page_id=page_id,
                workspace_id=workspace_id,
                created_by_id=user_id,
                updated_by_id=user_id,
            )
            for page_id in page_ids
        ],
        batch_size=batch_size,
        ignore_conflicts=True,
    )


def make_pages_workspace_level(page_ids: List[str], workspace_id: str, user_id: str) -> None:
    """make one or more pages workspace-level pages by setting is_global to True."""
    Page.objects.filter(id__in=page_ids, workspace_id=workspace_id).update(
        is_global=True,
        updated_by_id=user_id,
        updated_at=timezone.now(),
    )


def remove_pages_from_workspace_level(page_ids: List[str], workspace_id: str, user_id: str) -> None:
    """remove workspace-level status from one or more pages by setting is_global to False."""
    Page.objects.filter(id__in=page_ids, workspace_id=workspace_id).update(
        is_global=False,
        updated_by_id=user_id,
        updated_at=timezone.now(),
    )


def remove_pages_from_collection(page_ids: List[str], collection_id: str) -> None:
    """remove the pages from the collection."""
    PageCollection.objects.filter(page_id__in=page_ids, collection_id=collection_id).delete()


def add_pages_to_collection(page_ids: List[str], collection_id: str, workspace_id: str) -> None:
    """add the pages to the collection by creating new page collections."""
    if not page_ids:
        return

    page_sort_orders: Dict[str, Optional[float]] = {
        str(page.id): page.sort_order
        for page in Page.objects.filter(id__in=page_ids, workspace_id=workspace_id).only("id", "sort_order")
    }
    largest_sort_order = (
        PageCollection.objects.filter(collection_id=collection_id).aggregate(largest=Max("sort_order"))["largest"]
    )
    next_sort_order = (
        (largest_sort_order if largest_sort_order is not None else 0) + PAGE_COLLECTION_SORT_ORDER_INCREMENT
    )

    PageCollection.objects.bulk_create(
        [
            PageCollection(
                page_id=current_page_id,
                collection_id=collection_id,
                workspace_id=workspace_id,
                sort_order=(
                    page_sort_orders[current_page_id]
                    if current_page_id in page_sort_orders and page_sort_orders[current_page_id] is not None
                    else next_sort_order + index * PAGE_COLLECTION_SORT_ORDER_INCREMENT
                ),
            )
            for index, current_page_id in enumerate(page_ids)
        ],
        ignore_conflicts=True,
    )


def schedule_collection_move_updates(page_ids: List[str], collection_id: str, slug: str, user_id: str) -> None:
    """Schedule descendant collection recomputation after moving one or more root pages."""
    from plane.ee.bgtasks.page_update import nested_page_update
    from plane.ee.utils.page_events import MoveActionEnum, PageAction

    for page_id in page_ids:
        nested_page_update.delay(
            page_id=page_id,
            action=PageAction.MOVED,
            slug=slug,
            user_id=str(user_id),
            extra={
                "old_page_parent_id": None,
                "move_type": MoveActionEnum.COLLECTION_TO_COLLECTION.value,
                "new_entity_identifier": str(collection_id),
            },
        )


def assign_pages_to_collection(
    page_ids: List[str],
    collection_id: str,
    workspace_id: str,
    slug: str,
    user_id: str,
    sort_orders: Optional[Dict[str, float]] = None,
) -> None:
    """Replace root page memberships and cascade descendants via nested page updates."""
    page_ids = list(page_ids)
    if not page_ids:
        return

    sort_orders = sort_orders or {}

    with transaction.atomic():
        PageCollection.objects.filter(page_id__in=page_ids, workspace_id=workspace_id).delete()

        largest_sort_order = (
            PageCollection.objects.filter(collection_id=collection_id, workspace_id=workspace_id).aggregate(
                largest=Max("sort_order")
            )["largest"]
            or PAGE_COLLECTION_EMPTY_SORT_ORDER_BASELINE
        )

        PageCollection.objects.bulk_create(
            [
                PageCollection(
                    page_id=page_id,
                    collection_id=collection_id,
                    workspace_id=workspace_id,
                    sort_order=sort_orders.get(
                        str(page_id),
                        largest_sort_order + index * PAGE_COLLECTION_SORT_ORDER_INCREMENT,
                    ),
                    created_by_id=user_id,
                    updated_by_id=user_id,
                )
                for index, page_id in enumerate(page_ids, start=1)
            ],
            ignore_conflicts=True,
        )

        transaction.on_commit(
            lambda: schedule_collection_move_updates(
                page_ids=page_ids,
                collection_id=collection_id,
                slug=slug,
                user_id=user_id,
            )
        )


def move_collection_pages(slug: str, collection_id: str, new_collection_id: str, user_id: str) -> None:
    """Move all explicit page memberships from one collection to another."""
    updated_at = timezone.now()

    with transaction.atomic():
        pages_to_move = list(
            PageCollection.objects.filter(collection_id=collection_id, workspace__slug=slug)
            .select_related("page")
            .order_by("sort_order")
        )

        if pages_to_move:
            max_sort_order = (
                PageCollection.objects.filter(collection_id=new_collection_id, workspace__slug=slug).aggregate(
                    value=Max("sort_order")
                )["value"]
                or 0
            )
            for index, page_collection in enumerate(pages_to_move, start=1):
                page_collection.collection_id = new_collection_id
                if page_collection.page.parent_id is None:
                    page_collection.sort_order = max_sort_order + index * PAGE_COLLECTION_SORT_ORDER_INCREMENT
                page_collection.updated_by_id = user_id
                page_collection.updated_at = updated_at

            PageCollection.objects.bulk_update(
                pages_to_move,
                ["collection", "sort_order", "updated_by", "updated_at"],
            )

        CollectionMember.objects.filter(collection_id=collection_id, workspace__slug=slug).update(
            collection_id=new_collection_id,
            updated_by_id=user_id,
            updated_at=updated_at,
        )
        Collection.objects.filter(workspace__slug=slug, pk=collection_id).delete()


def update_page_collection_membership(
    page_collection: PageCollection,
    slug: str,
    user_id: str,
    next_collection: Optional[Collection] = None,
    sort_order: Optional[float] = None,
    update_sort_order: bool = False,
):
    """Update a page's explicit collection membership and schedule descendant updates when needed."""
    collection_changed = next_collection is not None and page_collection.collection_id != next_collection.id
    sort_order_changed = update_sort_order and page_collection.sort_order != sort_order

    if not collection_changed and not sort_order_changed:
        return page_collection, False

    update_fields = []
    if collection_changed:
        page_collection.collection = next_collection
        update_fields.append("collection")

    if sort_order_changed:
        page_collection.sort_order = sort_order
        update_fields.append("sort_order")

    page_collection.updated_by_id = user_id
    page_collection.updated_at = timezone.now()
    update_fields.extend(["updated_by", "updated_at"])

    with transaction.atomic():
        page_collection.save(update_fields=update_fields)

        if collection_changed and next_collection is not None:
            transaction.on_commit(
                lambda: schedule_collection_move_updates(
                    page_ids=[str(page_collection.page_id)],
                    collection_id=str(next_collection.id),
                    slug=slug,
                    user_id=user_id,
                )
            )

    return page_collection, True


# ====================
# Unified Entity Move Operations
# ====================


def move_page_entities(
    page_ids: List[str],
    move_type: str,
    slug: str,
    user_id: str,
    project_id: Optional[str] = None,
    teamspace_id: Optional[str] = None,
) -> None:
    """
    Unified function to move all page-related entities when pages are moved.
    Handles both single page and bulk operations efficiently.

    Args:
        page_ids: List of page IDs (can be a single ID in a list)
        move_type: Type of move - "project", "workspace", or "teamspace"
        slug: Workspace slug
        user_id: ID of the user performing the move
        project_id: ID of target project (required if move_type is "project")
        teamspace_id: ID of target teamspace (required if move_type is "teamspace")

    Raises:
        ValueError: If required parameters are missing for the move type
    """
    # Validate parameters based on move type
    if move_type == "project" and not project_id:
        raise ValueError("project_id is required when move_type is 'project'")
    if move_type == "teamspace" and not teamspace_id:
        raise ValueError("teamspace_id is required when move_type is 'teamspace'")

    # Determine target project_id (None for workspace/teamspace)
    target_project_id = project_id if move_type == "project" else None

    # Common update data
    update_data = {
        "project_id": target_project_id,
        "updated_by_id": user_id,
        "updated_at": timezone.now(),
    }

    # Collection membership is only valid for workspace wiki pages.
    # If a page moves into a project or teamspace, clear any persisted
    # page-collection rows so later collection hydration cannot reattach it.
    if move_type in ["project", "teamspace"]:
        PageCollection.objects.filter(page_id__in=page_ids, workspace__slug=slug).delete()

    # 1. Update WorkItemPage - delete old associations when moving from project
    if move_type in ["workspace", "teamspace"]:
        WorkItemPage.objects.filter(
            page_id__in=page_ids,
            workspace__slug=slug,
        ).delete()

    # 2. Update FileAsset
    FileAsset.objects.filter(page_id__in=page_ids, workspace__slug=slug).update(**update_data)

    # 3. Update DeployBoard
    DeployBoard.objects.filter(
        entity_identifier__in=page_ids,
        entity_name="page",
        workspace__slug=slug,
    ).update(**update_data)

    # 4. Handle PageUser - special logic for project/teamspace membership
    if move_type == "project":
        project_members = set(
            ProjectMember.objects.filter(
                project_id=project_id,
                is_active=True,
            ).values_list("member_id", flat=True)
        )

        # Remove users not in the project
        PageUser.objects.filter(page_id__in=page_ids, workspace__slug=slug).exclude(
            user_id__in=project_members
        ).delete()

    elif move_type == "teamspace":
        teamspace_members = set(
            TeamspaceMember.objects.filter(
                team_space_id=teamspace_id,
                workspace__slug=slug,
            ).values_list("member_id", flat=True)
        )

        # Remove users not in the teamspace
        PageUser.objects.filter(page_id__in=page_ids, workspace__slug=slug).exclude(
            user_id__in=teamspace_members
        ).delete()

    # Update remaining PageUser entries
    PageUser.objects.filter(page_id__in=page_ids, workspace__slug=slug).update(**update_data)

    # 5. Update PageComment
    PageComment.objects.filter(page_id__in=page_ids, workspace__slug=slug).update(**update_data)

    # 6. Update PageCommentReaction
    PageCommentReaction.objects.filter(comment__page_id__in=page_ids, workspace__slug=slug).update(**update_data)

    # 7. Update UserFavorite
    UserFavorite.objects.filter(
        entity_identifier__in=page_ids,
        entity_type="page",
        workspace__slug=slug,
    ).update(**update_data)

    # 8. Delete UserRecentVisit (always delete when moving)
    UserRecentVisit.objects.filter(
        entity_name="page",
        entity_identifier__in=page_ids,
        workspace__slug=slug,
    ).delete()


# ====================
# move entities to project, workspace, teamspace
# ====================


def move_entities_to_project(page_ids: List[str], slug: str, user_id: str, project_id: str) -> None:
    """Move all entities for multiple pages to a project (bulk operation)."""
    move_page_entities(page_ids, "project", slug, user_id, project_id=project_id)


def move_entities_to_workspace(page_ids: List[str], slug: str, user_id: str) -> None:
    """Move all entities for multiple pages to workspace level (bulk operation)."""
    move_page_entities(page_ids, "workspace", slug, user_id)


def move_entities_to_teamspace(page_ids: List[str], slug: str, user_id: str, teamspace_id: str) -> None:
    """Move all entities for multiple pages to teamspace level (bulk operation)."""
    move_page_entities(page_ids, "teamspace", slug, user_id, teamspace_id=teamspace_id)


# ====================
# Collection Membership Recomputation
# ====================


def recompute_page_collection(page_id: str, workspace_id: str) -> None:
    """
    Enforce the collection invariant for page_id and its entire subtree.

    Decision tree:
    1. If page is ineligible (private / not global / archived / deleted):
       → delete all PageCollection rows for page + subtree
    2. If page has a parent:
       → target = parent's active collection (may be None)
    3. If page is a root (no parent):
       → target = page's own existing active collection
       → if none: assign workspace default collection
    4. Apply:
       → keep root's own row, re-sync all descendants to same collection
    """
    from plane.ee.utils.page_descendants import get_descendant_page_ids

    page = Page.objects.filter(id=page_id, workspace_id=workspace_id).first()
    if not page:
        return

    descendants = [str(d) for d in get_descendant_page_ids(page_id)]
    all_ids = [str(page_id)] + descendants

    # Ineligibility check — private, non-global, archived, or deleted pages have no collection
    if not (page.access == Page.PUBLIC_ACCESS and page.is_global and not page.archived_at and not page.deleted_at):
        PageCollection.objects.filter(page_id__in=all_ids, workspace_id=workspace_id).delete()
        return

    # Determine the target collection
    target_collection_id: Optional[str] = None

    if page.parent_id:
        # Child page: inherit from nearest ancestor that has a collection
        target_collection_id = (
            PageCollection.objects.filter(page_id=str(page.parent_id), workspace_id=workspace_id)
            .values_list("collection_id", flat=True)
            .first()
        )
        if target_collection_id:
            target_collection_id = str(target_collection_id)
    else:
        # Root page: keep existing collection, or assign default if none
        target_collection_id = (
            PageCollection.objects.filter(page_id=str(page_id), workspace_id=workspace_id)
            .values_list("collection_id", flat=True)
            .first()
        )
        if target_collection_id:
            target_collection_id = str(target_collection_id)
        else:
            default = Collection.objects.filter(workspace_id=workspace_id, is_default=True, access=0).first()
            target_collection_id = str(default.id) if default else None

    if target_collection_id:
        # Sync descendants to the same collection as the root
        if descendants:
            PageCollection.objects.filter(page_id__in=descendants, workspace_id=workspace_id).delete()
            add_pages_to_collection(descendants, target_collection_id, workspace_id)

        # Upsert the root page's own collection row
        existing = PageCollection.objects.filter(page_id=str(page_id), workspace_id=workspace_id).first()
        if not existing:
            add_pages_to_collection([str(page_id)], target_collection_id, workspace_id)
        elif str(existing.collection_id) != target_collection_id:
            existing.collection_id = target_collection_id
            existing.save(update_fields=["collection_id", "updated_at"])
    else:
        # No collection could be determined — remove all rows for the subtree
        PageCollection.objects.filter(page_id__in=all_ids, workspace_id=workspace_id).delete()
