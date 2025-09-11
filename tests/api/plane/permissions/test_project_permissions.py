"""
Tests for Project permission classes.

Detected test stack: pytest (with pytest-django if available) + unittest.mock.
We unit-test has_permission by mocking ORM lookups to avoid DB I/O.
"""

from types import SimpleNamespace
from unittest.mock import MagicMock, patch
import pytest

# Helpers to build mock QuerySet with .exists() and chained .filter().exists()
class QS:
    def __init__(self, exists=False, admin_exists=False):
        # exists => result of qs.exists()
        # admin_exists => result of qs.filter(role=ADMIN).exists()
        self._exists = exists
        self._admin_exists = admin_exists

    def exists(self):
        return self._exists

    def filter(self, *args, **kwargs):
        # When specifically looking for ADMIN, return qs whose exists() reflects admin_exists
        if "role" in kwargs:
            return QS(exists=self._admin_exists, admin_exists=self._admin_exists)
        return self

def make_request(user_is_anonymous=False, method="GET"):
    user = SimpleNamespace(is_anonymous=user_is_anonymous)
    return SimpleNamespace(user=user, method=method)

def make_view(workspace_slug="ws-1", project_id=111, project_identifier=None):
    ns = SimpleNamespace(workspace_slug=workspace_slug, project_id=project_id)
    if project_identifier is not None:
        ns.project_identifier = project_identifier
    return ns

# Import under test
from rest_framework.permissions import SAFE_METHODS  # sanity
# Attempt both common module paths; adjust if project structure differs.
try:
    from plane.api.permissions.project import (
        ProjectBasePermission,
        ProjectMemberPermission,
        ProjectEntityPermission,
        ProjectLitePermission,
    )
except Exception:
    from plane.permissions.project import (  # fallback
        ProjectBasePermission,
        ProjectMemberPermission,
        ProjectEntityPermission,
        ProjectLitePermission,
    )

@pytest.mark.parametrize("perm_cls", [
    ProjectBasePermission,
    ProjectMemberPermission,
    ProjectEntityPermission,
    ProjectLitePermission,
])
def test_anonymous_user_denied(perm_cls):
    perm = perm_cls()
    req = make_request(user_is_anonymous=True, method="GET")
    view = make_view()
    assert perm.has_permission(req, view) is False

class TestProjectBasePermission:
    @patch("plane.db.models.WorkspaceMember")
    def test_safe_methods_require_active_workspace_membership(self, WM):
        # WorkspaceMember.objects.filter(...).exists() -> True yields allowed
        WM.objects.filter.return_value = QS(exists=True)
        perm = ProjectBasePermission()
        req = make_request(method="GET")
        assert "GET" in SAFE_METHODS
        assert perm.has_permission(req, make_view()) is True

        # Not a member -> denied
        WM.objects.filter.return_value = QS(exists=False)
        assert perm.has_permission(req, make_view()) is False

    @patch("plane.db.models.WorkspaceMember")
    def test_post_requires_workspace_admin_or_member(self, WM):
        # Model filter for role__in returns .exists()
        WM.objects.filter.return_value = QS(exists=True)
        perm = ProjectBasePermission()
        req = make_request(method="POST")
        assert perm.has_permission(req, make_view()) is True

        WM.objects.filter.return_value = QS(exists=False)
        assert perm.has_permission(req, make_view()) is False

    @patch("plane.db.models.WorkspaceMember")
    @patch("plane.db.models.ProjectMember")
    def test_non_safe_non_post_admin_project_member_allowed(self, PM, WM):
        # project_member_qs.filter(role=ADMIN).exists() -> True
        PM.objects.filter.return_value = QS(exists=True, admin_exists=True)
        perm = ProjectBasePermission()
        req = make_request(method="PATCH")
        assert perm.has_permission(req, make_view()) is True
        # Ensure WorkspaceMember not consulted in admin short-circuit
        WM.objects.filter.assert_not_called()

    @patch("plane.db.models.WorkspaceMember")
    @patch("plane.db.models.ProjectMember")
    def test_non_safe_non_post_member_plus_workspace_admin_allowed(self, PM, WM):
        # Not a project admin, but is a project member AND workspace admin
        PM.objects.filter.return_value = QS(exists=True, admin_exists=False)
        WM.objects.filter.return_value = QS(exists=True)  # workspace admin exists
        perm = ProjectBasePermission()
        req = make_request(method="PUT")
        assert perm.has_permission(req, make_view()) is True

    @patch("plane.db.models.WorkspaceMember")
    @patch("plane.db.models.ProjectMember")
    def test_non_safe_non_post_member_without_workspace_admin_denied(self, PM, WM):
        PM.objects.filter.return_value = QS(exists=True, admin_exists=False)
        WM.objects.filter.return_value = QS(exists=False)  # not workspace admin
        perm = ProjectBasePermission()
        req = make_request(method="DELETE")
        assert perm.has_permission(req, make_view()) is False

    @patch("plane.db.models.WorkspaceMember")
    @patch("plane.db.models.ProjectMember")
    def test_non_safe_non_post_non_member_denied(self, PM, WM):
        PM.objects.filter.return_value = QS(exists=False, admin_exists=False)
        WM.objects.filter.return_value = QS(exists=True)  # irrelevant
        perm = ProjectBasePermission()
        req = make_request(method="PATCH")
        assert perm.has_permission(req, make_view()) is False

