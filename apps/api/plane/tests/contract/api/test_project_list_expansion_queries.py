# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Regression tests for the project list's user expansion loading plan."""

from contextlib import ExitStack, contextmanager
from unittest import mock
from uuid import uuid4

import pytest
from django.db import connections
from django.db.models import Prefetch
from django.utils import timezone
from rest_framework.test import APIRequestFactory

from plane.api.views.project import ProjectListCreateAPIEndpoint
from plane.db.models import FileAsset, Project, ProjectMember, User, Workspace


USER_FIELDS = ("created_by", "updated_by", "project_lead", "default_assignee")
AUDIT_FIELDS = ("created_by", "updated_by")
pytestmark = [pytest.mark.contract, pytest.mark.django_db(databases="__all__")]


@contextmanager
def capture_sql():
    """Capture statements on every alias, without opening unused connections."""
    queries = []

    def record(execute, sql, params, many, context):
        queries.append({"alias": context["connection"].alias, "sql": sql})
        return execute(sql, params, many, context)

    with ExitStack() as stack:
        for alias in connections:
            stack.enter_context(connections[alias].execute_wrapper(record))
        yield queries


def capture_list_plan(workspace, actor, params):
    """Use the actual GET handler, replacing only its pagination boundary.

    This is not an authentication test: HTTP tests below exercise that path.
    ORM query construction and serializer code are never mocked.
    """
    request = APIRequestFactory().get(f"/api/v1/workspaces/{workspace.slug}/projects/", params)
    request.user = actor
    view = ProjectListCreateAPIEndpoint()
    view.request = request
    view.kwargs = {"slug": workspace.slug}
    with mock.patch.object(view, "paginate", side_effect=lambda **kwargs: kwargs):
        with capture_sql() as queries:
            plan = view.get(request, workspace.slug)
    assert not queries, "Constructing the loading plan must remain lazy."
    return plan


@pytest.fixture
def make_expansion_project(db, workspace):
    """Make genuinely persisted users/assets; avoid fixture-populated FK caches.

    Explicit QuerySet.update is necessary: BaseModel.save auto-sets audit users
    and can otherwise leave created_by/updated_by null outside a request.
    File paths are strings, so no blob upload or live storage call is required.
    """

    def make(*, target_workspace=None, users=None, with_avatars=True, network=2):
        target_workspace = target_workspace or workspace
        token = uuid4().hex[:10]
        if users is None:
            users = {}
            for field in USER_FIELDS:
                user_token = uuid4().hex
                user = User.objects.create(
                    email=f"{user_token}@example.test",
                    username=f"expand-{user_token}",
                    first_name=field,
                    last_name=token,
                    display_name=f"{field}-{token}",
                    avatar=f"https://example.test/{user_token}.png",
                )
                if with_avatars:
                    asset = FileAsset.objects.create(
                        asset=f"test-avatars/{user_token}.png",
                        user=user,
                        entity_type=FileAsset.EntityTypeContext.USER_AVATAR,
                        is_uploaded=True,
                    )
                    User.objects.filter(pk=user.pk).update(avatar_asset_id=asset.pk)
                    user.refresh_from_db()
                users[field] = user
        project = Project.objects.create(
            workspace=target_workspace,
            name=f"Expansion {token}",
            identifier=f"E{token}",
            network=network,
            project_lead=users["project_lead"],
            default_assignee=users["default_assignee"],
        )
        Project.objects.filter(pk=project.pk).update(
            created_by_id=users["created_by"].pk,
            updated_by_id=users["updated_by"].pk,
        )
        project.refresh_from_db()
        return project, users

    return make


