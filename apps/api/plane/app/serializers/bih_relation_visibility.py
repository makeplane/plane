# BIH: which related issues a requester may see in full (name, code, dates, state...).
# A related issue the requester cannot read is reduced to its id, project and relation type.

from crum import get_current_request
from django.db.models import Q

from plane.db.models import ProjectMember
from plane.db.models.project import ROLE

SPARSE_FIELDS = ("id", "project_id", "relation_type")


def project_access(request):
    """{project_id: (role, guest_view_all_features)} for the requester's active memberships of live projects."""
    user = getattr(request, "user", None)
    if user is None or not getattr(user, "is_authenticated", False):
        return {}
    cached = getattr(request, "_bih_project_access", None)
    if cached is None:
        cached = {
            str(project_id): (role, guest_view_all)
            for project_id, role, guest_view_all in ProjectMember.objects.filter(
                member=user, is_active=True, project__deleted_at__isnull=True
            ).values_list("project_id", "role", "project__guest_view_all_features")
        }
        request._bih_project_access = cached
    return cached


def _sees_all(entry):
    role, guest_view_all = entry
    return role > ROLE.GUEST.value or bool(guest_view_all)


def can_see_issue(access, user_id, issue):
    """Same rule as the project issue list: members see all; a Guest sees all only when the project allows it."""
    entry = access.get(str(issue.project_id))
    return entry is not None and (_sees_all(entry) or issue.created_by_id == user_id)


def current_visibility():
    """(access, user_id) of the current request; empty access (everything hidden) outside a request."""
    request = get_current_request()
    user = getattr(request, "user", None)
    if request is None or user is None:
        return {}, None
    return project_access(request), getattr(user, "id", None)


def readable_issues_q(access, user_id):
    """Q for Issue rows the requester may read; the queryset twin of can_see_issue."""
    full = [pid for pid, entry in access.items() if _sees_all(entry)]
    restricted = [pid for pid in access if pid not in full]
    return Q(project_id__in=full) | Q(project_id__in=restricted, created_by_id=user_id)


def hide_unreadable_items(items):
    """Reduce serialized relation items of unreadable issues to SPARSE_FIELDS, using only the data and the cached access.

    Only a Guest of a project that hides others' issues costs one extra query (the Guest's own issues).
    """
    access, user_id = current_visibility()
    restricted = [
        str(item["id"])
        for item in items
        if (entry := access.get(str(item["project_id"]))) is not None and not _sees_all(entry)
    ]
    own = set()
    if restricted:
        from plane.db.models import Issue

        own = {
            str(pk)
            for pk in Issue.issue_objects.filter(id__in=restricted, created_by_id=user_id).values_list("id", flat=True)
        }
    result = []
    for item in items:
        entry = access.get(str(item["project_id"]))
        readable = entry is not None and (_sees_all(entry) or str(item["id"]) in own)
        result.append(item if readable else {key: item[key] for key in SPARSE_FIELDS})
    return result


RELATION_ACTIVITY_FIELDS = {
    "blocking", "blocked_by", "duplicate", "relates_to", "start_before", "start_after",
    "finish_before", "finish_after", "implements", "implemented_by",
}


def hide_unreadable_activity(rows):
    """Blank the issue code in relation history rows whose other issue the requester cannot read."""
    relation_rows = [row for row in rows if row.get("field") in RELATION_ACTIVITY_FIELDS and row.get("old_identifier")]
    if not relation_rows:
        return rows
    from plane.db.models import Issue

    ids = {str(row["old_identifier"]) for row in relation_rows}
    readable = {
        str(pk)
        for pk in Issue.issue_objects.filter(id__in=ids)
        .filter(readable_issues_q(*current_visibility()))
        .values_list("id", flat=True)
    }
    for row in relation_rows:
        if str(row["old_identifier"]) not in readable:
            row["old_value"] = row["new_value"] = ""
    return rows


def sparse_relation(issue, relation_type):
    return {"id": issue.id, "project_id": issue.project_id, "relation_type": relation_type}
