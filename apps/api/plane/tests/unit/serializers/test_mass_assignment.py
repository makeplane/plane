# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Regression tests: created_by/updated_by must not be client-forgeable.

BaseModel.save() stamps created_by/updated_by from the current (crum) request
user; on update it only ever re-stamps updated_by, never created_by. With
fields="__all__" and no read_only_fields entry, created_by (and, on update,
updated_by) are ordinary client-writable serializer fields, so a PATCH payload
can forge who a view/cycle is attributed to. These tests mirror the same gap
ProjectSerializer was already fixed for, applied to IssueViewSerializer and
CycleWriteSerializer.
"""

import pytest
from crum import set_current_user

from plane.app.serializers.cycle import CycleWriteSerializer
from plane.app.serializers.view import IssueViewSerializer
from plane.db.models import Cycle, IssueView, Project, User


@pytest.fixture
def current_user(create_user):
    """Simulate an authenticated request by populating crum's thread-local
    current user for the duration of the test — BaseModel.save() reads this
    to decide who to stamp as updated_by."""
    set_current_user(create_user)
    yield create_user
    set_current_user(None)


@pytest.mark.unit
class TestIssueViewSerializerMassAssignment:
    """created_by/updated_by must be read-only on IssueViewSerializer."""

    @pytest.mark.django_db
    def test_created_by_is_not_forgeable_via_update(self, db, workspace, current_user):
        project = Project.objects.create(name="Test Project", identifier="TESTV", workspace=workspace)
        attacker = User.objects.create(email="attacker-view@plane.so", username="attacker_view")

        view = IssueView.objects.create(
            name="Original View",
            query={},
            project=project,
            workspace=workspace,
            owned_by=current_user,
        )
        # BaseModel.save() stamped created_by from the crum current user on
        # create; pin it explicitly so the assertion below doesn't depend on
        # that behaviour.
        IssueView.objects.filter(pk=view.pk).update(created_by=current_user)
        view.refresh_from_db()

        serializer = IssueViewSerializer(
            instance=view,
            data={"name": "Renamed by attacker", "created_by": attacker.id, "updated_by": attacker.id},
            partial=True,
        )
        assert serializer.is_valid(), serializer.errors
        assert "created_by" not in serializer.validated_data
        assert "updated_by" not in serializer.validated_data

        saved = serializer.save()
        saved.refresh_from_db()

        assert saved.name == "Renamed by attacker"
        assert saved.created_by_id == current_user.id
        assert saved.created_by_id != attacker.id
        # updated_by is legitimately stamped from the request user, but must
        # not be forced to the attacker-supplied value either.
        assert saved.updated_by_id != attacker.id


@pytest.mark.unit
class TestCycleWriteSerializerMassAssignment:
    """created_by/updated_by must be read-only on CycleWriteSerializer."""

    @pytest.mark.django_db
    def test_created_by_is_not_forgeable_via_update(self, db, workspace, current_user):
        project = Project.objects.create(name="Test Project", identifier="TESTC", workspace=workspace)
        attacker = User.objects.create(email="attacker-cycle@plane.so", username="attacker_cycle")

        cycle = Cycle.objects.create(
            name="Original Cycle",
            project=project,
            workspace=workspace,
            owned_by=current_user,
        )
        Cycle.objects.filter(pk=cycle.pk).update(created_by=current_user)
        cycle.refresh_from_db()

        serializer = CycleWriteSerializer(
            instance=cycle,
            data={"name": "Renamed by attacker", "created_by": attacker.id, "updated_by": attacker.id},
            partial=True,
        )
        assert serializer.is_valid(), serializer.errors
        assert "created_by" not in serializer.validated_data
        assert "updated_by" not in serializer.validated_data

        saved = serializer.save()
        saved.refresh_from_db()

        assert saved.name == "Renamed by attacker"
        assert saved.created_by_id == current_user.id
        assert saved.created_by_id != attacker.id
        assert saved.updated_by_id != attacker.id
