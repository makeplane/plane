from plane.app.ai.tools.registry import register_tool
from plane.db.models import Project


@register_tool(
    name="list_projects",
    description="List all projects in the workspace",
    input_schema={
        "type": "object",
        "properties": {},
        "required": [],
    },
)
def list_projects(workspace_slug: str, user, **kwargs) -> dict:
    projects = Project.objects.filter(
        workspace__slug=workspace_slug,
        project_projectmember__member=user,
        project_projectmember__is_active=True,
    ).values("id", "name", "description", "identifier")

    return {
        "projects": [
            {
                "id": str(p["id"]),
                "name": p["name"],
                "identifier": p["identifier"],
                "description": p["description"] or "",
            }
            for p in projects
        ]
    }
