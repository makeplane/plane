# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from . import BaseViewSet, BaseAPIView
from plane.api.serializers import CycleSerializer, CycleIssueSerializer
from plane.api.permissions import ProjectEntityPermission
from plane.db.models import Cycle, CycleIssue, Issue


class CycleViewSet(BaseViewSet):

    serializer_class = CycleSerializer
    model = Cycle
    permission_classes = [
        ProjectEntityPermission,
    ]

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"), owned_by=self.request.user
        )

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project")
            .select_related("workspace")
            .distinct()
        )


class CycleIssueViewSet(BaseViewSet):

    serializer_class = CycleIssueSerializer
    model = CycleIssue

    permission_classes = [
        ProjectEntityPermission,
    ]

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            cycle_id=self.kwargs.get("cycle_id"),
        )

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .filter(cycle_id=self.kwargs.get("cycle_id"))
            .select_related("project")
            .select_related("workspace")
            .select_related("cycle")
            .select_related("issue")
            .select_related("issue__state")
            .distinct()
        )


class BulkAssignIssuesToCycleEndpoint(BaseAPIView):

    permission_classes = [
        ProjectEntityPermission,
    ]

    def post(self, request, slug, project_id, cycle_id):
        try:

            issue_ids = request.data.get("issue_ids")

            cycle = Cycle.objects.get(
                workspace__slug=slug, project_id=project_id, pk=cycle_id
            )

            issues = Issue.objects.filter(
                pk__in=issue_ids, workspace__slug=slug, project_id=project_id
            )

            CycleIssue.objects.bulk_create(
                [
                    CycleIssue(
                        project_id=project_id,
                        workspace=cycle.workspace,
                        created_by=request.user,
                        updated_by=request.user,
                        cycle=cycle,
                        issue=issue,
                    )
                    for issue in issues
                ],
                batch_size=10,
                ignore_conflicts=True,
            )
            return Response({"message": "Success"}, status=status.HTTP_200_OK)

        except Cycle.DoesNotExist:
            return Response(
                {"error": "Cycle not found"}, status=status.HTTP_404_NOT_FOUND
            )