@pytest.mark.parametrize("size", [1, 12])
@pytest.mark.parametrize("expanded", [AUDIT_FIELDS, USER_FIELDS])
@pytest.mark.parametrize("with_avatars", [False, True])
def test_project_user_serialization_performs_no_sql(
    workspace, create_user, make_expansion_project, size, expanded, with_avatars
):
    """After loading a page, included user expansions must never fetch per row."""
    expected_users = {}
    for _ in range(size):
        project, users = make_expansion_project(with_avatars=with_avatars)
        expected_users[str(project.pk)] = {
            field: (
                str(users[field].pk),
                f"/api/assets/v2/static/{users[field].avatar_asset_id}/" if with_avatars else users[field].avatar,
            )
            for field in expanded
        }
    params = {"fields": "id,name," + ",".join(expanded), "expand": ",".join(expanded)}
    plan = capture_list_plan(workspace, create_user, params)
    with capture_sql() as load_queries:
        rows = list(plan["queryset"][:size])
    assert len(rows) == size
    assert load_queries, "The regression must exercise real ORM reads."
    with capture_sql() as serialization_queries:
        data = plan["on_results"](rows)
    assert not serialization_queries, serialization_queries
    assert len(data) == size
    assert {str(item["id"]) for item in data} == set(expected_users)
    for item in data:
        for field in expanded:
            expected_id, expected_avatar = expected_users[str(item["id"])][field]
            assert str(item[field]["id"]) == expected_id
            assert item[field]["avatar_url"] == expected_avatar


@pytest.mark.parametrize(
    ("params", "expected"),
    [
        ({}, ()),
        ({"expand": ""}, ()),
        ({"fields": "id,name", "expand": "created_by,updated_by"}, ()),
        ({"fields": "id,created_by", "expand": "created_by,updated_by"}, ("created_by",)),
        ({"fields": "", "expand": "updated_by"}, ("updated_by",)),
        ({"expand": "created_by,created_by,unknown,created_by__password"}, ("created_by",)),
        ({"expand": "project_lead"}, ("project_lead",)),
        ({"expand": "default_assignee"}, ("default_assignee",)),
        ({"expand": "unknown,created_by__password"}, ()),
        ({"expand": " created_by"}, ()),
        ({"fields": "id,name, created_by", "expand": "created_by"}, ()),
        ({"fields": "id,created_by", "expand": ",created_by,,"}, ("created_by",)),
    ],
)
def test_loading_plan_is_allowlisted_and_respects_sparse_fields(
    workspace, create_user, make_expansion_project, params, expected
):
    """Excluded expansions add neither fetches nor fields to a populated response."""
    _, users = make_expansion_project()
    plan = capture_list_plan(workspace, create_user, params)
    assert plan["queryset"].query.select_related == {"project_lead": {}}
    expected_prefetches = {"project_projectmember"} | {
        "project_lead__avatar_asset" if field == "project_lead" else field for field in expected
    }
    actual_prefetches = {
        lookup.prefetch_to if isinstance(lookup, Prefetch) else lookup
        for lookup in plan["queryset"]._prefetch_related_lookups
    }
    assert actual_prefetches == expected_prefetches
    rows = list(plan["queryset"])
    with capture_sql() as queries:
        result = plan["on_results"](rows)
    assert not queries, queries
    assert len(result) == 1
    if params.get("fields"):
        allowed = set(params["fields"].split(",")) & {"id", "name", *USER_FIELDS}
        assert set(result[0]) == allowed
    for field in USER_FIELDS:
        if field in expected:
            assert str(result[0][field]["id"]) == str(users[field].pk)
        elif field in result[0]:
            assert str(result[0][field]) == str(users[field].pk)


def test_null_and_inactive_audit_users_keep_the_existing_representation(workspace, create_user, make_expansion_project):
    """Optimization must not filter inactive audit users or drop null rows."""
    project, users = make_expansion_project()
    Project.objects.filter(pk=project.pk).update(updated_by_id=None)
    User.objects.filter(pk=users["created_by"].pk).update(is_active=False)
    plan = capture_list_plan(
        workspace, create_user, {"fields": "id,created_by,updated_by", "expand": "created_by,updated_by"}
    )
    rows = list(plan["queryset"])
    with capture_sql() as queries:
        result = plan["on_results"](rows)
    assert not queries, queries
    assert len(result) == 1
    assert str(result[0]["created_by"]["id"]) == str(users["created_by"].pk)
    assert result[0]["updated_by"] is None


