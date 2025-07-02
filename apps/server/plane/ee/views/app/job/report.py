# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.models import ImportReport
from plane.ee.serializers import ImportReportSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.app.permissions.project import ProjectBasePermission


class ImportReportView(BaseAPIView):
    permission_classes = [ProjectBasePermission]

    @check_feature_flag(FeatureFlag.SILO)
    def get(self, request, slug, pk=None):
        if not pk:
            import_reports = ImportReport.objects.filter(
                **request.query_params
            ).order_by("-created_at")
            serializer = ImportReportSerializer(import_reports, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        import_report = ImportReport.objects.filter(pk=pk).first()
        serializer = ImportReportSerializer(import_report)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.SILO)
    def patch(self, request, slug, pk):
        import_report = ImportReport.objects.filter(pk=pk).first()

        serializer = ImportReportSerializer(
            import_report, data=request.data, partial=True
        )

        if serializer.is_valid():
            updated_report = serializer.save()
            return Response(
                ImportReportSerializer(updated_report).data, status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
