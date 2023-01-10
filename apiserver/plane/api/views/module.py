# Django Imports
from django.db import IntegrityError
from django.db.models import Prefetch

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from sentry_sdk import capture_exception

# Module imports
from . import BaseViewSet
from plane.api.serializers import (
    ModuleWriteSerializer,
    ModuleSerializer,
    ModuleIssueSerializer,
)
from plane.api.permissions import ProjectEntityPermission
from plane.db.models import Module, ModuleIssue, Project, Issue, ModuleLink


class ModuleViewSet(BaseViewSet):

    model = Module
    permission_classes = [
        ProjectEntityPermission,
    ]

    def get_serializer_class(self):
        return (
            ModuleWriteSerializer
            if self.action in ["create", "update", "partial_update"]
            else ModuleSerializer
        )

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("project")
            .select_related("workspace")
            .select_related("lead")
            .prefetch_related("members")
            .prefetch_related(
                Prefetch(
                    "issue_module",
                    queryset=ModuleIssue.objects.select_related("module", "issue"),
                )
            )
            .prefetch_related(
                Prefetch(
                    "link_module",
                    queryset=ModuleLink.objects.select_related("module"),
                )
            )
        )

    def create(self, request, slug, project_id):
        try:
            project = Project.objects.get(workspace__slug=slug, pk=project_id)
            serializer = ModuleWriteSerializer(
                data=request.data, context={"project": project}
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Project.DoesNotExist:
            return Response(
                {"error": "Project was not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The module name is already taken"},
                    status=status.HTTP_410_GONE,
                )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ModuleIssueViewSet(BaseViewSet):

    serializer_class = ModuleIssueSerializer
    model = ModuleIssue

    filterset_fields = [
        "issue__id",
        "workspace__id",
    ]

    permission_classes = [
        ProjectEntityPermission,
    ]

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            module_id=self.kwargs.get("module_id"),
        )

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(module_id=self.kwargs.get("module_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project")
            .select_related("workspace")
            .select_related("module")
            .select_related("issue")
            .distinct()
        )

    def create(self, request, slug, project_id, module_id):
        try:
            issues = request.data.get("issues", [])
            if not len(issues):
                return Response(
                    {"error": "Issues are required"}, status=status.HTTP_400_BAD_REQUEST
                )
            module = Module.objects.get(
                workspace__slug=slug, project_id=project_id, pk=module_id
            )

            issues = Issue.objects.filter(
                pk__in=issues, workspace__slug=slug, project_id=project_id
            )

            # Delete old records in order to maintain the database integrity
            ModuleIssue.objects.filter(issue_id__in=issues).delete()

            ModuleIssue.objects.bulk_create(
                [
                    ModuleIssue(
                        module=module,
                        issue=issue,
                        project_id=project_id,
                        workspace=module.workspace,
                        created_by=request.user,
                        updated_by=request.user,
                    )
                    for issue in issues
                ],
                batch_size=10,
                ignore_conflicts=True,
            )
            return Response({"message": "Success"}, status=status.HTTP_200_OK)
        except Module.DoesNotExist:
            return Response(
                {"error": "Module Does not exists"}, status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )