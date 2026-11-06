# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Customer properties, their options, and the values customers hold (plane-sdk api/customers)."""

from uuid import uuid4

import pytest

from plane.db.models import Issue, User, Workspace
from plane.nexus.models import Customer, CustomerProperty, CustomerPropertyValue

M = "plane.models.customers"


@pytest.fixture
def customer(workspace):
    return Customer.objects.create(workspace=workspace, name="Acme")


@pytest.fixture
def foreign_property(db):
    owner = User.objects.create(email=f"{uuid4().hex[:8]}@x.com", username=uuid4().hex[:12])
    other = Workspace.objects.create(name="Elsewhere", slug=f"else-{uuid4().hex[:6]}", owner=owner)
    return CustomerProperty.objects.create(workspace=other, name="tier", display_name="Tier", property_type="TEXT")


def _create(client, ws_url, **body):
    res = client.post(ws_url("customer-properties/"), body, format="json")
    assert res.status_code == 201, res.data
    return res.data


@pytest.mark.contract
class TestCustomerProperties:
    def test_crud(self, client, ws_url, sdk):
        # Exactly what the MCP tool sends for a TEXT property.
        body = {
            "name": "Account Tier",
            "display_name": "Account Tier",
            "property_type": "TEXT",
            "settings": {"display_format": "single-line"},
        }
        created = sdk(f"{M}.CustomerProperty", _create(client, ws_url, **body))
        assert created["name"] == "account_tier" and created["options"] == []
        pid = created["id"]

        res = client.get(ws_url("customer-properties/"), {"per_page": 3})
        assert res.status_code == 200
        page = sdk(f"{M}.PaginatedCustomerPropertyResponse", res.data)
        assert [p["id"] for p in page["results"]] == [pid]

        res = client.get(ws_url(f"customer-properties/{pid}/"))
        assert res.status_code == 200
        sdk(f"{M}.CustomerProperty", res.data)

        res = client.patch(
            ws_url(f"customer-properties/{pid}/"), {"display_name": "Tier", "is_required": True}, format="json"
        )
        assert res.status_code == 200
        updated = sdk(f"{M}.CustomerProperty", res.data)
        assert updated["display_name"] == "Tier" and updated["is_required"] and updated["name"] == "account_tier"
        res = client.patch(ws_url(f"customer-properties/{pid}/"), {}, format="json")
        assert res.status_code == 200
        sdk(f"{M}.CustomerProperty", res.data)

        assert client.delete(ws_url(f"customer-properties/{pid}/")).status_code == 204
        assert client.get(ws_url(f"customer-properties/{pid}/")).status_code == 404

    def test_option_property(self, client, ws_url, sdk):
        prop = _create(
            client,
            ws_url,
            name="Plan",
            display_name="Plan",
            property_type="OPTION",
            options=[{"name": "Free"}, {"name": "Enterprise", "description": "Paid", "is_default": True}],
        )
        sdk(f"{M}.CustomerProperty", prop)
        assert [o["name"] for o in prop["options"]] == ["Free", "Enterprise"]
        free = prop["options"][0]
        res = client.patch(
            ws_url(f"customer-properties/{prop['id']}/"),
            {"options": [{"id": free["id"], "name": "Starter"}, {"name": "Pro"}]},
            format="json",
        )
        assert res.status_code == 200, res.data
        sdk(f"{M}.CustomerProperty", res.data)
        assert sorted(o["name"] for o in res.data["options"]) == ["Enterprise", "Pro", "Starter"]
        # Duplicate option names and foreign option ids are refused.
        dup = client.patch(ws_url(f"customer-properties/{prop['id']}/"), {"options": [{"name": "pro"}]}, format="json")
        assert dup.status_code == 400
        bad = client.patch(
            ws_url(f"customer-properties/{prop['id']}/"),
            {"options": [{"id": str(uuid4()), "name": "X"}]},
            format="json",
        )
        assert bad.status_code == 400

    def test_validation(self, client, ws_url):
        url = ws_url("customer-properties/")
        assert client.post(url, {"display_name": "X", "property_type": "FORMULA"}, format="json").status_code == 400
        assert (
            client.post(url, {"display_name": "Owner", "property_type": "RELATION"}, format="json").status_code == 400
        )
        res = client.post(
            url, {"display_name": "Size", "property_type": "DECIMAL", "options": [{"name": "a"}]}, format="json"
        )
        assert res.status_code == 400
        _create(client, ws_url, name="Region", display_name="Region", property_type="TEXT")
        dup = client.post(url, {"name": "Region", "display_name": "Region", "property_type": "TEXT"}, format="json")
        assert dup.status_code == 400

    def test_relation_and_datetime_defaults(self, client, ws_url, sdk):
        rel = _create(
            client, ws_url, name="Owner", display_name="Owner", property_type="RELATION", relation_type="USER"
        )
        assert sdk(f"{M}.CustomerProperty", rel)["relation_type"] == "USER"
        dt = _create(client, ws_url, name="Renewal", display_name="Renewal", property_type="DATETIME")
        assert sdk(f"{M}.CustomerProperty", dt)["settings"]["display_format"]

    def test_other_workspace_404(self, client, ws_url, foreign_property):
        url = ws_url(f"customer-properties/{foreign_property.id}/")
        assert client.get(url).status_code == 404
        assert client.patch(url, {"display_name": "x"}, format="json").status_code == 404
        assert client.delete(url).status_code == 404

    def test_permissions(self, client, member_client, guest_client, outsider_client, ws_url):
        prop = _create(client, ws_url, name="Seg", display_name="Seg", property_type="TEXT")
        url = ws_url("customer-properties/")
        assert member_client.get(url).status_code == 200
        assert member_client.get(f"{url}{prop['id']}/").status_code == 200
        # Only admins configure properties.
        assert member_client.post(url, {"display_name": "M", "property_type": "TEXT"}, format="json").status_code == 403
        assert member_client.patch(f"{url}{prop['id']}/", {"display_name": "M"}, format="json").status_code == 403
        assert member_client.delete(f"{url}{prop['id']}/").status_code == 403
        assert guest_client.get(url).status_code == 403
        assert outsider_client.get(url).status_code == 403


