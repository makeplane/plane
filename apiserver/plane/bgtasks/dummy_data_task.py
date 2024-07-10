# Python imports
import uuid
import random
from datetime import datetime, timedelta

# Django imports
from django.db.models import Max

# Third party imports
from celery import shared_task
from faker import Faker

# Module imports
from plane.db.models import (
    Workspace,
    User,
    Project,
    ProjectMember,
    State,
    Label,
    Cycle,
    Module,
    Issue,
    IssueSequence,
    IssueAssignee,
    IssueLabel,
    IssueActivity,
    CycleIssue,
    ModuleIssue,
    Page,
    ProjectPage,
    PageLabel,
    Inbox,
    InboxIssue,
)


def create_project(workspace, user_id):
    fake = Faker()
    name = fake.name()
    unique_id = str(uuid.uuid4())[:5]

    project = Project.objects.create(
        workspace=workspace,
        name=f"{name}_{unique_id}",
        identifier=name[
            : random.randint(2, 12 if len(name) - 1 >= 12 else len(name) - 1)
        ].upper(),
        created_by_id=user_id,
        inbox_view=True,
    )

    # Add current member as project member
    _ = ProjectMember.objects.create(
        project=project,
        member_id=user_id,
        role=20,
    )

    return project


def create_project_members(workspace, project, members):
    members = User.objects.filter(email__in=members)

    _ = ProjectMember.objects.bulk_create(
        [
            ProjectMember(
                project=project,
                workspace=workspace,
                member=member,
                role=20,
                sort_order=random.randint(0, 65535),
            )
            for member in members
        ],
        ignore_conflicts=True,
    )
    return


def create_states(workspace, project, user_id):
    states = [
        {
            "name": "Backlog",
            "color": "#A3A3A3",
            "sequence": 15000,
            "group": "backlog",
            "default": True,
        },
        {
            "name": "Todo",
            "color": "#3A3A3A",
            "sequence": 25000,
            "group": "unstarted",
        },
        {
            "name": "In Progress",
            "color": "#F59E0B",
            "sequence": 35000,
            "group": "started",
        },
        {
            "name": "Done",
            "color": "#16A34A",
            "sequence": 45000,
            "group": "completed",
        },
        {
            "name": "Cancelled",
            "color": "#EF4444",
            "sequence": 55000,
            "group": "cancelled",
        },
    ]

    states = State.objects.bulk_create(
        [
            State(
                name=state["name"],
                color=state["color"],
                project=project,
                sequence=state["sequence"],
                workspace=workspace,
                group=state["group"],
                default=state.get("default", False),
                created_by_id=user_id,
            )
            for state in states
        ]
    )

    return states


def create_labels(workspace, project, user_id):
    fake = Faker()
    Faker.seed(0)

    return Label.objects.bulk_create(
        [
            Label(
                name=fake.color_name(),
                color=fake.hex_color(),
                project=project,
                workspace=workspace,
                created_by_id=user_id,
                sort_order=random.randint(0, 65535),
            )
            for _ in range(0, 50)
        ],
        ignore_conflicts=True,
    )


def create_cycles(workspace, project, user_id, cycle_count):
    fake = Faker()
    Faker.seed(0)

    cycles = []
    used_date_ranges = set()  # Track used date ranges

    while len(cycles) <= cycle_count:
        # Generate a start date, allowing for None
        start_date_option = [None, fake.date_this_year()]
        start_date = start_date_option[random.randint(0, 1)]

        # Initialize end_date based on start_date
        end_date = (
            None
            if start_date is None
            else fake.date_between_dates(
                date_start=start_date,
                date_end=datetime.now().date().replace(month=12, day=31),
            )
        )

        # Ensure end_date is strictly after start_date if start_date is not None
        while start_date is not None and (
            end_date <= start_date
            or (start_date, end_date) in used_date_ranges
        ):
            end_date = fake.date_this_year()

        # Add the unique date range to the set
        (
            used_date_ranges.add((start_date, end_date))
            if (end_date is not None and start_date is not None)
            else None
        )

        # Append the cycle with unique date range
        cycles.append(
            Cycle(
                name=fake.name(),
                owned_by_id=user_id,
                sort_order=random.randint(0, 65535),
                start_date=start_date,
                end_date=end_date,
                project=project,
                workspace=workspace,
            )
        )

    return Cycle.objects.bulk_create(cycles, ignore_conflicts=True)


