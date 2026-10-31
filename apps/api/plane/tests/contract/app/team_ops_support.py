# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Fixtures and helpers shared by the Team Ops calendar tests.

Import what a test module needs from here (the fixtures must be imported by name for pytest
to see them). They live in a module of their own rather than a conftest because a conftest in
this folder would override the global `workspace` fixture for every other contract test.
"""

from datetime import datetime, timedelta, timezone as dt_timezone
from unittest import mock
from uuid import uuid4

import pytest
from rest_framework.test import APIClient

from plane.db.models import Project, ProjectMember, User, Workspace, WorkspaceMember
from plane.team_ops.models import OpsTeam, OpsTeamMember

ADMIN, MEMBER, GUEST = 20, 15, 5


@pytest.fixture(autouse=True)
def _no_broker(db):
    """Soft deletes enqueue a Celery task; there is no broker in tests."""
    with mock.patch("plane.db.mixins.soft_delete_related_objects"):
        yield


def make_user(prefix):
    uid = uuid4().hex[:8]
    return User.objects.create(email=f"{prefix}-{uid}@plane.so", username=f"{prefix}_{uid}", display_name=prefix)


def make_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def join(workspace, user, role):
    return WorkspaceMember.objects.create(workspace=workspace, member=user, role=role)


def make_workspace(owner, prefix="ops"):
    workspace = Workspace.objects.create(name="Ops", owner=owner, slug=f"{prefix}-{uuid4().hex[:8]}")
    join(workspace, owner, ADMIN)
    return workspace


def make_team(workspace, name="Platform", leads=(), members=()):
    team = OpsTeam.objects.create(workspace=workspace, name=name)
    for user in leads:
        OpsTeamMember.objects.create(team=team, user=user, role=OpsTeamMember.Role.LEAD)
    for user in members:
        OpsTeamMember.objects.create(team=team, user=user, role=OpsTeamMember.Role.MEMBER)
    return team


def make_project(workspace, owner, identifier, members=()):
    project = Project.objects.create(name=identifier, identifier=identifier, workspace=workspace, created_by=owner)
    ProjectMember.objects.create(project=project, member=owner, workspace=workspace, role=ADMIN)
    for user in members:
        ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=MEMBER)
    return project


def url(workspace, path=""):
    return f"/api/workspaces/{workspace.slug}/team-ops/{path}"


def cal(workspace, path=""):
    return url(workspace, f"calendar/{path}")


def today():
    """Today in UTC, the timezone every test user has, so tests do not depend on the machine's zone."""
    return datetime.now(dt_timezone.utc).date()


def next_monday():
    """A Monday strictly in the future, so edits never trip the past-date limit."""
    current = today()
    return current + timedelta(days=7 - current.weekday())


@pytest.fixture
def admin(db):
    return make_user("admin")


@pytest.fixture
def member(db):
    return make_user("member")


@pytest.fixture
def colleague(db):
    return make_user("colleague")


@pytest.fixture
def lead(db):
    return make_user("lead")


@pytest.fixture
def guest(db):
    return make_user("guest")


@pytest.fixture
def outsider(db):
    return make_user("outsider")


@pytest.fixture
def workspace(admin, member, colleague, lead, guest):
    ws = make_workspace(admin)
    join(ws, member, MEMBER)
    join(ws, colleague, MEMBER)
    join(ws, lead, MEMBER)
    join(ws, guest, GUEST)
    return ws


@pytest.fixture
def other_workspace(db):
    owner = make_user("owner")
    return make_workspace(owner, "other")


@pytest.fixture
def admin_client(admin):
    return make_client(admin)


@pytest.fixture
def member_client(member):
    return make_client(member)


@pytest.fixture
def lead_client(lead):
    return make_client(lead)


@pytest.fixture
def guest_client(guest):
    return make_client(guest)


@pytest.fixture
def outsider_client(outsider):
    return make_client(outsider)
