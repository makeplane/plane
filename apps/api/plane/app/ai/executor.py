from plane.app.ai.tools.registry import get_tool
from plane.utils.exception_logger import log_exception


def execute_tool(name: str, args: dict, workspace_slug: str, user) -> dict:
    fn = get_tool(name)
    if not fn:
        return {"error": f"Unknown tool: {name}"}
    try:
        return fn(workspace_slug=workspace_slug, user=user, **args)
    except Exception as e:
        log_exception(e)
        return {"error": str(e)}
