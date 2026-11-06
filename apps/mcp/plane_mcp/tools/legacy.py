"""Keep every pre-consolidation tool name callable without advertising it.

Before consolidation this server exposed one tool per API operation. Those names
still resolve: `list_tools` is untouched, so the catalogue stays at 28, and
`get_tool` maps a retired name to its resource tool with the action pre-bound and
hidden. A script or saved prompt calling `create_label` keeps working, and costs
nothing in the listing because it is never advertised.

A retired name also keeps the parameter *spelling* it shipped with. This surface
renamed `work_item_*` parameters to `workitem_*`, and a caller reaching a tool by
its old name has no reason to have followed that: resolving the name but
rejecting `work_item_id` would be a rename dressed up as compatibility.

Each resolution is logged, and every call through one records `tool` != `resource`
(see `PlaneLoggingMiddleware`), so when removing these is scheduled, "nobody still
calls them" is an observation rather than an assumption.
"""

from __future__ import annotations

from fastmcp.server.transforms import GetToolNext, Transform
from fastmcp.tools.base import Tool
from fastmcp.tools.tool_transform import ArgTransform
from fastmcp.utilities.logging import get_logger

logger = get_logger(__name__)


def _retired_parameter_names(parent: Tool) -> dict[str, ArgTransform]:
    """Rename `workitem_*` parameters back to the `work_item_*` spelling they shipped with."""
    properties = (parent.parameters or {}).get("properties", {})
    return {name: ArgTransform(name=name.replace("workitem", "work_item")) for name in properties if "workitem" in name}


class LegacyNames(Transform):
    def __init__(self, aliases: dict[str, tuple[str, str]]) -> None:
        self._aliases = aliases

    async def get_tool(self, name: str, call_next: GetToolNext, *, version=None) -> Tool | None:
        target = self._aliases.get(name)
        if target is None:
            return await call_next(name, version=version)

        tool_name, action = target
        # Kept alongside the `resource`/`retired` log fields: this line predates them and
        # is grep-able, so removing it would break whatever already counts these.
        logger.info("Plane MCP: retired tool name %r resolved to %r %r", name, tool_name, action)
        parent = await call_next(tool_name, version=version)
        if parent is None:
            return None
        return Tool.from_tool(
            parent,
            name=name,
            transform_args={
                "action": ArgTransform(hide=True, default=action),
                **_retired_parameter_names(parent),
            },
        )
