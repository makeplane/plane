import logging
from celery import shared_task

from plane.db.models import Issue, IssueRelation
from plane.ee.models.job import ImportJob
from django.db import transaction, connection

logger = logging.getLogger("plane.worker")


@shared_task
def bulk_update_issue_relations_task(job_id: str, user_id: str | None = None):
    logger.info(f"Bulk updating issue relations for job {job_id}")
    job = ImportJob.objects.get(id=job_id)
    relation_map = job.relation_map
    source = job.source
    project_id = job.project_id
    workspace_id = job.workspace_id

    if relation_map is None or "issue" not in relation_map:
        logger.warning(f"No relation map found for job {job_id}")
        return

    if not user_id:
        user_id = job.initiator_id

    all_relations = set()
    parent_id_relations = set()

    # Get all external IDs involved
    all_ex_issues = set()

    # Separate regular relations and parent_id relations
    for ex_issue_id, relations in relation_map["issue"].items():
        all_ex_issues.add(ex_issue_id)
        for relation in relations:
            all_ex_issues.add(relation["identifier"])
            if relation["relation"] == "parent_id":
                parent_id_relations.add((ex_issue_id, relation["identifier"]))
            else:
                all_relations.add(
                    (ex_issue_id, relation["identifier"], relation["relation"])
                )

    # Get all issues from database
    issues = Issue.objects.filter(
        external_id__in=all_ex_issues,
        external_source=source,
        workspace_id=workspace_id,
    ).only("external_id", "id")

    issues_by_external_id = {issue.external_id: issue.id for issue in issues}

    # Create regular relations
    issue_relations = []
    for ex_issue_id, related_ex_id, relation_type in all_relations:
        issue_id = issues_by_external_id.get(ex_issue_id)
        related_issue_id = issues_by_external_id.get(related_ex_id)

        if not (issue_id and related_issue_id):
            logger.warning(f"Issue {ex_issue_id} or {related_ex_id} not found")
            continue

        issue_relations.append(
            IssueRelation(
                project_id=project_id,
                workspace_id=workspace_id,
                issue_id=issue_id,
                related_issue_id=related_issue_id,
                relation_type=relation_type,
                created_by_id=user_id,
            )
        )
    with transaction.atomic():
        with connection.cursor() as cur:
            cur.execute("SET LOCAL plane.initiator_type = 'SYSTEM.IMPORT'")
            # Bulk create relations, ignoring any duplicates
            IssueRelation.objects.bulk_create(issue_relations, ignore_conflicts=True)

    # Handle parent_id relations
    for ex_issue_id, parent_ex_id in parent_id_relations:
        issue_id = issues_by_external_id.get(ex_issue_id)
        parent_id = issues_by_external_id.get(parent_ex_id)

        if not (issue_id and parent_id):
            logger.warning(f"Issue {ex_issue_id} or parent {parent_ex_id} not found")
            continue

        with connection.cursor() as cur:
            cur.execute("SET LOCAL plane.initiator_type = 'SYSTEM.IMPORT'")
            # Update parent_id
            Issue.objects.filter(id=issue_id).update(
                parent_id=parent_id, updated_by_id=user_id
            )
