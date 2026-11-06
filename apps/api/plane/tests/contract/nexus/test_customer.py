# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Customers, customer requests and customer work item links (plane-sdk api/customers)."""

from uuid import uuid4

import pytest

from plane.db.models import Issue, User, Workspace
from plane.nexus.models import Customer, CustomerRequest, CustomerWorkItem

from .test_work_item_support import GUEST, MEMBER, make_issue

M = "plane.models.customers"


@pytest.fixture
def other_customer(db):
    owner = User.objects.create(email=f"{uuid4().hex[:8]}@x.com", username=uuid4().hex[:12])
    other = Workspace.objects.create(name="Elsewhere", slug=f"else-{uuid4().hex[:6]}", owner=owner)
    return Customer.objects.create(workspace=other, name="Hidden")


@pytest.fixture
def customer(workspace):
    return Customer.objects.create(workspace=workspace, name="Acme")


@pytest.fixture
def issues(project, workspace):
    return [Issue.objects.create(name=f"Bug {i}", project=project, workspace=workspace) for i in range(3)]


@pytest.mark.contract
class TestCustomers:
    def test_create_list_retrieve_update(self, client, ws_url, sdk):
        body = {
            "name": "Globex",
            "description_html": "<p>Big one</p>",
            "email": "ops@globex.test",
            "website_url": "https://globex.test",
            "domain": "Manufacturing",
            "employees": 300,
            "stage": "lead",
            "contract_status": "active",
            "revenue": "1000000",
            "external_source": "hubspot",
            "external_id": "42",
        }
        res = client.post(ws_url("customers/"), body, format="json")
        assert res.status_code == 201, res.data
        created = sdk(f"{M}.Customer", res.data)
        assert created["description_stripped"] == "Big one" and created["customer_request_count"] == 0
        cid = created["id"]

        res = client.get(ws_url("customers/"), {"query": "glob", "per_page": 5})
        assert res.status_code == 200, res.data
        page = sdk(f"{M}.PaginatedCustomerResponse", res.data)
        assert [c["id"] for c in page["results"]] == [cid]

        res = client.get(ws_url(f"customers/{cid}/"))
        assert res.status_code == 200 and sdk(f"{M}.Customer", res.data)["employees"] == 300

        res = client.patch(ws_url(f"customers/{cid}/"), {"stage": "closed_won"}, format="json")
        assert res.status_code == 200 and sdk(f"{M}.Customer", res.data)["stage"] == "closed_won"
        assert res.data["name"] == "Globex"

        res = client.patch(ws_url(f"customers/{cid}/"), {}, format="json")
        assert res.status_code == 200
        sdk(f"{M}.Customer", res.data)

    def test_create_is_an_upsert(self, client, ws_url, workspace):
        first = client.post(ws_url("customers/"), {"name": "Initech"}, format="json")
        assert first.status_code == 201
        again = client.post(ws_url("customers/"), {"name": "initech", "stage": "lead"}, format="json")
        assert again.status_code == 200 and again.data["id"] == first.data["id"] and again.data["stage"] == "lead"

        ext = {"name": "Umbrella", "external_source": "crm", "external_id": "u-1"}
        created = client.post(ws_url("customers/"), ext, format="json")
        renamed = client.post(ws_url("customers/"), {**ext, "name": "Umbrella Corp"}, format="json")
        assert renamed.status_code == 200 and renamed.data["id"] == created.data["id"]
        assert renamed.data["name"] == "Umbrella Corp"
        assert Customer.objects.filter(workspace=workspace).count() == 2

    def test_create_requires_name(self, client, ws_url):
        assert client.post(ws_url("customers/"), {"email": "x@y.z"}, format="json").status_code == 400

    def test_rename_to_existing_name_is_refused(self, client, ws_url, workspace, customer):
        other = Customer.objects.create(workspace=workspace, name="Other")
        res = client.patch(ws_url(f"customers/{other.id}/"), {"name": "acme"}, format="json")
        assert res.status_code == 400

    def test_delete_by_id_soft_deletes_children(self, client, ws_url, workspace, customer, issues):
        req = CustomerRequest.objects.create(workspace=workspace, customer=customer, name="SSO")
        CustomerWorkItem.objects.create(workspace=workspace, customer=customer, customer_request=req, issue=issues[0])
        assert client.delete(ws_url(f"customers/{customer.id}/")).status_code == 204
        assert client.get(ws_url(f"customers/{customer.id}/")).status_code == 404
        assert Customer.all_objects.get(pk=customer.id).deleted_at is not None
        assert not CustomerRequest.objects.filter(customer_id=customer.id).exists()
        assert not CustomerWorkItem.objects.filter(customer_id=customer.id).exists()
        # The name is free again.
        assert client.post(ws_url("customers/"), {"name": "Acme"}, format="json").status_code == 201

    def test_delete_by_external_reference(self, client, ws_url, workspace):
        Customer.objects.create(workspace=workspace, name="Ext", external_source="crm", external_id="9")
        res = client.delete(ws_url("customers/") + "?external_source=crm&external_id=9")
        assert res.status_code == 204
        assert not Customer.objects.filter(workspace=workspace, name="Ext").exists()
        # A reference that matches nothing succeeds silently.
        assert client.delete(ws_url("customers/") + "?external_source=crm&external_id=9").status_code == 204
        assert client.delete(ws_url("customers/")).status_code == 400

    def test_other_workspace_ids_404(self, client, ws_url, other_customer):
        for method in ("get", "patch", "delete"):
            assert getattr(client, method)(ws_url(f"customers/{other_customer.id}/")).status_code == 404
        assert client.get(ws_url(f"customers/{other_customer.id}/issues/")).status_code == 404
        assert client.get(ws_url(f"customers/{other_customer.id}/requests/")).status_code == 404
        res = client.get(ws_url("customers/"))
        assert str(other_customer.id) not in [str(c["id"]) for c in res.data["results"]]

    def test_permissions(self, member_client, guest_client, outsider_client, ws_url, customer):
        assert member_client.get(ws_url("customers/")).status_code == 200
        assert member_client.post(ws_url("customers/"), {"name": "ByMember"}, format="json").status_code == 201
        assert (
            member_client.patch(ws_url(f"customers/{customer.id}/"), {"stage": "x"}, format="json").status_code == 200
        )
        assert guest_client.get(ws_url("customers/")).status_code == 403
        assert guest_client.get(ws_url(f"customers/{customer.id}/")).status_code == 403
        assert guest_client.post(ws_url("customers/"), {"name": "G"}, format="json").status_code == 403
        assert outsider_client.get(ws_url("customers/")).status_code == 403
        assert outsider_client.delete(ws_url(f"customers/{customer.id}/")).status_code == 403


