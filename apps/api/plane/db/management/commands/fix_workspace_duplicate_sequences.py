# Django imports
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Max, Count
from django.db import connection, transaction
from collections import defaultdict

# Module imports
from plane.db.models import Project, Issue, IssueSequence, Workspace
from plane.utils.uuid import convert_uuid_to_integer


class Command(BaseCommand):
    help = "Fix all duplicate issue sequences for all projects in a workspace"

    def add_arguments(self, parser):
        # Required workspace slug argument
        parser.add_argument("workspace_slug", type=str, help="Workspace slug")

        # Optional project ID argument
        parser.add_argument(
            "--project-id",
            type=str,
            help="Optional project ID to process only that specific project",
        )

        # Optional dry-run flag
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be changed without making actual changes",
        )

        # Optional flag to process all projects without prompting
        parser.add_argument(
            "--auto-confirm",
            action="store_true",
            help="Automatically confirm updates for all projects (use with caution)",
        )

    def handle(self, *args, **options):
        try:
            workspace_slug = options.get("workspace_slug")
            if not workspace_slug:
                raise CommandError("Workspace slug is required")

            project_id = options.get("project_id")
            dry_run = options.get("dry_run", False)
            auto_confirm = options.get("auto_confirm", False)

            # Fetch the workspace
            try:
                workspace = Workspace.objects.get(slug=workspace_slug)
            except Workspace.DoesNotExist:
                raise CommandError(f"Workspace '{workspace_slug}' not found")

            self.stdout.write(
                self.style.SUCCESS(
                    f"Found workspace: {workspace.name} ({workspace.slug})"
                )
            )

            # Get projects based on whether project_id is provided
            if project_id:
                # Process only the specified project
                try:
                    projects = Project.objects.filter(
                        workspace=workspace, id=project_id
                    )
                    if not projects.exists():
                        raise CommandError(
                            f"Project with ID '{project_id}' not found in workspace '{workspace_slug}'"
                        )
                    self.stdout.write(
                        f"Processing specific project: {projects.first().name} ({projects.first().identifier})"
                    )
                except Project.DoesNotExist:
                    raise CommandError(
                        f"Project with ID '{project_id}' not found in workspace '{workspace_slug}'"
                    )
            else:
                # Get all projects in the workspace
                projects = Project.objects.filter(workspace=workspace).order_by("name")

                if not projects.exists():
                    self.stdout.write(
                        self.style.WARNING("No projects found in this workspace!")
                    )
                    return

                self.stdout.write(f"Found {projects.count()} projects in workspace")

            total_projects_processed = 0
            total_issues_updated = 0

            # Loop through each project
            for project in projects:
                self.stdout.write("\n" + "=" * 60)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Processing project: {project.name} ({project.identifier})"
                    )
                )

                # Process this project
                project_updated_count = self.process_project(
                    project, dry_run, auto_confirm
                )

                if project_updated_count > 0:
                    total_projects_processed += 1
                    total_issues_updated += project_updated_count

            # Final summary
            self.stdout.write("\n" + "=" * 60)
            self.stdout.write(self.style.SUCCESS("Workspace processing complete!"))
            self.stdout.write(f"Projects processed: {total_projects_processed}")
            self.stdout.write(f"Total issues updated: {total_issues_updated}")

        except Exception as e:
            raise CommandError(f"Error: {str(e)}")

    def process_project(self, project, dry_run, auto_confirm):
        """Process a single project for duplicate sequences"""

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
                self.style.SUCCESS("  ✓ No duplicate sequences found in this project!")
            )
            return 0

        self.stdout.write(
            self.style.WARNING(
                f"  ⚠ Found {len(duplicate_sequences)} sequences with duplicates: {list(duplicate_sequences)}"
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

            self.stdout.write(f"    Sequence {sequence_id}: {len(issues)} issues")
            for issue in issues:
                self.stdout.write(
                    f"      - {issue.name} (ID: {issue.id}, Created: {issue.created_at})"
                )

        self.stdout.write(
            self.style.WARNING(
                f"  Total issues to be updated in this project: {total_duplicates}"
            )
        )

        if dry_run:
            self.stdout.write(
                self.style.SUCCESS("  DRY RUN: No changes were made for this project.")
            )
            return 0

        # Ask for confirmation unless auto-confirm is enabled
        if not auto_confirm:
            confirm = input(
                f"\nProceed with updating {total_duplicates} issues in project '{project.name}'? (y/N/q to quit): "
            )
            if confirm.lower() == "q":
                self.stdout.write("Operation cancelled by user.")
                raise CommandError("Operation cancelled")
            elif confirm.lower() != "y":
                self.stdout.write("  Skipping this project.")
                return 0

        # Process the duplicates
        return self.update_project_duplicates(project, duplicates_map)

    def update_project_duplicates(self, project, duplicates_map):
        """Update duplicate sequences for a single project"""

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
                    f"    Keeping issue '{issues[0].name}' with sequence {sequence_id}"
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
                        f"      Updating '{issue.name}': {old_sequence} -> {new_sequence}"
                    )

            # Perform bulk updates
            if bulk_issues:
                Issue.objects.bulk_update(bulk_issues, ["sequence_id"])
                self.stdout.write(f"    Updated {len(bulk_issues)} issues")

            if bulk_issue_sequences:
                IssueSequence.objects.bulk_update(bulk_issue_sequences, ["sequence"])
                self.stdout.write(
                    f"    Updated {len(bulk_issue_sequences)} issue sequences"
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"  ✓ Successfully fixed duplicate sequences! Updated {updated_count} issues."
            )
        )

        return updated_count
