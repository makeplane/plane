# Third party imports
from celery import shared_task
from django.db import transaction
import traceback
import requests
from django.conf import settings

from plane.api.serializers.issue import IssueSerializer, IssueLinkSerializer, IssueCommentSerializer
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models.issue import Issue, IssueLink, IssueComment
from plane.db.models.project import Project
from plane.db.models.cycle import CycleIssue
from plane.db.models.module import ModuleIssue
from plane.db.models.workspace import Workspace
from plane.db.models.asset import FileAsset
from plane.ee.models import IssueProperty, IssuePropertyValue, PropertyTypeEnum
from django.db.models import F, Value, Case, When, Q, CharField, Func
from django.db.models.functions import Cast
from django.contrib.postgres.aggregates import ArrayAgg
from django.conf import settings
from django.utils import timezone
import uuid

def update_job_batch_completion(job_id):
    """Update the job batch completion status via API call to silo service"""
    try:
        silo_url = settings.SILO_HOSTNAME.rstrip("/")
        silo_base_path = settings.SILO_BASE_PATH.rstrip("/")
        endpoint = f"{silo_url}/{silo_base_path}/api/jobs/{job_id}/batch-complete/"

        response = requests.post(
            endpoint,
            json={"jobId": job_id},
            headers={"Content-Type": "application/json"}
        )

        if response.status_code != 200:
            print(f"Error updating job batch completion: {response.text}")

    except Exception as e:
        print(f"Failed to update job batch completion: {str(e)}")

def process_single_issue(slug, project, user_id, issue_data):
    try:
        with transaction.atomic():
            # Process the main issue
            serializer = IssueSerializer(
                data=issue_data,
                context={
                    "project_id": project.id,
                    "workspace_id": project.workspace_id,
                    "default_assignee_id": project.default_assignee_id,
                },
            )

            if not serializer.is_valid():
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

            # Process links
            process_issue_links(issue, issue_data.get("links", []))

            # Process comments
            process_issue_comments(user_id=user_id, issue=issue, comments=issue_data.get("comments", []))

            # Process cycles
            process_issue_cycles(issue, issue_data.get("cycles", []))

            # Process modules
            process_issue_modules(issue, issue_data.get("modules", []))

            # Process file assets
            process_issue_file_assets(issue, issue_data.get("file_assets", []))

            # Process issue property values
            process_issue_property_values(issue, issue_data.get("issue_property_values", []))

            return issue
    except Exception as e:
        print(traceback.print_exc())
        print(f"Error processing issue: {str(e)}")
        return None


def process_issue_links(issue, links):
    bulk_create_links = []

    # Get existing links
    existing_links = list(IssueLink.objects.filter(issue=issue, project_id=issue.project_id, workspace_id=issue.workspace_id).values_list("url", flat=True))

    for link_data in links:
        if link_data["url"] not in existing_links:
            bulk_create_links.append(
                IssueLink(
                    issue=issue,
                    project_id=issue.project_id,
                    workspace_id=issue.workspace_id,
                    title=link_data["name"],
                    url=link_data["url"],
                )
            )

    IssueLink.objects.bulk_create(bulk_create_links, batch_size=100, ignore_conflicts=True)
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
            external_id__in=[str(c.get("external_id")) for c in comments if c.get("external_id")]
        )
    }

    for comment_data in comments:
        external_id = str(comment_data.get("external_id")) if comment_data.get("external_id") else None

        # Skip if no external_id
        if not external_id:
            continue

        if external_id in existing_comments_map:
            # Update case
            existing_comment = existing_comments_map[external_id]
            existing_comment.comment_html = comment_data["comment_html"]
            bulk_update_comments.append(existing_comment)
        else:
            # Create case
            comment = IssueComment(
                issue=issue,
                project_id=issue.project_id,
                workspace_id=issue.workspace_id,
                comment_html=comment_data["comment_html"],
                actor_id=user_id,
                created_by_id=user_id,
                external_id=external_id,
                external_source=comment_data.get("external_source"),
            )
            bulk_create_comments.append(comment)

    # Bulk create new comments
    created_comments = IssueComment.objects.bulk_create(
        bulk_create_comments,
        batch_size=100,
        ignore_conflicts=True
    )

    # Bulk update existing comments
    if bulk_update_comments:
        IssueComment.objects.bulk_update(
            bulk_update_comments,
            ["comment_html"],
            batch_size=100
        )

    # Process file assets for each comment
    for comment in created_comments:
        comment_data = next(
            (c for c in comments if str(c.get("external_id")) == str(comment.external_id)),
            None
        )
        if comment_data and comment_data.get("file_assets"):
            process_comment_file_assets(comment, comment_data["file_assets"])

    for comment in bulk_update_comments:
        comment_data = next(
            (c for c in comments if str(c.get("external_id")) == str(comment.external_id)),
            None
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
            cycle_id=cycle_id
        )
    return

def process_issue_modules(issue, module_ids):
    # Create new module associations without deleting existing ones
    for module_id in module_ids:
        ModuleIssue.objects.get_or_create(
            issue=issue,
            project_id=issue.project_id,
            workspace_id=issue.workspace_id,
            module_id=module_id
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
        workspace_id=comment.workspace_id
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
        workspace_id=issue.workspace_id
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
                property_external_source = value.get(
                    "external_source", None
                )

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

@shared_task
def import_data(slug, project_id, user_id, job_id, payload):
    """
    Import issues into a project
    Args:
        slug (str): Workspace slug
        project_id (str): Project ID
        user_id (str): User ID
        job_id (str): Job ID for tracking batch completion
        payload (list): List of issues to import
    """
    try:
        project = Project.objects.get(pk=project_id)
        external_id_map = {}

        # First pass: Create/Update all parent issues (where parent is None)
        with transaction.atomic():
            for issue_data in payload:
                if issue_data.get("parent") is None:
                    issue = process_single_issue(slug, project, user_id, issue_data)
                    if issue and issue_data.get("external_id"):
                        external_id_map[issue_data["external_id"]] = str(issue.id)

        # Second pass: Create/Update all child issues
        with transaction.atomic():
            for issue_data in payload:
                if issue_data.get("parent") is not None:
                    # Replace parent external_id with actual issue id
                    parent_external_id = issue_data["parent"]
                    if parent_external_id in external_id_map:
                        issue_data["parent"] = external_id_map[parent_external_id]
                    else:
                        # Check if parent exists in database
                        parent_issue = Issue.objects.filter(
                            project_id=project_id,
                            workspace__slug=slug,
                            external_id=parent_external_id,
                            external_source=issue_data.get("external_source")
                        ).first()
                        if parent_issue:
                            issue_data["parent"] = str(parent_issue.id)
                        else:
                            issue_data["parent"] = None

                    issue = process_single_issue(slug, project, user_id, issue_data)
                    if issue and issue_data.get("external_id"):
                        external_id_map[issue_data["external_id"]] = str(issue.id)

        update_job_batch_completion(job_id)
        return True
    except Exception as e:
        print(traceback.print_exc())
        print(f"Error importing data: {str(e)}")
        return False
