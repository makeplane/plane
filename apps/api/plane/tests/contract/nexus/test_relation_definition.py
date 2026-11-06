# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from uuid import uuid4

import pytest

from plane.db.models import User, Workspace
from plane.nexus.models import WorkItemRelationDefinition

DEFINITION = "plane.models.work_item_relation_definitions.WorkItemRelationDefinition"
PAGE = "plane.models.work_item_relation_definitions.PaginatedWorkItemRelationDefinitionResponse"


@pytest.mark.contract
class TestRelationDefinitions:
    def test_crud(self, client, ws_url, sdk):
        res = client.post(ws_url("work-item-relation-definitions/"), {"name": "Implements"}, format="json")
        assert res.status_code == 201, res.data
        created = sdk(DEFINITION, res.data)
        assert created["outward"] == "Implements" and created["inward"] == "Implements" and created["is_active"]

        res = client.get(ws_url("work-item-relation-definitions/?per_page=100"))
        assert res.status_code == 200
        page = sdk(PAGE, res.data)
        assert [d["name"] for d in page["results"]] == ["Relates to", "Duplicate", "Implements"]

        body = {"outward": "implements", "inward": "is implemented by", "color": "#ff0000", "is_active": False}
        res = client.patch(ws_url(f"work-item-relation-definitions/{created['id']}/"), body, format="json")
        assert res.status_code == 200
        updated = sdk(DEFINITION, res.data)
        assert updated["inward"] == "is implemented by" and updated["is_active"] is False

        assert client.delete(ws_url(f"work-item-relation-definitions/{created['id']}/")).status_code == 204
        listed = sdk(PAGE, client.get(ws_url("work-item-relation-definitions/")).data)["results"]
        assert [d["name"] for d in listed] == ["Relates to", "Duplicate"]

    def test_filters(self, client, ws_url, workspace, sdk):
        WorkItemRelationDefinition.objects.create(workspace=workspace, name="A", is_default=True)
        WorkItemRelationDefinition.objects.create(workspace=workspace, name="B", is_active=False)
        res = client.get(ws_url("work-item-relation-definitions/?is_default=true&per_page=100"))
        assert [d["name"] for d in sdk(PAGE, res.data)["results"]] == ["Relates to", "Duplicate", "A"]
        res = client.get(ws_url("work-item-relation-definitions/?is_active=false"))
        assert [d["name"] for d in sdk(PAGE, res.data)["results"]] == ["B"]
        assert client.get(ws_url("work-item-relation-definitions/?is_active=maybe")).status_code == 400

    def test_builtins_are_listed_with_stable_ids(self, client, ws_url, workspace, sdk):
        """relates_to and duplicate are not rows, so they were missing from the list,
        and the relation endpoint needs a definition id and label to create one."""
        from plane.nexus.views.work_item import BUILTIN_RELATION_DEFINITIONS

        page = sdk(PAGE, client.get(ws_url("work-item-relation-definitions/")).data)
        builtins = [d for d in page["results"] if d.get("is_built_in")]
        assert [(d["id"], d["outward"]) for d in builtins] == [
            (BUILTIN_RELATION_DEFINITIONS[key]["id"], key) for key in ("relates_to", "duplicate")
        ]
        assert page["total_count"] == 2
        # Only on the first page, so paging through never repeats them.
        second = client.get(ws_url("work-item-relation-definitions/?per_page=1&cursor=1:1:0")).data
        assert not any(d.get("is_built_in") for d in second["results"])
        # Not rows: the detail routes do not serve them.
        assert client.get(ws_url(f"work-item-relation-definitions/{builtins[0]['id']}/")).status_code == 404

    def test_validation_and_duplicates(self, client, ws_url):
        assert client.post(ws_url("work-item-relation-definitions/"), {}, format="json").status_code == 400
        assert (
            client.post(
                ws_url("work-item-relation-definitions/"), {"name": "X", "is_active": "yes"}, format="json"
            ).status_code
            == 400
        )
        assert client.post(ws_url("work-item-relation-definitions/"), {"name": "Dup"}, format="json").status_code == 201
        assert client.post(ws_url("work-item-relation-definitions/"), {"name": "Dup"}, format="json").status_code == 409

    def test_foreign_definition_is_404(self, client, ws_url):
        owner = User.objects.create(email=f"{uuid4().hex[:8]}@x.com", username=uuid4().hex[:12])
        other = Workspace.objects.create(name="Elsewhere", slug=f"else-{uuid4().hex[:6]}", owner=owner)
        foreign = WorkItemRelationDefinition.objects.create(workspace=other, name="Foreign")
        assert (
            client.patch(
                ws_url(f"work-item-relation-definitions/{foreign.id}/"), {"name": "x"}, format="json"
            ).status_code
            == 404
        )
        assert client.delete(ws_url(f"work-item-relation-definitions/{foreign.id}/")).status_code == 404

    def test_permissions(self, member_client, guest_client, outsider_client, ws_url, workspace):
        definition = WorkItemRelationDefinition.objects.create(workspace=workspace, name="D")
        assert guest_client.get(ws_url("work-item-relation-definitions/")).status_code == 200
        assert (
            member_client.post(ws_url("work-item-relation-definitions/"), {"name": "X"}, format="json").status_code
            == 403
        )
        assert member_client.delete(ws_url(f"work-item-relation-definitions/{definition.id}/")).status_code == 403
        assert outsider_client.get(ws_url("work-item-relation-definitions/")).status_code == 403
