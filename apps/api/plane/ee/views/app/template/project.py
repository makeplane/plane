# Standard library imports
import copy
import re
import uuid
from typing import Dict, List, Any, Optional, Tuple

# Django imports
from django.db.models.query import Prefetch
from django.http import HttpRequest
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.db.models import FileAsset, Workspace
from plane.ee.models import ProjectTemplate, Template
from plane.ee.serializers import (
    ProjectTemplateSerializer,
    TemplateDataSerializer,
    TemplateSerializer,
)
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.settings.storage import S3Storage
from plane.utils.url import is_valid_url
from plane.utils.uuid import is_valid_uuid

from .base import TemplateBaseEndpoint


class ProjectTemplateEndpoint(TemplateBaseEndpoint):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    @check_feature_flag(FeatureFlag.PROJECT_TEMPLATES)
    def get(self, request, slug, pk=None):
        if pk:
            templates = (
                Template.objects.filter(
                    workspace__slug=slug,
                    template_type=Template.TemplateType.PROJECT,
                    pk=pk,
                )
                .prefetch_related(
                    Prefetch(
                        "project_templates",
                        queryset=ProjectTemplate.objects.filter(workspace__slug=slug),
                        to_attr="template_data",
                    )
                )
                .first()
            )
            serializer = TemplateDataSerializer(templates)
            return Response(serializer.data, status=status.HTTP_200_OK)

        templates = (
            Template.objects.filter(
                workspace__slug=slug, template_type=Template.TemplateType.PROJECT
            )
            .prefetch_related(
                Prefetch(
                    "project_templates",
                    queryset=ProjectTemplate.objects.filter(workspace__slug=slug),
                    to_attr="template_data",
                )
            )
            .prefetch_related("attachments", "categories")
        )
        serializer = TemplateDataSerializer(templates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    @check_feature_flag(FeatureFlag.PROJECT_TEMPLATES)
    def post(self, request, slug):
        # workspace home
        workspace = Workspace.objects.get(slug=slug)
        # get the template data
        template_data = request.data.pop("template_data", {})
        # validate project fields
        success, errors = self.validate_project_fields(template_data)
        if not success:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # create a new template only after validation is successful
        template_serializer = TemplateSerializer(data=request.data)
        if template_serializer.is_valid():
            template = template_serializer.save(
                workspace=workspace, template_type=Template.TemplateType.PROJECT
            )
        else:
            return Response(
                template_serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        data = {
            "template": str(template.id),
            **template_data,
            "workspace": str(workspace.id),
        }

        # create a new work item template
        serializer = ProjectTemplateSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            # templates
            template = (
                Template.objects.filter(workspace_id=workspace.id, pk=template.id)
                .prefetch_related(
                    Prefetch(
                        "project_templates",
                        queryset=ProjectTemplate.objects.filter(workspace__slug=slug),
                        to_attr="template_data",
                    )
                )
                .first()
            )
            serializer = TemplateDataSerializer(template)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        # cleanup template
        template.delete()
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    @check_feature_flag(FeatureFlag.PROJECT_TEMPLATES)
    def patch(self, request, slug, pk):
        template = Template.objects.get(
            workspace__slug=slug, template_type=Template.TemplateType.PROJECT, pk=pk
        )
        template_data = request.data.pop("template_data", {})

        template_serializer = TemplateSerializer(
            template, data=request.data, partial=True
        )
        if template_serializer.is_valid():
            template_serializer.save()
        else:
            return Response(
                template_serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        # validate template data
        if template_data:
            success, errors = self.validate_project_fields(template_data)
            if not success:
                return Response(errors, status=status.HTTP_400_BAD_REQUEST)

            project_template = ProjectTemplate.objects.get(
                workspace__slug=slug, template_id=pk
            )
            project_serializer = ProjectTemplateSerializer(
                project_template, data=template_data, partial=True
            )
            if project_serializer.is_valid():
                project_serializer.save()
            else:
                return Response(
                    project_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                )
        # Fetch the template and work item
        template = (
            Template.objects.filter(pk=pk)
            .prefetch_related(
                Prefetch(
                    "project_templates",
                    queryset=ProjectTemplate.objects.filter(workspace__slug=slug),
                    to_attr="template_data",
                )
            )
            .first()
        )
        serializer = TemplateDataSerializer(template)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    @check_feature_flag(FeatureFlag.PROJECT_TEMPLATES)
    def delete(self, request, slug, pk):
        template = Template.objects.get(
            workspace__slug=slug, template_type=Template.TemplateType.PROJECT, pk=pk
        )
        template.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CopyProjectTemplateEndpoint(TemplateBaseEndpoint):
    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    @check_feature_flag(FeatureFlag.PROJECT_TEMPLATES)
    def post(self, request: HttpRequest, slug: str) -> Response:
        template_id: str = request.data.get("template_id")

        if not template_id:
            return Response(
                data={"error": "Template ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get and validate the source template
        template, project_template = self._get_source_template(template_id)
        if not template or not project_template:
            return Response(status=status.HTTP_404_NOT_FOUND)

        workspace: Workspace = Workspace.objects.get(slug=slug)

        # Create new template and project template
        new_template: Template = self._create_new_template(template, workspace)
        _ = self._create_new_project_template(project_template, new_template, workspace)

        return Response(
            data={"template_id": new_template.id}, status=status.HTTP_201_CREATED
        )

    def _get_source_template(
        self, template_id: str
    ) -> Tuple[Optional[Template], Optional[ProjectTemplate]]:
        """Get and validate the source template and project template."""
        template: Optional[Template] = Template.objects.filter(
            pk=template_id,
            template_type=Template.TemplateType.PROJECT,
            is_published=True,
        ).first()

        if not template:
            return None, None

        project_template: Optional[ProjectTemplate] = ProjectTemplate.objects.filter(
            template=template
        ).first()

        return template, project_template

    def _create_new_template(
        self, source_template: Template, workspace: Workspace
    ) -> Template:
        """Create a new template based on the source template."""
        # Check if a template with the same name already exists, then add (copy) to the name
        recent_matching_template = (
            Template.objects.filter(
                name__startswith=source_template.name,
                workspace=workspace,
                template_type=Template.TemplateType.PROJECT,
            )
            .order_by("-created_at")
            .first()
        )
        if recent_matching_template:
            source_template.name = f"{recent_matching_template.name} (copy)"

        return Template.objects.create(
            name=source_template.name,
            short_description=source_template.short_description,
            template_type=Template.TemplateType.PROJECT,
            workspace=workspace,
            created_by=self.request.user,
        )

    def _create_new_project_template(
        self,
        source_project_template: ProjectTemplate,
        new_template: Template,
        workspace: Workspace,
    ) -> ProjectTemplate:
        """Create a new project template based on the source project template."""
        # Copy the source project template
        new_project_template: ProjectTemplate = self._copy_project_template(
            source_project_template, workspace
        )
        new_project_template.template = new_template
        new_project_template.workspace = workspace
        new_project_template.created_by = self.request.user
        new_project_template.updated_by = None
        new_project_template.created_at = timezone.now()
        new_project_template.updated_at = None

        # Process workitem types and epics to clear relation options
        if source_project_template.workitem_types:
            new_project_template.workitem_types = self._clean_workitem_types(
                source_project_template.workitem_types
            )
        if source_project_template.epics:
            new_project_template.epics = self._clean_epics(
                source_project_template.epics
            )

        # Copy the cover asset
        new_project_template.cover_asset = self._copy_cover_asset(
            workspace, source_project_template
        )

        new_project_template.save()
        return new_project_template

    def _copy_project_template(
        self, source_project_template: ProjectTemplate, workspace: Workspace
    ) -> ProjectTemplate:
        """Create a copy of the project template without saving it."""
        # Use model_to_dict to get all field values, then create a new instance

        # Create a new instance with the copied data
        new_project_template: ProjectTemplate = source_project_template
        new_project_template.pk = None
        new_project_template.id = None
        new_project_template.default_assignee = {}
        new_project_template.project_lead = {}
        new_project_template.members = []
        new_project_template.project_state = {}

        latest_matching_project_template = (
            ProjectTemplate.objects.filter(
                name__startswith=source_project_template.name,
                workspace=workspace,
            )
            .order_by("-created_at")
            .first()
        )
        if latest_matching_project_template:
            new_project_template.name = (
                f"{latest_matching_project_template.name} (copy)"
            )

        return new_project_template

    def _clean_workitem_types(
        self, workitem_types: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Clean workitem types by removing relation options."""
        # Deep copy to avoid modifying the original
        cleaned_workitem_types: List[Dict[str, Any]] = copy.deepcopy(workitem_types)
        for workitem_type in cleaned_workitem_types:
            wi_properties: List[Dict[str, Any]] = workitem_type.get("properties", [])
            for wi_property in wi_properties:
                if wi_property.get("property_type") == "RELATION":
                    wi_property["default_value"] = []
        return cleaned_workitem_types

    def _clean_epics(self, epics: Dict[str, Any]) -> Dict[str, Any]:
        """Clean epics by removing relation options."""
        # Deep copy to avoid modifying the original
        cleaned_epics: Dict[str, Any] = copy.deepcopy(epics)
        epic_properties: List[Dict[str, Any]] = cleaned_epics.get("properties", [])
        for epic_property in epic_properties:
            if epic_property.get("property_type") == "RELATION":
                epic_property["default_value"] = []
        return cleaned_epics

    def _copy_cover_asset(
        self,
        workspace: Workspace,
        source_project_template: ProjectTemplate,
    ) -> Optional[str]:
        """Copy the cover asset from the source project template to the new project template."""

        # If the template cover asset is a url we need not do anything
        if is_valid_url(source_project_template.cover_asset):
            return source_project_template.cover_asset

        asset_id: Optional[str] = self._validate_and_extract_asset_id(
            source_project_template.cover_asset
        )
        if asset_id:
            storage: S3Storage = S3Storage(request=self.request)
            new_asset_key: str = f"{workspace.id}/{uuid.uuid4().hex}"
            # Get the original asset
            original_asset: FileAsset = FileAsset.objects.get(pk=asset_id)
            # copy the asset file
            storage.copy_object(original_asset.asset, new_asset_key)

            # Create a new asset instance (don't modify the original)
            new_asset: FileAsset = FileAsset.objects.create(
                workspace=workspace,
                entity_type=FileAsset.EntityTypeContext.PROJECT_COVER,
                created_by=self.request.user,
                asset=new_asset_key,
            )
            return new_asset.asset_url
        return None

    def _validate_and_extract_asset_id(self, url: str) -> Optional[str]:
        """
        Validate and extract the asset ID from the given URL.

        Args:
            url (str): The URL to validate and extract the asset ID from.

        Returns:
            Optional[str]: None if the URL is invalid, otherwise the extracted asset ID.
        """
        url_pattern: str = r"^/api/assets/v2/static/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/?$"  # noqa: E501

        pattern_match = re.match(url_pattern, url)
        if not pattern_match:
            return None

        # Extract the UUID part
        potential_uuid: str = pattern_match.group(1)

        if is_valid_uuid(potential_uuid):
            return potential_uuid

        return None
