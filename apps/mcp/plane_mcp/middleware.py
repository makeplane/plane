"""Custom FastMCP middleware for the Plane MCP Server."""

from __future__ import annotations

from collections.abc import Collection
from typing import Any

from fastmcp.server.middleware import Middleware, MiddlewareContext
from fastmcp.server.middleware.logging import StructuredLoggingMiddleware
from fastmcp.tools.tool import ToolResult
from fastmcp.utilities.logging import get_logger

from plane_mcp.coercion import coerce_arguments
from plane_mcp.tools.registry import action_arguments, alias_table

logger = get_logger(__name__)


def missing_action_error(tool: str, actions: Collection[str]) -> str:
    """Error naming the actions `tool` offers, for a call that chose none."""
    return f"Error: {tool} requires an action. It takes: {', '.join(sorted(actions))}."


def stray_argument_error(action: str, arguments: dict, accepted: Collection[str]) -> str | None:
    """Error naming the arguments `action` does not take, or None when all are valid."""
    stray = sorted(n for n, value in arguments.items() if n != "action" and value and n not in accepted)
    if not stray:
        return None
    takes = ", ".join(sorted(accepted)) or "nothing else"
    return f"Error: action '{action}' does not take: {', '.join(stray)}. It takes: {takes}."


class ValidateActionArguments(Middleware):
    """Refuse a call whose action is absent, or whose arguments that action has no use for."""

    def __init__(self) -> None:
        self._accepted = action_arguments()

    async def on_call_tool(self, context: MiddlewareContext, call_next):
        arguments = getattr(context.message, "arguments", None)
        if isinstance(arguments, dict) and (message := self.rejection(context.message.name, arguments)):
            logger.warning("Plane MCP: %s", message)
            return ToolResult(content=message)
        return await call_next(context)

    def rejection(self, tool: str, arguments: dict) -> str | None:
        """The message refusing this call, or None to let it through."""
        by_action = self._accepted.get(tool)
        if by_action is None:
            # A retired name, or not ours at all. Either way not our business.
            return None
        if "action" not in arguments:
            if len(by_action) == 1:
                # A single-operation tool takes no action parameter (its schema
                # omits it), so there is nothing to choose: validate the
                # arguments against its only action instead of demanding one.
                ((action, accepted),) = by_action.items()
                return stray_argument_error(action, arguments, accepted)
            # Pydantic names the parameter but not one permitted value, so a caller
            # that omitted the choice learns nothing it did not already know.
            return missing_action_error(tool, by_action)
        action = arguments["action"]
        if action not in by_action:
            # A present-but-wrong action is left alone: the Literal already reports
            # the permitted set, and a second opinion here would only muddle it.
            return None
        return stray_argument_error(action, arguments, by_action[action])


class CoerceArguments(Middleware):
    """Repair arguments a client encoded as strings, before they are validated."""

    async def on_call_tool(self, context: MiddlewareContext, call_next):
        arguments = getattr(context.message, "arguments", None)
        if not arguments:
            return await call_next(context)

        schema = await self._schema(context)
        if schema is None:
            return await call_next(context)

        try:
            repaired, touched = coerce_arguments(arguments, schema)
        except Exception:  # noqa: BLE001 - never break a call that would have worked
            logger.exception("Plane MCP: argument coercion failed for %s; passing through", context.message.name)
            return await call_next(context)

        if touched:
            logger.warning(
                "Plane MCP: %s sent %s as string(s); decoded before validation",
                context.message.name,
                ", ".join(sorted(touched)),
            )
            context.message.arguments = repaired
        return await call_next(context)

    @staticmethod
    async def _schema(context: MiddlewareContext) -> dict | None:
        """The called tool's input schema, or None if it cannot be resolved.

        A retired tool name resolves through the alias transform here, so it is
        repaired against the schema the caller actually sees.
        """
        server = getattr(context.fastmcp_context, "fastmcp", None)
        if server is None:
            return None
        try:
            tool = await server.get_tool(context.message.name)
        except Exception:  # noqa: BLE001 - an unknown tool is call_next's error to raise
            return None
        return getattr(tool, "parameters", None)


class PlaneLoggingMiddleware(StructuredLoggingMiddleware):
    """StructuredLoggingMiddleware that records which operation ran, not just which tool.

    A dispatch tool's name is not its operation -- `workitem` covers 23 of them -- so
    `resource` and `action` are recorded beside it, resolved through the alias table for
    a retired name, which carries no `action` of its own. `resource` + `action` then
    names one operation however it was reached, and `tool != resource` is exactly the
    set of calls still arriving on a retired name.

    `tool` keeps its previous meaning -- the name the caller used -- so dashboards built
    on it keep counting the same thing. The two additions are additive, and they are on
    the start record as well, which previously carried neither.
    """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        # Built once; per record this is a dict lookup.
        self._aliases = alias_table()

    def _operation(self, context: MiddlewareContext) -> dict[str, str]:
        """What the caller called, and which operation that is."""
        if context.method != "tools/call":
            return {}
        name = getattr(context.message, "name", "unknown")
        if alias := self._aliases.get(name):
            resource, action = alias
        else:
            resource = name
            action = (getattr(context.message, "arguments", None) or {}).get("action")
        fields = {"tool": name, "resource": resource}
        if action:
            fields["action"] = action
        return fields

    def _create_before_message(self, context: MiddlewareContext, *args: Any, **kwargs: Any) -> dict:
        return super()._create_before_message(context, *args, **kwargs) | self._operation(context)

    def _create_after_message(self, context: MiddlewareContext, start_time: float) -> dict:
        return super()._create_after_message(context, start_time) | self._operation(context)

    def _create_error_message(self, context: MiddlewareContext, start_time: float, error: Exception) -> dict:
        return super()._create_error_message(context, start_time, error) | self._operation(context)
