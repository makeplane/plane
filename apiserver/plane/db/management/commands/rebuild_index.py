from django.core.management.base import BaseCommand
from elasticsearch.helpers import bulk
from elasticsearch_dsl import connections

from plane.db.documents import IssueDocument
from plane.db.models import Issue


class Command(BaseCommand):
    help = "Rebuild Elasticsearch index for issues"

    def handle(self, *args, **options):
        try:
            # Get the client
            client = connections.get_connection()
            self.stdout.write("Connected to Elasticsearch")

            # Delete existing index
            IssueDocument._index.delete(ignore=404)
            self.stdout.write("Deleted existing index")

            # Create new index
            IssueDocument.init()
            self.stdout.write("Created new index")

            # Get first 10k issues
            issues = Issue.objects.select_related(
                "created_by", "workspace", "project", "state"
            )[:100]
            total = issues.count()
            self.stdout.write(
                f"Found {total} issues to index (limited to 10k)"
            )

            def generate_actions():
                for issue in issues.iterator():
                    try:
                        doc = IssueDocument()
                        data = doc.prepare(issue)
                        action = {
                            "_index": "issues",
                            "_id": str(
                                issue.id
                            ),  # Convert to string to be safe
                            "_source": data,
                        }
                        yield action
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(
                                f"Error processing issue {issue.id}: {str(e)}"
                            )
                        )
                        continue

            # Perform bulk indexing
            success, failed = bulk(
                client,
                generate_actions(),
                chunk_size=100,
                raise_on_error=False,
                stats_only=True,
            )

            self.stdout.write(
                f"Indexing complete - Succeeded: {success}, Failed: {failed}"
            )

            # Verify count
            final_count = client.count(index="issues")["count"]
            self.stdout.write(f"Final index count: {final_count}")

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Failed to rebuild index: {str(e)}")
            )
            raise
