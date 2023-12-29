# Python imports
import uuid
import random
import requests
import json

# Django imports
from django.db.models import Q, Max
from django.contrib.auth.hashers import make_password
from django.conf import settings
from django.db import transaction

# Third Party imports
from celery import shared_task

# Module imports
from plane.db.models import (
    Importer,
    WorkspaceMember,
    ProjectMember,
    Label,
    User,
    IssueProperty,
    IssueAssignee,
    IssueLabel,
    IssueSequence,
    IssueActivity,
    IssueComment,
    ModuleIssue,
    CycleIssue,
    State,
    Module,
    Issue,
    Cycle,
)
from plane.bgtasks.user_welcome_task import send_welcome_slack


from django.db import transaction


def update_imported_items(
    importer_id,
    entity,
    external_id,
    entity_id,
    already_exists=False,
    reason="",
):
    try:
        with transaction.atomic():
            # Select the importer for update to lock the row
            importer = Importer.objects.select_for_update().get(pk=importer_id)

            # Initialize the entity list if it doesn't exist
            if str(entity) not in importer.imported_data:
                importer.imported_data[str(entity)] = {}

            # Prepare the new entry
            importer.imported_data[str(entity)][str(external_id)] = {
                "pid": str(entity_id),
                "already_exists": already_exists,
                "reason": reason,
            }
            # Save the updated importer
            importer.save()

            # Get the total issues
            total_issues = importer.data.get("total_issues")
            processed_issues = len(
                importer.imported_data.get("issues", {})
                if importer.imported_data
                else []
            ) + len(
                importer.imported_data.get("failed_issues", {})
                if importer.imported_data
                else []
            )

            if total_issues == processed_issues:
                importer.status = "completed"
                importer.save()

            # Updated segway
            if settings.SEGWAY_BASE_URL:
                headers = {
                    "Content-Type": "application/json",
                    "x-api-key": settings.SEGWAY_KEY,
                }
                _ = requests.post(
                    f"{settings.SEGWAY_BASE_URL}/api/importer/{importer.service}/status",
                    data=json.dumps(
                        {
                            "total_issues": total_issues,
                            "processed_issues": processed_issues,
                        }
                    ),
                    headers=headers,
                )

    except Exception as e:
        print(f"Error: {e}")  # Exception debugging


def generate_random_hex_color():
    """Generate a random hex color code."""
    # Generate a random integer between 0x000000 and 0xFFFFFF, inclusive
    random_color = random.randint(0, 0xFFFFFF)
    # Convert the integer to a hex string, then format it with a leading '#' and uppercase
    hex_color = "#{:06X}".format(random_color)
    return hex_color


def resolve_state(data):
    """return a state for the creation of the issue"""
    project_id = data.get("project_id")
    workspace_id = data.get("workspace_id")
    created_by_id = data.get("created_by_id")
    importer_id = data.get("importer_id")
    state_data = data.get("state")

    external_source = data.get("external_source")

    # If state is not present
    if not state_data:
        default_state = State.objects.filter(
            ~Q(name="Triage"), project_id=project_id, default=True
        ).first()
        # if there is no default state assign any random state
        if default_state is None:
            default_state = State.objects.filter(
                ~Q(name="Triage"), project_id=project_id
            ).first()

        return default_state
    # Create state
    else:
        if external_source == "github":
            state_name = state_data.get("name")
            if state_name == "open":
                return State.objects.filter(
                    workspace_id=workspace_id, project_id=project_id, group="unstarted"
                ).first()
            else:
                return State.objects.filter(
                    workspace_id=workspace_id, project_id=project_id, group="completed"
                ).first()
        else:
            with transaction.atomic():
                existing = (
                    State.objects.select_for_update()
                    .filter(
                        project_id=project_id,
                        workspace_id=workspace_id,
                        name=state_data.get("name"),
                    )
                    .first()
                )

                if existing:
                    existing.external_id = state_data.get("external_id")
                    existing.external_source = state_data.get("external_source")
                    existing.save()
                    update_imported_items(
                        importer_id=importer_id,
                        entity="states",
                        entity_id=existing.id,
                        external_id=state_data.get("external_id"),
                    )
                    return existing
                else:
                    state = State.objects.create(
                        workspace_id=workspace_id,
                        project_id=project_id,
                        name=state_data.get("name"),
                        color=generate_random_hex_color(),
                        external_id=state_data.get("external_id"),
                        external_source=state_data.get("external_source"),
                        created_by_id=created_by_id,
                    )
                    update_imported_items(
                        importer_id=importer_id,
                        entity="states",
                        entity_id=state.id,
                        external_id=state_data.get("external_id"),
                    )
                    return state


