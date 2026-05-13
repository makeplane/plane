import pytest
from plane.db.models import Sticky, Workspace


@pytest.mark.django_db
def test_default_sort_order_assignment(workspace, session_client):
    # Create the first sticky
    s1 = Sticky.objects.create(
        workspace=workspace,
        owner=session_client.user,
        name="Sticky 1",
    )
    assert s1.sort_order == 65535

    # Create the second sticky
    s2 = Sticky.objects.create(
        workspace=workspace,
        owner=session_client.user,
        name="Sticky 2",
    )
    # According to the model logic, sort_order increments by +10000
    assert s2.sort_order == 65535 + 10000


@pytest.mark.django_db
def test_api_returns_ordered_list(workspace, session_client):
    Sticky.objects.create(
        workspace=workspace,
        owner=session_client.user,
        name="Last",
        sort_order=200,
    )
    Sticky.objects.create(
        workspace=workspace,
        owner=session_client.user,
        name="First",
        sort_order=100,
    )

    res = session_client.get(f"/api/workspaces/{workspace.slug}/stickies/")
    results = res.data
    assert results[0]["name"] == "First"
    assert results[1]["name"] == "Last"