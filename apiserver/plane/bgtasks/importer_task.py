# Python imports
import uuid
from functools import wraps
# Django imports
from django.db.models import Q, Max
from django.contrib.auth.hashers import make_password

# Third Party imports
from celery import shared_task
from celery.exceptions import MaxRetriesExceededError

# Module imports
from plane.db.models import (
    Importer,
    WorkspaceMember,
    ProjectMember,
    Label,
    User,
    State,
    Issue,
    Module,
    Cycle,
    IssueProperty,
    IssueAssignee,
    IssueLabel,
    IssueSequence,
    IssueActivity,
    IssueComment,
    IssueLink,
    ModuleIssue,
    State,
    Module,
    Issue,
    Cycle,
)
from plane.bgtasks.user_welcome_task import send_welcome_slack

from rest_framework.response import Response


@shared_task(queue="internal_tasks")
def service_importer(service, importer_id):
    pass


## Utility functions
def get_label_id(name, data):
    try:
        existing_label = (
            Label.objects.filter(
                project_id=data.get("project_id"),
                workspace_id=data.get("workspace_id"),
                name__iexact=name,
            )
            .values("id")
            .first()
        )
        return existing_label
    except Label.DoesNotExist:
        return None


def get_state_id(name, data):
    try:
        existing_state = (
            State.objects.filter(
                name__iexact=name,
                project_id=data.get("project_id"),
                workspace_id=data.get("workspace_id"),
            )
            .values("id")
            .first()
        )
        return existing_state
    except State.DoesNotExist:
        return None


def get_user_id(name):
    try:
        existing_user = User.objects.filter(email=name).values("id").first()
        return existing_user
    except User.DoesNotExist:
        return None


def update_imported_items(importer_id, entity, entity_id):
    importer = Importer.objects.get(pk=importer_id)
    if importer.imported_data:
        importer.imported_data.setdefault(str(entity), []).append(str(entity_id))
    else:
        importer.imported_data = {
            str(entity): [str(entity_id)]
        }
    importer.save()


## Sync functions
def members_sync(data):
    try:
        user = User.objects.get(email=data.get("email"))
        _ = WorkspaceMember.objects.get_or_create(
            member_id=user.id, workspace_id=data.get("workspace_id")
        )
        _ = ProjectMember.objects.get_or_create(
            member_id=user.id,
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
        )
        _ = IssueProperty.objects.get_or_create(
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            user_id=user.id,
            created_by_id=data.get("created_by"),
        )

    except User.DoesNotExist:
        # For all invited users create the users
        new_user = User.objects.create(
            email=data.get("email").strip().lower(),
            username=uuid.uuid4().hex,
            password=make_password(uuid.uuid4().hex),
            is_password_autoset=True,
        )

        service = data.get("external_source")

        WorkspaceMember.objects.create(
            member_id=new_user.id,
            workspace_id=data.get("workspace_id"),
            created_by_id=data.get("created_by"),
        )

        ProjectMember.objects.create(
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            member_id=new_user.id,
            created_by_id=data.get("created_by"),
        )

        IssueProperty.objects.create(
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            user_id=new_user.id,
            created_by_id=data.get("created_by"),
        )
        if data.get("source", False) == "slack":
            send_welcome_slack.delay(
                str(new_user.id),
                True,
                f"{new_user.email} was imported to Plane from {service}",
            )


def label_sync(data):
    existing_label = Label.objects.filter(
        project_id=data.get("project_id"),
        workspace_id=data.get("workspace_id"),
        name__iexact=data.get("name"),
        external_id=data.get("external_id", None),
        external_source=data.get("external_source"),
    )

    if not existing_label.exists() and data.get("name"):
        label = Label.objects.create(
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            name=data.get("name"),
            color=data.get("color"),
            created_by_id=data.get("created_by"),
            external_id=data.get("external_id", None),
            external_source=data.get("external_source"),
        )
        update_imported_items(data.get("importer_id"), "labels", label.id)


