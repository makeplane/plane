# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Decision register (fork Liviere/plane, plane/liviere/decisions) through /api/v1/ (API key) and the app
# (session). Every decision here is invented (a tea shop, project DEMO).

import logging
import threading
from datetime import datetime, timezone as dt_timezone
from unittest import mock
from uuid import uuid4

import pytest
from django.db import connection
from django.utils import timezone
from freezegun import freeze_time
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Issue, Project, ProjectMember, User, WorkspaceMember
from plane.db.models.api import APIToken
from plane.liviere.models import Decision, DecisionArea, DecisionEvent, DecisionSettings
from plane.liviere.search.privacy import is_private_api_path

RETURNS = "Zwrot przyjmujemy do 30 dni od dostawy"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Sklep", identifier="DEMO", workspace=workspace, created_by=create_user, timezone="Europe/Warsaw"
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    DecisionSettings.objects.create(project=project, enabled=True)
    orders = DecisionArea.objects.create(
        workspace=workspace, project=project, key="zamowienia", name="Zamówienia", sort_order=1
    )
    DecisionArea.objects.create(workspace=workspace, project=project, parent=orders, key="zwroty", name="Zwroty")
    DecisionArea.objects.create(workspace=workspace, project=project, parent=orders, key="wysylka", name="Wysyłka")
    payments = DecisionArea.objects.create(
        workspace=workspace, project=project, key="platnosci", name="Płatności", sort_order=2
    )
    DecisionArea.objects.create(workspace=workspace, project=project, parent=payments, key="faktury", name="Faktury")
    return project


def _user(workspace, name, workspace_role=15):
    user = User.objects.create(email=f"{name}-{uuid4().hex[:8]}@plane.so", username=f"{name}_{uuid4().hex[:8]}")
    user.display_name = name
    user.save(update_fields=["display_name"])
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=workspace_role)
    return user


def _member(project, role, name, workspace_role=15):
    user = _user(project.workspace, name, workspace_role)
    ProjectMember.objects.create(project=project, member=user, role=role, is_active=True)
    return user