def resolve_labels(data):
    labels_data = data.get("labels", [])
    project_id = data.get("project_id")
    workspace_id = data.get("workspace_id")
    created_by_id = data.get("created_by_id")
    importer_id = data.get("importer_id")

    bulk_labels = []
    for label in labels_data:
        name = label.get("name")
        external_id = label.get("external_id")
        external_source = label.get("external_source")
        try:
            with transaction.atomic():
                existing = (
                    Label.objects.select_for_update()
                    .filter(
                        workspace_id=workspace_id,
                        project_id=project_id,
                        name__exact=name,
                    )
                    .first()
                )
                if existing:
                    existing.external_id = label.get("external_id")
                    existing.external_source = label.get("external_source")
                    existing.save()
                    update_imported_items(
                        importer_id=importer_id,
                        entity="labels",
                        entity_id=existing.id,
                        external_id=label.get("external_id"),
                    )
                    bulk_labels.append(existing)
                else:
                    new_label = Label.objects.create(
                        workspace_id=workspace_id,
                        project_id=project_id,
                        created_by_id=created_by_id,
                        color=label.get("color", generate_random_hex_color()),
                        name=name,
                        external_id=external_id,
                        external_source=external_source,
                    )
                    update_imported_items(
                        importer_id=importer_id,
                        entity="labels",
                        entity_id=new_label.id,
                        external_id=label.get("external_id"),
                    )
                    bulk_labels.append(new_label)
        except Exception as e:
            update_imported_items(
                importer_id=importer_id,
                entity="failed_labels",
                entity_id=None,
                external_id=external_id,
                reason=str(e),
            )

    return bulk_labels


def resolve_assignees(data):
    assignees_data = data.get("assignees", [])
    project_id = data.get("project_id")
    workspace_id = data.get("workspace_id")
    created_by_id = data.get("created_by_id")
    importer_id = data.get("importer_id")
    external_source = data.get("external_source")

    bulk_users = []
    for assignee in assignees_data:
        if assignee.get("email"):
            user = User.objects.filter(email=assignee.get("email")).first()
            if user:
                try:
                    WorkspaceMember.objects.create(
                        member=user,
                        workspace_id=workspace_id,
                    )
                except Exception as e:
                    pass
                try:
                    ProjectMember.objects.create(
                        workspace_id=workspace_id,
                        project_id=project_id,
                        member=user,
                    )
                except Exception as e:
                    pass
                try:
                    IssueProperty.objects.create(
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        user=user,
                    )
                except Exception as e:
                    pass
                update_imported_items(
                    importer_id=importer_id,
                    entity="users",
                    entity_id=user.id,
                    external_id=None,
                )
                bulk_users.append(user)
            else:
                user = User.objects.create(
                    email=assignee.get("email").strip().lower(),
                    username=uuid.uuid4().hex,
                    password=make_password(uuid.uuid4().hex),
                    is_password_autoset=True,
                )
                send_welcome_slack(
                    str(user.id),
                    True,
                    f"{user.email} was imported to Plane from {external_source}",
                )
                try:
                    WorkspaceMember.objects.create(
                        member=user,
                        workspace_id=workspace_id,
                    )
                except Exception as e:
                    pass
                try:
                    ProjectMember.objects.create(
                        workspace_id=workspace_id,
                        project_id=project_id,
                        member=user,
                    )
                except Exception as e:
                    pass
                try:
                    IssueProperty.objects.create(
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        user=user,
                    )
                except Exception as e:
                    pass
                update_imported_items(
                    importer_id=importer_id,
                    entity="users",
                    entity_id=user.id,
                    external_id=None,
                )
                bulk_users.append(user)

    return bulk_users


