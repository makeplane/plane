# Django imports
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Max

# Module imports
from plane.db.models import Project, Issue, IssueSequence


class Command(BaseCommand):
    help = "Fix duplicate sequences"

    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument("issue_identifier", type=str, help="Issue Identifier")

    def strict_str_to_int(self, s):
        if not s.isdigit() and not (s.startswith("-") and s[1:].isdigit()):
            raise ValueError("Invalid integer string")
        return int(s)

    def handle(self, *args, **options):
        workspace_slug = input("Workspace slug: ")

        if not workspace_slug:
            raise CommandError("Workspace slug is required")

        issue_identifier = options.get("issue_identifier", False)

        # Validate issue_identifier
        if not issue_identifier:
            raise CommandError("Issue identifier is required")

        # Validate issue identifier
        try:
            identifier = issue_identifier.split("-")

            if len(identifier) != 2:
                raise ValueError("Invalid issue identifier format")

            project_identifier = identifier[0]
            issue_sequence = self.strict_str_to_int(identifier[1])

            # Fetch the project
            project = Project.objects.get(
                identifier__iexact=project_identifier, workspace__slug=workspace_slug
            )

            # Get the issues
            issues = Issue.objects.filter(project=project, sequence_id=issue_sequence)
            issue_sequences = IssueSequence.objects.filter(
                project=project, sequence=issue_sequence
            )
            # Check if there are duplicate issues
            if not issues.count() > 1:
                raise CommandError(
                    "No duplicate issues found with the given identifier"
                )

            self.stdout.write(
                self.style.SUCCESS(
                    f"{issues.count()} issues found with identifier {issue_identifier}"
                )
            )
            # Get the maximum sequence ID for the project
            last_sequence = IssueSequence.objects.filter(project=project).aggregate(
                largest=Max("sequence")
            )["largest"]

            bulk_issues = []
            bulk_issue_sequences = []

            # change the ids of duplicate issues
            for index, issue in enumerate(issues[1:]):
                updated_sequence_id = last_sequence + index + 1
                issue.sequence_id = updated_sequence_id
                bulk_issues.append(issue)

                # Find the same issue sequence instance from the above queryset
                sequence_identifier = next(
                    (isq for isq in issue_sequences if isq.issue_id == issue.id), None
                )
                if sequence_identifier:
                    sequence_identifier.sequence = updated_sequence_id
                    bulk_issue_sequences.append(sequence_identifier)

            Issue.objects.bulk_update(bulk_issues, ["sequence_id"])
            IssueSequence.objects.bulk_update(bulk_issue_sequences, ["sequence"])

            self.stdout.write(self.style.SUCCESS("Sequence IDs updated successfully"))
        except Exception as e:
            raise CommandError(str(e))