def state_sync(data):
    try:
        state = State.objects.get(
            external_id=data.get("external_id"),
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
        )

    except State.DoesNotExist:
        existing_states = State.objects.filter(
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            group=data.get("state_group"),
            name__iexact=data.get("state_name"),
        )

        if existing_states.exists():
            existing_state = existing_states.first()
            existing_state.external_id = data.get("external_id")
            existing_state.external_source = data.get("external_source")
            existing_state.save()
        else:
            state = State.objects.create(
                project_id=data.get("project_id"),
                workspace_id=data.get("workspace_id"),
                name=data.get("state_name"),
                group=data.get("state_group"),
                created_by_id=data.get("created_by"),
                external_id=data.get("external_id"),
                external_source=data.get("external_source"),
            )
            update_imported_items(data.get("importer_id"), "states", state.id)


def issue_sync(data):
    try:
        issue = Issue.objects.get(
            external_id=data.get("external_id"),
            external_source=data.get("external_source"),
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
        )
    except Issue.DoesNotExist:
        # Get the default state
        default_state = State.objects.filter(
            ~Q(name="Triage"), project_id=data.get("project_id"), default=True
        ).first()

        # if there is no default state assign any random state
        if default_state is None:
            default_state = State.objects.filter(
                ~Q(name="Triage"), project_id=data.get("project_id")
            ).first()

        # Get the maximum sequence_id
        last_id = IssueSequence.objects.filter(
            project_id=data.get("project_id")
        ).aggregate(largest=Max("sequence"))["largest"]

        last_id = 1 if last_id is None else last_id + 1

        # Get the maximum sort order
        largest_sort_order = Issue.objects.filter(
            project_id=data.get("project_id"), state=default_state
        ).aggregate(largest=Max("sort_order"))["largest"]

        largest_sort_order = (
            65535 if largest_sort_order is None else largest_sort_order + 10000
        )
        parent_id = None
        if data.get("parent_id", False):
            parent_id = Issue.objects.filter(
                external_id=data.get("parent_id"),
                external_source=data.get("external_source"),
                project_id=data.get("project_id"),
                workspace_id=data.get("workspace_id"),
            ).values("id")

        # Issues
        issue = Issue.objects.create(
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            state_id=get_state_id(data.get("state"), data).get("id")
            if get_state_id(data.get("state"), data)
            else default_state.id,
            name=data.get("name", "Issue Created through Importer")[:255],
            description_html=data.get("description_html", "<p></p>"),
            sequence_id=last_id,
            sort_order=largest_sort_order,
            start_date=data.get("start_date", None),
            target_date=data.get("target_date", None),
            priority=data.get("priority", "none"),
            created_by_id=data.get("created_by_id"),
            external_id=data.get("external_id"),
            external_source=data.get("external_source"),
            parent_id=parent_id,
        )

        # Sequences
        _ = IssueSequence.objects.create(
            issue=issue,
            sequence=issue.sequence_id,
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
        )

        # Attach Links
        _ = IssueLink.objects.create(
            issue=issue,
            url=data.get("link", {}).get("url", "https://github.com"),
            title=data.get("link", {}).get("title", "Original Issue"),
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            created_by_id=data.get("created_by_id"),
        )

        # Track the issue activities
        _ = IssueActivity.objects.create(
            issue=issue,
            actor_id=data.get("created_by_id"),
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            comment=f"imported the issue from {data.get('external_source')}",
            verb="created",
            created_by_id=data.get("created_by_id"),
        )

        update_imported_items(data.get("importer_id"), "issues", issue.id)


def issue_label_sync(data):
    issue = Issue.objects.get(
        external_source=data.get("external_issue_source"),
        external_id=data.get("external_issue_id"),
        project_id=data.get("project_id"),
        workspace_id=data.get("workspace_id"),
    )
    if get_label_id(data.get("name"), data):
        IssueLabel.objects.create(
            issue=issue,
            label_id=get_label_id(data.get("name"), data).get("id"),
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            created_by_id=data.get("created_by_id"),
        )


