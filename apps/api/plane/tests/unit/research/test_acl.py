# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta

import pytest
from django.utils import timezone

from plane.db.models import MentorBinding, OrgUnit, OrgUnitMember
from plane.research.utils.acl import (
    ResearchResource,
    build_actor_context,
    can_narrow,
    check_access,
    visibility_allows,
)
from plane.research.utils.org import build_path, ensure_root_org_unit
from plane.tests.research_fixtures import (
    add_workspace_member,
    enable_research,
    make_user,
    make_workspace,
)

pytestmark = pytest.mark.unit

VISIBILITIES = ["PRIVATE", "DIRECT_ADVISOR", "UNIT", "ANCESTRY", "WORKSPACE", "CUSTOM"]
SUBJECTS = ["owner", "advisor", "unit_member", "ancestor_pi", "admin", "stranger"]

# The expected decision matrix: six visibility levels x six subject classes.
EXPECTED = {
    "PRIVATE": {
        "owner": True,
        "advisor": False,
        "unit_member": False,
        "ancestor_pi": False,
        "admin": True,
        "stranger": False,
    },
    "DIRECT_ADVISOR": {
        "owner": True,
        "advisor": True,
        "unit_member": False,
        "ancestor_pi": False,
        "admin": True,
        "stranger": False,
    },
    "UNIT": {
        "owner": True,
        "advisor": True,
        "unit_member": True,
        "ancestor_pi": False,
        "admin": True,
        "stranger": False,
    },
    "ANCESTRY": {
        "owner": True,
        "advisor": False,
        "unit_member": False,
        "ancestor_pi": True,
        "admin": True,
        "stranger": False,
    },
    "WORKSPACE": {
        "owner": True,
        "advisor": True,
        "unit_member": True,
        "ancestor_pi": True,
        "admin": True,
        "stranger": True,
    },
    "CUSTOM": {
        "owner": True,
        "advisor": False,
        "unit_member": True,
        "ancestor_pi": False,
        "admin": True,
        "stranger": False,
    },
}


def create_unit(workspace, name, parent=None, unit_type=OrgUnit.UnitType.GROUP):
    unit = OrgUnit.objects.create(
        workspace=workspace,
        name=name,
        parent=parent,
        unit_type=unit_type,
        depth=(parent.depth + 1) if parent else 0,
        path="",
    )
    unit.path = build_path(unit.id, parent.path if parent else None)
    unit.save(update_fields=["path"])
    return unit


@pytest.fixture
def acl_env(db, settings):
    settings.RESEARCH_MODULE_ENABLED = True
    admin = make_user(first_name="Admin")
    workspace = make_workspace(admin)
    enable_research(workspace)
    root = ensure_root_org_unit(workspace)
    lab = create_unit(workspace, "Lab", root, OrgUnit.UnitType.LAB)
    group = create_unit(workspace, "Group", lab, OrgUnit.UnitType.GROUP)

    owner = make_user(first_name="Owner")
    advisor = make_user(first_name="Advisor")
    unit_member = make_user(first_name="Member")
    ancestor_pi = make_user(first_name="AncestorPi")
    stranger = make_user(first_name="Stranger")
    for user in (owner, advisor, unit_member, ancestor_pi, stranger):
        add_workspace_member(workspace, user)

    OrgUnitMember.objects.create(
        workspace=workspace, org_unit=group, user=owner, org_role=OrgUnitMember.OrgRole.PI
    )
    OrgUnitMember.objects.create(
        workspace=workspace, org_unit=group, user=advisor, org_role=OrgUnitMember.OrgRole.ADVISOR
    )
    OrgUnitMember.objects.create(
        workspace=workspace, org_unit=group, user=unit_member, org_role=OrgUnitMember.OrgRole.REVIEWER
    )
    OrgUnitMember.objects.create(
        workspace=workspace, org_unit=lab, user=ancestor_pi, org_role=OrgUnitMember.OrgRole.PI
    )
    MentorBinding.objects.create(workspace=workspace, mentee=owner, mentor=advisor, org_unit=group)

    return {
        "workspace": workspace,
        "root": root,
        "lab": lab,
        "group": group,
        "admin": admin,
        "owner": owner,
        "advisor": advisor,
        "unit_member": unit_member,
        "ancestor_pi": ancestor_pi,
        "stranger": stranger,
    }


