# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from uuid import uuid4

import pytest

from plane.db.models import Issue, IssueType, User, Workspace
from plane.db.models.issue_type import ProjectIssueType
from plane.nexus.models import WorkItemProperty, WorkItemPropertyOption, WorkItemTypeProperty

PROPERTY = "plane.models.work_item_properties.WorkItemProperty"
OPTION = "plane.models.work_item_properties.WorkItemPropertyOption"
VALUE = "plane.models.work_item_properties.WorkItemPropertyValueDetail"


@pytest.fixture
def bug(workspace, project):
    issue_type = IssueType.objects.create(workspace=workspace, name="Bug")
    ProjectIssueType.objects.create(issue_type=issue_type, project=project)
    return issue_type


def _prop(workspace, display_name, property_type, **extra):
    return WorkItemProperty.objects.create(
        workspace=workspace, display_name=display_name, property_type=property_type, **extra
    )


@pytest.fixture
def severity(workspace, bug):
    prop = _prop(workspace, "Severity", "OPTION")
    for name in ("Low", "High"):
        WorkItemPropertyOption.objects.create(workspace=workspace, property=prop, name=name)
    WorkItemTypeProperty.objects.create(workspace=workspace, issue_type=bug, property=prop)
    return prop


@pytest.fixture
def issue(workspace, project):
    return Issue.objects.create(name="Crash", project=project, workspace=workspace)


@pytest.fixture
def foreign(db):
    owner = User.objects.create(email=f"{uuid4().hex[:8]}@x.com", username=uuid4().hex[:12])
    other = Workspace.objects.create(name="Elsewhere", slug=f"else-{uuid4().hex[:6]}", owner=owner)
    prop = _prop(other, "Foreign", "OPTION")
    option = WorkItemPropertyOption.objects.create(workspace=other, property=prop, name="X")
    issue_type = IssueType.objects.create(workspace=other, name="Foreign")
    return prop, option, issue_type


@pytest.mark.contract
class TestWorkspaceProperties:
    def test_crud(self, client, ws_url, sdk):
        body = {"display_name": "Notes", "property_type": "TEXT", "settings": {"display_format": "multi-line"}}
        res = client.post(ws_url("work-item-properties/"), body, format="json")
        assert res.status_code == 201, res.data
        created = sdk(PROPERTY, res.data)
        assert created["settings"] == {"display_format": "multi-line"} and created["options"] is None

        res = client.get(ws_url("work-item-properties/"))
        assert res.status_code == 200 and [sdk(PROPERTY, p)["display_name"] for p in res.data] == ["Notes"]
        res = client.get(ws_url(f"work-item-properties/{created['id']}/"))
        assert res.status_code == 200 and sdk(PROPERTY, res.data)["id"] == created["id"]

        res = client.patch(
            ws_url(f"work-item-properties/{created['id']}/"), {"description": "Free text"}, format="json"
        )
        assert res.status_code == 200 and sdk(PROPERTY, res.data)["description"] == "Free text"
        res = client.patch(ws_url(f"work-item-properties/{created['id']}/"), {}, format="json")
        assert res.status_code == 200

        assert client.delete(ws_url(f"work-item-properties/{created['id']}/")).status_code == 204
        assert client.get(ws_url(f"work-item-properties/{created['id']}/")).status_code == 404

    def test_create_with_options_and_relation(self, client, ws_url, sdk):
        body = {
            "display_name": "Priority level",
            "property_type": "OPTION",
            "is_multi": True,
            "options": [{"name": "P1", "is_default": True}, {"name": "P2"}],
        }
        res = client.post(ws_url("work-item-properties/"), body, format="json")
        assert res.status_code == 201, res.data
        assert [o["name"] for o in sdk(PROPERTY, res.data)["options"]] == ["P1", "P2"]
        body = {"display_name": "Spec", "property_type": "RELATION", "relation_type": "RICH_TEXT"}
        res = client.post(ws_url("work-item-properties/"), body, format="json")
        assert res.status_code == 201 and sdk(PROPERTY, res.data)["relation_type"] == "RICH_TEXT"

    @pytest.mark.parametrize(
        "body",
        [
            {"property_type": "TEXT"},
            {"display_name": "A", "property_type": "NOPE"},
            {"display_name": "A", "property_type": "RELATION"},
            {"display_name": "A", "property_type": "TEXT", "settings": {"display_format": "huge"}},
            {"display_name": "A", "property_type": "BOOLEAN", "is_multi": True},
            {"display_name": "A", "property_type": "TEXT", "options": [{"name": "x"}]},
        ],
    )
    def test_validation(self, client, ws_url, body):
        assert client.post(ws_url("work-item-properties/"), body, format="json").status_code == 400

    def test_duplicate_display_name(self, client, ws_url, severity):
        res = client.post(
            ws_url("work-item-properties/"), {"display_name": "Severity", "property_type": "BOOLEAN"}, format="json"
        )
        assert res.status_code == 409

    def test_foreign_property_is_404(self, client, ws_url, foreign):
        prop, option, _ = foreign
        assert client.get(ws_url(f"work-item-properties/{prop.id}/")).status_code == 404
        assert client.patch(ws_url(f"work-item-properties/{prop.id}/"), {}, format="json").status_code == 404
        assert client.delete(ws_url(f"work-item-properties/{prop.id}/")).status_code == 404
        assert client.get(ws_url(f"work-item-properties/{prop.id}/options/")).status_code == 404
        assert client.get(ws_url(f"work-item-properties/{prop.id}/options/{option.id}/")).status_code == 404

    def test_permissions(self, member_client, guest_client, outsider_client, ws_url, severity):
        assert guest_client.get(ws_url("work-item-properties/")).status_code == 200
        body = {"display_name": "X", "property_type": "BOOLEAN"}
        assert member_client.post(ws_url("work-item-properties/"), body, format="json").status_code == 403
        assert member_client.delete(ws_url(f"work-item-properties/{severity.id}/")).status_code == 403
        assert (
            member_client.post(
                ws_url(f"work-item-properties/{severity.id}/options/"), {"name": "Z"}, format="json"
            ).status_code
            == 403
        )
        assert outsider_client.get(ws_url("work-item-properties/")).status_code == 403


