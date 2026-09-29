# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.core.management import call_command

from plane.db.models import APIToken, Project, ProjectMember, User, Workspace, WorkspaceMember


@pytest.mark.django_db
def test_seed_public_project_pages_smoke_creates_idempotent_api_key_member(capsys):
    api_key = "smoke-api-key-not-for-logs"

    call_command("seed_public_project_pages_smoke", api_key=api_key)
    call_command("seed_public_project_pages_smoke", api_key=api_key)

    user = User.objects.get(email="smoke-pages@plane.local")
    workspace = Workspace.objects.get(slug="smoke-pages-workspace")
    project = Project.objects.get(workspace=workspace, identifier="SMOKE")

    assert WorkspaceMember.objects.filter(workspace=workspace, member=user, role=20).count() == 1
    assert ProjectMember.objects.filter(project=project, workspace=workspace, member=user, role=20).count() == 1
    assert APIToken.objects.filter(user=user, token=api_key, is_active=True).count() == 1
    output = capsys.readouterr().out
    assert output.count("Smoke Pages seed ready") == 2
    assert api_key not in output