def issue_assignee_sync(data):
    issue = Issue.objects.get(
        external_source=data.get("external_issue_source"),
        external_id=data.get("external_issue_id"),
        project_id=data.get("project_id"),
        workspace_id=data.get("workspace_id"),
    )
    user = User.objects.filter(email=data.get("email")).values("id")

    IssueAssignee.objects.create(
        issue=issue,
        assignee_id=user,
        project_id=data.get("project_id"),
        workspace_id=data.get("workspace_id"),
        created_by_id=data.get("created_by_id"),
    )


def issue_comment_sync(data):
    # Create Comments
    issue = Issue.objects.get(
        external_source=data.get("external_issue_source"),
        external_id=data.get("external_issue_id"),
        project_id=data.get("project_id"),
        workspace_id=data.get("workspace_id"),
    )
    IssueComment.objects.create(
        issue=issue,
        comment_html=data.get("comment_html", "<p></p>"),
        actor_id=data.get("created_by_id"),
        project_id=data.get("project_id"),
        workspace_id=data.get("workspace_id"),
        created_by_id=get_user_id(data.get("created_by_id")).get("id")
        if get_user_id(data.get("created_by_id"))
        else data.get("created_by_id"),
        external_id=data.get("external_id"),
        external_source=data.get("external_source"),
    )


def cycles_sync(data):
    try:
        _ = Cycle.objects.get(
            external_id=data.get("external_id"),
            external_source=data.get("external_source"),
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
        )
    except Cycle.DoesNotExist:
        cycle = Cycle.objects.create(
            name=data.get("name"),
            description_html=data.get("description_html", "<p></p>"),
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            created_by_id=data.get("created_by"),
            external_id=data.get("external_id"),
            external_source=data.get("external_source"),
        )
        update_imported_items(data.get("importer_id"), "cycles", cycle.id)


def module_sync(data):
    try:
        _ = Module.objects.get(
            external_id=data.get("external_id"),
            external_source=data.get("external_source"),
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
        )
    except Module.DoesNotExist:
        module = Module.objects.create(
            name=data.get("name"),
            description_html=data.get("description_html", "<p></p>"),
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            created_by_id=data.get("created_by"),
            external_id=data.get("external_id"),
            external_source=data.get("external_source"),
        )
        update_imported_items(data.get("importer_id"), "modules", module.id)


def modules_issue_sync(data):
    module = Module.objects.get(
        external_id=data.get("module_id"),
        project_id=data.get("project_id"),
        workspace_id=data.get("workspace_id"),
        external_source=data.get("external_source"),
    )
    issue = Issue.objects.get(
        external_id=data.get("issue_id"),
        external_source=data.get("external_source"),
        project_id=data.get("project_id"),
        workspace_id=data.get("workspace_id"),
    )

    _ = ModuleIssue.objects.create(
        module=module,
        issue=issue,
        project_id=data.get("project_id"),
        workspace_id=data.get("workspace_id"),
        created_by_id=data.get("created_by"),
    )


def import_sync(data):
    importer = Importer.objects.get(pk=data.get("importer_id"))
    importer.status = data.get("status")
    importer.save(update_fields=["status"])


@shared_task(bind=True, queue="segway_task", max_retries=5)
def import_task(self, data):
    type = data.get("type")

    if type is None:
        return

    TYPE_MAPPER = {
        "member.sync": members_sync,
        "label.sync": label_sync,
        "state.sync": state_sync,
        "issue.sync": issue_sync,
        "issue.label.sync": issue_label_sync,
        "issue.assignee.sync": issue_assignee_sync,
        "issue.comment.sync": issue_comment_sync,
        "cycle.sync": cycles_sync,
        "module.sync": module_sync,
        "module.issue.sync": modules_issue_sync,
        "import.sync": import_sync,
    }
    try:
        func = TYPE_MAPPER.get(type)
        if func is None:
            return
        # Call the function
        func(data)
        return
    except Exception as e:
        try:
            # Retry with exponential backoff
            self.retry(exc=e, countdown=50, backoff=2)
        except MaxRetriesExceededError:
            # For max retries reached items fail the import
            importer = Importer.objects.get(pk=data.get("importer_id"))
            importer.status = "failed"
            importer.reason = e
            importer.save()

        return

