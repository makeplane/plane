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

from datetime import datetime

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from plane.app.permissions import ROLE
from plane.db.models import Page, UserFavorite
from plane.ee.models import Collection, PageCollection
from plane.tests.factories import PageFactory, UserFactory, WorkspaceMemberFactory


def create_workspace_user(workspace, email, first_name, role=ROLE.MEMBER.value):
    user = UserFactory(email=email, first_name=first_name, last_name="User")
    WorkspaceMemberFactory(workspace=workspace, member=user, role=role, is_active=True)
    return user


@pytest.fixture(autouse=True)
def enable_workspace_pages_feature(monkeypatch):
    class _FeatureClient:
        def get_boolean_value(self, *args, **kwargs):
            return True

    monkeypatch.setattr("plane.payment.flags.flag_decorator.openfeature.api.set_provider", lambda *args, **kwargs: None)
    monkeypatch.setattr("plane.payment.flags.flag_decorator.openfeature.api.get_client", lambda: _FeatureClient())


@pytest.mark.django_db
@pytest.mark.unit
class TestCollectionPagesEndpoint:
    def test_collection_pages_search_returns_only_addable_owned_root_pages_for_custom_collection(
        self, api_client, workspace
    ):
        requester = create_workspace_user(workspace, "member@plane.so", "Member")
        other_user = create_workspace_user(workspace, "other@plane.so", "Other")
        collection = Collection.objects.create(workspace=workspace, owned_by=requester, name="Docs", sort_order=10000)

        eligible_root = PageFactory(
            workspace=workspace,
            owned_by=requester,
            name="Member Alpha",
            is_global=True,
            sort_order=10000,
        )
        PageFactory(
            workspace=workspace,
            owned_by=requester,
            name="Member Alpha Nested",
            parent=eligible_root,
            is_global=True,
        )
        PageFactory(
            workspace=workspace,
            owned_by=requester,
            name="Member Private",
            access=Page.PRIVATE_ACCESS,
            is_global=True,
        )
        PageFactory(workspace=workspace, owned_by=other_user, name="Other Alpha", is_global=True)

        existing_page = PageFactory(workspace=workspace, owned_by=requester, name="Existing Alpha", is_global=True)
        PageCollection.objects.create(workspace=workspace, collection=collection, page=existing_page, sort_order=20000)

        api_client.force_authenticate(user=requester)
        response = api_client.get(
            reverse("collection-pages-search", kwargs={"slug": workspace.slug, "collection_id": collection.id}),
            {"search": "Alpha"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert [item["name"] for item in response.data] == ["Member Alpha"]

    def test_default_collection_pages_filter_and_paginate_root_results(self, api_client, workspace):
        requester = create_workspace_user(workspace, "admin@plane.so", "Admin", ROLE.ADMIN.value)
        creator = create_workspace_user(workspace, "creator@plane.so", "Creator")
        default_collection = Collection.objects.create(
            workspace=workspace,
            owned_by=requester,
            name="General",
            is_default=True,
            sort_order=10000,
        )
        custom_collection = Collection.objects.create(
            workspace=workspace,
            owned_by=requester,
            name="Docs",
            sort_order=20000,
        )

        first_root = PageFactory(
            workspace=workspace,
            owned_by=creator,
            created_by=creator,
            updated_by=creator,
            created_at=timezone.make_aware(datetime(2026, 4, 1, 10, 0, 0)),
            name="Alpha Root",
            is_global=True,
            sort_order=10000,
        )
        second_root = PageFactory(
            workspace=workspace,
            owned_by=creator,
            created_by=creator,
            updated_by=creator,
            created_at=timezone.make_aware(datetime(2026, 4, 10, 10, 0, 0)),
            name="Beta Root",
            is_global=True,
            sort_order=20000,
        )
        nested_child = PageFactory(
            workspace=workspace,
            owned_by=creator,
            created_by=creator,
            updated_by=creator,
            created_at=timezone.make_aware(datetime(2026, 4, 5, 10, 0, 0)),
            name="Nested Child",
            parent=first_root,
            is_global=True,
            sort_order=15000,
        )
        hidden_root = PageFactory(
            workspace=workspace,
            owned_by=creator,
            created_by=creator,
            updated_by=creator,
            created_at=timezone.make_aware(datetime(2026, 4, 15, 10, 0, 0)),
            name="Hidden Root",
            is_global=True,
            sort_order=30000,
        )

        PageCollection.objects.create(
            workspace=workspace,
            collection=custom_collection,
            page=hidden_root,
            sort_order=10000,
        )

        for page in [first_root, second_root, nested_child, hidden_root]:
            UserFavorite.objects.create(
                workspace=workspace,
                user=requester,
                entity_type="page",
                entity_identifier=page.id,
            )

        api_client.force_authenticate(user=requester)
        url = reverse("collection-pages", kwargs={"slug": workspace.slug, "collection_id": default_collection.id})
        query_params = {
            "created_by": str(creator.id),
            "favorites": True,
            "created_at__gte": "2026-04-01",
            "created_at__lte": "2026-04-30",
            "per_page": 1,
        }

        first_page_response = api_client.get(url, query_params)
        second_page_response = api_client.get(
            url,
            {
                **query_params,
                "cursor": first_page_response.data["next_cursor"],
            },
        )

        assert first_page_response.status_code == status.HTTP_200_OK
        assert first_page_response.data["total_results"] == 2
        assert str(first_page_response.data["results"][0]["page"]["id"]) == str(first_root.id)
        assert first_page_response.data["next_page_results"] is True

        assert second_page_response.status_code == status.HTTP_200_OK
        assert second_page_response.data["total_results"] == 2
        assert str(second_page_response.data["results"][0]["page"]["id"]) == str(second_root.id)
        assert second_page_response.data["next_page_results"] is False
