# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.api import BaseServiceAPIView
from plane.ee.models import ImportReport
from plane.ee.serializers import ImportReportAPISerializer
from django.db import transaction



class ImportReportAPIView(BaseServiceAPIView):
    def get(self, request, pk=None):
        if not pk:
            import_reports = ImportReport.objects.filter(
                **request.query_params.dict()
            ).order_by("-created_at")
            serializer = ImportReportAPISerializer(import_reports, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        import_report = ImportReport.objects.filter(pk=pk).first()
        serializer = ImportReportAPISerializer(import_report)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        import_report = ImportReport.objects.filter(pk=pk).first()

        serializer = ImportReportAPISerializer(
            import_report, data=request.data, partial=True
        )

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
                import_report.imported_batch_count = (
                    import_report.imported_batch_count
                    + int(request.data.get("imported_batch_count", 0))
                )
                import_report.errored_batch_count = (
                    import_report.errored_batch_count
                    + int(request.data.get("errored_batch_count", 0))
                )
                import_report.completed_batch_count = (
                    import_report.completed_batch_count
                    + int(request.data.get("completed_batch_count", 0))
                )
                import_report.total_issue_count = import_report.total_issue_count + int(
                    request.data.get("total_issue_count", 0)
                )
                import_report.imported_issue_count = (
                    import_report.imported_issue_count
                    + int(request.data.get("imported_issue_count", 0))
                )
                import_report.errored_issue_count = (
                    import_report.errored_issue_count
                    + int(request.data.get("errored_issue_count", 0))
                )
                import_report.imported_page_count = (
                    import_report.imported_page_count
                    + int(request.data.get("imported_page_count", 0))
                )
                import_report.total_page_count = import_report.total_page_count + int(
                    request.data.get("total_page_count", 0)
                )
                import_report.errored_page_count = (
                    import_report.errored_page_count
                    + int(request.data.get("errored_page_count", 0))
                )
                import_report.save()
                return Response(status=status.HTTP_200_OK)
        return Response(status=status.HTTP_404_NOT_FOUND)
