from django_elasticsearch_dsl.management.commands.search_index import (
    Command as BaseSearchIndexCommand
)
from django_elasticsearch_dsl.registries import registry
import sys


class Command(BaseSearchIndexCommand):
    help = 'Manage elasticsearch index.'

    def add_arguments(self, parser):
        super().add_arguments(parser)
        parser.add_argument(
            '--chunk-size',
            type=int,
            default=500,
            help='Specify the chunk size for processing data'
        )
        parser.add_argument(
            '--background',
            action='store_true',
            default=False,
            help='Run the command in the background'
        )

    def handle(self, *args, **options):
        chunk_size = options['chunk_size']
        background = options['background']
        print(f"Using chunk size: {chunk_size}")
        print(f"Running in background: {background}")

        if background:
            from plane.ee.bgtasks.elasticsearch_index_update_task import (
                run_search_index_command
            )
            # Use sys.argv to get all command-line arguments
            # Skip the script name and command name, and remove '--background'
            args_list = [arg for arg in sys.argv[2:] if arg != '--background']
            print("Running search index command in background with args:", args_list)
            run_search_index_command.delay(*args_list)
        else:
            # Add custom logic here
            print("Running manage search index command")
            # Call the base class handle method if you want to retain existing functionality
            super().handle(*args, **options)

    def _populate(self, models, options):
        parallel = options['parallel']
        chunk_size = options['chunk_size']
        for doc in registry.get_documents(models):
            self.stdout.write("Indexing {} '{}' objects {} with chunk size {}".format(
                doc().get_queryset().count() if options['count'] else "all",
                doc.django.model.__name__,
                "(parallel)" if parallel else "",
                chunk_size
            ))
            qs = doc().get_indexing_queryset()
            doc().update(
                qs, parallel=parallel, refresh=options['refresh'], chunk_size=chunk_size
            )
