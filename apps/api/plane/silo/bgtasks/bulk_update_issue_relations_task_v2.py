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
from celery import shared_task
from django.db import transaction, connection

from plane.db.models import Issue, IssueRelation
from plane.db.models.work_item_relation import WorkItemRelationDefinition, RelationCategory
from plane.ee.models.job import ImportJob

logger = logging.getLogger("plane.worker")


@shared_task
def bulk_update_issue_relations_task_v2(
    payload: dict, job_id: str, project_id: str, user_id: str | None = None, slug: str | None = None, **kwargs
):
    """
    Bulk create issue relationships (parent, blocking, duplicate, custom, etc).
    Uses ignore_conflicts=True so re-imports are idempotent — existing relations
    are preserved and new ones from Jira are added.

    Args:
        payload: Dictionary containing:
            - relations_batch: List of relation data
            - workspace_id: Workspace ID
            - source: Import source
        job_id: Import job ID
        project_id: Project ID
        user_id: User ID
        slug: Workspace slug
    """
    # Extract data from payload
    relations_batch = payload.get("relations_batch", [])
    workspace_id = payload.get("workspace_id")
    source = payload.get("source")

    logger.info(f"Processing {len(relations_batch)} issue relationships for job {job_id}")

    if not relations_batch:
        logger.warning(f"No relations in batch for job {job_id}")
        return

    if not user_id:
        job = ImportJob.objects.get(id=job_id)
        user_id = job.initiator_id

    # Collect all external IDs
    all_issue_external_ids = set()

    for relation_data in relations_batch:
        all_issue_external_ids.add(relation_data["external_id"])

        relationships = relation_data.get("relationships", {})
        if relationships.get("parent"):
            all_issue_external_ids.add(relationships["parent"])
        for blocking_id in relationships.get("blocking", []):
            all_issue_external_ids.add(blocking_id)
        for blocked_id in relationships.get("is_blocked_by", []):
            all_issue_external_ids.add(blocked_id)
        for related_id in relationships.get("relates_to", []):
            all_issue_external_ids.add(related_id)
        if relationships.get("duplicate_of"):
            all_issue_external_ids.add(relationships["duplicate_of"])
        for custom_rel in relationships.get("custom_relations", []):
            all_issue_external_ids.add(custom_rel["linked_issue_external_id"])

    # Query all issues from database
    issues = Issue.objects.filter(
        external_id__in=all_issue_external_ids,
        external_source=source,
        workspace_id=workspace_id,
    ).only("external_id", "id")

    issue_map = {issue.external_id: issue.id for issue in issues}

    # Resolve/create WorkItemRelationDefinition entries.
    # Cache by name to avoid repeated DB queries.
    definition_cache = {}  # name → WorkItemRelationDefinition.id

    def get_or_create_relation_definition(name: str, defaults: dict | None = None) -> str | None:
        """Get or create a WorkItemRelationDefinition by name for this workspace."""
        name = name.strip()
        if not name:
            return None

        if name in definition_cache:
            return definition_cache[name]

        if defaults is None:
            defaults = {}

        try:
            definition, _created = WorkItemRelationDefinition.objects.get_or_create(
                workspace_id=workspace_id,
                name=name,
                deleted_at__isnull=True,
                defaults={
                    "description": defaults.get("description", f"Imported from Jira link type: {name}"),
                    "outward": defaults.get("outward", name),
                    "inward": defaults.get("inward", name),
                    "is_default": defaults.get("is_default", False),
                    "created_by_id": user_id,
                },
            )
            definition_cache[name] = definition.id
            return definition.id
        except Exception as e:
            logger.warning(f"Failed to get/create relation definition for '{name}': {e}")
            return None

    # Pre-resolve default relation definitions (seeded per workspace)
    relates_to_definition_id = get_or_create_relation_definition("Relates to")
    duplicate_definition_id = get_or_create_relation_definition("Duplicate")

    # Prepare batch operations
    issue_relations = []
    relation_issue_relations = []
    parent_updates = []

    for relation_data in relations_batch:
        external_id = relation_data["external_id"]
        issue_id = issue_map.get(external_id)

        if not issue_id:
            logger.warning(f"Issue {external_id} not found in database")
            continue

        relationships = relation_data.get("relationships", {})

        # Parent relationship
        if relationships.get("parent"):
            parent_id = issue_map.get(relationships["parent"])
            if parent_id:
                parent_updates.append((issue_id, parent_id))

        # Blocking relationships (stored as blocked_by with swapped issue/related)
        for related_external_id in relationships.get("blocking", []):
            related_id = issue_map.get(related_external_id)
            if related_id:
                issue_relations.append(
                    IssueRelation(
                        project_id=project_id,
                        workspace_id=workspace_id,
                        issue_id=related_id,
                        related_issue_id=issue_id,
                        relation_type="blocked_by",
                        created_by_id=user_id,
                        external_source=source,
                    )
                )

        # Blocked by relationships
        for related_external_id in relationships.get("is_blocked_by", []):
            related_id = issue_map.get(related_external_id)
            if related_id:
                issue_relations.append(
                    IssueRelation(
                        project_id=project_id,
                        workspace_id=workspace_id,
                        issue_id=issue_id,
                        related_issue_id=related_id,
                        relation_type="blocked_by",
                        created_by_id=user_id,
                        external_source=source,
                    )
                )

        # Related to relationships (stored as relation with definition)
        if relates_to_definition_id:
            for related_external_id in relationships.get("relates_to", []):
                related_id = issue_map.get(related_external_id)
                if related_id:
                    relation_issue_relations.append(
                        IssueRelation(
                            project_id=project_id,
                            workspace_id=workspace_id,
                            issue_id=issue_id,
                            related_issue_id=related_id,
                            category=RelationCategory.RELATION,
                            relation_type=None,
                            definition_id=relates_to_definition_id,
                            created_by_id=user_id,
                            external_source=source,
                        )
                    )

        # Duplicate of relationship (stored as relation with definition)
        if relationships.get("duplicate_of") and duplicate_definition_id:
            related_id = issue_map.get(relationships["duplicate_of"])
            if related_id:
                relation_issue_relations.append(
                    IssueRelation(
                        project_id=project_id,
                        workspace_id=workspace_id,
                        issue_id=issue_id,
                        related_issue_id=related_id,
                        category=RelationCategory.RELATION,
                        relation_type=None,
                        definition_id=duplicate_definition_id,
                        created_by_id=user_id,
                        external_source=source,
                    )
                )

        # Custom relations (unmapped Jira link types → WorkItemRelationDefinition)
        for custom_rel in relationships.get("custom_relations", []):
            linked_id = issue_map.get(custom_rel["linked_issue_external_id"])
            if not linked_id:
                continue

            link_type = custom_rel["link_type"]
            definition_id = get_or_create_relation_definition(
                link_type.get("name", ""),
                defaults={
                    "outward": link_type.get("outward", link_type.get("name", "")),
                    "inward": link_type.get("inward", link_type.get("name", "")),
                },
            )
            if not definition_id:
                continue

            # issue_id = inward issue, related_issue_id = outward issue
            if custom_rel.get("current_is_outward"):
                # Current issue is the outward side → related_issue_id = current, issue_id = linked
                rel_issue_id = linked_id
                rel_related_issue_id = issue_id
            else:
                # Current issue is the inward side → issue_id = current, related_issue_id = linked
                rel_issue_id = issue_id
                rel_related_issue_id = linked_id

            relation_issue_relations.append(
                IssueRelation(
                    project_id=project_id,
                    workspace_id=workspace_id,
                    issue_id=rel_issue_id,
                    related_issue_id=rel_related_issue_id,
                    category=RelationCategory.RELATION,
                    relation_type=None,
                    definition_id=definition_id,
                    created_by_id=user_id,
                    external_source=source,
                    external_id=custom_rel.get("link_external_id"),
                )
            )

    # Bulk create in transaction
    with transaction.atomic():
        with connection.cursor() as cur:
            cur.execute("SELECT set_config('plane.initiator_type', 'SYSTEM.IMPORT', true)")

            # Create dependency relationships (blocked_by)
            if issue_relations:
                IssueRelation.objects.bulk_create(issue_relations, ignore_conflicts=True)
                logger.info(f"Created {len(issue_relations)} dependency relations")

            # Create relation relationships (relates_to, duplicate, custom)
            if relation_issue_relations:
                IssueRelation.objects.bulk_create(relation_issue_relations, ignore_conflicts=True)
                logger.info(f"Created {len(relation_issue_relations)} relation records")

            # Update parent relationships
            for issue_id, parent_id in parent_updates:
                Issue.objects.filter(id=issue_id).update(parent_id=parent_id, updated_by_id=user_id)
            if parent_updates:
                logger.info(f"Updated {len(parent_updates)} parent relations")

    logger.info(f"Completed processing relationships for job {job_id}")
