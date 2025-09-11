import types
from unittest.mock import MagicMock, patch
import pytest
from rest_framework.test import APIRequestFactory
from rest_framework.response import Response
from rest_framework import status

# Import the system under test
# Try common locations; if the project structure differs, update this import accordingly.
try:
    from plane.api.plane.permissions.base_permissions import allow_permission, ROLE
except Exception:
    try:
        from plane.api.permissions.base_permissions import allow_permission, ROLE
    except Exception:
        # Fallback to a flat module path used in some layouts
        from plane.permissions.base_permissions import allow_permission, ROLE


class DummyUser:
    def __init__(self, user_id="user-1"):
        self.id = user_id
        self.is_authenticated = True

@pytest.fixture()
def api_rf():
    return APIRequestFactory()

@pytest.fixture()
def ok_view():
    # A simple view func to be decorated. It must accept (instance, request, *args, **kwargs)
    def view(instance, request, *args, **kwargs):
        return Response({"ok": True, "kwargs": kwargs}, status=status.HTTP_200_OK)
    return view

def make_request(api_rf, user=None):
    req = api_rf.get("/dummy/")
    req.user = user or DummyUser()
    return req

def _fake_qs_exists(result: bool):
    """Build a fake queryset: objects.filter(...).exists() -> result"""
    qs = MagicMock()
    qs.exists.return_value = result
    manager = MagicMock()
    manager.filter.return_value = qs
    return manager

def _decorate(view, *, allowed_roles, level="PROJECT", creator=False, model=None):
    return allow_permission(allowed_roles, level=level, creator=creator, model=model)(view)

def _call(decorated, request, **kwargs):
    # instance can be None for function-based, kwargs include slug, project_id, pk, etc.
    return decorated(None, request, **kwargs)

# ------------------------
# Creator shortcut tests
# ------------------------

def test_allows_creator_when_flag_true_and_object_exists(api_rf, ok_view, monkeypatch):
    # model.objects.filter(id=pk, created_by=user).exists() -> True, should bypass role checks
    class FakeModel: pass
    FakeModel.objects = _fake_qs_exists(True)

    # Ensure role checks fail to prove creator bypass works:
    with patch("plane.db.models.WorkspaceMember") as WM, patch("plane.db.models.ProjectMember") as PM:
        WM.objects = _fake_qs_exists(False)
        PM.objects = _fake_qs_exists(False)

        decorated = _decorate(ok_view, allowed_roles=[ROLE.MEMBER], creator=True, model=FakeModel)
        resp = _call(decorated, make_request(api_rf), slug="w1", project_id="p1", pk="obj-1")

    assert resp.status_code == 200
    assert resp.data["ok"] is True

def test_creator_flag_true_but_not_creator_falls_back_to_role_checks_denied(api_rf, ok_view, monkeypatch):
    class FakeModel: pass
    FakeModel.objects = _fake_qs_exists(False)

    with patch("plane.db.models.WorkspaceMember") as WM, patch("plane.db.models.ProjectMember") as PM:
        # No allowed roles found either -> deny
        WM.objects = _fake_qs_exists(False)
        PM.objects = _fake_qs_exists(False)

        decorated = _decorate(ok_view, allowed_roles=[ROLE.MEMBER], creator=True, model=FakeModel)
        resp = _call(decorated, make_request(api_rf), slug="w1", project_id="p1", pk="obj-2")

    assert resp.status_code == status.HTTP_403_FORBIDDEN
    assert "required permissions" in resp.data.get("error", "").lower()

# ------------------------
# WORKSPACE level tests
# ------------------------

