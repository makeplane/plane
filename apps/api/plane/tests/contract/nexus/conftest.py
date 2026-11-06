# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Shared fixtures for the Nexus public-API contract tests.

`sdk` validates a response body with the genuine plane-sdk Pydantic model, which
is exactly what the MCP server does with it. A field the SDK requires but the
endpoint omits fails here instead of in an agent's tool call.
"""

import json
import subprocess
import sys
from uuid import uuid4

import pytest
from django.core.cache import cache
from django.core.serializers.json import DjangoJSONEncoder
from rest_framework.test import APIClient

from plane.db.models import Project, ProjectMember, State, User, Workspace, WorkspaceMember
from plane.db.models.api import APIToken

ADMIN, MEMBER, GUEST = 20, 15, 5


@pytest.fixture(autouse=True)
def _reset_api_key_throttle_cache():
    cache.delete_pattern("api_key:*")
    yield
    cache.delete_pattern("api_key:*")


def _client_for(user) -> APIClient:
    token = APIToken.objects.create(user=user, label="test", token=f"tok-{uuid4().hex}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


@pytest.fixture
def make_user(db):
    def make(role=MEMBER, workspace=None, project=None, project_role=None):
        user = User.objects.create(email=f"{uuid4().hex[:10]}@example.com", username=uuid4().hex[:12])
        if workspace is not None:
            WorkspaceMember.objects.create(workspace=workspace, member=user, role=role)
        if project is not None:
            ProjectMember.objects.create(project=project, member=user, role=project_role or role, is_active=True)
        return user, _client_for(user)

    return make


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="Nexus", identifier="NX", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, role=ADMIN, is_active=True)
    State.objects.create(name="Todo", group="unstarted", project=project, workspace=workspace, default=True)
    return project


@pytest.fixture
def client(api_key_client):
    """Workspace admin and project admin (the default `create_user`)."""
    return api_key_client


@pytest.fixture
def member_client(make_user, workspace, project):
    return make_user(MEMBER, workspace=workspace, project=project)[1]


@pytest.fixture
def guest_client(make_user, workspace, project):
    return make_user(GUEST, workspace=workspace, project=project)[1]


@pytest.fixture
def outsider_client(make_user, db):
    """A user in a different workspace only."""
    other = Workspace.objects.create(
        name="Other",
        slug=f"other-{uuid4().hex[:6]}",
        owner=User.objects.create(email=f"{uuid4().hex[:8]}@x.com", username=uuid4().hex[:12]),
    )
    return make_user(ADMIN, workspace=other)[1]


@pytest.fixture
def ws_url(workspace):
    return lambda suffix="": f"/api/v1/workspaces/{workspace.slug}/{suffix}"


@pytest.fixture
def project_url(workspace, project):
    return lambda suffix="": f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/{suffix}"


_SDK_WORKER = r"""
import importlib, json, sys
for line in sys.stdin:
    req = json.loads(line)
    module, _, name = req["model"].rpartition(".")
    try:
        model = getattr(importlib.import_module(module), name)
        model.model_validate(req["body"])
        out = {"ok": True}
    except Exception as exc:  # report every failure back to the test
        out = {"ok": False, "error": f"{type(exc).__name__}: {exc}"}
    sys.stdout.write(json.dumps(out) + "\n")
    sys.stdout.flush()
"""


@pytest.fixture(scope="session")
def _sdk_worker():
    # plane-sdk and this Django project are both the package \`plane\`. Run the SDK
    # in an isolated interpreter (-I: no cwd on sys.path), where only the SDK resolves.
    proc = subprocess.Popen(
        [sys.executable, "-I", "-c", _SDK_WORKER], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, cwd="/"
    )
    yield proc
    proc.stdin.close()
    proc.wait(timeout=10)


@pytest.fixture
def sdk(_sdk_worker):
    """sdk("plane.models.customers.Customer", body): fails the test if plane-sdk would reject body.

    Accepts a DRF response's data (or a list of bodies) and returns the body for chaining.
    """

    def validate(model: str, body):
        payload = json.loads(json.dumps(body, cls=DjangoJSONEncoder))
        _sdk_worker.stdin.write(json.dumps({"model": model, "body": payload}) + "\n")
        _sdk_worker.stdin.flush()
        result = json.loads(_sdk_worker.stdout.readline())
        assert result["ok"], f"plane-sdk {model} rejects the response: {result['error']}\nbody: {payload}"
        return payload

    return validate
