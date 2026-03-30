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

from rest_framework.response import Response
from rest_framework import status

# Plane imports
from plane.api.views.base import BaseViewSet
from plane.ee.models import Initiative, InitiativeLabel, InitiativeLabelAssociation, InitiativeProject, InitiativeEpic
from plane.app.permissions import WorkSpaceAdminPermission
from plane.db.models import Workspace, Project, Issue
from plane.api.serializers import InitiativeSerializer, InitiativeLabelSerializer, ProjectSerializer, IssueSerializer
from plane.api.permissions import InitiativesFeatureFlagPermission
from plane.authentication.permissions.oauth import TokenHasScopeIfOAuth

# OpenAPI imports
from plane.utils.openapi.decorators import initiative_docs, initiative_entity_docs
from drf_spectacular.utils import OpenApiRequest, OpenApiResponse
from plane.utils.openapi import (
    INITIATIVE_EXAMPLE,
    INITIATIVE_LABEL_EXAMPLE,
    create_paginated_response,
    DELETED_RESPONSE,
    PROJECT_EXAMPLE,
    EPIC_EXAMPLE,
    INITIATIVE_ID_PARAMETER,
    INITIATIVE_LABEL_ID_PARAMETER,
    WORKSPACE_SLUG_PARAMETER,
    CURSOR_PARAMETER,
    PER_PAGE_PARAMETER,
)
from plane.utils.oauth import (
    READ_SCOPE,
    WRITE_SCOPE,
    INITIATIVES_READ_SCOPE,
    INITIATIVES_WRITE_SCOPE,
    INITIATIVES_LABELS_READ_SCOPE,
    INITIATIVES_LABELS_WRITE_SCOPE,
    INITIATIVES_PROJECTS_READ_SCOPE,
    INITIATIVES_PROJECTS_WRITE_SCOPE,
    INITIATIVES_EPICS_READ_SCOPE,
    INITIATIVES_EPICS_WRITE_SCOPE,
)


