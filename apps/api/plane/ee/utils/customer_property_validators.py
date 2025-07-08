# Python imports
import uuid
from datetime import datetime

# Django imports
from django.core.exceptions import ValidationError

# Module imports
from plane.ee.models.customer import (
    PropertyTypeEnum,
    CustomerPropertyValue,
    CustomerPropertyOption,
    RelationTypeEnum,
)
from plane.ee.models import Customer
from plane.db.models import WorkspaceMember
from plane.ee.utils.base_validators import (
    validate_text,
    validate_uuid,
    validate_datetime,
    validate_decimal,
    validate_boolean,
    validate_url,
    validate_email_value,
    validate_file,
)


## Validation functions


def validate_option(property, value):
    if not CustomerPropertyOption.objects.filter(property=property, id=value).exists():
        raise ValidationError(f"{value} is not a valid option")


def validate_relation(property, value):
    # Validate the UUID
    validate_uuid(property, value)
    # Validate the relation
    if property.relation_type == RelationTypeEnum.ISSUE:
        if not Customer.objects.filter(
            workspace_id=property.workspace_id, id=value
        ).exists():
            raise ValidationError(f"{value} is not a valid Customer")
    elif property.relation_type == RelationTypeEnum.USER:
        if not WorkspaceMember.objects.filter(
            workspace_id=property.workspace_id, member_id=value
        ).exists():
            raise ValidationError(f"{value} is not a valid user")
    else:
        raise ValidationError(f"{property.relation_type} is not a valid relation type")


## Save functions


def save_text(customer_property, values, existing_values, customer_id, workspace_id):
    if values:
        # Case 1 - The property is updated
        if existing_values and values[0] != existing_values[0]:
            return [
                CustomerPropertyValue(
                    property=customer_property,
                    value_text=values[0],
                    customer_id=customer_id,
                    workspace_id=workspace_id,
                )
            ]

        # Case 2 - The property is created
        return [
            CustomerPropertyValue(
                property=customer_property,
                value_text=values[0],
                customer_id=customer_id,
                workspace_id=workspace_id,
            )
        ]
    else:
        # Case 3 - The property is deleted
        return []


def save_datetime(
    customer_property, values, existing_values, customer_id, workspace_id
):
    bulk_customer_prop_values = []
    for value in values:
        # Case 1 - The property is updated
        bulk_customer_prop_values.append(
            CustomerPropertyValue(
                property=customer_property,
                value_datetime=value,
                customer_id=customer_id,
                workspace_id=workspace_id,
            )
        )

    return bulk_customer_prop_values


def save_decimal(customer_property, values, existing_values, customer_id, workspace_id):
    bulk_customer_prop_values = []
    for value in values:
        # Case 1 - The property is updated
        bulk_customer_prop_values.append(
            CustomerPropertyValue(
                property=customer_property,
                value_decimal=value,
                customer_id=customer_id,
                workspace_id=workspace_id,
            )
        )

    return bulk_customer_prop_values


def save_boolean(customer_property, values, existing_values, customer_id, workspace_id):
    bulk_customer_prop_values = []
    for value in values:
        # Case 1 - The property is updated
        bulk_customer_prop_values.append(
            CustomerPropertyValue(
                property=customer_property,
                value_boolean=bool(value == "true"),
                customer_id=customer_id,
                workspace_id=workspace_id,
            )
        )

    return bulk_customer_prop_values


def save_option(customer_property, values, existing_values, customer_id, workspace_id):
    bulk_customer_prop_values = []
    for value in values:
        # Case 1 - The property is updated
        bulk_customer_prop_values.append(
            CustomerPropertyValue(
                property=customer_property,
                value_option_id=value,
                customer_id=customer_id,
                workspace_id=workspace_id,
            )
        )

    return bulk_customer_prop_values


def save_relation(
    customer_property, values, existing_values, customer_id, workspace_id
):
    bulk_customer_prop_values = []
    for value in values:
        # Case 1 - The property is updated
        bulk_customer_prop_values.append(
            CustomerPropertyValue(
                property=customer_property,
                value_uuid=value,
                customer_id=customer_id,
                workspace_id=workspace_id,
            )
        )

    return bulk_customer_prop_values


