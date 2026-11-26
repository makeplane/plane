# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Plain (non-semantic) content search: a phrase in the title, the description or a comment of a work item.

Matching is a case-insensitive substring (`icontains`, i.e. `UPPER(...) LIKE UPPER(...)` in Postgres) on
`Issue.name`, `Issue.description_stripped` and `IssueComment.comment_stripped`, so a word stem also finds its
inflected forms. No index: a fixed number of queries whatever the number of matches (see LIVIERE.md).
"""

import re
import uuid

from django.db.models import Case, Count, Exists, IntegerField, Max, OuterRef, Q, When

from plane.api.views.issue import visible_issue_q
from plane.db.models import Issue, IssueComment, Project
from plane.db.models.state import StateGroup

MIN_QUERY_LENGTH = 3
MAX_QUERY_LENGTH = 200
DEFAULT_LIMIT = 20
MAX_LIMIT = 100
SNIPPET_RADIUS = 80

TITLE, DESCRIPTION, COMMENT = "title", "description", "comment"
RANKS = {0: TITLE, 1: DESCRIPTION, 2: COMMENT}


class SearchError(ValueError):
    """A parameter the client got wrong (400)."""


def parse_params(data):
    """`q`, `project`, `limit` and `archived` of a request body, validated."""
    if not isinstance(data, dict):
        raise SearchError("The body must be a JSON object")

    q = data.get("q")
    if not isinstance(q, str):
        raise SearchError("q is required")
    q = q.strip()
    if len(q) < MIN_QUERY_LENGTH:
        raise SearchError(f"q must be at least {MIN_QUERY_LENGTH} characters")
    if len(q) > MAX_QUERY_LENGTH:
        raise SearchError(f"q must be at most {MAX_QUERY_LENGTH} characters")

    project = data.get("project")
    if project is not None and not isinstance(project, str):
        raise SearchError("project must be a project identifier or id")
    project = (project or "").strip() or None

    limit = data.get("limit", DEFAULT_LIMIT)
    if isinstance(limit, str) and limit.strip().isdigit():
        limit = int(limit)
    if isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= MAX_LIMIT:
        raise SearchError(f"limit must be a whole number from 1 to {MAX_LIMIT}")

    archived = data.get("archived", True)
    if not isinstance(archived, bool):
        raise SearchError("archived must be true or false")

    return {"q": q, "project": project, "limit": limit, "archived": archived}


def accessible_project(slug, user, ref):
    """A project of the workspace by identifier (any case) or id, not archived, with `user` an active member."""
    projects = Project.objects.filter(
        workspace__slug=slug,
        archived_at__isnull=True,
        project_projectmember__member=user,
        project_projectmember__is_active=True,
    )
    try:
        match = Q(pk=uuid.UUID(ref))
    except ValueError:
        match = Q(identifier__iexact=ref)
    return projects.filter(match).first()


def searchable_issues(slug, user, project=None, include_archived=True):
    """Work items `user` may view, as in the work item list of the API, archived ones included by default.

    The same conditions as `Issue.issue_objects` (plane/db/models/issue.py, IssueManager), spelled out here so
    that one of them can be left out: deleted work items (`Issue.objects`), triage/intake work items, drafts and
    work items of archived projects never match; archived work items match unless `include_archived` is False
    (closed work items go to the archive by themselves after a month when a project sets `archive_in`, and old
    decisions are what this search is for). Visibility is `visible_issue_q` of the API (members above guests,
    guests of projects sharing all features, restricted guests only their own work items), as an EXISTS per row
    like the upstream IssueSearchEndpoint, so the membership join cannot duplicate rows.
    """
    issues = (
        Issue.objects.filter(
            workspace__slug=slug,
            project__archived_at__isnull=True,
            project__deleted_at__isnull=True,
        )
        .exclude(state__group=StateGroup.TRIAGE.value)
        .exclude(is_draft=True)
    )
    if not include_archived:
        issues = issues.filter(archived_at__isnull=True)
    if project is not None:
        issues = issues.filter(project_id=project.id)
    visible = Issue.objects.filter(id=OuterRef("id")).filter(visible_issue_q(user)).values("id")
    return issues.filter(Exists(visible))


def snippet(text, q, radius=SNIPPET_RADIUS):
    """`(fragment, [start, end])`: whitespace collapsed, `radius` characters around the first match, "…" where
    the text was cut. Without a match in Python (Unicode case rules differ from the database) the start of the
    text and `None`. `radius=None` keeps the whole text."""
    text = " ".join((text or "").split())
    phrase = " ".join(q.split())
    found = re.search(re.escape(phrase), text, re.IGNORECASE) if phrase else None
    if found is None:
        limit = 2 * (radius if radius is not None else len(text))
        return (text if len(text) <= limit else text[:limit].rstrip() + "…"), None
    if radius is None:
        return text, [found.start(), found.end()]

    start = max(0, found.start() - radius)
    end = min(len(text), found.end() + radius)
    before = text[start : found.start()].lstrip()
    after = text[found.end() : end].rstrip()
    prefix = "…" if start > 0 else ""
    suffix = "…" if end < len(text) else ""
    fragment = prefix + before + text[found.start() : found.end()] + after + suffix
    highlight_start = len(prefix) + len(before)
    return fragment, [highlight_start, highlight_start + found.end() - found.start()]


def search(slug, user, q, project=None, limit=DEFAULT_LIMIT, include_archived=True):
    """One result per work item, best place first (title, description, comment), then newest first."""
    issues = searchable_issues(slug, user, project=project, include_archived=include_archived)
    in_title = Q(name__icontains=q)

    # 1. Work items matching in the title or the description: ids only, no text
    hits = {}
    for issue_id, rank, updated_at in (
        issues.filter(in_title | Q(description_stripped__icontains=q))
        .annotate(rank=Case(When(in_title, then=0), default=1, output_field=IntegerField()))
        .values_list("id", "rank", "updated_at")
        .order_by()
    ):
        hits[issue_id] = {"rank": rank, "at": updated_at, "comments": 0}

    # 2. Matching comments of the searchable work items, counted per work item (the manager drops deleted ones)
    for row in (
        IssueComment.objects.filter(issue_id__in=issues.values("id"), comment_stripped__icontains=q)
        .values("issue_id")
        .annotate(matches=Count("id"), latest=Max("created_at"))
        .order_by()
    ):
        hit = hits.setdefault(row["issue_id"], {"rank": 2, "at": row["latest"]})
        hit["comments"] = row["matches"]

    ordered = sorted(hits.items(), key=lambda item: (item[1]["rank"], -item[1]["at"].timestamp(), str(item[0])))
    page = ordered[:limit]
    page_ids = [issue_id for issue_id, _ in page]

    # 3. Details of the work items shown
    details = {
        row["id"]: row
        for row in Issue.objects.filter(id__in=page_ids).values(
            "id",
            "name",
            "sequence_id",
            "project_id",
            "project__identifier",
            "state__name",
            "state__group",
            "description_stripped",
            "archived_at",
            "updated_at",
        )
    }

    # 4. The newest matching comment of the work items that match only in comments
    comment_only = [issue_id for issue_id, hit in page if hit["rank"] == 2]
    comments = {
        row["issue_id"]: row
        for row in IssueComment.objects.filter(issue_id__in=comment_only, comment_stripped__icontains=q)
        .order_by("issue_id", "-created_at")
        .distinct("issue_id")
        .values("id", "issue_id", "created_at", "comment_stripped")
    }

    results = []
    for issue_id, hit in page:
        # A work item or comment deleted between the queries is left out
        issue = details.get(issue_id)
        if issue is None or (hit["rank"] == 2 and issue_id not in comments):
            continue
        match = RANKS[hit["rank"]]
        result = {
            "id": issue_id,
            "identifier": f"{issue['project__identifier']}-{issue['sequence_id']}",
            "project_id": issue["project_id"],
            "project_identifier": issue["project__identifier"],
            "sequence_id": issue["sequence_id"],
            "name": issue["name"],
            "state": issue["state__name"],
            "state_group": issue["state__group"],
            "archived": issue["archived_at"] is not None,
            "archived_at": issue["archived_at"],
            "updated_at": issue["updated_at"],
            "match": match,
            "comment_matches": hit["comments"],
        }
        if match == TITLE:
            result["snippet"], result["highlight"] = snippet(issue["name"], q, radius=None)
        elif match == DESCRIPTION:
            result["snippet"], result["highlight"] = snippet(issue["description_stripped"], q)
        else:
            comment = comments[issue_id]
            result["snippet"], result["highlight"] = snippet(comment["comment_stripped"], q)
            result["comment_id"] = comment["id"]
            result["comment_created_at"] = comment["created_at"]
        results.append(result)

    return {
        "query": q,
        "project": project.identifier if project is not None else None,
        "limit": limit,
        "archived": include_archived,
        "total": len(ordered),
        "has_more": len(ordered) > limit,
        "results": results,
    }
