# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import ImporterSerializer
from plane.app.views import BaseAPIView
from plane.app.views.importer.eva import _user_can_import_to_project
from plane.bgtasks.jira_import_task import create_jira_importer_service_token, jira_import_task
from plane.db.models import APIToken, Importer, Project, Workspace
from plane.utils.importers.jira.client import JiraApiClient, JiraApiError
from plane.utils.importers.jira.extract import JiraExtractor
from plane.utils.importers.jira.transform import JiraTransformer


def _redacted_metadata(metadata: dict) -> dict:
    redacted = dict(metadata or {})
    if "api_token" in redacted:
        redacted["api_token"] = "***"
    if "rtm_api_token" in redacted:
        redacted["rtm_api_token"] = "***"
    return redacted


def _metadata_from_request(request) -> dict:
    metadata = request.data.get("metadata") if request.method != "GET" else None
    if metadata is None:
        metadata = {
            "cloud_hostname": request.query_params.get("cloud_hostname"),
            "email": request.query_params.get("email"),
            "api_token": request.query_params.get("api_token"),
            "project_key": request.query_params.get("project_key"),
            "rtm_api_base_url": request.query_params.get("rtm_api_base_url"),
            "rtm_api_token": request.query_params.get("rtm_api_token"),
        }
    return metadata or {}


class JiraImporterPreviewEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        metadata = _metadata_from_request(request)
        cloud_hostname = metadata.get("cloud_hostname")
        email = metadata.get("email")
        api_token = metadata.get("api_token")
        project_key = metadata.get("project_key")
        config = request.query_params.dict()
        config.pop("cloud_hostname", None)
        config.pop("email", None)
        config.pop("api_token", None)
        config.pop("project_key", None)
        config.pop("rtm_api_base_url", None)
        config.pop("rtm_api_token", None)

        if not cloud_hostname or not email or not api_token or not project_key:
            return Response(
                {"error": "cloud_hostname, email, api_token and project_key are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            client = JiraApiClient(cloud_hostname, email, api_token)
            client.test_connection()
            client.get_project(project_key)
            extractor = JiraExtractor(client, metadata=metadata)
            extracted = extractor.extract_testcases(project_key=project_key, config=config)
            counts = extractor.preview_counts(project_key=project_key, config=config, extracted=extracted)
            transformer = JiraTransformer(custom_field_mappings=config.get("custom_field_mappings"))
            return Response(
                {
                    **counts,
                    "users": transformer.preview_users(extracted),
                    "states": transformer.preview_states(extracted),
                    "jql": extracted.get("jql"),
                },
                status=status.HTTP_200_OK,
            )
        except JiraApiError as error:
            return Response({"error": str(error)}, status=status.HTTP_400_BAD_REQUEST)


class JiraImporterCreateEndpoint(BaseAPIView):
    model = Importer
    serializer_class = ImporterSerializer

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def post(self, request, slug, project_id):
        workspace = Workspace.objects.get(slug=slug)
        project = Project.objects.get(pk=project_id, workspace=workspace)
        metadata = request.data.get("metadata") or {}
        config = request.data.get("config") or {}
        data = request.data.get("data") or {}

        if not metadata.get("cloud_hostname") or not metadata.get("email") or not metadata.get("api_token"):
            return Response(
                {"error": "metadata.cloud_hostname, metadata.email and metadata.api_token are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not metadata.get("project_key"):
            return Response(
                {"error": "metadata.project_key is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not _user_can_import_to_project(user=request.user, workspace=workspace, project=project):
            return Response(
                {"error": "You don't have permission to import into the selected project."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            client = JiraApiClient(
                metadata["cloud_hostname"],
                metadata["email"],
                metadata["api_token"],
            )
            client.test_connection()
            client.get_project(metadata["project_key"])
        except JiraApiError as error:
            return Response({"error": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        token = create_jira_importer_service_token(workspace=workspace, user=request.user)
        importer = Importer.objects.create(
            workspace=workspace,
            project=project,
            service="jira",
            status="queued",
            initiated_by=request.user,
            created_by=request.user,
            metadata=metadata,
            config=config,
            data=data,
            token=token,
        )
        jira_import_task.delay(str(importer.id))
        serializer = ImporterSerializer(importer)
        response = serializer.data
        response["metadata"] = _redacted_metadata(importer.metadata)
        return Response(response, status=status.HTTP_201_CREATED)
