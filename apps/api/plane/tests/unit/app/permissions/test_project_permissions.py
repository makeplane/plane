"""
Tests for Project permission classes.

Testing library and framework:
- Using pytest with pytest-django style (function tests + monkeypatch), and DRF permission classes are tested as pure functions on has_permission.
- We mock ORM queries (ProjectMember.objects.filter(...).exists() and WorkspaceMember.objects.filter(...).exists()) to isolate logic.

Coverage strategy:
- ProjectBasePermission: anonymous, SAFE methods, POST create, non-safe methods with: project admin, project member + workspace admin, negative cases.
- ProjectMemberPermission: anonymous, SAFE methods, POST, non-safe update requiring role in [ADMIN, MEMBER].
- ProjectEntityPermission: project_identifier path (SAFE), project_id path (SAFE), non-safe requiring role in [ADMIN, MEMBER].
- ProjectLitePermission: membership present/absent.
"""

import types
import pytest
from rest_framework.permissions import SAFE_METHODS
from apps.api.plane.tests.unit.app.permissions import test_project_permissions as _self  # self-ref for context

# Import permission classes under test
from plane.tests.unit.app.permissions.test_project_permissions import (  # type: ignore # When running in isolation, path will be local
    ProjectBasePermission,
    ProjectMemberPermission,
    ProjectEntityPermission,
    ProjectLitePermission,
)

# Helpers to build a mock QuerySet-like object with .filter().exists()
class _QS:
    def __init__(self, exists=False):
        self._exists = exists
        self._filters = []

    def filter(self, **kwargs):
        # Record filters to allow chaining assertions if needed
        q = _QS(self._exists)
        q._filters = self._filters + [kwargs]
        return q

    def exists(self):
        return bool(self._exists)

@pytest.fixture
def mock_view():
    v = types.SimpleNamespace()
    v.workspace_slug = "acme"
    v.project_id = 42
    # Optional attribute for ProjectEntityPermission
    v.project_identifier = None
    return v

@pytest.fixture
def user():
    class U:
        is_anonymous = False
    return U()

@pytest.fixture
def anon_user():
    class U:
        is_anonymous = True
    return U()

# Common monkeypatching of models' managers
@pytest.fixture
def mock_models(monkeypatch):
    """
    Provides utilities to control return values of:
      - WorkspaceMember.objects.filter(...).exists()
      - ProjectMember.objects.filter(...).exists()
      - And allows role-specific filters in ProjectMember chain.
    """
    # State toggles configured per-test
    state = {
        "workspace_member_exists": False,
        "project_member_exists": False,
        "project_member_admin_exists": False,  # For ProjectBasePermission admin check
        "workspace_admin_exists": False,       # For combined checks
        "project_member_safe_exists": False,   # For SAFE checks under ProjectEntity/Member
        "project_identifier_safe_exists": False,
        "post_allowed_workspace_roles": False, # For POST paths in Base/Member permissions
    }

    # WorkspaceMember.objects.filter(...).exists()
    class WMObjects:
        def filter(self, **kwargs):
            # POST checks in code gate on role__in [ROLE.ADMIN.value, ROLE.MEMBER.value] and is_active=True
            # Non-POST check for Base SAFE uses membership active; combined admin check uses role=ROLE.ADMIN.value
            # We simulate via flags:
            # - post_allowed_workspace_roles: if True, POST permission path returns True
            # - workspace_member_exists: general SAFE membership
            # - workspace_admin_exists: admin for combined access
            # We'll return corresponding exists based on presence of role filters
            is_post_roles = ("role__in" in kwargs)
            is_admin_role = (kwargs.get("role") is not None)
            if is_post_roles:
                return _QS(state["post_allowed_workspace_roles"])
            if is_admin_role:
                return _QS(state["workspace_admin_exists"])
            return _QS(state["workspace_member_exists"])

    class WorkspaceMemberModel:
        objects = WMObjects()

    # ProjectMember.objects.filter(...).exists()
    class PMObjects:
        def filter(self, **kwargs):
            # If role=ROLE.ADMIN.value present, return admin-specific flag
            if kwargs.get("role") is not None:
                return _QS(state["project_member_admin_exists"])
            # For SAFE in ProjectEntity/Member with identifier or project_id we can toggle with dedicated flags if given
            if "project__identifier" in kwargs:
                return _QS(state["project_identifier_safe_exists"])
            # For non-role filters, default to generic project member existence
            return _QS(state["project_member_exists"])

    class ProjectMemberModel:
        objects = PMObjects()

    import builtins

    # Monkeypatch import path used in permission module
    import plane.db.models as models_pkg
    monkeypatch.setattr(models_pkg, "WorkspaceMember", WorkspaceMemberModel, raising=True)
    monkeypatch.setattr(models_pkg, "ProjectMember", ProjectMemberModel, raising=True)

    # Also patch direct names if imported specifically (from plane.db.models import ProjectMember, WorkspaceMember)
    monkeypatch.setitem(globals(), "WorkspaceMember", WorkspaceMemberModel)
    monkeypatch.setitem(globals(), "ProjectMember", ProjectMemberModel)

    return state

