import base64
import hashlib
import json
from datetime import datetime, timezone as datetime_timezone
from pathlib import Path
from unittest.mock import patch
from uuid import UUID, uuid4

import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from django.utils import timezone
from rest_framework import status

from plane.db.models import (
    LooperNodeBinding,
    LooperNodeKey,
    LooperDispatch,
    LooperProjectIntegration,
    LooperProjectRolePolicy,
    LooperWorkItemProtocol,
    Issue,
    Project,
    ProjectMember,
    State,
    User,
    Workspace,
    WorkspaceMember,
)
from plane.integrations.looper.protocol import (
    NODE_REQUEST_PROFILE,
    b64url_encode,
    domain_digest,
    encode_node_request,
)


FIXTURE_PATH = Path(__file__).parents[2] / "fixtures" / "looper" / "strict_protocol_v1.json"
LINK_CONTENT_TYPE = "application/vnd.looper.link-request+cbor;v=1"


@pytest.fixture
def binding_vectors():
    return json.loads(FIXTURE_PATH.read_text())


@pytest.fixture
def binding_context(db, binding_vectors):
    owner = User.objects.create(
        id=UUID(binding_vectors["proof"]["member_id"]),
        email="binding-owner@plane.so",
        username="binding-owner",
        display_name="杨瑾龙",
    )
    admin = User.objects.create(email="binding-admin@plane.so", username="binding-admin", display_name="Admin")
    workspace = Workspace.objects.create(
        id=UUID(binding_vectors["proof"]["plane_workspace_id"]),
        name="Looper Workspace",
        slug=f"looper-{uuid4().hex[:8]}",
        owner=admin,
    )
    project = Project.objects.create(
        id=UUID(binding_vectors["proof"]["plane_project_id"]),
        name="Looper Project",
        identifier="LOOP",
        workspace=workspace,
        created_by=admin,
    )
    for user, role in ((owner, 15), (admin, 20)):
        WorkspaceMember.objects.create(workspace=workspace, member=user, role=role)
        ProjectMember.objects.create(project=project, member=user, role=role, is_active=True)
    return owner, admin, workspace, project


@pytest.fixture
def trust_settings(tmp_path, binding_vectors, settings):
    challenge = binding_vectors["challenge"]
    path = tmp_path / "trust-roots.json"
    path.write_text(
        json.dumps(
            {
                "version": 1,
                "keys": [
                    {
                        "key_revision": 7,
                        "algorithm": "Ed25519",
                        "public_key_b64": binding_vectors["trust"]["public_key_b64"],
                        "not_before_ms": challenge["issued_at_ms"] - 1_000,
                        "not_after_ms": challenge["expires_at_ms"] + 1_000,
                        "state": "active",
                    }
                ],
            }
        )
    )
    settings.LOOPERNET_TRUST_ROOTS_FILE = str(path)
    settings.LOOPERNET_NETWORK_ID = challenge["network_id"]
    return settings


def binding_base_url(workspace, project):
    return f"/api/workspaces/{workspace.slug}/projects/{project.id}/looper"


def challenge_time(binding_vectors):
    return datetime.fromtimestamp(
        (binding_vectors["challenge"]["issued_at_ms"] + 1) / 1000,
        tz=datetime_timezone.utc,
    )


def signed_node_header(
    *,
    private_key,
    binding,
    method,
    path,
    query="",
    body=b"",
    dispatch=None,
    state_version=None,
    attempt_id=None,
    fencing_token=None,
):
    timestamp_ms = int(timezone.now().timestamp() * 1000)
    nonce = uuid4().bytes
    payload = encode_node_request(
        method=method,
        path=path,
        query=query,
        body_sha256=hashlib.sha256(body).digest(),
        binding_id=binding.id,
        key_revision=1,
        dispatch_id=dispatch.id if dispatch else None,
        dispatch_revision=dispatch.revision if dispatch else None,
        state_version=state_version,
        execution_attempt_id=attempt_id,
        fencing_token=fencing_token,
        timestamp_ms=timestamp_ms,
        nonce=nonce,
    )
    signature = private_key.sign(domain_digest(NODE_REQUEST_PROFILE, payload))
    return (
        f"v=1; key={binding.id}:1; ts={timestamp_ms}; nonce={b64url_encode(nonce)}; "
        f"sig={b64url_encode(signature)}"
    )


def link_binding(api_client, owner, workspace, project, binding_vectors):
    api_client.force_authenticate(owner)
    raw = base64.b64decode(binding_vectors["link_request_cbor_b64"])
    with patch("plane.app.views.looper.binding.timezone.now", return_value=challenge_time(binding_vectors)):
        return api_client.post(
            f"{binding_base_url(workspace, project)}/bindings/link/",
            data=raw,
            content_type=LINK_CONTENT_TYPE,
        )


