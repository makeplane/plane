# Django imports
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Max, Count
from django.db import connection, transaction
from collections import defaultdict

# Module imports
from plane.db.models import Project, Issue, IssueSequence
from plane.utils.uuid import convert_uuid_to_integer


class Command(BaseCommand):
    help = "Fix all duplicate issue sequences for a given project"

    def add_arguments(self, parser):
        # Positional argument for project identifier
        parser.add_argument("project_identifier", type=str, help="Project Identifier")

        # Optional workspace slug argument
        parser.add_argument(
            "--workspace_slug",
            type=str,
            help="Workspace slug (if not provided, will be prompted)",
        )

        # Optional dry-run flag
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be changed without making actual changes",
        )

    def handle(self, *args, **options):
        try:
            # Get workspace slug
            workspace_slug = options.get("workspace")
            if not workspace_slug:
                workspace_slug = input("Workspace slug: ")

            if not workspace_slug:
                raise CommandError("Workspace slug is required")

            project_identifier = options.get("project_identifier")
            if not project_identifier:
                raise CommandError("Project identifier is required")

            dry_run = options.get("dry_run", False)

            # Fetch the project
            try:
                project = Project.objects.get(
                    identifier__iexact=project_identifier,
                    workspace__slug=workspace_slug,
                )
            except Project.DoesNotExist:
                raise CommandError(
                    f"Project '{project_identifier}' not found in workspace '{workspace_slug}'"
                )

            self.stdout.write(
                self.style.SUCCESS(
                    f"Found project: {project.name} ({project.identifier})"
                )
            )

            # Find all issues with duplicate sequence_ids
            duplicate_sequences = (
                Issue.objects.filter(project=project)
                .values("sequence_id")
                .annotate(count=Count("id"))
                .filter(count__gt=1)
                .values_list("sequence_id", flat=True)
            )

            if not duplicate_sequences:
                self.stdout.write(
                    self.style.SUCCESS("No duplicate sequences found in this project!")
                )
                return

            self.stdout.write(
                self.style.WARNING(
                    f"Found {len(duplicate_sequences)} sequences with duplicates: {list(duplicate_sequences)}"
                )
            )

            # Group issues by sequence_id to handle duplicates
            duplicates_map = defaultdict(list)
            total_duplicates = 0

            for sequence_id in duplicate_sequences:
                issues = Issue.objects.filter(
                    project=project, sequence_id=sequence_id
                ).order_by(
                    "created_at"
                )  # Order by creation time, keep the oldest

                duplicates_map[sequence_id] = list(issues)
                total_duplicates += len(issues) - 1  # -1 because we keep one

                self.stdout.write(f"  Sequence {sequence_id}: {len(issues)} issues")
                for issue in issues:
                    self.stdout.write(
                        f"    - {issue.name} (ID: {issue.id}, Created: {issue.created_at})"
                    )

            self.stdout.write(
                self.style.WARNING(f"Total issues to be updated: {total_duplicates}")
            )

            if dry_run:
                self.stdout.write(
                    self.style.SUCCESS(
                        "DRY RUN: No changes were made. Use without --dry-run to apply changes."
                    )
                )
                return

            # Ask for confirmation
            confirm = input(
                f"\nProceed with updating {total_duplicates} issues? (y/N): "
            )
            if confirm.lower() != "y":
                self.stdout.write("Operation cancelled.")
                return

            # Process the duplicates
            with transaction.atomic():
                # Lock the project to prevent concurrent modifications
                lock_key = convert_uuid_to_integer(project.id)

                with connection.cursor() as cursor:
                    cursor.execute("SELECT pg_advisory_xact_lock(%s)", [lock_key])

                # Get the current maximum sequence for the project
                last_sequence = (
                    IssueSequence.objects.filter(project=project).aggregate(
                        largest=Max("sequence")
                    )["largest"]
                    or 0
                )

                # Prepare bulk updates
                bulk_issues = []
                bulk_issue_sequences = []
                new_sequence = last_sequence

                # Get all issue sequences for this project for efficient lookup
                issue_sequence_map = {
                    isq.issue_id: isq
                    for isq in IssueSequence.objects.filter(project=project)
                }

                updated_count = 0

                # Process each group of duplicates
                for sequence_id, issues in duplicates_map.items():
                    # Keep the first issue (oldest), update the rest
                    issues_to_update = issues[1:]  # Skip the first one

                    self.stdout.write(
                        f"Keeping issue '{issues[0].name}' with sequence {sequence_id}"
                    )

                    for issue in issues_to_update:
                        new_sequence += 1
                        old_sequence = issue.sequence_id
                        issue.sequence_id = new_sequence
                        bulk_issues.append(issue)
                        updated_count += 1

                        # Update corresponding IssueSequence
                        sequence_obj = issue_sequence_map.get(issue.id)
                        if sequence_obj:
                            sequence_obj.sequence = new_sequence
                            bulk_issue_sequences.append(sequence_obj)

                        self.stdout.write(
                            f"  Updating '{issue.name}': {old_sequence} -> {new_sequence}"
                        )

                # Perform bulk updates
                if bulk_issues:
                    Issue.objects.bulk_update(bulk_issues, ["sequence_id"])
                    self.stdout.write(f"Updated {len(bulk_issues)} issues")

                if bulk_issue_sequences:
                    IssueSequence.objects.bulk_update(
                        bulk_issue_sequences, ["sequence"]
                    )
                    self.stdout.write(
                        f"Updated {len(bulk_issue_sequences)} issue sequences"
                    )

            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully fixed duplicate sequences! Updated {updated_count} issues."
                )
            )

        except Exception as e:
            raise CommandError(f"Error: {str(e)}")