@pytest.mark.contract
class TestOptions:
    def test_workspace_option_crud(self, client, ws_url, severity, sdk):
        base = f"work-item-properties/{severity.id}/options/"
        res = client.get(ws_url(base))
        assert res.status_code == 200 and [sdk(OPTION, o)["name"] for o in res.data] == ["Low", "High"]
        res = client.post(ws_url(base), {"name": "Critical", "is_default": True}, format="json")
        assert res.status_code == 201, res.data
        option = sdk(OPTION, res.data)
        assert option["property"] == str(severity.id)
        assert client.post(ws_url(base), {"name": "Critical"}, format="json").status_code == 409
        res = client.get(ws_url(f"{base}{option['id']}/"))
        assert res.status_code == 200 and sdk(OPTION, res.data)["is_default"] is True
        res = client.patch(ws_url(f"{base}{option['id']}/"), {"name": "Blocker"}, format="json")
        assert res.status_code == 200 and sdk(OPTION, res.data)["name"] == "Blocker"
        assert client.delete(ws_url(f"{base}{option['id']}/")).status_code == 204
        assert client.get(ws_url(f"{base}{option['id']}/")).status_code == 404

    def test_options_only_on_option_properties(self, client, ws_url, workspace):
        prop = _prop(workspace, "Flag", "BOOLEAN")
        assert (
            client.post(ws_url(f"work-item-properties/{prop.id}/options/"), {"name": "x"}, format="json").status_code
            == 400
        )

    def test_project_option_paths(self, client, project_url, severity, sdk):
        base = f"work-item-properties/{severity.id}/options/"
        res = client.get(project_url(base))
        assert res.status_code == 200 and len([sdk(OPTION, o) for o in res.data]) == 2
        option = severity.options.first()
        res = client.get(project_url(f"{base}{option.id}/"))
        assert res.status_code == 200 and sdk(OPTION, res.data)["id"] == str(option.id)
        res = client.post(project_url(base), {"name": "New"}, format="json")
        assert res.status_code == 400 and res.data["code"] == "workspace_managed"
        assert client.delete(project_url(f"{base}{option.id}/")).status_code == 204
        assert severity.options.count() == 1

    def test_project_option_permissions(self, member_client, guest_client, project_url, severity, foreign, client):
        base = f"work-item-properties/{severity.id}/options/"
        option = severity.options.first()
        assert guest_client.get(project_url(base)).status_code == 200
        assert member_client.delete(project_url(f"{base}{option.id}/")).status_code == 403
        foreign_prop, foreign_option, _ = foreign
        assert client.get(project_url(f"work-item-properties/{foreign_prop.id}/options/")).status_code == 404
        res = client.get(project_url(f"work-item-properties/{foreign_prop.id}/options/{foreign_option.id}/"))
        assert res.status_code == 404


