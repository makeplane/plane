# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""PATCH must not give a row the external id and source another row has.

The work item, cycle, module and state PATCH endpoints checked for a duplicate
only when ``external_id`` was in the body and differed from the stored one, and
the label PATCH only when both fields were sent, so changing just one of them
created a duplicate pair. Lookups by that pair then raised MultipleObjectsReturned
(500).
"""

import pytest
from rest_framework import status

from plane.db.models import Cycle, Issue, Label, Module, Project, ProjectMember, State


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Ext", identifier="EXT", workspace=workspace, created_by=create_user, cycle_view=True, module_view=True
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


def make(kind, project, create_user, source, name=None):
    name = name or f"From {source}"
    common = {"project": project, "workspace": project.workspace, "external_id": "1", "external_source": source}
    if kind == "issues":
        return Issue.objects.create(name=name, **common)
    if kind == "cycles":
        return Cycle.objects.create(name=name, owned_by=create_user, **common)
    if kind == "modules":
        return Module.objects.create(name=name, **common)
    if kind == "labels":
        return Label.objects.create(name=name, **common)
    return State.objects.create(name=name, color="#000000", group="backlog", **common)


MODELS = {"issues": Issue, "cycles": Cycle, "modules": Module, "states": State, "labels": Label}


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("kind", list(MODELS))
@pytest.mark.parametrize(
    "body",
    [
        {"external_source": "jira"},
        {"external_id": "1", "external_source": "jira"},
    ],
)
def test_patch_into_an_existing_external_pair_is_409(api_key_client, workspace, project, create_user, kind, body):
    make(kind, project, create_user, "jira")
    github = make(kind, project, create_user, "github")
    url = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/{kind}/{github.id}/"

    response = api_key_client.patch(url, body, format="json")

    assert response.status_code == status.HTTP_409_CONFLICT
    assert MODELS[kind].objects.filter(project=project, external_id="1", external_source="jira").count() == 1


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("kind", list(MODELS))
def test_patch_keeping_its_own_pair_still_works(api_key_client, workspace, project, create_user, kind):
    make(kind, project, create_user, "jira")
    github = make(kind, project, create_user, "github")
    url = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/{kind}/{github.id}/"

    response = api_key_client.patch(
        url, {"name": "Renamed", "external_id": "1", "external_source": "github"}, format="json"
    )

    assert response.status_code == status.HTTP_200_OK


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("kind", list(MODELS))
def test_resending_its_own_pair_works_even_with_existing_duplicates(
    api_key_client, workspace, project, create_user, kind
):
    first = make(kind, project, create_user, "jira")
    make(kind, project, create_user, "jira", name="Copy")  # a duplicate left by the old check
    url = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/{kind}/{first.id}/"

    response = api_key_client.patch(url, {"external_id": "1", "external_source": "jira"}, format="json")

    assert response.status_code == status.HTTP_200_OK
