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

import time
from collections import defaultdict

from django.db.models import Exists, OuterRef
from django.db.models.functions import Greatest, Least
from django.utils import timezone
from django.db import migrations, models
import django.db.models.functions.comparison

from plane.db.models import DEFAULT_RELATION_DEFINITIONS

# CharField value -> WorkItemRelationDefinition.name
FORWARD_MAPPING = {
    "relates_to": "Relates to",
    "duplicate": "Duplicate",
    "implemented_by": "Implements",
}

# WorkItemRelationDefinition.name -> CharField value (for rollback)
REVERSE_MAPPING = {v: k for k, v in FORWARD_MAPPING.items()}

DEPENDENCY_TYPES = ("blocked_by", "start_before", "finish_before")


def seed_default_relation_definitions(apps, schema_editor):
    """Seed default WorkItemRelationDefinition rows for every workspace."""
    WorkItemRelationDefinition = apps.get_model(
        "db", "WorkItemRelationDefinition"
    )
    Workspace = apps.get_model("db", "Workspace")

    t0 = time.time()
    last_id = None
    batch_size = 2500
    workspace_count = 0
    batch_count = 0
    while True:
        # apps.get_model() uses Django's default manager (no soft-delete
        # filtering), so we must exclude soft-deleted workspaces explicitly.
        qs = Workspace.objects.filter(
            deleted_at__isnull=True
        ).order_by("id")
        if last_id is not None:
            qs = qs.filter(id__gt=last_id)
        batch = list(qs[:batch_size])
        if not batch:
            break

        batch_count += 1
        workspace_count += len(batch)
        t_batch = time.time()

        rows = []
        for ws in batch:
            for d in DEFAULT_RELATION_DEFINITIONS:
                rows.append(WorkItemRelationDefinition(workspace=ws, **d))

        WorkItemRelationDefinition.objects.bulk_create(
            rows, ignore_conflicts=True
        )
        last_id = batch[-1].id
        print(f"  [seed] batch {batch_count}: {len(batch)} workspaces in {time.time() - t_batch:.2f}s")

    print(f"  [seed] done: {workspace_count} workspaces, {batch_count} batches in {time.time() - t0:.2f}s")


