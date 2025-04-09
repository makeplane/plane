# Django imports
import random

from datetime import timedelta
from django.utils import timezone
from django.db.models import Q, Max

# Django imports
from faker import Faker
from django.core.management.base import BaseCommand, CommandError


# Third party imports
from plane.db.models import (
    Cycle,
    Workspace,
    Project,
    State,
    Issue,
    IssueSequence,
    IssueActivity,
    CycleIssue,
)
from plane.ee.models import EntityProgress
from plane.ee.bgtasks.entity_issue_state_progress_task import (
    entity_issue_state_activity_task,
)

# @shared_task
# Module imports


class Command(BaseCommand):
    help = "Create custom analytics"

    def handle(self, *args, **options):
        workspace_slug = input("Workspace slug: ")

        if workspace_slug == "":
            raise CommandError("Workspace slug is required")

        workspace = Workspace.objects.filter(slug=workspace_slug).first()

        if not workspace:
            raise CommandError("Workspace does not exists")

        project_id = input("Project ID: ")

        if project_id == "":
            raise CommandError("Project ID is required")

        project = Project.objects.filter(
            id=project_id, workspace__slug=workspace_slug
        ).first()

        if not project:
            raise CommandError("Project does not exists")

        start_date = timezone.now() - timezone.timedelta(days=10)
        end_date = timezone.now() + timezone.timedelta(days=5)

        if Cycle.objects.filter(
            Q(workspace__slug=workspace_slug)
            & Q(project_id=project_id)
            & (
                Q(start_date__lte=start_date, end_date__gte=start_date)
                | Q(start_date__lte=end_date, end_date__gte=end_date)
                | Q(start_date__gte=start_date, end_date__lte=end_date)
            )
        ).exists():
            raise CommandError("Cycle already exists")

        cycle = Cycle.objects.create(
            workspace_id=workspace_slug,
            project_id=project_id,
            start_date=start_date,
            end_date=end_date,
            name="New Cycle Analytics",
            owned_by_id=project.created_by_id,
            version=2,
        )

        states = (
            State.objects.filter(workspace__slug=workspace_slug, project=project)
            .exclude(group="Triage")
            .values_list("id", flat=True)
        )

        # Get the maximum sequence_id
        last_id = IssueSequence.objects.filter(project=project).aggregate(
            largest=Max("sequence")
        )["largest"]

        last_id = 1 if last_id is None else last_id + 1

        # Get the maximum sort order
        largest_sort_order = Issue.objects.filter(
            project=project, state_id=states[random.randint(0, len(states) - 1)]
        ).aggregate(largest=Max("sort_order"))["largest"]

        largest_sort_order = (
            65535 if largest_sort_order is None else largest_sort_order + 10000
        )
        fake = Faker()
        Faker.seed(0)
        issues = []
        for _ in range(0, 50):
            sentence = fake.sentence()
            issues.append(
                Issue(
                    state_id=states[random.randint(0, len(states) - 1)],
                    project=project,
                    workspace=workspace,
                    name=sentence[:254],
                    sequence_id=last_id,
                    priority=["urgent", "high", "medium", "low", "none"][
                        random.randint(0, 4)
                    ],
                    created_by_id=project.created_by_id,
                )
            )

            largest_sort_order = largest_sort_order + random.randint(0, 1000)
            last_id = last_id + 1

        issues = Issue.objects.bulk_create(
            issues, ignore_conflicts=True, batch_size=1000
        )
        # Sequences
        IssueSequence.objects.bulk_create(
            [
                IssueSequence(
                    issue=issue,
                    sequence=issue.sequence_id,
                    project=project,
                    workspace=workspace,
                )
                for issue in issues
            ],
            batch_size=100,
        )
        CycleIssue.objects.bulk_create(
            [
                CycleIssue(
                    issue=issue, cycle=cycle, project=project, workspace=workspace
                )
                for issue in issues
            ],
            batch_size=100,
        )

        # Track the issue activities
        IssueActivity.objects.bulk_create(
            [
                IssueActivity(
                    issue=issue,
                    actor_id=project.created_by_id,
                    project=project,
                    workspace=workspace,
                    comment="created the issue",
                    verb="created",
                    created_by_id=project.created_by_id,
                )
                for issue in issues
            ],
            batch_size=100,
        )

        cycle_id = str(cycle.id)
        # trigger the entity issue state activity task
        entity_issue_state_activity_task.delay(
            issue_cycle_data=[
                {
                    "issue_id": str(issue.id),
                    "cycle_id": str(cycle_id),
                }
                for issue in issues
            ],
            user_id=str(project.created_by_id),
            slug=workspace_slug,
            action="ADDED",
        )

        # Prepare analytics record for bulk insert
        yesterday = timezone.now().date() - timedelta(days=1)
        current_date = start_date.date()

        analytics_records = []
        state_data = {
            "backlog": 20,
            "unstarted": 15,
            "started": 10,
            "completed": 5,
            "cancelled": 0,
        }
        days_passed = 0

        while current_date <= yesterday:
            # Calculate total issues
            total_issues = sum(state_data.values())

            # Randomly increase total issues every 2-3 days
            if days_passed % 2 == 0 and random.choice([True, False]):
                increase = random.randint(1, 5)
                state_data["backlog"] += increase

            # Move issues to completed
            issues_to_complete = random.randint(1, 3)
            for _ in range(issues_to_complete):
                if state_data["started"] > 0:
                    state_data["started"] -= 1
                    state_data["completed"] += 1
                elif state_data["unstarted"] > 0:
                    state_data["unstarted"] -= 1
                    state_data["completed"] += 1
                elif state_data["backlog"] > 0:
                    state_data["backlog"] -= 1
                    state_data["completed"] += 1

            # Randomly reduce other states
            for state in ["backlog", "unstarted", "started"]:
                if state_data[state] > 0 and random.choice([True, False]):
                    state_data[state] -= 1
                    state_data["cancelled"] += 1

            # Recalculate total issues after changes
            total_issues = sum(state_data.values())

            analytics_records.append(
                EntityProgress(
                    entity_type="CYCLE",
                    cycle=cycle,
                    progress_date=current_date,
                    total_issues=total_issues,
                    backlog_issues=state_data["backlog"],
                    unstarted_issues=state_data["unstarted"],
                    started_issues=state_data["started"],
                    completed_issues=state_data["completed"],
                    cancelled_issues=state_data["cancelled"],
                    project_id=project_id,
                    workspace=workspace,
                )
            )

            current_date += timedelta(days=1)
            days_passed += 1

        # Bulk create the records at once
        if analytics_records:
            EntityProgress.objects.bulk_create(analytics_records)

        self.stdout.write(self.style.SUCCESS("Cycle created successfully"))
