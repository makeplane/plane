from django_elasticsearch_dsl.management.commands.search_index import (
    Command as BaseSearchIndexCommand,
)
from django_elasticsearch_dsl.registries import registry
import sys


class Command(BaseSearchIndexCommand):
    """Manage elasticsearch index.

    Available options:
        --models: Specify the model or app to be updated in Elasticsearch
        --create: Create the indices in Elasticsearch
        --populate: Populate Elasticsearch indices with models data
        --delete: Delete the indices in Elasticsearch
        --rebuild: Delete the indices and then recreate and populate them
        --parallel: Run populate/rebuild update multi-threaded
        --no-parallel: Run populate/rebuild update single-threaded
        --use-alias: Use alias with indices
        --use-alias-keep-index: Do not delete replaced indices when used with '--rebuild' and '--use-alias'
        --refresh: Refresh indices after populate/rebuild
        --no-count: Do not include a total count in the summary log line
        --chunk-size: Specify the chunk size for processing data
        --background: Run the command in the background

    Examples:
        # Rebuild all indexes
        python manage.py manage_search_index --rebuild

        # Rebuild specific model indexes
        python manage.py manage_search_index --models app.Model1 app.Model2 --rebuild

        # Populate indexes with custom chunk size
        python manage.py manage_search_index --populate --chunk-size 1000

        # Run in background
        python manage.py manage_search_index --rebuild --background

        # Run with parallel processing
        python manage.py manage_search_index --populate --parallel

        # Populate specific models in background with custom chunk size
        python manage.py manage_search_index --models app.Model1 app.Model2 --populate --background --chunk-size 2000
    """

    help = "Manage elasticsearch index."

    def add_arguments(self, parser):
        super().add_arguments(parser)
        parser.add_argument(
            "--chunk-size",
            type=int,
            default=500,
            help="Specify the chunk size for processing data",
        )
        parser.add_argument(
            "--background",
            action="store_true",
            default=False,
            help="Run the command in the background",
        )

    def handle(self, *args, **options):
        chunk_size = options["chunk_size"]
        background = options["background"]
        print(f"Using chunk size: {chunk_size}")
        print(f"Running in background: {background}")

        if background:
            from plane.ee.bgtasks.elasticsearch_index_update_task import (
                run_search_index_command,
            )

            # Use sys.argv to get all command-line arguments
            # Skip the script name and command name, and remove '--background'
            args_list = [arg for arg in sys.argv[2:] if arg != "--background"]
            print("Running search index command in background with args:", args_list)
            run_search_index_command.delay(*args_list)
        else:
            # Add custom logic here
            print("Running manage search index command")
            # Call the base class handle method if you want to retain existing functionality
            super().handle(*args, **options)

    def _populate(self, models, options):
        parallel = options["parallel"]
        chunk_size = options["chunk_size"]
        for doc in registry.get_documents(models):
            self.stdout.write(
                "Indexing {} '{}' objects {} with chunk size {}".format(
                    doc().get_queryset().count() if options["count"] else "all",
                    doc.django.model.__name__,
                    "(parallel)" if parallel else "",
                    chunk_size,
                )
            )
            qs = doc().get_indexing_queryset()
            doc().update(
                qs, parallel=parallel, refresh=options["refresh"], chunk_size=chunk_size
            )
