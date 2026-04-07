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

import logging
import uuid
from collections import defaultdict

from celery import shared_task
from django.db import transaction

from plane.db.models import Page, Workspace
from plane.ee.models import Collection, PageCollection
from plane.utils.exception_logger import log_exception

logger = logging.getLogger("plane.worker")


@shared_task(bind=True, max_retries=3, time_limit=None, soft_time_limit=None)
def seed_default_collections(self):
    """
    Background task: create a default Collection for every workspace, then link
    all public global pages (is_global=True, access=0) into their workspace's
    default collection.
    """
    try:
        workspace_owner_pairs = list(Workspace.objects.filter(deleted_at__isnull=True).values_list("id", "owner_id"))

        logger.info(f"[seed_default_collections] Found {len(workspace_owner_pairs)} workspaces")

        if not workspace_owner_pairs:
            logger.info("[seed_default_collections] No workspaces found, skipping")
            return {"status": "skipped", "reason": "no_workspaces"}

        batch_size = 5000
        total_collections = 0
        total_page_collections = 0

        # Step 1: Create one default Collection per workspace.
        for i in range(0, len(workspace_owner_pairs), batch_size):
            chunk = workspace_owner_pairs[i : i + batch_size]
            workspace_owner_map = dict(chunk)  # {workspace_id: owner_id}

            collections = [
                Collection(
                    id=uuid.uuid4(),
                    name="General",
                    workspace_id=wid,
                    owned_by_id=owner_id,
                    access=0,
                    is_default=True,
                    logo_props={},
                    sort_order=65535,
                )
                for wid, owner_id in workspace_owner_map.items()
            ]

            with transaction.atomic():
                Collection.objects.bulk_create(collections, batch_size=batch_size, ignore_conflicts=True)
            total_collections += len(collections)

            logger.info(
                f"[seed_default_collections] Collections: processed "
                f"{min(i + batch_size, len(workspace_owner_pairs))}/{len(workspace_owner_pairs)} workspaces"
            )

        logger.info(f"[seed_default_collections] Created {total_collections} default collections")

        # Step 2: Link public global pages into their workspace's default collection.
        pages = list(
            Page.objects.filter(
                is_global=True,
                access=0,  # Public
                deleted_at__isnull=True,
            )
            .order_by("workspace_id", "sort_order")
            .values_list("id", "workspace_id")
        )

        logger.info(f"[seed_default_collections] Found {len(pages)} public global pages to link")

        if pages:
            collection_map = dict(
                Collection.objects.filter(
                    is_default=True,
                    deleted_at__isnull=True,
                ).values_list("workspace_id", "id")
            )

            workspace_pages = defaultdict(list)
            for page_id, workspace_id in pages:
                workspace_pages[workspace_id].append(page_id)

            # Flatten with per-workspace sort_order reset: 10000, 20000, 30000, …
            ordered_pages = [
                (page_id, workspace_id, (idx + 1) * 10000)
                for workspace_id, page_ids in workspace_pages.items()
                for idx, page_id in enumerate(page_ids)
                if workspace_id in collection_map
            ]

            for i in range(0, len(ordered_pages), batch_size):
                chunk = ordered_pages[i : i + batch_size]

                page_collections = [
                    PageCollection(
                        id=uuid.uuid4(),
                        page_id=page_id,
                        sort_order=sort_order,
                        collection_id=collection_map[workspace_id],
                        workspace_id=workspace_id,
                    )
                    for page_id, workspace_id, sort_order in chunk
                ]

                with transaction.atomic():
                    PageCollection.objects.bulk_create(page_collections, batch_size=batch_size, ignore_conflicts=True)
                total_page_collections += len(page_collections)

                logger.info(
                    f"[seed_default_collections] Page links: processed "
                    f"{min(i + batch_size, len(ordered_pages))}/{len(ordered_pages)} pages"
                )

        logger.info(
            f"[seed_default_collections] Complete — {total_collections} default collections, "
            f"{total_page_collections} page-collection links created"
        )
        return {
            "status": "success",
            "total_collections": total_collections,
            "total_page_collections": total_page_collections,
        }

    except Exception as e:
        log_exception(e)
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=60 * (2**self.request.retries))
        return {"status": "error", "message": str(e)}
