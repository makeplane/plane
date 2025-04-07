# Django imports
from django.db.models.query import Prefetch

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from pydantic import ValidationError

# Module imports
from plane.db.models import Workspace
from plane.ee.views.base import BaseAPIView
from plane.ee.models import Template, WorkitemTemplate
from plane.ee.models.template import (
    Assignee,
    Label,
    Module,
    State,
    Type,
    IssueProperty,
)
from plane.app.permissions import allow_permission, ROLE
from plane.ee.serializers import (
    TemplateSerializer,
    TemplateDataSerializer,
    WorkitemTemplateSerializer,
)
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class TemplateBaseEndpoint(BaseAPIView):
    def validate_field(self, data, field_name, model_class):
        """
        Validates a JSON field against its Pydantic model class.

        Args:
            data (dict): Request data.
            field_name (str): Name of the JSON field.
            model_class: The Pydantic model class to validate against.

        Returns:
            tuple: (is_valid, errors)
        """
        if field_name not in data or not data[field_name]:
            return True, {}  # Empty field is valid for default dict fields

        try:
            # For list fields
            if isinstance(data[field_name], list):
                errors = []
                for i, item in enumerate(data[field_name]):
                    try:
                        model_class(**item)
                    except ValidationError as e:
                        errors.append({f"{field_name}[{i}]": e.errors()})
                return not errors, errors

            # For single object fields
            else:
                model_class(**data[field_name])
                return True, {}
        except ValidationError as e:
            return False, {field_name: e.errors()}

    def validate_workitem_fields(self, template_data):
        """
        Validates JSON fields in the work item template data.

        Args:
            template_data (dict): Request data for work item template.

        Returns:
            tuple: (is_valid, errors)
        """
        validation_map = {
            "state": State,
            "type": Type,
            "assignees": Assignee,
            "labels": Label,
            "modules": Module,
            "properties": IssueProperty,
        }

        validation_errors = {}
        for field_name, model_class in validation_map.items():
            is_valid, errors = self.validate_field(
                template_data, field_name, model_class
            )
            if not is_valid:
                if isinstance(errors, dict):
                    validation_errors.update(errors)
                else:
                    validation_errors[field_name] = errors

        return (False, validation_errors) if validation_errors else (True, {})


