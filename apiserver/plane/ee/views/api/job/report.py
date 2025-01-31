 # Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.api import BaseServiceAPIView
from plane.ee.models import ImportReport
from plane.ee.serializers import ImportReportAPISerializer

class ImportReportAPIView(BaseServiceAPIView):
    def get(self, request, pk = None):
        if not pk:
            import_reports = ImportReport.objects.filter(**request.query_params.dict()).order_by("-created_at")
            serializer = ImportReportAPISerializer(import_reports, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        import_report = ImportReport.objects.filter(pk=pk).first()
        serializer = ImportReportAPISerializer(import_report)
        return Response(serializer.data, status=status.HTTP_200_OK)


    def patch(self, request, pk):
        import_report = ImportReport.objects.filter(pk=pk).first()

        serializer = ImportReportAPISerializer(
            import_report,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            updated_report = serializer.save()
            return Response(
                ImportReportAPISerializer(updated_report).data,
                status=status.HTTP_200_OK
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