class InitiativeViewSet(BaseViewSet):
    use_read_replica = True

    serializer_class = InitiativeSerializer
    model = Initiative
    permission_classes = [WorkSpaceAdminPermission, InitiativesFeatureFlagPermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [INITIATIVES_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [INITIATIVES_WRITE_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [INITIATIVES_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [INITIATIVES_WRITE_SCOPE]],
        "PUT": [[WRITE_SCOPE], [INITIATIVES_WRITE_SCOPE]],
    }

    def get_queryset(self):
        return Initiative.objects.filter(workspace__slug=self.kwargs.get("slug"))

    @initiative_docs(
        operation_id="create_initiative",
        summary="Create a new initiative",
        description="Create a new initiative in the workspace",
        request=OpenApiRequest(request=InitiativeSerializer),
        responses={
            201: OpenApiResponse(
                description="Initiative created", response=InitiativeSerializer, examples=[INITIATIVE_EXAMPLE]
            ),
        },
    )
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = InitiativeSerializer(data=request.data, context={"workspace_id": workspace.id})
        if serializer.is_valid():
            serializer.save(workspace_id=workspace.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @initiative_docs(
        operation_id="list_initiatives",
        summary="List initiatives",
        description="List all initiatives in the workspace",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                InitiativeSerializer, "Initiative", "List of initiatives", example_name="Paginated Initiatives"
            ),
        },
    )
    def list(self, request, slug):
        initiatives = self.get_queryset()
        return self.paginate(
            request=request,
            queryset=(initiatives),
            on_results=lambda initiatives: InitiativeSerializer(initiatives, many=True).data,
            default_per_page=20,
        )

    @initiative_docs(
        operation_id="retrieve_initiative",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            INITIATIVE_ID_PARAMETER,
        ],
        summary="Retrieve an initiative",
        description="Retrieve an initiative by its ID",
        responses={
            200: OpenApiResponse(description="Initiative", response=InitiativeSerializer, examples=[INITIATIVE_EXAMPLE])
        },
    )
    def retrieve(self, request, slug, pk):
        initiative = self.get_queryset().get(id=pk)
        return Response(InitiativeSerializer(initiative).data, status=status.HTTP_200_OK)

    @initiative_docs(
        operation_id="update_initiative",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            INITIATIVE_ID_PARAMETER,
        ],
        summary="Update an initiative",
        description="Update an initiative by its ID",
        request=OpenApiRequest(request=InitiativeSerializer),
        responses={
            200: OpenApiResponse(description="Initiative", response=InitiativeSerializer, examples=[INITIATIVE_EXAMPLE])
        },
    )
    def partial_update(self, request, slug, pk):
        initiative = self.get_queryset().get(id=pk)
        serializer = InitiativeSerializer(initiative, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @initiative_docs(
        operation_id="delete_initiative",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            INITIATIVE_ID_PARAMETER,
        ],
        summary="Delete an initiative",
        description="Delete an initiative by its ID",
        responses={204: DELETED_RESPONSE},
    )
    def destroy(self, request, slug, pk):
        initiative = self.get_queryset().get(id=pk)
        initiative.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @initiative_docs(
        operation_id="list_initiative_labels",
        summary="List initiative labels",
        description="List all labels associated with an initiative",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            INITIATIVE_ID_PARAMETER,
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                InitiativeLabelSerializer,
                "InitiativeLabel",
                "List of initiative labels",
                example_name="Paginated Initiative Labels",
            )
        },
    )
    def get_labels(self, request, slug, initiative_id):
        initiative = self.get_queryset().get(id=initiative_id)
        labels = InitiativeLabel.objects.filter(
            initiative_label_associations__initiative=initiative, initiative_label_associations__deleted_at__isnull=True
        )
        return self.paginate(
            request=request,
            queryset=(labels),
            on_results=lambda labels: InitiativeLabelSerializer(labels, many=True).data,
            default_per_page=20,
        )

    @initiative_docs(
        operation_id="add_initiative_labels",
        summary="Add labels to an initiative",
        description="Add labels to an initiative by its ID",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            INITIATIVE_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request={
                "type": "object",
                "properties": {
                    "label_ids": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "format": "uuid",
                        },
                    },
                },
            }
        ),
        responses={
            200: OpenApiResponse(
                description="Labels added", response=InitiativeLabelSerializer, examples=[INITIATIVE_LABEL_EXAMPLE]
            )
        },
    )
    def add_labels(self, request, slug, initiative_id):
        initiative = self.get_queryset().get(id=initiative_id)
        label_ids = request.data.get("label_ids", [])

        # skip adding labels that are already associated with the initiative
        existing_label_ids = InitiativeLabelAssociation.objects.filter(
            initiative=initiative, label_id__in=label_ids
        ).values_list("label_id", flat=True)

        # Convert UUIDs to strings for proper comparison
        existing_label_ids = [str(uuid_id) for uuid_id in existing_label_ids]
        new_label_ids = set(label_ids) - set(existing_label_ids)

        for label_id in new_label_ids:
            label = InitiativeLabel.objects.get(id=label_id, workspace__slug=slug)
            InitiativeLabelAssociation.objects.create(
                initiative=initiative, label=label, workspace_id=initiative.workspace_id
            )
        # send new labels in response
        new_labels = InitiativeLabel.objects.filter(id__in=label_ids)
        serializer = InitiativeLabelSerializer(new_labels, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @initiative_docs(
        operation_id="remove_initiative_labels",
        summary="Remove labels from an initiative",
        description="Remove labels from an initiative by its ID",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            INITIATIVE_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request={
                "type": "object",
                "properties": {
                    "label_ids": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "format": "uuid",
                        },
                    },
                },
            }
        ),
        responses={204: DELETED_RESPONSE},
    )
    def remove_labels(self, request, slug, initiative_id):
        initiative = self.get_queryset().get(id=initiative_id)
        label_ids = request.data.get("label_ids", [])
        for label_id in label_ids:
            label = InitiativeLabel.objects.get(id=label_id, workspace__slug=slug)
            InitiativeLabelAssociation.objects.filter(initiative=initiative, label=label).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InitiativeEpicsViewSet(BaseViewSet):
    use_read_replica = True

    serializer_class = InitiativeSerializer
    model = Initiative
    permission_classes = [WorkSpaceAdminPermission, InitiativesFeatureFlagPermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [INITIATIVES_READ_SCOPE, INITIATIVES_EPICS_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [INITIATIVES_WRITE_SCOPE, INITIATIVES_EPICS_WRITE_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [INITIATIVES_WRITE_SCOPE, INITIATIVES_EPICS_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [INITIATIVES_WRITE_SCOPE, INITIATIVES_EPICS_WRITE_SCOPE]],
        "PUT": [[WRITE_SCOPE], [INITIATIVES_WRITE_SCOPE, INITIATIVES_EPICS_WRITE_SCOPE]],
    }

    def get_queryset(self):
        return Initiative.objects.filter(workspace__slug=self.kwargs.get("slug"))

    @initiative_docs(
        operation_id="list_initiative_epics",
        summary="List epics associated with an initiative",
        description="List all epics associated with an initiative",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            INITIATIVE_ID_PARAMETER,
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
        ],
        responses={
            200: create_paginated_response(IssueSerializer, "Issue", "List of epics", example_name="Paginated Epics")
        },
    )
    def get_epics(self, request, slug, initiative_id):
        initiative = self.get_queryset().get(id=initiative_id)
        epics = Issue.objects.filter(initiative_epics__initiative=initiative, initiative_epics__deleted_at__isnull=True)
        return self.paginate(
            request=request,
            queryset=(epics),
            on_results=lambda epics: IssueSerializer(epics, many=True).data,
            default_per_page=20,
        )

    @initiative_docs(
        operation_id="add_initiative_epics",
        summary="Add epics to an initiative",
        description="Add epics to an initiative by its ID",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            INITIATIVE_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request={
                "type": "object",
                "properties": {
                    "epic_ids": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "format": "uuid",
                        },
                    },
                },
            }
        ),
        responses={200: OpenApiResponse(description="Epics added", response=IssueSerializer, examples=[EPIC_EXAMPLE])},
    )
    def add_epics(self, request, slug, initiative_id):
        initiative = self.get_queryset().get(id=initiative_id)
        epic_ids = request.data.get("epic_ids", [])

        # Validate that all provided IDs are actually epics
        valid_epics_count = Issue.objects.filter(id__in=epic_ids, type__isnull=False, type__is_epic=True).count()

        if valid_epics_count != len(epic_ids):
            return Response({"error": "Invalid epic IDs provided"}, status=status.HTTP_400_BAD_REQUEST)

        # skip adding epics that are already associated with the initiative
        existing_epic_ids = InitiativeEpic.objects.filter(initiative=initiative, epic_id__in=epic_ids).values_list(
            "epic_id", flat=True
        )

        # Convert UUIDs to strings for proper comparison
        existing_epic_ids = [str(uuid_id) for uuid_id in existing_epic_ids]
        new_epic_ids = set(epic_ids) - set(existing_epic_ids)

        for epic_id in new_epic_ids:
            epic = Issue.objects.get(id=epic_id, workspace__slug=slug)
            InitiativeEpic.objects.create(initiative=initiative, epic=epic, workspace_id=initiative.workspace_id)
        # send new epics in response
        new_epics = Issue.objects.filter(id__in=epic_ids)
        serializer = IssueSerializer(new_epics, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @initiative_entity_docs(
        operation_id="remove_initiative_epics",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            INITIATIVE_ID_PARAMETER,
        ],
        summary="Remove epics from an initiative",
        description="Remove epics from an initiative by its ID",
        request=OpenApiRequest(
            request={
                "type": "object",
                "properties": {
                    "epic_ids": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "format": "uuid",
                        },
                    },
                },
            }
        ),
        responses={204: DELETED_RESPONSE},
    )
    def remove_epics(self, request, slug, initiative_id):
        initiative = self.get_queryset().get(id=initiative_id)
        epic_ids = request.data.get("epic_ids", [])
        for epic_id in epic_ids:
            epic = Issue.objects.get(id=epic_id, workspace__slug=slug)
            InitiativeEpic.objects.filter(initiative=initiative, epic=epic).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InitiativeProjectsViewSet(BaseViewSet):
    use_read_replica = True

    serializer_class = InitiativeSerializer
    model = Initiative
    permission_classes = [WorkSpaceAdminPermission, InitiativesFeatureFlagPermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [INITIATIVES_READ_SCOPE, INITIATIVES_PROJECTS_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [INITIATIVES_WRITE_SCOPE, INITIATIVES_PROJECTS_WRITE_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [INITIATIVES_WRITE_SCOPE, INITIATIVES_PROJECTS_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [INITIATIVES_WRITE_SCOPE, INITIATIVES_PROJECTS_WRITE_SCOPE]],
        "PUT": [[WRITE_SCOPE], [INITIATIVES_WRITE_SCOPE, INITIATIVES_PROJECTS_WRITE_SCOPE]],
    }

    def get_queryset(self):
        return Initiative.objects.filter(workspace__slug=self.kwargs.get("slug"))

    @initiative_docs(
        operation_id="list_initiative_projects",
        summary="List projects associated with an initiative",
        description="List all projects associated with an initiative",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            INITIATIVE_ID_PARAMETER,
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                ProjectSerializer, "Project", "List of projects", example_name="Paginated Projects"
            )
        },
    )
    def get_projects(self, request, slug, initiative_id):
        initiative = self.get_queryset().get(id=initiative_id)
        projects = Project.objects.filter(initiatives__initiative=initiative, initiatives__deleted_at__isnull=True)
        return self.paginate(
            request=request,
            queryset=(projects),
            on_results=lambda projects: ProjectSerializer(projects, many=True).data,
            default_per_page=20,
        )

    @initiative_docs(
        operation_id="add_initiative_projects",
        summary="Add projects to an initiative",
        description="Add projects to an initiative by its ID",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            INITIATIVE_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request={
                "type": "object",
                "properties": {
                    "project_ids": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "format": "uuid",
                        },
                    },
                },
            }
        ),
        responses={
            200: OpenApiResponse(description="Projects added", response=ProjectSerializer, examples=[PROJECT_EXAMPLE])
        },
    )
    def add_projects(self, request, slug, initiative_id):
        initiative = self.get_queryset().get(id=initiative_id)
        project_ids = request.data.get("project_ids", [])

        # skip adding projects that are already associated with the initiative
        existing_project_ids = InitiativeProject.objects.filter(
            initiative=initiative, project_id__in=project_ids
        ).values_list("project_id", flat=True)

        # Convert UUIDs to strings for proper comparison
        existing_project_ids = [str(uuid_id) for uuid_id in existing_project_ids]
        new_project_ids = set(project_ids) - set(existing_project_ids)

        for project_id in new_project_ids:
            project = Project.objects.get(id=project_id, workspace__slug=slug)
            InitiativeProject.objects.create(
                initiative=initiative, project=project, workspace_id=initiative.workspace_id
            )
        # send new projects in response
        new_projects = Project.objects.filter(id__in=project_ids)
        serializer = ProjectSerializer(new_projects, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @initiative_docs(
        operation_id="remove_initiative_projects",
        summary="Remove projects from an initiative",
        description="Remove projects from an initiative by its ID",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            INITIATIVE_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request={
                "type": "object",
                "properties": {
                    "project_ids": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "format": "uuid",
                        },
                    },
                },
            }
        ),
        responses={204: DELETED_RESPONSE},
    )
    def remove_projects(self, request, slug, initiative_id):
        initiative = self.get_queryset().get(id=initiative_id)
        project_ids = request.data.get("project_ids", [])
        for project_id in project_ids:
            project = Project.objects.get(id=project_id, workspace__slug=slug)
            InitiativeProject.objects.filter(initiative=initiative, project=project).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InitiativeLabelViewSet(BaseViewSet):
    use_read_replica = True

    serializer_class = InitiativeLabelSerializer
    model = InitiativeLabel
    permission_classes = [WorkSpaceAdminPermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [INITIATIVES_LABELS_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [INITIATIVES_LABELS_WRITE_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [INITIATIVES_LABELS_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [INITIATIVES_LABELS_WRITE_SCOPE]],
        "PUT": [[WRITE_SCOPE], [INITIATIVES_LABELS_WRITE_SCOPE]],
    }

    def get_queryset(self):
        return InitiativeLabel.objects.filter(workspace__slug=self.kwargs.get("slug")).order_by("sort_order")

    @initiative_entity_docs(
        operation_id="create_initiative_label",
        summary="Create a new initiative label",
        description="Create a new initiative label in the workspace",
        request=OpenApiRequest(request=InitiativeLabelSerializer),
        responses={
            201: OpenApiResponse(
                description="Initiative label created",
                response=InitiativeLabelSerializer,
                examples=[INITIATIVE_LABEL_EXAMPLE],
            )
        },
    )
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = InitiativeLabelSerializer(data=request.data, context={"workspace_id": workspace.id})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @initiative_entity_docs(
        operation_id="list_initiative_labels",
        summary="List initiative labels",
        description="List all initiative labels in the workspace",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                InitiativeLabelSerializer,
                "InitiativeLabel",
                "List of initiative labels",
                example_name="Paginated Initiative Labels",
            )
        },
    )
    def list(self, request, slug):
        initiative_labels = self.get_queryset()
        print("initiative_labels", initiative_labels)
        paginated_data = self.paginate(
            request=request,
            queryset=initiative_labels,
            on_results=lambda initiative_labels: InitiativeLabelSerializer(initiative_labels, many=True).data,
            default_per_page=20,
        )
        return paginated_data

    @initiative_entity_docs(
        operation_id="retrieve_initiative_label",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            INITIATIVE_LABEL_ID_PARAMETER,
        ],
        summary="Retrieve an initiative label",
        description="Retrieve an initiative label by its ID",
        responses={
            200: OpenApiResponse(
                description="Initiative label", response=InitiativeLabelSerializer, examples=[INITIATIVE_LABEL_EXAMPLE]
            )
        },
    )
    def retrieve(self, request, slug, pk):
        initiative_label = self.get_queryset().get(id=pk)
        return Response(InitiativeLabelSerializer(initiative_label).data, status=status.HTTP_200_OK)

    @initiative_entity_docs(
        operation_id="update_initiative_label",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            INITIATIVE_LABEL_ID_PARAMETER,
        ],
        summary="Update an initiative label",
        description="Update an initiative label by its ID",
        request=OpenApiRequest(request=InitiativeLabelSerializer),
        responses={
            200: OpenApiResponse(
                description="Initiative label", response=InitiativeLabelSerializer, examples=[INITIATIVE_LABEL_EXAMPLE]
            )
        },
    )
    def partial_update(self, request, slug, pk):
        initiative_label = self.get_queryset().get(id=pk)
        serializer = InitiativeLabelSerializer(
            initiative_label, data=request.data, partial=True, context={"workspace_id": initiative_label.workspace_id}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @initiative_entity_docs(
        operation_id="delete_initiative_label",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            INITIATIVE_LABEL_ID_PARAMETER,
        ],
        summary="Delete an initiative label",
        description="Delete an initiative label by its ID",
        responses={204: DELETED_RESPONSE},
    )
    def destroy(self, request, slug, pk):
        initiative_label = self.get_queryset().get(id=pk)
        initiative_label.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
