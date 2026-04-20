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

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.models import CustomerPropertyOption
from plane.ee.serializers import CustomerPropertyOptionSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.permissions import can, CustomerPermissions


class CustomerPropertyOptionEndpoint(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    @can(CustomerPermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug, customer_property_id=None, pk=None):
        if pk:
            customer_property_option = CustomerPropertyOption.objects.get(workspace__slug=slug, pk=pk)
            serializer = CustomerPropertyOptionSerializer(customer_property_option)
            return Response(serializer.data, status=status.HTTP_200_OK)

        if customer_property_id:
            customer_property_options = CustomerPropertyOption.objects.filter(
                workspace__slug=slug, property_id=customer_property_id
            )
            serializer = CustomerPropertyOptionSerializer(customer_property_options, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        customer_property_options = CustomerPropertyOption.objects.filter(workspace__slug=slug)

        serializer = CustomerPropertyOptionSerializer(customer_property_options, many=True)

        response_map = {}
        for option in serializer.data:
            if str(option["property"]) in response_map:
                response_map[str(option["property"])].append(option)
            else:
                response_map[str(option["property"])] = [option]

        return Response(response_map, status=status.HTTP_200_OK)