class TemplateEndpoint(TemplateBaseEndpoint):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    @check_feature_flag(FeatureFlag.WORKITEM_TEMPLATES)
    def get(self, request, slug, pk=None):
        if pk:
            templates = (
                Template.objects.filter(workspace__slug=slug, pk=pk)
                .prefetch_related(
                    Prefetch(
                        "workitem_templates",
                        queryset=WorkitemTemplate.objects.filter(workspace__slug=slug),
                        to_attr="template_data",
                    )
                )
                .first()
            )
            serializer = TemplateDataSerializer(templates)
            return Response(serializer.data, status=status.HTTP_200_OK)

        templates = Template.objects.filter(workspace__slug=slug).prefetch_related(
            Prefetch(
                "workitem_templates",
                queryset=WorkitemTemplate.objects.filter(workspace__slug=slug),
                to_attr="template_data",
            )
        )
        serializer = TemplateDataSerializer(templates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    @check_feature_flag(FeatureFlag.WORKITEM_TEMPLATES)
    def post(self, request, slug):
        # workspace home
        workspace = Workspace.objects.get(slug=slug)
        # get the template data
        template_data = request.data.get("template_data", {})
        # validate workitem fields
        success, errors = self.validate_workitem_fields(template_data)
        if not success:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # create a new template only after validation is successful
        template = Template.objects.create(
            workspace=workspace,
            name=request.data.get("name", ""),
            description_html=request.data.get("description_html", ""),
            description=request.data.get("description", ""),
            template_type=Template.TemplateType.WORKITEM,
        )

        data = {
            "template": str(template.id),
            **template_data,
            "workspace": str(workspace.id),
        }
        # create a new work item template
        serializer = WorkitemTemplateSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            # Fetch the template and work item
            template = (
                Template.objects.filter(workspace_id=workspace.id, pk=template.id)
                .prefetch_related(
                    Prefetch(
                        "workitem_templates",
                        queryset=WorkitemTemplate.objects.filter(workspace__slug=slug),
                        to_attr="template_data",
                    )
                )
                .first()
            )
            serializer = TemplateDataSerializer(template)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            template.delete()
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    @check_feature_flag(FeatureFlag.WORKITEM_TEMPLATES)
    def patch(self, request, slug, pk):
        template = Template.objects.get(workspace__slug=slug, pk=pk)
        template_data = request.data.pop("template_data")

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
            success, errors = self.validate_workitem_fields(template_data)
            if not success:
                return Response(errors, status=status.HTTP_400_BAD_REQUEST)

            workitem_template = WorkitemTemplate.objects.get(
                workspace__slug=slug, template_id=pk
            )
            workitem_serializer = WorkitemTemplateSerializer(
                workitem_template, data=template_data, partial=True
            )
            if workitem_serializer.is_valid():
                workitem_serializer.save()
            else:
                return Response(
                    workitem_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                )
        # Fetch the template and work item
        template = (
            Template.objects.filter(pk=pk)
            .prefetch_related(
                Prefetch(
                    "workitem_templates",
                    queryset=WorkitemTemplate.objects.filter(workspace__slug=slug),
                    to_attr="template_data",
                )
            )
            .first()
        )
        serializer = TemplateDataSerializer(template)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    @check_feature_flag(FeatureFlag.WORKITEM_TEMPLATES)
    def delete(self, request, slug, pk):
        template = Template.objects.get(workspace__slug=slug, pk=pk)
        template.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectTemplateEndpoint(TemplateBaseEndpoint):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    @check_feature_flag(FeatureFlag.WORKITEM_TEMPLATES)
    def get(self, request, slug, project_id, pk=None):
        if pk:
            templates = (
                Template.objects.filter(workspace__slug=slug, project_id=project_id, pk=pk)
                .prefetch_related(
                    Prefetch(
                        "workitem_templates",
                        queryset=WorkitemTemplate.objects.filter(workspace__slug=slug, project_id=project_id),
                        to_attr="template_data",
                    )
                )
                .first()
            )
            serializer = TemplateDataSerializer(templates)
            return Response(serializer.data, status=status.HTTP_200_OK)
        templates = Template.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).prefetch_related(
            Prefetch(
                "workitem_templates",
                queryset=WorkitemTemplate.objects.filter(
                    workspace__slug=slug, project_id=project_id
                ),
                to_attr="template_data",
            )
        )
        serializer = TemplateDataSerializer(templates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    @check_feature_flag(FeatureFlag.WORKITEM_TEMPLATES)
    def post(self, request, slug, project_id):
        # get the template data
        template_data = request.data.get("template_data", {})
        # validate workitem fields
        success, errors = self.validate_workitem_fields(template_data)
        if not success:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # create a new template
        template = Template.objects.create(
            name=request.data.get("name", ""),
            description_html=request.data.get("description_html", ""),
            description=request.data.get("description", ""),
            template_type=Template.TemplateType.WORKITEM,
            project_id=project_id,
        )

        data = {
            "template": str(template.id),
            "project_id": project_id,
            **request.data.get("template_data", {}),
        }
        # create a new work item template
        serializer = WorkitemTemplateSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            # Fetch the template and work item
            template = (
                Template.objects.filter(project_id=project_id, pk=template.id)
                .prefetch_related(
                    Prefetch(
                        "workitem_templates",
                        queryset=WorkitemTemplate.objects.filter(
                            workspace__slug=slug, project_id=project_id
                        ),
                        to_attr="template_data",
                    )
                )
                .first()
            )
            serializer = TemplateDataSerializer(template)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            # as a cleanup delete the created template if the request fails
            template.delete()
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    @check_feature_flag(FeatureFlag.WORKITEM_TEMPLATES)
    def patch(self, request, slug, project_id, pk):
        template = Template.objects.get(workspace__slug=slug, project_id=project_id, pk=pk)
        template_data = request.data.pop("template_data")

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
            success, errors = self.validate_workitem_fields(template_data)
            if not success:
                return Response(errors, status=status.HTTP_400_BAD_REQUEST)

            workitem_template = WorkitemTemplate.objects.get(
                workspace__slug=slug, project_id=project_id, template_id=pk
            )
            workitem_serializer = WorkitemTemplateSerializer(
                workitem_template, data=template_data, partial=True
            )
            if workitem_serializer.is_valid():
                workitem_serializer.save()
            else:
                return Response(
                    workitem_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                )
        # Fetch the template and work item
        template = (
            Template.objects.filter(pk=pk)
            .prefetch_related(
                Prefetch(
                    "workitem_templates",
                    queryset=WorkitemTemplate.objects.filter(workspace__slug=slug, project_id=project_id),
                    to_attr="template_data",
                )
            )
            .first()
        )
        serializer = TemplateDataSerializer(template)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    @check_feature_flag(FeatureFlag.WORKITEM_TEMPLATES)
    def delete(self, request, slug, project_id, pk):
        template = Template.objects.get(workspace__slug=slug, project_id=project_id, pk=pk)
        template.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