@pytest.mark.contract
class TestCustomerPropertyValues:
    def test_set_and_get(self, client, ws_url, workspace, project, customer, create_user, sdk):
        text = _create(client, ws_url, name="Tier", display_name="Tier", property_type="TEXT")
        flag = _create(client, ws_url, name="Paying", display_name="Paying", property_type="BOOLEAN")
        when = _create(client, ws_url, name="Since", display_name="Since", property_type="DATETIME")
        plan = _create(
            client,
            ws_url,
            name="Plans",
            display_name="Plans",
            property_type="OPTION",
            is_multi=True,
            options=[{"name": "A"}, {"name": "B"}],
        )
        owner = _create(
            client, ws_url, name="Owner", display_name="Owner", property_type="RELATION", relation_type="USER"
        )
        issue_rel = _create(
            client, ws_url, name="Epic", display_name="Epic", property_type="RELATION", relation_type="ISSUE"
        )
        issue = Issue.objects.create(name="Bug", project=project, workspace=workspace)
        option_ids = [o["id"] for o in plan["options"]]

        url = ws_url(f"customers/{customer.id}/property-values/")
        assert sdk(f"{M}.CustomerPropertyValues", client.get(url).data) == {}
        body = {
            "customer_property_values": {
                text["id"]: ["Enterprise"],
                flag["id"]: ["true"],
                when["id"]: ["2026-01-31"],
                plan["id"]: option_ids,
                owner["id"]: [str(create_user.id)],
                issue_rel["id"]: [str(issue.id)],
            }
        }
        res = client.post(url, body, format="json")
        assert res.status_code == 200, res.data
        values = sdk(f"{M}.CustomerPropertyValues", client.get(url).data)
        assert values[text["id"]] == ["Enterprise"] and values[flag["id"]] == ["True"]
        assert values[when["id"]] == ["2026-01-31"] and values[plan["id"]] == option_ids

        # Writes replace only the properties named.
        assert client.post(url, {"customer_property_values": {text["id"]: ["SMB"]}}, format="json").status_code == 200
        values = client.get(url).data
        assert values[text["id"]] == ["SMB"] and values[flag["id"]] == ["True"]

        res = client.get(f"{url}{text['id']}/")
        assert res.status_code == 200
        assert sdk(f"{M}.CustomerPropertyValues", res.data) == {text["id"]: ["SMB"]}
        res = client.patch(f"{url}{text['id']}/", {"values": ["Mid"]}, format="json")
        assert res.status_code == 200 and res.data == {text["id"]: ["Mid"]}
        assert client.get(f"{url}{text['id']}/").data == {text["id"]: ["Mid"]}

        # Inactive properties are left out of reads.
        CustomerProperty.objects.filter(pk=flag["id"]).update(is_active=False)
        assert flag["id"] not in client.get(url).data

    def test_validation(self, client, ws_url, customer):
        num = _create(client, ws_url, name="Seats", display_name="Seats", property_type="DECIMAL", is_required=True)
        single = _create(client, ws_url, name="Site", display_name="Site", property_type="URL")
        mail = _create(client, ws_url, name="Mail", display_name="Mail", property_type="EMAIL")
        url = ws_url(f"customers/{customer.id}/property-values/")
        for body in (
            {num["id"]: ["many"]},
            {num["id"]: []},
            {single["id"]: ["https://a.test", "https://b.test"]},
            {single["id"]: ["not a url"]},
            {mail["id"]: ["nope"]},
            {str(uuid4()): ["x"]},
            {"not-a-uuid": ["x"]},
        ):
            res = client.post(url, {"customer_property_values": body}, format="json")
            assert res.status_code == 400, (body, res.data)
        assert not CustomerPropertyValue.objects.filter(customer=customer).exists()
        assert client.post(url, {"values": {}}, format="json").status_code == 400

    def test_other_workspace_404(self, client, ws_url, customer, foreign_property):
        url = ws_url(f"customers/{customer.id}/property-values/")
        assert client.get(f"{url}{foreign_property.id}/").status_code == 404
        res = client.post(url, {"customer_property_values": {str(foreign_property.id): ["x"]}}, format="json")
        assert res.status_code == 400

    def test_permissions(self, client, member_client, guest_client, outsider_client, ws_url, customer):
        text = _create(client, ws_url, name="Tier", display_name="Tier", property_type="TEXT")
        url = ws_url(f"customers/{customer.id}/property-values/")
        body = {"customer_property_values": {text["id"]: ["A"]}}
        assert member_client.post(url, body, format="json").status_code == 200
        assert member_client.get(url).status_code == 200
        assert guest_client.get(url).status_code == 403
        assert guest_client.post(url, body, format="json").status_code == 403
        assert outsider_client.get(url).status_code == 403


@pytest.mark.contract
class TestCustomerPropertyIsMulti:
    def test_is_multi_can_be_changed(self, client, ws_url, sdk):
        prop = _create(client, ws_url, display_name="Plans", property_type="TEXT")
        res = client.patch(ws_url(f"customer-properties/{prop['id']}/"), {"is_multi": True}, format="json")
        assert res.status_code == 200 and sdk(f"{M}.CustomerProperty", res.data)["is_multi"] is True

    def test_is_multi_cannot_be_turned_off_under_multiple_values(self, client, ws_url, workspace, customer):
        prop = _create(client, ws_url, display_name="Plans", property_type="TEXT", is_multi=True)
        row = CustomerProperty.objects.get(pk=prop["id"])
        for value in ("A", "B"):
            CustomerPropertyValue.objects.create(workspace=workspace, customer=customer, property=row, value=value)
        res = client.patch(ws_url(f"customer-properties/{prop['id']}/"), {"is_multi": False}, format="json")
        assert res.status_code == 400 and "more than one value" in res.data["error"]
        row.refresh_from_db()
        assert row.is_multi is True
