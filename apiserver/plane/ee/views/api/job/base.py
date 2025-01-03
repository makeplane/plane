# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView, BaseViewSet
from plane.ee.models import ImportJob
from plane.ee.serializers import ImportJobAPISerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.app.permissions.project import ProjectBasePermission


class ImportJobAPIView(BaseAPIView):
    permission_classes = [ProjectBasePermission]

    def get(self, request, slug, project_id, pk = None):
        if not pk:
            import_jobs = ImportJob.objects.filter(**request.query_params).order_by("-created_at")
            serializer = ImportJobAPISerializer(import_jobs, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        import_job = ImportJob.objects.filter(pk=pk).first()
        serializer = ImportJobAPISerializer(import_job)
        return Response(serializer.data, status=status.HTTP_200_OK)  

    def patch(self, request, slug, project_id, pk):
        import_job = ImportJob.objects.filter(pk=pk).first()

        serializer = ImportJobAPISerializer(
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

    def delete(self, request, slug, project_id, pk):
        import_job = ImportJob.objects.filter(pk=pk).first()
        import_job.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    