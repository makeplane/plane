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

from django.db import migrations, transaction

logger = logging.getLogger("plane.migrations")


def backfill_issue_type_properties(apps, schema_editor):
    """
    Backfill IssueTypeProperty records from IssueProperty.issue_type FK.

    For properties that have an issue_type set but no corresponding
    IssueTypeProperty binding, create the binding record.
    """
    IssueProperty = apps.get_model("ee", "IssueProperty")
    IssueTypeProperty = apps.get_model("ee", "IssueTypeProperty")

    logger.info("Starting backfill of IssueTypeProperty bindings")

    with transaction.atomic():
        # Get property IDs that already have bindings
        existing_bindings = set(
            IssueTypeProperty.objects.filter(
                deleted_at__isnull=True
            ).values_list("property_id", flat=True)
        )
        logger.info(f"Found {len(existing_bindings)} properties with existing bindings, skipping")

        # Get properties with issue_type that don't have bindings
        properties_to_backfill = IssueProperty.objects.filter(
            issue_type_id__isnull=False,
            deleted_at__isnull=True,
        ).exclude(
            id__in=existing_bindings
        ).order_by(
            "created_at", "id"
        ).values(
            "id", "workspace_id", "issue_type_id", "is_required",
            "default_value", "is_active", "sort_order",
            "external_source", "external_id", "created_by_id", "updated_by_id"
        )

        # Bulk create IssueTypeProperty records in batches to avoid loading everything into memory
        batch_size = 1000
        bindings_batch = []
        total_created = 0

        for prop in properties_to_backfill.iterator(chunk_size=batch_size):
            bindings_batch.append(
                IssueTypeProperty(
                    workspace_id=prop["workspace_id"],
                    issue_type_id=prop["issue_type_id"],
                    property_id=prop["id"],
                    is_required=prop["is_required"],
                    default_value=prop["default_value"],
                    is_active=prop["is_active"],
                    sort_order=prop["sort_order"],
                    external_source=prop["external_source"],
                    external_id=prop["external_id"],
                    created_by_id=prop["created_by_id"],
                    updated_by_id=prop["updated_by_id"],
                )
            )

            if len(bindings_batch) >= batch_size:
                IssueTypeProperty.objects.bulk_create(bindings_batch, batch_size=batch_size, ignore_conflicts=True)
                total_created += len(bindings_batch)
                bindings_batch = []

        if bindings_batch:
            IssueTypeProperty.objects.bulk_create(bindings_batch, batch_size=batch_size, ignore_conflicts=True)
            total_created += len(bindings_batch)

        logger.info(f"Created {total_created} IssueTypeProperty bindings")


def cleanup_orphaned_property_values(apps, schema_editor):
    """
    Soft delete IssuePropertyValue records where the property is not
    bound to the issue's current type via IssueTypeProperty.
    """
    from django.utils import timezone
    from django.db.models import Exists, OuterRef

    IssuePropertyValue = apps.get_model("ee", "IssuePropertyValue")
    IssueTypeProperty = apps.get_model("ee", "IssueTypeProperty")

    cutoff = timezone.now()
    logger.info(f"Starting cleanup of orphaned IssuePropertyValues (cutoff={cutoff})")

    # Subquery: Check if a valid binding exists for (issue.type_id, property_id)
    valid_binding = IssueTypeProperty.objects.filter(
        issue_type_id=OuterRef("issue__type_id"),
        property_id=OuterRef("property_id"),
        deleted_at__isnull=True,
    )

    with transaction.atomic():
        # Find orphaned values: issue has a type but property is not bound to that type.
        # Only touch rows created before cutoff so concurrent app writes are safe.
        orphaned_with_type = IssuePropertyValue.objects.filter(
            issue__type_id__isnull=False,
            deleted_at__isnull=True,
            created_at__lt=cutoff,
        ).exclude(
            Exists(valid_binding)
        )

        # Soft delete without loading IDs into memory
        count_with_type = orphaned_with_type.update(deleted_at=cutoff)

        # Also clean up values for issues with null type (all their values are orphaned)
        null_type_values = IssuePropertyValue.objects.filter(
            issue__type_id__isnull=True,
            deleted_at__isnull=True,
            created_at__lt=cutoff,
        )
        null_type_count = null_type_values.update(deleted_at=cutoff)

        total_deleted = count_with_type + null_type_count
        logger.info(
            f"Soft deleted {total_deleted} orphaned IssuePropertyValues "
            f"({count_with_type} mismatched type, {null_type_count} null type)"
        )


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("ee", "0067_intakeemail_work_item_and_more"),
    ]

    operations = [
        migrations.RunPython(backfill_issue_type_properties, migrations.RunPython.noop),
        migrations.RunPython(cleanup_orphaned_property_values, migrations.RunPython.noop),
    ]