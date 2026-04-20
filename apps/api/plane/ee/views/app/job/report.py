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
from plane.ee.models import ImportReport
from plane.ee.serializers import ImportReportSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.permissions import can, IntegrationPermissions


class ImportReportView(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.SILO)
    @can(IntegrationPermissions.MANAGE, resource_param="workspace_id")
    def get(self, request, slug, pk=None):
        if not pk:
            import_reports = ImportReport.objects.filter(**request.query_params).order_by("-created_at")
            serializer = ImportReportSerializer(import_reports, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        import_report = ImportReport.objects.filter(pk=pk).first()
        serializer = ImportReportSerializer(import_report)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.SILO)
    @can(IntegrationPermissions.MANAGE, resource_param="workspace_id")
    def patch(self, request, slug, pk):
        import_report = ImportReport.objects.filter(pk=pk).first()

        serializer = ImportReportSerializer(import_report, data=request.data, partial=True)

        if serializer.is_valid():
            updated_report = serializer.save()
            return Response(ImportReportSerializer(updated_report).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
