# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Module write endpoints bind the path module_id / issue_id to the URL project.

``create_module_issues``, ``create_issue_modules`` and module-link create return 404
and write nothing when the path module or issue belongs to another project.
``create_issue_modules`` only links body module ids that belong to the URL project.
"""

from unittest import mock

import pytest
from rest_framework import status

from plane.db.models import Issue, Module, ModuleIssue, ModuleLink, Project, ProjectMember


@pytest.fixture
def setup(db, workspace, create_user):
    project = Project.objects.create(name="A", identifier="PA", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    other = Project.objects.create(name="B", identifier="PB", workspace=workspace, created_by=create_user)
    return {
        "project": project,
        "issue": Issue.objects.create(name="A1", workspace=workspace, project=project),
        "module": Module.objects.create(name="MA", project=project, workspace=workspace),
        "other_issue": Issue.objects.create(name="B1", workspace=workspace, project=other),
        "other_module": Module.objects.create(name="MB", project=other, workspace=workspace),
    }


def base(workspace, project):
    return f"/api/workspaces/{workspace.slug}/projects/{project.id}"


@pytest.mark.contract
@pytest.mark.django_db
@mock.patch("plane.app.views.module.issue.issue_activity")
def test_module_issues_require_module_in_url_project(activity, session_client, workspace, setup):
    s = setup
    url = f"{base(workspace, s['project'])}/modules/{{}}/issues/"

    response = session_client.post(url.format(s["other_module"].id), {"issues": [str(s["issue"].id)]}, format="json")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert not ModuleIssue.objects.filter(module=s["other_module"]).exists()

    response = session_client.post(url.format(s["module"].id), {"issues": [str(s["issue"].id)]}, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    assert ModuleIssue.objects.filter(module=s["module"], issue=s["issue"]).exists()


@pytest.mark.contract
@pytest.mark.django_db
@mock.patch("plane.app.views.module.issue.issue_activity")
def test_issue_modules_require_issue_in_url_project(activity, session_client, workspace, setup):
    s = setup
    url = f"{base(workspace, s['project'])}/issues/{{}}/modules/"

    response = session_client.post(url.format(s["other_issue"].id), {"modules": [str(s["module"].id)]}, format="json")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert not ModuleIssue.objects.filter(issue=s["other_issue"]).exists()

    response = session_client.post(url.format(s["issue"].id), {"modules": [str(s["module"].id)]}, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    assert ModuleIssue.objects.filter(module=s["module"], issue=s["issue"]).exists()


@pytest.mark.contract
@pytest.mark.django_db
@mock.patch("plane.app.views.module.issue.issue_activity")
def test_issue_modules_only_link_modules_in_url_project(activity, session_client, workspace, setup):
    s = setup
    url = f"{base(workspace, s['project'])}/issues/{s['issue'].id}/modules/"
    body = {"modules": [str(s["other_module"].id), str(s["module"].id)]}

    response = session_client.post(url, body, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    assert not ModuleIssue.objects.filter(module=s["other_module"]).exists()
    assert ModuleIssue.objects.filter(module=s["module"], issue=s["issue"]).exists()
    assert activity.delay.call_count == 1


@pytest.mark.contract
@pytest.mark.django_db
def test_module_link_requires_module_in_url_project(session_client, workspace, setup):
    s = setup
    url = f"{base(workspace, s['project'])}/modules/{{}}/module-links/"
    body = {"url": "https://example.com", "title": "Spec"}

    response = session_client.post(url.format(s["other_module"].id), body, format="json")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert not ModuleLink.objects.filter(module=s["other_module"]).exists()

    response = session_client.post(url.format(s["module"].id), body, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    assert ModuleLink.objects.filter(module=s["module"]).exists()
