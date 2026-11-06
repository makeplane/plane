"""The advertised catalogue: which resources exist, and in what order.

Previously this scanned the package with `pkgutil` and kept anything whose
filename did not start with an underscore. That made a helper's *filename*
load-bearing -- name one without the prefix and it was treated as a resource,
failing at startup with a bare `AttributeError` from `mod.register` -- and left
the ordering, which the comment below calls load-bearing, as an unpinned
side effect of `sorted()` over filenames.

Listing them explicitly costs one line per resource and buys a catalogue that is
reviewable in a diff, stable under file renames, and inert in the presence of a
stray module.
"""

from __future__ import annotations

from types import ModuleType

from plane_mcp.tools import (
    collection,
    customer,
    customer_property,
    customer_request,
    cycle,
    get_pql_reference,
    initiative,
    intake,
    label,
    member,
    milestone,
    module,
    page,
    project,
    project_estimate,
    release,
    release_label,
    release_tag,
    state,
    template,
    work_log,
    workitem,
    workitem_activity,
    workitem_attachment,
    workitem_comment,
    workitem_link,
    workitem_property,
    workitem_relation,
    workitem_type,
    workspace,
)

RESOURCES: tuple[ModuleType, ...] = (
    customer,
    customer_property,
    customer_request,
    cycle,
    get_pql_reference,
    initiative,
    intake,
    label,
    member,
    milestone,
    module,
    page,
    project,
    project_estimate,
    release,
    release_label,
    release_tag,
    state,
    work_log,
    workitem,
    workitem_activity,
    workitem_attachment,
    workitem_comment,
    workitem_link,
    workitem_property,
    workitem_relation,
    workitem_type,
    workspace,
    template,
    collection,
)


def action_arguments() -> dict[str, dict[str, frozenset[str]]]:
    """Tool name -> action name -> the arguments that action accepts."""
    return {mod.NAME: {a.name: frozenset(a.requires) | frozenset(a.optional) for a in mod.ACTIONS} for mod in RESOURCES}


def alias_table() -> dict[str, tuple[str, str]]:
    """Legacy tool name -> (resource tool name, action). Raises on a collision."""
    table: dict[str, tuple[str, str]] = {}
    seen: dict[tuple[str, str], str] = {}
    for mod in RESOURCES:
        for legacy, action in mod.LEGACY.items():
            if legacy in table:
                raise ValueError(f"duplicate legacy tool name: {legacy}")
            target = (mod.NAME, action)
            if target in seen:
                raise ValueError(f"{legacy} and {seen[target]} both map to {target}")
            table[legacy] = target
            seen[target] = legacy
    return table


def unmapped_table() -> dict[str, str]:
    """Retired tool name -> why it has no alias.

    An alias renames a tool; it cannot reshape one. Where a retired tool encoded
    its action in a *parameter* (`manage_project_archive(archive=False)`), no
    single (tool, action) pair reproduces it, so it is declared here instead of
    being aliased to whichever half looks closest.
    """
    table: dict[str, str] = {}
    for mod in RESOURCES:
        for legacy, reason in getattr(mod, "LEGACY_UNMAPPED", {}).items():
            if legacy in table:
                raise ValueError(f"duplicate unmapped legacy tool name: {legacy}")
            if not reason:
                raise ValueError(f"{legacy} is declared unmapped with no reason")
            table[legacy] = reason
    return table
