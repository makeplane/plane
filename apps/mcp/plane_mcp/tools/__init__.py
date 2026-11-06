"""Consolidated tool surface: one action-dispatch tool per Plane resource."""

from __future__ import annotations

from fastmcp import FastMCP
from fastmcp.utilities.logging import get_logger

from plane_mcp.toolkit import StripOutputSchemas
from plane_mcp.tools.legacy import LegacyNames

logger = get_logger(__name__)


def register_tools(mcp: FastMCP, *, legacy_names: bool = True) -> int:
    """Register every resource tool. Returns the number advertised."""
    # Imported here, not at module scope: `registry` imports the resource modules
    # out of this package, so a top-level import would run while this module is
    # still initialising.
    from plane_mcp.tools.registry import RESOURCES, alias_table

    for mod in RESOURCES:
        mod.register(mcp)

    mcp.add_transform(StripOutputSchemas())
    if legacy_names:
        mcp.add_transform(LegacyNames(alias_table()))

    # Several clients cap how many tools they load and drop the rest silently.
    # One number in the log lets an operator compare against their client's limit.
    logger.info("Plane MCP: advertising %d tools", len(RESOURCES))
    return len(RESOURCES)
