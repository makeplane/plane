# Django imports
from django.db import IntegrityError, models

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.serializers import (
    CustomerPropertySerializer,
    CustomerPropertyOptionSerializer,
)
from plane.db.models import Workspace
from plane.ee.models import CustomerProperty, CustomerPropertyOption
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.app.permissions import WorkSpaceAdminPermission


class CustomerPropertyEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    def create_options(self, customer_property, options):
        workspace_id = customer_property.workspace_id
        customer_property_id = customer_property.id

        last_id = CustomerPropertyOption.objects.filter(
            property_id=customer_property_id
        ).aggregate(largest=models.Max("sort_order"))["largest"]

        sort_order = (last_id + 10000) if last_id else 10000

        bulk_create_options = [
            CustomerPropertyOption(
                name=option.get("name"),
                sort_order=sort_order + (index * 10000),
                property_id=customer_property_id,
                description=option.get("description", ""),
                logo_props=option.get("logo_props", ""),
                is_active=option.get("is_active", True),
                is_default=option.get("is_default", False),
                parent_id=option.get("parent_id"),
                workspace_id=workspace_id,
            )
            for index, option in enumerate(options)
            if not option.get("id")
        ]

        CustomerPropertyOption.objects.bulk_create(bulk_create_options, batch_size=100)

    def handle_options_create_update(self, customer_property, options, slug):
        bulk_create_options = []
        bulk_update_options = []

        for option in options:
            if option.get("id"):
                bulk_update_options.append(option)
            else:
                bulk_create_options.append(option)

        if bulk_update_options:
            for option in bulk_update_options:
                customer_property_option = CustomerPropertyOption.objects.get(
                    workspace__slug=slug,
                    property_id=customer_property.id,
                    pk=option["id"],
                )
                option_serializer = CustomerPropertyOptionSerializer(
                    customer_property_option, data=option, partial=True
                )

                option_serializer.is_valid(raise_exception=True)
                option_serializer.save()

        if bulk_create_options:
            self.create_options(customer_property, bulk_create_options)

    def create_or_update_options(self, customer_property, options, slug):
        try:
            self.handle_options_create_update(customer_property, options, slug)

            if customer_property.is_required:
                self.reset_options_default(customer_property)

            if (
                not customer_property.is_multi
                and CustomerPropertyOption.objects.filter(
                    property_id=customer_property.id,
                    workspace_id=customer_property.workspace_id,
                    is_default=True,
                ).count()
                > 1
            ):
                self.reset_options_default(customer_property)
            self.update_property_default_options(customer_property)

        except IntegrityError:
            return Response(
                {
                    "error": "An option with the same name already exists in this property"
                },
                status=status.HTTP_409_CONFLICT,
            )

    def reset_options_default(self, customer_property):
        CustomerPropertyOption.objects.filter(
            property_id=customer_property.id,
            workspace_id=customer_property.workspace_id,
            is_default=True,
        ).update(is_default=False)

    def update_property_default_options(self, customer_property):
        # Fetch all the default options
        customer_property_options = CustomerPropertyOption.objects.filter(
            property_id=customer_property.id,
            workspace_id=customer_property.workspace_id,
            is_default=True,
        ).values_list("id", flat=True)

        # Save the default value
        customer_property.default_value = [
            str(option) for option in customer_property_options
        ]
        customer_property.save()

    def get_options_response(self, customer_property, slug):
        options = CustomerPropertyOption.objects.filter(
            property_id=customer_property.id, workspace__slug=slug
        )

        options_serializer = CustomerPropertyOptionSerializer(options, many=True)

        return options_serializer.data

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def get(self, request, slug, pk=None):
        if pk:
            customer_property = CustomerProperty.objects.get(
                workspace__slug=slug, pk=pk
            )

            serializer = CustomerPropertySerializer(customer_property)
            return Response(serializer.data, status=status.HTTP_200_OK)

        customer_property = CustomerProperty.objects.filter(workspace__slug=slug)

        serializer = CustomerPropertySerializer(customer_property, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def post(self, request, slug):
        try:
            options = request.data.pop("options", [])

            workspace = Workspace.objects.get(slug=slug)
            # Check is_active
            if not request.data.get("is_active"):
                request.data["is_active"] = False

            # Check defaults
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

            # Check if required and default_value
            if request.data.get("is_required") is True:
                request.data["default_value"] = []

            serializer = CustomerPropertySerializer(data=request.data)

            # Validate the data
            serializer.is_valid(raise_exception=True)
            # Save the data
            serializer.save(workspace_id=workspace.id)

            customer_property = CustomerProperty.objects.get(pk=serializer.data["id"])

            if customer_property.property_type == "OPTION":
                self.create_or_update_options(customer_property, options, slug)

            serializer = CustomerPropertySerializer(customer_property)

            response = {
                **serializer.data,
                "options": self.get_options_response(customer_property, slug),
            }
            return Response(response, status=status.HTTP_201_CREATED)

        except IntegrityError:
            return Response(
                {"error": "A Property with the same name already exists"},
                status=status.HTTP_409_CONFLICT,
            )

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def patch(self, request, slug, pk):
        customer_property = CustomerProperty.objects.get(workspace__slug=slug, pk=pk)

        # Get the options
        options = request.data.pop("options", [])

        if (
            request.data.get("property_type")
            or request.data.get("is_multi")
            or request.data.get("settings")
        ):
            return Response({"error": "Some fields cannot be updated "})

        # Check defaults
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
        if request.data.get("is_required", customer_property.is_required) is True:
            request.data["default_value"] = []

        serializer = CustomerPropertySerializer(
            customer_property, data=request.data, partial=True
        )

        # Validate the data
        serializer.is_valid(raise_exception=True)
        # Save the data
        serializer.save()

        customer_property = CustomerProperty.objects.get(pk=serializer.data["id"])

        if customer_property.property_type == "OPTION":
            self.create_or_update_options(customer_property, options, slug)

        response = {
            **serializer.data,
            "options": self.get_options_response(customer_property, slug),
        }
        return Response(response, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def delete(self, request, slug, pk):
        # Delete an customer property
        customer_property = CustomerProperty.objects.get(workspace__slug=slug, pk=pk)
        customer_property.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
