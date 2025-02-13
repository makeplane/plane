# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView, BaseViewSet
from plane.ee.models import ImportJob, ImportReport
from plane.ee.serializers import ImportJobSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.app.permissions.project import ProjectBasePermission


class ImportJobView(BaseAPIView):
    permission_classes = [ProjectBasePermission]
    
    @check_feature_flag(FeatureFlag.SILO)
    def get(self, request, slug, pk = None):
        if not pk:
            import_jobs = ImportJob.objects.filter(**request.query_params).order_by("-created_at")
            serializer = ImportJobSerializer(import_jobs, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        import_job = ImportJob.objects.filter(pk=pk).first()
        serializer = ImportJobSerializer(import_job)
        return Response(serializer.data, status=status.HTTP_200_OK)  

    @check_feature_flag(FeatureFlag.SILO)
    def post(self, request, slug, pk):
        report = ImportReport.objects.create()

        serializer = ImportJobSerializer(data={**request.data, "report": report.id})
        if serializer.is_valid():
            serializer.save()
            return Response(
                serializer.data, 
                status=status.HTTP_201_CREATED
            )
        return Response(
            serializer.errors, 
            status=status.HTTP_400_BAD_REQUEST
        )

    @check_feature_flag(FeatureFlag.SILO)
    def patch(self, request, slug, pk):
        import_job = ImportJob.objects.filter(pk=pk).first()

        serializer = ImportJobSerializer(
            import_job, 
            data=request.data, 
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    @check_feature_flag(FeatureFlag.SILO)
    def delete(self, request, slug, pk):
        import_job = ImportJob.objects.filter(pk=pk).first()
        import_job.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)