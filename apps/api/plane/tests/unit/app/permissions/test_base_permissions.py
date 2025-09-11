import types
from types import SimpleNamespace
from unittest.mock import patch, Mock
import pytest

# Testing library/framework: pytest + pytest-django style with unittest.mock for patching.

# Attempt to import the real symbols; if path changes, adjust here.
# The implementation imports WorkspaceMember, ProjectMember inside its module,
# so we patch those classes in that module's namespace.
try:
    # Common plausible locations — adjust if repository structure differs.
    from plane.app.permissions.base_permissions import allow_permission, ROLE  # type: ignore
    TARGET_MODULE = "plane.app.permissions.base_permissions"
except Exception:
    # Fallback: the PR context provided the code; assume it lives alongside tests
    # under a base_permissions module in the same package path.
    from apps.api.plane.tests.unit.app.permissions import base_permissions  # type: ignore
    allow_permission = base_permissions.allow_permission
    ROLE = base_permissions.ROLE
    TARGET_MODULE = "apps.api.plane.tests.unit.app.permissions.base_permissions"


class _Req(SimpleNamespace):
    pass


def _mk_view():
    called = {"count": 0, "args": None, "kwargs": None}

    def view(self, request, *args, **kwargs):
        called["count"] += 1
        called["args"] = args
        called["kwargs"] = kwargs
        return {"ok": True, "args": args, "kwargs": kwargs}

    return view, called


def _stub_qs(return_value: bool):
    return SimpleNamespace(exists=lambda: return_value)


@pytest.fixture
def user():
    return SimpleNamespace(id=1, username="u1")


@pytest.fixture
def req(user):
    return _Req(user=user)


@pytest.fixture
def kwargs_base():
    return {"slug": "ws-1", "project_id": 42, "pk": 777}


def test_creator_override_allows_when_creator_true_and_model_matches(req, kwargs_base):
    view, called = _mk_view()

    # Build a fake model with objects.filter(...).exists() -> True only when created_by == req.user and id == pk
    class FakeModel:
        pass

    def filter_model(**kw):
        return _stub_qs(kw.get("created_by") is req.user and kw.get("id") == kwargs_base["pk"])

    FakeModel.objects = SimpleNamespace(filter=lambda **kw: filter_model(**kw))

    wrapped = allow_permission(allowed_roles=[ROLE.GUEST], level="PROJECT", creator=True, model=FakeModel)(view)

    # Even without any Project/Workspace membership, creator path should allow
    with patch(f"{TARGET_MODULE}.WorkspaceMember") as WM, patch(f"{TARGET_MODULE}.ProjectMember") as PM:
        # Ensure other paths would deny if evaluated
        WM.objects = SimpleNamespace(filter=lambda **kw: _stub_qs(False))
        PM.objects = SimpleNamespace(filter=lambda **kw: _stub_qs(False))

        res = wrapped(None, req, **kwargs_base)

    assert called["count"] == 1, "View should be called due to creator override"
    assert res == {"ok": True, "args": (), "kwargs": kwargs_base}


def test_workspace_level_allows_when_member_has_allowed_role(req, kwargs_base):
    view, called = _mk_view()
    wrapped = allow_permission(allowed_roles=[ROLE.MEMBER, ROLE.ADMIN], level="WORKSPACE")(view)

    def wm_filter(**kw):
        # Expect role__in to include MEMBER/ADMIN, ensure is_active True and slug match
        role_in = kw.get("role__in", [])
        return _stub_qs(
            kw.get("member") is req.user
            and kw.get("workspace__slug") == kwargs_base["slug"]
            and kw.get("is_active") is True
            and (ROLE.MEMBER.value in role_in or ROLE.ADMIN.value in role_in)
        )

    with patch(f"{TARGET_MODULE}.WorkspaceMember") as WM:
        WM.objects = SimpleNamespace(filter=lambda **kw: wm_filter(**kw))
        res = wrapped(None, req, **kwargs_base)

    assert called["count"] == 1
    assert res == {"ok": True, "args": (), "kwargs": kwargs_base}


