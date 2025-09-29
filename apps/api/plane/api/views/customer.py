# Django imports
from django.db.models import F, OuterRef, Value, Case, When, Q, CharField, Func, Max

import re

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# drf-spectacular imports
from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiRequest,
)

# Module imports
from plane.app.permissions import WorkSpaceAdminPermission
from plane.ee.models import (
    Customer,
    CustomerRequest,
    CustomerRequestIssue,
    CustomerProperty,
    CustomerPropertyOption,
    CustomerPropertyValue,
    PropertyTypeEnum,
)
from plane.ee.serializers import (
    CustomerSerializer,
    CustomerRequestSerializer,
    CustomerPropertySerializer,
    CustomerPropertyOptionSerializer,
)
from plane.db.models import Workspace, Issue
from plane.ee.utils.customer_property_validators import (
    property_savers,
    property_validators,
    SAVE_MAPPER,
    VALIDATOR_MAPPER,
)
from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models.functions import Cast
from django.core.exceptions import ValidationError
from .base import BaseAPIView


class CustomerAPIEndpoint(BaseAPIView):
    """
    Customer API Endpoint - handles customer list and create operations
    """

    model = Customer
    permission_classes = [WorkSpaceAdminPermission]
    serializer_class = CustomerSerializer
    use_read_replica = True

    def get_queryset(self):
        return (
            Customer.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .annotate(
                customer_request_count=CustomerRequest.objects.filter(
                    customer_id=OuterRef("id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="count"))
                .values("count")
            )
            .select_related("workspace")
            .order_by(self.kwargs.get("order_by", "-created_at"))
        ).distinct()

    @extend_schema(
        operation_id="list_customers",
        summary="List customers",
        description="List all customers in a workspace with optional search filtering",
        tags=["Customers"],
        responses={
            200: OpenApiResponse(
                description="Customers retrieved successfully",
                response=CustomerSerializer,
            ),
            404: OpenApiResponse(description="Workspace not found"),
        },
    )
    def get(self, request, slug):
        """List customers

        Lists all customers with optional search filtering.
        """
        customer_queryset = self.get_queryset()
        search = request.query_params.get("query", None)
        if search:
            customer_queryset = customer_queryset.filter(name__icontains=search)

        return self.paginate(
            request=request,
            queryset=customer_queryset,
            on_results=lambda customers: CustomerSerializer(customers, many=True).data,
        )

    @extend_schema(
        operation_id="create_customer",
        summary="Create customer",
        description="Create a new customer in the specified workspace.",
        tags=["Customers"],
        request=OpenApiRequest(request=CustomerSerializer),
        responses={
            201: OpenApiResponse(
                description="Customer created successfully",
                response=CustomerSerializer,
            ),
            400: OpenApiResponse(description="Bad request"),
        },
    )
    def post(self, request, slug):
        """Create customer

        Create a new customer in the specified workspace.
        """
        workspace = Workspace.objects.get(slug=slug)

        serializer = CustomerSerializer(
            data=request.data, context={"workspace_id": workspace.id}
        )
        if serializer.is_valid():
            serializer.save(workspace_id=workspace.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomerDetailAPIEndpoint(BaseAPIView):
    """
    Customer Detail API Endpoint - handles customer detail, update and delete operations
    """

    model = Customer
    permission_classes = [WorkSpaceAdminPermission]
    serializer_class = CustomerSerializer
    use_read_replica = True

    def get_queryset(self):
        return (
            Customer.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .annotate(
                customer_request_count=CustomerRequest.objects.filter(
                    customer_id=OuterRef("id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="count"))
                .values("count")
            )
            .select_related("workspace")
        )

    @extend_schema(
        operation_id="retrieve_customer",
        summary="Retrieve customer",
        description="Get a specific customer by ID",
        tags=["Customers"],
        responses={
            200: OpenApiResponse(
                description="Customer retrieved successfully",
                response=CustomerSerializer,
            ),
            404: OpenApiResponse(description="Customer not found"),
        },
    )
    def get(self, request, slug, pk):
        """Retrieve customer

        Retrieves a specific customer by ID.
        """
        customer = self.get_queryset().get(pk=pk)
        return Response(
            CustomerSerializer(customer).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        operation_id="update_customer",
        summary="Update customer",
        description="Update an existing customer with the provided fields.",
        tags=["Customers"],
        request=OpenApiRequest(request=CustomerSerializer),
        responses={
            200: OpenApiResponse(
                description="Customer updated successfully",
                response=CustomerSerializer,
            ),
            400: OpenApiResponse(description="Bad request"),
            404: OpenApiResponse(description="Customer not found"),
        },
    )
    def patch(self, request, slug, pk):
        """Update customer

        Partially update an existing customer.
        """
        customer = Customer.objects.get(pk=pk, workspace__slug=slug)
        serializer = CustomerSerializer(
            customer,
            data=request.data,
            partial=True,
            context={"workspace_id": customer.workspace_id},
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        operation_id="delete_customer",
        summary="Delete customer",
        description="Permanently delete a customer from the workspace.",
        tags=["Customers"],
        responses={
            204: OpenApiResponse(description="Customer deleted successfully"),
            404: OpenApiResponse(description="Customer not found"),
        },
    )
    def delete(self, request, slug, pk):
        """Delete customer

        Permanently delete a customer from the workspace.
        """
        customer = Customer.objects.get(pk=pk, workspace__slug=slug)
        customer.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CustomerRequestAPIEndpoint(BaseAPIView):
    """
    Customer Request API Endpoint - handles customer request list and create operations
    """

    model = CustomerRequest
    permission_classes = [WorkSpaceAdminPermission]
    serializer_class = CustomerRequestSerializer
    use_read_replica = True

    def get_queryset(self, customer_id):
        return (
            CustomerRequest.objects.filter(
                customer_id=customer_id, workspace__slug=self.kwargs.get("slug")
            )
            .select_related("workspace", "customer")
            .order_by(self.kwargs.get("order_by", "-created_at"))
        ).distinct()

    @extend_schema(
        operation_id="list_customer_requests",
        summary="List customer requests",
        description="List all requests for a customer with optional search filtering",
        tags=["Customer Requests"],
        responses={
            200: OpenApiResponse(
                description="Customer requests retrieved successfully",
                response=CustomerRequestSerializer,
            ),
            404: OpenApiResponse(description="Customer not found"),
        },
    )
    def get(self, request, slug, customer_id):
        """List customer requests

        Lists all requests for the customer with optional search filtering.
        """
        # Verify customer exists
        Customer.objects.get(pk=customer_id, workspace__slug=slug)

        # List customer requests with optional search
        request_queryset = self.get_queryset(customer_id)
        search = request.query_params.get("query", None)
        if search:
            request_queryset = request_queryset.filter(name__icontains=search)

        return self.paginate(
            request=request,
            queryset=request_queryset,
            on_results=lambda requests: CustomerRequestSerializer(
                requests, many=True
            ).data,
        )

    @extend_schema(
        operation_id="create_customer_request",
        summary="Create customer request",
        description="Create a new request for the specified customer.",
        tags=["Customer Requests"],
        request=OpenApiRequest(request=CustomerRequestSerializer),
        responses={
            201: OpenApiResponse(
                description="Customer request created successfully",
                response=CustomerRequestSerializer,
            ),
            400: OpenApiResponse(description="Bad request"),
            404: OpenApiResponse(description="Customer not found"),
        },
    )
    def post(self, request, slug, customer_id):
        """Create customer request

        Create a new request for the specified customer.
        """
        workspace = Workspace.objects.get(slug=slug)
        customer = Customer.objects.get(pk=customer_id, workspace__slug=slug)

        serializer = CustomerRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace_id=workspace.id, customer_id=customer.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomerRequestDetailAPIEndpoint(BaseAPIView):
    """
    Customer Request Detail API Endpoint - handles customer request detail, update and delete operations
    """

    model = CustomerRequest
    permission_classes = [WorkSpaceAdminPermission]
    serializer_class = CustomerRequestSerializer
    use_read_replica = True

    def get_queryset(self, customer_id):
        return (
            CustomerRequest.objects.filter(
                customer_id=customer_id, workspace__slug=self.kwargs.get("slug")
            )
            .select_related("workspace", "customer")
            .order_by(self.kwargs.get("order_by", "-created_at"))
        ).distinct()

    @extend_schema(
        operation_id="retrieve_customer_request",
        summary="Retrieve customer request",
        description="Get a specific customer request by ID",
        tags=["Customer Requests"],
        responses={
            200: OpenApiResponse(
                description="Customer request retrieved successfully",
                response=CustomerRequestSerializer,
            ),
            404: OpenApiResponse(description="Customer request not found"),
        },
    )
    def get(self, request, slug, customer_id, pk):
        """Retrieve customer request

        Retrieves a specific customer request by ID.
        """
        # Verify customer exists
        Customer.objects.get(pk=customer_id, workspace__slug=slug)

        customer_request = self.get_queryset(customer_id).get(pk=pk)
        return Response(
            CustomerRequestSerializer(customer_request).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        operation_id="update_customer_request",
        summary="Update customer request",
        description="Update an existing customer request with the provided fields.",
        tags=["Customer Requests"],
        request=OpenApiRequest(request=CustomerRequestSerializer),
        responses={
            200: OpenApiResponse(
                description="Customer request updated successfully",
                response=CustomerRequestSerializer,
            ),
            400: OpenApiResponse(description="Bad request"),
            404: OpenApiResponse(description="Customer request not found"),
        },
    )
    def patch(self, request, slug, customer_id, pk):
        """Update customer request

        Partially update an existing customer request.
        """
        customer_request = CustomerRequest.objects.get(
            pk=pk, customer_id=customer_id, workspace__slug=slug
        )

        serializer = CustomerRequestSerializer(
            customer_request, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        operation_id="delete_customer_request",
        summary="Delete customer request",
        description="Permanently delete a customer request and unlink any linked issue",
        tags=["Customer Requests"],
        responses={
            204: OpenApiResponse(description="Customer request deleted successfully"),
            404: OpenApiResponse(description="Customer request not found"),
        },
    )
    def delete(self, request, slug, customer_id, pk):
        """Delete customer request

        Permanently delete a customer request and unlink any associated issues.
        """
        customer_request = CustomerRequest.objects.get(
            pk=pk, customer_id=customer_id, workspace__slug=slug
        )
        customer_request.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CustomerIssuesAPIEndpoint(BaseAPIView):
    """
    Customer Issues API Endpoint - handles linking/unlinking issues to customers
    and requests
    """

    model = Issue
    permission_classes = [WorkSpaceAdminPermission]
    use_read_replica = True

    def get_serializer_class(self):
        # This endpoint doesn't use a traditional serializer for the main operations
        return None

    @extend_schema(
        operation_id="list_customer_issues",
        summary="List customer issues",
        description="List all issues linked to a customer, with filtering by request",
        tags=["Customer Issues"],
        parameters=[
            {
                "name": "customer_request_id",
                "in": "query",
                "description": "Filter issues by specific customer request",
                "required": False,
                "schema": {"type": "string", "format": "uuid"},
            },
            {
                "name": "search",
                "in": "query",
                "description": "Search issues by name, sequence ID, or project identifier",
                "required": False,
                "schema": {"type": "string"},
            },
        ],
        responses={
            200: OpenApiResponse(
                description="Customer issues retrieved successfully",
            ),
            404: OpenApiResponse(description="Customer not found"),
        },
    )
    def get(self, request, slug, customer_id):
        """List customer issues

        List all issues linked to a customer, with optional filtering.
        """
        # Verify customer exists
        Customer.objects.get(pk=customer_id, workspace__slug=slug)

        customer_request_id = request.query_params.get("customer_request_id")
        search = request.query_params.get("search")

        # Base query for issues linked to this customer
        issues = Issue.objects.filter(
            workspace__slug=slug,
            customer_request_issues__customer_id=customer_id,
            customer_request_issues__deleted_at__isnull=True,
            archived_at__isnull=True,
        )

        # Filter by specific customer request if provided
        if customer_request_id:
            issues = issues.filter(
                customer_request_issues__customer_request_id=customer_request_id
            )

        # Add search functionality
        if search:
            fields = ["name", "sequence_id", "project__identifier"]
            q = Q()
            for field in fields:
                if field == "sequence_id":
                    sequences = re.findall(r"\b\d+\b", search)
                    for sequence_id in sequences:
                        q |= Q(**{"sequence_id": sequence_id})
                else:
                    q |= Q(**{f"{field}__icontains": search})
            issues = issues.filter(q)

        # Get issue data
        issues_data = issues.distinct().values(
            "id",
            "name",
            "state_id",
            "priority",
            "sequence_id",
            "project_id",
            "project__identifier",
            "created_at",
            "updated_at",
        )

        return Response(list(issues_data), status=status.HTTP_200_OK)

    @extend_schema(
        operation_id="link_customer_issues",
        summary="Link issues to customer",
        description="Link one or more issues to a customer, optionally within a specific customer request.",
        tags=["Customer Issues"],
        parameters=[
            {
                "name": "customer_request_id",
                "in": "query",
                "description": "Link issues to specific customer request",
                "required": False,
                "schema": {"type": "string", "format": "uuid"},
            },
        ],
        request=OpenApiRequest(
            request={
                "application/json": {
                    "type": "object",
                    "properties": {
                        "issue_ids": {
                            "type": "array",
                            "items": {"type": "string", "format": "uuid"},
                            "description": "Array of issue IDs to link",
                        }
                    },
                    "required": ["issue_ids"],
                }
            }
        ),
        responses={
            201: OpenApiResponse(description="Issues linked successfully"),
            400: OpenApiResponse(description="Bad request"),
            404: OpenApiResponse(description="Customer not found"),
        },
    )
    def post(self, request, slug, customer_id):
        """Link issues to customer

        Link one or more issues to a customer, optionally within a specific customer request.
        """
        workspace = Workspace.objects.get(slug=slug)
        Customer.objects.get(pk=customer_id, workspace__slug=slug)

        customer_request_id = request.query_params.get("customer_request_id")
        issue_ids = request.data.get("issue_ids", [])

        if not issue_ids:
            return Response(
                {"error": "issue_ids is required and must not be empty"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify customer request exists if provided
        if customer_request_id:
            CustomerRequest.objects.get(
                pk=customer_request_id, customer_id=customer_id, workspace__slug=slug
            )

        # Validate that all issues exist before creating links
        existing_issues = Issue.objects.filter(
            id__in=issue_ids, workspace__slug=slug, archived_at__isnull=True
        ).values_list("id", flat=True)

        if len(existing_issues) != len(issue_ids):
            missing_ids = set(issue_ids) - set(existing_issues)
            return Response(
                {
                    "error": f"Issues not found: {list(missing_ids)}",
                    "valid_issues": list(existing_issues),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create customer request issue links
        customer_request_issues = []
        for issue_id in issue_ids:
            customer_request_issues.append(
                CustomerRequestIssue(
                    customer_request_id=customer_request_id,
                    customer_id=customer_id,
                    workspace_id=workspace.id,
                    issue_id=issue_id,
                )
            )

        # Bulk create the links
        created_links = CustomerRequestIssue.objects.bulk_create(
            customer_request_issues, batch_size=10, ignore_conflicts=True
        )

        # Get the created issue IDs for response
        linked_issue_ids = [link.issue_id for link in created_links]

        linked_issues = Issue.objects.filter(id__in=linked_issue_ids).values(
            "id",
            "name",
            "sequence_id",
            "project_id",
            "project__identifier",
        )

        return Response(
            {
                "message": f"Successfully linked {len(linked_issue_ids)} issues",
                "linked_issues": list(linked_issues),
            },
            status=status.HTTP_201_CREATED,
        )


class CustomerIssueDetailAPIEndpoint(BaseAPIView):
    """
    Customer Issue Detail API Endpoint - handles unlinking specific issues from customers
    """

    model = Issue
    permission_classes = [WorkSpaceAdminPermission]
    use_read_replica = True

    def get_serializer_class(self):
        return None

    @extend_schema(
        operation_id="unlink_customer_issue",
        summary="Unlink issue from customer",
        description="Remove the link between an issue and a customer/customer request.",
        tags=["Customer Issues"],
        parameters=[
            {
                "name": "customer_request_id",
                "in": "query",
                "description": "Unlink issue from specific customer request",
                "required": False,
                "schema": {"type": "string", "format": "uuid"},
            },
        ],
        responses={
            204: OpenApiResponse(description="Issue unlinked successfully"),
            404: OpenApiResponse(description="Link not found"),
        },
    )
    def delete(self, request, slug, customer_id, issue_id):
        """Unlink issue from customer

        Remove the link between an issue and a customer/customer request.
        """
        customer_request_id = request.query_params.get("customer_request_id")

        # Build filter for the link
        filters = {
            "customer_id": customer_id,
            "issue_id": issue_id,
            "workspace__slug": slug,
        }

        if customer_request_id:
            filters["customer_request_id"] = customer_request_id

        # Find and delete the link
        customer_request_issues = CustomerRequestIssue.objects.filter(**filters)

        if not customer_request_issues.exists():
            return Response(
                {"error": "Link between customer and issue not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        customer_request_issues.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CustomerPropertiesAPIEndpoint(BaseAPIView):
    """
    Customer Properties API Endpoint - handles customer property list and create operations
    """

    model = CustomerProperty
    permission_classes = [WorkSpaceAdminPermission]
    serializer_class = CustomerPropertySerializer
    use_read_replica = True

    def get_queryset(self):
        return (
            CustomerProperty.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace")
            .order_by(self.kwargs.get("order_by", "-created_at"))
        ).distinct()

    @extend_schema(
        operation_id="list_customer_properties",
        summary="List customer properties",
        description="List all customer properties in a workspace.",
        tags=["Customer Properties"],
        responses={
            200: OpenApiResponse(
                description="Customer properties retrieved successfully",
                response=CustomerPropertySerializer,
            ),
            404: OpenApiResponse(description="Workspace not found"),
        },
    )
    def get(self, request, slug):
        """List customer properties

        Lists all customer properties.
        """
        properties_queryset = self.get_queryset()

        return self.paginate(
            request=request,
            queryset=properties_queryset,
            on_results=lambda properties: CustomerPropertySerializer(
                properties, many=True
            ).data,
        )

    @extend_schema(
        operation_id="create_customer_property",
        summary="Create customer property",
        description="Create a new customer property in the specified workspace.",
        tags=["Customer Properties"],
        request=OpenApiRequest(
            request={
                "application/json": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Property name"},
                        "description": {
                            "type": "string",
                            "description": "Property description",
                        },
                        "property_type": {
                            "type": "string",
                            "enum": [
                                "TEXT",
                                "NUMBER",
                                "SELECT",
                                "MULTI_SELECT",
                                "DATE",
                                "OPTION",
                            ],
                            "description": "Property type",
                        },
                        "is_required": {
                            "type": "boolean",
                            "description": "Whether property is required",
                        },
                        "is_multi": {
                            "type": "boolean",
                            "description": "Whether property allows multiple values",
                        },
                        "default_value": {
                            "type": "array",
                            "description": "Default value(s)",
                        },
                        "options": {
                            "type": "array",
                            "description": "Options for OPTION type properties",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": {"type": "string"},
                                    "description": {"type": "string"},
                                    "is_default": {"type": "boolean"},
                                },
                            },
                        },
                    },
                    "required": ["name", "property_type"],
                }
            }
        ),
        responses={
            201: OpenApiResponse(
                description="Customer property created successfully",
                response=CustomerPropertySerializer,
            ),
            400: OpenApiResponse(description="Bad request"),
        },
    )
    def post(self, request, slug):
        """Create customer property

        Create a new customer property in the specified workspace.
        """
        workspace = Workspace.objects.get(slug=slug)
        options = request.data.pop("options", [])

        # Basic validation
        if (
            not request.data.get("is_multi")
            and len(request.data.get("default_value", [])) > 1
        ):
            return Response(
                {
                    "error": "Default value must be a single value for non-multi properties"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Required properties can't have defaults
        if request.data.get("is_required"):
            request.data["default_value"] = []

        serializer = CustomerPropertySerializer(data=request.data)
        if serializer.is_valid():
            # Check for duplicate name
            if CustomerProperty.objects.filter(
                workspace_id=workspace.id, name=request.data["name"]
            ).exists():
                return Response(
                    {"error": "Property with this name already exists in workspace"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer.save(workspace_id=workspace.id)
            customer_property = CustomerProperty.objects.get(pk=serializer.data["id"])

            # Handle options for OPTION type
            if customer_property.property_type == "OPTION" and options:
                self._create_options(customer_property, options)

            # Prepare response
            response_data = CustomerPropertySerializer(customer_property).data
            if customer_property.property_type == "OPTION":
                property_options = CustomerPropertyOption.objects.filter(
                    property_id=customer_property.id, workspace__slug=slug
                )
                response_data["options"] = CustomerPropertyOptionSerializer(
                    property_options, many=True
                ).data

            return Response(response_data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _create_options(self, customer_property, options):
        """Helper method to create options for a property"""
        workspace_id = customer_property.workspace_id
        customer_property_id = customer_property.id

        last_id = CustomerPropertyOption.objects.filter(
            property_id=customer_property_id
        ).aggregate(largest=Max("sort_order"))["largest"]

        sort_order = (last_id + 10000) if last_id else 10000

        bulk_create_options = [
            CustomerPropertyOption(
                name=option.get("name"),
                sort_order=sort_order + (index * 10000),
                property_id=customer_property_id,
                description=option.get("description", ""),
                is_default=option.get("is_default", False),
                workspace_id=workspace_id,
            )
            for index, option in enumerate(options)
        ]

        CustomerPropertyOption.objects.bulk_create(bulk_create_options, batch_size=100)


class CustomerPropertyDetailAPIEndpoint(BaseAPIView):
    """
    Customer Property Detail API Endpoint - handles customer property detail, update and delete operations
    """

    model = CustomerProperty
    permission_classes = [WorkSpaceAdminPermission]
    serializer_class = CustomerPropertySerializer
    use_read_replica = True

    def get_queryset(self):
        return (
            CustomerProperty.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace")
            .order_by(self.kwargs.get("order_by", "-created_at"))
        ).distinct()

    @extend_schema(
        operation_id="retrieve_customer_property",
        summary="Retrieve customer property",
        description="Retrieve a specific customer property by ID.",
        tags=["Customer Properties"],
        responses={
            200: OpenApiResponse(
                description="Customer property retrieved successfully",
                response=CustomerPropertySerializer,
            ),
            404: OpenApiResponse(description="Customer property not found"),
        },
    )
    def get(self, request, slug, pk):
        """Retrieve customer property

        Retrieves a specific customer property by ID.
        """
        customer_property = self.get_queryset().get(pk=pk)

        # Include options for OPTION type properties
        response_data = CustomerPropertySerializer(customer_property).data
        if customer_property.property_type == "OPTION":
            options = CustomerPropertyOption.objects.filter(
                property_id=customer_property.id, workspace__slug=slug
            )
            response_data["options"] = CustomerPropertyOptionSerializer(
                options, many=True
            ).data

        return Response(response_data, status=status.HTTP_200_OK)

    @extend_schema(
        operation_id="update_customer_property",
        summary="Update customer property",
        description="Update an existing customer property with the provided fields.",
        tags=["Customer Properties"],
        request=OpenApiRequest(request=CustomerPropertySerializer),
        responses={
            200: OpenApiResponse(
                description="Customer property updated successfully",
                response=CustomerPropertySerializer,
            ),
            400: OpenApiResponse(description="Bad request"),
            404: OpenApiResponse(description="Customer property not found"),
        },
    )
    def patch(self, request, slug, pk):
        """Update customer property

        Partially update an existing customer property.
        """
        customer_property = CustomerProperty.objects.get(pk=pk, workspace__slug=slug)
        workspace = customer_property.workspace
        options = request.data.pop("options", [])

        # Restrict certain field updates
        restricted_fields = ["property_type", "is_multi", "settings"]
        for field in restricted_fields:
            if field in request.data:
                return Response(
                    {"error": f"Field '{field}' cannot be updated"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Validation for default values
        if (
            not customer_property.is_multi
            and len(request.data.get("default_value", [])) > 1
        ):
            return Response(
                {
                    "error": "Default value must be a single value for non-multi properties"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Required properties can't have defaults
        if request.data.get("is_required", customer_property.is_required):
            request.data["default_value"] = []

        serializer = CustomerPropertySerializer(
            customer_property, data=request.data, partial=True
        )

        if serializer.is_valid():
            # Check for duplicate name (if updating)
            if (
                request.data.get("name")
                and request.data.get("name") != customer_property.name
                and CustomerProperty.objects.filter(
                    workspace_id=workspace.id,
                    name=request.data.get("name"),
                ).exists()
            ):
                return Response(
                    {
                        "error": "Property with this display name already exists in the workspace"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer.save()

            # Handle options update for OPTION type
            if customer_property.property_type == "OPTION" and options:
                self._update_options(customer_property, options, slug)

            # Prepare response
            response_data = CustomerPropertySerializer(customer_property).data
            if customer_property.property_type == "OPTION":
                property_options = CustomerPropertyOption.objects.filter(
                    property_id=customer_property.id, workspace__slug=slug
                )
                response_data["options"] = CustomerPropertyOptionSerializer(
                    property_options, many=True
                ).data

            return Response(response_data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        operation_id="delete_customer_property",
        summary="Delete customer property",
        description="Permanently delete a customer property from the workspace.",
        tags=["Customer Properties"],
        responses={
            204: OpenApiResponse(description="Customer property deleted successfully"),
            404: OpenApiResponse(description="Customer property not found"),
        },
    )
    def delete(self, request, slug, pk):
        """Delete customer property

        Permanently delete a customer property from the workspace.
        """
        customer_property = CustomerProperty.objects.get(pk=pk, workspace__slug=slug)
        customer_property.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _create_options(self, customer_property, options):
        """Helper method to create options for a property"""
        workspace_id = customer_property.workspace_id
        customer_property_id = customer_property.id

        last_id = CustomerPropertyOption.objects.filter(
            property_id=customer_property_id
        ).aggregate(largest=Max("sort_order"))["largest"]

        sort_order = (last_id + 10000) if last_id else 10000

        bulk_create_options = [
            CustomerPropertyOption(
                name=option.get("name"),
                sort_order=sort_order + (index * 10000),
                property_id=customer_property_id,
                description=option.get("description", ""),
                is_default=option.get("is_default", False),
                workspace_id=workspace_id,
            )
            for index, option in enumerate(options)
        ]

        CustomerPropertyOption.objects.bulk_create(bulk_create_options, batch_size=100)

    def _update_options(self, customer_property, options, slug):
        """Helper method to update options for a property"""
        for option in options:
            if option.get("id"):
                # Update existing option
                property_option = CustomerPropertyOption.objects.get(
                    workspace__slug=slug,
                    property_id=customer_property.id,
                    pk=option["id"],
                )
                option_serializer = CustomerPropertyOptionSerializer(
                    property_option, data=option, partial=True
                )
                if option_serializer.is_valid():
                    option_serializer.save()
            else:
                # Create new option
                self._create_options(customer_property, [option])


class CustomerPropertyValuesAPIEndpoint(BaseAPIView):
    """
    Customer Property Values API Endpoint - handles all customer property value operations
    """

    model = CustomerPropertyValue
    permission_classes = [WorkSpaceAdminPermission]
    use_read_replica = True

    def _query_annotator(self, query):
        """Helper method to annotate property values based on their types"""
        return query.values("property_id").annotate(
            values=ArrayAgg(
                Case(
                    When(
                        property__property_type__in=[
                            PropertyTypeEnum.TEXT,
                            PropertyTypeEnum.URL,
                            PropertyTypeEnum.EMAIL,
                            PropertyTypeEnum.FILE,
                        ],
                        then=F("value_text"),
                    ),
                    When(
                        property__property_type=PropertyTypeEnum.DATETIME,
                        then=Func(
                            F("value_datetime"),
                            function="TO_CHAR",
                            template="%(function)s(%(expressions)s, 'YYYY-MM-DD')",
                            output_field=CharField(),
                        ),
                    ),
                    When(
                        property__property_type=PropertyTypeEnum.DECIMAL,
                        then=Cast(F("value_decimal"), output_field=CharField()),
                    ),
                    When(
                        property__property_type=PropertyTypeEnum.BOOLEAN,
                        then=Cast(F("value_boolean"), output_field=CharField()),
                    ),
                    When(
                        property__property_type=PropertyTypeEnum.RELATION,
                        then=Cast(F("value_uuid"), output_field=CharField()),
                    ),
                    When(
                        property__property_type=PropertyTypeEnum.OPTION,
                        then=Cast(F("value_option"), output_field=CharField()),
                    ),
                    default=Value(""),
                    output_field=CharField(),
                ),
                filter=Q(property_id=F("property_id")),
                distinct=True,
            )
        )

    @extend_schema(
        operation_id="get_customer_property_values",
        summary="Get customer property values",
        description="Retrieve all property values for a specific customer.",
        tags=["Customer Property Values"],
        responses={
            200: OpenApiResponse(
                description="Customer property values retrieved successfully",
                response={
                    "type": "object",
                    "description": "Dictionary mapping property IDs to their values",
                    "additionalProperties": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                },
            ),
            404: OpenApiResponse(description="Customer not found"),
        },
    )
    def get(self, request, slug, customer_id):
        """Get customer property values

        Retrieve all property values for a specific customer.
        """
        # Verify customer exists
        Customer.objects.get(pk=customer_id, workspace__slug=slug)

        # Build base query
        queryset = CustomerPropertyValue.objects.filter(
            workspace__slug=slug,
            customer_id=customer_id,
            property__is_active=True,
        )

        # Annotate and get values
        property_values = self._query_annotator(queryset).values(
            "property_id", "values"
        )

        # Create response dictionary
        response = {
            str(prop_value["property_id"]): prop_value["values"]
            for prop_value in property_values
        }

        return Response(response, status=status.HTTP_200_OK)

    @extend_schema(
        operation_id="update_customer_property_values",
        summary="Update customer property values",
        description="Update multiple property values for a customer in bulk.",
        tags=["Customer Property Values"],
        request=OpenApiRequest(
            request={
                "application/json": {
                    "type": "object",
                    "properties": {
                        "customer_property_values": {
                            "type": "object",
                            "description": "Dictionary mapping property IDs to their new values",
                            "additionalProperties": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Array of values for the property",
                            },
                        }
                    },
                    "required": ["customer_property_values"],
                }
            }
        ),
        responses={
            201: OpenApiResponse(description="Property values updated successfully"),
            400: OpenApiResponse(description="Bad request - validation failed"),
            404: OpenApiResponse(description="Customer not found"),
        },
    )
    def post(self, request, slug, customer_id):
        """Update customer property values

        Update multiple property values for a customer in bulk.
        """
        try:
            # Verify customer exists
            customer = Customer.objects.get(pk=customer_id, workspace__slug=slug)

            customer_property_values = request.data.get("customer_property_values", {})
            customer_property_ids = list(customer_property_values.keys())

            # Get existing values
            existing_prop_queryset = CustomerPropertyValue.objects.filter(
                workspace__slug=slug,
                customer_id=customer_id,
            )

            existing_prop_values = self._query_annotator(existing_prop_queryset).values(
                "property_id", "values"
            )

            # Get customer properties
            customer_properties = CustomerProperty.objects.filter(
                workspace__slug=slug,
                is_active=True,
            )

            # Validate the data
            property_validators(
                properties=customer_properties,
                property_values=customer_property_values,
                existing_prop_values=existing_prop_values,
            )

            # Save the data
            bulk_customer_property_values = property_savers(
                properties=customer_properties,
                property_values=customer_property_values,
                customer_id=customer_id,
                workspace_id=customer.workspace_id,
                existing_prop_values=existing_prop_values,
            )

            # Delete old values
            existing_prop_queryset.filter(
                property_id__in=customer_property_ids
            ).delete()

            # Bulk create new values
            CustomerPropertyValue.objects.bulk_create(
                bulk_customer_property_values, batch_size=10
            )

            return Response(status=status.HTTP_201_CREATED)

        except (ValidationError, ValueError) as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Customer.DoesNotExist:
            return Response(
                {"error": "Customer not found"},
                status=status.HTTP_404_NOT_FOUND,
            )


class CustomerPropertyValueDetailAPIEndpoint(BaseAPIView):
    """
    Customer Property Value Detail API Endpoint - handles single property value operations
    """

    model = CustomerPropertyValue
    permission_classes = [WorkSpaceAdminPermission]
    use_read_replica = True

    def _query_annotator(self, query):
        """Helper method to annotate property values based on their types"""
        return query.values("property_id").annotate(
            values=ArrayAgg(
                Case(
                    When(
                        property__property_type__in=[
                            PropertyTypeEnum.TEXT,
                            PropertyTypeEnum.URL,
                            PropertyTypeEnum.EMAIL,
                            PropertyTypeEnum.FILE,
                        ],
                        then=F("value_text"),
                    ),
                    When(
                        property__property_type=PropertyTypeEnum.DATETIME,
                        then=Func(
                            F("value_datetime"),
                            function="TO_CHAR",
                            template="%(function)s(%(expressions)s, 'YYYY-MM-DD')",
                            output_field=CharField(),
                        ),
                    ),
                    When(
                        property__property_type=PropertyTypeEnum.DECIMAL,
                        then=Cast(F("value_decimal"), output_field=CharField()),
                    ),
                    When(
                        property__property_type=PropertyTypeEnum.BOOLEAN,
                        then=Cast(F("value_boolean"), output_field=CharField()),
                    ),
                    When(
                        property__property_type=PropertyTypeEnum.RELATION,
                        then=Cast(F("value_uuid"), output_field=CharField()),
                    ),
                    When(
                        property__property_type=PropertyTypeEnum.OPTION,
                        then=Cast(F("value_option"), output_field=CharField()),
                    ),
                    default=Value(""),
                    output_field=CharField(),
                ),
                filter=Q(property_id=F("property_id")),
                distinct=True,
            )
        )

    @extend_schema(
        operation_id="get_single_property_values",
        summary="Get single property values",
        description="Retrieve values for a specific property of a customer.",
        tags=["Customer Property Values"],
        responses={
            200: OpenApiResponse(
                description="Property values retrieved successfully",
                response={
                    "type": "object",
                    "description": "Dictionary mapping property ID to its values",
                    "additionalProperties": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                },
            ),
            404: OpenApiResponse(description="Customer or property not found"),
        },
    )
    def get(self, request, slug, customer_id, property_id):
        """Get single property values

        Retrieve values for a specific property of a customer.
        """
        # Verify customer and property exist
        Customer.objects.get(pk=customer_id, workspace__slug=slug)
        CustomerProperty.objects.get(workspace__slug=slug, pk=property_id)

        # Build query for specific property
        queryset = CustomerPropertyValue.objects.filter(
            workspace__slug=slug,
            customer_id=customer_id,
            property_id=property_id,
            property__is_active=True,
        )

        # Annotate and get values
        property_values = self._query_annotator(queryset).values(
            "property_id", "values"
        )

        # Create response dictionary
        response = {
            str(prop_value["property_id"]): prop_value["values"]
            for prop_value in property_values
        }

        return Response(response, status=status.HTTP_200_OK)

    @extend_schema(
        operation_id="update_single_property_value",
        summary="Update single property value",
        description="Update values for a specific property of a customer.",
        tags=["Customer Property Values"],
        request=OpenApiRequest(
            request={
                "application/json": {
                    "type": "object",
                    "properties": {
                        "values": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Array of values for the property",
                        }
                    },
                    "required": ["values"],
                }
            }
        ),
        responses={
            204: OpenApiResponse(description="Property value updated successfully"),
            400: OpenApiResponse(description="Bad request - validation failed"),
            404: OpenApiResponse(description="Customer or property not found"),
        },
    )
    def patch(self, request, slug, customer_id, property_id):
        """Update single property value

        Update values for a specific property of a customer.
        """
        try:
            # Verify customer and property exist
            Customer.objects.get(pk=customer_id, workspace__slug=slug)
            customer_property = CustomerProperty.objects.get(
                workspace__slug=slug, pk=property_id
            )

            existing_prop_queryset = CustomerPropertyValue.objects.filter(
                workspace__slug=slug, customer_id=customer_id, property_id=property_id
            )

            values = request.data.get("values", [])

            # Check if property is required
            if customer_property.is_required and (
                not values or not [v for v in values if v]
            ):
                return Response(
                    {
                        "error": f"{customer_property.display_name} is a required property"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate values
            validator = VALIDATOR_MAPPER.get(customer_property.property_type)
            if validator:
                for value in values:
                    validator(property=customer_property, value=value)
            else:
                raise ValidationError("Invalid property type")

            # Save values
            saver = SAVE_MAPPER.get(customer_property.property_type)
            if saver:
                property_values = saver(
                    values=values,
                    customer_property=customer_property,
                    customer_id=customer_id,
                    existing_values=[],
                    workspace_id=customer_property.workspace_id,
                )

                # Delete old values and create new ones
                existing_prop_queryset.delete()
                CustomerPropertyValue.objects.bulk_create(
                    property_values, batch_size=10
                )
            else:
                raise ValidationError("Invalid property type")

            return Response(status=status.HTTP_204_NO_CONTENT)

        except (ValidationError, ValueError) as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except (Customer.DoesNotExist, CustomerProperty.DoesNotExist):
            return Response(
                {"error": "Customer or property not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