def handle_exceptions(task_func):
    @wraps(task_func)
    def wrapper(*args, **kwargs):
        try:
            return task_func(*args, **kwargs)
        except Exception as e:
            data = kwargs.get('data')
            if data:
                importer_id = data.get("importer_id")
                if importer_id:
                    importer = Importer.objects.get(pk=importer_id)
                    importer.status = "failed"
                    importer.reason = str(e)
                    importer.save(update_fields=["status", "reason"])
    return wrapper


@shared_task(queue="segway_tasks")
@handle_exceptions
def members_sync(data):
    try:
        user = User.objects.get(email=data.get("email"))
        _ = WorkspaceMember.objects.get_or_create(
            member_id=user.id, workspace_id=data.get("workspace_id")
        )
        _ = ProjectMember.objects.get_or_create(
            member_id=user.id,
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
        )
        _ = IssueProperty.objects.get_or_create(
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            user_id=user.id,
            created_by_id=data.get("created_by"),
        )

    except User.DoesNotExist:
        # For all invited users create the users
        new_user = User.objects.create(
            email=data.get("email").strip().lower(),
            username=uuid.uuid4().hex,
            password=make_password(uuid.uuid4().hex),
            is_password_autoset=True,
        )

        WorkspaceMember.objects.create(
            member_id=new_user.id,
            workspace_id=data.get("workspace_id"),
            created_by_id=data.get("created_by"),
        )

        ProjectMember.objects.create(
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            member_id=new_user.id,
            created_by_id=data.get("created_by"),
        )

        IssueProperty.objects.create(
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            user_id=new_user.id,
            created_by_id=data.get("created_by"),
        )
        if data.get("source", False) == "slack":
            send_welcome_slack.delay(
                str(new_user.id),
                True,
                f"{new_user.email} was imported to Plane from {service}",
            )


@shared_task(queue="segway_tasks")
@handle_exceptions
def label_sync(data):
    existing_label = Label.objects.filter(
        project_id=data.get("project_id"),
        workspace_id=data.get("workspace_id"),
        name__iexact=data.get("data"),
    )

    if not existing_label.exists() and data.get("data"):
        Label.objects.create(
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            name=data.get("data"),
            created_by_id=data.get("created_by"),
        )


@shared_task(queue="segway_tasks")
@handle_exceptions
def state_sync(data):
    try:
        state = State.objects.get(
            external_id=data.get("external_id"),
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
        )

    except State.DoesNotExist:
        existing_states = State.objects.filter(
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            group=data.get("state_group"),
            name__iexact=data.get("state_name"),
        )

        if existing_states.exists():
            existing_state = existing_states.first()
            existing_state.external_id = data.get("external_id")
            existing_state.external_source = data.get("external_source")
            existing_state.save()
        else:
            State.objects.create(
                project_id=data.get("project_id"),
                workspace_id=data.get("workspace_id"),
                name=data.get("state_name"),
                group=data.get("state_group"),
                created_by_id=data.get("created_by"),
                external_id=data.get("external_id"),
                external_source=data.get("external_source"),
            )


@shared_task(queue="segway_tasks")
@handle_exceptions
def module_sync(data):
    try:
        _ = Module.objects.get(
            external_id=data.get("external_id"),
            external_source=data.get("external_source"),
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
        )
    except Module.DoesNotExist:
        _ = Module.objects.create(
            name=data.get("name"),
            description_html=data.get("description_html", "<p></p>"),
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            created_by_id=data.get("created_by"),
            external_id=data.get("external_id"),
            external_source=data.get("external_source"),
        )


@shared_task(queue="segway_tasks")
@handle_exceptions
def cycles_sync(data):
    try:
        _ = Cycle.objects.get(
            external_id=data.get("external_id"),
            external_source=data.get("external_source"),
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
        )
    except Cycle.DoesNotExist:
        _ = Cycle.objects.create(
            name=data.get("name"),
            description_html=data.get("description_html", "<p></p>"),
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            created_by_id=data.get("created_by"),
            external_id=data.get("external_id"),
            external_source=data.get("external_source"),
        )