# -------- ProjectBasePermission tests --------

def test_project_base_permission_denies_anonymous(mock_view, anon_user):
    perm = ProjectBasePermission()
    req = types.SimpleNamespace(user=anon_user, method="GET")
    assert perm.has_permission(req, mock_view) is False

@pytest.mark.parametrize("safe_method", list(SAFE_METHODS))
def test_project_base_permission_safe_methods_require_workspace_membership(mock_models, mock_view, user, safe_method):
    perm = ProjectBasePermission()
    req = types.SimpleNamespace(user=user, method=safe_method)

    # Not a member
    mock_models["workspace_member_exists"] = False
    assert perm.has_permission(req, mock_view) is False

    # Active member
    mock_models["workspace_member_exists"] = True
    assert perm.has_permission(req, mock_view) is True

def test_project_base_permission_post_requires_workspace_admin_or_member(mock_models, mock_view, user):
    perm = ProjectBasePermission()
    req = types.SimpleNamespace(user=user, method="POST")

    # No proper role
    mock_models["post_allowed_workspace_roles"] = False
    assert perm.has_permission(req, mock_view) is False

    # Has allowed role (ROLE.ADMIN or ROLE.MEMBER)
    mock_models["post_allowed_workspace_roles"] = True
    assert perm.has_permission(req, mock_view) is True

def test_project_base_permission_non_safe_allows_project_admin(mock_models, mock_view, user):
    perm = ProjectBasePermission()
    req = types.SimpleNamespace(user=user, method="PATCH")

    # Project admin: True regardless of workspace admin flag
    mock_models["project_member_admin_exists"] = True
    mock_models["project_member_exists"] = True
    mock_models["workspace_admin_exists"] = False
    assert perm.has_permission(req, mock_view) is True

def test_project_base_permission_non_safe_allows_project_member_plus_workspace_admin(mock_models, mock_view, user):
    perm = ProjectBasePermission()
    req = types.SimpleNamespace(user=user, method="DELETE")

    # Not project admin, but is a project member and workspace admin
    mock_models["project_member_admin_exists"] = False
    mock_models["project_member_exists"] = True
    mock_models["workspace_admin_exists"] = True
    assert perm.has_permission(req, mock_view) is True

def test_project_base_permission_non_safe_denies_without_required_combination(mock_models, mock_view, user):
    perm = ProjectBasePermission()
    req = types.SimpleNamespace(user=user, method="PUT")

    # Member but not workspace admin
    mock_models["project_member_admin_exists"] = False
    mock_models["project_member_exists"] = True
    mock_models["workspace_admin_exists"] = False
    assert perm.has_permission(req, mock_view) is False

    # Workspace admin but not a project member
    mock_models["project_member_exists"] = False
    mock_models["workspace_admin_exists"] = True
    assert perm.has_permission(req, mock_view) is False

# -------- ProjectMemberPermission tests --------

