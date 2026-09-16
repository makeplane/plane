# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Invite codes: issuance, the signup gate and redemption (SYS-INV-*)."""

from datetime import timedelta

import pytest
from django.test import RequestFactory
from django.utils import timezone
from rest_framework.test import APIClient

from plane.authentication.adapter.error import AUTHENTICATION_ERROR_CODES, AuthenticationException
from plane.authentication.provider.credentials.email import EmailProvider
from plane.db.models import (
    OrgUnit,
    OrgUnitMember,
    ResearchInviteCode,
    ResearchUserProfile,
    WorkspaceMember,
)
from plane.license.models import InstanceConfiguration
from plane.research.services.accounts import (
    AccountError,
    invite_code_is_usable,
    issue_invite_code,
    redeem_invite_code,
)
from plane.research.utils.org import build_path
from plane.tests.research_fixtures import (
    add_workspace_member,
    enable_research,
    invite_codes_url,
    make_instance,
    make_user,
    make_workspace,
    public_workspace,
)

pytestmark = pytest.mark.contract


@pytest.fixture(autouse=True)
def research_module_on(settings):
    settings.RESEARCH_MODULE_ENABLED = True


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def env(db):
    admin = make_user(first_name="Admin")
    workspace = make_workspace(admin, slug="public-ws")
    enable_research(workspace)
    member = make_user(first_name="Member")
    add_workspace_member(workspace, member)
    return {"admin": admin, "workspace": workspace, "member": member}


def test_admin_issues_and_lists_codes(env):
    client = client_for(env["admin"])
    created = client.post(
        invite_codes_url(env["workspace"]),
        {"org_role": "ADVISOR", "max_uses": 3, "expires_in_days": 5, "note": "新生"},
        format="json",
    )
    assert created.status_code == 201
    assert created.data["org_role"] == "ADVISOR"
    assert created.data["max_uses"] == 3
    assert created.data["effective_status"] == "ACTIVE"
    assert created.data["register_url"].endswith(created.data["code"])

    listing = client.get(invite_codes_url(env["workspace"]))
    assert listing.status_code == 200
    assert listing.data["count"] == 1


def test_member_cannot_manage_codes(env):
    client = client_for(env["member"])
    assert client.get(invite_codes_url(env["workspace"])).status_code == 403
    assert (
        client.post(invite_codes_url(env["workspace"]), {"max_uses": 1}, format="json").status_code
        == 403
    )


def test_disable_enable_and_delete(env):
    client = client_for(env["admin"])
    code_id = client.post(invite_codes_url(env["workspace"]), {"max_uses": 1}, format="json").data["id"]

    disabled = client.post(invite_codes_url(env["workspace"], f"{code_id}/disable/"))
    assert disabled.status_code == 200
    assert disabled.data["effective_status"] == "DISABLED"
    assert invite_code_is_usable(disabled.data["code"]) is False

    enabled = client.post(invite_codes_url(env["workspace"], f"{code_id}/enable/"))
    assert enabled.status_code == 200
    assert enabled.data["effective_status"] == "ACTIVE"

    deleted = client.delete(invite_codes_url(env["workspace"], f"{code_id}/"))
    assert deleted.status_code == 204
    assert ResearchInviteCode.objects.filter(pk=code_id).count() == 0


def test_expired_and_exhausted_codes_are_refused(env):
    workspace = env["workspace"]
    public_workspace(owner=env["admin"])
    expired = issue_invite_code(
        workspace,
        env["admin"],
        max_uses=1,
        expires_at=timezone.now() - timedelta(minutes=1),
    )
    assert invite_code_is_usable(expired.code) is False
    with pytest.raises(AccountError) as expired_error:
        redeem_invite_code(make_user(), expired.code)
    assert expired_error.value.error_code == "invite_code_expired"

    single = issue_invite_code(workspace, env["admin"], max_uses=1)
    redeem_invite_code(make_user(), single.code)
    single.refresh_from_db()
    assert single.used_count == 1
    assert invite_code_is_usable(single.code) is False
    with pytest.raises(AccountError) as exhausted_error:
        redeem_invite_code(make_user(), single.code)
    assert exhausted_error.value.error_code == "invite_code_exhausted"


