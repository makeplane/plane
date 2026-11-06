# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Work item dependencies (.../dependencies/) and relations (.../work-item-relations/)."""

from uuid import uuid4

import pytest

from plane.db.models import IssueRelation, User, Workspace
from plane.nexus.models import WorkItemCustomRelation, WorkItemRelationDefinition
from plane.nexus.views import work_item as work_item_views

from .test_work_item_support import GUEST, make_issue, make_project

DEPS = "plane.models.work_items.WorkItemDependencyResponse"
ITEM = "plane.models.work_items.WorkItemWithRelationType"


@pytest.fixture
def pair(project):
    return make_issue(project, "X"), make_issue(project, "T")


def dep_url(project_url, issue, related=None):
    return project_url(f"work-items/{issue.id}/dependencies/" + (f"{related.id}/" if related else ""))


def rel_url(project_url, issue, related=None):
    return project_url(f"work-items/{issue.id}/work-item-relations/" + (f"{related.id}/" if related else ""))


def ids(items):
    return [item["id"] for item in items]


@pytest.mark.contract
class TestDependencies:
    def test_create_list_from_both_sides_and_delete(self, client, project_url, pair, sdk):
        x, t = pair
        res = client.post(
            dep_url(project_url, x), {"relation_type": "blocked_by", "work_item_ids": [str(t.id)]}, format="json"
        )
        assert res.status_code == 201, res.data
        for item in res.data:
            sdk(ITEM, item)
        assert res.data[0]["id"] == str(t.id) and res.data[0]["relation_type"] == "blocked_by"
        stored = IssueRelation.objects.get(issue=x, related_issue=t)
        assert stored.relation_type == "blocked_by"

        mine = sdk(DEPS, client.get(dep_url(project_url, x)).data)
        assert ids(mine["blocked_by"]) == [str(t.id)] and mine["blocking"] == []
        theirs = sdk(DEPS, client.get(dep_url(project_url, t)).data)
        assert ids(theirs["blocking"]) == [str(x.id)] and theirs["blocked_by"] == []
        assert theirs["blocking"][0]["relation_type"] == "blocking"

        assert client.delete(dep_url(project_url, t, x)).status_code == 204
        assert client.get(dep_url(project_url, x)).data["blocked_by"] == []
        assert client.delete(dep_url(project_url, x, t)).status_code == 404

    @pytest.mark.parametrize(
        "relation_type, stored_type, reversed_, inverse",
        [
            ("blocking", "blocked_by", True, "blocked_by"),
            ("start_before", "start_before", False, "start_after"),
            ("start_after", "start_before", True, "start_before"),
            ("finish_before", "finish_before", False, "finish_after"),
            ("finish_after", "finish_before", True, "finish_before"),
        ],
    )
    def test_inverse_semantics(self, client, project_url, pair, sdk, relation_type, stored_type, reversed_, inverse):
        x, t = pair
        res = client.post(
            dep_url(project_url, x), {"relation_type": relation_type, "work_item_ids": [str(t.id)]}, format="json"
        )
        assert res.status_code == 201
        row = IssueRelation.objects.get(relation_type=stored_type)
        assert (row.issue_id, row.related_issue_id) == ((t.id, x.id) if reversed_ else (x.id, t.id))
        assert ids(sdk(DEPS, client.get(dep_url(project_url, x)).data)[relation_type]) == [str(t.id)]
        assert ids(client.get(dep_url(project_url, t)).data[inverse]) == [str(x.id)]

    def test_a_new_dependency_replaces_the_old_one(self, client, project_url, pair):
        x, t = pair
        client.post(
            dep_url(project_url, x), {"relation_type": "blocked_by", "work_item_ids": [str(t.id)]}, format="json"
        )
        client.post(dep_url(project_url, x), {"relation_type": "blocking", "work_item_ids": [str(t.id)]}, format="json")
        body = client.get(dep_url(project_url, x)).data
        assert body["blocked_by"] == [] and ids(body["blocking"]) == [str(t.id)]
        assert IssueRelation.objects.count() == 1

    def test_several_targets_across_projects(self, client, project_url, workspace, project, create_user, pair):
        x, t = pair
        other = make_issue(make_project(workspace, create_user), "elsewhere")
        res = client.post(
            dep_url(project_url, x),
            {"relation_type": "blocked_by", "work_item_ids": [str(t.id), str(other.id)]},
            format="json",
        )
        assert res.status_code == 201 and set(ids(res.data)) == {str(t.id), str(other.id)}

    @pytest.mark.parametrize(
        "body, fragment",
        [
            ({"relation_type": "relates_to", "work_item_ids": ["<t>"]}, "relation_type must be one of"),
            ({"relation_type": "blocked_by", "work_item_ids": []}, "non-empty list"),
            ({"relation_type": "blocked_by", "work_item_ids": ["nope"]}, "not UUIDs: nope"),
            ({"relation_type": "blocked_by", "work_item_ids": ["<x>"]}, "itself"),
            ({"relation_type": "blocked_by", "work_item_ids": ["<foreign>"]}, "No work item with id"),
        ],
    )
    def test_validation(self, client, project_url, pair, body, fragment):
        x, t = pair
        owner = User.objects.create(email=f"{uuid4().hex[:8]}@x.com", username=uuid4().hex[:12])
        foreign = make_issue(
            make_project(Workspace.objects.create(name="E", slug=f"e-{uuid4().hex[:6]}", owner=owner), owner)
        )
        swap = {"<t>": str(t.id), "<x>": str(x.id), "<foreign>": str(foreign.id)}
        body = {**body, "work_item_ids": [swap.get(v, v) for v in body["work_item_ids"]]}
        res = client.post(dep_url(project_url, x), body, format="json")
        assert res.status_code == 400 and fragment in res.data["error"]

    def test_permissions_and_scope(
        self, make_user, workspace, project, project_url, pair, outsider_client, create_user
    ):
        x, t = pair
        IssueRelation.objects.create(issue=x, related_issue=t, relation_type="blocked_by", project=project)
        guest, guest_api = make_user(GUEST, workspace=workspace, project=project)
        assert guest_api.get(dep_url(project_url, x)).status_code == 404  # restricted guest, not their item
        own = make_issue(project, "guest's", creator=guest)
        assert guest_api.get(dep_url(project_url, own)).status_code == 200
        body = {"relation_type": "blocked_by", "work_item_ids": [str(t.id)]}
        assert guest_api.post(dep_url(project_url, own), body, format="json").status_code == 403
        assert outsider_client.get(dep_url(project_url, x)).status_code == 403
        sibling = make_issue(make_project(workspace, create_user), "sibling")
        assert outsider_client.get(dep_url(project_url, sibling)).status_code == 403

    def test_ids_elsewhere_are_404(self, client, project_url, workspace, create_user, pair):
        x, _ = pair
        sibling = make_issue(make_project(workspace, create_user), "sibling")
        assert client.get(dep_url(project_url, sibling)).status_code == 404
        assert client.delete(dep_url(project_url, x, sibling)).status_code == 404

    def test_hides_work_items_the_caller_cannot_see(self, client, project_url, workspace, pair):
        x, _ = pair
        stranger = User.objects.create(email=f"{uuid4().hex[:8]}@x.com", username=uuid4().hex[:12])
        hidden = make_issue(make_project(workspace, stranger), "hidden")
        IssueRelation.objects.create(issue=x, related_issue=hidden, relation_type="blocked_by", project=x.project)
        assert client.get(dep_url(project_url, x)).data["blocked_by"] == []