@pytest.mark.contract
class TestCustomerWorkItems:
    def test_link_list_unlink(self, client, ws_url, customer, issues, project, sdk):
        url = ws_url(f"customers/{customer.id}/issues/")
        res = client.post(url, {"issue_ids": [str(issues[0].id), str(issues[1].id)]}, format="json")
        assert res.status_code == 201, res.data
        linked = sdk(f"{M}.LinkCustomerWorkItemsResponse", res.data)
        assert {i["id"] for i in linked["linked_issues"]} == {str(issues[0].id), str(issues[1].id)}
        assert linked["linked_issues"][0]["project__identifier"] == "NX"

        # Re-linking is a no-op.
        assert client.post(url, {"issue_ids": [str(issues[0].id)]}, format="json").status_code == 201
        assert CustomerWorkItem.objects.filter(customer=customer).count() == 2

        res = client.get(url)
        assert res.status_code == 200 and len(res.data) == 2
        for row in res.data:
            sdk(f"{M}.CustomerWorkItem", row)

        res = client.get(url, {"search": f"NX-{issues[1].sequence_id}"})
        assert [str(r["id"]) for r in res.data] == [str(issues[1].id)]

        assert client.delete(ws_url(f"customers/{customer.id}/issues/{issues[0].id}/")).status_code == 204
        assert [str(r["id"]) for r in client.get(url).data] == [str(issues[1].id)]
        assert client.delete(ws_url(f"customers/{customer.id}/issues/{issues[0].id}/")).status_code == 404

    def test_link_rejects_unknown_work_item(self, client, ws_url, customer, issues):
        res = client.post(
            ws_url(f"customers/{customer.id}/issues/"), {"issue_ids": [str(issues[0].id), str(uuid4())]}, format="json"
        )
        assert res.status_code == 400
        assert not CustomerWorkItem.objects.filter(customer=customer).exists()

    def test_links_through_a_request(self, client, ws_url, workspace, customer, issues):
        req = CustomerRequest.objects.create(workspace=workspace, customer=customer, name="Export")
        url = ws_url(f"customers/{customer.id}/issues/")
        assert (
            client.post(
                f"{url}?customer_request_id={req.id}", {"issue_ids": [str(issues[0].id)]}, format="json"
            ).status_code
            == 201
        )
        assert client.post(url, {"issue_ids": [str(issues[1].id)]}, format="json").status_code == 201
        assert [str(r["id"]) for r in client.get(url, {"customer_request_id": str(req.id)}).data] == [str(issues[0].id)]
        assert len(client.get(url).data) == 2
        # Unlinking via another request's id leaves the link.
        other = CustomerRequest.objects.create(workspace=workspace, customer=customer, name="Other")
        res = client.delete(
            ws_url(f"customers/{customer.id}/issues/{issues[0].id}/") + f"?customer_request_id={other.id}"
        )
        assert res.status_code == 404
        res = client.delete(
            ws_url(f"customers/{customer.id}/issues/{issues[0].id}/") + f"?customer_request_id={req.id}"
        )
        assert res.status_code == 204
        assert client.get(url, {"customer_request_id": str(uuid4())}).status_code == 404

    def test_permissions(self, guest_client, outsider_client, member_client, ws_url, customer, issues):
        url = ws_url(f"customers/{customer.id}/issues/")
        body = {"issue_ids": [str(issues[0].id)]}
        assert guest_client.post(url, body, format="json").status_code == 403
        assert outsider_client.get(url).status_code == 403
        assert member_client.post(url, body, format="json").status_code == 201
        assert member_client.delete(ws_url(f"customers/{customer.id}/issues/{issues[0].id}/")).status_code == 204


