# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.permissions import (
    WorkspaceUserPermission,
)
from plane.db.models import Workspace
from plane.ee.models import Initiative, InitiativeProject, InitiativeLabel
from plane.ee.serializers import (
    InitiativeSerializer,
)


class InitiativeEndpoint(BaseAPIView):

    permission_classes = [
        WorkspaceUserPermission,
    ]
    model = Initiative
    serializer_class = InitiativeSerializer

    def get(self, request, slug, pk=None):
        # Get initiative by pk
        if pk:
            initiative = Initiative.objects.get(pk=pk)
            serializer = InitiativeSerializer(initiative)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all initiatives in workspace
        initiatives = Initiative.objects.filter(workspace__slug=slug)
        serializer = InitiativeSerializer(initiatives, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = InitiativeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace=workspace)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, slug, pk):
        initiative = Initiative.objects.get(pk=pk)
        serializer = InitiativeSerializer(
            initiative, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, pk):
        initiative = Initiative.objects.get(pk=pk)
        initiative.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InitiativeProjectEndpoint(BaseAPIView):

    permission_classes = [
        WorkspaceUserPermission,
    ]
    model = InitiativeProject
    serializer_class = InitiativeSerializer

    def get(self, request, slug, initiative_id, pk=None):
        # Get all projects in initiative
        if pk:
            initiative_project = InitiativeProject.objects.get(
                pk=pk,
                initiative_id=initiative_id,
                workspace__slug=slug,
            )
            serializer = InitiativeSerializer(initiative_project)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all projects in initiative
        initiative_projects = InitiativeProject.objects.filter(
            initiative_id=initiative_id, workspace__slug=slug
        )
        serializer = InitiativeSerializer(initiative_projects, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug, initiative_id):
        project_ids = request.data.get("project_ids", [])
        # Create InitiativeProject objects
        initiatives = InitiativeProject.objects.bulk_create(
            [
                InitiativeProject(
                    initiative_id=initiative_id,
                    project_id=project_id,
                )
                for project_id in project_ids
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )
        # Serialize and return
        serializer = InitiativeSerializer(initiatives, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, slug, pk, project_pk):
        initiative_project = InitiativeProject.objects.get(
            initiative_id=pk,
            project_id=project_pk,
            workspace__slug=slug,
        )
        initiative_project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InitiativeLabelEndpoint(BaseAPIView):

    permission_classes = [
        WorkspaceUserPermission,
    ]
    model = InitiativeLabel
    serializer_class = InitiativeSerializer

    def get(self, request, slug, initiative_id, pk=None):
        # Get all labels in initiative
        if pk:
            initiative_label = InitiativeLabel.objects.get(
                pk=pk,
                initiative_id=initiative_id,
                workspace__slug=slug,
            )
            serializer = InitiativeSerializer(initiative_label)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all labels in initiative
        initiative_labels = InitiativeLabel.objects.filter(
            initiative_id=initiative_id,
            workspace__slug=slug,
        )
        serializer = InitiativeSerializer(initiative_labels, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug, initiative_id):
        label_ids = request.data.get("label_ids", [])
        # Create InitiativeLabel objects
        initiatives = InitiativeLabel.objects.bulk_create(
            [
                InitiativeLabel(
                    initiative_id=initiative_id,
                    label_id=label_id,
                )
                for label_id in label_ids
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )
        # Serialize and return
        serializer = InitiativeSerializer(initiatives, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, slug, initiative_id, label_id):
        initiative_label = InitiativeLabel.objects.get(
            initiative_id=initiative_id,
            label_id=label_id,
            workspace__slug=slug,
        )
        initiative_label.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