@pytest.mark.django_db
class TestVisibilityMatrix:
    @pytest.mark.parametrize("visibility", VISIBILITIES)
    @pytest.mark.parametrize("subject", SUBJECTS)
    def test_matrix(self, acl_env, visibility, subject):
        actor = acl_env[subject]
        grants = []
        if visibility == "CUSTOM":
            grants = [{"grantee_user": str(acl_env["unit_member"].id)}]
        resource = ResearchResource(
            kind="report",
            workspace_id=acl_env["workspace"].id,
            owner_id=acl_env["owner"].id,
            org_unit_id=acl_env["group"].id,
            visibility=visibility,
            grants=grants,
        )
        context = build_actor_context(actor, acl_env["workspace"].id)
        assert visibility_allows(context, resource) is EXPECTED[visibility][subject], (
            f"visibility={visibility} subject={subject}"
        )

    def test_expired_org_relation_does_not_grant_access(self, acl_env):
        membership = OrgUnitMember.objects.get(
            org_unit=acl_env["group"],
            user=acl_env["unit_member"],
        )
        membership.effective_to = timezone.localdate() - timedelta(days=1)
        membership.save(update_fields=["effective_to"])

        resource = ResearchResource(
            kind="report",
            workspace_id=acl_env["workspace"].id,
            owner_id=acl_env["owner"].id,
            org_unit_id=acl_env["group"].id,
            visibility="UNIT",
        )
        context = build_actor_context(acl_env["unit_member"], acl_env["workspace"].id)
        assert visibility_allows(context, resource) is False

    def test_member_of_another_workspace_is_rejected(self, acl_env):
        outsider = make_user()
        other_workspace = make_workspace(outsider)
        enable_research(other_workspace)
        resource = ResearchResource(
            kind="report",
            workspace_id=acl_env["workspace"].id,
            owner_id=acl_env["owner"].id,
            visibility="WORKSPACE",
        )
        context = build_actor_context(outsider, acl_env["workspace"].id)
        assert visibility_allows(context, resource) is False


@pytest.mark.django_db
class TestActionPermissions:
    def _resource(self, acl_env, visibility="UNIT"):
        return ResearchResource(
            kind="report",
            workspace_id=acl_env["workspace"].id,
            owner_id=acl_env["owner"].id,
            org_unit_id=acl_env["group"].id,
            visibility=visibility,
            state="DRAFT",
        )

    def test_only_the_owner_can_edit(self, acl_env):
        resource = self._resource(acl_env)
        assert check_access(acl_env["owner"], "edit", resource) is True
        assert check_access(acl_env["advisor"], "edit", resource) is False
        assert check_access(acl_env["admin"], "edit", resource) is True

    def test_direct_advisor_and_node_manager_can_review(self, acl_env):
        resource = self._resource(acl_env)
        assert check_access(acl_env["advisor"], "review", resource) is True
        assert check_access(acl_env["ancestor_pi"], "review", resource) is True
        assert check_access(acl_env["unit_member"], "review", resource) is False
        assert check_access(acl_env["owner"], "review", resource) is False
        assert check_access(acl_env["admin"], "review", resource) is True

    def test_manage_access_is_owner_or_admin_only(self, acl_env):
        resource = self._resource(acl_env)
        assert check_access(acl_env["owner"], "manage_access", resource) is True
        assert check_access(acl_env["admin"], "manage_access", resource) is True
        assert check_access(acl_env["unit_member"], "manage_access", resource) is False

    def test_module_switch_off_denies_everything(self, acl_env, settings):
        resource = self._resource(acl_env)
        settings.RESEARCH_MODULE_ENABLED = False
        assert check_access(acl_env["owner"], "view", resource) is False
        assert check_access(acl_env["admin"], "view", resource) is False

    def test_anonymous_is_denied(self, acl_env):
        from django.contrib.auth.models import AnonymousUser

        resource = self._resource(acl_env)
        assert check_access(AnonymousUser(), "view", resource) is False


class TestVisibilityNarrowing:
    def test_narrowing_is_allowed_and_widening_is_rejected(self):
        assert can_narrow("UNIT", "PRIVATE") is True
        assert can_narrow("UNIT", "DIRECT_ADVISOR") is True
        assert can_narrow("UNIT", "UNIT") is True
        assert can_narrow("UNIT", "ANCESTRY") is False
        assert can_narrow("UNIT", "WORKSPACE") is False
        assert can_narrow("PRIVATE", "DIRECT_ADVISOR") is False
        assert can_narrow("WORKSPACE", "WORKSPACE") is True

    def test_unknown_levels_are_treated_as_narrowest(self):
        assert can_narrow("UNIT", "UNKNOWN") is True
        assert can_narrow("UNKNOWN", "WORKSPACE") is False
