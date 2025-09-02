# Python imports
import logging

# Third party imports
from celery import shared_task
import requests
from django.db import transaction, connection
from django.conf import settings

from plane.utils.exception_logger import log_exception
from plane.utils.helpers import get_boolean_value
from plane.api.serializers.issue import IssueSerializer
from plane.db.models.issue import Issue, IssueLink, IssueComment
from plane.db.models.project import Project
from plane.db.models.cycle import CycleIssue
from plane.db.models.module import ModuleIssue
from plane.db.models.workspace import Workspace
from plane.db.models.asset import FileAsset
from plane.db.models.page import Page, ProjectPage
from plane.ee.models import IssueProperty, IssuePropertyValue
from plane.ee.utils.external_issue_property_validator import (
    externalIssuePropertyValueSaver,
    externalIssuePropertyValueValidator,
)
from plane.silo.bgtasks.bulk_update_issue_relations_task import (
    bulk_update_issue_relations_task,
)

logger = logging.getLogger("plane.worker")


def dispatch_job_completion(job_id, phase="issues", is_last_batch=False):
    """Dispatch the job completion to silo service"""
    try:
        silo_url = settings.SILO_URL.rstrip("/")
        endpoint = f"{silo_url}/api/jobs/{job_id}/finished/"

        response = requests.post(
            endpoint,
            json={"jobId": job_id, "phase": phase, "isLastBatch": is_last_batch},
            headers={"Content-Type": "application/json"},
        )

        if response.status_code != 200:
            logger.error(
                "Error updating job batch completion",
                extra={
                    "jobId": job_id,
                    "phase": phase,
                    "isLastBatch": is_last_batch,
                },
            )

    except Exception as e:
        logger.error(
            "Failed to update job batch completion",
            extra={
                "jobId": job_id,
                "phase": phase,
                "isLastBatch": is_last_batch,
            },
        )
        log_exception(e)


def update_job_batch_completion(
    job_id,
    imported_batch_count=0,
    total_issues=0,
    imported_issues=0,
    phase="issues",
    is_last_batch=False,
):
    """Update the job report with batch and issue counts"""
    try:
        from plane.ee.models import ImportJob
        from django.utils import timezone

        # Use F() expressions to handle concurrency safely
        from django.db.models import F
        from django.db.models.functions import Coalesce

        # Get the job and its report
        job = ImportJob.objects.select_related("report").get(pk=job_id)

        # Get the model class from the instance
        ReportModel = job.report.__class__

        # Update counters atomically at database level
        ReportModel.objects.filter(id=job.report.id).update(
            # Coalesce handles NULL values by replacing them with 0 before adding
            imported_batch_count=Coalesce(F("imported_batch_count"), 0)
            + imported_batch_count,
            total_issue_count=Coalesce(F("total_issue_count"), 0) + total_issues,
            imported_issue_count=Coalesce(F("imported_issue_count"), 0)
            + imported_issues,
            errored_issue_count=Coalesce(F("errored_issue_count"), 0)
            + (total_issues - imported_issues),
            completed_batch_count=Coalesce(F("completed_batch_count"), 0)
            + (1 if imported_batch_count > 0 else 0),
            updated_at=timezone.now(),
        )

        # Refresh the object to get updated values
        job.report.refresh_from_db()

        logger.info(
            "Updated job batch completion",
            extra={
                "jobId": job_id,
                "isLastBatch": is_last_batch,
                "phase": phase,
                "imported_batch_count": imported_batch_count,
                "total_issues": total_issues,
                "imported_issues": imported_issues,
                "completed_batch_count": job.report.completed_batch_count,
                "total_batch_count": job.report.total_batch_count,
            },
        )

        # Check if all batches are processed and update job status
        if (
            job.report.completed_batch_count >= job.report.total_batch_count
            or is_last_batch
        ):
            """
            We'll make an api call to silo, such that silo can perform
            any additional processing along with marking the job as finished
            """
            bulk_update_issue_relations_task(job_id, user_id=job.initiator_id)
            dispatch_job_completion(job_id, phase, is_last_batch)

    except ImportJob.DoesNotExist:
        logger.error(
            "Job not found with id",
            extra={"jobId": job_id},
        )
    except Exception as e:
        logger.error(
            "Failed to update job batch completion",
            extra={"jobId": job_id},
        )
        log_exception(e)


