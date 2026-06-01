# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models import Count, Q
from rest_framework.permissions import IsAuthenticated

from plane.app.serializers.help_center import HelpCategoryReadSerializer
from plane.app.views.base import BaseViewSet
from plane.db.models import HelpCategory

from .base import HelpCenterReadMixin


class HelpCategoryViewSet(HelpCenterReadMixin, BaseViewSet):
    """Global read of the shared Help Center categories.

    Any authenticated user (in any workspace) sees the same active categories
    that hold >=1 published article. Authoring is God Mode only (license layer).
    """

    model = HelpCategory
    serializer_class = HelpCategoryReadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # The publish invariant guarantees a published article has a usable
        # translation, so counting published articles is sufficient.
        return (
            HelpCategory.objects.filter(is_active=True)
            .prefetch_related("translations")
            .annotate(
                article_count=Count(
                    "articles",
                    filter=Q(articles__status="published", articles__deleted_at__isnull=True),
                    distinct=True,
                )
            )
            .filter(article_count__gt=0)
        )