def create_modules(workspace, project, user_id, module_count):
    fake = Faker()
    Faker.seed(0)

    modules = []
    for _ in range(0, module_count):
        start_date = [None, fake.date_this_year()][random.randint(0, 1)]
        end_date = (
            None
            if start_date is None
            else fake.date_between_dates(
                date_start=start_date,
                date_end=datetime.now().date().replace(month=12, day=31),
            )
        )

        modules.append(
            Module(
                name=fake.name(),
                sort_order=random.randint(0, 65535),
                start_date=start_date,
                target_date=end_date,
                project=project,
                workspace=workspace,
            )
        )

    return Module.objects.bulk_create(modules, ignore_conflicts=True)


def create_pages(workspace, project, user_id, pages_count):
    fake = Faker()
    Faker.seed(0)

    pages = []
    for _ in range(0, pages_count):
        text = fake.text(max_nb_chars=60000)
        pages.append(
            Page(
                name=fake.name(),
                workspace=workspace,
                owned_by_id=user_id,
                access=random.randint(0, 1),
                color=fake.hex_color(),
                description_html=f"<p>{text}</p>",
                archived_at=None,
                is_locked=False,
            )
        )
    # Bulk create pages
    pages = Page.objects.bulk_create(pages, ignore_conflicts=True)
    # Add Page to project
    ProjectPage.objects.bulk_create(
        [
            ProjectPage(
                page=page,
                project=project,
                workspace=workspace,
            )
            for page in pages
        ],
        batch_size=1000,
    )


def create_page_labels(workspace, project, user_id, pages_count):
    # labels
    labels = Label.objects.filter(project=project).values_list("id", flat=True)
    pages = random.sample(
        list(
            Page.objects.filter(projects__id=project.id).values_list(
                "id", flat=True
            )
        ),
        int(pages_count / 2),
    )

    # Bulk page labels
    bulk_page_labels = []
    for page in pages:
        for label in random.sample(
            list(labels), random.randint(0, len(labels) - 1)
        ):
            bulk_page_labels.append(
                PageLabel(
                    page_id=page,
                    label_id=label,
                    workspace=workspace,
                )
            )

    # Page labels
    PageLabel.objects.bulk_create(
        bulk_page_labels, batch_size=1000, ignore_conflicts=True
    )