@pytest.mark.contract
class TestCustomerRequests:
    def test_crud(self, client, ws_url, customer, issues, sdk):
        url = ws_url(f"customers/{customer.id}/requests/")
        body = {
            "name": "SAML login",
            "description_html": "<p>Needs Okta</p>",
            "link": "https://crm.test/r/1",
            "work_item_ids": [str(issues[0].id)],
        }
        res = client.post(url, body, format="json")
        assert res.status_code == 201, res.data
        created = sdk(f"{M}.CustomerRequest", res.data)
        assert created["work_item_ids"] == [str(issues[0].id)]
        rid = created["id"]
        # The work item is linked to the customer through the request.
        assert [str(r["id"]) for r in client.get(ws_url(f"customers/{customer.id}/issues/")).data] == [
            str(issues[0].id)
        ]
        assert client.get(ws_url(f"customers/{customer.id}/")).data["customer_request_count"] == 1
        assert client.get(ws_url("customers/")).data["results"][0]["customer_request_count"] == 1

        res = client.get(url, {"query": "saml", "per_page": 10})
        assert res.status_code == 200
        page = sdk(f"{M}.PaginatedCustomerRequestResponse", res.data)
        assert [r["id"] for r in page["results"]] == [rid]

        res = client.get(f"{url}{rid}/")
        assert res.status_code == 200 and sdk(f"{M}.CustomerRequest", res.data)["link"] == "https://crm.test/r/1"

        res = client.patch(f"{url}{rid}/", {"name": "SAML SSO", "work_item_ids": [str(issues[1].id)]}, format="json")
        assert res.status_code == 200
        assert sdk(f"{M}.CustomerRequest", res.data)["work_item_ids"] == [str(issues[1].id)]
        res = client.patch(f"{url}{rid}/", {}, format="json")
        assert res.status_code == 200 and res.data["name"] == "SAML SSO"
        sdk(f"{M}.CustomerRequest", res.data)

        assert client.delete(f"{url}{rid}/").status_code == 204
        assert client.get(f"{url}{rid}/").status_code == 404
        assert client.get(ws_url(f"customers/{customer.id}/issues/")).data == []

    def test_create_validation(self, client, ws_url, customer):
        url = ws_url(f"customers/{customer.id}/requests/")
        assert client.post(url, {"link": "x"}, format="json").status_code == 400
        assert client.post(url, {"name": "X", "work_item_ids": [str(uuid4())]}, format="json").status_code == 400
        assert not CustomerRequest.objects.filter(customer=customer).exists()

    def test_other_workspace_and_other_customer_404(self, client, ws_url, workspace, customer, other_customer):
        foreign = CustomerRequest.objects.create(workspace=other_customer.workspace, customer=other_customer, name="F")
        sibling = Customer.objects.create(workspace=workspace, name="Sibling")
        mine = CustomerRequest.objects.create(workspace=workspace, customer=sibling, name="Mine")
        assert client.get(ws_url(f"customers/{customer.id}/requests/{foreign.id}/")).status_code == 404
        assert client.get(ws_url(f"customers/{other_customer.id}/requests/{foreign.id}/")).status_code == 404
        assert (
            client.patch(ws_url(f"customers/{customer.id}/requests/{mine.id}/"), {}, format="json").status_code == 404
        )
        assert client.delete(ws_url(f"customers/{customer.id}/requests/{mine.id}/")).status_code == 404

    def test_permissions(self, member_client, guest_client, outsider_client, ws_url, customer):
        url = ws_url(f"customers/{customer.id}/requests/")
        res = member_client.post(url, {"name": "From member"}, format="json")
        assert res.status_code == 201
        assert member_client.delete(f"{url}{res.data['id']}/").status_code == 204
        assert guest_client.get(url).status_code == 403
        assert guest_client.post(url, {"name": "G"}, format="json").status_code == 403
        assert outsider_client.get(url).status_code == 403


