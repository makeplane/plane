# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.api.middleware.api_authentication import APIKeyAuthentication
from plane.api.rate_limit import ApiKeyRateThrottle
from plane.app.views.page.base import PageViewSet


class PageViewSetV1(PageViewSet):
    authentication_classes = [APIKeyAuthentication]
    throttle_classes = [ApiKeyRateThrottle]
