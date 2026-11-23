# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
The self-service project invitation list is routed to
``UserProjectInvitationsViewset`` but the viewset does not implement it, so
``BaseViewSet`` refuses the request. An account registered on an invited
address, verified or not, cannot read the invite token there: the token reaches
the invitee only in the invitation email, and ``ProjectJoinEndpoint`` asks for
it.

If this list is ever implemented, it has to require a verified email, as
``UserWorkspaceInvitationsViewSet`` does.
"""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Project, ProjectMemberInvite
from plane.tests.factories import UserFactory

INVITEE_EMAIL = "invitee@plane.so"


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("is_email_verified", [False, True])
def test_invitee_cannot_list_project_invitations_or_their_tokens(workspace, is_email_verified):
    project = Project.objects.create(name="Invite Project", identifier="INV", workspace=workspace)
    invite = ProjectMemberInvite.objects.create(project=project, email=INVITEE_EMAIL, token="invite-token", role=15)
    client = APIClient()
    client.force_authenticate(user=UserFactory(email=INVITEE_EMAIL, is_email_verified=is_email_verified))

    response = client.get(reverse("user-project-invitations", kwargs={"slug": workspace.slug}))

    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert invite.token not in response.content.decode()
