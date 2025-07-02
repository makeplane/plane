# Python imports
import json

# Django imports
from django.utils import timezone

# Third-party imports
from bs4 import BeautifulSoup

# Module imports
from plane.db.models import Page, PageLog
from celery import shared_task
from plane.utils.exception_logger import log_exception


def extract_components(value, tag):
    try:
        mentions = []
        html = value.get("description_html")
        soup = BeautifulSoup(html, "html.parser")
        mention_tags = soup.find_all(tag)

        for mention_tag in mention_tags:
            mention = {
                "id": mention_tag.get("id"),
                "entity_identifier": mention_tag.get("entity_identifier"),
                "entity_name": mention_tag.get("entity_name"),
            }
            mentions.append(mention)

        return mentions
    except Exception:
        return []


@shared_task
def page_transaction(new_value, old_value, page_id):
    try:
        page = Page.objects.get(pk=page_id)
        new_page_mention = PageLog.objects.filter(page_id=page_id).exists()

        old_value = json.loads(old_value) if old_value else {}

        new_transactions = []
        deleted_transaction_ids = set()

        # TODO - "todo" components
        components = [
            "mention-component",
            "issue-embed-component",
            "page-embed-component",
            "page-link-component",
            "image-component",
        ]

        for component in components:
            old_mentions = extract_components(old_value, component)
            new_mentions = extract_components(new_value, component)

            # Filter out None IDs before creating sets
            new_mentions_ids = {
                mention.get("id") for mention in new_mentions if mention.get("id")
            }
            old_mention_ids = {
                mention.get("id") for mention in old_mentions if mention.get("id")
            }
            deleted_transaction_ids.update(old_mention_ids - new_mentions_ids)

            new_transactions.extend(
                PageLog(
                    transaction=mention.get("id"),
                    page_id=page_id,
                    entity_identifier=mention.get("entity_identifier", None),
                    entity_name=(
                        mention.get("entity_name", None)
                        if mention.get("entity_name", None)
                        else "issue"
                    ),
                    workspace_id=page.workspace_id,
                    created_at=timezone.now(),
                    updated_at=timezone.now(),
                )
                for mention in new_mentions
                if mention.get("id")
                and (mention.get("id") not in old_mention_ids or not new_page_mention)
            )

        # Create new PageLog objects for new transactions
        PageLog.objects.bulk_create(
            new_transactions, batch_size=10, ignore_conflicts=True
        )

        # Delete the removed transactions
        PageLog.objects.filter(transaction__in=deleted_transaction_ids).delete()
    except Page.DoesNotExist:
        return
    except Exception as e:
        log_exception(e)
        return
