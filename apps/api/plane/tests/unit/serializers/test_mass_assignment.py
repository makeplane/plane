# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""created_by/updated_by are read-only on the project, cycle and view write serializers.

BaseModel.save() sets these audit fields from the current request user, so a
value in the request payload is ignored.
"""

import pytest
from crum import set_current_user

from plane.app.serializers.cycle import CycleWriteSerializer
from plane.app.serializers.project import ProjectSerializer
from plane.app.serializers.view import IssueViewSerializer
from plane.db.models import Cycle, IssueView, Project, User


@pytest.fixture
def current_user(create_user):
    """Set crum's current user, which BaseModel.save() reads for the audit fields."""
    set_current_user(create_user)
    yield create_user
    set_current_user(None)


@pytest.fixture
def other_user(db):
    return User.objects.create(email="other-user@plane.so", username="other_user")


def _assert_update_ignores_audit_fields(serializer_cls, instance, current_user, other_user, **kwargs):
    # Pin created_by so the assertion doesn't depend on create-time stamping.
    type(instance).objects.filter(pk=instance.pk).update(created_by=current_user)
    instance.refresh_from_db()

    serializer = serializer_cls(
        instance=instance,
        data={"name": "Renamed", "created_by": other_user.id, "updated_by": other_user.id},
        partial=True,
        **kwargs,
    )
    assert serializer.is_valid(), serializer.errors
    assert "created_by" not in serializer.validated_data
    assert "updated_by" not in serializer.validated_data

    saved = serializer.save()
    saved.refresh_from_db()

    assert saved.name == "Renamed"
    assert saved.created_by_id == current_user.id
    assert saved.updated_by_id != other_user.id


@pytest.mark.unit
@pytest.mark.django_db
class TestAuditFieldsReadOnly:
    def test_project_update_ignores_audit_fields(self, workspace, current_user, other_user):
        project = Project.objects.create(name="Test Project", identifier="TESTP", workspace=workspace)
        _assert_update_ignores_audit_fields(
            ProjectSerializer, project, current_user, other_user, context={"workspace_id": workspace.id}
        )

    def test_view_update_ignores_audit_fields(self, workspace, current_user, other_user):
        project = Project.objects.create(name="Test Project", identifier="TESTV", workspace=workspace)
        view = IssueView.objects.create(
            name="Original View", query={}, project=project, workspace=workspace, owned_by=current_user
        )
        _assert_update_ignores_audit_fields(IssueViewSerializer, view, current_user, other_user)

    def test_cycle_update_ignores_audit_fields(self, workspace, current_user, other_user):
        project = Project.objects.create(name="Test Project", identifier="TESTC", workspace=workspace)
        cycle = Cycle.objects.create(name="Original Cycle", project=project, workspace=workspace, owned_by=current_user)
        _assert_update_ignores_audit_fields(CycleWriteSerializer, cycle, current_user, other_user)
