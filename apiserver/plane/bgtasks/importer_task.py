# Python imports
import json
import requests
import uuid

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
)
from plane.bgtasks.user_welcome_task import send_welcome_slack

from rest_framework.response import Response


@shared_task(queue="internal_tasks")
def service_importer(service, importer_id):
    try:
        importer = Importer.objects.get(pk=importer_id)
        importer.status = "processing"
        importer.save(update_fields=["status"])

        users = importer.data.get("users", [])

        # Check if we need to import users as well
        if len(users):
            # For all invited users create the users
            new_users = User.objects.bulk_create(
                [
                    User(
                        email=user.get("email").strip().lower(),
                        username=uuid.uuid4().hex,
                        password=make_password(uuid.uuid4().hex),
                        is_password_autoset=True,
                    )
                    for user in users
                    if user.get("import", False) == "invite"
                ],
                batch_size=10,
                ignore_conflicts=True,
            )

            _ = [
                send_welcome_slack.delay(
                    str(user.id),
                    True,
                    f"{user.email} was imported to Plane from {service}",
                )
                for user in new_users
            ]

            workspace_users = User.objects.filter(
                email__in=[
                    user.get("email").strip().lower()
                    for user in users
                    if user.get("import", False) == "invite"
                    or user.get("import", False) == "map"
                ]
            )

            # Check if any of the users are already member of workspace
            _ = WorkspaceMember.objects.filter(
                member__in=[user for user in workspace_users],
                workspace_id=importer.workspace_id,
            ).update(is_active=True)

            # Add new users to Workspace and project automatically
            WorkspaceMember.objects.bulk_create(
                [
                    WorkspaceMember(
                        member=user,
                        workspace_id=importer.workspace_id,
                        created_by=importer.created_by,
                    )
                    for user in workspace_users
                ],
                batch_size=100,
                ignore_conflicts=True,
            )

            ProjectMember.objects.bulk_create(
                [
                    ProjectMember(
                        project_id=importer.project_id,
                        workspace_id=importer.workspace_id,
                        member=user,
                        created_by=importer.created_by,
                    )
                    for user in workspace_users
                ],
                batch_size=100,
                ignore_conflicts=True,
            )

            IssueProperty.objects.bulk_create(
                [
                    IssueProperty(
                        project_id=importer.project_id,
                        workspace_id=importer.workspace_id,
                        user=user,
                        created_by=importer.created_by,
                    )
                    for user in workspace_users
                ],
                batch_size=100,
                ignore_conflicts=True,
            )

        # Check if sync config is on for github importers
        if service == "github" and importer.config.get("sync", False):
            name = importer.metadata.get("name", False)
            url = importer.metadata.get("url", False)
            config = importer.metadata.get("config", {})
            owner = importer.metadata.get("owner", False)
            repository_id = importer.metadata.get("repository_id", False)

            workspace_integration = WorkspaceIntegration.objects.get(
                workspace_id=importer.workspace_id, integration__provider="github"
            )

            # Delete the old repository object
            GithubRepositorySync.objects.filter(project_id=importer.project_id).delete()
            GithubRepository.objects.filter(project_id=importer.project_id).delete()

            # Create a Label for github
            label = Label.objects.filter(
                name="GitHub", project_id=importer.project_id
            ).first()

            if label is None:
                label = Label.objects.create(
                    name="GitHub",
                    project_id=importer.project_id,
                    description="Label to sync Plane issues with GitHub issues",
                    color="#003773",
                )
            # Create repository
            repo = GithubRepository.objects.create(
                name=name,
                url=url,
                config=config,
                repository_id=repository_id,
                owner=owner,
                project_id=importer.project_id,
            )

            # Create repo sync
            _ = GithubRepositorySync.objects.create(
                repository=repo,
                workspace_integration=workspace_integration,
                actor=workspace_integration.actor,
                credentials=importer.data.get("credentials", {}),
                project_id=importer.project_id,
                label=label,
            )

            # Add bot as a member in the project
            _ = ProjectMember.objects.get_or_create(
                member=workspace_integration.actor,
                role=20,
                project_id=importer.project_id,
            )

        import_data = ImporterSerializer(importer).data

        # import_data_json = json.dumps(import_data, cls=DjangoJSONEncoder)

        # if settings.SEGWAY_BASE_URL:
        #     headers = {
        #         "Content-Type": "application/json",
        #         "x-api-key": settings.SEGWAY_KEY,
        #     }
        #     res = requests.post(
        #         f"{settings.SEGWAY_BASE_URL}/api/jira",
        #         data=import_data_json,
        #         headers=headers,
        #     )
        #     print(res.json())
        #     return Response(res.json(), status=res.status_code)
        return
    except Exception as e:
        print(e)
        importer = Importer.objects.get(pk=importer_id)
        importer.status = "failed"
        importer.save(update_fields=["status"])
        # Print logs if in DEBUG mode
        if settings.DEBUG:
            print(e)
        capture_exception(e)
        return


@shared_task(queue="segway_tasks")
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
            print(existing_state,"existing_state")
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
def modules_sync(data):
    module = Module.objects.get(external_id=data.get("external_id"))
    if module:
        module.name = data.get("name")
        module.save()
    else:
        module = Module.objects.create(
            name=data.get("name"),
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            created_by=data.get("created_by"),
            external_id=data.get("external_id"),
            external_source=data.get("source"),
        )


@shared_task(queue="segway_tasks")
def cycles_sync(data):
    cycle = Cycle.objects.get(external_id=data.get("external_id"))
    if cycle:
        cycle.name = data.get("name")
        cycle.save()
    else:
        cycle = Cycle.objects.create(
            name=data.get("name"),
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            created_by_id=data.get("created_by"),
            external_id=data.get("external_id"),
            external_source=data.get("source"),
        )


def get_label_id(name, data):
    try:
        existing_label = Label.objects.filter(
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            name__iexact=name,
        ).values("id").first()
        return existing_label
    except Label.DoesNotExist:
        return None


def get_state_id(name, data):
    try:
        existing_state = State.objects.filter(
            name__iexact=name,
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
        ).values("id").first()
        return existing_state
    except State.DoesNotExist:
        return None


@shared_task(queue="segway_tasks")
def issue_sync(data):    
    print(data.get("external_id"), "external_id")
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
        print("issue does not exist")
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

        # Issues
        issue = Issue.objects.create(
            project_id=data.get("project_id"),
            workspace_id=data.get("workspace_id"),
            state_id=get_state_id(data.get("state"), data).get("id") if get_state_id(data.get("state"), data) else None,
            # state_id=default_state.id,
            # if data.get("state", False)
            # else default_state.id,
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
                label_id=get_label_id(name, data).get("id") if get_label_id(name, data) else None,
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
        # issue_activity.delay(
        #         type="issue.activity.created",
        #         requested_data=json.dumps(self.request.data, cls=DjangoJSONEncoder),
        #         actor_id=str(request.user.id),
        #         issue_id=str(serializer.data.get("id", None)),
        #         project_id=str(project_id),
        #         current_instance=None,
        #         epoch=int(timezone.now().timestamp()),
        #     )

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
                created_by_id=data.get("created_by"),
            )
            for comment in comments_list
        ]

        _ = IssueComment.objects.bulk_create(bulk_issue_comments, batch_size=100)
