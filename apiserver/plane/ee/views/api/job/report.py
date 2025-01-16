 # Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.models import ImportReport
from plane.ee.serializers import ImportReportAPISerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.app.permissions.project import ProjectBasePermission

class ImportReportAPIView(BaseAPIView):
    permission_classes = [ProjectBasePermission]
    def get(self, request, slug, project_id, pk = None):     
        if not pk:
            import_reports = ImportReport.objects.filter(**request.query_params).order_by("-created_at")
            serializer = ImportReportAPISerializer(import_reports, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        import_report = ImportReport.objects.filter(pk=pk).first()
        serializer = ImportReportAPISerializer(import_report)
        return Response(serializer.data, status=status.HTTP_200_OK)


    def patch(self, request, slug, project_id, pk):
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