def test_project_member_permission_denies_anonymous(mock_view, anon_user):
    perm = ProjectMemberPermission()
    req = types.SimpleNamespace(user=anon_user, method="GET")
    assert perm.has_permission(req, mock_view) is False

@pytest.mark.parametrize("safe_method", list(SAFE_METHODS))
def test_project_member_permission_safe_requires_project_membership(mock_models, mock_view, user, safe_method):
    perm = ProjectMemberPermission()
    req = types.SimpleNamespace(user=user, method=safe_method)

    # Not a project member
    mock_models["project_member_exists"] = False
    assert perm.has_permission(req, mock_view) is False

    # Is a project member
    mock_models["project_member_exists"] = True
    assert perm.has_permission(req, mock_view) is True

def test_project_member_permission_post_requires_workspace_role(mock_models, mock_view, user):
    perm = ProjectMemberPermission()
    req = types.SimpleNamespace(user=user, method="POST")

    mock_models["post_allowed_workspace_roles"] = False
    assert perm.has_permission(req, mock_view) is False

    mock_models["post_allowed_workspace_roles"] = True
    assert perm.has_permission(req, mock_view) is True

def test_project_member_permission_non_safe_requires_role_admin_or_member(mock_models, mock_view, user):
    perm = ProjectMemberPermission()
    req = types.SimpleNamespace(user=user, method="PATCH")

    # No membership
    mock_models["project_member_exists"] = False
    assert perm.has_permission(req, mock_view) is False

    # Has role in [ADMIN, MEMBER] (simulated via existence True)
    mock_models["project_member_exists"] = True
    assert perm.has_permission(req, mock_view) is True

# -------- ProjectEntityPermission tests --------

def test_project_entity_permission_denies_anonymous(mock_view, anon_user):
    perm = ProjectEntityPermission()
    req = types.SimpleNamespace(user=anon_user, method="GET")
    assert perm.has_permission(req, mock_view) is False

def test_project_entity_permission_safe_with_project_identifier(mock_models, mock_view, user):
    perm = ProjectEntityPermission()
    mock_view.project_identifier = "PRJ"
    req = types.SimpleNamespace(user=user, method="GET")

    mock_models["project_identifier_safe_exists"] = False
    assert perm.has_permission(req, mock_view) is False

    mock_models["project_identifier_safe_exists"] = True
    assert perm.has_permission(req, mock_view) is True

@pytest.mark.parametrize("safe_method", list(SAFE_METHODS))
def test_project_entity_permission_safe_with_project_id(mock_models, mock_view, user, safe_method):
    perm = ProjectEntityPermission()
    mock_view.project_identifier = None
    req = types.SimpleNamespace(user=user, method=safe_method)

    mock_models["project_member_exists"] = False
    assert perm.has_permission(req, mock_view) is False

    mock_models["project_member_exists"] = True
    assert perm.has_permission(req, mock_view) is True

def test_project_entity_permission_non_safe_requires_role_admin_or_member(mock_models, mock_view, user):
    perm = ProjectEntityPermission()
    req = types.SimpleNamespace(user=user, method="POST")  # Create entity under project

    # Not in allowed roles
    mock_models["project_member_exists"] = False
    assert perm.has_permission(req, mock_view) is False

    # In allowed roles
    mock_models["project_member_exists"] = True
    assert perm.has_permission(req, mock_view) is True

# -------- ProjectLitePermission tests --------

def test_project_lite_permission_denies_anonymous(mock_view, anon_user):
    perm = ProjectLitePermission()
    req = types.SimpleNamespace(user=anon_user, method="GET")
    assert perm.has_permission(req, mock_view) is False

def test_project_lite_permission_requires_project_membership(mock_models, mock_view, user):
    perm = ProjectLitePermission()
    req = types.SimpleNamespace(user=user, method="GET")

    mock_models["project_member_exists"] = False
    assert perm.has_permission(req, mock_view) is False

    mock_models["project_member_exists"] = True
    assert perm.has_permission(req, mock_view) is True