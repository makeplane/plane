# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import transaction

# Module imports
from plane.db.models import IssueType, ProductType, Workspace, WorkItemKind

INITIAL_PRODUCT_TYPES = ("Аналитическая презентация", "Аналитическая записка", "Датасет")


def get_meeting_work_item_type(workspace_id):
    """Return the system type of meetings, creating it on first use."""
    found = IssueType.objects.filter(workspace_id=workspace_id, kind=WorkItemKind.MEETING).first()
    if found:
        return found
    with transaction.atomic():
        Workspace.objects.select_for_update().get(pk=workspace_id)
        work_item_type, _ = IssueType.objects.get_or_create(
            workspace_id=workspace_id, kind=WorkItemKind.MEETING, defaults={"name": "Meeting"}
        )
    return work_item_type


def get_product_work_item_type(workspace_id):
    """
    Return the system type of products, creating it on first use.

    The initial product types are created together with it, so the ones an admin deletes later
    do not come back.
    """
    found = IssueType.objects.filter(workspace_id=workspace_id, kind=WorkItemKind.PRODUCT).first()
    if found:
        return found
    with transaction.atomic():
        # Serializes concurrent first uses.
        Workspace.objects.select_for_update().get(pk=workspace_id)
        work_item_type, created = IssueType.objects.get_or_create(
            workspace_id=workspace_id, kind=WorkItemKind.PRODUCT, defaults={"name": "Product"}
        )
        if created:
            for index, name in enumerate(INITIAL_PRODUCT_TYPES, start=1):
                ProductType.objects.get_or_create(
                    workspace_id=workspace_id, name=name, defaults={"sort_order": index * 10000}
                )
    return work_item_type