def backfill_category_and_relations(apps, schema_editor):
    """
    Backfill IssueRelation rows:
    1. Set category="dependency" on dependency rows (already the default, but
       explicit for clarity).
    2. Set category="relation", definition FK, and clear relation_type
       on relation rows.
    """
    IssueRelation = apps.get_model("db", "IssueRelation")
    WorkItemRelationDefinition = apps.get_model(
        "db", "WorkItemRelationDefinition"
    )

    t0 = time.time()
    
    # Soft-delete duplicate relations, keeping the earliest row per
    # unordered pair + relation_type.
    t_dedup = time.time()
    now = timezone.now()
    
    # A row is a duplicate if an earlier row exists with the same
    # unordered pair and relation_type — soft-delete all but the first.
    earlier_exists = (
        IssueRelation.objects.filter(
            deleted_at__isnull=True,
            relation_type__isnull=False,
            relation_type=OuterRef("relation_type"),
            created_at__lt=OuterRef("created_at"),
        )
        .annotate(
            inner_min=Least("issue_id", "related_issue_id"),
            inner_max=Greatest("issue_id", "related_issue_id"),
        )
        .filter(
            inner_min=Least(
                OuterRef("issue_id"), OuterRef("related_issue_id")
            ),
            inner_max=Greatest(
                OuterRef("issue_id"), OuterRef("related_issue_id")
            ),
        )
    )

    dedup_count = (
        IssueRelation.objects.filter(
            deleted_at__isnull=True,
            relation_type__isnull=False,
        )
        .filter(Exists(earlier_exists))
        .update(deleted_at=now)
    )
    
    print(f"  [backfill] deduplicated {dedup_count} duplicate relations in {time.time() - t_dedup:.2f}s")

    # Cross-type dedup: the unique constraint is on the unordered pair
    # regardless of relation_type, so soft-delete later rows when the same
    # pair has multiple dependency types (e.g. start_before + blocked_by).
    earlier_dep_exists = (
        IssueRelation.objects.filter(
            deleted_at__isnull=True,
            relation_type__in=DEPENDENCY_TYPES,
            created_at__lt=OuterRef("created_at"),
        )
        .annotate(
            inner_min=Least("issue_id", "related_issue_id"),
            inner_max=Greatest("issue_id", "related_issue_id"),
        )
        .filter(
            inner_min=Least(
                OuterRef("issue_id"), OuterRef("related_issue_id")
            ),
            inner_max=Greatest(
                OuterRef("issue_id"), OuterRef("related_issue_id")
            ),
        )
    )

    cross_dedup_count = (
        IssueRelation.objects.filter(
            deleted_at__isnull=True,
            relation_type__in=DEPENDENCY_TYPES,
        )
        .filter(Exists(earlier_dep_exists))
        .update(deleted_at=now)
    )

    print(f"  [backfill] deduplicated {cross_dedup_count} cross-type duplicate dependencies in {time.time() - t_dedup:.2f}s")

    # Dependency rows already have category="dependency" from the default,
    # but set it explicitly for any edge cases.
    t_dep = time.time()
    dep_count = IssueRelation.objects.filter(
        relation_type__in=DEPENDENCY_TYPES,
        deleted_at__isnull=True,
    ).update(category="dependency")

    print(f"  [backfill] dependency category set on {dep_count} rows in {time.time() - t_dep:.2f}s")

    # if the dependency type is "blocks", then soft delete it as this is not visible in the UI anyway
    t_blocks = time.time()
    now = timezone.now()
    blocks_count = IssueRelation.objects.filter(
        relation_type="blocks",
        deleted_at__isnull=True,
    ).update(deleted_at=now)

    print(f"  [backfill] 'blocks' type soft-deleted on {blocks_count} rows in {time.time() - t_blocks:.2f}s")

    # Build lookup: {workspace_id: {type_name: fk_id}}
    t_lookup = time.time()
    type_lookup = defaultdict(dict)
    for rt in WorkItemRelationDefinition.objects.filter(
        name__in=FORWARD_MAPPING.values(),
        is_default=True,
        deleted_at__isnull=True,
    ).values("workspace_id", "name", "id"):
        type_lookup[rt["workspace_id"]][rt["name"]] = rt["id"]
    print(f"  [backfill] lookup built ({len(type_lookup)} workspaces) in {time.time() - t_lookup:.2f}s")

    for old_value, type_name in FORWARD_MAPPING.items():
        t_type = time.time()
        last_id = None
        batch_size = 2500
        batch_count = 0
        row_count = 0
        while True:
            qs = IssueRelation.objects.filter(
                relation_type=old_value,
                deleted_at__isnull=True,
            ).order_by("id")
            if last_id is not None:
                qs = qs.filter(id__gt=last_id)
            batch = list(qs.values("id", "workspace_id")[:batch_size])
            if not batch:
                break

            batch_count += 1
            row_count += len(batch)

            # Group by workspace for efficient FK lookup
            by_workspace = defaultdict(list)
            for row in batch:
                by_workspace[row["workspace_id"]].append(row["id"])

            for ws_id, row_ids in by_workspace.items():
                fk_id = type_lookup.get(ws_id, {}).get(type_name)
                if not fk_id:
                    # Workspace has no matching definition (e.g., soft-deleted
                    # definition with same name blocked seeding). These rows
                    # keep their CharField value and will be migrated manually.
                    continue
                IssueRelation.objects.filter(id__in=row_ids).update(
                    definition_id=fk_id,
                    relation_type=None,
                    category="relation",
                )

            last_id = batch[-1]["id"]
        print(f"  [backfill] {old_value}: {row_count} rows, {batch_count} batches in {time.time() - t_type:.2f}s")

    print(f"  [backfill] done in {time.time() - t0:.2f}s")


def reverse_backfill(apps, schema_editor):
    """Reverse: set CharField back from FK for rollback."""
    IssueRelation = apps.get_model("db", "IssueRelation")
    WorkItemRelationDefinition = apps.get_model(
        "db", "WorkItemRelationDefinition"
    )

    for rt in WorkItemRelationDefinition.objects.filter(
        name__in=REVERSE_MAPPING.keys(),
        is_default=True,
        deleted_at__isnull=True,
    ):
        old_value = REVERSE_MAPPING[rt.name]
        IssueRelation.objects.filter(
            definition_id=rt.id
        ).update(
            relation_type=old_value,
            definition_id=None,
            category="dependency",
        )


class Migration(migrations.Migration):

    atomic = False

    dependencies = [
        ("db", "0130_workitemrelationdefinition"),
    ]

    operations = [
        migrations.RunPython(
            seed_default_relation_definitions,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.RunPython(
            backfill_category_and_relations,
            reverse_code=reverse_backfill,
        ),
        # Deferred from 0130: must be added AFTER backfill corrects category
        # values. Before backfill, all rows have category="dependency" (the
        # default), which would cause false unique violations for relation rows.
        migrations.AddConstraint(
            model_name='issuerelation',
            constraint=models.UniqueConstraint(
                django.db.models.functions.comparison.Least('issue', 'related_issue'),
                django.db.models.functions.comparison.Greatest('issue', 'related_issue'),
                condition=models.Q(('category', 'dependency'), ('deleted_at__isnull', True)),
                name='issue_relation_unique_dep_per_unordered_pair',
            ),
        ),
    ]
