"""Shared building blocks for Plane MCP tool surfaces.

These were previously underscore-prefixed modules inside `tools/`, where the
leading underscore was not a privacy marker at all -- it was the filter the
module-discovery loop used to tell helpers apart from resources. That made the
package's most widely used API (`spec`, imported by all 28 resource modules)
look private, and made the naming of an ordinary helper file load-bearing.

Nothing here knows which catalogue is calling it, so a resource package can be
renamed without these having to move with it.

The modules split by *when* they act:

    spec        declaration time -- describe a resource's actions
    runtime     call time -- validate parameters, shape SDK payloads
    mentions    call time -- render `@[uuid]` into Plane's mention markup, and back
    paging      response time -- Plane's pagination envelope and PQL failures
    governance  refusal time -- recognise a workspace-owned resource, read its flag
    transforms  listing time -- reshape the advertised catalogue

Names are re-exported here so a resource module needs one import, not four. The
submodules stay importable for callers that want to be explicit.
"""

from __future__ import annotations

from plane_mcp.toolkit.governance import (
    WORK_ITEM_TYPES,
    migration_in_progress,
    plan_gated,
    plan_required,
    project_owns,
    scoped,
    workspace_owns,
    workspace_owns_resource,
)
from plane_mcp.toolkit.mentions import (
    MENTION_TOKEN,
    mention_user_ids,
    project_mention_error,
    render_mentions,
    tokenize_mentions,
    unmentionable,
)
from plane_mcp.toolkit.paging import dump_results, envelope, pql_failure, workitem_page
from plane_mcp.toolkit.runtime import (
    as_params,
    coerce_list,
    ids_of,
    missing,
    needs,
    one_of,
    opt,
    page_params,
    require,
    rich_text,
)
from plane_mcp.toolkit.spec import (
    Action,
    action_names,
    build_annotations,
    build_description,
)
from plane_mcp.toolkit.transforms import StripOutputSchemas

__all__ = [
    "MENTION_TOKEN",
    "WORK_ITEM_TYPES",
    "Action",
    "StripOutputSchemas",
    "action_names",
    "as_params",
    "build_annotations",
    "build_description",
    "coerce_list",
    "dump_results",
    "envelope",
    "ids_of",
    "mention_user_ids",
    "migration_in_progress",
    "missing",
    "needs",
    "one_of",
    "opt",
    "rich_text",
    "page_params",
    "plan_gated",
    "project_mention_error",
    "plan_required",
    "project_owns",
    "pql_failure",
    "render_mentions",
    "require",
    "scoped",
    "tokenize_mentions",
    "unmentionable",
    "workspace_owns",
    "workspace_owns_resource",
    "workitem_page",
]
