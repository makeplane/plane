from django.core.management.base import BaseCommand
from django.core.management import call_command, get_commands, load_command_class
import argparse
import sys


class Command(BaseCommand):
    """Manage opensearch index.

    This is a wrapper around the opensearch management command.

    Available subcommands:
    - list: Show all available indices and their state
    - index: Manage index creation/deletion/rebuild
    - document: Manage document indexing/updating/deletion

    Examples:
        # List all indices
        python manage.py manage_search_index list

        # Index Management Examples:
        # Create all indices
        python manage.py manage_search_index index create --force

        # Rebuild specific indices
        python manage.py manage_search_index index rebuild --indices index_name --force

        # Delete specific indices
        python manage.py manage_search_index index delete --indices index_name --force

        # Update index mappings
        python manage.py manage_search_index index update --indices index_name --force

        # Document Management Examples:
        # Index all documents
        python manage.py manage_search_index document index --force

        # Index documents for specific indices
        python manage.py manage_search_index document index --indices issues --force

        # Index documents for multiple indices
        python manage.py manage_search_index document index --indices issues projects --force

        # Index limited number of documents
        python manage.py manage_search_index document index --indices issues --count 100 --force

        # Index documents with parallel processing
        python manage.py manage_search_index document index --parallel --force

        # Index documents with refresh
        python manage.py manage_search_index document index --refresh --force

        # Index only missing documents
        python manage.py manage_search_index document index --missing --force

        # Update existing documents
        python manage.py manage_search_index document update --indices issues --force

        # Delete documents from indices
        python manage.py manage_search_index document delete --indices issues --force

        # Index documents with filters
        python manage.py manage_search_index document index --filters created_at__gte=2024-01-01 --force

        # Index documents excluding certain criteria
        python manage.py manage_search_index document index --excludes status=archived --force

        # Background Processing Examples:
        # Run index creation in background
        python manage.py manage_search_index --background index create --force

        # Run document indexing in background
        python manage.py manage_search_index --background document index --force

        # Run document indexing for specific indices in background with parallel processing
        python manage.py manage_search_index --background document index --indices issues --parallel --force
    """

    help = "Manage opensearch index."

    def print_help(self, prog_name, subcommand):
        """Override to include OpenSearch command help."""
        # Print our standard help first
        super().print_help(prog_name, subcommand)

        # Then add the opensearch command help
        try:
            print("\n" + "=" * 80)
            print("OPENSEARCH COMMAND HELP")
            print("=" * 80)
            print("The following help is from the underlying 'opensearch' command:")
            print("-" * 80)

            # Get and print opensearch help using call_command
            import io
            from contextlib import redirect_stdout

            # Function to capture command help
            def capture_help(cmd_args):
                help_output = io.StringIO()
                with redirect_stdout(help_output):
                    try:
                        call_command(*cmd_args)
                    except SystemExit:
                        # --help causes SystemExit, which is expected
                        pass
                return help_output.getvalue()

            # Get main opensearch help
            opensearch_help = capture_help(["opensearch", "--help"])

            if opensearch_help:
                # Print the opensearch help, but skip the usage line since it's different
                lines = opensearch_help.split("\n")
                skip_usage = True
                for line in lines:
                    if skip_usage and line.strip() and not line.startswith("usage:"):
                        skip_usage = False
                    if not skip_usage:
                        print(line)

            # Add subcommand help
            subcommands = ["index", "document"]
            for subcmd in subcommands:
                print(f"\n{'-' * 80}")
                print(f"OPENSEARCH {subcmd.upper()} SUBCOMMAND HELP")
                print(f"{'-' * 80}")

                subcmd_help = capture_help(["opensearch", subcmd, "--help"])
                if subcmd_help:
                    # Skip the usage line and print the rest
                    lines = subcmd_help.split("\n")
                    skip_usage = True
                    for line in lines:
                        if (
                            skip_usage
                            and line.strip()
                            and not line.startswith("usage:")
                        ):
                            skip_usage = False
                        if not skip_usage:
                            print(line)
                else:
                    print(f"No help available for {subcmd} subcommand.")

        except Exception as e:
            print(f"\nNote: Could not load opensearch command help: {e}")
            print(
                "You can run 'python manage.py opensearch --help' for detailed opensearch options."
            )

    def add_arguments(self, parser):
        parser.add_argument(
            "--background",
            action="store_true",
            default=False,
            help="Run the command in the background",
        )
        # Use REMAINDER to capture all remaining arguments including flags
        parser.add_argument(
            "opensearch_args",
            nargs=argparse.REMAINDER,
            help="Arguments to pass to opensearch command (required)",
        )

    def handle(self, *args, **options):
        background = options["background"]
        opensearch_args = options["opensearch_args"]

        # Validate that opensearch_args is not empty
        if not opensearch_args:
            self.stderr.write(
                self.style.ERROR(
                    "Error: opensearch_args is required. You must provide at least one argument."
                )
            )
            self.stderr.write("Usage examples:")
            self.stderr.write("  python manage.py manage_search_index list")
            self.stderr.write(
                "  python manage.py manage_search_index index create --force"
            )
            self.stderr.write(
                "  python manage.py manage_search_index document index --force"
            )
            return

        print(f"Running in background: {background}")

        if background:
            from plane.ee.bgtasks.search_index_update_task import (
                run_search_index_command,
            )

            print(
                "Running opensearch command in background with args:", opensearch_args
            )
            run_search_index_command.delay(*opensearch_args)
        else:
            print("Running opensearch command with args:", opensearch_args)
            call_command("opensearch", *opensearch_args)