@pytest.mark.contract
class TestWorkItemRelations:
    def test_builtin_relates_to_and_duplicate(self, client, project_url, pair, sdk):
        x, t = pair
        body = {
            "relation_definition_type": "relates to",
            "relation_definition_id": str(uuid4()),
            "work_item_ids": [str(t.id)],
        }
        res = client.post(rel_url(project_url, x), body, format="json")
        assert res.status_code == 201, res.data
        assert sdk(ITEM, res.data[0])["relation_type"] == "relates_to"
        assert IssueRelation.objects.get(issue=x, related_issue=t).relation_type == "relates_to"
        listed = client.get(rel_url(project_url, t)).data
        assert set(listed) >= {"relates_to", "duplicate"}
        for item in listed["relates_to"]:
            sdk(ITEM, item)
        assert ids(listed["relates_to"]) == [str(x.id)]
        # Switching the pair to duplicate replaces relates_to.
        body["relation_definition_type"] = "duplicate"
        assert (
            client.post(rel_url(project_url, t), {**body, "work_item_ids": [str(x.id)]}, format="json").status_code
            == 201
        )
        listed = client.get(rel_url(project_url, x)).data
        assert listed["relates_to"] == [] and ids(listed["duplicate"]) == [str(t.id)]
        assert client.delete(rel_url(project_url, x, t)).status_code == 204
        assert client.get(rel_url(project_url, x)).data["duplicate"] == []
        assert client.delete(rel_url(project_url, x, t)).status_code == 404

    def test_relations_and_dependencies_are_independent(self, client, project_url, pair):
        x, t = pair
        client.post(
            dep_url(project_url, x), {"relation_type": "blocked_by", "work_item_ids": [str(t.id)]}, format="json"
        )
        client.post(
            rel_url(project_url, t),
            {"relation_definition_type": "relates_to", "work_item_ids": [str(x.id)]},
            format="json",
        )
        assert ids(client.get(dep_url(project_url, x)).data["blocked_by"]) == [str(t.id)]
        assert ids(client.get(rel_url(project_url, x)).data["relates_to"]) == [str(t.id)]
        assert client.delete(rel_url(project_url, x, t)).status_code == 204
        assert ids(client.get(dep_url(project_url, x)).data["blocked_by"]) == [str(t.id)]

    def test_workspace_definition(self, client, project_url, workspace, pair, sdk):
        x, t = pair
        definition = WorkItemRelationDefinition.objects.create(
            workspace=workspace, name="Implements", outward="implements", inward="implemented by"
        )
        body = {
            "relation_definition_id": str(definition.id),
            "relation_definition_type": "Implemented By",
            "work_item_ids": [str(t.id)],
        }
        res = client.post(rel_url(project_url, x), body, format="json")
        assert res.status_code == 201, res.data
        assert sdk(ITEM, res.data[0])["relation_type"] == "implemented by"
        row = WorkItemCustomRelation.objects.get()
        assert (row.issue_id, row.related_issue_id) == (t.id, x.id)
        mine, theirs = client.get(rel_url(project_url, x)).data, client.get(rel_url(project_url, t)).data
        assert ids(mine["implemented by"]) == [str(t.id)] and mine["implements"] == []
        assert ids(theirs["implements"]) == [str(x.id)]
        for item in theirs["implements"]:
            sdk(ITEM, item)
        assert IssueRelation.objects.count() == 0
        assert client.delete(rel_url(project_url, t, x)).status_code == 204
        assert client.get(rel_url(project_url, x)).data["implemented by"] == []

    def test_definition_validation(self, client, project_url, workspace, pair):
        x, t = pair
        definition = WorkItemRelationDefinition.objects.create(
            workspace=workspace, name="Implements", outward="implements", inward="implemented by"
        )
        base = {"relation_definition_id": str(definition.id), "work_item_ids": [str(t.id)]}
        res = client.post(rel_url(project_url, x), {**base, "relation_definition_type": "causes"}, format="json")
        assert res.status_code == 400 and "'implements'" in res.data["error"]
        res = client.post(
            rel_url(project_url, x),
            {**base, "relation_definition_id": str(uuid4()), "relation_definition_type": "causes"},
            format="json",
        )
        assert res.status_code == 404
        res = client.post(
            rel_url(project_url, x), {"relation_definition_type": "causes", "work_item_ids": [str(t.id)]}, format="json"
        )
        assert res.status_code == 400 and "list_definitions" in res.data["error"]
        definition.is_active = False
        definition.save()
        res = client.post(rel_url(project_url, x), {**base, "relation_definition_type": "implements"}, format="json")
        assert res.status_code == 400 and "inactive" in res.data["error"]
        assert "implements" not in client.get(rel_url(project_url, x)).data

    def test_permissions(self, make_user, workspace, project, project_url, pair, outsider_client):
        x, t = pair
        _, guest_api = make_user(GUEST, workspace=workspace, project=project)
        project.guest_view_all_features = True
        project.save()
        assert guest_api.get(rel_url(project_url, x)).status_code == 200
        body = {"relation_definition_type": "relates_to", "work_item_ids": [str(t.id)]}
        assert guest_api.post(rel_url(project_url, x), body, format="json").status_code == 403
        assert outsider_client.get(rel_url(project_url, x)).status_code == 403


