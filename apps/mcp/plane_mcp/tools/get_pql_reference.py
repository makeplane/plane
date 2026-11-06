"""Plane Query Language syntax reference.

Kept one-to-one rather than consolidated: a single read with no siblings, so an
action parameter would add a wrapper and save nothing.
"""

from __future__ import annotations

from typing import Literal

from fastmcp import FastMCP
from mcp.types import ToolAnnotations

from plane_mcp.pql_reference import PQL_FIELD_DESCRIPTION, PQL_FULL_REFERENCE
from plane_mcp.toolkit import Action, build_description

NAME = "get_pql_reference"
TITLE = "PQL reference"

ACTIONS = (Action("read", optional=("detail",), note="this tool has no action parameter", read=True),)

FOOTER = (
    "detail 'full' gives operators, functions, common mistakes and worked examples; "
    "'brief' gives the compact field and operator quick reference."
)

LEGACY: dict[str, str] = {}  # name is unchanged, so no alias is needed


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description(
            "Plane Query Language (PQL) syntax reference. Call this before composing a `pql` "
            "filter for the workitem list, list_archived or count actions.",
            ACTIONS,
            FOOTER,
        ),
        annotations=ToolAnnotations(
            title=TITLE,
            readOnlyHint=True,
            destructiveHint=False,
            idempotentHint=True,
            openWorldHint=False,
        ),
    )
    def get_pql_reference(detail: Literal["brief", "full"] = "full") -> dict:
        if detail == "brief":
            return {"detail": "brief", "reference": PQL_FIELD_DESCRIPTION}
        return {"detail": "full", "reference": PQL_FULL_REFERENCE}