def sanitize_issue_data(issue_data):
    """
    Sanitize the issue data
    """
    # limit the name to 255 characters
    issue_data["name"] = issue_data["name"][:255]

    return issue_data


def process_single_issue(slug, project, user_id, issue_data):
    try:
        with transaction.atomic():
            with connection.cursor() as cur:
                cur.execute(
                    "SELECT set_config('plane.initiator_type', 'SYSTEM.IMPORT', true)"
                )
            # Process the main issue
            issue_data = sanitize_issue_data(issue_data)
            serializer = IssueSerializer(
                data=issue_data,
                context={
                    "project_id": project.id,
                    "workspace_id": project.workspace_id,
                    "default_assignee_id": project.default_assignee_id,
                },
            )

            if not serializer.is_valid():
                logger.error(
                    "Error processing issue",
                    extra={"issueId": issue_data.get("id")},
                )
                # Create an exception for serializer.errors
                exception = Exception(serializer.errors)
                log_exception(exception)
                return None

            external_id = issue_data.get("external_id")
            external_source = issue_data.get("external_source")

            # Check if issue exists
            issue = None
            if external_id and external_source:
                issue = Issue.objects.filter(
                    project_id=project.id,
                    workspace__slug=slug,
                    external_source=external_source,
                    external_id=external_id,
                ).first()

            if issue:
                serializer.instance = issue

            issue = serializer.save()

            # Update the issue with the created_by_id
            issue.created_by_id = issue_data.get("created_by")
            issue.updated_by_id = issue_data.get("created_by")
            issue.save(disable_auto_set_user=True)

            # Process links
            process_issue_links(issue, issue_data.get("links", []))

            # Process comments
            process_issue_comments(
                user_id=user_id, issue=issue, comments=issue_data.get("comments", [])
            )

            # Process cycles
            process_issue_cycles(issue, issue_data.get("cycles", []))

            # Process modules
            process_issue_modules(issue, issue_data.get("modules", []))

            # Process file assets
            process_issue_file_assets(issue, issue_data.get("file_assets", []))

            # Process issue property values
            process_issue_property_values(
                issue, issue_data.get("issue_property_values", [])
            )

            return issue
    except Exception as e:
        logger.error(
            "Error processing issue",
            extra={"issueId": issue_data.get("id")},
        )
        log_exception(e)
        return None


def process_issue_links(issue, links):
    bulk_create_links = []

    # Get existing links
    existing_links = list(
        IssueLink.objects.filter(
            issue=issue, project_id=issue.project_id, workspace_id=issue.workspace_id
        ).values_list("url", flat=True)
    )

    for link_data in links:
        if link_data["url"] not in existing_links:
            bulk_create_links.append(
                IssueLink(
                    issue=issue,
                    project_id=issue.project_id,
                    workspace_id=issue.workspace_id,
                    title=link_data["name"],
                    url=link_data["url"],
                    created_by_id=issue.created_by_id,
                    updated_by_id=issue.created_by_id,
                )
            )

    IssueLink.objects.bulk_create(
        bulk_create_links, batch_size=100, ignore_conflicts=True
    )
    return


def process_issue_comments(user_id, issue, comments):
    if not comments:
        return

    bulk_create_comments = []
    bulk_update_comments = []

    # Get existing comments for this issue only
    existing_comments_map = {
        str(comment.external_id): comment
        for comment in IssueComment.objects.filter(
            issue=issue,
            project_id=issue.project_id,
            workspace_id=issue.workspace_id,
            external_id__in=[
                str(c.get("external_id")) for c in comments if c.get("external_id")
            ],
        )
    }

    for comment_data in comments:
        external_id = (
            str(comment_data.get("external_id"))
            if comment_data.get("external_id")
            else None
        )

        # Skip if no external_id
        if not external_id:
            continue

        comment_actor = (
            comment_data.get("actor") if comment_data.get("actor") else user_id
        )
        if external_id in existing_comments_map:
            # Update case
            existing_comment = existing_comments_map[external_id]
            existing_comment.actor_id = comment_actor
            existing_comment.created_by_id = comment_actor
            existing_comment.updated_by_id = comment_actor
            existing_comment.comment_html = comment_data["comment_html"]
            bulk_update_comments.append(existing_comment)
        else:
            # Create case

            comment = IssueComment(
                issue=issue,
                project_id=issue.project_id,
                workspace_id=issue.workspace_id,
                comment_html=comment_data["comment_html"],
                actor_id=comment_actor,
                created_by_id=comment_actor,
                external_id=external_id,
                external_source=comment_data.get("external_source"),
                updated_by_id=comment_actor,
            )
            bulk_create_comments.append(comment)

    # Bulk create new comments
    created_comments = IssueComment.objects.bulk_create(
        bulk_create_comments, batch_size=100, ignore_conflicts=True
    )

    # Bulk update existing comments
    if bulk_update_comments:
        IssueComment.objects.bulk_update(
            bulk_update_comments,
            ["comment_html", "actor_id", "created_by_id", "updated_by_id"],
            batch_size=100,
        )

    # Process file assets for each comment
    for comment in created_comments:
        comment_data = next(
            (
                c
                for c in comments
                if str(c.get("external_id")) == str(comment.external_id)
            ),
            None,
        )
        if comment_data and comment_data.get("file_assets"):
            process_comment_file_assets(comment, comment_data["file_assets"])

    for comment in bulk_update_comments:
        comment_data = next(
            (
                c
                for c in comments
                if str(c.get("external_id")) == str(comment.external_id)
            ),
            None,
        )
        if comment_data and comment_data.get("file_assets"):
            process_comment_file_assets(comment, comment_data["file_assets"])

    return


