"""Customers in the workspace, and the work items linked to them."""

from __future__ import annotations

from typing import Literal

from fastmcp import FastMCP
from plane.models.customers import (
    CreateCustomer,
    Customer,
    CustomerWorkItem,
    LinkCustomerWorkItems,
    PaginatedCustomerResponse,
    UpdateCustomer,
)

from plane_mcp.client import get_plane_client_context
from plane_mcp.toolkit import Action, build_annotations, build_description, coerce_list, missing, opt, page_params

NAME = "customer"
TITLE = "Customers"

STAGES = ("lead", "sales_qualified_lead", "contract_negotiation", "closed_won", "closed_lost")
CONTRACT_STATUSES = ("active", "pre_contract", "signed", "inactive")

ACTIONS = (
    Action("list", (), ("query", "cursor", "per_page"), read=True),
    Action("retrieve", ("customer_id",), read=True),
    Action(
        "create",
        ("name",),
        (
            "description_html",
            "email",
            "website_url",
            "domain",
            "employees",
            "stage",
            "contract_status",
            "revenue",
            "external_source",
            "external_id",
        ),
        note="upsert: matches on external_source + external_id, else on name, so it never duplicates",
    ),
    Action(
        "update",
        ("customer_id",),
        (
            "name",
            "description_html",
            "email",
            "website_url",
            "domain",
            "employees",
            "stage",
            "contract_status",
            "revenue",
            "external_source",
            "external_id",
        ),
        note="only the fields you pass are changed",
    ),
    Action(
        "delete",
        (),
        ("customer_id", "external_source", "external_id"),
        note="address by customer_id, or by external_source plus external_id",
        destructive=True,
    ),
    Action("list_workitems", ("customer_id",), ("customer_request_id", "search"), read=True),
    Action(
        "manage_workitems",
        ("customer_id",),
        ("link_ids", "unlink_ids", "customer_request_id"),
        note="pass at least one of link_ids or unlink_ids; returns nothing, read back with list_workitems",
    ),
)

FOOTER = (
    'domain is the customer\'s industry, shown as "Industry" in Plane -- the website goes in '
    f"website_url. stage renders as one of: {', '.join(STAGES)}. contract_status renders as one "
    f"of: {', '.join(CONTRACT_STATUSES)}. Both are stored free-form; anything else is kept but "
    "not displayed. revenue is annual revenue as a string."
)

LEGACY = {
    "list_customers": "list",
    "retrieve_customer": "retrieve",
    "create_customer": "create",
    "update_customer": "update",
    "delete_customer": "delete",
    "list_customer_work_items": "list_workitems",
}

LEGACY_UNMAPPED = {
    "manage_customer_work_items": "took action='link'|'unlink', which collides with the dispatch "
    "key: use manage_workitems with link_ids or unlink_ids",
}


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("Customers in the workspace.", ACTIONS, FOOTER),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    def customer(
        action: Literal[
            "list",
            "retrieve",
            "create",
            "update",
            "delete",
            "list_workitems",
            "manage_workitems",
        ],
        customer_id: str = "",
        customer_request_id: str = "",
        name: str = "",
        description_html: str = "",
        email: str = "",
        website_url: str = "",
        domain: str = "",
        # 0 is a real head count, so unset is None rather than the 0 sentinel.
        employees: int | None = None,
        stage: str = "",
        contract_status: str = "",
        revenue: str = "",
        link_ids: str = "",
        unlink_ids: str = "",
        search: str = "",
        query: str = "",
        external_source: str = "",
        external_id: str = "",
        cursor: str = "",
        per_page: int = 0,
    ) -> Customer | PaginatedCustomerResponse | list[CustomerWorkItem] | str | None:
        client, workspace_slug = get_plane_client_context()
        customers = client.customers

        if action == "list":
            return customers.list(workspace_slug=workspace_slug, params=page_params(cursor, per_page, query=query))

        if action == "create":
            if not name:
                return missing(action, "name")
            return customers.create(
                workspace_slug=workspace_slug,
                data=CreateCustomer(
                    name=name,
                    description_html=opt(description_html),
                    email=opt(email),
                    website_url=opt(website_url),
                    domain=opt(domain),
                    employees=employees,
                    stage=opt(stage),
                    contract_status=opt(contract_status),
                    revenue=opt(revenue),
                    external_source=opt(external_source),
                    external_id=opt(external_id),
                ),
            )

        if action == "delete":
            if not customer_id and not (external_source and external_id):
                return missing(action, "customer_id (or both external_source and external_id)")
            customers.delete(
                workspace_slug=workspace_slug,
                customer_id=opt(customer_id),
                external_source=opt(external_source),
                external_id=opt(external_id),
            )
            return None

        if not customer_id:
            return missing(action, "customer_id")

        if action == "retrieve":
            return customers.retrieve(workspace_slug=workspace_slug, customer_id=customer_id)

        if action == "update":
            return customers.update(
                workspace_slug=workspace_slug,
                customer_id=customer_id,
                data=UpdateCustomer(
                    name=opt(name),
                    description_html=opt(description_html),
                    email=opt(email),
                    website_url=opt(website_url),
                    domain=opt(domain),
                    employees=employees,
                    stage=opt(stage),
                    contract_status=opt(contract_status),
                    revenue=opt(revenue),
                    external_source=opt(external_source),
                    external_id=opt(external_id),
                ),
            )

        work_items = customers.work_items

        if action == "list_workitems":
            return work_items.list(
                workspace_slug=workspace_slug,
                customer_id=customer_id,
                customer_request_id=opt(customer_request_id),
                search=opt(search),
            )

        link = coerce_list(link_ids)
        unlink = coerce_list(unlink_ids)
        if not link and not unlink:
            return missing(action, "link_ids or unlink_ids")
        if link:
            work_items.create(
                workspace_slug=workspace_slug,
                customer_id=customer_id,
                data=LinkCustomerWorkItems(work_item_ids=link),
                customer_request_id=opt(customer_request_id),
            )
        for workitem_id in unlink or []:
            # Without a request id this drops every link to the work item,
            # whichever request created it.
            work_items.delete(
                workspace_slug=workspace_slug,
                customer_id=customer_id,
                work_item_id=workitem_id,
                customer_request_id=opt(customer_request_id),
            )
        return None
