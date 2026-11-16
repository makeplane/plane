# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.urls import reverse
from rest_framework import status

from plane.db.models import Account


@pytest.mark.contract
class TestAccountEndpoint:
    @pytest.mark.django_db
    def test_connected_accounts_exclude_provider_tokens(self, session_client, create_user):
        """Connected accounts are listed without the stored provider tokens."""
        account = Account.objects.create(
            user=create_user,
            provider="github",
            provider_account_id="12345",
            access_token="provider-access-token",
            refresh_token="provider-refresh-token",
            id_token="provider-id-token",
        )

        list_response = session_client.get(reverse("accounts"))
        detail_response = session_client.get(reverse("accounts", kwargs={"pk": account.pk}))

        assert list_response.status_code == status.HTTP_200_OK
        assert detail_response.status_code == status.HTTP_200_OK
        assert len(list_response.data) == 1
        for data in (list_response.data[0], detail_response.data):
            assert str(data["id"]) == str(account.pk)
            assert data["provider"] == "github"
            assert not {"access_token", "refresh_token", "id_token"} & set(data)
