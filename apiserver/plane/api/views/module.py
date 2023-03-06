# Python imports
import json

# Django Imports
from django.db import IntegrityError
from django.db.models import Prefetch, F, OuterRef, Func, Exists
from django.core import serializers

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
    ModuleLinkSerializer,
    ModuleFavoriteSerializer,
)
from plane.api.permissions import ProjectEntityPermission
from plane.db.models import (
    Module,
    ModuleIssue,
    Project,
    Issue,
    ModuleLink,
    ModuleFavorite,
)
from plane.bgtasks.issue_activites_task import issue_activity
from plane.utils.grouper import group_results


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
                    queryset=ModuleIssue.objects.select_related(
                        "module", "issue", "issue__state", "issue__project"
                    ).prefetch_related("issue__assignees", "issue__labels"),
                )
            )
            .prefetch_related(
                Prefetch(
                    "link_module",
                    queryset=ModuleLink.objects.select_related("module", "created_by"),
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

    def list(self, request, slug, project_id):
        try:
            subquery = ModuleFavorite.objects.filter(
                user=self.request.user,
                module_id=OuterRef("pk"),
                project_id=project_id,
                workspace__slug=slug,
            )
            modules = self.get_queryset().annotate(is_favorite=Exists(subquery))
            return Response(ModuleSerializer(modules, many=True).data)
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
        "issue__labels__id",
        "issue__assignees__id",
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
            .annotate(
                sub_issues_count=Issue.objects.filter(parent=OuterRef("issue"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(module_id=self.kwargs.get("module_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project")
            .select_related("workspace")
            .select_related("module")
            .select_related("issue", "issue__state", "issue__project")
            .prefetch_related("issue__assignees", "issue__labels")
            .prefetch_related("module__members")
            .distinct()
        )

    def list(self, request, slug, project_id, module_id):
        try:
            order_by = request.GET.get("order_by", "issue__created_at")
            queryset = self.get_queryset().order_by(f"issue__{order_by}")
            group_by = request.GET.get("group_by", False)

            module_issues = ModuleIssueSerializer(queryset, many=True).data

            if group_by:
                return Response(
                    group_results(module_issues, f"issue_detail.{group_by}"),
                    status=status.HTTP_200_OK,
                )

            return Response(
                module_issues,
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
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

            module_issues = list(ModuleIssue.objects.filter(issue_id__in=issues))

            update_module_issue_activity = []
            records_to_update = []
            record_to_create = []

            for issue in issues:
                module_issue = [
                    module_issue
                    for module_issue in module_issues
                    if str(module_issue.issue_id) in issues
                ]

                if len(module_issue):
                    if module_issue[0].module_id != module_id:
                        update_module_issue_activity.append(
                            {
                                "old_module_id": str(module_issue[0].module_id),
                                "new_module_id": str(module_id),
                                "issue_id": str(module_issue[0].issue_id),
                            }
                        )
                        module_issue[0].module_id = module_id
                        records_to_update.append(module_issue[0])
                else:
                    record_to_create.append(
                        ModuleIssue(
                            module=module,
                            issue_id=issue,
                            project_id=project_id,
                            workspace=module.workspace,
                            created_by=request.user,
                            updated_by=request.user,
                        )
                    )

            ModuleIssue.objects.bulk_create(
                record_to_create,
                batch_size=10,
                ignore_conflicts=True,
            )

            ModuleIssue.objects.bulk_update(
                records_to_update,
                ["module"],
                batch_size=10,
            )

            # Capture Issue Activity
            issue_activity.delay(
                {
                    "type": "issue.activity",
                    "requested_data": json.dumps({"modules_list": issues}),
                    "actor_id": str(self.request.user.id),
                    "issue_id": str(self.kwargs.get("pk", None)),
                    "project_id": str(self.kwargs.get("project_id", None)),
                    "current_instance": json.dumps(
                        {
                            "updated_module_issues": update_module_issue_activity,
                            "created_module_issues": serializers.serialize(
                                "json", record_to_create
                            ),
                        }
                    ),
                },
            )

            return Response(
                ModuleIssueSerializer(self.get_queryset(), many=True).data,
                status=status.HTTP_200_OK,
            )
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


class ModuleLinkViewSet(BaseViewSet):
    permission_classes = [
        ProjectEntityPermission,
    ]

    model = ModuleLink
    serializer_class = ModuleLinkSerializer

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            module_id=self.kwargs.get("module_id"),
        )

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(module_id=self.kwargs.get("module_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .distinct()
        )


class ModuleFavoriteViewSet(BaseViewSet):
    serializer_class = ModuleFavoriteSerializer
    model = ModuleFavorite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(user=self.request.user)
            .select_related("module")
        )

    def create(self, request, slug, project_id):
        try:
            serializer = ModuleFavoriteSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(user=request.user, project_id=project_id)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"error": "The module is already added to favorites"},
                    status=status.HTTP_410_GONE,
                )
            else:
                capture_exception(e)
                return Response(
                    {"error": "Something went wrong please try again later"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def destroy(self, request, slug, project_id, module_id):
        try:
            module_favorite = ModuleFavorite.objects.get(
                project=project_id,
                user=request.user,
                workspace__slug=slug,
                module_id=module_id,
            )
            module_favorite.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ModuleFavorite.DoesNotExist:
            return Response(
                {"error": "Module is not in favorites"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