def process_issue_cycles(issue, cycle_ids):
    # Create new cycle associations without deleting existing ones
    for cycle_id in cycle_ids:
        CycleIssue.objects.get_or_create(
            issue=issue,
            project_id=issue.project_id,
            workspace_id=issue.workspace_id,
            cycle_id=cycle_id,
            defaults={
                "created_by_id": issue.created_by_id,
                "updated_by_id": issue.created_by_id,
            },
        )
    return


def process_issue_modules(issue, module_ids):
    # Create new module associations without deleting existing ones
    for module_id in module_ids:
        ModuleIssue.objects.get_or_create(
            issue=issue,
            project_id=issue.project_id,
            workspace_id=issue.workspace_id,
            module_id=module_id,
            defaults={
                "created_by_id": issue.created_by_id,
                "updated_by_id": issue.created_by_id,
            },
        )
    return


def process_comment_file_assets(comment, file_assets):
    if not file_assets:
        return

    # Get all assets by their IDs
    asset_ids = [asset_id for asset_id in file_assets if asset_id]
    if not asset_ids:
        return

    # Bulk update all assets
    FileAsset.objects.filter(id__in=asset_ids).update(
        entity_type=FileAsset.EntityTypeContext.COMMENT_DESCRIPTION,
        comment_id=comment.id,
        project_id=comment.project_id,
        workspace_id=comment.workspace_id,
        created_by_id=comment.created_by_id,
        updated_by_id=comment.updated_by_id,
    )
    return


def process_issue_file_assets(issue, file_assets):
    if not file_assets:
        return

    # Get all assets by their IDs
    asset_ids = [asset_id for asset_id in file_assets if asset_id]
    if not asset_ids:
        return

    # Bulk update all assets
    FileAsset.objects.filter(id__in=asset_ids).update(
        entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
        issue_id=issue.id,
        project_id=issue.project_id,
        workspace_id=issue.workspace_id,
        created_by_id=issue.created_by_id,
        updated_by_id=issue.created_by_id,
    )
    return


def process_issue_property_values(issue, issue_property_values):
    workspace = Workspace.objects.get(pk=issue.workspace_id)

    for property_data in issue_property_values:
        property_id = property_data.get("id")
        if not property_id:
            continue

        issue_property = IssueProperty.objects.get(pk=property_id)

        # existing issue property values
        existing_issue_property_values = IssuePropertyValue.objects.filter(
            workspace__slug=workspace.slug,
            project_id=issue.project_id,
            issue_id=issue.id,
            property_id=property_id,
            property__issue_type__is_epic=False,
        )

        issue_property_values = property_data.get("values", [])

        if not issue_property_values:
            continue

        # validate the property value
        bulk_external_issue_property_values = []
        for value in issue_property_values:
            # check if ant external id and external source is provided
            property_value = value.get("value", None)

            if property_value:
                externalIssuePropertyValueValidator(
                    issue_property=issue_property, value=property_value
                )

                # check if issue property with the same external id and external source already exists
                property_external_id = value.get("external_id", None)
                property_external_source = value.get("external_source", None)

                if property_value in ["true", "false"]:
                    property_value = get_boolean_value(property_value)

                # Save the values
                bulk_external_issue_property_values.append(
                    externalIssuePropertyValueSaver(
                        workspace_id=issue.workspace.id,
                        project_id=issue.project_id,
                        issue_id=issue.id,
                        issue_property=issue_property,
                        value=property_value,
                        external_id=property_external_id,
                        external_source=property_external_source,
                    )
                )

        #  remove the existing issue property values
        existing_issue_property_values.delete()

        # Bulk create the issue property values
        IssuePropertyValue.objects.bulk_create(
            bulk_external_issue_property_values, batch_size=10
        )


def process_issues(slug, project, user_id, issue_list):
    """
    Process issues for import
    Args:
        slug (str): Workspace slug
        project (Project): Project object
        user_id (str): User ID
        issue_list (list): List of issue data dictionaries
    Returns:
        tuple: (imported_issues_count, total_issues_count, external_id_map)
    """
    external_id_map = {}
    total_issues = len(issue_list)
    imported_issues = 0

    if not issue_list:
        return imported_issues, total_issues, external_id_map

    # First pass: Create/Update parent issues
    with transaction.atomic():
        for issue_data in issue_list:
            if issue_data.get("parent") is None:
                issue = process_single_issue(slug, project, user_id, issue_data)
                if issue:
                    imported_issues += 1
                    if issue_data.get("external_id"):
                        external_id_map[issue_data["external_id"]] = str(issue.id)

    # Second pass: Create/Update child issues
    with transaction.atomic():
        for issue_data in issue_list:
            if issue_data.get("parent") is not None:
                parent_external_id = issue_data["parent"]
                if parent_external_id in external_id_map:
                    issue_data["parent"] = external_id_map[parent_external_id]
                else:
                    parent_issue = Issue.objects.filter(
                        project_id=project.id,
                        workspace__slug=slug,
                        external_id=parent_external_id,
                        external_source=issue_data.get("external_source"),
                    ).first()
                    issue_data["parent"] = (
                        str(parent_issue.id) if parent_issue else None
                    )

                issue = process_single_issue(slug, project, user_id, issue_data)
                if issue:
                    imported_issues += 1
                    if issue_data.get("external_id"):
                        external_id_map[issue_data["external_id"]] = str(issue.id)

    return imported_issues, total_issues, external_id_map


def process_pages(slug, project_id, user_id, page_list):
    """
    Process pages for import with bulk operations
    Args:
        slug (str): Workspace slug
        project_id (str): Project ID
        user_id (str): User ID
        page_list (list): List of page data dictionaries
    Returns:
        tuple: (imported_pages_count, total_pages_count)
    """
    total_pages = len(page_list)
    imported_pages = 0

    if not page_list:
        return imported_pages, total_pages

    # Get workspace id from slug
    workspace = Workspace.objects.get(slug=slug)

    # Pages to create vs update
    pages_to_create = []
    pages_to_update = []

    # First, identify existing pages by external id
    external_ids_map = {
        (p.get("external_id"), p.get("external_source")): p
        for p in page_list
        if p.get("external_id") and p.get("external_source")
    }

    # Get all existing pages in one query
    if external_ids_map:
        existing_pages = Page.objects.filter(
            workspace__id=workspace.id,
            projects__id=project_id,
            external_id__in=[key[0] for key in external_ids_map.keys()],
            external_source__in=list(set(key[1] for key in external_ids_map.keys())),
        )

        # Create lookup map for existing pages
        existing_pages_map = {
            (page.external_id, page.external_source): page for page in existing_pages
        }
    else:
        existing_pages_map = {}

    # Process each page for bulk operations
    with transaction.atomic():
        # Handle updates first
        for key, page_data in external_ids_map.items():
            if key in existing_pages_map:
                # Update case
                page = existing_pages_map[key]
                for field, value in page_data.items():
                    # Skip fields that shouldn't be directly updated
                    if field in [
                        "id",
                        "created_at",
                        "updated_at",
                        "created_by",
                        "projects",
                    ]:
                        continue
                    setattr(page, field, value)
                pages_to_update.append(page)
            else:
                # New pages to create
                new_page = Page(
                    workspace_id=workspace.id,
                    name=page_data.get("name", "Untitled Page"),
                    external_id=page_data.get("external_id"),
                    external_source=page_data.get("external_source"),
                    description=page_data.get("description", {}),
                    description_html=page_data.get("description_html", "<p></p>"),
                    description_binary=page_data.get("description_binary"),
                    owned_by_id=user_id,
                    created_by_id=user_id,
                    updated_by_id=user_id,
                )
                pages_to_create.append(new_page)

        # For pages without external ids
        for page_data in [
            p
            for p in page_list
            if not (p.get("external_id") and p.get("external_source"))
        ]:
            new_page = Page(
                workspace_id=workspace.id,
                name=page_data.get("name", "Untitled Page"),
                external_id=page_data.get("external_id"),
                external_source=page_data.get("external_source"),
                description=page_data.get("description", {}),
                description_html=page_data.get("description_html", "<p></p>"),
                description_binary=page_data.get("description_binary"),
                owned_by_id=user_id,
                created_by_id=user_id,
                updated_by_id=user_id,
            )
            pages_to_create.append(new_page)

        # Bulk update existing pages
        if pages_to_update:
            fields_to_update = [
                "name",
                "description",
                "description_html",
                "description_binary",
                "owned_by_id",
                "updated_by_id",
            ]
            Page.objects.bulk_update(pages_to_update, fields_to_update, batch_size=100)
            imported_pages += len(pages_to_update)

        # Bulk create new pages
        if pages_to_create:
            created_pages = Page.objects.bulk_create(pages_to_create, batch_size=100)
            imported_pages += len(created_pages)

            ProjectPage.objects.bulk_create(
                [
                    ProjectPage(
                        page=page, project_id=project_id, workspace_id=workspace.id
                    )
                    for page in created_pages
                ],
                batch_size=1000,
            )

    return imported_pages, total_pages


