# Python imports
import json

# Django imports
from django.utils import timezone

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import Page, PageVersion, Issue, IssueDescriptionVersion
from plane.utils.exception_logger import log_exception


@shared_task
def version_task(
    entity_type,
    entity_identifier,
    existing_instance,
    user_id,
):
    try:
        # Get the current instance
        current_instance = (
            json.loads(existing_instance)
            if existing_instance is not None
            else {}
        )

        if entity_type == "PAGE":
            # Get the page
            page = Page.objects.get(id=entity_identifier)

            # Create a version if description_html is updated
            if (
                current_instance.get("description_html")
                != page.description_html
            ):
                # Fetch the latest page version
                page_version = (
                    PageVersion.objects.filter(page_id=entity_identifier)
                    .order_by("-last_saved_at")
                    .first()
                )

                # Get the latest page version if it exists and is owned by the user
                if (
                    page_version
                    and str(page_version.owned_by_id) == str(user_id)
                    and (
                        timezone.now() - page_version.last_saved_at
                    ).total_seconds()
                    <= 600
                ):
                    page_version.description_html = page.description_html
                    page_version.description_binary = page.description_binary
                    page_version.description_json = page.description
                    page_version.description_stripped = (
                        page.description_stripped
                    )
                    page_version.last_saved_at = timezone.now()
                    page_version.save(
                        update_fields=[
                            "description_html",
                            "description_binary",
                            "description_json",
                            "description_stripped",
                            "last_saved_at",
                        ]
                    )
                else:
                    # Create a new page version
                    PageVersion.objects.create(
                        page_id=entity_identifier,
                        workspace_id=page.workspace_id,
                        description_html=page.description_html,
                        description_binary=page.description_binary,
                        description_stripped=page.description_stripped,
                        owned_by_id=user_id,
                        last_saved_at=page.updated_at,
                        description_json=page.description,
                        created_by_id=user_id,
                        updated_by_id=user_id,
                    )

        if entity_type == "ISSUE":
            # Get the issue
            issue = Issue.objects.get(id=entity_identifier)
            # Create a version if description_html is updated
            if (
                current_instance.get("description_html")
                != issue.description_html
            ):
                # Fetch the latest issue version
                issue_version = (
                    IssueDescriptionVersion.objects.filter(
                        issue_id=entity_identifier
                    )
                    .order_by("-last_saved_at")
                    .first()
                )

                # Get the latest issue version if it exists and is owned by the user
                if (
                    issue_version
                    and str(issue_version.owned_by_id) == str(user_id)
                    and (
                        timezone.now() - issue_version.last_saved_at
                    ).total_seconds()
                    <= 600
                ):
                    issue_version.description_html = issue.description_html
                    issue_version.description_binary = issue.description_binary
                    issue_version.description_json = issue.description
                    issue_version.description_stripped = (
                        issue.description_stripped
                    )
                    issue_version.last_saved_at = timezone.now()
                    issue_version.save(
                        update_fields=[
                            "description_html",
                            "description_binary",
                            "description_json",
                            "description_stripped",
                            "last_saved_at",
                        ]
                    )
                else:
                    # Create a new issue version
                    IssueDescriptionVersion.objects.create(
                        issue_id=entity_identifier,
                        workspace_id=issue.workspace_id,
                        description_html=issue.description_html,
                        description_binary=issue.description_binary,
                        description_stripped=issue.description_stripped,
                        owned_by_id=user_id,
                        last_saved_at=issue.updated_at,
                        description_json=issue.description,
                        project_id=issue.project_id,
                        created_by_id=user_id,
                        updated_by_id=user_id,
                    )

        return
    except Issue.DoesNotExist:
        return
    except Page.DoesNotExist:
        return
    except Exception as e:
        log_exception(e)
        return