def test_workspace_level_allows_when_workspace_member_has_allowed_role(api_rf, ok_view):
    with patch("plane.db.models.WorkspaceMember") as WM, patch("plane.db.models.ProjectMember") as PM:
        # Workspace allowed role exists -> allow
        WM.objects = _fake_qs_exists(True)
        PM.objects = _fake_qs_exists(False)  # Should not be consulted for WORKSPACE level

        decorated = _decorate(ok_view, allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
        resp = _call(decorated, make_request(api_rf), slug="acme", project_id="proj-1")

    assert resp.status_code == 200
    assert resp.data["ok"] is True

def test_workspace_level_denies_when_no_membership_or_role(api_rf, ok_view):
    with patch("plane.db.models.WorkspaceMember") as WM, patch("plane.db.models.ProjectMember") as PM:
        WM.objects = _fake_qs_exists(False)
        PM.objects = _fake_qs_exists(False)

        decorated = _decorate(ok_view, allowed_roles=[ROLE.MEMBER], level="WORKSPACE")
        resp = _call(decorated, make_request(api_rf), slug="acme", project_id="proj-1")

    assert resp.status_code == status.HTTP_403_FORBIDDEN

# ------------------------
# PROJECT level tests
# ------------------------

def test_project_level_allows_when_user_has_allowed_project_role(api_rf, ok_view):
    with patch("plane.db.models.WorkspaceMember") as WM, patch("plane.db.models.ProjectMember") as PM:
        # Direct allowed role at project -> allow
        PM.objects = _fake_qs_exists(True)
        WM.objects = _fake_qs_exists(False)

        decorated = _decorate(ok_view, allowed_roles=[ROLE.MEMBER], level="PROJECT")
        resp = _call(decorated, make_request(api_rf), slug="w1", project_id="p1")

    assert resp.status_code == 200
    assert resp.data["ok"] is True

def test_project_level_allows_when_workspace_admin_and_project_member(api_rf, ok_view):
    with patch("plane.db.models.WorkspaceMember") as WM, patch("plane.db.models.ProjectMember") as PM:
        # Not in allowed roles:
        PM.objects = _fake_qs_exists(False)
        # But is workspace ADMIN and also part of the project -> allow
        def _wm_filter(*args, **kwargs):
            qs = MagicMock()
            qs.exists.return_value = True  # Simulate ADMIN existence
            return qs
        WM.objects = MagicMock()
        WM.objects.filter.side_effect = _wm_filter

        # Simulate being part of the project (regardless of role)
        def _pm_filter(*args, **kwargs):
            # First call checks allowed roles -> should be False
            # Second check is "part of the project regardless of the role" -> True
            qs1 = MagicMock()
            qs2 = MagicMock()
            qs1.exists.return_value = False
            qs2.exists.return_value = True
            # Return different QS based on role__in kw presence
            return qs1 if "role__in" in kwargs else qs2

        PM.objects.filter.side_effect = _pm_filter

        decorated = _decorate(ok_view, allowed_roles=[ROLE.GUEST], level="PROJECT")
        resp = _call(decorated, make_request(api_rf), slug="w1", project_id="p1")

    assert resp.status_code == 200
    assert resp.data["ok"] is True

def test_project_level_denies_when_not_allowed_not_admin_or_not_in_project(api_rf, ok_view):
    with patch("plane.db.models.WorkspaceMember") as WM, patch("plane.db.models.ProjectMember") as PM:
        PM.objects = _fake_qs_exists(False)
        WM.objects = _fake_qs_exists(False)

        decorated = _decorate(ok_view, allowed_roles=[ROLE.ADMIN], level="PROJECT")
        resp = _call(decorated, make_request(api_rf), slug="w1", project_id="p1")

    assert resp.status_code == status.HTTP_403_FORBIDDEN

# ------------------------
# Allowed roles conversion tests
# ------------------------

def test_allowed_roles_accepts_enum_and_ints(api_rf, ok_view):
    # Provide a mix of enum and raw numeric role values
    with patch("plane.db.models.WorkspaceMember") as WM, patch("plane.db.models.ProjectMember") as PM:
        # First branch: allowed role at project satisfied
        PM.objects = _fake_qs_exists(True)
        WM.objects = _fake_qs_exists(False)

        decorated = _decorate(ok_view, allowed_roles=[ROLE.MEMBER, ROLE.GUEST.value, 999], level="PROJECT")
        resp = _call(decorated, make_request(api_rf), slug="w1", project_id="p1")

    assert resp.status_code == 200

# ------------------------
# Robustness / unexpected input tests
# ------------------------

def test_missing_kwargs_results_in_denial_with_403(api_rf, ok_view):
    # Missing slug/project_id should cause filters to be incomplete and mocks return False -> deny
    with patch("plane.db.models.WorkspaceMember") as WM, patch("plane.db.models.ProjectMember") as PM:
        PM.objects = _fake_qs_exists(False)
        WM.objects = _fake_qs_exists(False)

        decorated = _decorate(ok_view, allowed_roles=[ROLE.MEMBER], level="PROJECT")
        # Supply only slug, skip project_id
        resp = _call(decorated, make_request(api_rf), slug="only-slug")

    assert resp.status_code == status.HTTP_403_FORBIDDEN

def test_view_response_is_preserved_on_success(api_rf, ok_view):
    with patch("plane.db.models.WorkspaceMember") as WM, patch("plane.db.models.ProjectMember") as PM:
        PM.objects = _fake_qs_exists(True)
        WM.objects = _fake_qs_exists(False)

        decorated = _decorate(ok_view, allowed_roles=[ROLE.MEMBER])
        resp = _call(decorated, make_request(api_rf), slug="w", project_id="p")

    assert isinstance(resp, Response)
    assert resp.status_code == 200
    assert resp.data["ok"] is True
