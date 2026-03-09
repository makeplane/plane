# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers.staff import MyStaffProfileSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import StaffProfile


class MyStaffProfileEndpoint(BaseAPIView):
    """Current user's own staff profile — read-only, no workspace scope, no admin required."""

    def get(self, request):
        try:
            staff = StaffProfile.objects.select_related("department").get(
                user=request.user,
                deleted_at__isnull=True,
            )
        except StaffProfile.DoesNotExist:
            return Response(
                {"detail": "Staff profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = MyStaffProfileSerializer(staff)
        return Response(serializer.data, status=status.HTTP_200_OK)
