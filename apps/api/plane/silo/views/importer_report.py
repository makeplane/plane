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

from django.db import transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .base import BaseServiceAPIView
from plane.ee.models import ImportReport, ImportExecutionLog, ImportJob
from plane.silo.serializers import ImportReportAPISerializer, ImportExecutionLogSerializer
from plane.silo.bgtasks.generate_job_summary import generate_job_summary


class ImportReportAPIView(BaseServiceAPIView):
    def get(self, request, pk=None):
        if not pk:
            import_reports = ImportReport.objects.filter(**request.query_params.dict()).order_by("-created_at")
            serializer = ImportReportAPISerializer(import_reports, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        import_report = ImportReport.objects.filter(pk=pk).first()
        serializer = ImportReportAPISerializer(import_report)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        import_report = ImportReport.objects.filter(pk=pk).first()

        serializer = ImportReportAPISerializer(import_report, data=request.data, partial=True)

        if serializer.is_valid():
            updated_report = serializer.save()
            return Response(
                ImportReportAPISerializer(updated_report).data,
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ImportReportCountIncrementAPIView(BaseServiceAPIView):
    def post(self, request, pk):
        with transaction.atomic():
            import_report = ImportReport.objects.select_for_update().filter(pk=pk).first()
            if import_report:
                import_report.total_batch_count = import_report.total_batch_count + int(
                    request.data.get("total_batch_count", 0)
                )
                import_report.imported_batch_count = import_report.imported_batch_count + int(
                    request.data.get("imported_batch_count", 0)
                )
                import_report.errored_batch_count = import_report.errored_batch_count + int(
                    request.data.get("errored_batch_count", 0)
                )
                import_report.completed_batch_count = import_report.completed_batch_count + int(
                    request.data.get("completed_batch_count", 0)
                )
                import_report.total_issue_count = import_report.total_issue_count + int(
                    request.data.get("total_issue_count", 0)
                )
                import_report.imported_issue_count = import_report.imported_issue_count + int(
                    request.data.get("imported_issue_count", 0)
                )
                import_report.errored_issue_count = import_report.errored_issue_count + int(
                    request.data.get("errored_issue_count", 0)
                )
                import_report.imported_page_count = import_report.imported_page_count + int(
                    request.data.get("imported_page_count", 0)
                )
                import_report.total_page_count = import_report.total_page_count + int(
                    request.data.get("total_page_count", 0)
                )
                import_report.errored_page_count = import_report.errored_page_count + int(
                    request.data.get("errored_page_count", 0)
                )

                import_report.save()
                return Response(status=status.HTTP_200_OK)
        return Response(status=status.HTTP_404_NOT_FOUND)


class ImportExecutionLogAPIView(BaseServiceAPIView):
    def post(self, request, job_id, report_id):
        # Bulk create execution logs
        logs_data = request.data
        if not isinstance(logs_data, list):
            return Response({"error": "Data must be a list of log records"}, status=status.HTTP_400_BAD_REQUEST)

        if not ImportJob.objects.filter(pk=job_id).exists():
            return Response({"error": "Import Job not found"}, status=status.HTTP_404_NOT_FOUND)

        # Verify report exists
        if not ImportReport.objects.filter(pk=report_id).exists():
            return Response({"error": "Import report not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ImportExecutionLogSerializer(data=logs_data, many=True)
        if serializer.is_valid():
            logs_to_create = [
                ImportExecutionLog(job_id=job_id, report_id=report_id, **log_data)
                for log_data in serializer.validated_data
            ]
            ImportExecutionLog.objects.bulk_create(logs_to_create, batch_size=1000)
            return Response(status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ImportJobSummaryAPIView(BaseServiceAPIView):
    def post(self, request, job_id, report_id):
        if not ImportJob.objects.filter(pk=job_id).exists():
            return Response({"error": "Import Job not found"}, status=status.HTTP_404_NOT_FOUND)

        if not ImportReport.objects.filter(pk=report_id).exists():
            return Response({"error": "Import report not found"}, status=status.HTTP_404_NOT_FOUND)

        generate_job_summary.delay(job_id, report_id)

        return Response(status=status.HTTP_200_OK)