@handle_exceptions
def get_label_id(name, data):
    try:
        existing_label = (
            Label.objects.filter(
                project_id=data.get("project_id"),
                workspace_id=data.get("workspace_id"),
                name__iexact=name,
            )
            .values("id")
            .first()
        )
        return existing_label
    except Label.DoesNotExist:
        return None

@handle_exceptions
def get_state_id(name, data):
    try:
        existing_state = (
            State.objects.filter(
                name__iexact=name,
                project_id=data.get("project_id"),
                workspace_id=data.get("workspace_id"),
            )
            .values("id")
            .first()
        )
        return existing_state
    except State.DoesNotExist:
        return None

@handle_exceptions
def get_user_id(name):
    try:
        existing_user = User.objects.filter(email=name).values("id").first()
        return existing_user
    except User.DoesNotExist:
        return None


@shared_task(queue="segway_tasks")
@handle_exceptions
def modules_issue_sync(data):
    module = Module.objects.get(
        external_id=data.get("module_id"),
        project_id=data.get("project_id"),
        workspace_id=data.get("workspace_id"),
        external_source=data.get("external_source"),
    )
    issue = Issue.objects.get(
        external_id=data.get("issue_id"),
        external_source=data.get("external_source"),
        project_id=data.get("project_id"),
        workspace_id=data.get("workspace_id"),
    )

    _ = ModuleIssue.objects.create(
        module=module,
        issue=issue,
        project_id=data.get("project_id"),
        workspace_id=data.get("workspace_id"),
        created_by_id=data.get("created_by"),
    )



