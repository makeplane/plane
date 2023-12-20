# Python imports
import json
import requests
import uuid
from functools import wraps

# Django imports
from django.db.models import Q, Max
from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder
from django.contrib.auth.hashers import make_password

# Third Party imports
from celery import shared_task
from sentry_sdk import capture_exception

# Module imports
from plane.app.serializers import ImporterSerializer
from plane.db.models import (
    Importer,
    WorkspaceMember,
    GithubRepositorySync,
    GithubRepository,
    ProjectMember,
    WorkspaceIntegration,
    Label,
    User,
    State,
    Issue,
    Module,
    Cycle,
    IssueProperty,
    IssueAssignee,
    IssueLabel,
    Project,
    IssueSequence,
    IssueActivity,
    IssueComment,
    IssueLink,
    ModuleIssue,
)
from plane.bgtasks.user_welcome_task import send_welcome_slack

from rest_framework.response import Response


@shared_task(queue="internal_tasks")
def service_importer(service, importer_id):
    pass


def handle_exceptions(task_func):
    @wraps(task_func)
    def wrapper(*args, **kwargs):
        try:
            return task_func(*args, **kwargs)
        except Exception as e:
            data = kwargs.get("data")
            if data:
                importer_id = data.get("importer_id")
                status = data.get("status")
                if importer_id and status:
                    importer = Importer.objects.get(pk=importer_id)
                    importer.status = status
                    importer.reason = str(e)
                    importer.save(update_fields=["status", "reason"])

    return wrapper


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
        Label.objects.create(
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            name=data.get("name"),
            color=data.get("color"),
            created_by_id=data.get("created_by"),
            external_id=data.get("external_id", None),
            external_source=data.get("external_source"),
        )


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
            name=data.get("name", "Issue Created through Importer"),
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
        _ = Cycle.objects.create(
            name=data.get("name"),
            description_html=data.get("description_html", "<p></p>"),
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            created_by_id=data.get("created_by"),
            external_id=data.get("external_id"),
            external_source=data.get("external_source"),
        )


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


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=100,
    max_retries=5,
    retry_jitter=True,
    queue="segway_task",
)
@handle_exceptions
def import_task(data):
    type = data.get("type")
    print(data)

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
        print(e, type, data)
