# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
from dataclasses import dataclass
from enum import Enum
from typing import Any, Optional, Union

# Django imports
from django.db.models.fields import UUIDField

# Module imports
from plane.db.models import Issue
from plane.ee.models import IssueProperty, IssuePropertyValue, PropertyTypeEnum

# Local imports
from .utils import normalise
from .validator import DataType

WorkItem = Issue
WorkItemProperty = IssueProperty


@dataclass
class WorkItemPropertyFormulaConversionPayload:
    field: str
    type: Union[str, DataType]
    value: Optional[Any] = None

    @property
    def normalised_key(self) -> str:
        return normalise(self.field)


# default fields for work item properties
class WORK_ITEM_DEFAULT_FIELDS(Enum):
    NAME = "name"
    START_DATE = "start_date"
    TARGET_DATE = "target_date"

    @property
    def normalised_key(self) -> str:
        return normalise(self.value)


# work item default properties fields type mapping
WORK_ITEM_DEFAULT_FIELDS_TYPE_MAPPING = {
    WORK_ITEM_DEFAULT_FIELDS.NAME: DataType.TEXT,
    WORK_ITEM_DEFAULT_FIELDS.START_DATE: DataType.DATE,
    WORK_ITEM_DEFAULT_FIELDS.TARGET_DATE: DataType.DATE,
}

# work item type properties fields type mapping
WORK_ITEM_TYPE_PROPERTY_MAPPING = {
    PropertyTypeEnum.TEXT: DataType.TEXT,
    PropertyTypeEnum.DATETIME: DataType.DATE,
    PropertyTypeEnum.DECIMAL: DataType.NUMBER,
    PropertyTypeEnum.BOOLEAN: DataType.BOOLEAN,
    PropertyTypeEnum.URL: DataType.TEXT,
    PropertyTypeEnum.EMAIL: DataType.TEXT,
}

# mapping from DataType to the corresponding IssuePropertyValue field
DATA_TYPE_VALUE_FIELD_MAPPING = {
    DataType.TEXT: "value_text",
    DataType.BOOLEAN: "value_boolean",
    DataType.NUMBER: "value_decimal",
    DataType.DATE: "value_datetime",
}


# creating the individual property payload
def _create_property_payload(
    field: str,
    field_type: WORK_ITEM_DEFAULT_FIELDS | PropertyTypeEnum,
    value: Optional[Any] = None,
) -> Optional[WorkItemPropertyFormulaConversionPayload]:
    """
    Creates a property payload for the work item.
    Returns None if the field_type has no formula-compatible mapping.
    """

    updated_field_type: Optional[DataType] = None

    if isinstance(field_type, WORK_ITEM_DEFAULT_FIELDS):
        updated_field_type = WORK_ITEM_DEFAULT_FIELDS_TYPE_MAPPING.get(field_type)
    elif isinstance(field_type, PropertyTypeEnum):
        updated_field_type = WORK_ITEM_TYPE_PROPERTY_MAPPING.get(field_type)

    if updated_field_type is None:
        return None

    return WorkItemPropertyFormulaConversionPayload(field=field, type=updated_field_type, value=value)


def _get_work_item_default_properties() -> list[WorkItemPropertyFormulaConversionPayload]:
    """
    Returns a list of default properties for the work items.
    """

    default_properties = [
        _create_property_payload(field=field.value, field_type=field, value=None) for field in WORK_ITEM_DEFAULT_FIELDS
    ]
    return [prop for prop in default_properties if prop is not None]


def fetch_work_item_properties(
    work_item_id: Optional[Union[str, UUIDField]] = None,
) -> list[WorkItemPropertyFormulaConversionPayload]:
    """
    Fetches the properties of a work item.
    """

    try:
        if not work_item_id:
            return _get_work_item_default_properties()

        filter_fields = [field.value for field in WORK_ITEM_DEFAULT_FIELDS]

        work_item = WorkItem.objects.filter(id=work_item_id).only(*filter_fields).values(*filter_fields).first()
        if not work_item:
            raise ValueError(f"Work item with ID {work_item_id} does not exist")

        work_item_properties = [
            _create_property_payload(field=field.value, field_type=field, value=work_item.get(field.value))
            for field in WORK_ITEM_DEFAULT_FIELDS
        ]
        return [prop for prop in work_item_properties if prop is not None]
    except Exception as e:
        raise ValueError(f"Error fetching work item properties: {str(e)}") from e


