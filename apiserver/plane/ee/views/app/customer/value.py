# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import F, Value, Case, When
from django.db.models.functions import Cast
from django.core.exceptions import ValidationError

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.app.permissions import WorkSpaceAdminPermission
from plane.ee.models import CustomerPropertyValue, PropertyTypeEnum, Customer, CustomerProperty
from django.db.models import Q, CharField, Func
from plane.ee.utils.customer_property_validators import (
    property_savers,
    property_validators,
    SAVE_MAPPER,
    VALIDATOR_MAPPER,
)


class CustomerPropertyValueEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    def query_annotator(self, query):
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
                    default=Value(""), # Default value is none if the conditions match
                    output_field=CharField(),
                ),
                filter=Q(property_id=F("property_id")),
                distinct=True,
                
            )
        )
    
    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def get(self, request, slug, customer_id):
        # Get all customer property values
        customer_property_values = CustomerPropertyValue.objects.filter(
            workspace__slug=slug,
            customer_id=customer_id,
            property__is_active=True, 
        )        

        # Annotate the query
        customer_property_values = self. query_annotator(customer_property_values).values(
            "property_id", "values"
        )

        # Create dictionary of property_id and value
        response = {
            str(customer_property_value["property_id"]): customer_property_value["values"]
            for customer_property_value in customer_property_values
        }

        return Response(response, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def post(self, request, slug, customer_id):
        try:
            customer_property_values = request.data.get("customer_property_values", {})

            # Get all the custom property ids
            customer_property_ids = list(customer_property_values.keys())

            # Existing values
            existing_prop_queryset = CustomerPropertyValue.objects.filter(
                workspace__slug=slug,
                customer_id=customer_id,
            )

            existing_prop_values = self.query_annotator(existing_prop_queryset).values(
                "property_id", "values"
            )

            # Get customer
            customer = Customer.objects.get(pk=customer_id)

            # Get all customer propreties
            customer_properties = CustomerProperty.objects.filter(
                workspace__slug=slug,
                is_active=True,
            )

            # Validate the dta
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

            # Delete the old values
            existing_prop_queryset.filter(
                property_id__in=customer_property_ids
            ).delete()

            # Bulk create the customer property values
            CustomerPropertyValue.objects.bulk_create(
                bulk_customer_property_values, batch_size=10
            )

            return Response(status=status.HTTP_201_CREATED)
        except (ValidationError, ValueError)as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    
    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def patch(self, request, slug, customer_id, property_id):
        try:
            customer_property = CustomerProperty.objects.get(
                workspace__slug=slug,
                pk=property_id
            )

            existing_prop_queryset = CustomerPropertyValue.objects.filter(
                workspace__slug=slug,
                customer_id=customer_id,
                property_id=property_id
            )

            # Get the values 
            values = request.data.get("values", [])

            # Check if the property is required
            if customer_property.is_required and (
                not values or not [v for v in values if v]
            ):
                return Response(
                    {"error": customer_property.display_name + " is a required property"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate the values
            validator = VALIDATOR_MAPPER.get(customer_property.property_type)

            if validator:
                for value in values:
                    validator(property=customer_property, value=value)
            else:
                raise ValidationError("Invalid property type")
            
            # Save the values
            saver = SAVE_MAPPER.get(customer_property.property_type)

            if saver:
                # Save the data
                property_values = saver(
                    values=values,
                    customer_property=customer_property,
                    customer_id=customer_id,
                    existing_values=[],
                    workspace_id=customer_property.workspace_id,
                )
                # Delete the old values
                existing_prop_queryset.filter(property_id=property_id).delete()
                # Bulk create the issue property values
                CustomerPropertyValue.objects.bulk_create(property_values, batch_size=10)

            else:
                raise ValidationError("Invalid property type")

            return Response(status=status.HTTP_204_NO_CONTENT)
        except (ValidationError, ValueError) as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
                
