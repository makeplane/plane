# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Every Nexus public-API route, mounted at /api/v1/ after Plane's own."""

from .features import urlpatterns as features_patterns
from .customer import urlpatterns as customer_patterns
from .release import urlpatterns as release_patterns
from .work_item_type import urlpatterns as work_item_type_patterns
from .page import urlpatterns as page_patterns
from .work_item import urlpatterns as work_item_patterns

urlpatterns = [
    *features_patterns,
    *customer_patterns,
    *release_patterns,
    *work_item_type_patterns,
    *page_patterns,
    *work_item_patterns,
]
