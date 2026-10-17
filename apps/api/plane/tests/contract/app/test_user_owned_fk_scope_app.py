# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for user-scoped foreign keys on the ``users/me`` endpoints.

A user's notification preference row stays owned by that user, and a user's
avatar/cover can only link (and replace) the user's own asset of the matching
entity type.
"""

from unittest.mock import patch

import pytest
from rest_framework import status

from plane.authentication.adapter.base import Adapter
from plane.db.models import FileAsset, User, UserNotificationPreference

USER_URL = "/api/users/me/"
NOTIFICATION_PREFERENCE_URL = "/api/users/me/notification-preferences/"


def _user_asset_url(asset_id):
    return f"/api/assets/v2/user-assets/{asset_id}/"


@pytest.fixture
def other_user(db):
    return User.objects.create(email="other@plane.so", username="other_user")


def _asset(user, entity_type):
    return FileAsset.objects.create(
        attributes={"name": "image.png", "type": "image/png", "size": 1024},
        asset="image.png",
        size=1024,
        user=user,
        entity_type=entity_type,
        storage_metadata={"size": 1024},
    )


@pytest.mark.contract
@pytest.mark.django_db
class TestNotificationPreferenceOwner:
    def test_patch_keeps_preference_owner(self, session_client, create_user, other_user):
        """The ``user`` FK is read-only; the boolean preferences still update."""
        response = session_client.patch(
            NOTIFICATION_PREFERENCE_URL, {"user": str(other_user.id), "comment": False}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        preference = UserNotificationPreference.objects.get(user=create_user)
        assert preference.comment is False
        assert UserNotificationPreference.objects.filter(user=other_user).count() == 1
        assert session_client.get(NOTIFICATION_PREFERENCE_URL).status_code == status.HTTP_200_OK


@pytest.mark.contract
@pytest.mark.django_db
class TestUserAssetOwner:
    def test_patch_refuses_asset_of_another_user(self, session_client, create_user, other_user):
        # Matching entity types, so only the owner differs
        for field, entity_type in (
            ("avatar_asset", FileAsset.EntityTypeContext.USER_AVATAR),
            ("cover_image_asset", FileAsset.EntityTypeContext.USER_COVER),
        ):
            foreign = _asset(other_user, entity_type)
            response = session_client.patch(USER_URL, {field: str(foreign.id)}, format="json")
            assert response.status_code == status.HTTP_400_BAD_REQUEST

        create_user.refresh_from_db()
        assert create_user.avatar_asset_id is None
        assert create_user.cover_image_asset_id is None

    def test_patch_refuses_own_asset_of_other_entity_type(self, session_client, create_user):
        cover = _asset(create_user, FileAsset.EntityTypeContext.USER_COVER)

        response = session_client.patch(USER_URL, {"avatar_asset": str(cover.id)}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        create_user.refresh_from_db()
        assert create_user.avatar_asset_id is None

    def test_patch_links_and_clears_own_asset(self, session_client, create_user):
        cover = _asset(create_user, FileAsset.EntityTypeContext.USER_COVER)

        response = session_client.patch(USER_URL, {"cover_image_asset": str(cover.id)}, format="json")
        assert response.status_code == status.HTTP_200_OK
        create_user.refresh_from_db()
        assert create_user.cover_image_asset_id == cover.id

        response = session_client.patch(USER_URL, {"cover_image": None, "cover_image_asset": None}, format="json")
        assert response.status_code == status.HTTP_200_OK
        create_user.refresh_from_db()
        assert create_user.cover_image_asset_id is None

    def test_avatar_replacement_respects_asset_owner(self, session_client, create_user, other_user):
        """Replacing the avatar only removes a previous avatar the user owns."""
        foreign = _asset(other_user, FileAsset.EntityTypeContext.USER_AVATAR)
        User.objects.filter(pk=create_user.pk).update(avatar_asset=foreign)
        new_avatar = _asset(create_user, FileAsset.EntityTypeContext.USER_AVATAR)

        response = session_client.patch(_user_asset_url(new_avatar.id), {}, format="json")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        create_user.refresh_from_db()
        assert create_user.avatar_asset_id == new_avatar.id
        foreign.refresh_from_db()
        assert foreign.is_deleted is False

    def test_login_avatar_sync_unlinks_asset_of_another_user(self, create_user, other_user):
        """The provider-login avatar sync drops the link but leaves another user's asset alone."""
        foreign = _asset(other_user, FileAsset.EntityTypeContext.USER_AVATAR)
        User.objects.filter(pk=create_user.pk).update(avatar_asset=foreign)
        create_user.refresh_from_db()

        with patch("plane.authentication.adapter.base.S3Storage") as storage:
            Adapter(request=None, provider="github").delete_old_avatar(create_user)

        storage.return_value.delete_files.assert_not_called()
        assert create_user.avatar_asset_id is None
        foreign.refresh_from_db()
        assert foreign.is_deleted is False

    def test_avatar_upload_deletes_own_previous_avatar(self, session_client, create_user):
        previous = _asset(create_user, FileAsset.EntityTypeContext.USER_AVATAR)
        User.objects.filter(pk=create_user.pk).update(avatar_asset=previous)
        new_avatar = _asset(create_user, FileAsset.EntityTypeContext.USER_AVATAR)

        response = session_client.patch(_user_asset_url(new_avatar.id), {}, format="json")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        create_user.refresh_from_db()
        assert create_user.avatar_asset_id == new_avatar.id
        assert FileAsset.all_objects.get(pk=previous.pk).is_deleted is True
