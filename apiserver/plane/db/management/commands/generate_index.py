# Django imports
from django.core.management.base import BaseCommand, CommandError

# Third party imports
from elasticsearch.helpers import bulk
from elasticsearch_dsl import connections

# Module imports
from plane.db.documents import IssueDocument
from plane.db.models import Issue


class Command(BaseCommand):
    help = "Generate index for issues"

    def handle(self, *args, **options):
        try:
            # Get the client
            client = connections.get_connection()

            # Delete existing index
            IssueDocument._index.delete(ignore=404)

            # Create new index
            IssueDocument.init()

            # Prepare bulk indexing actions
            def generate_actions():
                for issue in Issue.objects.iterator():
                    doc = IssueDocument()
                    data = doc.prepare(issue)
                    action = {
                        "_index": "issues",
                        "_id": issue.id,
                        "_source": data,
                    }

                    yield action

            # Perform bulk indexing
            success, failed = bulk(client, generate_actions())
            print(f"Indexed {success} documents. Failed: {failed}")

        except Exception as e:
            print(e)
            raise CommandError("Failed to generate index")