@pytest.mark.parametrize("field", ["created_by", "project_lead"])
def test_soft_deleted_avatar_preserves_the_unoptimized_result(workspace, create_user, make_expansion_project, field):
    """Compare with forward-FK lookup semantics rather than inventing a policy."""
    project, users = make_expansion_project()
    FileAsset.objects.filter(pk=users[field].avatar_asset_id).update(deleted_at=timezone.now())
    params = {"fields": f"id,{field}", "expand": field}
    plan = capture_list_plan(workspace, create_user, params)
    legacy_plan = capture_list_plan(workspace, create_user, {"fields": params["fields"]})
    legacy_rows = list(legacy_plan["queryset"])
    expected = plan["on_results"](legacy_rows)
    rows = list(plan["queryset"])
    with capture_sql() as queries:
        actual = plan["on_results"](rows)
    assert not queries, queries
    assert actual == expected


@pytest.mark.parametrize("expanded", [AUDIT_FIELDS, USER_FIELDS], ids=["audit-users", "all-users"])
def test_http_user_expansion_uses_bounded_queries_as_page_grows(
    api_key_client, workspace, make_expansion_project, expanded
):
    """Real API-key requests cover routing, permissions, pagination and rendering."""
    for _ in range(12):
        make_expansion_project()
    url = f"/api/v1/workspaces/{workspace.slug}/projects/"
    counts = []
    for size in (1, 12):
        params = {"fields": "id,name," + ",".join(expanded), "order_by": "name", "per_page": size}
        per_variant = []
        for expand in (None, ",".join(expanded)):
            query = dict(params)
            if expand:
                query["expand"] = expand
            # Warm framework initialization; each following request still reads fresh projects.
            warm = api_key_client.get(url, query)
            assert warm.status_code == 200, warm.data
            with capture_sql() as statements:
                response = api_key_client.get(url, query)
                body = response.json()
            assert response.status_code == 200, body
            assert len(body["results"]) == size
            for item in body["results"]:
                for field in expanded:
                    assert isinstance(item[field], dict if expand else str)
            per_variant.append(len(statements))
        # One batch per populated user field, or just the already-joined lead's avatar.
        assert per_variant[1] == per_variant[0] + len(expanded), per_variant
        counts.append(per_variant[1])
    assert counts[0] == counts[1], counts


def test_http_expansion_does_not_change_project_visibility(
    api_key_client, workspace, create_user, make_expansion_project
):
    """Public, active-member, hidden-private and foreign-workspace cases."""
    public, _ = make_expansion_project()
    member_project, _ = make_expansion_project(network=0)
    ProjectMember.objects.create(project=member_project, member=create_user, role=15, is_active=True)
    hidden, _ = make_expansion_project(network=0)
    inactive_project, _ = make_expansion_project(network=0)
    ProjectMember.objects.create(project=inactive_project, member=create_user, role=15, is_active=False)
    other = Workspace.objects.create(name="Other expansion workspace", slug=f"other-{uuid4().hex}", owner=create_user)
    foreign, _ = make_expansion_project(target_workspace=other)
    url = f"/api/v1/workspaces/{workspace.slug}/projects/"
    for expand in (None, "created_by,updated_by"):
        params = {"fields": "id,created_by,updated_by", "per_page": 100}
        if expand:
            params["expand"] = expand
        response = api_key_client.get(url, params)
        assert response.status_code == 200, response.data
        ids = {str(row["id"]) for row in response.data["results"]}
        assert ids == {str(public.pk), str(member_project.pk)}
        assert ids.isdisjoint({str(hidden.pk), str(inactive_project.pk), str(foreign.pk)})


