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

from django.conf import settings
from django.db import migrations

logger = logging.getLogger("plane.migrations")



def backfill_default_collections(apps, schema_editor):
    """Dispatch background task to seed WorkflowState entries for all default workflows."""
    try:
        from plane.ee.bgtasks.seed_workflow_projects_task import seed_workflow_default_states

        # If self-managed, run synchronously to ensure data consistency before proceeding. Otherwise, dispatch as a background task.
        if settings.IS_SELF_MANAGED:
            seed_workflow_default_states()
        else:
            seed_workflow_default_states.delay()
        logger.info("Dispatched seed_workflow_default_states background task")
    except Exception as e:
        logger.warning(f"Could not dispatch seed_workflow_default_states task: {e}")

def backfill_default_collections(apps, schema_editor):
    """
    For self-managed instances: run the default collection backfill synchronously.
    For cloud: skip — run `python manage.py seed_default_collections` separately.
    """
    if not settings.IS_SELF_MANAGED:
        # for cloud instance, run the management command directly"
        return

    try:
        from plane.ee.bgtasks.seed_default_collections_task import seed_default_collections

        seed_default_collections()
        logger.info("Default collection backfill complete")
    except Exception as e:
        logger.warning(f"Default collection backfill failed: {e}")


def reverse_backfill(apps, schema_editor):
    """Reverse: remove all PageCollection rows that point to default collections, then delete those collections."""
    Collection = apps.get_model("ee", "Collection")
    PageCollection = apps.get_model("ee", "PageCollection")

    default_collection_ids = Collection.objects.filter(is_default=True).values_list("id", flat=True)
    deleted_links, _ = PageCollection.objects.filter(collection_id__in=default_collection_ids).delete()
    deleted_cols, _ = Collection.objects.filter(is_default=True).delete()

    logger.info(
        f"Reverse backfill: deleted {deleted_links} page-collection links and {deleted_cols} default collections"
    )


class Migration(migrations.Migration):

    atomic = False

    dependencies = [
        ("ee", "0082_collection_pagecollection_collectionmember_and_more"),
    ]

    operations = [
        migrations.RunPython(backfill_default_collections, reverse_backfill),
    ]
