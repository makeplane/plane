# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Catalog of actions counted by the project activity heatmap. Keys are stored on ActivityEvent and in
# ProjectActivitySettings.kinds; the web app translates them (namespace "liviere", "activity.kinds.<key>").

ISSUE_CREATED = "issue.created"
ISSUE_STATE = "issue.state"
ISSUE_PROPERTY = "issue.property"
ISSUE_DESCRIPTION = "issue.description"
ISSUE_COMMENT = "issue.comment"
ISSUE_LINK = "issue.link"
ISSUE_RELATION = "issue.relation"
ISSUE_CYCLE_MODULE = "issue.cycle_module"
ISSUE_ARCHIVE = "issue.archive"
ISSUE_INTAKE = "issue.intake"
ISSUE_REACTION = "issue.reaction"
PAGE_CREATED = "page.created"
PAGE_EDITED = "page.edited"
PAGE_RENAMED = "page.renamed"
PAGE_ARCHIVE = "page.archive"
CYCLE_CHANGED = "cycle.changed"
MODULE_CHANGED = "module.changed"
VIEW_CHANGED = "view.changed"
LOG_ENTRY = "log.entry"

# (group, [(key, counted by default)])
CATALOG = [
    (
        "issues",
        [
            (ISSUE_CREATED, True),
            (ISSUE_STATE, True),
            (ISSUE_PROPERTY, True),
            (ISSUE_DESCRIPTION, True),
            (ISSUE_COMMENT, True),
            (ISSUE_LINK, True),
            (ISSUE_RELATION, True),
            (ISSUE_CYCLE_MODULE, True),
            (ISSUE_ARCHIVE, True),
            (ISSUE_INTAKE, True),
            (ISSUE_REACTION, False),
        ],
    ),
    ("pages", [(PAGE_CREATED, True), (PAGE_EDITED, True), (PAGE_RENAMED, True), (PAGE_ARCHIVE, True)]),
    ("cycles_modules", [(CYCLE_CHANGED, True), (MODULE_CHANGED, True)]),
    ("views", [(VIEW_CHANGED, False)]),
    ("log", [(LOG_ENTRY, True)]),
]

ALL_KINDS = [key for _, kinds in CATALOG for key, _ in kinds]
DEFAULT_KINDS = [key for _, kinds in CATALOG for key, default in kinds if default]

# IssueActivity.field values of issue relations (see plane/utils/issue_relation_mapper.py)
RELATION_FIELDS = {
    "relates_to",
    "duplicate",
    "blocked_by",
    "blocking",
    "start_before",
    "start_after",
    "finish_before",
    "finish_after",
    "implements",
    "implemented_by",
}

ISSUE_FIELD_KINDS = {
    "state": ISSUE_STATE,
    "description": ISSUE_DESCRIPTION,
    "comment": ISSUE_COMMENT,
    "link": ISSUE_LINK,
    "attachment": ISSUE_LINK,
    "cycles": ISSUE_CYCLE_MODULE,
    "modules": ISSUE_CYCLE_MODULE,
    "archived_at": ISSUE_ARCHIVE,
    "issue": ISSUE_ARCHIVE,  # verb "deleted": the work item was deleted
    "intake": ISSUE_INTAKE,
    "reaction": ISSUE_REACTION,
    "vote": ISSUE_REACTION,
}


def kind_for_issue_activity(field, verb):
    """Maps an IssueActivity row (plane/bgtasks/issue_activities_task.py) to a catalog key, None to skip."""
    if field == "draft":
        return None
    if not field:
        return ISSUE_CREATED if verb == "created" else None
    if field in ISSUE_FIELD_KINDS:
        return ISSUE_FIELD_KINDS[field]
    if field in RELATION_FIELDS:
        return ISSUE_RELATION
    # name, priority, dates, labels, assignees, estimate, parent (sub-issues) and anything new
    return ISSUE_PROPERTY


def parse_kinds(value):
    """Comma-separated or list of keys -> known keys in catalog order; None when nothing is given."""
    if value is None:
        return None
    items = value.split(",") if isinstance(value, str) else value
    requested = {item.strip() for item in items if item and item.strip()}
    unknown = requested - set(ALL_KINDS)
    if unknown:
        raise ValueError(f"Unknown activity kinds: {', '.join(sorted(unknown))}")
    return [key for key in ALL_KINDS if key in requested]
