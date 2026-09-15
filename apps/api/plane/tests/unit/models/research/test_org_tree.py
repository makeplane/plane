# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.db import IntegrityError

from plane.db.models import OrgUnit, ResearchAuditEvent
from plane.research.utils.org import (
    build_path,
    descendants_queryset,
    ensure_root_org_unit,
    is_descendant_of,
    move_subtree,
)
from plane.tests.research_fixtures import make_user, make_workspace

pytestmark = pytest.mark.unit


def create_unit(workspace, name, parent=None, unit_type=OrgUnit.UnitType.GROUP):
    """Create an org unit with a correctly materialised path."""
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


@pytest.mark.django_db
class TestOrgTreeHelpers:
    def test_build_path_normalises_segments(self):
        unit_id = "8f1b0f0e-2b31-4a5c-9f27-3a1f6c9d2b77"
        assert build_path(unit_id, None) == "/8f1b0f0e2b314a5c9f273a1f6c9d2b77/"
        assert build_path(unit_id, "/abc/") == "/abc/8f1b0f0e2b314a5c9f273a1f6c9d2b77/"
        assert build_path(unit_id, "/abc") == "/abc/8f1b0f0e2b314a5c9f273a1f6c9d2b77/"

    def test_is_descendant_of_matches_only_strict_descendants(self):
        owner = make_user()
        workspace = make_workspace(owner)
        root = ensure_root_org_unit(workspace)
        child = create_unit(workspace, "College", root, OrgUnit.UnitType.INSTITUTE)
        assert is_descendant_of(child, root) is True
        assert is_descendant_of(root, child) is False
        assert is_descendant_of(root, root) is False

    def test_ensure_root_org_unit_is_idempotent(self):
        owner = make_user()
        workspace = make_workspace(owner)
        first = ensure_root_org_unit(workspace)
        second = ensure_root_org_unit(workspace)
        assert first.id == second.id
        assert OrgUnit.objects.filter(workspace=workspace).count() == 1

    def test_descendants_queryset_is_scoped_to_the_subtree(self):
        owner = make_user()
        workspace = make_workspace(owner)
        root = ensure_root_org_unit(workspace)
        parent = create_unit(workspace, "Lab", root, OrgUnit.UnitType.LAB)
        child = create_unit(workspace, "Group", parent, OrgUnit.UnitType.GROUP)
        other = create_unit(workspace, "Other lab", root, OrgUnit.UnitType.LAB)
        descendant_ids = set(descendants_queryset(parent).values_list("id", flat=True))
        assert descendant_ids == {child.id}
        assert other.id not in descendant_ids

    def test_move_subtree_rewrites_descendant_paths_and_depth(self):
        owner = make_user()
        workspace = make_workspace(owner)
        root = ensure_root_org_unit(workspace)
        first_lab = create_unit(workspace, "Lab A", root, OrgUnit.UnitType.LAB)
        second_lab = create_unit(workspace, "Lab B", root, OrgUnit.UnitType.LAB)
        group = create_unit(workspace, "Group", first_lab, OrgUnit.UnitType.GROUP)
        team = create_unit(workspace, "Team", group, OrgUnit.UnitType.TEAM)
        original_group_path = group.path

        move_subtree(group, second_lab)

        group.refresh_from_db()
        team.refresh_from_db()
        assert group.parent_id == second_lab.id
        assert group.depth == 2
        assert group.path.startswith(second_lab.path)
        assert group.path != original_group_path
        # the whole subtree follows the new parent
        assert team.path == group.path + str(team.id).replace("-", "") + "/"
        assert team.depth == 3

    def test_duplicate_name_under_same_parent_is_rejected(self):
        owner = make_user()
        workspace = make_workspace(owner)
        root = ensure_root_org_unit(workspace)
        create_unit(workspace, "Group", root)
        with pytest.raises(IntegrityError):
            create_unit(workspace, "Group", root)

    def test_only_one_root_unit_per_workspace(self):
        owner = make_user()
        workspace = make_workspace(owner)
        ensure_root_org_unit(workspace)
        with pytest.raises(IntegrityError):
            create_unit(workspace, "Second root", None, OrgUnit.UnitType.ROOT)


@pytest.mark.django_db
class TestResearchAuditEventAppendOnly:
    def _event(self):
        owner = make_user()
        workspace = make_workspace(owner)
        return ResearchAuditEvent.objects.create(
            workspace=workspace,
            actor=owner,
            action="org.unit.create",
            resource_type="org_unit",
            metadata={"name": "College"},
        )

    def test_update_via_instance_is_rejected(self):
        event = self._event()
        event.action = "org.unit.delete"
        with pytest.raises(TypeError):
            event.save()

    def test_delete_via_instance_is_rejected(self):
        event = self._event()
        with pytest.raises(TypeError):
            event.delete()

    def test_bulk_update_and_delete_are_rejected(self):
        self._event()
        with pytest.raises(TypeError):
            ResearchAuditEvent.objects.all().update(action="tampered")
        with pytest.raises(TypeError):
            ResearchAuditEvent.objects.all().delete()

    def test_events_survive_org_unit_deletion(self):
        owner = make_user()
        workspace = make_workspace(owner)
        root = ensure_root_org_unit(workspace)
        child = create_unit(workspace, "Group", root)
        ResearchAuditEvent.objects.create(
            workspace=workspace,
            actor=owner,
            action="org.unit.delete",
            resource_type="org_unit",
            resource_id=child.id,
        )
        child.soft_delete()
        assert ResearchAuditEvent.objects.filter(resource_id=child.id).count() == 1
