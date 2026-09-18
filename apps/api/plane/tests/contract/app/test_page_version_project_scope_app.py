# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Regression tests for GHSA-g49r-p85q-qq2w / GHSA-ghcr-frqr-6pqr.

ProjectPagePermission verified that the caller was a member of the URL
project_id, but PageVersionEndpoint resolved the page (and its versions) by
workspace + page_id only. A member of one project could therefore read the
page versions of a public page belonging to a *different* project in the same
workspace via that project's URL.
"""

import uuid

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import (
    Page,
    PageVersion,
    Project,
    ProjectMember,
    ProjectPage,
    User,
)


def _page_versions_url(slug, project_id, page_id, pk=None):
    base = f"/api/workspaces/{slug}/projects/{project_id}/pages/{page_id}/versions/"
    return f"{base}{pk}/" if pk else base


def _make_project(workspace, identifier):
    return Project.objects.create(
        name=f"Project {identifier}",
        identifier=identifier,
        workspace=workspace,
    )


def _make_page(workspace, project, owner, access=Page.PUBLIC_ACCESS):
    page = Page.objects.create(
        workspace=workspace,
        owned_by=owner,
        access=access,
        name="Secret page",
    )
    ProjectPage.objects.create(workspace=workspace, project=project, page=page)
    return page


def _make_version(workspace, page, owner):
    return PageVersion.objects.create(
        workspace=workspace,
        page=page,
        owned_by=owner,
        description_html="<p>secret</p>",
    )


@pytest.mark.contract
class TestPageVersionProjectScope:
    """The attacker (create_user / session_client) is an active member of
    project_a only. Victim owns a public page in project_b."""

    def _setup(self, workspace, attacker):
        victim = User.objects.create(email="victim@plane.so", username=f"victim_{uuid.uuid4().hex[:8]}")

        project_a = _make_project(workspace, "PRJA")
        project_b = _make_project(workspace, "PRJB")

        # Attacker is an active member of project A only.
        ProjectMember.objects.create(workspace=workspace, project=project_a, member=attacker, role=20)

        # Public page + version living in project B (attacker is NOT a member).
        page_b = _make_page(workspace, project_b, victim)
        version_b = _make_version(workspace, page_b, victim)

        return victim, project_a, project_b, page_b, version_b

    @pytest.mark.django_db
    def test_cross_project_version_list_denied(self, session_client, workspace, create_user):
        """Listing another project's page versions via a project the attacker
        belongs to must be denied (was a 200 leak)."""
        _, project_a, _, page_b, _ = self._setup(workspace, create_user)

        response = session_client.get(_page_versions_url(workspace.slug, project_a.id, page_b.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_cross_project_version_detail_denied(self, session_client, workspace, create_user):
        """Reading a single cross-project page version must be denied."""
        _, project_a, _, page_b, version_b = self._setup(workspace, create_user)

        response = session_client.get(
            _page_versions_url(workspace.slug, project_a.id, page_b.id, pk=version_b.id)
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_same_project_public_page_versions_allowed(self, session_client, workspace, create_user):
        """A public page that genuinely belongs to the attacker's project is
        still readable, and its versions are returned."""
        victim, project_a, _, _, _ = self._setup(workspace, create_user)

        # Public page owned by the victim but linked to project A (attacker is a
        # member of A). Exercises the public-page access branch (not owner).
        page_a = _make_page(workspace, project_a, victim)
        version_a = _make_version(workspace, page_a, victim)

        response = session_client.get(_page_versions_url(workspace.slug, project_a.id, page_a.id))

        assert response.status_code == status.HTTP_200_OK
        returned_ids = {str(item["id"]) for item in response.json()}
        assert str(version_a.id) in returned_ids

    @pytest.mark.django_db
    def test_revoked_project_link_denied(self, session_client, workspace, create_user):
        """A page whose ProjectPage link to the attacker's project was
        soft-deleted (page removed from the project) must be denied, even
        though the attacker is a member of that project."""
        victim, project_a, _, _, _ = self._setup(workspace, create_user)

        page = Page.objects.create(
            workspace=workspace, owned_by=victim, access=Page.PUBLIC_ACCESS, name="Removed page"
        )
        # Link exists but is soft-deleted → the page no longer belongs to A.
        ProjectPage.objects.create(
            workspace=workspace, project=project_a, page=page, deleted_at=timezone.now()
        )
        _make_version(workspace, page, victim)

        response = session_client.get(_page_versions_url(workspace.slug, project_a.id, page.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_cross_project_version_list_not_a_member_anywhere(self, session_client, workspace, create_user):
        """Sanity: a project the attacker is not a member of is denied outright."""
        _, _, project_b, page_b, _ = self._setup(workspace, create_user)

        response = session_client.get(_page_versions_url(workspace.slug, project_b.id, page_b.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN
