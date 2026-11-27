# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Work items a decision points to.

Identifiers ("DEMO-3") are resolved among the work items of the workspace the writer may see, archived ones
included (projects with `archive_in` archive closed work items after a month, and imported decisions mostly
point to old ones): `searchable_issues` of the content search, without drafts, triage items, deleted items and
projects that are archived. Reading checks visibility again for the reader: everybody gets the identifier, only
a reader who may see the work item gets its title, so a decision never shows the title of a work item of a
project the reader is not a member of. A work item deleted after it was linked is not visible to anybody.
"""

from django.db.models import Q

from plane.liviere.search.queries import searchable_issues
from plane.liviere.decisions.rules import ISSUE_REF


def identifier(issue):
    return f"{issue.project.identifier}-{issue.sequence_id}"


def resolve(slug, user, refs):
    """{ref: Issue} for the identifiers `user` may see; refs not in the result were not found."""
    if not refs:
        return {}
    match = Q()
    for ref in refs:
        project_identifier, sequence = ISSUE_REF.match(ref).groups()
        match |= Q(project__identifier__iexact=project_identifier, sequence_id=int(sequence))
    found = {}
    for issue in searchable_issues(slug, user).filter(match).select_related("project"):
        found[identifier(issue).upper()] = issue
    return {ref: found[ref] for ref in refs if ref in found}


def visible_ids(slug, user, issue_ids):
    if not issue_ids:
        return set()
    return set(searchable_issues(slug, user).filter(id__in=list(issue_ids)).values_list("id", flat=True))


def serialize_link(issue, visible):
    data = {"identifier": identifier(issue), "visible": visible}
    if visible:
        data.update(id=str(issue.id), name=issue.name, archived=issue.archived_at is not None)
    return data
