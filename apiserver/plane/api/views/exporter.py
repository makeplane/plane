# Third Party imports
from rest_framework.response import Response
from rest_framework import status
from sentry_sdk import capture_exception

# Module imports
from . import BaseViewSet, BaseAPIView
from plane.api.permissions import WorkSpaceAdminPermission
from plane.bgtasks.export_task import issue_export_task


class ExportIssuesEndpoint(BaseAPIView):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def post(self, request, slug):
        try:
            provider = request.data.get("provider", False)

            if provider == "csv":
                issue_export_task.delay(
                    email=request.user.email,
                    data=request.data,
                    slug=slug,
                    exporter_name=request.user.first_name,
                )
                return Response(
                    {
                        "message": f"Once the export is ready it will be emailed to you at {str(request.user.email)}"
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": f"Provider '{provider}' not found."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
