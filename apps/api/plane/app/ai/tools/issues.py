from django.utils import timezone
from plane.app.ai.tools.registry import register_tool
from plane.app.serializers import IssueCreateSerializer
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import Issue, Project, State


@register_tool(
    name="list_issues",
    description="List issues (tasks) in a project. Use when user asks to show, find or list tasks.",
    input_schema={
        "type": "object",
        "properties": {
            "project_id": {
                "type": "string",
                "description": "Project ID to list issues from",
            },
            "limit": {
                "type": "integer",
                "description": "Max number of issues to return (default 10)",
            },
        },
        "required": ["project_id"],
    },
)
def list_issues(workspace_slug: str, user, project_id: str, limit: int = 10, **kwargs) -> dict:
    issues = (
        Issue.objects.filter(
            workspace__slug=workspace_slug,
            project_id=project_id,
            project__project_projectmember__member=user,
            project__project_projectmember__is_active=True,
        )
        .select_related("state")
        .order_by("-created_at")[:limit]
    )

    return {
        "issues": [
            {
                "id": str(issue.id),
                "title": issue.name,
                "state": issue.state.name if issue.state else "Unknown",
                "priority": issue.priority,
                "due_date": str(issue.target_date) if issue.target_date else None,
            }
            for issue in issues
        ]
    }


@register_tool(
    name="create_issue",
    description="Create a new issue (task) in a project.",
    input_schema={
        "type": "object",
        "properties": {
            "project_id": {
                "type": "string",
                "description": "Project ID to create the issue in",
            },
            "title": {
                "type": "string",
                "description": "Title of the issue",
            },
            "description": {
                "type": "string",
                "description": "Optional description",
            },
            "priority": {
                "type": "string",
                "enum": ["urgent", "high", "medium", "low", "none"],
                "description": "Priority of the issue",
            },
            "due_date": {
                "type": "string",
                "description": "Due date in YYYY-MM-DD format",
            },
        },
        "required": ["project_id", "title"],
    },
)
def create_issue(
    workspace_slug: str,
    user,
    project_id: str,
    title: str,
    description: str = "",
    priority: str = "none",
    due_date: str | None = None,
    **kwargs,
) -> dict:
    project = Project.objects.get(id=project_id, workspace__slug=workspace_slug)

    data = {
        "name": title,
        "description_html": f"<p>{description}</p>" if description else "<p></p>",
        "priority": priority,
    }
    if due_date:
        data["target_date"] = due_date

    serializer = IssueCreateSerializer(
        data=data,
        context={
            "project_id": project_id,
            "workspace_id": project.workspace_id,
            "default_assignee_id": project.default_assignee_id,
        },
    )

    if not serializer.is_valid():
        return {"error": str(serializer.errors)}

    issue = serializer.save()

    issue_activity.delay(
        type="issue.activity.created",
        requested_data=str(data),
        actor_id=str(user.id),
        issue_id=str(issue.id),
        project_id=str(project_id),
        current_instance=None,
        epoch=int(timezone.now().timestamp()),
        notification=True,
        origin=None,
    )

    return {
        "id": str(issue.id),
        "title": issue.name,
        "message": f"Issue '{title}' created successfully",
    }


@register_tool(
    name="update_issue",
    description="Update fields of an existing issue.",
    input_schema={
        "type": "object",
        "properties": {
            "issue_id": {
                "type": "string",
                "description": "ID of the issue to update",
            },
            "title": {"type": "string"},
            "description": {
                "type": "string",
                "description": "New description text",
            },
            "priority": {
                "type": "string",
                "enum": ["urgent", "high", "medium", "low", "none"],
            },
            "due_date": {
                "type": "string",
                "description": "Due date in YYYY-MM-DD format",
            },
        },
        "required": ["issue_id"],
    },
)
def update_issue(
    workspace_slug: str,
    user,
    issue_id: str,
    title: str | None = None,
    description: str | None = None,
    priority: str | None = None,
    due_date: str | None = None,
    **kwargs,
) -> dict:
    issue = Issue.objects.get(id=issue_id, workspace__slug=workspace_slug)

    if title:
        issue.name = title
    if description:
        issue.description_html = f"<p>{description}</p>"
    if priority:
        issue.priority = priority
    if due_date:
        issue.target_date = due_date

    issue.updated_by = user
    issue.save()

    return {
        "id": str(issue.id),
        "message": f"Issue '{issue.name}' updated successfully",
    }
