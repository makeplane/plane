# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Liviere/plane fork: web push about new work items (plane/liviere/push). The push services are mocked.

import os
from unittest import mock
from uuid import uuid4

import pytest
import requests
from crum import impersonate
from cryptography.hazmat.primitives.asymmetric import ec
from rest_framework import status
from django.test import Client
from rest_framework.test import APIClient

from plane.db.models import Issue, Profile, Project, ProjectMember, State, User, WorkspaceMember
from plane.db.models.api import APIToken
from plane.liviere.models import PushProject, PushSubscription, WorkItemOpen
from plane.liviere.push import messages, notify
from plane.liviere.push.config import b64url_encode, public_key_bytes, vapid_config

ADMIN, MEMBER, GUEST = 20, 15, 5
SETTINGS_URL = "/api/users/me/liviere/push/"
FIREFOX = "https://updates.push.services.mozilla.com/wpush/v2/"


def _vapid_env():
    private_key = ec.generate_private_key(ec.SECP256R1())
    return {
        "LIVIERE_VAPID_PRIVATE_KEY": b64url_encode(private_key.private_numbers().private_value.to_bytes(32, "big")),
        "LIVIERE_VAPID_PUBLIC_KEY": b64url_encode(public_key_bytes(private_key)),
        "LIVIERE_VAPID_SUBJECT": "mailto:push@example.com",
    }


@pytest.fixture
def vapid():
    with mock.patch.dict(os.environ, _vapid_env()):
        yield vapid_config()


@pytest.fixture
def no_vapid():
    with mock.patch.dict(os.environ, {}, clear=False):
        for name in ("LIVIERE_VAPID_PRIVATE_KEY", "LIVIERE_VAPID_PUBLIC_KEY", "LIVIERE_VAPID_SUBJECT"):
            os.environ.pop(name, None)
        yield


def _make_user(prefix, language=None):
    unique_id = uuid4().hex[:8]
    user = User.objects.create(email=f"{prefix}-{unique_id}@plane.so", username=f"{prefix}_{unique_id}")
    if language:
        Profile.objects.update_or_create(user=user, defaults={"language": language})
    return user


def _join(project, user, role=MEMBER):
    WorkspaceMember.objects.get_or_create(workspace=project.workspace, member=user, defaults={"role": role})
    ProjectMember.objects.create(project=project, member=user, role=role, is_active=True)
    return user


def _project(workspace, owner, identifier, name=None):
    project = Project.objects.create(
        name=name or f"Project {identifier}", identifier=identifier, workspace=workspace, created_by=owner
    )
    ProjectMember.objects.create(project=project, member=owner, role=ADMIN, is_active=True)
    State.objects.create(name="Todo", group="unstarted", color="#000000", project=project, workspace=workspace)
    return project


def _issue(project, author, name="Work item", **kwargs):
    with impersonate(author):
        return Issue.objects.create(project=project, workspace=project.workspace, name=name, **kwargs)


def _subscribe(user, suffix=None):
    receiver = ec.generate_private_key(ec.SECP256R1())
    return PushSubscription.objects.create(
        user=user,
        endpoint=f"{FIREFOX}{suffix or uuid4().hex}",
        p256dh=b64url_encode(public_key_bytes(receiver)),
        auth=b64url_encode(os.urandom(16)),
    )


def _choose(user, project):
    return PushProject.objects.create(user=user, project=project, workspace=project.workspace)


