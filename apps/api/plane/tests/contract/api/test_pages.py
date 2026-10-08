# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    APIToken,
    Issue,
    IssueLink,
    Page,
    Project,
    ProjectMember,
    ProjectPage,
    State,
    User,
    Workspace,
    WorkspaceMember,
)


EXACT_PAGE_HTML = """\n<h1>Design notes</h1>
<ul><li><strong>MUST</strong> preserve these bytes.</li></ul>
<table><tbody><tr><td>A</td><td>B</td></tr></tbody></table>
<pre><code class="language-json">{\"enabled\": true}</code></pre>
"""

UPDATED_PAGE_HTML = """  <h2>Updated</h2>
<p>Leading and trailing whitespace are intentional.</p>  """


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Pages Project",
        identifier="PAGE",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        workspace=workspace,
        member=create_user,
        role=20,
        is_active=True,
    )
    return project


def _user_with_project_role(workspace, project, role):
    unique_id = uuid4().hex[:8]
    user = User.objects.create(
        email=f"page-user-{unique_id}@plane.so",
        username=f"page_user_{unique_id}",
        first_name="Page",
        last_name="User",
    )
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role, is_active=True)
    ProjectMember.objects.create(
        workspace=workspace,
        project=project,
        member=user,
        role=role,
        is_active=True,
    )
    token = APIToken.objects.create(user=user, label=f"Page API {unique_id}", token=f"page-token-{unique_id}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return user, client


def _create_page(workspace, project, owner, *, name="Existing page", access=Page.PUBLIC_ACCESS, html="<p>x</p>"):
    page = Page.objects.create(
        workspace=workspace,
        owned_by=owner,
        name=name,
        access=access,
        description_html=html,
        created_by=owner,
        updated_by=owner,
    )
    ProjectPage.objects.create(
        workspace=workspace,
        project=project,
        page=page,
        created_by=owner,
        updated_by=owner,
    )
    return page


def _list_url(workspace, project):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/pages/"


def _detail_url(workspace, project, page):
    return f"{_list_url(workspace, project)}{page.id}/"


def _create_issue(workspace, project, owner, *, name="Page review"):
    state = State.objects.create(
        name="Backlog",
        workspace=workspace,
        project=project,
        group="backlog",
        default=True,
    )
    return Issue.objects.create(
        name=name,
        workspace=workspace,
        project=project,
        state=state,
        created_by=owner,
    )


def _issue_links_url(workspace, project, issue):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/work-items/{issue.id}/links/"


@pytest.mark.contract
class TestProjectPageAPI:
    @pytest.mark.django_db
    def test_create_get_update_preserves_exact_content(self, api_key_client, workspace, project, create_user):
        create_response = api_key_client.post(
            _list_url(workspace, project),
            {
                "name": "Design notes",
                "description_html": EXACT_PAGE_HTML,
                "description_json": {"untrusted": "ignored"},
                "access": Page.PUBLIC_ACCESS,
            },
            format="json",
        )

        assert create_response.status_code == status.HTTP_201_CREATED
        assert create_response.data["description_html"] == EXACT_PAGE_HTML
        assert create_response.data["description_json"] == {}
        page = Page.objects.get(pk=create_response.data["id"])
        assert page.description_html == EXACT_PAGE_HTML
        assert page.owned_by_id == create_user.id

        get_response = api_key_client.get(_detail_url(workspace, project, page))
        assert get_response.status_code == status.HTTP_200_OK
        assert get_response.data["description_html"] == EXACT_PAGE_HTML
        assert get_response.data["description_json"] == {}

        update_response = api_key_client.patch(
            _detail_url(workspace, project, page),
            {"name": "Updated design notes", "description_html": UPDATED_PAGE_HTML},
            format="json",
        )
        assert update_response.status_code == status.HTTP_200_OK, update_response.data
        assert update_response.data["description_html"] == UPDATED_PAGE_HTML
        page.refresh_from_db()
        assert page.description_html == UPDATED_PAGE_HTML

    @pytest.mark.django_db
    def test_list_is_project_scoped_and_searchable(self, api_key_client, workspace, project, create_user):
        matching_page = _create_page(workspace, project, create_user, name="Agent handbook")
        _create_page(workspace, project, create_user, name="Unrelated page")

        other_project = Project.objects.create(
            name="Other Project",
            identifier="OTHER",
            workspace=workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(
            workspace=workspace,
            project=other_project,
            member=create_user,
            role=20,
            is_active=True,
        )
        _create_page(workspace, other_project, create_user, name="Agent handbook in another project")

        response = api_key_client.get(_list_url(workspace, project), {"search": "handbook"})

        assert response.status_code == status.HTTP_200_OK
        assert [item["id"] for item in response.data["results"]] == [matching_page.id]

    @pytest.mark.django_db
    def test_page_id_cannot_cross_project_or_workspace_boundaries(
        self, api_key_client, workspace, project, create_user
    ):
        other_project = Project.objects.create(
            name="Other Project",
            identifier="OTHER",
            workspace=workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(
            workspace=workspace,
            project=other_project,
            member=create_user,
            role=20,
            is_active=True,
        )
        other_page = _create_page(workspace, other_project, create_user)

        project_response = api_key_client.get(_detail_url(workspace, project, other_page))
        assert project_response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

        other_workspace = Workspace.objects.create(
            name="Other Workspace",
            slug=f"other-{uuid4().hex[:8]}",
            owner=create_user,
        )
        WorkspaceMember.objects.create(workspace=other_workspace, member=create_user, role=20, is_active=True)
        other_workspace_project = Project.objects.create(
            name="Other Workspace Project",
            identifier="OWP",
            workspace=other_workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(
            workspace=other_workspace,
            project=other_workspace_project,
            member=create_user,
            role=20,
            is_active=True,
        )
        other_workspace_page = _create_page(other_workspace, other_workspace_project, create_user)

        workspace_response = api_key_client.get(_detail_url(workspace, project, other_workspace_page))
        assert workspace_response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

    @pytest.mark.django_db
    def test_create_rejects_parent_from_another_project(self, api_key_client, workspace, project, create_user):
        other_project = Project.objects.create(
            name="Other Project",
            identifier="OTHER",
            workspace=workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(
            workspace=workspace,
            project=other_project,
            member=create_user,
            role=20,
            is_active=True,
        )
        other_page = _create_page(workspace, other_project, create_user)

        response = api_key_client.post(
            _list_url(workspace, project),
            {
                "name": "Cross-project child",
                "description_html": "<p>child</p>",
                "parent": str(other_page.id),
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not Page.objects.filter(name="Cross-project child").exists()

    @pytest.mark.django_db
    def test_member_can_write_but_guest_is_read_only(self, workspace, project, create_user):
        page = _create_page(workspace, project, create_user)
        _, member_client = _user_with_project_role(workspace, project, role=15)
        _, guest_client = _user_with_project_role(workspace, project, role=5)

        member_create = member_client.post(
            _list_url(workspace, project),
            {"name": "Member page", "description_html": "<p>member</p>"},
            format="json",
        )
        assert member_create.status_code == status.HTTP_201_CREATED, member_create.data
        member_page = Page.objects.get(pk=member_create.data["id"])
        member_update = member_client.patch(
            _detail_url(workspace, project, member_page),
            {"name": "Member-updated page"},
            format="json",
        )
        assert member_update.status_code == status.HTTP_200_OK, member_update.data

        Project.objects.filter(pk=project.id).update(guest_view_all_features=True)
        guest_read = guest_client.get(_detail_url(workspace, project, page))
        assert guest_read.status_code == status.HTTP_200_OK
        private_page = _create_page(
            workspace,
            project,
            create_user,
            name="Private page",
            access=Page.PRIVATE_ACCESS,
        )
        guest_private_read = guest_client.get(_detail_url(workspace, project, private_page))
        assert guest_private_read.status_code == status.HTTP_404_NOT_FOUND
        guest_create = guest_client.post(
            _list_url(workspace, project),
            {"name": "Guest page", "description_html": "<p>guest</p>"},
            format="json",
        )
        assert guest_create.status_code == status.HTTP_403_FORBIDDEN
        guest_update = guest_client.patch(
            _detail_url(workspace, project, page),
            {"name": "Guest edit"},
            format="json",
        )
        assert guest_update.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_guest_visibility_honors_project_feature_setting(self, workspace, project, create_user):
        other_page = _create_page(workspace, project, create_user, name="Admin page")
        guest, guest_client = _user_with_project_role(workspace, project, role=5)
        own_page = _create_page(workspace, project, guest, name="Guest page")

        restricted_list = guest_client.get(_list_url(workspace, project))
        assert restricted_list.status_code == status.HTTP_200_OK
        assert [item["id"] for item in restricted_list.data["results"]] == [own_page.id]
        restricted_detail = guest_client.get(_detail_url(workspace, project, other_page))
        assert restricted_detail.status_code in (
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        )

        Project.objects.filter(pk=project.id).update(guest_view_all_features=True)
        enabled_list = guest_client.get(_list_url(workspace, project))
        assert enabled_list.status_code == status.HTTP_200_OK
        assert {item["id"] for item in enabled_list.data["results"]} == {
            own_page.id,
            other_page.id,
        }
        enabled_detail = guest_client.get(_detail_url(workspace, project, other_page))
        assert enabled_detail.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_soft_deleted_project_link_denies_page_access(self, api_key_client, workspace, project, create_user):
        page = _create_page(workspace, project, create_user)
        ProjectPage.objects.filter(project=project, page=page).update(deleted_at=timezone.now())

        response = api_key_client.get(_detail_url(workspace, project, page))

        assert response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

    @pytest.mark.django_db
    def test_invalid_pat_is_rejected(self, api_client, workspace, project):
        api_client.credentials(HTTP_X_API_KEY="not-a-valid-token")

        response = api_client.get(_list_url(workspace, project))

        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    @pytest.mark.django_db
    def test_html_is_sanitized_and_external_links_remain_usable(self, api_key_client, workspace, project, create_user):
        response = api_key_client.post(
            _list_url(workspace, project),
            {
                "name": "Linked page",
                "description_html": (
                    '<p onclick="alert(1)"><a href="https://example.com">link</a></p><script>alert(1)</script>'
                ),
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        stored_html = Page.objects.get(pk=response.data["id"]).description_html
        assert 'href="https://example.com"' in stored_html
        assert "onclick" not in stored_html
        assert "<script" not in stored_html

    @pytest.mark.django_db
    def test_html_update_invalidates_stale_live_editor_state(self, api_key_client, workspace, project, create_user):
        page = _create_page(workspace, project, create_user, html="<p>old</p>")
        Page.objects.filter(pk=page.id).update(
            description_binary=b"stale-yjs-state",
            description_json={"type": "doc", "content": [{"type": "paragraph"}]},
        )

        response = api_key_client.patch(
            _detail_url(workspace, project, page),
            {"description_html": "<p>agent update</p>"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK, response.data
        page.refresh_from_db()
        assert page.description_html == "<p>agent update</p>"
        assert page.description_binary is None
        assert page.description_json == {}

    @pytest.mark.django_db
    def test_page_lifecycle_fields_are_not_mass_assignable(self, api_key_client, workspace, project, create_user):
        page = _create_page(workspace, project, create_user, name="Active page")

        response = api_key_client.patch(
            _detail_url(workspace, project, page),
            {"archived_at": "2026-09-07T12:00:00Z", "is_locked": True},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.archived_at is None
        assert page.is_locked is False

    @pytest.mark.django_db
    def test_guest_cannot_update_a_page_they_own(self, workspace, project):
        guest, guest_client = _user_with_project_role(workspace, project, role=5)
        page = _create_page(workspace, project, guest, name="Guest-owned page")

        response = guest_client.patch(
            _detail_url(workspace, project, page),
            {"name": "Guest edit"},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        page.refresh_from_db()
        assert page.name == "Guest-owned page"

    @pytest.mark.django_db
    def test_create_rejects_an_archived_project(self, api_key_client, workspace, project):
        Project.objects.filter(pk=project.id).update(archived_at=timezone.now())

        response = api_key_client.post(
            _list_url(workspace, project),
            {"name": "Invisible page", "description_html": "<p>hidden</p>"},
            format="json",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert not Page.objects.filter(name="Invisible page").exists()

    @pytest.mark.django_db
    def test_update_rejects_parent_cycles(self, api_key_client, workspace, project, create_user):
        parent = _create_page(workspace, project, create_user, name="Parent")
        child = _create_page(workspace, project, create_user, name="Child")
        Page.objects.filter(pk=child.id).update(parent=parent)

        self_parent = api_key_client.patch(
            _detail_url(workspace, project, parent),
            {"parent": str(parent.id)},
            format="json",
        )
        assert self_parent.status_code == status.HTTP_400_BAD_REQUEST

        two_page_cycle = api_key_client.patch(
            _detail_url(workspace, project, parent),
            {"parent": str(child.id)},
            format="json",
        )
        assert two_page_cycle.status_code == status.HTTP_400_BAD_REQUEST
        parent.refresh_from_db()
        assert parent.parent_id is None

    @pytest.mark.django_db
    def test_delete_is_not_exposed(self, api_key_client, workspace, project, create_user):
        page = _create_page(workspace, project, create_user)

        response = api_key_client.delete(_detail_url(workspace, project, page))

        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
        assert Page.objects.filter(pk=page.id).exists()


@pytest.mark.contract
class TestProjectPageWorkItemLinks:
    @pytest.mark.django_db
    def test_create_and_list_link_preserves_exact_page_url(self, api_key_client, workspace, project, create_user):
        page = _create_page(workspace, project, create_user, name="Linked design")
        issue = _create_issue(workspace, project, create_user)
        page_url = f"https://plane.example.test/{workspace.slug}/projects/{project.id}/pages/{page.id}"

        create_response = api_key_client.post(
            _issue_links_url(workspace, project, issue),
            {"title": page.name, "url": page_url},
            format="json",
        )

        assert create_response.status_code == status.HTTP_201_CREATED, create_response.data
        assert create_response.data["title"] == page.name
        assert create_response.data["url"] == page_url
        link = IssueLink.objects.get(pk=create_response.data["id"])
        assert link.issue_id == issue.id
        assert link.project_id == project.id
        assert link.workspace_id == workspace.id
        assert link.url == page_url

        list_response = api_key_client.get(_issue_links_url(workspace, project, issue))

        assert list_response.status_code == status.HTTP_200_OK
        assert [(item["title"], item["url"]) for item in list_response.data["results"]] == [(page.name, page_url)]

        collection_delete = api_key_client.delete(_issue_links_url(workspace, project, issue))
        assert collection_delete.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
        assert IssueLink.objects.filter(pk=link.id).exists()

    @pytest.mark.django_db
    def test_archived_issue_rejects_link_list_and_create(self, api_key_client, workspace, project, create_user):
        issue = _create_issue(workspace, project, create_user)
        url = _issue_links_url(workspace, project, issue)
        initial_response = api_key_client.post(
            url,
            {"title": "Existing link", "url": "https://plane.example.test/page/existing"},
            format="json",
        )
        assert initial_response.status_code == status.HTTP_201_CREATED

        Issue.objects.filter(pk=issue.id).update(archived_at=timezone.now().date())

        list_response = api_key_client.get(url)
        create_response = api_key_client.post(
            url,
            {"title": "Archived link", "url": "https://plane.example.test/page/archived"},
            format="json",
        )

        assert list_response.status_code == status.HTTP_404_NOT_FOUND
        assert create_response.status_code == status.HTTP_404_NOT_FOUND
        assert IssueLink.objects.filter(issue=issue).count() == 1

    @pytest.mark.django_db
    def test_create_rejects_issue_from_another_project(self, api_key_client, workspace, project, create_user):
        other_project = Project.objects.create(
            name="Other Project",
            identifier="OTHER",
            workspace=workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(
            workspace=workspace,
            project=other_project,
            member=create_user,
            role=20,
            is_active=True,
        )
        other_issue = _create_issue(workspace, other_project, create_user)

        response = api_key_client.post(
            _issue_links_url(workspace, project, other_issue),
            {"title": "Cross-project page", "url": "https://plane.example.test/page/cross-project"},
            format="json",
        )

        assert response.status_code in (status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND)
        assert not IssueLink.objects.filter(issue=other_issue, project=project).exists()
        list_response = api_key_client.get(_issue_links_url(workspace, project, other_issue))
        assert list_response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_create_rejects_issue_from_another_workspace(self, api_key_client, workspace, project, create_user):
        other_workspace = Workspace.objects.create(
            name="Other Workspace",
            slug=f"other-{uuid4().hex[:8]}",
            owner=create_user,
        )
        WorkspaceMember.objects.create(
            workspace=other_workspace,
            member=create_user,
            role=20,
            is_active=True,
        )
        other_project = Project.objects.create(
            name="Other Workspace Project",
            identifier="OWP",
            workspace=other_workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(
            workspace=other_workspace,
            project=other_project,
            member=create_user,
            role=20,
            is_active=True,
        )
        other_issue = _create_issue(other_workspace, other_project, create_user)

        response = api_key_client.post(
            _issue_links_url(workspace, project, other_issue),
            {"title": "Cross-workspace page", "url": "https://plane.example.test/page/cross-workspace"},
            format="json",
        )

        assert response.status_code in (status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND)
        assert not IssueLink.objects.filter(issue=other_issue, project=project).exists()
        list_response = api_key_client.get(_issue_links_url(workspace, project, other_issue))
        assert list_response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_link_authentication_and_roles(self, api_client, workspace, project, create_user):
        issue = _create_issue(workspace, project, create_user)
        url = _issue_links_url(workspace, project, issue)

        api_client.credentials(HTTP_X_API_KEY="not-a-valid-token")
        invalid_pat_response = api_client.get(url)
        assert invalid_pat_response.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )

        _, guest_client = _user_with_project_role(workspace, project, role=5)
        guest_read = guest_client.get(url)
        assert guest_read.status_code == status.HTTP_200_OK
        guest_write = guest_client.post(
            url,
            {"title": "Guest page", "url": "https://plane.example.test/page/guest"},
            format="json",
        )
        assert guest_write.status_code == status.HTTP_403_FORBIDDEN