@pytest.mark.contract
@pytest.mark.django_db(transaction=True)
def test_owner_links_node_admin_approves_and_owner_sees_only_own_target(
    api_client,
    binding_context,
    binding_vectors,
    trust_settings,
):
    owner, admin, workspace, project = binding_context

    response = link_binding(api_client, owner, workspace, project, binding_vectors)

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["member_id"] == str(owner.id)
    assert response.data["node_id"] == binding_vectors["challenge"]["node_id"]
    assert response.data["state"] == "pending"
    binding = LooperNodeBinding.objects.get(id=response.data["id"])
    key = LooperNodeKey.objects.get(binding=binding)
    assert bytes(key.public_key) == base64.b64decode(binding_vectors["node"]["public_key_b64"])

    api_client.force_authenticate(admin)
    approval = api_client.post(
        f"{binding_base_url(workspace, project)}/bindings/{binding.id}/approve/",
        {"allowed_roles": ["worker", "planner"], "allow_offline_queue": True},
        format="json",
    )
    assert approval.status_code == status.HTTP_200_OK
    assert approval.data["state"] == "active"
    assert approval.data["allowed_roles"] == ["planner", "worker"]
    assert approval.data["allow_offline_queue"] is True

    api_client.force_authenticate(owner)
    targets = api_client.get(f"{binding_base_url(workspace, project)}/targets/")
    assert targets.status_code == status.HTTP_200_OK
    assert [target["id"] for target in targets.data["targets"]] == [str(binding.id)]

    api_client.force_authenticate(admin)
    admin_targets = api_client.get(f"{binding_base_url(workspace, project)}/targets/")
    assert admin_targets.status_code == status.HTTP_200_OK
    assert admin_targets.data["targets"] == []


@pytest.mark.contract
@pytest.mark.django_db(transaction=True)
def test_link_request_replay_and_plane_session_member_mismatch_fail_closed(
    api_client,
    binding_context,
    binding_vectors,
    trust_settings,
):
    owner, admin, workspace, project = binding_context

    api_client.force_authenticate(admin)
    mismatch = link_binding(api_client, admin, workspace, project, binding_vectors)
    assert mismatch.status_code == status.HTTP_400_BAD_REQUEST
    assert mismatch.data["error"] == "invalid_link_request"
    assert LooperNodeBinding.objects.count() == 0

    first = link_binding(api_client, owner, workspace, project, binding_vectors)
    assert first.status_code == status.HTTP_201_CREATED
    replay = link_binding(api_client, owner, workspace, project, binding_vectors)
    assert replay.status_code == status.HTTP_400_BAD_REQUEST
    assert "already consumed" in replay.data["detail"]
    assert LooperNodeBinding.objects.count() == 1


@pytest.mark.contract
@pytest.mark.django_db(transaction=True)
def test_project_role_policy_is_admin_written_and_engineering_is_always_dispatch_owner(
    api_client,
    binding_context,
):
    owner, admin, workspace, project = binding_context
    designer = User.objects.create(email="designer@plane.so", username="designer", display_name="范桢")
    qa = User.objects.create(email="qa@plane.so", username="qa", display_name="尚欣雨")
    for user in (designer, qa):
        WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
        ProjectMember.objects.create(project=project, member=user, role=15, is_active=True)
    url = f"{binding_base_url(workspace, project)}/role-policy/"
    payload = {
        "product_member_id": str(owner.id),
        "design_member_id": str(designer.id),
        "qa_member_id": str(qa.id),
    }

    api_client.force_authenticate(owner)
    forbidden = api_client.put(url, payload, format="json")
    assert forbidden.status_code == status.HTTP_403_FORBIDDEN

    api_client.force_authenticate(admin)
    response = api_client.put(url, payload, format="json")
    assert response.status_code == status.HTTP_200_OK
    assert response.data["policy"]["engineering_member_rule"] == "dispatch_owner"
    assert response.data["policy"]["design_member_id"] == str(designer.id)
    assert LooperProjectRolePolicy.objects.get(project=project).revision == 1

    response = api_client.put(url, {**payload, "product_member_id": str(admin.id)}, format="json")
    assert response.status_code == status.HTTP_200_OK
    assert response.data["policy"]["revision"] == 2


