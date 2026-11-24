# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""POST /api/v1/assets/user-assets/ rejects a ``size`` that isn't a positive whole number.

The size went through ``int()`` directly, so ``"abc"`` or ``null`` raised (HTTP
500) and zero or a negative size reached the presigned upload.
"""

from unittest import mock

import pytest
from rest_framework import status


@pytest.fixture(autouse=True)
def storage():
    with mock.patch("plane.api.views.asset.S3Storage") as s3:
        s3.return_value.generate_presigned_post.return_value = {"url": "https://s3.test/", "fields": {}}
        yield s3


def body(size):
    return {"name": "a.png", "type": "image/png", "size": size, "entity_type": "USER_AVATAR"}


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("size", ["abc", None, -5, 0, 1.5, True])
def test_bad_size_is_400(api_key_client, size):
    response = api_key_client.post("/api/v1/assets/user-assets/", body(size), format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
@pytest.mark.django_db
def test_good_size_still_works(api_key_client):
    response = api_key_client.post("/api/v1/assets/user-assets/", body("2048"), format="json")

    assert response.status_code == status.HTTP_200_OK