@pytest.mark.parametrize("same_user", [False, True], ids=["distinct-roles", "one-user-all-roles"])
def test_shared_users_and_duplicate_expands_match_legacy_payload(
    workspace, create_user, make_expansion_project, same_user
):
    """Many rows referencing the same users must keep identical output."""
    first_project, users = make_expansion_project()
    if same_user:
        users = dict.fromkeys(USER_FIELDS, users["created_by"])
        Project.objects.filter(pk=first_project.pk).update(**{f"{field}_id": users[field].pk for field in USER_FIELDS})
    for _ in range(3):
        make_expansion_project(users=users)
    params = {"expand": ",".join(USER_FIELDS) + ",created_by", "order_by": "name"}
    plan = capture_list_plan(workspace, create_user, params)
    legacy = capture_list_plan(workspace, create_user, {"order_by": "name"})["queryset"]
    expected = plan["on_results"](list(legacy))
    rows = list(plan["queryset"])
    with capture_sql() as queries:
        actual = plan["on_results"](rows)
    # Fixture has no cover-image assets, so the full response is query-free here.
    assert not queries, queries
    assert actual == expected
    assert len(actual) == 4
    for item in actual:
        for field in USER_FIELDS:
            assert str(item[field]["id"]) == str(users[field].pk)
            assert item[field]["avatar_url"] == f"/api/assets/v2/static/{users[field].avatar_asset_id}/"


@pytest.mark.parametrize("expanded", [AUDIT_FIELDS, USER_FIELDS], ids=["audit-users", "all-users"])
def test_http_null_user_expansions_add_no_queries(api_key_client, workspace, expanded):
    """A populated page with no user references needs no expansion fetches."""
    for index in range(12):
        project = Project.objects.create(
            workspace=workspace, name=f"Unassigned {index:02d}", identifier=f"N{index}", network=2
        )
        Project.objects.filter(pk=project.pk).update(**{f"{field}_id": None for field in USER_FIELDS})
    url = f"/api/v1/workspaces/{workspace.slug}/projects/"
    params = {"fields": "id,name," + ",".join(expanded), "order_by": "name", "per_page": 12}
    responses, query_counts = [], []
    for expand in (None, ",".join(expanded)):
        query = {**params, **({"expand": expand} if expand else {})}
        warm = api_key_client.get(url, query)
        assert warm.status_code == 200, warm.data
        with capture_sql() as statements:
            response = api_key_client.get(url, query)
            body = response.json()
        assert response.status_code == 200, body
        assert len(body["results"]) == 12
        assert all(item[field] is None for item in body["results"] for field in expanded)
        responses.append(body)
        query_counts.append(len(statements))
    assert responses[0] == responses[1]
    assert query_counts[0] == query_counts[1], query_counts


def test_empty_http_result_preserves_pagination_metadata(api_key_client, workspace):
    """Empty results must not need special-case eager-loading behavior."""
    url = f"/api/v1/workspaces/{workspace.slug}/projects/"
    baseline = api_key_client.get(url)
    expanded = api_key_client.get(url, {"expand": "created_by,updated_by"})
    assert baseline.status_code == expanded.status_code == 200
    assert expanded.json()["results"] == []
    assert expanded.json() == baseline.json()


def test_expansion_preserves_cursor_pages_and_metadata(api_key_client, workspace, make_expansion_project):
    """Do not switch this endpoint to page=N; retain its existing cursor contract."""
    expected_ids = {str(make_expansion_project()[0].pk) for _ in range(4)}
    seen = set()
    url = f"/api/v1/workspaces/{workspace.slug}/projects/"
    for offset in (0, 1):
        params = {
            "fields": "id,name,created_by,updated_by",
            "order_by": "name",
            "per_page": 2,
            "cursor": f"2:{offset}:0",
        }
        baseline = api_key_client.get(url, params)
        expanded = api_key_client.get(url, {**params, "expand": "created_by,updated_by"})
        assert baseline.status_code == expanded.status_code == 200
        base_body, expanded_body = baseline.json(), expanded.json()
        base_rows = base_body.pop("results")
        rows = expanded_body.pop("results")
        assert base_body == expanded_body
        assert [row["id"] for row in rows] == [row["id"] for row in base_rows]
        ids = {row["id"] for row in rows}
        assert len(ids) == 2
        assert seen.isdisjoint(ids)
        seen.update(ids)
    assert seen == expected_ids