def create_issues(workspace, project, user_id, issue_count):
    fake = Faker()
    Faker.seed(0)

    states = (
        State.objects.filter(workspace=workspace, project=project)
        .exclude(group="Triage")
        .values_list("id", flat=True)
    )
    creators = ProjectMember.objects.filter(
        workspace=workspace, project=project
    ).values_list("member_id", flat=True)

    issues = []

    # Get the maximum sequence_id
    last_id = IssueSequence.objects.filter(
        project=project,
    ).aggregate(
        largest=Max("sequence")
    )["largest"]

    last_id = 1 if last_id is None else last_id + 1

    # Get the maximum sort order
    largest_sort_order = Issue.objects.filter(
        project=project,
        state_id=states[random.randint(0, len(states) - 1)],
    ).aggregate(largest=Max("sort_order"))["largest"]

    largest_sort_order = (
        65535 if largest_sort_order is None else largest_sort_order + 10000
    )

    for _ in range(0, issue_count):
        start_date = [None, fake.date_this_year()][random.randint(0, 1)]
        end_date = (
            None
            if start_date is None
            else fake.date_between_dates(
                date_start=start_date,
                date_end=datetime.now().date().replace(month=12, day=31),
            )
        )

        text = fake.text(max_nb_chars=60000)
        issues.append(
            Issue(
                state_id=states[random.randint(0, len(states) - 1)],
                project=project,
                workspace=workspace,
                name=text[:254],
                description_html=f"<p>{text}</p>",
                description_stripped=text,
                sequence_id=last_id,
                sort_order=largest_sort_order,
                start_date=start_date,
                target_date=end_date,
                priority=["urgent", "high", "medium", "low", "none"][
                    random.randint(0, 4)
                ],
                created_by_id=creators[random.randint(0, len(creators) - 1)],
            )
        )

        largest_sort_order = largest_sort_order + random.randint(0, 1000)
        last_id = last_id + 1

    issues = Issue.objects.bulk_create(
        issues, ignore_conflicts=True, batch_size=1000
    )
    # Sequences
    _ = IssueSequence.objects.bulk_create(
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

    # Track the issue activities
    IssueActivity.objects.bulk_create(
        [
            IssueActivity(
                issue=issue,
                actor_id=user_id,
                project=project,
                workspace=workspace,
                comment="created the issue",
                verb="created",
                created_by_id=user_id,
            )
            for issue in issues
        ],
        batch_size=100,
    )
    return issues


def create_inbox_issues(workspace, project, user_id, inbox_issue_count):
    issues = create_issues(workspace, project, user_id, inbox_issue_count)
    inbox, create = Inbox.objects.get_or_create(
        name="Inbox",
        project=project,
        is_default=True,
    )
    InboxIssue.objects.bulk_create(
        [
            InboxIssue(
                issue=issue,
                inbox=inbox,
                status=(status := [-2, -1, 0, 1, 2][random.randint(0, 4)]),
                snoozed_till=(
                    datetime.now() + timedelta(days=random.randint(1, 30))
                    if status == 0
                    else None
                ),
                source="in-app",
                workspace=workspace,
                project=project,
            )
            for issue in issues
        ],
        batch_size=100,
    )


def create_issue_parent(workspace, project, user_id, issue_count):

    parent_count = issue_count / 4

    parent_issues = Issue.objects.filter(project=project).values_list(
        "id", flat=True
    )[: int(parent_count)]
    sub_issues = Issue.objects.filter(project=project).exclude(
        pk__in=parent_issues
    )[: int(issue_count / 2)]

    bulk_sub_issues = []
    for sub_issue in sub_issues:
        sub_issue.parent_id = parent_issues[
            random.randint(0, int(parent_count - 1))
        ]

    Issue.objects.bulk_update(bulk_sub_issues, ["parent"], batch_size=1000)


def create_issue_assignees(workspace, project, user_id, issue_count):
    # assignees
    assignees = ProjectMember.objects.filter(project=project).values_list(
        "member_id", flat=True
    )
    issues = random.sample(
        list(
            Issue.objects.filter(project=project).values_list("id", flat=True)
        ),
        int(issue_count / 2),
    )

    # Bulk issue
    bulk_issue_assignees = []
    for issue in issues:
        for assignee in random.sample(
            list(assignees), random.randint(0, len(assignees) - 1)
        ):
            bulk_issue_assignees.append(
                IssueAssignee(
                    issue_id=issue,
                    assignee_id=assignee,
                    project=project,
                    workspace=workspace,
                )
            )

    # Issue assignees
    IssueAssignee.objects.bulk_create(
        bulk_issue_assignees, batch_size=1000, ignore_conflicts=True
    )


def create_issue_labels(workspace, project, user_id, issue_count):
    # labels
    labels = Label.objects.filter(project=project).values_list("id", flat=True)
    issues = random.sample(
        list(
            Issue.objects.filter(project=project).values_list("id", flat=True)
        ),
        int(issue_count / 2),
    )

    # Bulk issue
    bulk_issue_labels = []
    for issue in issues:
        for label in random.sample(
            list(labels), random.randint(0, len(labels) - 1)
        ):
            bulk_issue_labels.append(
                IssueLabel(
                    issue_id=issue,
                    label_id=label,
                    project=project,
                    workspace=workspace,
                )
            )

    # Issue labels
    IssueLabel.objects.bulk_create(
        bulk_issue_labels, batch_size=1000, ignore_conflicts=True
    )


def create_cycle_issues(workspace, project, user_id, issue_count):
    # assignees
    cycles = Cycle.objects.filter(project=project).values_list("id", flat=True)
    issues = random.sample(
        list(
            Issue.objects.filter(project=project).values_list("id", flat=True)
        ),
        int(issue_count / 2),
    )

    # Bulk issue
    bulk_cycle_issues = []
    for issue in issues:
        cycle = cycles[random.randint(0, len(cycles) - 1)]
        bulk_cycle_issues.append(
            CycleIssue(
                cycle_id=cycle,
                issue_id=issue,
                project=project,
                workspace=workspace,
            )
        )

    # Issue assignees
    CycleIssue.objects.bulk_create(
        bulk_cycle_issues, batch_size=1000, ignore_conflicts=True
    )


def create_module_issues(workspace, project, user_id, issue_count):
    # assignees
    modules = Module.objects.filter(project=project).values_list(
        "id", flat=True
    )
    issues = random.sample(
        list(
            Issue.objects.filter(project=project).values_list("id", flat=True)
        ),
        int(issue_count / 2),
    )

    # Bulk issue
    bulk_module_issues = []
    for issue in issues:
        module = modules[random.randint(0, len(modules) - 1)]
        bulk_module_issues.append(
            ModuleIssue(
                module_id=module,
                issue_id=issue,
                project=project,
                workspace=workspace,
            )
        )
    # Issue assignees
    ModuleIssue.objects.bulk_create(
        bulk_module_issues, batch_size=1000, ignore_conflicts=True
    )


@shared_task
def create_dummy_data(
    slug,
    email,
    members,
    issue_count,
    cycle_count,
    module_count,
    pages_count,
    inbox_issue_count,
):
    workspace = Workspace.objects.get(slug=slug)

    user = User.objects.get(email=email)
    user_id = user.id

    # Create a project
    project = create_project(workspace=workspace, user_id=user_id)

    # create project members
    create_project_members(
        workspace=workspace, project=project, members=members
    )

    # Create states
    create_states(workspace=workspace, project=project, user_id=user_id)

    # Create labels
    create_labels(workspace=workspace, project=project, user_id=user_id)

    # create cycles
    create_cycles(
        workspace=workspace,
        project=project,
        user_id=user_id,
        cycle_count=cycle_count,
    )

    # create modules
    create_modules(
        workspace=workspace,
        project=project,
        user_id=user_id,
        module_count=module_count,
    )

    # create pages
    create_pages(
        workspace=workspace,
        project=project,
        user_id=user_id,
        pages_count=pages_count,
    )

    # create page labels
    create_page_labels(
        workspace=workspace,
        project=project,
        user_id=user_id,
        pages_count=pages_count,
    )

    # create issues
    create_issues(
        workspace=workspace,
        project=project,
        user_id=user_id,
        issue_count=issue_count,
    )

    # create inbox issues
    create_inbox_issues(
        workspace=workspace,
        project=project,
        user_id=user_id,
        inbox_issue_count=inbox_issue_count,
    )

    # create issue parent
    create_issue_parent(
        workspace=workspace,
        project=project,
        user_id=user_id,
        issue_count=issue_count,
    )

    # create issue assignees
    create_issue_assignees(
        workspace=workspace,
        project=project,
        user_id=user_id,
        issue_count=issue_count,
    )

    # create issue labels
    create_issue_labels(
        workspace=workspace,
        project=project,
        user_id=user_id,
        issue_count=issue_count,
    )

    # create cycle issues
    create_cycle_issues(
        workspace=workspace,
        project=project,
        user_id=user_id,
        issue_count=issue_count,
    )

    # create module issues
    create_module_issues(
        workspace=workspace,
        project=project,
        user_id=user_id,
        issue_count=issue_count,
    )

    return