@shared_task
def import_data(slug, project_id, user_id, job_id, payload):
    """
    Import issues and pages into a project
    Args:
        slug (str): Workspace slug
        project_id (str): Project ID
        user_id (str): User ID
        job_id (str): Job ID for tracking batch completion
        payload (dict): Dictionary containing lists of 'issues' and 'pages'.
    """
    try:
        project = Project.objects.get(pk=project_id)
        imported_issues = 0
        total_issues = 0
        imported_pages = 0
        total_pages = 0

        # Process issues
        issue_list = payload.get("issues")
        job_phase = payload.get("phase", "issues")
        is_last_batch = payload.get("isLastBatch", False)

        logger.info(
            "inside import_data task",
            extra={
                "jobId": job_id,
                "phase": job_phase,
                "issueCount": len(issue_list or []),
                "lastBatchData": is_last_batch,
            },
        )

        if issue_list:
            imported_issues, total_issues, external_id_map = process_issues(
                slug, project, user_id, issue_list
            )
            update_job_batch_completion(
                job_id, 1, total_issues, imported_issues, job_phase, is_last_batch
            )

        # Handle edge-case where a batch contains no issues.
        # Without this, completed_batch_count never increments for such batches,
        # leaving the job in an endless "TRANSFORMING" state.
        if not issue_list:
            update_job_batch_completion(job_id, 0, 0, 0, job_phase, is_last_batch)

        # Process pages
        page_list = payload.get("pages")
        if page_list:
            imported_pages, total_pages = process_pages(
                slug, project_id, user_id, page_list
            )
            update_job_batch_completion(
                job_id, 1, total_pages, imported_pages, "pages", is_last_batch
            )

        if not page_list:
            update_job_batch_completion(job_id, 0, 0, 0, "pages", is_last_batch)

        logger.info(
            f"Processed {imported_issues}/{total_issues} issues and {imported_pages}/{total_pages} pages."
        )
        return True
    except Exception as e:
        # Assuming there's error handling in the calling code
        logger.error(
            "Error in import_data",
            extra={"jobId": job_id, "phase": job_phase, "isLastBatch": is_last_batch},
        )
        log_exception(e)
        # increase the error batch count and completed batch count
        from plane.ee.models import ImportJob
        from django.db.models import F

        job = ImportJob.objects.get(pk=job_id)
        if job.report:
            job.report.__class__.objects.filter(id=job.report.id).update(
                errored_batch_count=F("errored_batch_count") + 1,
                completed_batch_count=F("completed_batch_count") + 1,
            )

            # Safely fetch phase and last-batch flag from the original payload;
            # they may not be in scope if the error occurred before variables were set.
            safe_job_phase = payload.get("phase", "issues")
            safe_is_last_batch = payload.get("isLastBatch", False)

            dispatch_job_completion(job_id, safe_job_phase, safe_is_last_batch)

        return False
