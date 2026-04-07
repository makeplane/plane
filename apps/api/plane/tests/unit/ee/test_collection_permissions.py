# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import pytest
from django.urls import reverse
from rest_framework import status

from plane.app.permissions import ROLE
from plane.db.models import Page, User, WorkspaceMember
from plane.ee.bgtasks.page_update import nested_page_update
from plane.ee.utils.page_events import MoveActionEnum, PageAction
from plane.ee.utils.page_operations import move_entities_to_project
from plane.ee.models import Collection, PageCollection
from plane.tests.factories import PageFactory, ProjectFactory, ProjectMemberFactory


def create_workspace_user(email, first_name, role, workspace):
    user = User.objects.create(email=email, first_name=first_name, last_name="User")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role, is_active=True)
    return user


@pytest.mark.django_db
@pytest.mark.unit
class TestCollectionPermissions:
    def test_collection_owner_can_reorder_collection(self, api_client, workspace):
        owner = create_workspace_user("owner@plane.so", "Owner", ROLE.MEMBER.value, workspace)
        collection = Collection.objects.create(
            workspace=workspace,
            owned_by=owner,
            name="Docs",
            sort_order=10000,
        )
        api_client.force_authenticate(user=owner)

        response = api_client.patch(
            reverse("collection-detail", kwargs={"slug": workspace.slug, "collection_id": collection.id}),
            {"sort_order": 25000},
            format="json",
        )

        collection.refresh_from_db()
        assert response.status_code == status.HTTP_200_OK
        assert collection.sort_order == 25000

    def test_workspace_admin_can_reorder_collection(self, api_client, workspace):
        owner = create_workspace_user("owner@plane.so", "Owner", ROLE.MEMBER.value, workspace)
        admin = create_workspace_user("admin@plane.so", "Admin", ROLE.ADMIN.value, workspace)
        collection = Collection.objects.create(workspace=workspace, owned_by=owner, name="Docs", sort_order=10000)
        api_client.force_authenticate(user=admin)

        response = api_client.patch(
            reverse("collection-detail", kwargs={"slug": workspace.slug, "collection_id": collection.id}),
            {"sort_order": 32000},
            format="json",
        )

        collection.refresh_from_db()
        assert response.status_code == status.HTTP_200_OK
        assert collection.sort_order == 32000

    def test_unrelated_member_cannot_reorder_collection(self, api_client, workspace):
        owner = create_workspace_user("owner@plane.so", "Owner", ROLE.MEMBER.value, workspace)
        unrelated_member = create_workspace_user("member@plane.so", "Member", ROLE.MEMBER.value, workspace)
        collection = Collection.objects.create(workspace=workspace, owned_by=owner, name="Docs", sort_order=10000)
        api_client.force_authenticate(user=unrelated_member)

        response = api_client.patch(
            reverse("collection-detail", kwargs={"slug": workspace.slug, "collection_id": collection.id}),
            {"sort_order": 32000},
            format="json",
        )

        collection.refresh_from_db()
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert collection.sort_order == 10000

    def test_member_cannot_add_other_users_page_to_collection(self, api_client, workspace, create_user):
        collection_owner = create_workspace_user("owner@plane.so", "Owner", ROLE.MEMBER.value, workspace)
        requester = create_workspace_user("member@plane.so", "Member", ROLE.MEMBER.value, workspace)
        page = PageFactory(workspace=workspace, owned_by=collection_owner, is_global=True)
        collection = Collection.objects.create(
            workspace=workspace,
            owned_by=collection_owner,
            name="Docs",
        )
        api_client.force_authenticate(user=requester)

        response = api_client.post(
            reverse("collection-pages", kwargs={"slug": workspace.slug, "collection_id": collection.id}),
            {"page_ids": [str(page.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert PageCollection.objects.filter(collection=collection, page=page).exists() is False

    def test_workspace_admin_can_add_other_users_page_to_collection(self, api_client, workspace, create_user):
        page_owner = create_workspace_user("owner@plane.so", "Owner", ROLE.MEMBER.value, workspace)
        workspace_admin = create_workspace_user("admin@plane.so", "Admin", ROLE.ADMIN.value, workspace)
        page = PageFactory(workspace=workspace, owned_by=page_owner, is_global=True)
        collection = Collection.objects.create(
            workspace=workspace,
            owned_by=page_owner,
            name="Docs",
        )
        api_client.force_authenticate(user=workspace_admin)

        response = api_client.post(
            reverse("collection-pages", kwargs={"slug": workspace.slug, "collection_id": collection.id}),
            {"page_ids": [str(page.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert PageCollection.objects.filter(collection=collection, page=page).exists()

    def test_add_page_batch_fails_when_any_page_is_unauthorized(self, api_client, workspace, create_user):
        page_owner = create_workspace_user("owner@plane.so", "Owner", ROLE.MEMBER.value, workspace)
        requester = create_workspace_user("member@plane.so", "Member", ROLE.MEMBER.value, workspace)
        owned_page = PageFactory(workspace=workspace, owned_by=requester, is_global=True)
        unowned_page = PageFactory(workspace=workspace, owned_by=page_owner, is_global=True)
        collection = Collection.objects.create(
            workspace=workspace,
            owned_by=requester,
            name="Docs",
        )
        api_client.force_authenticate(user=requester)

        response = api_client.post(
            reverse("collection-pages", kwargs={"slug": workspace.slug, "collection_id": collection.id}),
            {"page_ids": [str(owned_page.id), str(unowned_page.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert PageCollection.objects.filter(collection=collection).count() == 0

    def test_page_owner_can_remove_page_from_other_users_collection(self, api_client, workspace, create_user):
        collection_owner = create_workspace_user("owner@plane.so", "Owner", ROLE.MEMBER.value, workspace)
        page_owner = create_workspace_user("page-owner@plane.so", "Page", ROLE.MEMBER.value, workspace)
        page = PageFactory(workspace=workspace, owned_by=page_owner, is_global=True)
        collection = Collection.objects.create(
            workspace=workspace,
            owned_by=collection_owner,
            name="Docs",
        )
        page_collection = PageCollection.objects.create(
            workspace=workspace,
            collection=collection,
            page=page,
        )
        api_client.force_authenticate(user=page_owner)

        response = api_client.delete(
            reverse(
                "collection-page-detail",
                kwargs={"slug": workspace.slug, "collection_id": collection.id, "pk": page_collection.id},
            )
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert PageCollection.objects.filter(id=page_collection.id).exists() is False
        assert Page.objects.filter(id=page.id).exists()

    def test_page_owner_can_reorder_page_within_collection(self, api_client, workspace):
        collection_owner = create_workspace_user("owner@plane.so", "Owner", ROLE.MEMBER.value, workspace)
        page_owner = create_workspace_user("page-owner@plane.so", "Page", ROLE.MEMBER.value, workspace)
        page = PageFactory(workspace=workspace, owned_by=page_owner, is_global=True)
        collection = Collection.objects.create(workspace=workspace, owned_by=collection_owner, name="Docs")
        page_collection = PageCollection.objects.create(
            workspace=workspace,
            collection=collection,
            page=page,
            sort_order=10000,
        )
        api_client.force_authenticate(user=page_owner)

        response = api_client.patch(
            reverse(
                "collection-page-detail",
                kwargs={"slug": workspace.slug, "collection_id": collection.id, "pk": page_collection.id},
            ),
            {"sort_order": 25000},
            format="json",
        )

        page_collection.refresh_from_db()
        assert response.status_code == status.HTTP_200_OK
        assert page_collection.sort_order == 25000

    def test_workspace_admin_can_move_page_across_collections(self, api_client, workspace):
        page_owner = create_workspace_user("owner@plane.so", "Owner", ROLE.MEMBER.value, workspace)
        workspace_admin = create_workspace_user("admin@plane.so", "Admin", ROLE.ADMIN.value, workspace)
        source_collection_owner = create_workspace_user(
            "collection-owner@plane.so",
            "Collection",
            ROLE.MEMBER.value,
            workspace,
        )
        page = PageFactory(workspace=workspace, owned_by=page_owner, is_global=True)
        source_collection = Collection.objects.create(
            workspace=workspace,
            owned_by=source_collection_owner,
            name="Source",
        )
        target_collection = Collection.objects.create(
            workspace=workspace,
            owned_by=source_collection_owner,
            name="Target",
        )
        page_collection = PageCollection.objects.create(
            workspace=workspace,
            collection=source_collection,
            page=page,
            sort_order=10000,
        )
        api_client.force_authenticate(user=workspace_admin)

        response = api_client.patch(
            reverse(
                "collection-page-detail",
                kwargs={"slug": workspace.slug, "collection_id": source_collection.id, "pk": page_collection.id},
            ),
            {"collection": str(target_collection.id), "sort_order": 5000},
            format="json",
        )

        page_collection.refresh_from_db()
        assert response.status_code == status.HTTP_200_OK
        assert page_collection.collection_id == target_collection.id
        assert page_collection.sort_order == 5000

    def test_unrelated_member_cannot_reorder_page_within_collection(self, api_client, workspace):
        collection_owner = create_workspace_user("owner@plane.so", "Owner", ROLE.MEMBER.value, workspace)
        page_owner = create_workspace_user("page-owner@plane.so", "Page", ROLE.MEMBER.value, workspace)
        unrelated_member = create_workspace_user("member@plane.so", "Member", ROLE.MEMBER.value, workspace)
        page = PageFactory(workspace=workspace, owned_by=page_owner, is_global=True)
        collection = Collection.objects.create(workspace=workspace, owned_by=collection_owner, name="Docs")
        page_collection = PageCollection.objects.create(
            workspace=workspace,
            collection=collection,
            page=page,
            sort_order=10000,
        )
        api_client.force_authenticate(user=unrelated_member)

        response = api_client.patch(
            reverse(
                "collection-page-detail",
                kwargs={"slug": workspace.slug, "collection_id": collection.id, "pk": page_collection.id},
            ),
            {"sort_order": 25000},
            format="json",
        )

        page_collection.refresh_from_db()
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert page_collection.sort_order == 10000

    def test_default_workspace_move_creates_explicit_membership(self, api_client, workspace):
        page_owner = create_workspace_user("owner@plane.so", "Owner", ROLE.MEMBER.value, workspace)
        page = PageFactory(workspace=workspace, owned_by=page_owner, is_global=True)
        default_collection = Collection.objects.create(
            workspace=workspace,
            owned_by=page_owner,
            name="Workspace",
            is_default=True,
        )
        api_client.force_authenticate(user=page_owner)

        response = api_client.post(
            reverse("collection-pages", kwargs={"slug": workspace.slug, "collection_id": default_collection.id}),
            {"page_ids": [str(page.id)], "sort_orders": {str(page.id): 4000}},
            format="json",
        )

        page_collection = PageCollection.objects.get(collection=default_collection, page=page)
        assert response.status_code == status.HTTP_200_OK
        assert page_collection.sort_order == 4000

    def test_nested_pages_receive_explicit_collection_order_on_move(self, api_client, workspace):
        page_owner = create_workspace_user("owner@plane.so", "Owner", ROLE.MEMBER.value, workspace)
        parent_page = PageFactory(workspace=workspace, owned_by=page_owner, is_global=True, sort_order=10000)
        child_page = PageFactory(
            workspace=workspace,
            owned_by=page_owner,
            is_global=True,
            parent=parent_page,
            sort_order=12000,
        )
        collection = Collection.objects.create(workspace=workspace, owned_by=page_owner, name="Docs")
        api_client.force_authenticate(user=page_owner)

        response = api_client.post(
            reverse("collection-pages", kwargs={"slug": workspace.slug, "collection_id": collection.id}),
            {"page_ids": [str(parent_page.id)], "sort_orders": {str(parent_page.id): 20000}},
            format="json",
        )

        parent_membership = PageCollection.objects.get(collection=collection, page=parent_page)
        child_membership = PageCollection.objects.get(collection=collection, page=child_page)

        assert response.status_code == status.HTTP_200_OK
        assert parent_membership.sort_order == 20000
        assert child_membership.sort_order == child_page.sort_order

    def test_collection_page_list_excludes_ineligible_memberships(self, api_client, workspace):
        page_owner = create_workspace_user("owner@plane.so", "Owner", ROLE.MEMBER.value, workspace)
        collection = Collection.objects.create(workspace=workspace, owned_by=page_owner, name="Docs")
        active_page = PageFactory(
            workspace=workspace,
            owned_by=page_owner,
            is_global=True,
            access=Page.PUBLIC_ACCESS,
            archived_at=None,
        )
        deleted_page = PageFactory(
            workspace=workspace,
            owned_by=page_owner,
            is_global=True,
            access=Page.PUBLIC_ACCESS,
            archived_at=None,
        )
        deleted_page.delete()

        PageCollection.objects.create(workspace=workspace, collection=collection, page=active_page)
        PageCollection.objects.create(workspace=workspace, collection=collection, page=deleted_page)

        api_client.force_authenticate(user=page_owner)
        response = api_client.get(
            reverse("collection-pages", kwargs={"slug": workspace.slug, "collection_id": collection.id})
        )

        assert response.status_code == status.HTTP_200_OK
        assert [item["page_id"] for item in response.data] == [str(active_page.id)]
        assert all(item["collection_id"] == str(collection.id) for item in response.data)

    def test_collection_to_collection_descendants_keep_membership_order_on_move(self, workspace):
        page_owner = create_workspace_user("owner@plane.so", "Owner", ROLE.MEMBER.value, workspace)
        parent_page = PageFactory(workspace=workspace, owned_by=page_owner, is_global=True, sort_order=10000)
        child_page = PageFactory(
            workspace=workspace,
            owned_by=page_owner,
            is_global=True,
            parent=parent_page,
            sort_order=12000,
        )
        source_collection = Collection.objects.create(workspace=workspace, owned_by=page_owner, name="Source")
        target_collection = Collection.objects.create(workspace=workspace, owned_by=page_owner, name="Target")

        PageCollection.objects.create(
            workspace=workspace, collection=source_collection, page=parent_page, sort_order=10000
        )
        PageCollection.objects.create(
            workspace=workspace, collection=source_collection, page=child_page, sort_order=12000
        )

        nested_page_update(
            page_id=str(parent_page.id),
            action=PageAction.MOVED,
            slug=workspace.slug,
            user_id=str(page_owner.id),
            extra={
                "old_page_parent_id": None,
                "move_type": MoveActionEnum.COLLECTION_TO_COLLECTION.value,
                "old_entity_identifier": str(source_collection.id),
                "new_entity_identifier": str(target_collection.id),
            },
        )

        assert PageCollection.objects.filter(collection=source_collection, page=child_page).exists() is False
        moved_child_membership = PageCollection.objects.get(collection=target_collection, page=child_page)
        assert moved_child_membership.sort_order == child_page.sort_order

    def test_page_collection_save_scopes_sort_order_to_collection(self, workspace):
        page_owner = create_workspace_user("owner@plane.so", "Owner", ROLE.MEMBER.value, workspace)
        collection_a = Collection.objects.create(workspace=workspace, owned_by=page_owner, name="Collection A")
        collection_b = Collection.objects.create(workspace=workspace, owned_by=page_owner, name="Collection B")
        page_a = PageFactory(workspace=workspace, owned_by=page_owner, is_global=True)
        page_b = PageFactory(workspace=workspace, owned_by=page_owner, is_global=True)
        page_c = PageFactory(workspace=workspace, owned_by=page_owner, is_global=True)

        PageCollection.objects.create(workspace=workspace, collection=collection_a, page=page_a, sort_order=10000)
        PageCollection.objects.create(workspace=workspace, collection=collection_b, page=page_b, sort_order=90000)

        new_page_collection = PageCollection.objects.create(workspace=workspace, collection=collection_a, page=page_c)

        assert new_page_collection.sort_order == 20000

    def test_making_a_page_private_removes_its_collection_memberships(self, workspace):
        page_owner = create_workspace_user("owner@plane.so", "Owner", ROLE.MEMBER.value, workspace)
        parent_page = PageFactory(workspace=workspace, owned_by=page_owner, is_global=True, access=Page.PUBLIC_ACCESS)
        child_page = PageFactory(
            workspace=workspace,
            owned_by=page_owner,
            is_global=True,
            access=Page.PUBLIC_ACCESS,
            parent=parent_page,
        )
        collection = Collection.objects.create(workspace=workspace, owned_by=page_owner, name="Docs")

        PageCollection.objects.create(workspace=workspace, collection=collection, page=parent_page)
        PageCollection.objects.create(workspace=workspace, collection=collection, page=child_page)

        nested_page_update(
            page_id=str(parent_page.id),
            action=PageAction.MADE_PRIVATE,
            slug=workspace.slug,
            user_id=str(page_owner.id),
        )

        assert (
            PageCollection.objects.filter(collection=collection, page__in=[parent_page, child_page]).exists() is False
        )

    def test_moving_pages_to_project_removes_collection_memberships(self, workspace, create_user):
        project = ProjectFactory(workspace=workspace, created_by=create_user, updated_by=create_user)
        ProjectMemberFactory(project=project, member=create_user, role=ROLE.ADMIN.value)

        collection = Collection.objects.create(
            workspace=workspace,
            owned_by=create_user,
            name="Docs",
        )
        parent_page = PageFactory(workspace=workspace, owned_by=create_user, is_global=True)
        child_page = PageFactory(
            workspace=workspace,
            owned_by=create_user,
            is_global=True,
            parent=parent_page,
        )

        PageCollection.objects.create(workspace=workspace, collection=collection, page=parent_page)
        PageCollection.objects.create(workspace=workspace, collection=collection, page=child_page)

        move_entities_to_project(
            [str(parent_page.id), str(child_page.id)],
            workspace.slug,
            str(create_user.id),
            str(project.id),
        )

        assert not PageCollection.objects.filter(page_id__in=[parent_page.id, child_page.id]).exists()

    def test_unrelated_member_cannot_remove_page_from_collection(self, api_client, workspace, create_user):
        collection_owner = create_workspace_user("owner@plane.so", "Owner", ROLE.MEMBER.value, workspace)
        page_owner = create_workspace_user("page-owner@plane.so", "Page", ROLE.MEMBER.value, workspace)
        unrelated_member = create_workspace_user("member@plane.so", "Member", ROLE.MEMBER.value, workspace)
        page = PageFactory(workspace=workspace, owned_by=page_owner, is_global=True)
        collection = Collection.objects.create(
            workspace=workspace,
            owned_by=collection_owner,
            name="Docs",
        )
        page_collection = PageCollection.objects.create(
            workspace=workspace,
            collection=collection,
            page=page,
        )
        api_client.force_authenticate(user=unrelated_member)

        response = api_client.delete(
            reverse(
                "collection-page-detail",
                kwargs={"slug": workspace.slug, "collection_id": collection.id, "pk": page_collection.id},
            )
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert PageCollection.objects.filter(id=page_collection.id).exists()

    def test_workspace_page_delete_allows_owner_or_admin_only(self, api_client, workspace, create_user):
        page_owner = create_workspace_user("owner@plane.so", "Owner", ROLE.MEMBER.value, workspace)
        workspace_admin = create_workspace_user("admin@plane.so", "Admin", ROLE.ADMIN.value, workspace)
        unrelated_member = create_workspace_user("member@plane.so", "Member", ROLE.MEMBER.value, workspace)
        page = PageFactory(
            workspace=workspace,
            owned_by=page_owner,
            is_global=True,
            archived_at="2026-01-01T00:00:00Z",
        )

        api_client.force_authenticate(user=unrelated_member)
        response = api_client.delete(
            reverse("workspace-page-detail", kwargs={"slug": workspace.slug, "pk": page.id})
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

        api_client.force_authenticate(user=workspace_admin)
        response = api_client.delete(
            reverse("workspace-page-detail", kwargs={"slug": workspace.slug, "pk": page.id})
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