def test_redeem_places_the_account_in_the_public_workspace(env):
    public = public_workspace(owner=env["admin"])
    root = OrgUnit.objects.create(
        workspace=public,
        name="材料科学与工程学院",
        unit_type=OrgUnit.UnitType.ROOT,
        path="",
        depth=0,
    )
    root.path = build_path(root.id, None)
    root.save(update_fields=["path"])
    group = OrgUnit(
        workspace=public,
        parent=root,
        name="器件",
        unit_type=OrgUnit.UnitType.GROUP,
        depth=1,
        path="",
    )
    group.path = build_path(group.id, root.path)
    group.save()
    code = issue_invite_code(public, env["admin"], org_role="ADVISOR", org_unit=group, max_uses=2)

    newcomer = make_user(email="newcomer@example.com", first_name="Newcomer")
    result = redeem_invite_code(newcomer, code.code)

    assert result["workspace"].id == public.id
    membership = WorkspaceMember.objects.get(workspace=public, member=newcomer)
    assert membership.role == 15
    assert OrgUnitMember.objects.filter(
        workspace=public, org_unit=group, user=newcomer, org_role="ADVISOR"
    ).exists()
    assert ResearchUserProfile.objects.filter(user=newcomer).exists()

    code.refresh_from_db()
    assert code.used_count == 1


def test_signup_gate_accepts_only_usable_codes(db, settings):
    """With open registration off, only an invite code opens the door."""
    make_instance()
    InstanceConfiguration.objects.update_or_create(
        key="ENABLE_SIGNUP", defaults={"value": "0", "category": "research"}
    )
    workspace = public_workspace()
    admin = make_user(first_name="Admin")
    code = issue_invite_code(workspace, admin, max_uses=1)

    factory = RequestFactory()
    request = factory.post("/auth/sign-up/", {"email": "fresh@example.com", "invite_code": code.code})
    provider = EmailProvider(request=request, key="fresh@example.com", code="Passw0rd!23", is_signup=True)

    assert provider._Adapter__check_signup("fresh@example.com") is True

    blocked_request = factory.post("/auth/sign-up/", {"email": "fresh@example.com"})
    blocked_provider = EmailProvider(
        request=blocked_request, key="fresh@example.com", code="Passw0rd!23", is_signup=True
    )
    with pytest.raises(AuthenticationException) as blocked:
        blocked_provider._Adapter__check_signup("fresh@example.com")
    assert blocked.value.error_code == AUTHENTICATION_ERROR_CODES["INVITE_CODE_REQUIRED_SIGN_UP"]

    code.delete()
    stale_request = factory.post("/auth/sign-up/", {"email": "fresh@example.com", "invite_code": code.code})
    stale_provider = EmailProvider(
        request=stale_request, key="fresh@example.com", code="Passw0rd!23", is_signup=True
    )
    with pytest.raises(AuthenticationException) as stale:
        stale_provider._Adapter__check_signup("fresh@example.com")
    assert stale.value.error_code == AUTHENTICATION_ERROR_CODES["INVITE_CODE_INVALID_SIGN_UP"]


def test_signup_gate_is_closed_without_configuration_row(db, monkeypatch):
    """No `ENABLE_SIGNUP` row has to mean "invitation only", not "open signup".

    The gate and the instance-configuration endpoint (which drives `enable_signup`
    in the web app) read the same key, so their fallbacks have to agree: with the
    gate defaulting to "1" an unset key showed invitation-only registration in the
    UI while the API still accepted walk-in signups.
    """
    monkeypatch.delenv("ENABLE_SIGNUP", raising=False)
    make_instance()
    # Soft delete: the row stays in the table but is hidden from the gate's query.
    InstanceConfiguration.objects.filter(key="ENABLE_SIGNUP").delete()
    assert not InstanceConfiguration.objects.filter(key="ENABLE_SIGNUP").exists()

    factory = RequestFactory()
    request = factory.post("/auth/sign-up/", {"email": "fresh@example.com"})
    provider = EmailProvider(request=request, key="fresh@example.com", code="Passw0rd!23", is_signup=True)

    with pytest.raises(AuthenticationException) as blocked:
        provider._Adapter__check_signup("fresh@example.com")
    assert blocked.value.error_code == AUTHENTICATION_ERROR_CODES["INVITE_CODE_REQUIRED_SIGN_UP"]