class TestProjectMemberPermission:
    @patch("plane.db.models.ProjectMember")
    def test_safe_methods_require_project_membership(self, PM):
        PM.objects.filter.return_value = QS(exists=True)
        perm = ProjectMemberPermission()
        assert perm.has_permission(make_request(method="GET"), make_view()) is True
        PM.objects.filter.return_value = QS(exists=False)
        assert perm.has_permission(make_request(method="GET"), make_view()) is False

    @patch("plane.db.models.WorkspaceMember")
    def test_post_requires_workspace_admin_or_member(self, WM):
        WM.objects.filter.return_value = QS(exists=True)
        perm = ProjectMemberPermission()
        assert perm.has_permission(make_request(method="POST"), make_view()) is True
        WM.objects.filter.return_value = QS(exists=False)
        assert perm.has_permission(make_request(method="POST"), make_view()) is False

    @patch("plane.db.models.ProjectMember")
    def test_update_requires_project_admin_or_member(self, PM):
        PM.objects.filter.return_value = QS(exists=True)
        perm = ProjectMemberPermission()
        assert perm.has_permission(make_request(method="PATCH"), make_view()) is True
        PM.objects.filter.return_value = QS(exists=False)
        assert perm.has_permission(make_request(method="PATCH"), make_view()) is False

class TestProjectEntityPermission:
    @patch("plane.db.models.ProjectMember")
    def test_safe_with_project_identifier_checks_membership_by_identifier(self, PM):
        PM.objects.filter.return_value = QS(exists=True)
        perm = ProjectEntityPermission()
        view = make_view(project_identifier="PROJ-1")
        assert perm.has_permission(make_request(method="GET"), view) is True
        PM.objects.filter.return_value = QS(exists=False)
        assert perm.has_permission(make_request(method="GET"), view) is False

    @patch("plane.db.models.ProjectMember")
    def test_safe_without_identifier_checks_by_project_id(self, PM):
        PM.objects.filter.return_value = QS(exists=True)
        perm = ProjectEntityPermission()
        view = make_view(project_identifier=None)
        assert perm.has_permission(make_request(method="GET"), view) is True
        PM.objects.filter.return_value = QS(exists=False)
        assert perm.has_permission(make_request(method="GET"), view) is False

    @patch("plane.db.models.ProjectMember")
    def test_mutating_requires_member_or_admin(self, PM):
        PM.objects.filter.return_value = QS(exists=True)
        perm = ProjectEntityPermission()
        assert perm.has_permission(make_request(method="POST"), make_view()) is True
        PM.objects.filter.return_value = QS(exists=False)
        assert perm.has_permission(make_request(method="POST"), make_view()) is False

class TestProjectLitePermission:
    @patch("plane.db.models.ProjectMember")
    def test_requires_active_project_membership(self, PM):
        PM.objects.filter.return_value = QS(exists=True)
        perm = ProjectLitePermission()
        assert perm.has_permission(make_request(method="HEAD"), make_view()) is True
        PM.objects.filter.return_value = QS(exists=False)
        assert perm.has_permission(make_request(method="HEAD"), make_view()) is False