# Django imports
from django.db.models.query import Prefetch

# Third party imports
from rest_framework.response import Response
from rest_framework import status


# Module imports
from .base import TemplateBaseEndpoint
from plane.db.models import Workspace
from plane.ee.models import Template, ProjectTemplate
from plane.app.permissions import allow_permission, ROLE
from plane.ee.serializers import (
    TemplateSerializer,
    TemplateDataSerializer,
    ProjectTemplateSerializer,
)
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


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

        templates = Template.objects.filter(
            workspace__slug=slug, template_type=Template.TemplateType.PROJECT
        ).prefetch_related(
            Prefetch(
                "project_templates",
                queryset=ProjectTemplate.objects.filter(workspace__slug=slug),
                to_attr="template_data",
            )
        ).prefetch_related("attachments", "categories")
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