@pytest.mark.contract
class TestTypePropertyLinks:
    def test_workspace_attach_list_detach(self, client, ws_url, bug, workspace):
        prop = _prop(workspace, "Due", "DATETIME", settings={"display_format": "MMM dd, yyyy"})
        res = client.post(
            ws_url(f"work-item-types/{bug.id}/properties/"), {"properties": [str(prop.id)]}, format="json"
        )
        assert res.status_code == 200 and res.data["properties"] == [str(prop.id)]
        res = client.get(ws_url(f"work-item-types/{bug.id}/properties/"))
        assert res.status_code == 200 and res.data == [str(prop.id)]
        assert client.delete(ws_url(f"work-item-types/{bug.id}/properties/{prop.id}/")).status_code == 204
        assert client.get(ws_url(f"work-item-types/{bug.id}/properties/")).data == []
        assert client.delete(ws_url(f"work-item-types/{bug.id}/properties/{prop.id}/")).status_code == 404
        # Detaching never deletes the property.
        assert WorkItemProperty.objects.filter(pk=prop.pk).exists()

    def test_attach_rejects_foreign_ids(self, client, ws_url, bug, foreign):
        foreign_prop, _, foreign_type = foreign
        res = client.post(
            ws_url(f"work-item-types/{bug.id}/properties/"), {"properties": [str(foreign_prop.id)]}, format="json"
        )
        assert res.status_code == 400
        res = client.post(
            ws_url(f"work-item-types/{foreign_type.id}/properties/"), {"properties": [str(uuid4())]}, format="json"
        )
        assert res.status_code == 404

    def test_project_attach_detach(self, client, project_url, bug, workspace):
        prop = _prop(workspace, "Score", "DECIMAL")
        url = project_url(f"work-item-types/{bug.id}/properties/")
        res = client.post(url, {"properties": [str(prop.id)]}, format="json")
        assert res.status_code == 200 and res.data["properties"] == [str(prop.id)]
        assert client.delete(project_url(f"work-item-types/{bug.id}/properties/{prop.id}/")).status_code == 204

    def test_project_attach_needs_imported_type_and_admin(
        self, client, member_client, project_url, workspace, severity, bug
    ):
        loose = IssueType.objects.create(workspace=workspace, name="Loose")
        res = client.post(
            project_url(f"work-item-types/{loose.id}/properties/"), {"properties": [str(severity.id)]}, format="json"
        )
        assert res.status_code == 404
        res = member_client.post(
            project_url(f"work-item-types/{bug.id}/properties/"), {"properties": [str(severity.id)]}, format="json"
        )
        assert res.status_code == 403
        assert (
            member_client.delete(project_url(f"work-item-types/{bug.id}/properties/{severity.id}/")).status_code == 403
        )

    def test_workspace_link_permissions(self, member_client, ws_url, bug, severity):
        assert member_client.get(ws_url(f"work-item-types/{bug.id}/properties/")).status_code == 200
        body = {"properties": [str(severity.id)]}
        assert (
            member_client.post(ws_url(f"work-item-types/{bug.id}/properties/"), body, format="json").status_code == 403
        )


