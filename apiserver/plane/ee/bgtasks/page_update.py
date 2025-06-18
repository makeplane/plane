import requests
import json
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# Django imports
from django.conf import settings
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third Party imports
from celery import shared_task

# Module imports
from plane.db.models import (
    Page,
    DeployBoard,
    UserFavorite,
    Workspace,
    ProjectPage,
    FileAsset,
    PageVersion,
    UserRecentVisit,
)
from plane.utils.exception_logger import log_exception
from plane.ee.bgtasks.move_page import move_page
from plane.bgtasks.copy_s3_object import copy_s3_objects
from plane.bgtasks.page_transaction_task import page_transaction
from plane.ee.utils.page_descendants import get_descendant_page_ids
from plane.ee.utils.page_events import PageAction
from plane.utils.url import normalize_url_path


@shared_task
def replace_page_id(old_to_new_page_mapping, page_id):
    """
    Currently when a page is duplicated, this function crawls through the
    description_html of the page and replaces the old page id with the new
    page id. in the page embed component.
    """
    old_to_new_page_mapping = json.loads(old_to_new_page_mapping)
    page = Page.objects.get(pk=page_id)
    if page.description_html:
        soup = BeautifulSoup(page.description_html, "html.parser")
        mention_tags = soup.find_all("page-embed-component")

        old_to_new_page_mapping = {
            str(k): str(v) for k, v in old_to_new_page_mapping.items()
        }

        for mention_tag in mention_tags:
            # Get the old page id
            old_page_id = mention_tag.get("entity_identifier")
            new_page_id = old_to_new_page_mapping.get(old_page_id)
            # replace html with new page id
            mention_tag["entity_identifier"] = new_page_id

        page.description_html = str(soup)
        page.save()

    return


