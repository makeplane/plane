# Python imports
import uuid
import json
import datetime

# Django imports
from django.utils import timezone
from django.db.models import Prefetch
from django.core.serializers.json import DjangoJSONEncoder

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from sentry_sdk import capture_exception

# Module imports
from .base import BaseViewSet
from plane.api.serializers import (
    PropertySerializer,
    IssuePropertyValueSerializer,
    PropertyReadSerializer,
    PropertyLiteSerializer,
)
from plane.db.models import (
    Workspace,
    Property,
    IssuePropertyValue,
    Project,
    Issue,
    PropertyTransaction,
)
from plane.api.permissions import WorkSpaceAdminPermission


def is_valid_uuid(uuid_string):
    try:
        uuid_obj = uuid.UUID(uuid_string)
        return str(uuid_obj) == uuid_string
    except ValueError:
        return False


class PropertyViewSet(BaseViewSet):
    serializer_class = PropertySerializer
    model = Property
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .prefetch_related("children")
        )

    def list(self, request, slug):
        try:
            project_id = request.GET.get("project", False)
            issue_properties = self.get_queryset().filter(
                parent__isnull=True,
            )

            if project_id:
                issue_properties = issue_properties.filter(project_id=project_id)

            serializer = PropertySerializer(issue_properties, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def create(self, request, slug):
        try:
            workspace = Workspace.objects.get(slug=slug)
            serializer = PropertySerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(workspace_id=workspace.id)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def list_objects(self, request, slug):
        try:
            project_id = request.GET.get("project", False)
            custom_objects = self.get_queryset().filter(
                type="entity",
                parent__isnull=True,
            )

            if project_id:
                custom_objects = custom_objects.filter(project_id=project_id)

            serializer = PropertyLiteSerializer(custom_objects, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def retrieve(self, request, slug, pk):
        try:
            project_id = request.GET.get("project", False)
            issue_properties = self.get_queryset().get(workspace__slug=slug, pk=pk)

            if project_id:
                issue_properties = issue_properties.filter(project_id=project_id)

            serializer = PropertySerializer(issue_properties)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class IssuePropertyValueViewSet(BaseViewSet):
    serializer_class = IssuePropertyValueSerializer
    model = IssuePropertyValue

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            issue_id=self.kwargs.get("issue_id"),
            issue_property_id=self.kwargs.get("issue_property_id"),
        )

    def create(self, request, slug, project_id, issue_id):
        try:
            request_data = request.data.get("issue_properties", [])

            project = Project.objects.get(pk=project_id)
            workspace_id = project.workspace_id

            # Get all the issue_properties
            issue_properties = Property.objects.filter(
                pk__in=[prop for prop in request_data if is_valid_uuid(prop)],
                workspace__slug=slug,
            )

            issue_property_values = IssuePropertyValue.objects.filter(issue_id=issue_id)

            # This will be used to save the issue properties in bulk
            bulk_issue_props_create = []
            bulk_issue_props_update = []
            bulk_issue_prop_transaction = []
            for issue_property in issue_properties:
                prop_values = request_data.get(str(issue_property.id))

                if issue_property.is_multi and isinstance(prop_values, list):
                    # Check if the value already exists then update
                    issue_prop_values = [
                        issue_prop_value
                        for issue_prop_value in issue_property_values
                        if str(issue_property.id) == str(issue_prop_value.property_id)
                    ]

                    # Already existing
                    if issue_prop_values:
                        for prop_value, issue_prop_value in zip(
                            prop_values, issue_prop_values
                        ):
                            if issue_prop_value.value != prop_value:
                                bulk_issue_prop_transaction.append(
                                    PropertyTransaction(
                                        id=uuid.uuid4(),
                                        workspace_id=workspace_id,
                                        project_id=project_id,
                                        property_id=issue_property.id,
                                        property_value_id=issue_prop_value.id,
                                        from_value=issue_prop_value.value,
                                        to_value=prop_value,
                                        entity="issue",
                                        entity_uuid=issue_id,
                                        epoch=(
                                            datetime.datetime.timestamp(timezone.now())
                                            * 1000
                                        ),
                                        actor=request.user,
                                    )
                                )
                                issue_prop_value.value = prop_value
                                bulk_issue_props_update.append(issue_prop_value)
                    # Create new one
                    else:
                        # Only for relation, multi select and select we will storing uuids
                        # for rest all we will storing the string values
                        if (
                            issue_property.type == "relation"
                            or issue_property.type == "multi_select"
                            or issue_property.type == "select"
                        ):
                            for prop_value in prop_values:
                                bulk_issue_props_create.append(
                                    IssuePropertyValue(
                                        value=prop_value,
                                        type="uuid",
                                        property=issue_property,
                                        project_id=project_id,
                                        workspace_id=workspace_id,
                                        issue_id=issue_id,
                                    )
                                )
                        else:
                            for prop_value in prop_values:
                                bulk_issue_props_create.append(
                                    IssuePropertyValue(
                                        value=prop_value,
                                        type="text",
                                        property=issue_property,
                                        project_id=project_id,
                                        workspace_id=workspace_id,
                                        issue_id=issue_id,
                                    )
                                )
                else:
                    issue_prop_values = [
                        issue_prop_value
                        for issue_prop_value in issue_property_values
                        if str(issue_property.id) == str(issue_prop_value.property_id)
                    ]

                    # Already existing
                    if issue_prop_values:
                        # Only update if the values are different
                        if str(issue_prop_values[0].value) != str(prop_values):
                            bulk_issue_prop_transaction.append(
                                PropertyTransaction(
                                    id=uuid.uuid4(),
                                    workspace_id=workspace_id,
                                    project_id=project_id,
                                    property=issue_property,
                                    property_value=issue_prop_values[0],
                                    from_value=issue_prop_values[0].value,
                                    to_value=prop_values,
                                    entity="issue",
                                    entity_uuid=issue_id,
                                    epoch=(
                                        datetime.datetime.timestamp(timezone.now())
                                        * 1000
                                    ),
                                    actor=request.user,
                                )
                            )
                            issue_prop_values[0].value = prop_values
                            bulk_issue_props_update.append(
                                issue_prop_values[0],
                            )
                    # Non existent
                    else:
                        # Only for relation, multi select and select we will storing uuids
                        if (
                            issue_property.type == "relation"
                            or issue_property.type == "multi_select"
                            or issue_property.type == "select"
                        ):
                            bulk_issue_props_create.append(
                                IssuePropertyValue(
                                    value=prop_values,
                                    type="uuid",
                                    property=issue_property,
                                    project_id=project_id,
                                    workspace_id=workspace_id,
                                    issue_id=issue_id,
                                )
                            )
                        else:
                            bulk_issue_props_create.append(
                                IssuePropertyValue(
                                    value=prop_values,
                                    type="text",
                                    property=issue_property,
                                    project_id=project_id,
                                    workspace_id=workspace_id,
                                    issue_id=issue_id,
                                )
                            )

            new_values = IssuePropertyValue.objects.bulk_create(
                bulk_issue_props_create,
                batch_size=100,
                ignore_conflicts=True,
            )
            _ = IssuePropertyValue.objects.bulk_update(
                bulk_issue_props_update,
                ["value"],
                batch_size=100,
            )

            # Update the bulk with new values also
            for new_value in new_values:
                bulk_issue_prop_transaction.append(
                    PropertyTransaction(
                        id=uuid.uuid4(),
                        workspace_id=workspace_id,
                        project_id=project_id,
                        property_id=new_value.property_id,
                        property_value=new_value,
                        to_value=new_value.value,
                        entity="issue",
                        entity_uuid=issue_id,
                        epoch=(datetime.datetime.timestamp(timezone.now()) * 1000),
                        actor=request.user,
                    )
                )

            # Write the transaction table
            _ = PropertyTransaction.objects.bulk_create(
                bulk_issue_prop_transaction,
                batch_size=100,
                ignore_conflicts=True,
            )

            # Update the JSON column for faster reads
            # This makes the writes a bit slow
            # TODO: Find a better approach for faster reads
            issue = Issue.objects.get(
                pk=issue_id, workspace__slug=slug, project_id=project_id
            )
            issue_properties = (
                Property.objects.filter(
                    workspace__slug=slug,
                    property_values__project_id=project_id,
                )
                .prefetch_related("children")
                .prefetch_related(
                    Prefetch(
                        "property_values",
                        queryset=IssuePropertyValue.objects.filter(
                            issue_id=issue_id,
                            workspace__slug=slug,
                            project_id=project_id,
                        ),
                    )
                )
                .distinct()
            )
            serializer_data = PropertyReadSerializer(issue_properties, many=True)
            issue.issue_properties = json.loads(
                json.dumps(serializer_data.data, cls=DjangoJSONEncoder)
            )
            issue.save(update_fields=["issue_properties"])

            issue_property_values = IssuePropertyValue.objects.filter(
                workspace__slug=slug, project_id=project_id, issue_id=issue_id
            ).select_related("property")

            serilaizer = IssuePropertyValueSerializer(issue_property_values, many=True)
            return Response(serilaizer.data, status=status.HTTP_201_CREATED)
        except Project.DoesNotExist:
            return Response(
                {"error": "Project Does not exists"}, status=status.HTTP_400_BAD_REQUEST
            )
        # except Exception as e:
        #     capture_exception(e)
        #     return Response(
        #         {"error": "Something went wrong please try again later"},
        #         status=status.HTTP_400_BAD_REQUEST,
        #     )

    def partial_update(self, request, slug, project_id, issue_id):
        try:
            request_data = request.data.get("issue_property_values", [])

            issue_property_values = IssuePropertyValue.objects.filter(
                issue_id=issue_id,
                workspace__slug=slug,
                project_id=project_id,
            )
            bulk_issue_prop_values = []
            for issue_prop_value in request_data:
                issue_property_value = [
                    issue_value
                    for issue_value in issue_property_values
                    if str(issue_prop_value) == str(issue_value.pk)
                ]

                if issue_property_value:
                    issue_property_value[0].value = request_data.get(issue_prop_value)
                bulk_issue_prop_values.append(issue_property_value)

            updated_issue_props = IssuePropertyValue.objects.bulk_update(
                bulk_issue_prop_values, ["value"], batch_size=100, ignore_conflicts=True
            )
            serializer = IssuePropertyValueSerializer(updated_issue_props, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def list(self, request, slug, project_id, issue_id):
        try:
            properties = (
                Property.objects.filter(
                    workspace__slug=slug,
                    property_values__project_id=project_id,
                )
                .prefetch_related("children")
                .prefetch_related(
                    Prefetch(
                        "property_values",
                        queryset=IssuePropertyValue.objects.filter(
                            issue_id=issue_id,
                            workspace__slug=slug,
                            project_id=project_id,
                        ),
                    )
                )
                .distinct()
            )
            serializer = PropertyReadSerializer(properties, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