@shared_task(queue="segway_tasks")
@handle_exceptions
def issue_sync(data):
    try:
        issue = Issue.objects.get(
            external_id=data.get("external_id"),
            external_source=data.get("external_source"),
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
        )
        # if issue:
        #     issue.name = data.get("name")
        #     issue.description_html = data.get("description")
        #     issue.start_date = data.get("start_date")
        #     issue.target_date = data.get("target_date")
        #     issue.priority = data.get("priority")

        #     if data.get("assignee"):
        #         user = User.objects.filter(email=data.get("assignee")).values("id")
        #         # first get that issue assignee then check whether both are same or not if not then update the assignee
        #         assignee = IssueAssignee.objects.filter(issue=issue, project_id=data.get("project_id"),workspace_id=data.get("workspace_id")).values("assignee_id__email")
        #         if assignee != data.get("assignee"):
        #             assignee = IssueAssignee.objects.filter(issue=issue, project_id=data.get("project_id")).update(assignee_id=user)

        #     # first get all the issue labels then check whether all are same or not if not then update the label
        #     labels = IssueLabel.objects.filter(issue=issue, project_id=data.get("project_id"),workspace_id=data.get("workspace_id")).values("label_id__name")
        # if labels != data.get("labels_list"):

        # if data.get("labels_list"):
        #     labels_list = data.get("labels_list", [])
        #     bulk_issue_labels = []
        #     bulk_issue_labels = bulk_issue_labels + [
        #         IssueLabel(
        #             issue=issue,
        #             label_id=get_label_id(name, data),
        #             project_id=data.get("project_id"),
        #             workspace_id=data.get("workspace_id"),
        #             created_by_id=data.get("created_by"),
        #         )
        #         for name in labels_list
        #     ]

        #     _ = IssueLabel.objects.bulk_create(
        #         bulk_issue_labels, batch_size=100, ignore_conflicts=True
        #     )

        # issue.save()

    except Issue.DoesNotExist:
        # Get the default state
        default_state = State.objects.filter(
            ~Q(name="Triage"), project_id=data.get("project_id"), default=True
        ).first()

        # if there is no default state assign any random state
        if default_state is None:
            default_state = State.objects.filter(
                ~Q(name="Triage"), project_id=data.get("project_id")
            ).first()

        # Get the maximum sequence_id
        last_id = IssueSequence.objects.filter(
            project_id=data.get("project_id")
        ).aggregate(largest=Max("sequence"))["largest"]

        last_id = 1 if last_id is None else last_id + 1

        # Get the maximum sort order
        largest_sort_order = Issue.objects.filter(
            project_id=data.get("project_id"), state=default_state
        ).aggregate(largest=Max("sort_order"))["largest"]

        largest_sort_order = (
            65535 if largest_sort_order is None else largest_sort_order + 10000
        )
        parent_id = None
        if data.get("parent_id", False):
            parent_id = Issue.objects.filter(
                external_id=data.get("parent_id"),
                external_source=data.get("external_source"),
                project_id=data.get("project_id"),
                workspace_id=data.get("workspace_id"),
            ).values("id")

        # Issues
        issue = Issue.objects.create(
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            state_id=get_state_id(data.get("state"), data).get("id")
            if get_state_id(data.get("state"), data)
            else default_state.id,
            name=data.get("name", "Issue Created through Importer"),
            description_html=data.get("description_html", "<p></p>"),
            sequence_id=last_id,
            sort_order=largest_sort_order,
            start_date=data.get("start_date", None),
            target_date=data.get("target_date", None),
            priority=data.get("priority", "none"),
            created_by_id=data.get("created_by"),
            external_id=data.get("external_id"),
            external_source=data.get("external_source"),
            parent_id=parent_id,
        )

        # Attach Links
        # _ = IssueLink.objects.create(
        #     issue=issue,
        #     url=data.get("link", {}).get("url", "https://github.com"),
        #     title=data.get("link", {}).get("title", "Original Issue"),
        #     project_id=data.get("project_id"),
        #     workspace_id=data.get("workspace_id"),
        #     created_by_id=data.get("created_by"),
        # )

        # Sequences
        _ = IssueSequence.objects.create(
            issue=issue,
            sequence=issue.sequence_id,
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
        )

        # Attach Labels
        bulk_issue_labels = []
        labels_list = data.get("labels_list", [])
        bulk_issue_labels = bulk_issue_labels + [
            IssueLabel(
                issue=issue,
                label_id=get_label_id(name, data).get("id")
                if get_label_id(name, data)
                else None,
                project_id=data.get("project_id"),
                workspace_id=data.get("workspace_id"),
                created_by_id=data.get("created_by"),
            )
            for name in labels_list
        ]

        _ = IssueLabel.objects.bulk_create(
            bulk_issue_labels, batch_size=100, ignore_conflicts=True
        )

        if data.get("assignee"):
            user = User.objects.filter(email=data.get("assignee")).values("id")
            # Attach Assignees
            _ = IssueAssignee.objects.create(
                issue=issue,
                assignee_id=user,
                project_id=data.get("project_id"),
                workspace_id=data.get("workspace_id"),
                created_by_id=data.get("created_by"),
            )

        # Track the issue activities
        _ = IssueActivity.objects.create(
            issue=issue,
            actor_id=data.get("created_by"),
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            comment=f"imported the issue from {data.get('external_source')}",
            verb="created",
            created_by_id=data.get("created_by"),
        )

        # Create Comments
        bulk_issue_comments = []
        comments_list = data.get("comments_list", [])
        bulk_issue_comments = bulk_issue_comments + [
            IssueComment(
                issue=issue,
                comment_html=comment.get("comment_html", "<p></p>"),
                actor_id=data.get("created_by"),
                project_id=data.get("project_id"),
                workspace_id=data.get("workspace_id"),
                created_by_id=get_user_id(comment.get("created_by")).get("id") if comment.get("created_by") else data.get("created_by"),
            )
            for comment in comments_list
        ]

        _ = IssueComment.objects.bulk_create(bulk_issue_comments, batch_size=100)


@shared_task(queue="segway_tasks")
@handle_exceptions
def import_sync(data):
    importer = Importer.objects.get(pk=data.get("importer_id"))
    importer.status = data.get("status")
    importer.save(update_fields=["status"])
