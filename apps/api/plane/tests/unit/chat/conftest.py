# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest import mock

import pytest

from plane.db.models import Issue, Project
from plane.tests.factories import WorkspaceFactory, WorkspaceMemberFactory


@pytest.fixture(autouse=True)
def no_soft_delete_task():
    """`BaseModel.delete()` queues a Celery task to soft delete related rows; keep it off the broker."""
    with mock.patch("plane.db.mixins.soft_delete_related_objects"):
        yield


@pytest.fixture
def workspace(db):
    return WorkspaceFactory()


@pytest.fixture
def make_member(workspace):
    """Create a user who is an active member of `workspace` (or of another workspace)."""

    def _make(in_workspace=None, **kwargs):
        return WorkspaceMemberFactory(workspace=in_workspace or workspace, **kwargs).member

    return _make


@pytest.fixture
def make_issue(workspace):
    def _make(in_workspace=None):
        ws = in_workspace or workspace
        project = Project.objects.create(name=f"P {ws.slug}", identifier=ws.slug[-5:].upper(), workspace=ws)
        return Issue.objects.create(name="Bug", workspace=ws, project=project)

    return _make