def _session(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _subscription_body(endpoint=None):
    receiver = ec.generate_private_key(ec.SECP256R1())
    return {
        "endpoint": endpoint or f"{FIREFOX}{uuid4().hex}",
        "keys": {"p256dh": b64url_encode(public_key_bytes(receiver)), "auth": b64url_encode(os.urandom(16))},
        "user_agent": "Firefox",
    }


@pytest.fixture
def me(db, create_user):
    return create_user


@pytest.fixture
def agent(db):
    return _make_user("agent")


@pytest.fixture
def project(db, workspace, me, agent):
    project = _project(workspace, me, "PU", name="Liviere Studio")
    _join(project, agent)
    return project


@pytest.fixture
def sent():
    """Mocks the push services: records (endpoint, message) and answers 201."""
    calls = []

    def fake_send(subscription, message, config):
        calls.append((subscription.endpoint, message))
        return 201

    with mock.patch.object(notify, "send", side_effect=fake_send):
        yield calls


@pytest.mark.contract
class TestRecipients:
    def test_only_chosen_projects_and_never_the_author(self, workspace, project, me, agent, vapid, sent):
        other_project = _project(workspace, me, "OT")
        _join(other_project, agent)
        mine = _subscribe(me)
        theirs = _subscribe(agent)
        _choose(me, project)
        _choose(agent, project)

        issue = _issue(project, agent, "Fix the login")
        _issue(other_project, agent, "Not chosen")

        assert notify.notify_new_work_item(issue.id, vapid) == 1
        assert [endpoint for endpoint, _ in sent] == [mine.endpoint]
        assert theirs.endpoint not in [endpoint for endpoint, _ in sent]
        assert notify.notify_new_work_item(_issue(other_project, agent).id, vapid) == 0

    def test_message_names_only_the_identifier_title_and_project(self, workspace, project, me, agent, vapid, sent):
        _subscribe(me)
        _choose(me, project)
        issue = _issue(project, agent, "Fix the login", description_html="<p>secret details</p>")

        notify.notify_new_work_item(issue.id, vapid)
        ((_, message),) = sent
        assert message == {
            "title": f"PU-{issue.sequence_id} · Liviere Studio",
            "body": "Fix the login",
            "tag": f"liviere-new-{project.id}",
            "url": f"/{workspace.slug}/browse/PU-{issue.sequence_id}/",
            "count": 1,
        }

    def test_a_series_becomes_one_notification_per_project(self, workspace, project, me, agent, vapid, sent):
        _subscribe(me)
        _choose(me, project)
        for n in range(3):
            last = _issue(project, agent, f"Sub-item {n}")
            notify.notify_new_work_item(last.id, vapid)

        titles = [message["title"] for _, message in sent]
        assert titles[1:] == ["PU: 2 new work items", "PU: 3 new work items"]
        assert {message["tag"] for _, message in sent} == {f"liviere-new-{project.id}"}
        assert sent[-1][1]["body"] == "Sub-item 2"
        assert sent[-1][1]["url"] == f"/{workspace.slug}/new-work-items?projects={project.id}"

    def test_polish_title_for_a_polish_profile(self, workspace, project, agent, vapid, sent):
        polish = _join(project, _make_user("pl", language="pl"))
        _subscribe(polish)
        _choose(polish, project)
        for n in range(5):
            notify.notify_new_work_item(_issue(project, agent, f"Element {n}").id, vapid)

        titles = [message["title"] for _, message in sent]
        assert titles[1:] == [
            "PU: 2 nowe elementy pracy",
            "PU: 3 nowe elementy pracy",
            "PU: 4 nowe elementy pracy",
            "PU: 5 nowych elementów pracy",
        ]

    @pytest.mark.parametrize(
        ("count", "expected"),
        [
            (2, "nowe elementy pracy"),
            (4, "nowe elementy pracy"),
            (5, "nowych elementów pracy"),
            (12, "nowych elementów pracy"),
            (14, "nowych elementów pracy"),
            (22, "nowe elementy pracy"),
            (25, "nowych elementów pracy"),
            (112, "nowych elementów pracy"),
        ],
    )
    def test_polish_plural(self, count, expected):
        assert messages.many_title("PU", count, "pl") == f"PU: {count} {expected}"
        assert messages.many_title("PU", count, "en-US") == f"PU: {count} new work items"

    def test_opened_work_items_do_not_count(self, workspace, project, me, agent, vapid, sent):
        _subscribe(me)
        _choose(me, project)
        first = _issue(project, agent)
        WorkItemOpen.objects.create(user=me, issue=first, project=project, workspace=workspace)
        notify.notify_new_work_item(_issue(project, agent, "Second").id, vapid)
        assert sent[-1][1]["count"] == 1

    def test_restricted_guest_gets_nothing(self, workspace, project, agent, vapid, sent):
        guest = _join(project, _make_user("guest"), role=GUEST)
        _subscribe(guest)
        _choose(guest, project)
        assert notify.notify_new_work_item(_issue(project, agent).id, vapid) == 0
        assert sent == []

    def test_left_the_project_gets_nothing(self, workspace, project, me, agent, vapid, sent):
        _subscribe(me)
        _choose(me, project)
        ProjectMember.objects.filter(project=project, member=me).update(is_active=False)
        assert notify.notify_new_work_item(_issue(project, agent).id, vapid) == 0

    def test_drafts_and_triage_give_no_notification(self, workspace, project, me, agent, vapid, sent):
        _subscribe(me)
        _choose(me, project)
        triage = State.objects.create(
            name="Triage", group="triage", is_triage=True, color="#000", project=project, workspace=workspace
        )
        assert notify.notify_new_work_item(_issue(project, agent, is_draft=True).id, vapid) == 0
        assert notify.notify_new_work_item(_issue(project, agent, state=triage).id, vapid) == 0
        assert sent == []


@pytest.mark.contract
class TestDelivery:
    @pytest.mark.parametrize("status_code", [400, 403, 404, 410])
    def test_expired_subscription_is_removed(self, workspace, project, me, agent, vapid, status_code):
        subscription = _subscribe(me)
        _choose(me, project)
        with mock.patch.object(notify, "send", return_value=status_code) as send:
            assert notify.notify_new_work_item(_issue(project, agent).id, vapid) == 0
            notify.notify_new_work_item(_issue(project, agent).id, vapid)
        assert send.call_count == 1
        assert not PushSubscription.objects.filter(pk=subscription.pk).exists()

    def test_other_errors_keep_the_subscription(self, workspace, project, me, agent, vapid):
        subscription = _subscribe(me)
        _choose(me, project)
        with mock.patch.object(notify, "send", return_value=500):
            notify.notify_new_work_item(_issue(project, agent).id, vapid)
        with mock.patch.object(notify, "send", side_effect=requests.ConnectionError()):
            notify.notify_new_work_item(_issue(project, agent).id, vapid)
        subscription.refresh_from_db()
        assert subscription.failure_count == 2

        with mock.patch.object(notify, "send", return_value=201):
            notify.notify_new_work_item(_issue(project, agent).id, vapid)
        subscription.refresh_from_db()
        assert subscription.failure_count == 0
        assert subscription.last_success_at is not None


@pytest.mark.contract
class TestTrigger:
    def test_work_item_created_with_an_api_key_queues_a_push_after_commit(
        self, workspace, project, me, agent, vapid, django_capture_on_commit_callbacks
    ):
        token = APIToken.objects.create(user=agent, label="push", token=f"plane_api_{uuid4().hex}")
        client = APIClient()
        client.credentials(HTTP_X_API_KEY=token.token)
        with mock.patch("plane.liviere.tasks.notify_new_work_item.delay") as delay:
            with django_capture_on_commit_callbacks(execute=True):
                response = client.post(
                    f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/", {"name": "x"}, format="json"
                )
        assert response.status_code == status.HTTP_201_CREATED
        delay.assert_called_once_with(str(response.data["id"]))

    def test_nothing_is_queued_before_the_commit(self, project, agent, vapid, django_capture_on_commit_callbacks):
        with mock.patch("plane.liviere.tasks.notify_new_work_item.delay") as delay:
            with django_capture_on_commit_callbacks(execute=False) as callbacks:
                _issue(project, agent)
            delay.assert_not_called()
            assert len(callbacks) == 1

    def test_without_vapid_keys_nothing_is_queued(self, project, agent, no_vapid, django_capture_on_commit_callbacks):
        with mock.patch("plane.liviere.tasks.notify_new_work_item.delay") as delay:
            with django_capture_on_commit_callbacks(execute=True) as callbacks:
                _issue(project, agent)
        delay.assert_not_called()
        assert callbacks == []

    def test_drafts_are_not_queued(self, project, agent, vapid, django_capture_on_commit_callbacks):
        with mock.patch("plane.liviere.tasks.notify_new_work_item.delay") as delay:
            with django_capture_on_commit_callbacks(execute=True):
                _issue(project, agent, is_draft=True)
        delay.assert_not_called()

    def test_the_task_sends_nothing_without_keys(self, project, me, agent, no_vapid):
        from plane.liviere.tasks import notify_new_work_item

        _subscribe(me)
        _choose(me, project)
        with mock.patch.object(notify, "send") as send:
            assert notify_new_work_item(str(_issue(project, agent).id)) == 0
        send.assert_not_called()


@pytest.mark.contract
class TestSettingsEndpoints:
    def test_settings_without_keys(self, workspace, project, me, no_vapid):
        response = _session(me).get(SETTINGS_URL)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["available"] is False
        assert response.data["public_key"] is None
        assert (
            _session(me).post(f"{SETTINGS_URL}subscriptions/", _subscription_body(), format="json").status_code == 503
        )
        assert _session(me).post(f"{SETTINGS_URL}test/").status_code == 503

    def test_settings_list_projects_and_choice(self, workspace, project, me, vapid):
        guest_project = _project(workspace, _make_user("owner"), "GP")
        _join(guest_project, me, role=GUEST)
        client = _session(me)

        data = client.get(SETTINGS_URL).data
        assert data["available"] is True
        assert data["public_key"] == vapid.public_key
        (workspace_data,) = data["workspaces"]
        assert workspace_data["slug"] == workspace.slug
        # A restricted guest project is not offered
        assert [p["identifier"] for p in workspace_data["projects"]] == ["PU"]
        assert workspace_data["projects"][0]["selected"] is False

        response = client.put(f"{SETTINGS_URL}projects/", {"project_ids": [str(project.id)]}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert client.get(SETTINGS_URL).data["workspaces"][0]["projects"][0]["selected"] is True
        assert client.put(f"{SETTINGS_URL}projects/", {"project_ids": []}, format="json").status_code == 200
        assert PushProject.objects.filter(user=me).count() == 0

        for body in ({"project_ids": [str(guest_project.id)]}, {"project_ids": ["x"]}, {"project_ids": "x"}):
            assert client.put(f"{SETTINGS_URL}projects/", body, format="json").status_code == 400

    def test_subscribe_takes_over_and_unsubscribe(self, workspace, project, me, agent, vapid):
        body = _subscription_body()
        assert _session(agent).post(f"{SETTINGS_URL}subscriptions/", body, format="json").status_code == 204
        # The same browser signed in as me takes the subscription over
        assert _session(me).post(f"{SETTINGS_URL}subscriptions/", body, format="json").status_code == 204
        assert PushSubscription.objects.get(endpoint=body["endpoint"]).user_id == me.id
        assert PushSubscription.objects.count() == 1

        # Only the owner removes it
        _session(agent).delete(f"{SETTINGS_URL}subscriptions/", {"endpoint": body["endpoint"]}, format="json")
        assert PushSubscription.objects.count() == 1
        _session(me).delete(f"{SETTINGS_URL}subscriptions/", {"endpoint": body["endpoint"]}, format="json")
        assert PushSubscription.objects.count() == 0

    @pytest.mark.parametrize(
        "endpoint",
        ["https://127.0.0.1/push", "http://updates.push.services.mozilla.com/wpush/v2/x", "https://example.com/push"],
    )
    def test_subscription_to_an_unknown_host_is_refused(self, me, vapid, endpoint):
        response = _session(me).post(f"{SETTINGS_URL}subscriptions/", _subscription_body(endpoint), format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert PushSubscription.objects.count() == 0

    def test_subscription_with_bad_keys_is_refused(self, me, vapid):
        body = _subscription_body()
        body["keys"]["auth"] = "abc"
        assert _session(me).post(f"{SETTINGS_URL}subscriptions/", body, format="json").status_code == 400
        body["keys"] = "nope"
        assert _session(me).post(f"{SETTINGS_URL}subscriptions/", body, format="json").status_code == 400

    def test_test_notification_is_queued(self, me, vapid):
        client = _session(me)
        assert client.post(f"{SETTINGS_URL}test/").status_code == status.HTTP_400_BAD_REQUEST
        _subscribe(me)
        with mock.patch("plane.liviere.tasks.send_test_push.delay") as delay:
            assert client.post(f"{SETTINGS_URL}test/").status_code == status.HTTP_202_ACCEPTED
        delay.assert_called_once_with(str(me.id))

    def test_test_notification_text_follows_the_profile_language(self, db, vapid):
        polish = _make_user("pl", language="pl")
        _subscribe(polish)
        with mock.patch.object(notify, "send", return_value=201) as send:
            assert notify.send_test(polish.id, vapid) == 1
        assert send.call_args.args[1]["title"] == "Plane: powiadomienie testowe"

    def test_anonymous_is_refused(self, db):
        assert APIClient().get(SETTINGS_URL).status_code in (401, 403)


@pytest.mark.contract
class TestReviewFixes:
    def test_a_broken_broker_does_not_break_creating_a_work_item(
        self, workspace, project, me, agent, vapid, django_capture_on_commit_callbacks
    ):
        token = APIToken.objects.create(user=agent, label="push", token=f"plane_api_{uuid4().hex}")
        client = APIClient()
        client.credentials(HTTP_X_API_KEY=token.token)
        with mock.patch("plane.liviere.tasks.notify_new_work_item.delay", side_effect=RuntimeError("broker down")):
            with django_capture_on_commit_callbacks(execute=True):
                response = client.post(
                    f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/", {"name": "x"}, format="json"
                )
            with django_capture_on_commit_callbacks(execute=True):
                issue = _issue(project, agent, "From the app")
        assert response.status_code == status.HTTP_201_CREATED
        assert Issue.objects.filter(pk=response.data["id"]).exists()
        assert Issue.objects.filter(pk=issue.pk).exists()

    def test_five_failures_in_a_row_remove_the_subscription(self, workspace, project, me, agent, vapid):
        subscription = _subscribe(me)
        _choose(me, project)
        with mock.patch.object(notify, "send", return_value=500):
            for _ in range(4):
                notify.notify_new_work_item(_issue(project, agent).id, vapid)
            assert PushSubscription.objects.get(pk=subscription.pk).failure_count == 4
            notify.notify_new_work_item(_issue(project, agent).id, vapid)
        assert not PushSubscription.objects.filter(pk=subscription.pk).exists()

    def test_an_unexpected_error_does_not_stop_the_other_browsers(self, workspace, project, me, agent, vapid):
        broken = _subscribe(me, "broken")
        working = _subscribe(me, "working")
        _choose(me, project)

        def fake_send(subscription, message, config):
            if subscription.pk == broken.pk:
                raise RuntimeError("encryption failed")
            return 201

        with mock.patch.object(notify, "send", side_effect=fake_send):
            assert notify.notify_new_work_item(_issue(project, agent).id, vapid) == 1
        assert PushSubscription.objects.get(pk=broken.pk).failure_count == 1
        assert PushSubscription.objects.get(pk=working.pk).last_success_at is not None

    def test_the_longest_title_fits_the_payload(self, workspace, project, me, agent, vapid, sent):
        _subscribe(me)
        _choose(me, project)
        notify.notify_new_work_item(_issue(project, agent, "ż" * 255).id, vapid)
        from plane.liviere.push.webpush import payload_bytes

        payload = payload_bytes(sent[-1][1])
        assert len(payload) < 4096
        assert "ż".encode() in payload

    def test_at_most_ten_browsers_per_person(self, me, vapid):
        client = _session(me)
        bodies = [_subscription_body() for _ in range(11)]
        for body in bodies:
            assert client.post(f"{SETTINGS_URL}subscriptions/", body, format="json").status_code == 204
        endpoints = set(PushSubscription.objects.filter(user=me).values_list("endpoint", flat=True))
        assert len(endpoints) == 10
        assert bodies[0]["endpoint"] not in endpoints

    def test_the_same_endpoint_with_other_keys_is_refused(self, me, agent, vapid):
        body = _subscription_body()
        assert _session(me).post(f"{SETTINGS_URL}subscriptions/", body, format="json").status_code == 204
        other = _subscription_body(body["endpoint"])
        assert _session(agent).post(f"{SETTINGS_URL}subscriptions/", other, format="json").status_code == 409
        assert PushSubscription.objects.get(endpoint=body["endpoint"]).user_id == me.id

    @pytest.mark.parametrize(
        "endpoint",
        [
            "https://fcm.googleapis.com:abc/fcm/send/x",
            "https://fcm.googleapis.com:99999/fcm/send/x",
            "https://:@fcm.googleapis.com/fcm/send/x",
            "https://fcm.googleapis.com/fcm/send/zażółć",
        ],
    )
    def test_malformed_endpoints_answer_400(self, me, vapid, endpoint):
        response = _session(me).post(f"{SETTINGS_URL}subscriptions/", _subscription_body(endpoint), format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_test_notifications_are_throttled(self, me, vapid):
        _subscribe(me)
        client = _session(me)
        with mock.patch("plane.liviere.tasks.send_test_push.delay"):
            codes = [client.post(f"{SETTINGS_URL}test/").status_code for _ in range(6)]
        assert codes == [202] * 5 + [429]

    def test_signing_out_removes_the_subscriptions(self, me, agent, vapid):
        _subscribe(me)
        _subscribe(me)
        _subscribe(agent)
        client = Client()
        client.force_login(me)
        client.post("/auth/sign-out/")
        assert PushSubscription.objects.filter(user=me).count() == 0
        assert PushSubscription.objects.filter(user=agent).count() == 1
