# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.app.views.base import BaseAPIView as BaseAPIViewBase
from plane.app.views.base import BaseViewSet as BaseViewSetBase


class BaseViewSet(BaseViewSetBase):
    pass


class BaseAPIView(BaseAPIViewBase):
    pass