@pytest.mark.contract
@pytest.mark.django_db(transaction=True)
def test_project_activation_classifies_old_items_legacy_and_new_items_strict(api_client, binding_context):
    owner, admin, workspace, project = binding_context
    state = State.objects.create(name="Todo", project=project, group="backlog", default=True)
    old_issue = Issue.objects.create(
        name="Before strict epoch",
        workspace=workspace,
        project=project,
        state=state,
        created_by=admin,
    )
    LooperNodeBinding.objects.create(
        project=project,
        member=owner,
        node_id="node-owner",
        node_name_snapshot="Owner MacBook",
        allowed_roles=["planner", "worker"],
        state="active",
        approved_by=admin,
    )
    LooperProjectRolePolicy.objects.create(
        project=project,
        product_member=owner,
        design_member=admin,
        qa_member=admin,
    )
    api_client.force_authenticate(admin)

    response = api_client.put(
        f"{binding_base_url(workspace, project)}/integration/",
        {
            "action": "activate",
            "activation_checklist_revision": 1,
            "node_capability_revisions": {"node-owner": 1},
            "effective_legacy_trigger_label_ids": [],
        },
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["integration"]["state"] == "active"
    assert LooperWorkItemProtocol.objects.get(issue=old_issue).protocol == "legacy"
    new_issue = Issue.objects.create(
        name="After strict epoch",
        workspace=workspace,
        project=project,
        state=state,
        created_by=admin,
    )
    classification = LooperWorkItemProtocol.objects.get(issue=new_issue)
    assert classification.protocol == "strict_v1"
    with pytest.raises(ValueError, match="immutable"):
        classification.protocol = "legacy"
        classification.save()


@pytest.mark.contract
@pytest.mark.django_db(transaction=True)
def test_member_removal_suspends_binding_dispatch_and_project_integration(binding_context):
    owner, admin, workspace, project = binding_context
    state = State.objects.create(name="Todo", project=project, group="backlog", default=True)
    issue = Issue.objects.create(
        name="Active work", workspace=workspace, project=project, state=state, created_by=admin
    )
    binding = LooperNodeBinding.objects.create(
        project=project,
        member=owner,
        node_id="node-owner",
        node_name_snapshot="Owner MacBook",
        allowed_roles=["planner", "worker"],
        state="active",
        approved_by=admin,
    )
    integration = LooperProjectIntegration.objects.create(project=project, state="active")
    dispatch = LooperDispatch.objects.create(
        project=project,
        issue=issue,
        node_binding=binding,
        requested_mode="auto",
        active_role="planner",
        owner_member=owner,
        dispatched_by_member=owner,
        node_id=binding.node_id,
        node_name_snapshot=binding.node_name_snapshot,
        state="queued",
        idempotency_key=uuid4(),
    )

    membership = ProjectMember.objects.get(project=project, member=owner)
    membership.is_active = False
    membership.save()

    binding.refresh_from_db()
    dispatch.refresh_from_db()
    integration.refresh_from_db()
    assert binding.state == "revocation_pending"
    assert dispatch.health == "role_drift"
    assert integration.state == "paused"


def strict_dispatch_context(binding_context, binding_vectors):
    owner, admin, workspace, project = binding_context
    private_key = Ed25519PrivateKey.from_private_bytes(
        base64.b64decode(binding_vectors["node"]["private_seed_b64"])
    )
    binding = LooperNodeBinding.objects.create(
        project=project,
        member=owner,
        node_id="node-owner",
        node_name_snapshot="杨瑾龙的 MacBook",
        allowed_roles=["planner", "worker"],
        state="active",
        approved_by=admin,
    )
    LooperNodeKey.objects.create(
        project=project,
        binding=binding,
        key_revision=1,
        public_key=private_key.public_key().public_bytes_raw(),
        state="active",
    )
    LooperProjectRolePolicy.objects.create(
        project=project,
        product_member=admin,
        design_member=admin,
        qa_member=admin,
    )
    LooperProjectIntegration.objects.create(
        project=project,
        state="active",
        strict_epoch=timezone.now(),
        activation_checklist_revision=1,
        node_capability_revisions={binding.node_id: 1},
    )
    state = State.objects.create(name="Todo", project=project, group="backlog", default=True)
    issue = Issue.objects.create(
        name="Strict dispatch work",
        workspace=workspace,
        project=project,
        state=state,
        created_by=owner,
    )
    return owner, admin, workspace, project, binding, private_key, issue


@pytest.mark.contract
@pytest.mark.django_db(transaction=True)
def test_owner_only_dispatch_is_idempotent_and_other_owner_cannot_override(
    api_client, binding_context, binding_vectors
):
    owner, admin, workspace, project, binding, _private_key, issue = strict_dispatch_context(
        binding_context, binding_vectors
    )
    url = f"/api/workspaces/{workspace.slug}/projects/{project.id}/work-items/{issue.id}/looper/dispatch/"
    idempotency_key = uuid4()

    api_client.force_authenticate(owner)
    first = api_client.post(
        url,
        {"requested_mode": "auto", "idempotency_key": str(idempotency_key)},
        format="json",
    )
    assert first.status_code == status.HTTP_201_CREATED
    assert first.data["dispatch"]["owner_member_id"] == str(owner.id)
    assert first.data["dispatch"]["node_binding_id"] == str(binding.id)
    replay = api_client.post(
        url,
        {"requested_mode": "auto", "idempotency_key": str(idempotency_key)},
        format="json",
    )
    assert replay.status_code == status.HTTP_200_OK
    assert replay.data["created"] is False
    assert LooperDispatch.objects.filter(issue=issue).count() == 1

    api_client.force_authenticate(admin)
    denied = api_client.post(
        url,
        {"requested_mode": "auto", "idempotency_key": str(uuid4())},
        format="json",
    )
    assert denied.status_code == status.HTTP_409_CONFLICT
    assert denied.data["error"] == "active_owner_binding_required"

    summary = api_client.get(
        f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/looper/"
    )
    assert summary.status_code == status.HTTP_200_OK
    assert summary.data["permissions"]["can_stop"] is False


@pytest.mark.contract
@pytest.mark.django_db(transaction=True)
def test_signed_inbox_claim_and_fenced_transition_reject_replay(
    api_client, binding_context, binding_vectors
):
    owner, _admin, workspace, project, binding, private_key, issue = strict_dispatch_context(
        binding_context, binding_vectors
    )
    api_client.force_authenticate(owner)
    create_url = f"/api/workspaces/{workspace.slug}/projects/{project.id}/work-items/{issue.id}/looper/dispatch/"
    created = api_client.post(
        create_url,
        {"requested_mode": "auto", "idempotency_key": str(uuid4())},
        format="json",
    )
    dispatch = LooperDispatch.objects.get(id=created.data["dispatch"]["id"])
    api_client.force_authenticate(user=None)

    inbox_path = f"/api/workspaces/{workspace.slug}/projects/{project.id}/looper/dispatch/inbox/"
    query = f"node_id={binding.node_id}&cursor="
    inbox_header = signed_node_header(
        private_key=private_key,
        binding=binding,
        method="GET",
        path=inbox_path,
        query=query,
    )
    inbox = api_client.get(f"{inbox_path}?{query}", HTTP_LOOPER_SIGNATURE=inbox_header)
    assert inbox.status_code == status.HTTP_200_OK
    assert [item["id"] for item in inbox.data["dispatches"]] == [str(dispatch.id)]
    replay = api_client.get(f"{inbox_path}?{query}", HTTP_LOOPER_SIGNATURE=inbox_header)
    assert replay.status_code == status.HTTP_401_UNAUTHORIZED
    assert "already consumed" in replay.data["detail"]

    claim_path = f"/api/workspaces/{workspace.slug}/projects/{project.id}/looper/dispatch/{dispatch.id}/claim/"
    claim_body = json.dumps(
        {"expected_state_version": 1, "claim_idempotency_key": str(uuid4())},
        separators=(",", ":"),
    ).encode()
    claim_header = signed_node_header(
        private_key=private_key,
        binding=binding,
        method="POST",
        path=claim_path,
        body=claim_body,
        dispatch=dispatch,
        state_version=1,
    )
    claimed = api_client.generic(
        "POST",
        claim_path,
        data=claim_body,
        content_type="application/json",
        HTTP_LOOPER_SIGNATURE=claim_header,
    )
    assert claimed.status_code == status.HTTP_200_OK
    dispatch.refresh_from_db()
    assert dispatch.state == "claimed"
    assert dispatch.execution_attempt_id is not None
    assert dispatch.fencing_token == 1

    transition_path = (
        f"/api/workspaces/{workspace.slug}/projects/{project.id}/looper/dispatch/{dispatch.id}/transition/"
    )
    transition_body = json.dumps(
        {
            "expected_state_version": dispatch.state_version,
            "execution_attempt_id": str(dispatch.execution_attempt_id),
            "fencing_token": dispatch.fencing_token,
            "state": "running",
            "wait_kind": None,
        },
        separators=(",", ":"),
    ).encode()
    transition_header = signed_node_header(
        private_key=private_key,
        binding=binding,
        method="POST",
        path=transition_path,
        body=transition_body,
        dispatch=dispatch,
        state_version=dispatch.state_version,
        attempt_id=dispatch.execution_attempt_id,
        fencing_token=dispatch.fencing_token,
    )
    transitioned = api_client.generic(
        "POST",
        transition_path,
        data=transition_body,
        content_type="application/json",
        HTTP_LOOPER_SIGNATURE=transition_header,
    )
    assert transitioned.status_code == status.HTTP_200_OK
    dispatch.refresh_from_db()
    assert dispatch.state == "running"
    assert dispatch.state_version == 3

    stale = api_client.generic(
        "POST",
        transition_path,
        data=transition_body,
        content_type="application/json",
        HTTP_LOOPER_SIGNATURE=transition_header,
    )
    assert stale.status_code == status.HTTP_401_UNAUTHORIZED