def _key_client(user):
    token = APIToken.objects.create(user=user, label="decisions", token=f"plane_api_{uuid4().hex}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


def _session_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _v1(project, path=""):
    return f"/api/v1/workspaces/{project.workspace.slug}/projects/{project.id}/liviere/decisions/{path}"


def _app(project, path=""):
    return f"/api/workspaces/{project.workspace.slug}/projects/{project.id}/liviere/decisions/{path}"


def _new(client, url, **fields):
    body = {"title": RETURNS, "area": "zamowienia", "mechanism": "zwroty", "kind": "product", **fields}
    response = client.post(url, body, format="json")
    assert response.status_code == status.HTTP_201_CREATED, response.json()
    return response.json()


def _issue(project, name, **kwargs):
    return Issue.objects.create(project=project, workspace=project.workspace, name=name, **kwargs)


@pytest.fixture
def key(create_user):
    return _key_client(create_user)


@pytest.fixture
def session(create_user):
    return _session_client(create_user)


@pytest.mark.contract
class TestSwitchAndPermissions:
    @pytest.mark.django_db
    def test_disabled_project_answers_404_and_writes_nothing(self, key, session, project):
        DecisionSettings.objects.filter(project=project).update(enabled=False)
        for client, url in ((key, _v1(project)), (session, _app(project))):
            for method, path in (("get", ""), ("post", ""), ("get", "queues/"), ("post", "import/")):
                response = getattr(client, method)(url + path, {"title": "x"}, format="json")
                assert response.status_code == status.HTTP_404_NOT_FOUND
                assert response.json()["code"] == "decisions_disabled"
        assert Decision.objects.count() == 0
        # The switch itself answers
        assert key.get(_v1(project, "settings/")).json() == {"enabled": False, "last_number": 0}

    @pytest.mark.django_db
    def test_admin_switches_through_the_api_key_member_cannot(self, key, project):
        DecisionSettings.objects.filter(project=project).delete()
        assert key.get(_v1(project, "settings/")).json()["enabled"] is False
        response = key.patch(_v1(project, "settings/"), {"enabled": True}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {"enabled": True, "last_number": 0}
        member = _member(project, 15, "member")
        response = _key_client(member).patch(_v1(project, "settings/"), {"enabled": False}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert DecisionSettings.objects.get(project=project).enabled is True

    @pytest.mark.django_db
    def test_member_reads_and_writes_guest_and_outsider_get_nothing(self, project, workspace):
        member = _member(project, 15, "member")
        guest = _member(project, 5, "guest")
        outsider = _user(workspace, "outsider")
        for user in (member,):
            for client, url in ((_key_client(user), _v1(project)), (_session_client(user), _app(project))):
                created = _new(client, url)
                assert client.get(url + f"{created['number']}/").status_code == status.HTTP_200_OK
        for user in (guest, outsider):
            for client, url in ((_key_client(user), _v1(project)), (_session_client(user), _app(project))):
                assert client.get(url).status_code == status.HTTP_403_FORBIDDEN
                assert client.get(url + "1/").status_code == status.HTTP_403_FORBIDDEN
                assert client.get(url + "settings/").status_code == status.HTTP_403_FORBIDDEN
                assert client.post(url, {"title": "x"}, format="json").status_code == status.HTTP_403_FORBIDDEN
        assert Decision.objects.count() == 2

    @pytest.mark.django_db
    def test_workspace_admin_who_is_a_project_guest_has_access(self, project):
        # Upstream semantics of allow_permission, kept like in every other route of the fork
        admin_guest = _member(project, 5, "wsadmin", workspace_role=20)
        assert _key_client(admin_guest).get(_v1(project)).status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_enabled_projects_for_the_sidebar(self, session, project, workspace, create_user):
        other = Project.objects.create(name="Inny", identifier="OTH", workspace=workspace, created_by=create_user)
        ProjectMember.objects.create(project=other, member=create_user, role=20, is_active=True)
        response = session.get(f"/api/workspaces/{workspace.slug}/liviere/decisions/enabled-projects/")
        assert response.json() == {"project_ids": [str(project.id)]}


@pytest.mark.contract
class TestWritesAndOperations:
    @pytest.mark.django_db
    def test_create_through_key_and_session(self, key, session, project):
        through_key = _new(key, _v1(project))
        assert (through_key["identifier"], through_key["status"]) == ("DEMO-D1", "active")
        assert (through_key["decided_by"], through_key["confirmed"], through_key["pending_rollout"]) == (
            "agent",
            False,
            False,
        )
        assert through_key["queues"] == ["confirm"]
        owner = _new(key, _v1(project), by="user")
        assert (owner["decided_by"], owner["confirmed"], owner["pending_rollout"]) == ("user", True, False)
        asked = _new(key, _v1(project), rollout=True)
        assert asked["pending_rollout"] and asked["rollout"]["reason"] == "created"
        browser = _new(session, _app(project))
        assert (browser["decided_by"], browser["confirmed"], browser["pending_rollout"]) == ("user", True, True)
        assert browser["rollout"]["channel"] == "app"
        assert [d["number"] for d in key.get(_v1(project)).json()["results"]] == [1, 2, 3, 4]

    @pytest.mark.django_db
    def test_fields_are_checked(self, key, project):
        url = _v1(project)
        cases = [
            ({"area": "nieznany"}, "unknown_area"),
            ({"mechanism": "faktury"}, "unknown_mechanism"),
            ({"area2": "zamowienia"}, "validation_error"),
            ({"kind": "inne"}, "validation_error"),
            ({"title": "x" * 501}, "validation_error"),
            ({"status": "done"}, "operation_field"),
            ({"colour": "red"}, "unknown_field"),
            ({"issues": ["DEMO-99"]}, "issue_not_found"),
            ({"related": [42]}, "decision_not_found"),
        ]
        for fields, code in cases:
            body = {"title": RETURNS, "area": "zamowienia", "mechanism": "zwroty", "kind": "product", **fields}
            response = key.post(url, body, format="json")
            assert response.status_code == status.HTTP_400_BAD_REQUEST, fields
            assert response.json()["code"] == code, (fields, response.json())
        assert Decision.objects.count() == 0
        # A failed write takes no number
        assert DecisionSettings.objects.get(project=project).last_number == 0

    @pytest.mark.django_db
    def test_proposal_accept_with_correction_and_reject(self, key, session, project):
        proposal = key.post(
            _v1(project, "propose/"),
            {"title": "Raport ze zwrotów raz w tygodniu", "area": "zamowienia", "kind": "operations"},
            format="json",
        ).json()
        assert (proposal["status"], proposal["decided_by"], proposal["queues"]) == ("proposed", "agent", ["proposed"])
        # Session: "change and accept" in one entry
        accepted = session.post(
            _app(project, f"{proposal['number']}/accept/"),
            {"title": "Raport ze zwrotów co poniedziałek"},
            format="json",
        ).json()
        assert (accepted["status"], accepted["decided_by"], accepted["confirmed"]) == ("active", "user", True)
        assert accepted["title"] == "Raport ze zwrotów co poniedziałek"
        assert accepted["rollout"]["reason"] == "accepted"
        event = DecisionEvent.objects.filter(decision__number=proposal["number"], kind="accepted").get()
        assert event.changes["title"] == ["Raport ze zwrotów raz w tygodniu", "Raport ze zwrotów co poniedziałek"]
        assert event.changes["status"] == ["proposed", "active"]
        # Through the key: stays the agent's, no rollout
        second = key.post(
            _v1(project, "propose/"),
            {"title": "Druga propozycja", "area": "platnosci", "kind": "process"},
            format="json",
        ).json()
        through_key = key.post(_v1(project, f"{second['number']}/accept/"), {}, format="json").json()
        assert (through_key["status"], through_key["decided_by"], through_key["pending_rollout"]) == (
            "active",
            "agent",
            False,
        )
        third = key.post(
            _v1(project, "propose/"),
            {"title": "Trzecia propozycja", "area": "platnosci", "kind": "process"},
            format="json",
        ).json()
        rejected = session.post(_app(project, f"{third['number']}/revoke/"), {}, format="json").json()
        assert (rejected["status"], rejected["pending_rollout"]) == ("revoked", False)
        assert DecisionEvent.objects.filter(decision__number=third["number"], kind="rejected").exists()

    @pytest.mark.django_db
    def test_transition_table(self, key, session, project):
        n = _new(key, _v1(project))["number"]
        url = lambda op: _app(project, f"{n}/{op}/")  # noqa: E731

        def post(op, body=None, client=session, expect=status.HTTP_200_OK):
            response = client.post(
                url(op) if client is session else _v1(project, f"{n}/{op}/"), body or {}, format="json"
            )
            assert response.status_code == expect, (op, response.json())
            return response.json()

        assert post("accept", expect=400)["code"] == "invalid_transition"
        assert post("resume", expect=400)["code"] == "invalid_transition"
        assert post("defer", expect=400)["field"] == "review_on"
        deferred = post("defer", {"review_condition": "gdy liczba zwrotów przekroczy 20 miesięcznie"})
        assert (deferred["status"], deferred["rollout"]["reason"]) == ("deferred", "deferred")
        assert post("defer", {"review_on": "2026-12-01"}, expect=400)["code"] == "invalid_transition"
        resumed = post("resume")
        assert (resumed["status"], resumed["review_condition"], resumed["rollout"]["reason"]) == (
            "active",
            None,
            "resumed",
        )
        confirmed = post("confirm", client=key)
        assert (confirmed["decided_by"], confirmed["confirmed"]) == ("user", True)
        assert post("confirm", expect=400)["code"] == "already_confirmed"
        done = post("done")
        assert (done["status"], done["pending_rollout"]) == ("done", False)
        assert post("revoke", expect=400)["code"] == "invalid_transition"
        assert post("review", expect=400)["code"] == "invalid_transition"
        kinds = list(DecisionEvent.objects.filter(decision__number=n).order_by("id").values_list("kind", flat=True))
        assert kinds == ["created", "deferred", "resumed", "confirmed", "done"]

    @pytest.mark.django_db
    def test_review_and_ack(self, key, session, project):
        n = _new(key, _v1(project), review_on="2026-12-24", review_condition="po pierwszym miesiącu")["number"]
        reviewed = session.post(_app(project, f"{n}/review/"), {"review_on": "2027-03-01"}, format="json").json()
        assert (reviewed["review_on"], reviewed["review_condition"], reviewed["pending_rollout"]) == (
            "2027-03-01",
            None,
            False,
        )
        assert key.post(_v1(project, f"{n}/ack/"), {}, format="json").json()["code"] == "not_pending_rollout"
        revoked = session.post(
            _app(project, f"{n}/revoke/"), {"reason": "zbyt wiele nieodebranych paczek"}, format="json"
        )
        assert revoked.json()["rollout"]["reason"] == "revoked"
        issue = _issue(project, "Wdrożenie zmiany")
        acked = key.post(_v1(project, f"{n}/ack/"), {"issues": [f"DEMO-{issue.sequence_id}"]}, format="json").json()
        assert (acked["pending_rollout"], acked["rollout"]) == (False, None)
        assert [i["identifier"] for i in acked["issues"]] == [f"DEMO-{issue.sequence_id}"]
        event = DecisionEvent.objects.get(decision__number=n, kind="rollout_ack")
        assert event.changes["pending_rollout"] == [True, False]
        assert DecisionEvent.objects.get(decision__number=n, kind="revoked").note == "zbyt wiele nieodebranych paczek"

    @pytest.mark.django_db
    def test_edit_in_place_history_estimated_and_correction(self, key, session, project):
        first = _new(key, _v1(project))
        n = first["number"]
        Decision.objects.filter(number=n).update(estimated=["review_on", "decided_by"])
        response = key.patch(_v1(project, f"{n}/"), {"status": "done"}, format="json")
        assert response.json()["code"] == "operation_field"
        edited = key.patch(
            _v1(project, f"{n}/"),
            {"rationale": "Klienci często otwierają paczkę po 2–3 tygodniach.", "review_on": "2027-01-15"},
            format="json",
        ).json()
        assert edited["estimated"] == ["decided_by"]
        assert edited["pending_rollout"] is False
        # Area change without a mechanism leaves none
        moved = key.patch(_v1(project, f"{n}/"), {"area": "platnosci"}, format="json").json()
        assert (moved["area"], moved["mechanism"]) == ("platnosci", None)
        corrected = session.patch(
            _app(project, f"{n}/"), {"title": "Zwrot przyjmujemy do 30 dni"}, format="json"
        ).json()
        assert corrected["rollout"]["reason"] == "corrected"
        events = DecisionEvent.objects.filter(decision__number=n, kind="edited").order_by("id")
        assert events[0].changes["review_on"] == [None, "2027-01-15"]
        assert events[0].channel == "api" and events[2].channel == "app"
        assert events[1].changes == {"area": ["zamowienia", "platnosci"], "mechanism": ["zwroty", None]}
        detail = key.get(_v1(project, f"{n}/")).json()
        assert [h["kind"] for h in detail["history"]] == ["created", "edited", "edited", "edited"]
        assert detail["history"][1]["actor"]["display_name"] is not None
        # No change: no entry
        key.patch(_v1(project, f"{n}/"), {"title": "Zwrot przyjmujemy do 30 dni"}, format="json")
        assert DecisionEvent.objects.filter(decision__number=n).count() == 4

    @pytest.mark.django_db
    def test_related_is_symmetric(self, key, project):
        a = _new(key, _v1(project))["number"]
        b = _new(key, _v1(project), related=[a])["number"]
        c = _new(key, _v1(project), related=[b])["number"]
        assert key.get(_v1(project, f"{a}/")).json()["related"] == [b]
        assert key.get(_v1(project, f"{b}/")).json()["related"] == [a, c]
        key.patch(_v1(project, f"{b}/"), {"related": [c]}, format="json")
        assert key.get(_v1(project, f"{a}/")).json()["related"] == []
        assert key.patch(_v1(project, f"{a}/"), {"related": [a]}, format="json").status_code == 400

    @pytest.mark.django_db
    def test_link_adds_issues_and_sources(self, key, project):
        n = _new(key, _v1(project), sources=["CLAUDE.md:41"])["number"]
        issue = _issue(project, "Zmiana regulaminu")
        linked = key.post(
            _v1(project, f"{n}/link/"),
            {"issues": [f"demo-{issue.sequence_id}"], "sources": ["memory:x.md"]},
            format="json",
        ).json()
        assert linked["sources"] == ["CLAUDE.md:41", "memory:x.md"]
        assert linked["issues"][0]["name"] == "Zmiana regulaminu"
        assert key.post(_v1(project, f"{n}/link/"), {}, format="json").json()["code"] == "nothing_to_change"


@pytest.mark.contract
class TestSupersede:
    @pytest.mark.django_db
    def test_one_transaction_old_and_new(self, key, session, project):
        issue = _issue(project, "Regulamin zwrotów")
        old = _new(
            key, _v1(project), title="Zwrot przyjmujemy do 14 dni od dostawy", issues=[f"DEMO-{issue.sequence_id}"]
        )
        key.post(_v1(project, f"{old['number']}/confirm/"), {}, format="json")
        Decision.objects.filter(number=old["number"]).update(pending_rollout=True, rollout_reason="created")
        response = session.post(
            _app(project, f"{old['number']}/supersede/"),
            {"title": RETURNS, "rationale": "Klienci otwierają paczki późno."},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, response.json()
        body = response.json()
        new = body["created"][0]
        assert (body["superseded"]["status"], body["superseded"]["pending_rollout"]) == ("superseded", False)
        assert body["superseded"]["superseded_by"] == [new["number"]]
        assert (new["supersedes"], new["status"], new["decided_by"], new["rollout"]["reason"]) == (
            old["number"],
            "active",
            "user",
            "supersedes",
        )
        # Carried over from the old decision
        assert (new["area"], new["mechanism"], [i["identifier"] for i in new["issues"]]) == (
            "zamowienia",
            "zwroty",
            [f"DEMO-{issue.sequence_id}"],
        )
        old_events = DecisionEvent.objects.filter(decision__number=old["number"], kind="superseded").get()
        assert old_events.changes["superseded_by"] == [[], [new["number"]]]
        assert old_events.changes["pending_rollout"] == [True, False]
        assert DecisionEvent.objects.filter(decision__number=new["number"], kind="created").get().changes[
            "supersedes"
        ] == [
            None,
            old["number"],
        ]
        again = key.post(_v1(project, f"{old['number']}/supersede/"), {"title": "Jeszcze inaczej"}, format="json")
        assert again.status_code == 400 and again.json()["code"] == "already_superseded"
        # The chain from both ends
        detail = key.get(_v1(project, f"{new['number']}/")).json()
        assert [d["number"] for d in detail["chain"]["previous"]] == [old["number"]]
        assert key.get(_v1(project, f"{old['number']}/")).json()["chain"]["next"][0]["identifier"] == new["identifier"]

    @pytest.mark.django_db
    def test_split_into_two(self, key, project):
        old = _new(key, _v1(project), title="Zwroty do 30 dni, wysyłka raz dziennie")
        response = key.post(
            _v1(project, f"{old['number']}/supersede/"),
            {
                "decisions": [
                    {"title": RETURNS},
                    {"title": "Paczki wychodzą raz dziennie, o 14:00", "mechanism": "wysylka", "kind": "operations"},
                ],
                "by": "user",
            },
            format="json",
        )
        assert response.status_code == 201, response.json()
        created = response.json()["created"]
        assert [d["mechanism"] for d in created] == ["zwroty", "wysylka"]
        assert {d["decided_by"] for d in created} == {"user"}
        assert response.json()["superseded"]["superseded_by"] == [created[0]["number"], created[1]["number"]]
        chain = key.get(_v1(project, f"{old['number']}/")).json()["chain"]["next"]
        assert [d["supersedes"] for d in chain] == [old["number"], old["number"]]

    @pytest.mark.django_db
    def test_failure_halfway_rolls_everything_back(self, key, project, create_user):
        from plane.liviere.decisions import services

        old = _new(key, _v1(project))
        real = DecisionEvent.objects.create
        calls = []

        def failing(**kwargs):
            calls.append(kwargs["kind"])
            if kwargs["kind"] == "superseded":
                raise RuntimeError("broken in the middle")
            return real(**kwargs)

        with mock.patch.object(DecisionEvent.objects, "create", side_effect=failing):
            with pytest.raises(RuntimeError):
                ctx = services.Context(project=project, user=create_user, channel="api", slug=project.workspace.slug)
                services.supersede(ctx, old["number"], {"title": "Nowa wersja"})
        assert calls == ["created", "superseded"]
        assert Decision.objects.count() == 1
        assert Decision.objects.get().status == "active"
        assert DecisionSettings.objects.get(project=project).last_number == 1
        assert DecisionEvent.objects.count() == 1

    @pytest.mark.django_db
    def test_proposal_cannot_be_superseded(self, key, project):
        proposal = key.post(
            _v1(project, "propose/"), {"title": "Propozycja", "area": "platnosci", "kind": "process"}, format="json"
        ).json()
        response = key.post(_v1(project, f"{proposal['number']}/supersede/"), {"title": "Inna"}, format="json")
        assert response.json()["code"] == "invalid_transition"


@pytest.mark.contract
class TestQueuesAndInbox:
    @pytest.mark.django_db
    def test_review_window_in_the_project_time_zone(self, key, project):
        # 2026-11-27 23:30 UTC is already 2026-11-28 in Warsaw
        with freeze_time(datetime(2026, 11, 27, 23, 30, tzinfo=dt_timezone.utc)):
            for review_on in ("2026-11-28", "2026-12-12", "2026-12-13", "2026-11-01"):
                _new(key, _v1(project), review_on=review_on, by="user")
            _new(key, _v1(project), review_condition="gdy wróci kurier", by="user")
            counts = key.get(_v1(project, "queues/")).json()
            assert counts["today"] == "2026-11-28"
            assert counts["review"] == 3
            listed = key.get(_v1(project) + "?queue=review").json()["results"]
            assert sorted(d["review_on"] for d in listed) == ["2026-11-01", "2026-11-28", "2026-12-12"]

    @pytest.mark.django_db
    def test_five_counters(self, key, session, project):
        _new(key, _v1(project))  # confirm
        _new(session, _app(project))  # rollout
        key.post(_v1(project, "propose/"), {"title": "P", "area": "platnosci", "kind": "process"}, format="json")
        n = _new(key, _v1(project), by="user")["number"]
        Decision.objects.filter(number=n).update(needs_review=True)
        superseded = _new(session, _app(project))["number"]
        session.post(_app(project, f"{superseded}/supersede/"), {"title": "Nowsza"}, format="json")
        counts = key.get(_v1(project, "queues/")).json()
        assert {k: counts[k] for k in ("confirm", "review", "rollout", "proposed", "imported")} == {
            "confirm": 1,
            "review": 0,
            "rollout": 2,
            "proposed": 1,
            "imported": 1,
        }
        inbox = key.get(_v1(project, "inbox/")).json()["results"]
        assert [d["rollout"]["reason"] for d in inbox] == ["created", "supersedes"]


@pytest.mark.contract
class TestListAndSearch:
    @pytest.mark.django_db
    def test_filters(self, key, project):
        a = _new(key, _v1(project))["number"]
        b = _new(key, _v1(project), area="platnosci", mechanism="faktury", area2="zamowienia", kind="process")["number"]
        c = _new(key, _v1(project), mechanism="wysylka", kind="operations")["number"]
        key.post(_v1(project, f"{c}/done/"), {}, format="json")
        numbers = lambda q: [d["number"] for d in key.get(_v1(project) + q).json()["results"]]  # noqa: E731
        assert numbers("") == [a, b]
        assert numbers("?area=zamowienia") == [a, b]
        assert numbers("?area=platnosci") == [b]
        assert numbers("?mechanism=faktury") == [b]
        assert numbers("?status=all&area=zamowienia&mechanism=wysylka") == [c]
        assert numbers("?status=done,active&kind=operations") == [c]
        assert numbers("?queue=confirm") == [a, b]
        assert key.get(_v1(project) + "?status=nowy").json()["code"] == "validation_error"

    @pytest.mark.django_db
    def test_search_words_case_and_every_state(self, key, project):
        old = _new(key, _v1(project), title="Zwrot przyjmujemy do 14 dni", rationale="Wymaga tego PRAWO.")["number"]
        key.post(
            _v1(project, f"{old}/supersede/"), {"title": RETURNS, "rationale": "Paczki otwierane późno."}, format="json"
        )
        _new(key, _v1(project), title="Paczki wychodzą raz dziennie", note="Kurier odbiera o 14:00.")
        search = lambda **body: key.post(_v1(project, "search/"), body, format="json").json()  # noqa: E731
        found = search(q="zwrot")
        assert [(d["number"], d["status"]) for d in found["results"]] == [(old + 1, "active"), (old, "superseded")]
        assert found["results"][1]["superseded_by"] == [old + 1]
        assert [d["number"] for d in search(q="prawo zwrot")["results"]] == [old]
        assert [d["number"] for d in search(q="KURIER")["results"]] == [old + 2]
        assert search(q="ŻÓŁW")["total"] == 0
        assert [d["number"] for d in search(q="zwrot", status="active")["results"]] == [old + 1]
        assert search(q="zw")["code"] == "validation_error"


@pytest.mark.contract
class TestIssueLinks:
    @pytest.mark.django_db
    def test_archived_linked_foreign_hidden_deleted_hidden(self, key, project, workspace, create_user):
        archived = _issue(project, "Stary regulamin")
        Issue.all_objects.filter(pk=archived.pk).update(archived_at=timezone.now())
        other = Project.objects.create(name="Magazyn", identifier="MAG", workspace=workspace, created_by=create_user)
        ProjectMember.objects.create(project=other, member=create_user, role=20, is_active=True)
        foreign = _issue(other, "Tajny tytuł magazynu")
        gone = _issue(project, "Usunięty ticket")
        refs = [f"DEMO-{archived.sequence_id}", f"MAG-{foreign.sequence_id}", f"DEMO-{gone.sequence_id}"]
        n = _new(key, _v1(project), issues=refs)["number"]
        Issue.all_objects.filter(pk=gone.pk).update(deleted_at=timezone.now())

        mine = {i["identifier"]: i for i in key.get(_v1(project, f"{n}/")).json()["issues"]}
        assert mine[refs[0]]["visible"] and mine[refs[0]]["archived"] is True
        assert mine[refs[1]]["name"] == "Tajny tytuł magazynu"
        assert mine[refs[2]] == {"identifier": refs[2], "visible": False}

        member = _member(project, 15, "member")
        theirs = {i["identifier"]: i for i in _key_client(member).get(_v1(project, f"{n}/")).json()["issues"]}
        assert theirs[refs[1]] == {"identifier": refs[1], "visible": False}
        assert "Tajny" not in str(_key_client(member).get(_v1(project, f"{n}/")).json())
        # A member of DEMO only cannot link the work item of MAG either
        response = _key_client(member).post(
            _v1(project),
            {"title": "x", "area": "zamowienia", "kind": "product", "issues": [refs[1]]},
            format="json",
        )
        assert response.json()["code"] == "issue_not_found"


@pytest.mark.contract
class TestLogs:
    def test_decision_routes_are_private(self):
        assert is_private_api_path("/api/v1/workspaces/w/projects/p/liviere/decisions/")
        assert is_private_api_path("/api/v1/workspaces/w/projects/p/liviere/decisions/12/supersede/")
        assert is_private_api_path("/api/v1/workspaces/w/projects/p/liviere/decisions/import/")
        assert not is_private_api_path("/api/v1/workspaces/w/projects/p/issues/")

    @pytest.mark.django_db
    def test_content_never_reaches_the_logs(self, key, project, caplog):
        secret = "Herbata-fioletowa-7731"
        with caplog.at_level(logging.DEBUG), mock.patch("plane.middleware.logger.process_logs") as stored:
            _new(key, _v1(project), title=f"Zwrot {secret}")
            key.post(_v1(project), {"title": f"x {secret}", "area": "nieznany", "kind": "product"}, format="json")
            key.post(_v1(project, "search/"), {"q": secret}, format="json")
            with mock.patch("plane.liviere.decisions.services._take_numbers", side_effect=RuntimeError("boom")):
                response = key.post(
                    _v1(project), {"title": f"y {secret}", "area": "zamowienia", "kind": "product"}, format="json"
                )
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert secret not in caplog.text
        assert stored.delay.call_count >= 4
        for call in stored.delay.call_args_list:
            log_data = call.kwargs["log_data"]
            assert (log_data["body"], log_data["response_body"], log_data["query_params"]) == (None, None, "")
            assert secret not in str(log_data)


@pytest.mark.contract
class TestParallelNumbers:
    @pytest.mark.django_db(transaction=True)
    def test_two_parallel_writes_get_different_numbers(self, project, create_user):
        token = APIToken.objects.create(user=create_user, label="parallel", token=f"plane_api_{uuid4().hex}")
        barrier = threading.Barrier(2)
        results = []

        def write(title):
            client = APIClient()
            client.credentials(HTTP_X_API_KEY=token.token)
            try:
                barrier.wait(timeout=10)
                response = client.post(
                    _v1(project), {"title": title, "area": "zamowienia", "kind": "product"}, format="json"
                )
                results.append((response.status_code, response.json().get("number")))
            finally:
                connection.close()

        threads = [threading.Thread(target=write, args=(f"Równoległa {i}",)) for i in range(2)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(timeout=30)
        assert sorted(results) == [(201, 1), (201, 2)]
        assert DecisionSettings.objects.get(project=project).last_number == 2
