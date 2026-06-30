# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import ImporterSerializer
from plane.app.views import BaseAPIView
from plane.bgtasks.eva_import_task import create_importer_service_token, eva_import_task
from plane.db.models import APIToken, Importer, Project, Workspace
from plane.utils.importers.eva.client import EvaApiClient, EvaApiError
from plane.utils.importers.eva.extract import EvaExtractor
from plane.utils.importers.eva.transform import EvaTransformer


def _metadata_from_request(request) -> dict:
    metadata = request.data.get("metadata") if request.method != "GET" else None
    if metadata is None:
        metadata = {
            "url": request.query_params.get("url"),
            "token": request.query_params.get("token"),
            "eva_project_id": request.query_params.get("eva_project_id"),
        }
    return metadata or {}


def _redacted_metadata(metadata: dict) -> dict:
    redacted = dict(metadata or {})
    if "token" in redacted:
        redacted["token"] = "***"
    return redacted


class EvaImporterPreviewEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        metadata = _metadata_from_request(request)
        url = metadata.get("url")
        token = metadata.get("token")
        eva_project_id = metadata.get("eva_project_id")

        if not url or not token:
            return Response({"error": "url and token are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            client = EvaApiClient(url, token)
            client.test_connection()
            extractor = EvaExtractor(client)
            projects = extractor.list_projects() or []
            users = extractor.list_users() or []
            transformer = EvaTransformer()

            response = {
                "projects": [
                    {"id": project.get("id"), "code": project.get("code"), "name": project.get("name")}
                    for project in projects
                ],
                "users": transformer.preview_users({}, users),
            }

            if eva_project_id:
                extracted = extractor.extract_project(eva_project_id)
                counts = extractor.preview_counts(eva_project_id)
                response.update(
                    {
                        **counts,
                        "users": transformer.preview_users(extracted, users),
                        "states": sorted(
                            {
                                task.get("cache_status_type")
                                for task in extracted.get("tasks", [])
                                if task.get("cache_status_type")
                            }
                        ),
                    }
                )
            return Response(response, status=status.HTTP_200_OK)
        except EvaApiError as error:
            return Response({"error": str(error)}, status=status.HTTP_400_BAD_REQUEST)


class EvaImporterListEndpoint(BaseAPIView):
    model = Importer
    serializer_class = ImporterSerializer

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        importers = (
            Importer.objects.filter(workspace__slug=slug)
            .select_related("initiated_by", "project", "workspace")
            .order_by("-created_at")
        )
        serializer = ImporterSerializer(importers, many=True)
        data = serializer.data
        for item, importer in zip(data, importers):
            item["metadata"] = _redacted_metadata(importer.metadata)
        return Response(data, status=status.HTTP_200_OK)


class EvaImporterCreateEndpoint(BaseAPIView):
    model = Importer
    serializer_class = ImporterSerializer

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def post(self, request, slug, project_id):
        workspace = Workspace.objects.get(slug=slug)
        project = Project.objects.get(pk=project_id, workspace=workspace)
        metadata = request.data.get("metadata") or {}
        config = request.data.get("config") or {}
        data = request.data.get("data") or {}

        if not metadata.get("url") or not metadata.get("token") or not metadata.get("eva_project_id"):
            return Response(
                {"error": "metadata.url, metadata.token and metadata.eva_project_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            EvaApiClient(metadata["url"], metadata["token"]).test_connection()
        except EvaApiError as error:
            return Response({"error": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        token = create_importer_service_token(workspace=workspace, user=request.user)
        importer = Importer.objects.create(
            workspace=workspace,
            project=project,
            service="eva",
            status="queued",
            initiated_by=request.user,
            created_by=request.user,
            metadata=metadata,
            config=config,
            data=data,
            token=token,
        )
        eva_import_task.delay(str(importer.id))
        serializer = ImporterSerializer(importer)
        response = serializer.data
        response["metadata"] = _redacted_metadata(importer.metadata)
        return Response(response, status=status.HTTP_201_CREATED)


class EvaImporterDetailEndpoint(BaseAPIView):
    model = Importer
    serializer_class = ImporterSerializer

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, importer_id, service=None):
        importer = Importer.objects.select_related("initiated_by", "project", "workspace").get(
            pk=importer_id, workspace__slug=slug, service=service or "eva"
        )
        serializer = ImporterSerializer(importer)
        response = serializer.data
        response["metadata"] = _redacted_metadata(importer.metadata)
        return Response(response, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, importer_id, service=None):
        importer = Importer.objects.get(pk=importer_id, workspace__slug=slug, service=service or "eva")
        token_id = importer.token_id
        importer.delete()
        if token_id:
            APIToken.objects.filter(pk=token_id, is_service=True).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
