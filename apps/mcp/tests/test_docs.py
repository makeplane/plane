"""The README tool table must match the catalogue it documents.

A contributor adding a tool has no reason to remember two READMEs, so the table
rots silently and the first person to notice is a user following it. It is checked
against the live surface here instead.
"""

from __future__ import annotations

import asyncio
import os
import re
from pathlib import Path

import pytest
from fastmcp import FastMCP

os.environ.setdefault("PLANE_API_KEY", "test")
os.environ.setdefault("PLANE_WORKSPACE_SLUG", "test")

ROOT = Path(__file__).resolve().parent.parent
BACKTICKED = re.compile(r"`([a-z_]+)`")


@pytest.fixture(scope="module")
def surface():
    """The catalogue and its registered tool names."""
    from plane_mcp.tools import register_tools
    from plane_mcp.tools.registry import RESOURCES

    mcp = FastMCP("docs")
    register_tools(mcp, legacy_names=False)
    tools = asyncio.new_event_loop().run_until_complete(mcp.list_tools())
    return RESOURCES, {tool.name for tool in tools}


def test_the_surface_readme_lists_every_tool_and_action(surface):
    from plane_mcp.toolkit.spec import action_names

    resources, registered = surface
    text = (ROOT / "plane_mcp/tools/README.md").read_text()
    rows = dict(re.findall(r"^\| `([a-z_]+)` \| (.+?) \|$", text, re.M))

    assert not sorted(registered - set(rows)), "a tool is missing from the README table"
    assert not sorted(set(rows) - registered), "the README table names a tool that does not exist"

    for mod in resources:
        actual = set(action_names(mod.ACTIONS))
        if len(actual) == 1:
            continue  # a tool with no action parameter; the row says so in prose
        documented = set(BACKTICKED.findall(rows[mod.NAME]))
        assert documented == actual, f"{mod.NAME}: README lists {sorted(documented)}, ACTIONS has {sorted(actual)}"


def test_the_main_readme_states_the_real_tool_count(surface):
    from plane_mcp.toolkit.spec import action_names

    resources, registered = surface
    text = (ROOT / "README.md").read_text()
    actions = sum(len(action_names(mod.ACTIONS)) for mod in resources)
    assert f"**{len(registered)} tools**" in text, f"the README does not say {len(registered)} tools"
    assert f"{actions} operations" in text, f"the README does not say {actions} operations"


def test_the_documented_env_vars_exist():
    """Every variable the README promises is one the code reads.

    The migration table is excluded: it lists the *Node.js* server's variable
    names so a reader can map them across, and this code never reads those.
    """
    readme = (ROOT / "README.md").read_text().split("## Migrating from the Node.js server")[0]
    documented = set(re.findall(r"`(PLANE_[A-Z_]+|MCP_[A-Z_]+|REDIS_[A-Z_]+|LOG_USER_INFO)`", readme))
    source = "\n".join(
        path.read_text() for path in (ROOT / "plane_mcp").rglob("*.py") if "__pycache__" not in str(path)
    )
    # PLANE_OAUTH_PROVIDER_* is documented as a family; the code reads the members.
    unread = sorted(name for name in documented if name not in source and not name.endswith("_"))
    assert not unread, f"the README documents variables the code never reads: {unread}"


def test_no_document_offers_a_tool_surface_choice():
    """There is one surface. A stale mention of the removed selector would misconfigure a user."""
    stale = []
    # Nexus: CLAUDE.md is not vendored (the monorepo ignores CLAUDE.md files).
    for name in ("README.md", "plane_mcp/tools/README.md"):
        text = (ROOT / name).read_text()
        if "PLANE_MCP_TOOLS_VERSION" in text:
            stale.append(f"{name} still documents PLANE_MCP_TOOLS_VERSION")
    assert not stale, "\n  ".join(stale)