@pytest.mark.contract
class TestRelationSafety:
    def test_a_dependency_does_not_silently_replace_a_relation(self, client, project_url, pair):
        x, t = pair
        IssueRelation.objects.create(issue=x, related_issue=t, relation_type="duplicate", project=x.project)
        body = {"relation_type": "blocked_by", "work_item_ids": [str(t.id)]}
        res = client.post(dep_url(project_url, x), body, format="json")
        assert res.status_code == 409 and res.data["code"] == "RELATION_EXISTS" and "duplicate" in res.data["error"]
        assert IssueRelation.objects.get(issue=x, related_issue=t).relation_type == "duplicate"
        # "x blocking t" is stored the other way round, (t, x), so it can sit beside the duplicate.
        body["relation_type"] = "blocking"
        assert client.post(dep_url(project_url, x), body, format="json").status_code == 201

    def test_a_relation_does_not_silently_replace_a_dependency(self, client, project_url, pair):
        x, t = pair
        body = {"relation_type": "blocked_by", "work_item_ids": [str(t.id)]}
        assert client.post(dep_url(project_url, x), body, format="json").status_code == 201
        body = {"relation_definition_type": "duplicate", "work_item_ids": [str(t.id)]}
        res = client.post(rel_url(project_url, x), body, format="json")
        assert res.status_code == 409 and "blocked_by" in res.data["error"]
        assert ids(client.get(dep_url(project_url, x)).data["blocked_by"]) == [str(t.id)]

    def test_replaced_and_repeated_dependencies_are_logged_once(self, client, project_url, pair, monkeypatch):
        x, t = pair
        logged = []
        monkeypatch.setattr(work_item_views, "_activity", lambda request, kind, *args, **kw: logged.append(kind))
        for relation_type in ("blocked_by", "blocking", "blocking"):
            body = {"relation_type": relation_type, "work_item_ids": [str(t.id)]}
            assert client.post(dep_url(project_url, x), body, format="json").status_code == 201
        assert logged == [
            "issue_relation.activity.created",
            "issue_relation.activity.deleted",
            "issue_relation.activity.created",
        ]
        assert IssueRelation.objects.count() == 1

    def test_work_items_the_caller_cannot_see_cannot_be_linked(self, client, project_url, workspace, pair):
        x, _ = pair
        stranger = User.objects.create(email=f"{uuid4().hex[:8]}@x.com", username=uuid4().hex[:12])
        hidden = make_issue(make_project(workspace, stranger), "hidden")
        attempts = [
            (dep_url(project_url, x), {"relation_type": "blocked_by", "work_item_ids": [str(hidden.id)]}),
            (rel_url(project_url, x), {"relation_definition_type": "relates_to", "work_item_ids": [str(hidden.id)]}),
        ]
        for url, body in attempts:
            res = client.post(url, body, format="json")
            assert res.status_code == 400 and "No work item with id" in res.data["error"]
            assert "hidden" not in str(res.data)
        assert not IssueRelation.objects.filter(related_issue=hidden).exists()


