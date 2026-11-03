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


def can_see_issue(access, user_id, issue):
    """Same rule as the project issue list: members see all; a Guest sees all only when the project allows it."""
    entry = access.get(str(issue.project_id))
    if entry is None:
        return False
    role, guest_view_all = entry
    return role > ROLE.GUEST.value or bool(guest_view_all) or issue.created_by_id == user_id


def current_visibility():
    """(access, user_id) of the current request; empty access (everything hidden) outside a request."""
    request = get_current_request()
    user = getattr(request, "user", None)
    if request is None or user is None:
        return {}, None
    return project_access(request), getattr(user, "id", None)


def readable_issues_q(access, user_id):
    """Q for Issue rows the requester may read; the queryset twin of can_see_issue."""
    full = [pid for pid, (role, all_features) in access.items() if role > ROLE.GUEST.value or all_features]
    restricted = [pid for pid in access if pid not in full]
    return Q(project_id__in=full) | Q(project_id__in=restricted, created_by_id=user_id)


def sparse_relation(issue, relation_type):
    return {"id": issue.id, "project_id": issue.project_id, "relation_type": relation_type}
