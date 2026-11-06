"""Declarative description of a resource's actions.

The Python signature of the registered tool stays the source of truth for the
JSON schema -- FastMCP derives it. This module is the source of truth for the
generated description, the tool annotations, and the legacy-name alias entries.
`tests/tools/test_conformance.py` asserts the two agree.

Rendering one house style from a declaration is what stops 28 hand-written
descriptions from drifting apart; it is not specific to any one catalogue.
"""

from __future__ import annotations

from dataclasses import dataclass

from mcp.types import ToolAnnotations


@dataclass(frozen=True, slots=True)
class Action:
    """One operation on a resource."""

    name: str
    requires: tuple[str, ...] = ()
    optional: tuple[str, ...] = ()
    note: str = ""
    read: bool = False
    destructive: bool = False
    open_world: bool = False

    def line(self) -> str:
        """One rendered line of the tool description."""
        params = ", ".join(self.requires) if self.requires else "no required params"
        optional = f"; optional {', '.join(self.optional)}" if self.optional else ""
        note = f" -- {self.note}" if self.note else ""
        return f"{self.name} ({params}{optional}){note}"


def build_description(summary: str, actions: tuple[Action, ...], footer: str = "") -> str:
    """Render a tool description in one house style, so it cannot drift per author."""
    lines = [summary, "", "Actions:"]
    lines += [f"  {action.line()};" for action in actions]
    lines[-1] = lines[-1][:-1] + "."
    if footer:
        lines += ["", footer.strip()]
    return "\n".join(lines)


def build_annotations(title: str, actions: tuple[Action, ...]) -> ToolAnnotations:
    """Derive MCP annotations from the action set.

    read-only is claimed only when every action is a read, and destructive
    whenever any action can remove data. Both are deliberately conservative:
    annotations are hints a client may act on, so over-claiming safety is the
    expensive mistake.
    """
    return ToolAnnotations(
        title=title,
        readOnlyHint=all(action.read for action in actions),
        destructiveHint=any(action.destructive for action in actions),
        idempotentHint=False,
        # Nearly every action acts only on the caller's own Plane workspace
        # through the authenticated API -- a closed domain. An action reaching
        # beyond it (fetching a caller-supplied URL, say) declares open_world.
        openWorldHint=any(action.open_world for action in actions),
    )


def action_names(actions: tuple[Action, ...]) -> tuple[str, ...]:
    return tuple(action.name for action in actions)
