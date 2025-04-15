# Third party imports
from rest_framework import status
from rest_framework.response import Response


from plane.db.models import Project, Workspace
from plane.ee.views.base import BaseAPIView
from plane.ee.models import WorkspaceFeature, ProjectState, ProjectAttribute
from plane.ee.permissions import WorkSpaceBasePermission
from plane.ee.serializers import WorkspaceFeatureSerializer


class WorkspaceFeaturesEndpoint(BaseAPIView):
    permission_classes = (WorkSpaceBasePermission,)

    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        workspace_feature, _ = WorkspaceFeature.objects.get_or_create(
            workspace_id=workspace.id
        )
        serializer = WorkspaceFeatureSerializer(workspace_feature)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def patch(self, request, slug):
        is_project_grouping_enabled = request.data.get(
            "is_project_grouping_enabled", False
        )
        workspace = Workspace.objects.get(slug=slug)
        workspace_feature = WorkspaceFeature.objects.get(workspace_id=workspace.id)

        if is_project_grouping_enabled:
            project_states = ProjectState.objects.filter(workspace__slug=slug).first()

            if not project_states:
                # Default states
                states = [
                    {
                        "name": "Draft",
                        "color": "#60646C",
                        "sequence": 15000,
                        "group": "draft",
                        "default": True,
                    },
                    {
                        "name": "Planning",
                        "color": "#60646C",
                        "sequence": 25000,
                        "group": "planning",
                    },
                    {
                        "name": "Execution",
                        "color": "#F59E0B",
                        "sequence": 35000,
                        "group": "execution",
                    },
                    {
                        "name": "Monitoring",
                        "color": "#00838F",
                        "sequence": 45000,
                        "group": "monitoring",
                    },
                    {
                        "name": "Completed",
                        "color": "#46A758",
                        "sequence": 55000,
                        "group": "completed",
                    },
                    {
                        "name": "Cancelled",
                        "color": "#9AA4BC",
                        "sequence": 65000,
                        "group": "cancelled",
                    },
                ]

                ProjectState.objects.bulk_create(
                    [
                        ProjectState(
                            name=state["name"],
                            color=state["color"],
                            sequence=state["sequence"],
                            workspace=workspace,
                            group=state["group"],
                            default=state.get("default", False),
                            created_by=request.user,
                            updated_by=request.user,
                        )
                        for state in states
                    ],
                    ignore_conflicts=True,
                )

            default_state = ProjectState.objects.filter(
                workspace__slug=slug, default=True
            ).first()

            project_attribute_project_ids = ProjectAttribute.objects.filter(
                workspace__slug=slug
            ).values_list("project_id", flat=True)

            projects_ids = (
                Project.objects.filter(workspace__slug=slug)
                .exclude(id__in=project_attribute_project_ids)
                .values_list("id", flat=True)
            )

            # bulk create all the project attributes
            if projects_ids:
                ProjectAttribute.objects.bulk_create(
                    [
                        ProjectAttribute(
                            project_id=project_id,
                            state=default_state,
                            workspace=workspace,
                        )
                        for project_id in projects_ids
                    ],
                    batch_size=10,
                )

        serializer = WorkspaceFeatureSerializer(
            workspace_feature, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
