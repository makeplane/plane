# Python imports
import json

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import Page, PageVersion
from plane.utils.exception_logger import log_exception


@shared_task
def page_version(page_id, existing_instance, user_id):
    try:
        # Get the page
        page = Page.objects.get(id=page_id)

        # Get the current instance
        current_instance = (
            json.loads(existing_instance) if existing_instance is not None else {}
        )

        # Create a version if description_html is updated
        if current_instance.get("description_html") != page.description_html:
            # Create a new page version
            PageVersion.objects.create(
                page_id=page_id,
                workspace_id=page.workspace_id,
                description_html=page.description_html,
                description_binary=page.description_binary,
                owned_by_id=user_id,
                last_saved_at=page.updated_at,
            )

            # If page versions are greater than 20 delete the oldest one
            if PageVersion.objects.filter(page_id=page_id).count() > 20:
                # Delete the old page version
                PageVersion.objects.filter(page_id=page_id).order_by(
                    "last_saved_at"
                ).first().delete()

        return
    except Page.DoesNotExist:
        return
    except Exception as e:
        log_exception(e)
        return