def resolve_cycle(data):
    project_id = data.get("project_id")
    workspace_id = data.get("workspace_id")
    created_by_id = data.get("created_by_id")
    cycle_data = data.get("cycle")
    importer_id = data.get("importer_id")

    with transaction.atomic():
        cycle = (
            Cycle.objects.select_for_update()
            .filter(
                workspace_id=workspace_id,
                project_id=project_id,
                external_id=cycle_data.get("external_id"),
                external_source=cycle_data.get("external_source"),
            )
            .first()
        )

        if cycle:
            cycle.external_id = cycle_data.get("external_id")
            cycle.external_source = cycle_data.get("external_source")
            cycle.save()
            update_imported_items(
                importer_id=importer_id,
                entity="cycles",
                entity_id=cycle.id,
                external_id=cycle_data.get("external_id"),
            )
            return cycle
        else:
            cycle = Cycle.objects.create(
                name=cycle_data.get("name"),
                workspace_id=workspace_id,
                project_id=project_id,
                external_id=cycle_data.get("external_id"),
                external_source=cycle_data.get("external_source"),
                created_by_id=created_by_id,
            )
            update_imported_items(
                importer_id=importer_id,
                entity="cycles",
                entity_id=cycle.id,
                external_id=cycle_data.get("external_id"),
            )
            return cycle


def resolve_module(data):
    project_id = data.get("project_id")
    workspace_id = data.get("workspace_id")
    created_by_id = data.get("created_by_id")
    module_data = data.get("module")
    importer_id = data.get("importer_id")

    with transaction.atomic():
        module = (
            Module.objects.select_for_update()
            .filter(
                workspace_id=workspace_id,
                project_id=project_id,
                name=module_data.get("name"),
            )
            .first()
        )

        if module:
            module.external_id = module_data.get("external_id")
            module.external_source = module_data.get("external_source")
            update_imported_items(
                importer_id=importer_id,
                entity="modules",
                entity_id=module.id,
                external_id=module_data.get("external_id"),
            )
            return module
        else:
            module = Module.objects.create(
                workspace_id=workspace_id,
                project_id=project_id,
                external_id=module_data.get("external_id"),
                external_source=module_data.get("external_source"),
                name=module_data.get("name"),
                created_by_id=created_by_id,
            )
            update_imported_items(
                importer_id=importer_id,
                entity="modules",
                entity_id=module.id,
                external_id=module_data.get("external_id"),
            )
            return module


def resolve_actor(comment_data):
    return User.objects.filter(email=comment_data.get("email")).values("id")


@shared_task(queue="segway_tasks")
def import_member_sync(data):
    email = data.get("email")
    project_id = data.get("project_id")
    workspace_id = data.get("workspace_id")
    created_by_id = data.get("created_by_id")
    importer_id = data.get("importer_id")
    external_source = data.get("external_source")

    user = User.objects.filter(email=email).first()

    if user:
        try:
            WorkspaceMember.objects.create(
                member=user,
                workspace_id=workspace_id,
            )
        except Exception as e:
            pass
        try:
            ProjectMember.objects.create(
                workspace_id=workspace_id,
                project_id=project_id,
                member=user,
            )
        except Exception as e:
            pass
        try:
            IssueProperty.objects.create(
                project_id=project_id,
                workspace_id=workspace_id,
                created_by_id=created_by_id,
                user=user,
            )
        except Exception as e:
            pass
        update_imported_items(
            importer_id=importer_id,
            entity="users",
            entity_id=user.id,
            external_id=None,
            already_exists=True,
        )
    else:
        user = User.objects.create(
            email=email.strip().lower(),
            username=uuid.uuid4().hex,
            password=make_password(uuid.uuid4().hex),
            is_password_autoset=True,
        )
        send_welcome_slack(
            str(user.id),
            True,
            f"{user.email} was imported to Plane from {external_source}",
        )
        try:
            WorkspaceMember.objects.create(
                member=user,
                workspace_id=workspace_id,
            )
        except Exception as e:
            pass
        try:
            ProjectMember.objects.create(
                workspace_id=workspace_id,
                project_id=project_id,
                member=user,
            )
        except Exception as e:
            pass
        try:
            IssueProperty.objects.create(
                project_id=project_id,
                workspace_id=workspace_id,
                created_by_id=created_by_id,
                user=user,
            )
        except Exception as e:
            pass
        update_imported_items(
            importer_id=importer_id,
            entity="users",
            entity_id=user.id,
            external_id=None,
        )


