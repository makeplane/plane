# Python imports
import uuid
import json
import datetime
import hashlib

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
    PropertyValue,
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
            issue_properties = self.get_queryset().filter(workspace__slug=slug, pk=pk)

            if project_id:
                issue_properties = issue_properties.filter(project_id=project_id)

            serializer = PropertySerializer(issue_properties.first())
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Property.DoesNotExist:
            return Response(
                {"error": "Property does not exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class PropertyValueViewSet(BaseViewSet):
    serializer_class = IssuePropertyValueSerializer
    model = PropertyValue

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            issue_id=self.kwargs.get("issue_id"),
            issue_property_id=self.kwargs.get("issue_property_id"),
        )

    def create(self, request, slug, project_id, issue_id):
        try:
            request_data = request.data.get("issue_properties", [])
            a_epoch = request.data.get(
                "a_epoch", (datetime.datetime.timestamp(timezone.now()) * 1000)
            )
            project = Project.objects.get(pk=project_id)
            workspace_id = project.workspace_id

            # Get all the issue_properties
            properties = Property.objects.filter(
                pk__in=[prop for prop in request_data if is_valid_uuid(prop)],
                workspace__slug=slug,
            )

            # Get the already existing for this entity
            property_values = PropertyValue.objects.filter(
                entity_uuid=issue_id, entity="issue"
            )
            bulk_transactions = []
            bulk_prop_values_create = []
            bulk_prop_values_update = []
            for prop in properties:
                # Get the requested values for the property
                requested_prop_values = request_data.get(str(prop.id))
                # For multi values -> multiple property values will be created
                if prop.is_multi and isinstance(requested_prop_values, list):
                    prop_values = [
                        property_value
                        for property_value in property_values
                        if str(property.id) == str(property_value.property_id)
                    ]
                    # Already existing
                    # append a record on the transaction log if the values are changed
                    if prop_values:
                        for requested_prop_value, prop_value in zip(
                            requested_prop_values, prop_values
                        ):
                            # Only do a lazy create -> only create if values are new
                            if (
                                hashlib.sha256(
                                    requested_prop_value.encode("utf-8")
                                ).hexdigest()
                                != prop_value.value_hash
                            ):
                                transaction_id = uuid.uuid4()
                                to_hash = hashlib.sha256(
                                    requested_prop_value.encode("utf-8")
                                ).hexdigest()
                                bulk_transactions.append(
                                    PropertyTransaction(
                                        id=transaction_id,
                                        workspace_id=workspace_id,
                                        project_id=project_id,
                                        property=property,
                                        property_value_id=prop_value.id,
                                        from_value=prop_value.value,
                                        to_value=requested_prop_value,
                                        from_hash=prop_value.value_hash,
                                        to_hash=to_hash,
                                        entity="issue",
                                        entity_uuid=issue_id,
                                        s_epoch=(
                                            datetime.datetime.timestamp(timezone.now())
                                            * 1000
                                        ),
                                        a_epoch=a_epoch,
                                        actor=request.user,
                                    )
                                )
                                prop_value.value = requested_prop_value
                                prop_value.transaction_id = transaction_id
                                prop_value.value_hash = to_hash
                                bulk_prop_values_update.append(prop_value)
                    else:
                        # Only for relation, multi select and select we will storing uuids
                        # for rest all we will storing the string values
                        if (
                            property.type == "relation"
                            or property.type == "multi_select"
                            or property.type == "select"
                        ):
                            for requested_prop_value in requested_prop_values:
                                transaction_id = uuid.uuid4()
                                to_hash = hashlib.sha256(
                                    requested_prop_value.encode("utf-8")
                                ).hexdigest()
                                bulk_transactions.append(
                                    PropertyTransaction(
                                        id=transaction_id,
                                        workspace_id=workspace_id,
                                        project_id=project_id,
                                        property=property,
                                        property_value_id=prop_value.id,
                                        to_value=requested_prop_value,
                                        to_hash=to_hash,
                                        entity="issue",
                                        entity_uuid=issue_id,
                                        s_epoch=(
                                            datetime.datetime.timestamp(timezone.now())
                                            * 1000
                                        ),
                                        a_epoch=a_epoch,
                                        actor=request.user,
                                    )
                                )
                                bulk_prop_values_create.append(
                                    PropertyValue(
                                        transaction_id=transaction_id,
                                        value=requested_prop_value,
                                        value_hash=to_hash,
                                        type=1,
                                        property=property,
                                        project_id=project_id,
                                        workspace_id=workspace_id,
                                        issue_id=issue_id,
                                    )
                                )
                        else:
                            for requested_prop_value in requested_prop_values:
                                transaction_id = uuid.uuid4()
                                to_hash = hashlib.sha256(
                                    requested_prop_value.encode("utf-8")
                                ).hexdigest()
                                bulk_transactions.append(
                                    PropertyTransaction(
                                        id=transaction_id,
                                        workspace_id=workspace_id,
                                        project_id=project_id,
                                        property=property,
                                        property_value_id=prop_value.id,
                                        to_value=requested_prop_value,
                                        to_hash=to_hash,
                                        entity="issue",
                                        entity_uuid=issue_id,
                                        s_epoch=(
                                            datetime.datetime.timestamp(timezone.now())
                                            * 1000
                                        ),
                                        a_epoch=a_epoch,
                                        actor=request.user,
                                    )
                                )
                                bulk_prop_values_create.append(
                                    PropertyValue(
                                        transaction_id=transaction_id,
                                        value=requested_prop_value,
                                        value_hash=to_hash,
                                        type=0,
                                        property=property,
                                        project_id=project_id,
                                        workspace_id=workspace_id,
                                        issue_id=issue_id,
                                    )
                                )
                else:
                    prop_values = [
                        property_value
                        for property_value in property_values
                        if str(property.id) == str(property_value.property_id)
                    ]

                    # Already existing
                    if prop_values:
                            # Only do a lazy create -> only create if values are new
                            if (
                                hashlib.sha256(
                                    requested_prop_value.encode("utf-8")
                                ).hexdigest()
                                != prop_value.value_hash
                            ):
                                transaction_id = uuid.uuid4()
                                to_hash = hashlib.sha256(
                                    requested_prop_value.encode("utf-8")
                                ).hexdigest()
                                bulk_transactions.append(
                                    PropertyTransaction(
                                        id=transaction_id,
                                        workspace_id=workspace_id,
                                        project_id=project_id,
                                        property=property,
                                        property_value_id=prop_value.id,
                                        from_value=prop_value.value,
                                        to_value=requested_prop_value,
                                        from_hash=prop_value.value_hash,
                                        to_hash=to_hash,
                                        entity="issue",
                                        entity_uuid=issue_id,
                                        s_epoch=(
                                            datetime.datetime.timestamp(timezone.now())
                                            * 1000
                                        ),
                                        a_epoch=a_epoch,
                                        actor=request.user,
                                    )
                                )
                                prop_value.value = requested_prop_value
                                prop_value.transaction_id = transaction_id
                                prop_value.value_hash = to_hash
                                bulk_prop_values_update.append(prop_value)
                        # Non existent
                    else:
                        # Only for relation, multi select and select we will storing uuids
                        if (
                            property.type == "relation"
                            or property.type == "multi_select"
                            or property.type == "select"
                        ):
                            transaction_id = uuid.uuid4()
                            to_hash = hashlib.sha256(
                                requested_prop_value.encode("utf-8")
                            ).hexdigest()
                            bulk_transactions.append(
                                PropertyTransaction(
                                    id=transaction_id,
                                    workspace_id=workspace_id,
                                    project_id=project_id,
                                    property=property,
                                    property_value_id=prop_value.id,
                                    to_value=requested_prop_value,
                                    to_hash=to_hash,
                                    entity="issue",
                                    entity_uuid=issue_id,
                                    s_epoch=(
                                        datetime.datetime.timestamp(timezone.now())
                                        * 1000
                                    ),
                                    a_epoch=a_epoch,
                                    actor=request.user,
                                )
                            )
                            bulk_prop_values_create.append(
                                PropertyValue(
                                    transaction_id=transaction_id,
                                    value=requested_prop_value,
                                    value_hash=to_hash,
                                    type="uuid",
                                    property=property,
                                    project_id=project_id,
                                    workspace_id=workspace_id,
                                    issue_id=issue_id,
                                )
                            )
                        else:
                            transaction_id = uuid.uuid4()
                            to_hash = hashlib.sha256(
                                requested_prop_value.encode("utf-8")
                            ).hexdigest()
                            bulk_transactions.append(
                                PropertyTransaction(
                                    id=transaction_id,
                                    workspace_id=workspace_id,
                                    project_id=project_id,
                                    property=property,
                                    property_value_id=prop_value.id,
                                    to_value=requested_prop_value,
                                    to_hash=to_hash,
                                    entity="issue",
                                    entity_uuid=issue_id,
                                    s_epoch=(
                                        datetime.datetime.timestamp(timezone.now())
                                        * 1000
                                    ),
                                    a_epoch=a_epoch,
                                    actor=request.user,
                                )
                            )
                            bulk_prop_values_create.append(
                                PropertyValue(
                                    transaction_id=transaction_id,
                                    value=requested_prop_value,
                                    value_hash=to_hash,
                                    type="text",
                                    property=property,
                                    project_id=project_id,
                                    workspace_id=workspace_id,
                                    issue_id=issue_id,
                                )
                            )

            # Write the transaction table
            _ = PropertyTransaction.objects.bulk_create(
                bulk_transactions,
                batch_size=100,
                ignore_conflicts=True,
            )

            _ = PropertyValue.objects.bulk_create(
                bulk_prop_values_create,
                batch_size=100,
                ignore_conflicts=True,
            )
            _ = PropertyValue.objects.bulk_update(
                bulk_prop_values_update,
                ["value"],
                batch_size=100,
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
                        queryset=PropertyValue.objects.filter(
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

            issue_property_values = PropertyValue.objects.filter(
                workspace__slug=slug, project_id=project_id, issue_id=issue_id
            ).select_related("property")

            serilaizer = IssuePropertyValueSerializer(issue_property_values, many=True)
            return Response(status=status.HTTP_201_CREATED)
        except Project.DoesNotExist:
            return Response(
                {"error": "Project Does not exists"}, status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def partial_update(self, request, slug, project_id, issue_id):
        try:
            request_data = request.data.get("issue_property_values", [])

            issue_property_values = PropertyValue.objects.filter(
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

            updated_issue_props = PropertyValue.objects.bulk_update(
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
                        queryset=PropertyValue.objects.filter(
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