@pytest.mark.contract
class TestProjectPropertyLists:
    def test_type_scoped_list_and_retrieve(self, client, project_url, bug, severity, workspace, sdk):
        _prop(workspace, "Unattached", "BOOLEAN")
        res = client.get(project_url(f"work-item-types/{bug.id}/work-item-properties/?per_page=3"))
        assert res.status_code == 200
        props = [sdk(PROPERTY, p) for p in res.data]
        assert [p["display_name"] for p in props] == ["Severity"] and props[0]["issue_type"] == str(bug.id)
        assert [o["name"] for o in props[0]["options"]] == ["Low", "High"]
        res = client.get(project_url(f"work-item-types/{bug.id}/work-item-properties/{severity.id}/"))
        assert res.status_code == 200 and sdk(PROPERTY, res.data)["id"] == str(severity.id)

    def test_project_flat_list(self, client, project_url, severity, sdk):
        res = client.get(project_url("work-item-properties/"))
        assert res.status_code == 200 and [sdk(PROPERTY, p)["id"] for p in res.data] == [str(severity.id)]
        res = client.get(project_url(f"work-item-properties/{severity.id}/"))
        assert res.status_code == 200 and sdk(PROPERTY, res.data)["display_name"] == "Severity"

    def test_project_property_writes_are_workspace_managed(self, client, project_url, bug, severity):
        body = {"display_name": "Local", "property_type": "BOOLEAN"}
        for url in (
            project_url("work-item-properties/"),
            project_url(f"work-item-types/{bug.id}/work-item-properties/"),
        ):
            res = client.post(url, body, format="json")
            assert res.status_code == 400 and res.data["code"] == "workspace_managed"
        res = client.patch(project_url(f"work-item-properties/{severity.id}/"), {}, format="json")
        assert res.data["code"] == "workspace_managed"

    def test_type_not_in_project_is_404(self, client, project_url, workspace, foreign):
        loose = IssueType.objects.create(workspace=workspace, name="Loose")
        assert client.get(project_url(f"work-item-types/{loose.id}/work-item-properties/")).status_code == 404
        _, _, foreign_type = foreign
        assert client.get(project_url(f"work-item-types/{foreign_type.id}/work-item-properties/")).status_code == 404

    def test_permissions(self, guest_client, outsider_client, project_url, bug):
        assert guest_client.get(project_url(f"work-item-types/{bug.id}/work-item-properties/")).status_code == 200
        assert outsider_client.get(project_url("work-item-properties/")).status_code == 403


def _values_url(project_url, issue, prop):
    return project_url(f"work-items/{issue.id}/work-item-properties/{prop.id}/values/")


