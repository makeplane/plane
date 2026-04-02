# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
from uuid import UUID

# Django imports
from django.db import models
from django.db.models import OuterRef, Q, Subquery
from django.db.models.functions import Coalesce
from django.contrib.postgres.aggregates import ArrayAgg

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.db.models import IssueType, Issue, Project, ProjectIssueType, Workspace
from plane.ee.models import WorkitemTemplate, WorkspaceFeature, IssueProperty, IssueTypeProperty, IssuePropertyValue
from plane.ee.permissions import ProjectEntityPermission, WorkspaceEntityPermission
from plane.ee.serializers import IssueTypeSerializer, IssuePropertySerializer, WorkspaceWorkItemTypeSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.utils.issue_type_hierarchy import validate_type_hierarchy


class WorkspaceWorkItemTypeEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission]

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    def get(self, request, slug, pk=None):
        # Get all issue types for the workspace
        issue_types = (
            IssueType.objects.filter(
                workspace__slug=slug,
                is_epic=False,
            )
            .annotate(
                project_ids=Coalesce(
                    ArrayAgg(
                        "project_issue_types__project_id",
                        distinct=True,
                        filter=Q(
                            project_issue_types__deleted_at__isnull=True,
                            project_issue_types__project_id__isnull=False,
                        ),
                    ),
                    [],
                )
            )
            .prefetch_related("issue_type_properties")
        )

        if pk:
            issue_type = issue_types.get(pk=pk)
            serializer = WorkspaceWorkItemTypeSerializer(issue_type)
            return Response(serializer.data, status=status.HTTP_200_OK)

        issue_types = issue_types.order_by("created_at")
        serializer = WorkspaceWorkItemTypeSerializer(issue_types, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        # Check if the workspace has the feature flag enabled
        workspace_feature, _ = WorkspaceFeature.objects.get_or_create(workspace_id=workspace.id)
        if not workspace_feature.is_work_item_types_enabled:
            return Response(
                {"error": "Workspace work item type creation is not enabled"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for duplicate name at workspace scope
        if IssueType.objects.filter(workspace__slug=slug, name=request.data.get("name"), is_epic=False).exists():
            return Response(
                {"error": "Work item type with this name already exists", "code": "WORK_ITEM_TYPE_ALREADY_EXIST"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create a new issue type
        serializer = WorkspaceWorkItemTypeSerializer(
            data=request.data,
            context={
                "workspace_id": workspace.id,
            },
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(workspace_id=workspace.id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    def patch(self, request, slug, pk):
        workspace = Workspace.objects.get(slug=slug)
        # Check if the workspace has the feature flag enabled
        workspace_feature, _ = WorkspaceFeature.objects.get_or_create(workspace_id=workspace.id)
        if not workspace_feature.is_work_item_types_enabled:
            return Response(
                {"error": "Workspace work item type creation is not enabled"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        issue_type = IssueType.objects.get(workspace__slug=slug, pk=pk)
        serializer = WorkspaceWorkItemTypeSerializer(
            issue_type,
            data=request.data,
            context={
                "workspace_id": workspace.id,
            },
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(workspace_id=workspace.id)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    def delete(self, request, slug, pk):
        # Check if the workspace has the feature flag enabled
        if not WorkspaceFeature.objects.get(workspace__slug=slug).is_work_item_types_enabled:
            return Response(
                {"error": "Workspace work item type creation is not enabled"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        issue_type = IssueType.objects.get(workspace__slug=slug, pk=pk)

        # Check if the issue type is the default issue type
        if issue_type.is_default:
            return Response(
                {"error": "Cannot delete default work item type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if there are any issues using this issue type
        if Issue.objects.filter(workspace__slug=slug, type_id=pk).exists():
            return Response(
                {"error": "Cannot delete work item type with associated work items."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issue_type.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceMarkDefaultWorkItemTypeEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission]

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    def post(self, request, slug, work_item_type_id):
        _ = IssueType.objects.filter(workspace__slug=slug, is_epic=False, is_default=True).update(is_default=False)
        _ = IssueType.objects.filter(workspace__slug=slug, is_epic=False, pk=work_item_type_id).update(
            is_default=True, is_active=True
        )

        workspace = Workspace.objects.get(slug=slug)

        projects = Project.objects.filter(workspace__slug=slug).values_list("id", flat=True)
        ProjectIssueType.objects.bulk_create(
            [
                ProjectIssueType(
                    project_id=project_id,
                    issue_type_id=work_item_type_id,
                    level=0,
                    is_default=True,
                    workspace_id=workspace.id,
                    created_by_id=request.user.id,
                    updated_by_id=request.user.id,
                )
                for project_id in projects
            ],
            ignore_conflicts=True,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceWorkItemTypePropertyEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission]

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    def get(self, request, slug, work_item_type_id):
        issue_type_properties = IssueProperty.objects.filter(
            workspace__slug=slug,
            issue_type_properties__issue_type_id=work_item_type_id,
        ).exclude(issue_type_properties__issue_type__is_epic=True)

        return Response(IssuePropertySerializer(issue_type_properties, many=True).data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    def post(self, request, slug, work_item_type_id):
        property_ids = request.data.get("properties", [])

        if not property_ids or not isinstance(property_ids, list):
            return Response(
                {"error": "Expected a list of property_ids"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.get(slug=slug)

        last_sort_order = IssueTypeProperty.objects.filter(
            workspace__slug=slug,
            issue_type_id=work_item_type_id,
        ).aggregate(largest=models.Max("sort_order"))["largest"]
        sort_order = (last_sort_order if last_sort_order else 0) + 10000

        issue_type_properties = [
            IssueTypeProperty(
                workspace_id=workspace.id,
                issue_type_id=work_item_type_id,
                property_id=property_id,
                sort_order=sort_order + (i * 10000),
                created_by_id=request.user.id,
                updated_by_id=request.user.id,
            )
            for i, property_id in enumerate(property_ids)
        ]
        IssueTypeProperty.objects.bulk_create(issue_type_properties, ignore_conflicts=True)
        sort_order_map = {
            str(pid): sort_order
            for pid, sort_order in IssueTypeProperty.objects.filter(
                workspace_id=workspace.id,
                issue_type_id=work_item_type_id,
                property_id__in=property_ids,
            ).values_list("property_id", "sort_order")
        }
        return Response(sort_order_map, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    def patch(self, request, slug, work_item_type_id, pk):
        sort_order = request.data.get("sort_order")
        if sort_order is None:
            return Response(
                {"error": "sort_order is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # if have to update the sort order in the work item type
        issue_type_property = IssueTypeProperty.objects.get(
            workspace__slug=slug,
            issue_type_id=work_item_type_id,
            property_id=pk,
        )
        issue_type_property.sort_order = sort_order
        issue_type_property.save()
        return Response(status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    def delete(self, request, slug, work_item_type_id, pk):
        # first check if the issue type property already exists
        if not IssueTypeProperty.objects.filter(
            workspace__slug=slug,
            issue_type_id=work_item_type_id,
            property_id=pk,
        ).exists():
            return Response(
                {"error": "Issue type property does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # soft-delete any property values for issues using this work item type
        IssuePropertyValue.objects.filter(
            workspace__slug=slug,
            property_id=pk,
            issue__type_id=work_item_type_id,
        ).delete()

        # delete the issue type property
        issue_type_property = IssueTypeProperty.objects.get(
            workspace__slug=slug,
            issue_type_id=work_item_type_id,
            property_id=pk,
        )
        issue_type_property.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ImportWorkItemTypesEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission]

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    def post(self, request, slug, project_id):
        work_item_type_ids = request.data.get("work_item_types", [])
        workspace = Workspace.objects.get(slug=slug)

        # Validate that project_id belongs to this workspace
        if not Project.objects.filter(id=project_id, workspace__slug=slug).exists():
            return Response(
                {"error": "Project does not exist in this workspace"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not work_item_type_ids:
            return Response(status=status.HTTP_200_OK)

        # Fetch all work item types in a single query
        work_item_types = IssueType.objects.filter(
            id__in=work_item_type_ids,
            workspace__slug=slug,
            is_epic=False,
        )

        # Bulk create ProjectIssueType records
        project_issue_types = [
            ProjectIssueType(
                project_id=project_id,
                issue_type_id=wt.id,
                level=0,
                is_default=False,
                workspace_id=workspace.id,
                created_by_id=request.user.id,
                updated_by_id=request.user.id,
            )
            for wt in work_item_types
        ]
        ProjectIssueType.objects.bulk_create(
            project_issue_types,
            ignore_conflicts=True,
        )

        return Response(status=status.HTTP_200_OK)


class WorkspaceDefaultWorkItemTypeEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission]

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)

        # If issue type is already exists
        if not IssueType.objects.filter(
            workspace__slug=slug,
            is_epic=False,
            is_default=True,
        ).exists():
            # Create a new default issue type
            work_item_type = IssueType.objects.create(
                workspace_id=workspace.id,
                name="Task",
                is_default=True,
                description="Default work item type with the option to add new properties",
                logo_props={
                    "in_use": "icon",
                    "icon": {"color": "#ffffff", "background_color": "#6695FF"},
                },
            )

            # Update existing issues to use the new default issue type
            Issue.objects.filter(workspace__slug=slug, type_id__isnull=True).update(type_id=work_item_type.id)

            # for each project in the workspace, create the default work item type
            projects = Project.objects.filter(workspace__slug=slug).values_list("id", flat=True)
            ProjectIssueType.objects.bulk_create(
                [
                    ProjectIssueType(
                        project_id=project_id,
                        issue_type_id=work_item_type.id,
                        level=0,
                        is_default=True,
                        workspace_id=workspace.id,
                    )
                    for project_id in projects
                ],
                ignore_conflicts=True,
            )

            # Update existing work item templates to use the new default issue type
            work_item_type_template_schema = {
                "id": str(work_item_type.id),
                "name": work_item_type.name,
                "logo_props": work_item_type.logo_props,
                "is_epic": work_item_type.is_epic,
            }
            WorkitemTemplate.objects.filter(
                project_id__in=projects,
                workspace__slug=slug,
                type__exact={},
            ).update(type=work_item_type_template_schema)

        # get the workspace feature and toggle it one
        workspace_feature = WorkspaceFeature.objects.get(workspace_id=workspace.id)
        workspace_feature.is_work_item_types_enabled = True
        workspace_feature.save()

        # Refetch the data
        work_item_type = IssueType.objects.filter(
            workspace__slug=slug,
            is_epic=False,
            is_default=True,
        ).annotate(
            project_ids=Coalesce(
                Subquery(
                    ProjectIssueType.objects.filter(issue_type=OuterRef("pk"), workspace__slug=slug)
                    .values("issue_type")
                    .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                    .values("project_ids")
                ),
                [],
            )
        )

        work_item_type = work_item_type.first()

        # Serialize the data
        serializer = IssueTypeSerializer(work_item_type)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ---------------- Below are the endpoints for project level issue types [Old]----------------


class WorkspaceIssueTypeEndpoint(BaseAPIView):
    use_read_replica = True

    permission_classes = [WorkspaceEntityPermission]

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def get(self, request, slug):
        # Get all issue types for the workspace
        issue_types = (
            IssueType.objects.filter(
                workspace__slug=slug,
                is_epic=False,
            )
            # .accessible_to(request.user.id, slug)
            .annotate(
                project_ids=Coalesce(
                    ArrayAgg(
                        "project_issue_types__project_id",
                        distinct=True,
                        filter=Q(
                            project_issue_types__deleted_at__isnull=True,
                            project_issue_types__project_id__isnull=False,
                        ),
                    ),
                    [],
                )
            )
            .prefetch_related("issue_type_properties")
        ).order_by("created_at")
        serializer = IssueTypeSerializer(issue_types, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class IssueTypeEndpoint(BaseAPIView):
    use_read_replica = True

    permission_classes = [ProjectEntityPermission]

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def get(self, request, slug, project_id, pk=None):
        # Get a single issue type
        if pk:
            issue_type = IssueType.objects.get(workspace__slug=slug, project_issue_types__project_id=project_id, pk=pk)
            serializer = IssueTypeSerializer(issue_type)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all issue types
        issue_types = (
            IssueType.objects.filter(
                workspace__slug=slug,
                project_issue_types__project_id=project_id,
                is_epic=False,
            ).annotate(
                project_ids=Coalesce(
                    Subquery(
                        ProjectIssueType.objects.filter(issue_type=OuterRef("pk"), workspace__slug=slug)
                        .values("issue_type")
                        .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                        .values("project_ids")
                    ),
                    [],
                )
            )
        ).order_by("created_at")

        serializer = IssueTypeSerializer(issue_types, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def post(self, request, slug, project_id):
        issue_types = IssueType.objects.filter(
            workspace__slug=slug,
            project_issue_types__project_id=project_id,
            is_epic=False,
        ).values_list("name", flat=True)

        if request.data.get("name") in issue_types:
            return Response(
                {
                    "error": "Issue type with this name already exists",
                    "code": "ISSUE_TYPE_ALREADY_EXIST",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Fetch the project
        project = Project.objects.get(pk=project_id)
        # Create a new issue type
        serializer = IssueTypeSerializer(data=request.data)
        # Check is_active
        if not request.data.get("is_active"):
            request.data["is_active"] = False
        # Validate the data
        serializer.is_valid(raise_exception=True)
        # Save the data
        serializer.save(workspace_id=project.workspace_id)

        # Bridge the issue type with the project
        ProjectIssueType.objects.create(project_id=project_id, issue_type_id=serializer.data["id"], level=0)

        # Refetch the data
        issue_type = (
            IssueType.objects.filter(
                workspace__slug=slug,
                project_issue_types__project_id=project_id,
                is_epic=False,
                pk=serializer.data["id"],
            ).annotate(
                project_ids=Coalesce(
                    Subquery(
                        ProjectIssueType.objects.filter(issue_type=OuterRef("pk"), workspace__slug=slug)
                        .values("issue_type")
                        .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                        .values("project_ids")
                    ),
                    [],
                )
            )
        ).first()

        # Serialize the data
        serializer = IssueTypeSerializer(issue_type)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def patch(self, request, slug, project_id, pk):
        # Update an issue type
        issue_type = IssueType.objects.get(
            workspace__slug=slug,
            project_issue_types__project_id=project_id,
            is_epic=False,
            pk=pk,
        )
        issue_types = (
            IssueType.objects.filter(
                workspace__slug=slug,
                project_issue_types__project_id=project_id,
                is_epic=False,
            )
            .exclude(pk=pk)
            .values_list("name", flat=True)
        )

        # Default cannot be made in active
        if issue_type.is_default and not request.data.get("is_active"):
            return Response(
                {
                    "error": "Default work item type cannot be inactive",
                    "code": "DEFAULT_ISSUE_TYPE_CANNOT_BE_INACTIVE",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.data.get("name") in issue_types:
            return Response(
                {
                    "error": "Issue type with this name already exists",
                    "code": "ISSUE_TYPE_ALREADY_EXIST",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = IssueTypeSerializer(issue_type, data=request.data, partial=True)
        # Validate the data
        serializer.is_valid(raise_exception=True)
        # Save the data
        serializer.save()

        # Refetch the data
        issue_type = IssueType.objects.filter(
            workspace__slug=slug,
            project_issue_types__project_id=project_id,
            is_epic=False,
            pk=serializer.data["id"],
        ).annotate(
            project_ids=Coalesce(
                Subquery(
                    ProjectIssueType.objects.filter(issue_type=OuterRef("pk"), workspace__slug=slug)
                    .values("issue_type")
                    .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                    .values("project_ids")
                ),
                [],
            )
        )

        # Serialize the data
        serializer = IssueTypeSerializer(issue_type.first())

        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def delete(self, request, slug, project_id, pk):
        # Delete an issue type
        work_item_type = IssueType.objects.get(
            workspace__slug=slug,
            project_issue_types__project_id=project_id,
            pk=pk,
            deleted_at__isnull=True,
            is_epic=False,
        )

        # Check if the work item type is the default work item type
        if work_item_type.is_default:
            return Response(
                {"error": "Cannot delete default work item type", "code": "CANNOT_DELETE_DEFAULT_WORK_ITEM_TYPE"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if there are any work items using this work item type
        if Issue.objects.filter(project_id=project_id, type_id=pk, deleted_at__isnull=True).exists():
            return Response(
                {
                    "error": "Cannot delete work item type with associated work items.",
                    "code": "CANNOT_DELETE_WORK_ITEM_TYPE_WITH_ASSOCIATED_WORK_ITEMS",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Delete the work item type
        work_item_type.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MarkDefaultIssueTypeEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def post(self, request, slug, project_id, pk):
        IssueType.objects.filter(
            workspace__slug=slug,
            project_issue_types__project_id=project_id,
            is_epic=False,
            is_default=True,
        ).update(is_default=False)

        IssueType.objects.filter(
            workspace__slug=slug,
            project_issue_types__project_id=project_id,
            is_epic=False,
            pk=pk,
        ).update(is_default=True, is_active=True)

        return Response(status=status.HTTP_200_OK)


class DefaultIssueTypeEndpoint(BaseAPIView):
    use_read_replica = True

    permission_classes = [ProjectEntityPermission]

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def post(self, request, slug, project_id):
        # Get the project
        project = Project.objects.get(pk=project_id)

        # If issue type is already created return an error
        if IssueType.objects.filter(
            workspace__slug=slug,
            project_issue_types__project_id=project_id,
            is_epic=False,
            is_default=True,
        ).exists():
            # Refetch the data
            issue_type = IssueType.objects.filter(
                workspace__slug=slug,
                project_issue_types__project_id=project_id,
                is_epic=False,
                is_default=True,
            ).annotate(
                project_ids=Coalesce(
                    Subquery(
                        ProjectIssueType.objects.filter(issue_type=OuterRef("pk"), workspace__slug=slug)
                        .values("issue_type")
                        .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                        .values("project_ids")
                    ),
                    [],
                )
            )

            work_item_type = issue_type.first()

            # Update existing work item templates to use the new default issue type
            work_item_type_template_schema = {
                "id": str(work_item_type.id),
                "name": work_item_type.name,
                "logo_props": work_item_type.logo_props,
                "is_epic": work_item_type.is_epic,
            }
            WorkitemTemplate.objects.filter(project_id=project_id, workspace__slug=slug, type__exact={}).update(
                type=work_item_type_template_schema
            )

            # Update the project
            project.is_issue_type_enabled = True
            project.save()

            # Serialize the data
            serializer = IssueTypeSerializer(work_item_type)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Check if default issue type exists for the project
        if ProjectIssueType.objects.filter(project_id=project_id, is_default=True).exists():
            return Response(
                {"error": "Default work item type already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create a new default issue type
        issue_type = IssueType.objects.create(
            workspace_id=project.workspace_id,
            name="Task",
            is_default=True,
            description="Default work item type with the option to add new properties",
            logo_props={
                "in_use": "icon",
                "icon": {"color": "#ffffff", "background_color": "#6695FF"},
            },
        )

        # Update existing issues to use the new default issue type
        Issue.objects.filter(project_id=project_id, workspace__slug=slug, type_id__isnull=True).update(
            type_id=issue_type.id
        )

        # Update the project
        project.is_issue_type_enabled = True
        project.save()

        # Bridge the issue type with the project
        ProjectIssueType.objects.create(project_id=project_id, issue_type_id=issue_type.id, level=0, is_default=True)

        # Refetch the data
        issue_type = IssueType.objects.filter(
            workspace__slug=slug,
            project_issue_types__project_id=project_id,
            is_epic=False,
            pk=issue_type.id,
        ).annotate(
            project_ids=Coalesce(
                Subquery(
                    ProjectIssueType.objects.filter(issue_type=OuterRef("pk"), workspace__slug=slug)
                    .values("issue_type")
                    .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                    .values("project_ids")
                ),
                [],
            )
        )

        work_item_type = issue_type.first()

        # Update existing work item templates to use the new default issue type
        work_item_type_template_schema = {
            "id": str(work_item_type.id),
            "name": work_item_type.name,
            "logo_props": work_item_type.logo_props,
            "is_epic": work_item_type.is_epic,
        }
        WorkitemTemplate.objects.filter(project_id=project_id, workspace__slug=slug, type__exact={}).update(
            type=work_item_type_template_schema
        )

        # Serialize the data
        serializer = IssueTypeSerializer(work_item_type)

        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkitemHierarchyEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    @check_feature_flag(FeatureFlag.WORKITEM_TYPE_HIERARCHY)
    def patch(self, request, slug):
        level = request.data.get("level")
        type_ids = request.data.get("type_ids", [])

        # Validate input
        if level is None or not isinstance(level, (int, float)) or level < 0:
            return Response(
                {"error": "A valid non-negative level is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(type_ids, list):
            return Response(
                {"error": "type_ids must be a list of UUIDs."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.get(slug=slug)

        # Get types currently at this level (to determine removals)
        existing_at_level = set(
            IssueType.objects.filter(
                workspace_id=workspace.id,
                level=level,
                is_epic=False,
            ).values_list("id", flat=True)
        )

        # Determine types to remove from this level (reset to 0)
        incoming_ids = set()
        for tid in type_ids:
            try:
                incoming_ids.add(UUID(str(tid)))
            except (ValueError, AttributeError):
                return Response(
                    {"type_id": tid, "error": "INVALID_UUID"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        types_to_remove = existing_at_level - incoming_ids
        types_to_add = incoming_ids

        # Validate that the incoming types exist in the workspace
        if types_to_add:
            found = set(
                IssueType.objects.filter(
                    workspace_id=workspace.id,
                    id__in=types_to_add,
                    is_epic=False,
                ).values_list("id", flat=True)
            )
            missing = types_to_add - found
            if missing:
                return Response(
                    {"type_ids": [str(m) for m in missing], "error": "NOT_FOUND"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Bulk-fetch parent and child type levels for all type_ids to avoid N+1 queries
        all_type_ids = types_to_add | types_to_remove

        # Map type_id -> parent's type level (only non-zero levels, since level 0 is skipped)
        parent_level_map = {}
        if all_type_ids:
            for type_id, parent_level in (
                Issue.objects.filter(
                    type_id__in=all_type_ids,
                    parent__isnull=False,
                    parent__type_id__isnull=False,
                    parent__type__level__gt=0,
                )
                .values_list("type_id", "parent__type__level")
                .distinct()
            ):
                if type_id not in parent_level_map:
                    parent_level_map[type_id] = parent_level

        # Map parent_type_id -> child's type level (only non-zero levels)
        child_level_map = {}
        if all_type_ids:
            for parent_type_id, child_level in (
                Issue.objects.filter(
                    parent__type_id__in=all_type_ids,
                    type_id__isnull=False,
                    type__level__gt=0,
                )
                .values_list("parent__type_id", "type__level")
                .distinct()
            ):
                if parent_type_id not in child_level_map:
                    child_level_map[parent_type_id] = child_level

        # Validate types being added to this level
        for type_id in types_to_add:
            parent_level = parent_level_map.get(type_id)
            if parent_level:
                is_valid, error_msg = validate_type_hierarchy(parent_level, level)
                if not is_valid:
                    return Response(
                        {
                            "type_id": str(type_id),
                            "message": error_msg,
                            "error": "PARENT_TYPE_HIERARCHY_VIOLATION",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            child_level = child_level_map.get(type_id)
            if child_level:
                is_valid, error_msg = validate_type_hierarchy(level, child_level)
                if not is_valid:
                    return Response(
                        {
                            "type_id": str(type_id),
                            "message": error_msg,
                            "error": "CHILD_TYPE_HIERARCHY_VIOLATION",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        # Validate hierarchy rules for types being removed (reset to level 0)
        for type_id in types_to_remove:
            parent_level = parent_level_map.get(type_id)
            if parent_level:
                is_valid, error_msg = validate_type_hierarchy(parent_level, 0)
                if not is_valid:
                    return Response(
                        {"type_id": str(type_id), "message": error_msg, "error": "PARENT_TYPE_HIERARCHY_VIOLATION"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            child_level = child_level_map.get(type_id)
            if child_level:
                is_valid, error_msg = validate_type_hierarchy(0, child_level)
                if not is_valid:
                    return Response(
                        {"type_id": str(type_id), "message": error_msg, "error": "CHILD_TYPE_HIERARCHY_VIOLATION"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        # Apply changes: reset removed types to level 0
        if types_to_remove:
            IssueType.objects.filter(
                id__in=types_to_remove,
                workspace_id=workspace.id,
            ).update(level=0)

        # Apply changes: set incoming types to the requested level
        if types_to_add:
            IssueType.objects.filter(
                id__in=types_to_add,
                workspace_id=workspace.id,
            ).update(level=level)

        return Response(status=status.HTTP_204_NO_CONTENT)
