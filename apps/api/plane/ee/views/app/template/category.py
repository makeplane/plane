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

from rest_framework import status
from rest_framework.response import Response

from plane.ee.views.base import BaseAPIView
from plane.ee.models import TemplateCategory
from plane.ee.serializers.app.template import TemplateCategorySerializer


class TemplateCategoryEndpoint(BaseAPIView):
    use_read_replica = True

    def get(self, request):
        template_categories = TemplateCategory.objects.filter(is_active=True)
        serializer = TemplateCategorySerializer(template_categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
