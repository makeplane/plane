"""Customer properties take Plane's customer vocabulary, not the work item one."""

from __future__ import annotations

import pytest
from plane.models.enums import CustomerPropertyType, CustomerRelationType

from plane_mcp.tools.customer_property import PROPERTY_TYPES, RELATION_TYPES


def _create(registered, **arguments):
    return registered["customer_property"].fn(action="create", display_name="Tier", **arguments)


def test_the_advertised_vocabulary_is_the_customer_one(registered):
    description = registered["customer_property"].description

    assert set(PROPERTY_TYPES) == {member.value for member in CustomerPropertyType}
    assert set(RELATION_TYPES) == {member.value for member in CustomerRelationType}
    for work_item_only in ("FORMULA", "CASCADING", "RELEASE", "RICH_TEXT"):
        assert work_item_only not in description, f"{work_item_only} is advertised on customers"


@pytest.mark.parametrize("property_type", ["FORMULA", "CASCADING"])
def test_a_work_item_only_type_is_refused_before_plane_sees_it(property_type, registered, spy):
    result = _create(registered, property_type=property_type)

    assert result.startswith("Error: property_type must be one of:")
    assert not spy.recorder.calls


@pytest.mark.parametrize("action", ["create", "update"])
@pytest.mark.parametrize("relation_type", ["RELEASE", "RICH_TEXT"])
def test_a_work_item_only_relation_is_refused_before_plane_sees_it(action, relation_type, registered, spy):
    result = registered["customer_property"].fn(
        action=action, display_name="Tier", property_id="prop-1", property_type="RELATION", relation_type=relation_type
    )

    assert result.startswith("Error: relation_type must be one of:")
    assert not spy.recorder.calls


def test_a_customer_type_reaches_the_sdk_in_the_customer_enum(registered, spy):
    _create(registered, property_type="RELATION", relation_type="USER")

    data = spy.recorder.only().kwargs["data"]
    assert data.property_type is CustomerPropertyType.RELATION
    assert data.relation_type is CustomerRelationType.USER
