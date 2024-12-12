# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import WorkspaceEntityPermission
from plane.app.serializers import IssueViewSerializer
from plane.db.models import IssueView
from plane.ee.views.base import BaseViewSet
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class WorkspaceViewEEViewSet(BaseViewSet):
    serializer_class = IssueViewSerializer
    model = IssueView
    permission_classes = [WorkspaceEntityPermission]

    def lock(self, request, slug, pk):
        workspace_view = IssueView.objects.filter(pk=pk, workspace__slug=slug).first()

        if workspace_view.owned_by != request.user:
            return Response(
                {"error": "Only the owner can lock the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        workspace_view.is_locked = True
        workspace_view.save(update_fields=["is_locked"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    def unlock(self, request, slug, pk):
        workspace_view = IssueView.objects.filter(pk=pk, workspace__slug=slug).first()

        if workspace_view.owned_by != request.user:
            return Response(
                {"error": "Only the owner can un-lock the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        workspace_view.is_locked = False
        workspace_view.save(update_fields=["is_locked"])

        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.VIEW_ACCESS_PRIVATE)
    def access(self, request, slug, pk):
        access = request.data.get("access", 1)

        workspace_view = IssueView.objects.filter(pk=pk, workspace__slug=slug).first()

        if workspace_view.owned_by != request.user:
            return Response(
                {"error": "Only the owner can change the access of the view"},
                status=status.HTTP_403_FORBIDDEN,
            )

        workspace_view.access = access
        workspace_view.save(update_fields=["access"])

        return Response(status=status.HTTP_204_NO_CONTENT)