@pytest.mark.contract
class TestRelationDelete:
    """DELETE .../work-item-relations/<related>/ removed every relation the pair shared."""

    @pytest.fixture
    def linked(self, client, project_url, workspace, pair):
        x, t = pair
        definition = WorkItemRelationDefinition.objects.create(
            workspace=workspace, name="Implements", outward="implements", inward="implemented by"
        )
        for body in (
            {"relation_definition_type": "relates_to", "relation_definition_id": str(uuid4())},
            {"relation_definition_type": "implements", "relation_definition_id": str(definition.id)},
        ):
            res = client.post(rel_url(project_url, x), {**body, "work_item_ids": [str(t.id)]}, format="json")
            assert res.status_code == 201, res.data
        return x, t, definition

    def test_more_than_one_relation_is_refused_with_the_list(self, client, project_url, linked):
        x, t, definition = linked
        res = client.delete(rel_url(project_url, x, t))
        assert res.status_code == 409 and res.data["code"] == "AMBIGUOUS_RELATION"
        builtin_id = work_item_views.BUILTIN_RELATION_DEFINITIONS["relates_to"]["id"]
        assert builtin_id in res.data["error"] and str(definition.id) in res.data["error"]
        assert IssueRelation.objects.filter(issue=x, related_issue=t).exists()
        assert WorkItemCustomRelation.objects.filter(issue=x, related_issue=t).exists()

    def test_the_named_relation_alone_is_removed(self, client, project_url, linked):
        x, t, definition = linked
        res = client.delete(rel_url(project_url, x, t) + f"?relation_definition_id={definition.id}")
        assert res.status_code == 204
        assert not WorkItemCustomRelation.objects.filter(issue=x, related_issue=t).exists()
        assert IssueRelation.objects.filter(issue=x, related_issue=t, relation_type="relates_to").exists()
        # One left, so no id is needed now.
        assert client.delete(rel_url(project_url, t, x)).status_code == 204
        assert not IssueRelation.objects.filter(issue=x, related_issue=t).exists()

    def test_a_builtin_is_named_by_its_listed_id(self, client, project_url, linked):
        x, t, _ = linked
        builtin_id = work_item_views.BUILTIN_RELATION_DEFINITIONS["relates_to"]["id"]
        assert client.delete(rel_url(project_url, x, t) + f"?relation_definition_id={builtin_id}").status_code == 204
        assert not IssueRelation.objects.filter(issue=x, related_issue=t).exists()
        assert WorkItemCustomRelation.objects.filter(issue=x, related_issue=t).exists()

    def test_bad_or_unmatched_id(self, client, project_url, linked):
        x, t, _ = linked
        assert client.delete(rel_url(project_url, x, t) + "?relation_definition_id=nope").status_code == 400
        assert client.delete(rel_url(project_url, x, t) + f"?relation_definition_id={uuid4()}").status_code == 404

    def test_relations_to_hidden_items_cannot_be_deleted(self, client, project_url, workspace, pair):
        x, _ = pair
        stranger = User.objects.create(email=f"{uuid4().hex[:8]}@x.com", username=uuid4().hex[:12])
        hidden = make_issue(make_project(workspace, stranger), "hidden")
        IssueRelation.objects.create(issue=x, related_issue=hidden, relation_type="relates_to", project=x.project)
        IssueRelation.objects.create(issue=hidden, related_issue=x, relation_type="blocked_by", project=x.project)
        assert client.delete(rel_url(project_url, x, hidden)).status_code == 404
        assert client.delete(dep_url(project_url, x, hidden)).status_code == 404
        assert IssueRelation.objects.filter(related_issue=hidden).exists()
        assert IssueRelation.objects.filter(issue=hidden).exists()