def fetch_work_item_custom_properties(
    work_item_type_id: Union[str, UUIDField], work_item_id: Optional[Union[str, UUIDField]] = None
) -> list[WorkItemPropertyFormulaConversionPayload]:
    """
    Fetches custom properties for a work item type properties.
    """
    try:
        work_item_type_properties: list[WorkItemPropertyFormulaConversionPayload] = []

        work_item_properties = WorkItemProperty.objects.filter(issue_type_id=work_item_type_id).values(
            "id", "name", "property_type"
        )

        for field in work_item_properties:
            property_field = str(field["id"])
            property_type_enum = PropertyTypeEnum[field["property_type"]]
            updated_prop = _create_property_payload(field=property_field, field_type=property_type_enum, value=None)
            if updated_prop is not None:
                work_item_type_properties.append(updated_prop)

        if work_item_id and work_item_type_properties:
            property_ids = [field["id"] for field in work_item_properties]

            property_value_rows = IssuePropertyValue.objects.filter(
                issue_id=work_item_id, property_id__in=property_ids
            ).values(
                "property_id",
                "value_text",
                "value_boolean",
                "value_decimal",
                "value_datetime",
            )

            # Build a lookup: property_id (str) -> row dict
            property_value_map: dict[str, dict[str, Any]] = {
                str(row["property_id"]): row for row in property_value_rows
            }

            for prop in work_item_type_properties:
                row = property_value_map.get(str(prop.field))
                if row is None:
                    continue

                value_field = DATA_TYPE_VALUE_FIELD_MAPPING.get(prop.type)
                if value_field is not None:
                    prop.value = row.get(value_field)

        return work_item_type_properties
    except Exception as e:
        raise ValueError(f"Error fetching work item custom property values: {e}") from e


def fetch_formula_values(work_item_id: Union[str, UUIDField], property_ids: Optional[list] = None):
    """
    Fetches the formula values for the given work item and properties.
    """

    try:
        # fetching the work item type id
        work_item = WorkItem.objects.filter(id=work_item_id).only("type_id").values("type_id").first()
        if not work_item:
            return {}

        # converting the work item type id to a string
        work_item_type_id = str(work_item["type_id"])

        # fetching the work item properties values
        work_item_properties = fetch_work_item_properties(work_item_id=work_item_id)

        # fetching the work item type properties values
        work_item_type_properties = fetch_work_item_custom_properties(
            work_item_type_id=work_item_type_id, work_item_id=work_item_id
        )

        # combining the work item properties and work item type properties
        properties = work_item_properties + work_item_type_properties

        # Get formula properties
        formula_properties = IssueProperty.objects.filter(
            property_type=PropertyTypeEnum.FORMULA,
            formula_config__isnull=False,
            issue_type_properties__issue_type_id=work_item_type_id,
            is_active=True,
        )

        # if property ids are provided, filter the formula properties by the property ids
        if property_ids:
            formula_properties = formula_properties.filter(id__in=property_ids)

        # select the formula config for the formula properties
        formula_properties = formula_properties.select_related("formula_config")

        # execute the formula for the formula properties
        formula_values = {}
        for prop in formula_properties:
            if prop.formula_config and prop.formula_config.formula:
                from .engine import execute_formula

                executed_formula = execute_formula(formula=prop.formula_config.formula, work_item_properties=properties)
                if executed_formula.success:
                    formula_values[str(prop.id)] = executed_formula.value

        return {
            str(property_id): str(value) if value is not None else None for property_id, value in formula_values.items()
        }
    except Exception as e:
        raise ValueError(f"Error fetching formula values: {e}") from e