@shared_task
def nested_page_update(
    page_id, action, slug, project_id=None, user_id=None, extra=None, sub_pages=True
):
    try:
        workspace = Workspace.objects.get(slug=slug)
        page = Page.all_objects.get(id=page_id)
        parent_id = page.parent_id
        data = {}
        descendants_ids = []

        if sub_pages:
            descendants_ids = get_descendant_page_ids(page_id)

        if action == PageAction.ARCHIVED:
            Page.objects.filter(id__in=descendants_ids).update(
                archived_at=timezone.now(),
                updated_at=timezone.now(),
                updated_by=user_id,
            )
            UserFavorite.objects.filter(
                entity_type="page",
                entity_identifier__in=descendants_ids,
                project_id=project_id,
                workspace__slug=slug,
            ).delete(soft=False)

            DeployBoard.objects.filter(
                entity_name="page",
                entity_identifier__in=descendants_ids,
                project_id=project_id,
                workspace__slug=slug,
            ).delete()

        elif action == PageAction.UNARCHIVED:
            Page.objects.filter(id__in=descendants_ids).update(
                archived_at=None, updated_at=timezone.now(), updated_by=user_id
            )

        elif action == PageAction.LOCKED:
            Page.objects.filter(id__in=descendants_ids).update(
                is_locked=True, updated_at=timezone.now(), updated_by=user_id
            )

        elif action == PageAction.UNLOCKED:
            Page.objects.filter(id__in=descendants_ids).update(
                is_locked=False, updated_at=timezone.now(), updated_by=user_id
            )

        elif action == PageAction.MADE_PUBLIC:
            Page.objects.filter(id__in=descendants_ids).update(
                access=0, updated_at=timezone.now(), updated_by=user_id
            )

        elif action == PageAction.MADE_PRIVATE:
            Page.objects.filter(id__in=descendants_ids).update(
                access=1, updated_at=timezone.now(), updated_by=user_id
            )

        elif action == PageAction.PUBLISHED:
            # remove the page ids which are already published from the array
            page_ids = descendants_ids + [page_id]
            published_page_ids = set(
                DeployBoard.objects.filter(
                    entity_identifier__in=page_ids,
                    entity_name="page",
                    workspace__slug=slug,
                )
                .exclude(entity_identifier__in=page_ids)
                .values_list("entity_identifier", flat=True)
            )

            # Filter out already published IDs
            descendants_ids = [
                descendant_id
                for descendant_id in descendants_ids
                if descendant_id not in published_page_ids
            ]

            DeployBoard.objects.bulk_create(
                [
                    DeployBoard(
                        entity_identifier=descendant_id,
                        entity_name="page",
                        project_id=project_id,
                        workspace_id=workspace.id,
                        created_by_id=user_id,
                        updated_by_id=user_id,
                    )
                    for descendant_id in descendants_ids
                ],
                batch_size=10,
                ignore_conflicts=True,
            )
            response_data = list(
                DeployBoard.objects.filter(
                    entity_identifier__in=descendants_ids,
                    entity_name="page",
                    workspace_id=workspace.id,
                ).values("entity_identifier", "anchor")
            )
            data["published_pages"] = [
                {"page_id": str(item["entity_identifier"]), "anchor": item["anchor"]}
                for item in response_data
            ]

        elif action == PageAction.UNPUBLISHED:
            DeployBoard.objects.filter(
                entity_identifier__in=descendants_ids,
                entity_name="page",
                workspace__slug=slug,
            ).delete()

        elif action == PageAction.DUPLICATED:
            old_to_new_page_mapping = {}
            pages_to_duplicate = Page.objects.filter(
                id__in=descendants_ids + [page_id], workspace__slug=slug
            )

            # First, duplicate all pages without setting parent_id
            for page in pages_to_duplicate:
                old_page_id = page.id
                project_ids = ProjectPage.objects.filter(page_id=page.id).values_list(
                    "project_id", flat=True
                )

                page.id = None
                page.name = f"{page.name} (Copy)"
                page.description_binary = None
                page.owned_by_id = user_id
                page.created_by_id = user_id
                page.updated_by_id = user_id
                old_to_new_page_mapping[old_page_id] = page
                page.save()

                for project_id in project_ids:
                    ProjectPage.objects.create(
                        workspace_id=page.workspace_id,
                        project_id=project_id,
                        page_id=page.id,
                        created_by_id=page.created_by_id,
                        updated_by_id=page.updated_by_id,
                    )

                page_transaction.delay(
                    {"description_html": page.description_html}, None, page.id
                )

                copy_s3_objects.delay(
                    entity_name="PAGE",
                    entity_identifier=page.id,
                    project_id=project_id,
                    slug=slug,
                    user_id=user_id,
                )

            # Now that all pages are created, update parent-child relationships
            updates = []
            for old_page_id, new_page in old_to_new_page_mapping.items():
                old_parent_id = pages_to_duplicate.get(id=old_page_id).parent_id
                if old_parent_id in old_to_new_page_mapping:
                    new_page.parent_id = old_to_new_page_mapping[old_parent_id].id
                    updates.append(new_page)

                replace_page_id.delay(
                    old_to_new_page_mapping=json.dumps(
                        {str(k): v.id for k, v in old_to_new_page_mapping.items()},
                        cls=DjangoJSONEncoder,
                    ),
                    page_id=new_page.id,
                )

            if updates:
                Page.objects.bulk_update(updates, ["parent_id"])

            data = {"new_page_id": str(old_to_new_page_mapping[page_id].id)}

        elif action == PageAction.MOVED:
            new_project_id = extra["new_project_id"]
            parent_id = extra["parent_id"]
            new_page_id = extra["new_page_id"]
            data = {"new_project_id": new_project_id, "new_page_id": str(new_page_id)}

            # update the sub pages with the new page id of the duplicated page
            Page.objects.filter(parent_id=page_id, workspace__slug=slug).update(
                parent_id=new_page_id, updated_at=timezone.now(), updated_by=user_id
            )

            if new_project_id:
                # Update the project id for the project pages
                ProjectPage.objects.filter(page_id__in=descendants_ids).update(
                    project_id=new_project_id,
                    updated_at=timezone.now(),
                    updated_by=user_id,
                )

                # Update the project id for the file assets
                FileAsset.objects.filter(
                    page_id__in=descendants_ids, project_id=project_id
                ).update(
                    project_id=new_project_id,
                    updated_at=timezone.now(),
                    updated_by=user_id,
                )

                # Update the project id for the deploy board
                DeployBoard.objects.filter(
                    entity_identifier__in=descendants_ids,
                    entity_name="page",
                    project_id=project_id,
                ).update(
                    project_id=new_project_id,
                    updated_at=timezone.now(),
                    updated_by=user_id,
                )

                # Background job to handle favorites
                for descendant_id in descendants_ids:
                    move_page.delay(descendant_id, project_id, new_project_id)

        elif action == PageAction.MOVED_INTERNALLY:
            new_parent_id = extra["new_parent_id"]
            old_parent_id = extra["old_parent_id"]
            data = {
                "new_parent_id": str(new_parent_id) if new_parent_id else None,
                "old_parent_id": str(old_parent_id) if old_parent_id else None,
            }

        elif action == PageAction.DELETED:
            # delete all the descendants
            Page.objects.filter(id__in=descendants_ids).delete()
            # delete the page version history
            PageVersion.objects.filter(page_id__in=descendants_ids).delete()
            # delete the page from user recent's visit
            UserRecentVisit.objects.filter(
                workspace__slug=slug,
                entity_identifier__in=descendants_ids,
                entity_name="workspace_page",
            ).delete(soft=False)

        elif action == PageAction.RESTORED:
            data = {"deleted_page_ids": extra["deleted_page_ids"]}

        descendants_ids = [str(ids) for ids in descendants_ids]

        payload = {
            "action": action,
            "descendants_ids": descendants_ids,
            "page_id": str(page_id),
            "parent_id": str(parent_id) if parent_id else None,
            "project_id": str(project_id),
            "workspace_slug": slug,
            "user_id": str(user_id) if user_id else None,
            "data": data,
        }

        live_url = settings.LIVE_URL
        if not live_url:
            return {}

        url = normalize_url_path(f"{live_url}/broadcast/")

        # Send the payload to the live server
        response = requests.post(
            url,
            json=payload,
            headers={
                "Content-Type": "application/json",
                "LIVE_SERVER_SECRET_KEY": settings.LIVE_SERVER_SECRET_KEY,
            },
        )
        response.raise_for_status()
        return
    except Exception as e:
        log_exception(e)
        return