@shared_task(queue="segway_tasks")
def import_label_sync(data):
    workspace_id = data.get("workspace_id")
    project_id = data.get("project_id")
    name = data.get("name")
    external_id = data.get("external_id")
    external_source = data.get("external_source")
    importer_id = data.get("importer_id")
    created_by_id = data.get("created_by_id")
    color = data.get("color", generate_random_hex_color())
    try:
        with transaction.atomic():
            existing = (
                Label.objects.select_for_update()
                .filter(
                    workspace_id=workspace_id,
                    project_id=project_id,
                    name__exact=name,
                )
                .first()
            )
            if existing:
                existing.external_id = external_id
                existing.external_source = external_source
                existing.save()
                update_imported_items(
                    importer_id=importer_id,
                    entity="labels",
                    entity_id=existing.id,
                    external_id=external_id,
                )
            else:
                new_label = Label.objects.create(
                    workspace_id=workspace_id,
                    project_id=project_id,
                    created_by_id=created_by_id,
                    color=color,
                    name=name,
                    external_id=external_id,
                    external_source=external_source,
                )
                update_imported_items(
                    importer_id=importer_id,
                    entity="labels",
                    entity_id=new_label.id,
                    external_id=external_id,
                )
        return
    except Exception as e:
        update_imported_items(
            importer_id=importer_id,
            entity="failed_labels",
            entity_id=None,
            external_id=external_id,
            reason=str(e),
        )
        return


@shared_task(queue="segway_tasks")
def import_issue_sync(data):
    project_id = data.get("project_id")
    workspace_id = data.get("workspace_id")
    created_by_id = data.get("created_by_id")
    importer_id = data.get("importer_id")
    external_source = data.get("external_source")
    external_id = data.get("external_id")

    try:
        existing_issue = Issue.objects.filter(
            workspace_id=workspace_id,
            project_id=project_id,
            external_source=external_source,
            external_id=external_id,
        ).first()

        # Check if the issue already synced to Plane
        if existing_issue:
            update_imported_items(
                importer_id=importer_id,
                entity_id=existing_issue.id,
                external_id=external_id,
                entity="issues",
                already_exists=True,
            )
            return

        # State
        state = resolve_state(data=data)

        parent_issue = None
        # Parent Issue check
        if data.get("parent"):
            parent_data = data.get("parent")
            parent_issue = Issue.objects.filter(
                external_id=parent_data.get("external_id"),
                external_source=parent_data.get("external_source"),
                workspace_id=workspace_id,
                project_id=project_id,
            ).first()

        # Create the Issue
        # Get the maximum sequence_id
        last_id = IssueSequence.objects.filter(
            project_id=project_id,
        ).aggregate(
            largest=Max("sequence")
        )["largest"]

        last_id = 1 if last_id is None else last_id + 1

        # Get the maximum sort order
        largest_sort_order = Issue.objects.filter(
            project_id=project_id,
            state=state,
        ).aggregate(largest=Max("sort_order"))["largest"]
        largest_sort_order = (
            65535 if largest_sort_order is None else largest_sort_order + 10000
        )

        # Create the issue
        issue = Issue.objects.create(
            project_id=project_id,
            workspace_id=workspace_id,
            state=state,
            name=data.get(
                "name", f"Issue Created through importer from {external_source}"
            )[:254],
            description_html=data.get("description_html", "<p></p>"),
            sequence_id=last_id,
            sort_order=largest_sort_order,
            start_date=data.get("start_date", None),
            target_date=data.get("target_date", None),
            priority=data.get("priority", "none"),
            created_by_id=data.get("created_by_id"),
            external_id=data.get("external_id"),
            external_source=data.get("external_source"),
            parent=parent_issue,
        )
        update_imported_items(
            importer_id=importer_id,
            entity="issues",
            external_id=data.get("external_id"),
            entity_id=issue.id,
        )
    except Exception as e:
        update_imported_items(
            entity="failed_issues",
            entity_id=None,
            external_id=external_id,
            importer_id=importer_id,
            reason=str(e),
        )
        return

    # Sequences
    _ = IssueSequence.objects.create(
        issue=issue,
        sequence=issue.sequence_id,
        project_id=project_id,
        workspace_id=project_id,
    )

    # Track the issue activities
    _ = IssueActivity.objects.create(
        issue=issue,
        actor_id=created_by_id,
        project_id=project_id,
        workspace_id=workspace_id,
        comment=f"imported the issue from {data.get('external_source')}",
        verb="created",
        created_by_id=created_by_id,
    )

    # sub issues
    if data.get("sub_issues", []):
        sub_issues = []
        for sub_issue in Issue.objects.filter(
            workspace_id=workspace_id,
            project_id=project_id,
            external_id__in=[
                sub_issue.get("external_id") for sub_issue in data.get("sub_issues")
            ],
            external_source__in=[
                sub_issue.get("external_source") for sub_issue in data.get("sub_issues")
            ],
        ):
            sub_issue.parent = issue
            sub_issues.append(sub_issue)

        Issue.objects.bulk_update(sub_issues, ["parent"], batch_size=10)

    # Labels
    labels = resolve_labels(data=data)
    # Attach Issue Labels
    _ = IssueLabel.objects.bulk_create(
        [
            IssueLabel(
                project_id=project_id,
                workspace_id=workspace_id,
                created_by_id=created_by_id,
                label=label,
                issue=issue,
            )
            for label in labels
        ],
        batch_size=10,
        ignore_conflicts=True,
    )

    # Assignees
    assignees = resolve_assignees(data)
    _ = IssueAssignee.objects.bulk_create(
        [
            IssueAssignee(
                issue=issue,
                assignee=assignee,
                project_id=project_id,
                workspace_id=workspace_id,
                created_by_id=created_by_id,
            )
            for assignee in assignees
        ],
        batch_size=10,
        ignore_conflicts=True,
    )

    # Issue comments
    if data.get("comments", []):
        IssueComment.objects.bulk_create(
            [
                IssueComment(
                    issue=issue,
                    comment_html=comment.get("comment_html", "<p></p>"),
                    project_id=project_id,
                    workspace_id=workspace_id,
                    actor_id=resolve_actor(comment_data=comment)
                    if resolve_actor(comment_data=comment)
                    else created_by_id,
                    external_id=comment.get("external_id"),
                    external_source=comment.get("external_source"),
                )
                for comment in data.get("comments", [])
            ],
            batch_size=10,
            ignore_conflicts=True,
        )

    # Cycles
    if data.get("cycle"):
        cycle = resolve_cycle(data)
        CycleIssue.objects.create(
            workspace_id=workspace_id,
            project_id=project_id,
            cycle=cycle,
            issue=issue,
            created_by_id=created_by_id,
        )

    # Modules
    if data.get("module"):
        module = resolve_module(data)
        ModuleIssue.objects.create(
            workspace_id=workspace_id,
            project_id=project_id,
            module=module,
            issue=issue,
            created_by_id=created_by_id,
        )


