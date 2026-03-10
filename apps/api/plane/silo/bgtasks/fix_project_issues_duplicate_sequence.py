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
from django.db.models import Max
from django.db import transaction, connection
from django.contrib.postgres.aggregates import ArrayAgg

from plane.db.models import Issue, IssueSequence, Project
from plane.utils.uuid import convert_uuid_to_integer

logger = logging.getLogger("plane.worker")


@shared_task
def fix_project_issues_duplicate_sequence(project_id: str):
    logger.info(f"Fixing issues duplicate sequence for project {project_id}")
    project = Project.objects.get(id=project_id)
    duplicate_issue_sequences_with_issues = list(
        Issue.objects.filter(project=project)
        .values("sequence_id")
        .annotate(all_issues=ArrayAgg("id"))
        .filter(all_issues__len__gt=1)
    )

    if not duplicate_issue_sequences_with_issues:
        logger.info(f"No duplicate sequences found for project {project_id}")
        return

    with transaction.atomic():
        # Using same advisory lock as Issue.save() to avoid race when assigning new sequences.
        # Lock must be inside this transaction so it is held for the entire update.
        lock_key = convert_uuid_to_integer(project.id)
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_advisory_xact_lock(%s)", [lock_key])

            logger.info(
                f"""
                Fixing issues duplicate sequence for project {project_id} 
                with {len(duplicate_issue_sequences_with_issues)} duplicate sequences
                """
            )
            last_sequence = IssueSequence.objects.filter(project=project).aggregate(largest=Max("sequence"))["largest"]
            next_sequence = last_sequence + 1 if last_sequence else 1

            for duplicate_issue in duplicate_issue_sequences_with_issues:
                logger.info(
                    f"Fixing issues duplicate sequence for project"
                    f"{project_id} and sequence {duplicate_issue['sequence_id']}"
                )
                duplicate_issue_ids = duplicate_issue["all_issues"]
                # get the issues
                issues = Issue.objects.filter(id__in=duplicate_issue_ids)

                # get the main issue (sorted by created_at and with external id)
                # or use secondary main issue first of sorted by created_at if no external id
                # update rest of the issues with the next sequence
                logger.info(f"Getting main issue for project {project_id} {duplicate_issue_ids} length {len(issues)}")
                main_issue = issues.filter(external_id__isnull=False).order_by("-created_at").first()
                if not main_issue:
                    logger.info(
                        f"No main issue found for project {project_id} and sequence {duplicate_issue['sequence_id']}"
                    )
                    main_issue = issues.filter(external_id__isnull=True).order_by("-created_at").first()
                    if not main_issue:
                        logger.info(
                            f"""
                            No secondary main issue found for project {project_id} 
                            and sequence {duplicate_issue["sequence_id"]}
                            """
                        )
                        return

                to_be_updated_issues = issues.exclude(id=main_issue.id)
                for issue in to_be_updated_issues:
                    next_sequence = update_issue_sequence(issue, project, next_sequence)

                logger.info(f"Next sequence for project {project_id} is {next_sequence}")


# update the issue sequence and return the next sequence
def update_issue_sequence(issue: Issue, project: Project, next_sequence: int):
    try:
        logger.info(
            f"""
            Updating issue {issue.id} previously had sequence {issue.sequence_id} 
            with sequence {next_sequence} for project {project.id}
            """
        )
        issue.sequence_id = next_sequence
        issue.save(disable_auto_set_user=True)
        issue_sequence, _ = IssueSequence.objects.get_or_create(
            issue=issue, project=project, defaults={"sequence": next_sequence}
        )
        if issue_sequence.sequence != next_sequence:
            issue_sequence.sequence = next_sequence
            issue_sequence.save(disable_auto_set_user=True)
        logger.info(f"Updated issue {issue.id} with sequence {next_sequence} for project {project.id}")
        return next_sequence + 1
    except Exception as e:
        logger.error(
            f"Failed to update issue {issue.id} with sequence {next_sequence} for project {project.id}: {str(e)}"
        )
        return next_sequence