def save_url(customer_property, values, existing_values, customer_id, workspace_id):
    bulk_customer_prop_values = []
    for value in values:
        # Case 1 - The property is updated
        bulk_customer_prop_values.append(
            CustomerPropertyValue(
                property=customer_property,
                value_text=value,
                customer_id=customer_id,
                workspace_id=workspace_id,
            )
        )

    return bulk_customer_prop_values


def save_email(customer_property, values, existing_values, customer_id, workspace_id):
    bulk_customer_prop_values = []
    for value in values:
        # Case 1 - The property is updated
        bulk_customer_prop_values.append(
            CustomerPropertyValue(
                property=customer_property,
                value_text=value,
                customer_id=customer_id,
                workspace_id=workspace_id,
            )
        )

    return bulk_customer_prop_values


def save_file(customer_property, values, existing_values, customer_id, workspace_id):
    bulk_customer_prop_values = []
    for value in values:
        # Case 1 - The property is updated
        bulk_customer_prop_values.append(
            CustomerPropertyValue(
                property=customer_property,
                value_datetime=value,
                customer_id=customer_id,
                workspace_id=workspace_id,
            )
        )

    return bulk_customer_prop_values


# Map the property type to the validator
VALIDATOR_MAPPER = {
    PropertyTypeEnum.TEXT: validate_text,
    PropertyTypeEnum.DATETIME: validate_datetime,
    PropertyTypeEnum.DECIMAL: validate_decimal,
    PropertyTypeEnum.BOOLEAN: validate_boolean,
    PropertyTypeEnum.OPTION: validate_option,
    PropertyTypeEnum.RELATION: validate_relation,
    PropertyTypeEnum.URL: validate_url,
    PropertyTypeEnum.EMAIL: validate_email_value,
    PropertyTypeEnum.FILE: validate_file,
}


def property_validators(properties, property_values, existing_prop_values):
    # Validate the property values
    for property in properties:
        # Fetch the validator
        validator = VALIDATOR_MAPPER.get(property.property_type)

        # Check if the property type is valid
        if not validator:
            raise ValidationError(
                f"{property.property_type} is not a valid property type"
            )

        # Fetch the value
        values = property_values.get(str(property.id), [])

        # Validate the value
        if property.is_required and not values:
            raise ValidationError(f"{property.display_name} is a required property")

        # Validate the value
        for value in values:
            # Validate the value
            validator(property=property, value=value)

    return


SAVE_MAPPER = {
    PropertyTypeEnum.TEXT: save_text,
    PropertyTypeEnum.DATETIME: save_datetime,
    PropertyTypeEnum.DECIMAL: save_decimal,
    PropertyTypeEnum.BOOLEAN: save_boolean,
    PropertyTypeEnum.OPTION: save_option,
    PropertyTypeEnum.RELATION: save_relation,
    PropertyTypeEnum.URL: save_url,
    PropertyTypeEnum.EMAIL: save_email,
    PropertyTypeEnum.FILE: save_file,
}


def property_savers(
    properties,
    property_values,
    customer_id,
    workspace_id,
    existing_prop_values,
):
    # Save the property values
    bulk_customer_properties = []
    for property in properties:
        # Fetch the saver
        saver = SAVE_MAPPER.get(property.property_type)

        # Check if the property type is valid
        if not saver:
            raise ValidationError(
                f"{property.property_type} is not a valid property type"
            )

        # Fetch the value
        values = property_values.get(str(property.id), [])

        # Get the existing values
        existing_values = [
            prop_value.get("values")
            for prop_value in existing_prop_values
            if str(prop_value.get("property_id")) == str(property.id)
        ]

        # Save the value
        if values:
            saver_value = saver(
                customer_property=property,
                values=values,
                existing_values=existing_values,
                customer_id=customer_id,
                workspace_id=workspace_id,
            )
            # Save the value
            bulk_customer_properties.extend(saver_value)

    return bulk_customer_properties  # Return the bulk issue properties