def test_project_level_allows_when_member_has_allowed_role(req, kwargs_base):
    view, called = _mk_view()
    # Mix enum and raw role integers to validate normalization
    wrapped = allow_permission(allowed_roles=[ROLE.GUEST, ROLE.MEMBER.value], level="PROJECT")(view)

    def pm_filter(**kw):
        role_in = kw.get("role__in", [])
        return _stub_qs(
            kw.get("member") is req.user
            and kw.get("workspace__slug") == kwargs_base["slug"]
            and kw.get("project_id") == kwargs_base["project_id"]
            and kw.get("is_active") is True
            and any(r in role_in for r in (ROLE.GUEST.value, ROLE.MEMBER.value))
        )

    with patch(f"{TARGET_MODULE}.ProjectMember") as PM:
        PM.objects = SimpleNamespace(filter=lambda **kw: pm_filter(**kw))

        # WorkspaceMember path should not be consulted if project allowed returns True,
        # but we patch it safe anyway.
        with patch(f"{TARGET_MODULE}.WorkspaceMember") as WM:
            WM.objects = SimpleNamespace(filter=lambda **kw: _stub_qs(False))
            res = wrapped(None, req, **kwargs_base)

    assert called["count"] == 1
    assert res == {"ok": True, "args": (), "kwargs": kwargs_base}


def test_project_level_allows_when_workspace_admin_and_in_project_even_if_role_not_allowed(req, kwargs_base):
    view, called = _mk_view()
    # Only allow GUEST; user will be MEMBER in project (not in allowed list) but ADMIN at workspace.
    wrapped = allow_permission(allowed_roles=[ROLE.GUEST], level="PROJECT")(view)

    def pm_filter_role_check(**kw):
        # First call checks role__in allowed — return False to go to admin override branch
        role_in = kw.get("role__in")
        if role_in is not None:
            return _stub_qs(False)
        # Second call in the 'elif' branch: checks just membership/is_active (no role__in)
        return _stub_qs(
            kw.get("member") is req.user
            and kw.get("workspace__slug") == kwargs_base["slug"]
            and kw.get("project_id") == kwargs_base["project_id"]
            and kw.get("is_active") is True
        )

    def wm_filter_admin_check(**kw):
        return _stub_qs(
            kw.get("member") is req.user
            and kw.get("workspace__slug") == kwargs_base["slug"]
            and kw.get("is_active") is True
            and kw.get("role") == ROLE.ADMIN.value
        )

    with patch(f"{TARGET_MODULE}.ProjectMember") as PM, patch(f"{TARGET_MODULE}.WorkspaceMember") as WM:
        PM.objects = SimpleNamespace(filter=lambda **kw: pm_filter_role_check(**kw))
        WM.objects = SimpleNamespace(filter=lambda **kw: wm_filter_admin_check(**kw))

        res = wrapped(None, req, **kwargs_base)

    assert called["count"] == 1, "Admin-in-workspace + member-in-project should grant access"
    assert res == {"ok": True, "args": (), "kwargs": kwargs_base}


def test_denied_returns_403_with_message(req, kwargs_base):
    view, called = _mk_view()
    wrapped = allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")(view)

    with patch(f"{TARGET_MODULE}.WorkspaceMember") as WM, patch(f"{TARGET_MODULE}.ProjectMember") as PM:
        WM.objects = SimpleNamespace(filter=lambda **kw: _stub_qs(False))
        PM.objects = SimpleNamespace(filter=lambda **kw: _stub_qs(False))

        resp = wrapped(None, req, **kwargs_base)

    # When denied, the decorator returns a DRF Response; inspect essentials
    # We avoid importing Response/status directly to keep the test isolated.
    assert called["count"] == 0, "View must not be called on denied"
    assert hasattr(resp, "status_code"), "Expected a DRF Response-like object"
    assert int(resp.status_code) == 403
    # payload as dict with the expected message
    data = getattr(resp, "data", None) or getattr(resp, "content", None) or {}
    # DRF Response exposes 'data'
    assert isinstance(getattr(resp, "data", {}), dict)
    assert resp.data.get("error") == "You don't have the required permissions."


def test_creator_flag_ignored_when_model_not_provided(req, kwargs_base):
    view, called = _mk_view()
    wrapped = allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE", creator=True, model=None)(view)

    with patch(f"{TARGET_MODULE}.WorkspaceMember") as WM:
        WM.objects = SimpleNamespace(filter=lambda **kw: _stub_qs(False))
        resp = wrapped(None, req, **kwargs_base)

    assert called["count"] == 0
    assert getattr(resp, "status_code", None) == 403
    assert resp.data.get("error") == "You don't have the required permissions."