@shared_task(queue="segway_tasks")
def import_module_sync(data):
    project_id = data.get("project_id")
    workspace_id = data.get("workspace_id")
    created_by_id = data.get("created_by_id")
    importer_id = data.get("importer_id")
    name = data.get("name")
    external_id = data.get("external_id")
    external_source = data.get("external_source")
    try:
        with transaction.atomic():
            module = (
                Module.objects.select_for_update()
                .filter(
                    workspace_id=workspace_id,
                    project_id=project_id,
                    name=name,
                )
                .first()
            )

            if module:
                module.external_id = external_id
                module.external_source = external_source
                update_imported_items(
                    importer_id=importer_id,
                    entity="modules",
                    entity_id=module.id,
                    external_id=external_id,
                )
            else:
                module = Module.objects.create(
                    workspace_id=workspace_id,
                    project_id=project_id,
                    external_id=external_id,
                    external_source=external_source,
                    name=name,
                    created_by_id=created_by_id,
                )
                update_imported_items(
                    importer_id=importer_id,
                    entity="modules",
                    entity_id=module.id,
                    external_id=external_id,
                )
        return
    except Exception as e:
        update_imported_items(
            importer_id=importer_id,
            entity="failed_modules",
            entity_id=module.id,
            external_id=external_id,
            reason=str(e),
        )
        return


@shared_task(queue="segway_tasks")
def import_status_sync(data):
    importer_id = data.get("importer_id")
    reason = data.get("reason", "")
    status = data.get("status", "processing")

    importer = Importer.objects.get(pk=importer_id)
    importer.reason = reason
    importer.status = status

    importer.save()
    return
