# Django imports
from django.db.models.query import Prefetch

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .base import TemplateBaseEndpoint
from plane.db.models import Workspace
from plane.ee.models import Template, WorkitemTemplate

from plane.app.permissions import allow_permission, ROLE
from plane.ee.serializers import (
    TemplateSerializer,
    TemplateDataSerializer,
    WorkitemTemplateSerializer,
)
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class WorkitemTemplateEndpoint(TemplateBaseEndpoint):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    @check_feature_flag(FeatureFlag.WORKITEM_TEMPLATES)
    def get(self, request, slug, pk=None):
        if pk:
            templates = (
                Template.objects.filter(
                    workspace__slug=slug,
                    template_type=Template.TemplateType.WORKITEM,
                    pk=pk,
                )
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

        templates = Template.objects.filter(
            workspace__slug=slug, template_type=Template.TemplateType.WORKITEM
        ).prefetch_related(
            Prefetch(
                "workitem_templates",
                queryset=WorkitemTemplate.objects.filter(workspace__slug=slug),
                to_attr="template_data",
            )
        ).prefetch_related("attachments", "categories")
        serializer = TemplateDataSerializer(templates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    @check_feature_flag(FeatureFlag.WORKITEM_TEMPLATES)
    def post(self, request, slug):
        # workspace home
        workspace = Workspace.objects.get(slug=slug)
        # get the template data
        template_data = request.data.pop("template_data", {})
        # validate workitem fields
        success, errors = self.validate_workitem_fields(template_data)
        if not success:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # create a new template only after validation is successful
        template_serializer = TemplateSerializer(data=request.data)
        if template_serializer.is_valid():
            template = template_serializer.save(
                workspace=workspace, template_type=Template.TemplateType.WORKITEM
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
        serializer = WorkitemTemplateSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            # templates
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
        # cleanup template
        template.delete()
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    @check_feature_flag(FeatureFlag.WORKITEM_TEMPLATES)
    def patch(self, request, slug, pk):
        template = Template.objects.get(
            workspace__slug=slug, template_type=Template.TemplateType.WORKITEM, pk=pk
        )
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
        template = Template.objects.get(
            workspace__slug=slug, template_type=Template.TemplateType.WORKITEM, pk=pk
        )
        template.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkitemProjectTemplateEndpoint(TemplateBaseEndpoint):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    @check_feature_flag(FeatureFlag.WORKITEM_TEMPLATES)
    def get(self, request, slug, project_id):
        templates = Template.objects.filter(
            workspace__slug=slug,
            template_type=Template.TemplateType.WORKITEM,
            project_id=project_id,
        ).prefetch_related(
            Prefetch(
                "workitem_templates",
                queryset=WorkitemTemplate.objects.filter(
                    workspace__slug=slug, project_id=project_id
                ),
                to_attr="template_data",
            )
        ).prefetch_related("attachments", "categories")
        serializer = TemplateDataSerializer(templates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    @check_feature_flag(FeatureFlag.WORKITEM_TEMPLATES)
    def post(self, request, slug, project_id):
        # get the template data
        template_data = request.data.pop("template_data", {})
        # validate workitem fields
        success, errors = self.validate_workitem_fields(template_data)
        if not success:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # create a new template
        template_serializer = TemplateSerializer(data=request.data)
        if template_serializer.is_valid():
            template = template_serializer.save(
                project_id=project_id, template_type=Template.TemplateType.WORKITEM
            )
        else:
            return Response(
                template_serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        data = {
            "template": str(template.id),
            "project_id": project_id,
            **template_data,
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
        template = Template.objects.get(
            workspace__slug=slug,
            template_type=Template.TemplateType.WORKITEM,
            project_id=project_id,
            pk=pk,
        )
        serializer = TemplateSerializer(template, data=request.data, partial=True)
        if serializer.is_valid():
            instance = serializer.save()
            # Fetch the template and work item
            template = (
                Template.objects.filter(pk=instance.id, project_id=project_id)
                .prefetch_related(
                    Prefetch(
                        "workitem_templates",
                        queryset=WorkitemTemplate.objects.filter(
                            project_id=project_id, workspace__slug=slug
                        ),
                        to_attr="template_data",
                    )
                )
                .first()
            )
            serializer = TemplateDataSerializer(template)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    @check_feature_flag(FeatureFlag.WORKITEM_TEMPLATES)
    def delete(self, request, slug, project_id, pk):
        template = Template.objects.get(
            workspace__slug=slug,
            template_type=Template.TemplateType.WORKITEM,
            project_id=project_id,
            pk=pk,
        )
        template.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