@pytest.mark.contract
class TestValues:
    @pytest.mark.parametrize(
        "property_type,settings,value",
        [
            ("TEXT", {"display_format": "single-line"}, "007"),
            ("URL", {}, "https://example.com/a"),
            ("EMAIL", {}, "a@example.com"),
            ("FILE", {}, "report.pdf"),
            ("DATETIME", {"display_format": "MMM dd, yyyy"}, "2026-11-05"),
            ("DATETIME", {"display_format": "MMM dd, yyyy"}, "2026-11-05 14:30:00"),
            ("DECIMAL", {}, 7),
            ("DECIMAL", {}, 2.5),
            ("BOOLEAN", {}, False),
        ],
    )
    def test_scalar_round_trip(self, client, project_url, workspace, issue, sdk, property_type, settings, value):
        prop = _prop(workspace, f"P {property_type}", property_type, settings=settings)
        url = _values_url(project_url, issue, prop)
        assert client.get(url).status_code == 404
        res = client.post(url, {"value": value}, format="json")
        assert res.status_code == 200, res.data
        assert sdk(VALUE, res.data)["value"] == value and type(res.data["value"]) is type(
            value if property_type != "DECIMAL" else 1.0
        )
        res = client.get(url)
        assert res.status_code == 200 and sdk(VALUE, res.data)["value"] == value
        # Upsert: one value per work item for a single-value property.
        first_id = res.data["id"]
        assert client.post(url, {"value": value}, format="json").data["id"] == first_id
        assert client.delete(url).status_code == 204
        assert client.get(url).status_code == 404

    @pytest.mark.parametrize(
        "property_type,value",
        [
            ("TEXT", 7),
            ("DECIMAL", "7"),
            ("DECIMAL", True),
            ("BOOLEAN", "true"),
            ("DATETIME", "05/11/2026"),
            ("URL", "not a url"),
            ("EMAIL", "nope"),
            ("TEXT", ["a", "b"]),
        ],
    )
    def test_wrong_type_is_rejected(self, client, project_url, workspace, issue, property_type, value):
        prop = _prop(workspace, f"P {property_type}", property_type)
        assert client.post(_values_url(project_url, issue, prop), {"value": value}, format="json").status_code == 400

    def test_option_single_and_multi(self, client, project_url, workspace, issue, severity, sdk):
        low, high = severity.options.order_by("created_at")
        url = _values_url(project_url, issue, severity)
        res = client.post(url, {"value": str(low.id)}, format="json")
        assert res.status_code == 200 and sdk(VALUE, res.data)["value"] == str(low.id)
        assert client.post(url, {"value": str(uuid4())}, format="json").status_code == 400

        tags = _prop(workspace, "Tags", "OPTION", is_multi=True)
        a = WorkItemPropertyOption.objects.create(workspace=workspace, property=tags, name="a")
        b = WorkItemPropertyOption.objects.create(workspace=workspace, property=tags, name="b")
        url = _values_url(project_url, issue, tags)
        res = client.post(url, {"value": [str(a.id), str(b.id)]}, format="json")
        assert res.status_code == 200 and [sdk(VALUE, v)["value"] for v in res.data] == [str(a.id), str(b.id)]
        # A multi-value write replaces every value.
        res = client.post(url, {"value": str(b.id)}, format="json")
        assert [v["value"] for v in res.data] == [str(b.id)]
        assert [v["value"] for v in client.get(url).data] == [str(b.id)]

    def test_relation_values(self, client, project_url, workspace, project, issue, create_user, sdk):
        other = Issue.objects.create(name="Other", project=project, workspace=workspace)
        blocks = _prop(workspace, "Blocks", "RELATION", relation_type="ISSUE")
        res = client.post(_values_url(project_url, issue, blocks), {"value": str(other.id)}, format="json")
        assert res.status_code == 200 and sdk(VALUE, res.data)["value"] == str(other.id)
        assert (
            client.post(_values_url(project_url, issue, blocks), {"value": str(uuid4())}, format="json").status_code
            == 400
        )
        owner = _prop(workspace, "Owner", "RELATION", relation_type="USER")
        res = client.post(_values_url(project_url, issue, owner), {"value": str(create_user.id)}, format="json")
        assert res.status_code == 200 and sdk(VALUE, res.data)["value"] == str(create_user.id)

    def test_rich_text(self, client, project_url, workspace, issue, sdk):
        spec = _prop(workspace, "Spec", "RELATION", relation_type="RICH_TEXT")
        url = _values_url(project_url, issue, spec)
        res = client.post(url, {"value": "<p>Notes</p>"}, format="json")
        assert res.status_code == 400 and "Rich text value must be an object" in res.data["error"]
        res = client.post(url, {"value": {"description_html": "<p>Notes</p><script>x</script>"}}, format="json")
        assert res.status_code == 200, res.data
        value = sdk(VALUE, res.data)
        assert value["value_detail"]["description_html"] == "<p>Notes</p>"
        assert value["value_detail"]["description_stripped"] == "Notes" and value["value"] == value["id"]
        assert sdk(VALUE, client.get(url).data)["value_detail"]["description_html"] == "<p>Notes</p>"

    def test_patch_needs_existing_value(self, client, project_url, workspace, issue, sdk):
        flag = _prop(workspace, "Flag", "BOOLEAN")
        url = _values_url(project_url, issue, flag)
        assert client.patch(url, {"value": True}, format="json").status_code == 404
        client.post(url, {"value": True}, format="json")
        res = client.patch(url, {"value": False, "external_id": "x-1"}, format="json")
        assert res.status_code == 200 and sdk(VALUE, res.data)["value"] is False and res.data["external_id"] == "x-1"

    def test_foreign_ids_are_404(self, client, project_url, issue, foreign, severity, workspace, create_user):
        foreign_prop, _, _ = foreign
        assert client.get(_values_url(project_url, issue, foreign_prop)).status_code == 404
        owner = User.objects.create(email=f"{uuid4().hex[:8]}@x.com", username=uuid4().hex[:12])
        other_ws = Workspace.objects.create(name="W2", slug=f"w2-{uuid4().hex[:6]}", owner=owner)
        from plane.db.models import Project

        other_project = Project.objects.create(name="P2", identifier="P2", workspace=other_ws, created_by=owner)
        alien = Issue.objects.create(name="Alien", project=other_project, workspace=other_ws)
        assert client.post(_values_url(project_url, alien, severity), {"value": "x"}, format="json").status_code == 404

    def test_permissions(self, guest_client, member_client, outsider_client, client, project_url, issue, workspace):
        flag = _prop(workspace, "Flag", "BOOLEAN")
        url = _values_url(project_url, issue, flag)
        client.post(url, {"value": True}, format="json")
        assert guest_client.get(url).status_code == 200
        assert guest_client.post(url, {"value": False}, format="json").status_code == 403
        assert member_client.post(url, {"value": False}, format="json").status_code == 200
        assert outsider_client.get(url).status_code == 403
