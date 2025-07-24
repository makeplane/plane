# Third party imports
from rest_framework import status
from rest_framework.response import Response
from django.db import transaction

# Module imports
from plane.ee.models import ImportJob, ImportReport, WorkspaceCredential
from plane.ee.serializers import ImportJobAPISerializer
from plane.ee.views.api import BaseServiceAPIView


class ImportJobAPIView(BaseServiceAPIView):
    def post(self, request):
        # Get required fields from request data
        workspace_id = request.data.get("workspace_id")
        project_id = request.data.get("project_id")
        user_id = request.data.get("initiator_id")
        source = request.data.get("source")

        if not all([workspace_id, user_id, source]):
            return Response(
                {"error": "workspace_id, user_id and source are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Look up credentials
        credential = WorkspaceCredential.objects.filter(
            workspace_id=workspace_id, user_id=user_id, source=source
        ).first()

        if not credential:
            return Response(
                {"error": f"No credentials found for workspace with source {source}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create report and prepare data
        report = ImportReport.objects.create()
        data = {
            **request.data,
            "credential_id": credential.id,
            "workspace_id": workspace_id,
            "project_id": project_id,
            "initiator_id": user_id,
            "report_id": report.id,
        }

        serializer = ImportJobAPISerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, pk=None):
        if not pk:
            filters = {}
            # Handle source parameter
            if "source" in request.query_params:
                filters["source"] = request.query_params["source"]

            # Handle workspace_id/workspaceId parameter
            if "workspace_id" in request.query_params:
                filters["workspace_id"] = request.query_params["workspace_id"]
            elif "workspaceId" in request.query_params:
                filters["workspace_id"] = request.query_params["workspaceId"]

            import_jobs = (
                ImportJob.objects.filter(**filters)
                .order_by("-created_at")
                .select_related("workspace", "report")
            )
            serializer = ImportJobAPISerializer(import_jobs, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        import_job = (
            ImportJob.objects.filter(pk=pk)
            .select_related("workspace", "report")
            .first()
        )
        serializer = ImportJobAPISerializer(import_job)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        with transaction.atomic():
            # Use select_for_update to lock the row
            import_job = ImportJob.objects.select_for_update().filter(pk=pk).first()

            if not import_job:
                return Response(
                    {"error": "Import job not found"}, status=status.HTTP_404_NOT_FOUND
                )

            serializer = ImportJobAPISerializer(
                import_job, data=request.data, partial=True
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        import_job = ImportJob.objects.filter(pk=pk).first()
        import_job.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