@pytest.mark.contract
class TestCustomerSafety:
    def test_description_html_is_sanitized(self, client, ws_url, customer):
        body = {"name": "Initech", "description_html": '<p>Hi</p><img src="x" onerror="alert(1)">'}
        res = client.post(ws_url("customers/"), body, format="json")
        assert res.status_code == 201, res.data
        assert "onerror" not in res.data["description_html"] and "<p>Hi</p>" in res.data["description_html"]
        body = {"name": "SSO", "description_html": "<script>alert(1)</script><p>Please</p>"}
        res = client.post(ws_url(f"customers/{customer.id}/requests/"), body, format="json")
        assert res.status_code == 201, res.data
        assert "<script" not in res.data["description_html"] and "<p>Please</p>" in res.data["description_html"]

    def test_project_guest_sees_only_their_own_linked_work_items(
        self, client, make_user, workspace, project, ws_url, customer, issues
    ):
        user, api = make_user(MEMBER, workspace=workspace, project=project, project_role=GUEST)
        own = make_issue(project, "Mine", creator=user)
        url = ws_url(f"customers/{customer.id}/issues/")
        assert client.post(url, {"issue_ids": [str(issues[0].id), str(own.id)]}, format="json").status_code == 201
        assert {str(row["id"]) for row in client.get(url).data} == {str(issues[0].id), str(own.id)}
        assert [str(row["id"]) for row in api.get(url).data] == [str(own.id)]
