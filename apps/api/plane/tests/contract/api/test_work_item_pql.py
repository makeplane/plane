# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""PQL filtering (``?pql=``) on the v1 project, cycle and module work item lists."""

import datetime
from uuid import uuid4

import pytest
from freezegun import freeze_time
from rest_framework import status

from plane.db.models import (
    APIToken,
    Cycle,
    CycleIssue,
    IntakeIssue,
    Intake,
    Issue,
    IssueAssignee,
    IssueLabel,
    IssueRelation,
    IssueType,
    Label,
    Module,
    ModuleIssue,
    Project,
    ProjectMember,
    State,
    User,
    WorkspaceMember,
)


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="Pql", identifier="PQL", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20, is_active=True)
    return project


@pytest.fixture
def states(project, workspace):
    return {
        group: State.objects.create(name=group, project=project, workspace=workspace, group=group)
        for group in ("backlog", "unstarted", "started", "completed", "cancelled")
    }


@pytest.fixture
def make_issue(project, workspace, states, create_user):
    def _make(name, group="backlog", **kwargs):
        issue = Issue(name=name, project=project, workspace=workspace, state=states[group], **kwargs)
        issue.save(created_by_id=create_user.id)
        return issue

    return _make


def _list_url(workspace, project):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/work-items/"


@pytest.fixture
def query(api_key_client, workspace, project):
    def _query(pql, url=None):
        return api_key_client.get(url or _list_url(workspace, project), {"pql": pql})

    return _query


def names(response):
    assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
    return sorted(row["name"] for row in response.data["results"])


def assert_pql_error(response, fragment=None):
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert list(response.data.keys()) == ["pql"]
    assert isinstance(response.data["pql"], str) and response.data["pql"]
    if fragment:
        assert fragment in response.data["pql"]


def _member(workspace, project, name):
    user = User.objects.create(email=f"{name}-{uuid4().hex[:6]}@plane.so", username=f"{name}{uuid4().hex[:6]}")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
    ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=15, is_active=True)
    return user


@pytest.mark.contract
@pytest.mark.django_db
class TestScalarFields:
    def test_no_pql_returns_everything(self, api_key_client, workspace, project, make_issue):
        make_issue("a")
        make_issue("b")
        response = api_key_client.get(_list_url(workspace, project))
        assert names(response) == ["a", "b"]

    def test_priority_and_state_group(self, query, make_issue):
        make_issue("hi", "started", priority="high")
        make_issue("lo", "completed", priority="low")
        make_issue("none", "started")
        assert names(query('priority = "high"')) == ["hi"]
        assert names(query('priority != "high"')) == ["lo", "none"]
        assert names(query('priority IN ("high", "low")')) == ["hi", "lo"]
        assert names(query('stateGroup = "completed"')) == ["lo"]
        assert names(query("stateGroup IN openStates()")) == ["hi", "none"]
        assert names(query("stateGroup IN closedStates()")) == ["lo"]
        assert names(query("stateGroup IN activeStates()")) == ["hi", "none"]
        assert names(query('stateGroup NOT IN ("started")')) == ["lo"]

    def test_state_project_type_created_by(self, query, make_issue, states, project, create_user):
        make_issue("a", "started")
        make_issue("b", "completed")
        assert names(query(f'state = "{states["started"].id}"')) == ["a"]
        assert names(query(f'state != "{states["started"].id}"')) == ["b"]
        assert names(query(f'project = "{project.id}"')) == ["a", "b"]
        assert names(query(f'project = "{uuid4()}"')) == []
        assert names(query(f'createdBy = "{create_user.id}"')) == ["a", "b"]
        assert names(query(f'type = "{uuid4()}"')) == []

    def test_title_text_id(self, query, make_issue):
        make_issue("Fix Login bug")
        other = make_issue("Other")
        Issue.objects.filter(pk=other.pk).update(description_stripped="login page copy")
        assert names(query('title ~ "login"')) == ["Fix Login bug"]
        assert names(query('title = "other"')) == ["Other"]
        assert names(query('text ~ "login"')) == ["Fix Login bug", "Other"]
        assert names(query('id = "PQL-1"')) == ["Fix Login bug"]
        assert names(query('id = "pql-2"')) == ["Other"]
        assert names(query('id ~ "PQ"')) == ["Fix Login bug", "Other"]
        assert names(query('id ~ "ZZ"')) == []

    def test_draft_and_archived_flags_respect_endpoint_base_filters(self, query, make_issue):
        make_issue("live")
        assert names(query("isDraft = false")) == ["live"]
        assert names(query("isDraft()")) == []
        assert names(query("isArchived()")) == []
        assert names(query("isArchived = false")) == ["live"]

    def test_dates(self, query, make_issue):
        make_issue("due1", target_date=datetime.date(2025, 3, 10), start_date=datetime.date(2025, 3, 1))
        make_issue("due2", target_date=datetime.date(2025, 3, 20))
        make_issue("nodate")
        assert names(query('dueDate = "2025-03-10"')) == ["due1"]
        assert names(query('dueDate > "2025-03-10"')) == ["due2"]
        assert names(query('dueDate >= "2025-03-10"')) == ["due1", "due2"]
        assert names(query('dueDate BETWEEN "2025-03-01" AND "2025-03-15"')) == ["due1"]
        assert names(query('dueDate BETWEEN ("2025-03-15", "2025-03-31")')) == ["due2"]
        assert names(query("dueDate IS NULL")) == ["nodate"]
        assert names(query("dueDate IS NOT NULL")) == ["due1", "due2"]
        assert names(query('startDate <= "2025-03-01"')) == ["due1"]
        assert names(query("hasStartAndDueDates()")) == ["due1"]

    @freeze_time("2025-03-12 12:00:00")
    def test_date_functions(self, query, make_issue):
        make_issue("past", target_date=datetime.date(2025, 3, 5))
        make_issue("today", target_date=datetime.date(2025, 3, 12))
        make_issue("week_end", target_date=datetime.date(2025, 3, 16))
        make_issue("next_month", target_date=datetime.date(2025, 4, 12))
        make_issue("last_month", target_date=datetime.date(2025, 2, 12))
        assert names(query("dueDate = today()")) == ["today"]
        assert names(query("dueDate < today()")) == ["last_month", "past"]
        assert names(query("dueDate = daysAgo(7)")) == ["past"]
        assert names(query("dueDate = daysFromNow(0)")) == ["today"]
        assert names(query("dueDate BETWEEN (startOfWeek(), endOfWeek())")) == ["today", "week_end"]
        assert names(query("dueDate = endOfWeek()")) == ["week_end"]
        assert names(query("dueDate = monthsFromNow(1)")) == ["next_month"]
        assert names(query("dueDate = monthsAgo(1)")) == ["last_month"]
        assert names(query("dueDate = weeksAgo(1)")) == ["past"]
        assert names(query("dueDate = weeksFromNow(0)")) == ["today"]
        assert names(query("dueDate >= startOfMonth() AND dueDate <= endOfMonth()")) == [
            "past",
            "today",
            "week_end",
        ]
        assert names(query("dueDate < startOfYear()")) == []
        assert names(query("dueDate <= endOfYear()")) == ["last_month", "next_month", "past", "today", "week_end"]
        assert names(query("isOverdue()")) == ["last_month", "past"]

    @freeze_time("2025-03-12 12:00:00")
    def test_is_overdue_ignores_closed_states(self, query, make_issue):
        make_issue("open", "started", target_date=datetime.date(2025, 3, 5))
        make_issue("closed", "completed", target_date=datetime.date(2025, 3, 5))
        assert names(query("isOverdue()")) == ["open"]

    def test_created_at_uses_user_timezone_day_boundaries(self, query, make_issue, create_user):
        create_user.user_timezone = "Asia/Tokyo"
        create_user.save(update_fields=["user_timezone"])
        # 2025-03-10 16:00 UTC is 2025-03-11 01:00 in Tokyo.
        late = make_issue("late")
        early = make_issue("early")
        Issue.objects.filter(pk=late.pk).update(
            created_at=datetime.datetime(2025, 3, 10, 16, 0, tzinfo=datetime.timezone.utc)
        )
        Issue.objects.filter(pk=early.pk).update(
            created_at=datetime.datetime(2025, 3, 10, 14, 0, tzinfo=datetime.timezone.utc)
        )
        assert names(query('createdAt = "2025-03-11"')) == ["late"]
        assert names(query('createdAt = "2025-03-10"')) == ["early"]
        assert names(query('createdAt >= "2025-03-11"')) == ["late"]
        assert names(query('createdAt < "2025-03-11"')) == ["early"]
        assert names(query('createdAt BETWEEN "2025-03-10" AND "2025-03-11"')) == ["early", "late"]

    @freeze_time("2025-03-12 12:00:00")
    def test_updated_at_functions(self, query, make_issue):
        old = make_issue("old")
        make_issue("fresh")
        Issue.objects.filter(pk=old.pk).update(
            updated_at=datetime.datetime(2025, 1, 1, 0, 0, tzinfo=datetime.timezone.utc)
        )
        assert names(query("updatedAt < daysAgo(30)")) == ["old"]
        assert names(query("updatedAt >= startOfDay()")) == ["fresh"]
        assert names(query("updatedAt <= now()")) == ["fresh", "old"]

    def test_logic_and_precedence(self, query, make_issue):
        make_issue("a", priority="high", target_date=datetime.date(2025, 1, 1))
        make_issue("b", priority="low", target_date=datetime.date(2025, 1, 1))
        make_issue("c", priority="high")
        assert names(query('priority = "high" AND dueDate IS NULL')) == ["c"]
        assert names(query('priority = "low" OR priority = "high" AND dueDate IS NULL')) == ["b", "c"]
        assert names(query('(priority = "low" OR priority = "high") AND dueDate IS NULL')) == ["c"]
        assert names(query('NOT priority = "high"')) == ["b"]
        assert names(query('NOT (priority = "high" OR priority = "low")')) == []


@pytest.mark.contract
@pytest.mark.django_db
class TestToManyFields:
    def test_label_set_semantics(self, query, make_issue, project, workspace):
        red = Label.objects.create(name="red", project=project, workspace=workspace)
        blue = Label.objects.create(name="blue", project=project, workspace=workspace)
        both = make_issue("both")
        only_red = make_issue("only_red")
        make_issue("none")
        for issue, label in ((both, red), (both, blue), (only_red, red)):
            IssueLabel.objects.create(issue=issue, label=label, project=project, workspace=workspace)

        assert names(query(f'label = "{red.id}"')) == ["both", "only_red"]
        assert names(query(f'label != "{red.id}"')) == ["none"]
        assert names(query(f'label != "{blue.id}"')) == ["none", "only_red"]
        assert names(query(f'label IN ("{red.id}", "{blue.id}")')) == ["both", "only_red"]
        assert names(query(f'label NOT IN ("{red.id}", "{blue.id}")')) == ["none"]
        assert names(query("label IS EMPTY")) == ["none"]
        assert names(query("label IS NOT EMPTY")) == ["both", "only_red"]
        assert names(query("hasNoLabel()")) == ["none"]
        assert names(query(f'label = "{red.id}" AND label = "{blue.id}"')) == ["both"]

    def test_no_duplicate_rows_for_multiple_matches(self, query, make_issue, project, workspace):
        red = Label.objects.create(name="red", project=project, workspace=workspace)
        blue = Label.objects.create(name="blue", project=project, workspace=workspace)
        issue = make_issue("both")
        for label in (red, blue):
            IssueLabel.objects.create(issue=issue, label=label, project=project, workspace=workspace)
        response = query(f'label IN ("{red.id}", "{blue.id}")')
        assert names(response) == ["both"]
        assert response.data["total_results"] == 1

    def test_soft_deleted_rows_are_ignored(self, query, make_issue, project, workspace):
        red = Label.objects.create(name="red", project=project, workspace=workspace)
        issue = make_issue("a")
        row = IssueLabel.objects.create(issue=issue, label=red, project=project, workspace=workspace)
        assert names(query(f'label = "{red.id}"')) == ["a"]
        row.delete()
        assert names(query(f'label = "{red.id}"')) == []
        assert names(query("label IS EMPTY")) == ["a"]
        assert names(query("hasNoLabel()")) == ["a"]

    def test_assignee_and_current_user(self, query, make_issue, project, workspace, create_user):
        other = _member(workspace, project, "other")
        mine = make_issue("mine")
        theirs = make_issue("theirs")
        shared = make_issue("shared")
        make_issue("unassigned")
        for issue, user in ((mine, create_user), (theirs, other), (shared, create_user), (shared, other)):
            IssueAssignee.objects.create(issue=issue, assignee=user, project=project, workspace=workspace)

        assert names(query("assignee = currentUser()")) == ["mine", "shared"]
        assert names(query("assignee != currentUser()")) == ["theirs", "unassigned"]
        assert names(query(f'assignee = "{other.id}"')) == ["shared", "theirs"]
        assert names(query(f'assignee NOT IN ("{other.id}")')) == ["mine", "unassigned"]
        assert names(query("assignee IS EMPTY")) == ["unassigned"]
        assert names(query("assignee IS NULL")) == ["unassigned"]
        assert names(query("assignee IS NOT NULL")) == ["mine", "shared", "theirs"]
        assert names(query("hasNoAssignee()")) == ["unassigned"]
        assert names(query("assignee IN workspaceMembers()")) == ["mine", "shared", "theirs"]
        assert names(query(f'assignee IN membersOf("project:{project.id}")')) == ["mine", "shared", "theirs"]
        assert names(query("assignee = currentUser() AND NOT assignee = currentUser()")) == []

    def test_cycle_module_mention_subscriber(self, query, make_issue, project, workspace, create_user):
        from plane.db.models import IssueMention, IssueSubscriber

        cycle = Cycle.objects.create(name="c", project=project, workspace=workspace, owned_by=create_user)
        module = Module.objects.create(name="m", project=project, workspace=workspace)
        a = make_issue("a")
        make_issue("b")
        CycleIssue.objects.create(issue=a, cycle=cycle, project=project, workspace=workspace)
        ModuleIssue.objects.create(issue=a, module=module, project=project, workspace=workspace)
        IssueMention.objects.create(issue=a, mention=create_user, project=project, workspace=workspace)
        IssueSubscriber.objects.create(issue=a, subscriber=create_user, project=project, workspace=workspace)
        assert names(query(f'cycle = "{cycle.id}"')) == ["a"]
        assert names(query(f'cycle != "{cycle.id}"')) == ["b"]
        assert names(query(f'module = "{module.id}"')) == ["a"]
        assert names(query(f'module != "{module.id}"')) == ["b"]
        assert names(query(f'mention = "{create_user.id}"')) == ["a"]
        assert names(query(f'subscriber = "{create_user.id}"')) == ["a"]
        assert names(query("cycle IS EMPTY")) == ["b"]

    @freeze_time("2025-03-12 12:00:00")
    def test_cycle_functions(self, query, make_issue, project, workspace, create_user):
        def cycle(name, start, end):
            return Cycle.objects.create(
                name=name,
                project=project,
                workspace=workspace,
                owned_by=create_user,
                start_date=datetime.datetime.fromisoformat(start).replace(tzinfo=datetime.timezone.utc),
                end_date=datetime.datetime.fromisoformat(end).replace(tzinfo=datetime.timezone.utc),
            )

        for issue_name, c in (
            ("in_active", cycle("active", "2025-03-10", "2025-03-20")),
            ("in_done", cycle("done", "2025-02-01", "2025-02-14")),
            ("in_next", cycle("next", "2025-04-01", "2025-04-14")),
        ):
            CycleIssue.objects.create(issue=make_issue(issue_name), cycle=c, project=project, workspace=workspace)
        assert names(query("cycle IN activeCycle()")) == ["in_active"]
        assert names(query("cycle IN completedCycles()")) == ["in_done"]
        assert names(query("cycle IN upcomingCycles()")) == ["in_next"]


@pytest.mark.contract
@pytest.mark.django_db
class TestPredicates:
    def test_hierarchy_predicates(self, query, make_issue, project, workspace):
        parent = make_issue("parent")
        make_issue("child", parent=parent)
        make_issue("loner")
        assert names(query("isTopLevel()")) == ["loner", "parent"]
        assert names(query("isSubWorkItem()")) == ["child"]
        assert names(query("hasChildren()")) == ["parent"]
        assert names(query('childOf("PQL-1")')) == ["child"]
        assert names(query(f'childOf("{parent.id}")')) == ["child"]
        assert names(query('parentOf("PQL-2")')) == ["parent"]
        assert names(query('parentOf("PQL-3")')) == []

    def test_is_epic(self, query, make_issue, project, workspace):
        epic_type = IssueType.objects.create(name="Epic", workspace=workspace, is_epic=True)
        make_issue("epic", type=epic_type)
        make_issue("task")
        assert names(query("isEpic()")) == ["epic"]
        assert names(query(f'type = "{epic_type.id}"')) == ["epic"]

    def test_is_intake(self, query, make_issue, project, workspace):
        intake = Intake.objects.create(name="i", project=project, workspace=workspace)
        triaged = make_issue("triaged")
        make_issue("plain")
        IntakeIssue.objects.create(intake=intake, issue=triaged, project=project, workspace=workspace)
        assert names(query("isIntake()")) == ["triaged"]


@pytest.mark.contract
@pytest.mark.django_db
class TestRelationFunctions:
    def _relate(self, project, workspace, issue, related, relation_type):
        IssueRelation.objects.create(
            issue=issue, related_issue=related, relation_type=relation_type, project=project, workspace=workspace
        )

    def test_blocked_by_and_blocks_directions(self, query, make_issue, project, workspace):
        x = make_issue("X")
        y = make_issue("Y")
        make_issue("Z")
        # Row (issue=X, related=Y, blocked_by): X is blocked by Y.
        self._relate(project, workspace, x, y, "blocked_by")
        assert names(query('blockedBy("PQL-2")')) == ["X"]
        assert names(query('blockedBy("PQL-1")')) == []
        assert names(query('blocks("PQL-1")')) == ["Y"]
        assert names(query('blocks("PQL-2")')) == []
        assert names(query(f'blocks("{x.id}")')) == ["Y"]

    def test_linked_to_and_duplicate_of_both_directions(self, query, make_issue, project, workspace):
        a = make_issue("A")
        b = make_issue("B")
        c = make_issue("C")
        self._relate(project, workspace, a, b, "relates_to")
        self._relate(project, workspace, c, a, "duplicate")
        assert names(query('linkedTo("PQL-1")')) == ["B"]
        assert names(query('linkedTo("PQL-2")')) == ["A"]
        assert names(query('duplicateOf("PQL-1")')) == ["C"]
        assert names(query('duplicateOf("PQL-3")')) == ["A"]

    def test_soft_deleted_relation_ignored(self, query, make_issue, project, workspace):
        x = make_issue("X")
        y = make_issue("Y")
        self._relate(project, workspace, x, y, "blocked_by")
        IssueRelation.objects.filter(issue=x).first().delete()
        assert names(query('blockedBy("PQL-2")')) == []

    def test_unknown_or_malformed_reference_is_400(self, query):
        assert_pql_error(query('childOf("PQL-99")'))
        assert_pql_error(query('childOf("nonsense")'))
        assert_pql_error(query(f'childOf("{uuid4()}")'))
        assert_pql_error(query('linkedTo("")'))


@pytest.mark.contract
@pytest.mark.django_db
class TestErrors:
    @pytest.mark.parametrize(
        "pql",
        [
            "priority =",
            'priority = "high" AND',
            "((priority",
            'priority = "bogus"',
            "priority = 5",
            'stateGroup = "nope"',
            'assignee = "not-a-uuid"',
            'label = "not-a-uuid"',
            "isDraft = 1",
            'dueDate = "tomorrow"',
            'dueDate = "2025-13-45"',
            'unknownField = "x"',
            "today()",
            "dueDate = daysAgo(x)",
            'id = "nodash"',
            "title ~ 5",
            'priority > "high"',
            "assignee IN activeCycle()",
            'membersOf("teamspace:abc")',
            "title ~ 'unterminated",
            "priority = 'high' & 1",
            "",
        ],
    )
    def test_invalid_queries_return_pql_body(self, query, pql):
        response = query(pql)
        if pql == "":
            # An empty parameter means "no filter".
            assert response.status_code == status.HTTP_200_OK
            return
        assert_pql_error(response)

    def test_error_message_has_position(self, query):
        response = query('priority = "high" AND @')
        assert_pql_error(response, "position")

    def test_too_many_conditions(self, query):
        pql = " AND ".join(['priority = "high"'] * 6)
        assert_pql_error(query(pql), "5")
        assert query(" AND ".join(['priority = "high"'] * 5)).status_code == status.HTTP_200_OK

    def test_in_and_between_count_as_one_condition(self, query):
        pql = (
            'priority IN ("high","low") AND dueDate BETWEEN ("2025-01-01", "2025-02-01") '
            "AND stateGroup IN openStates() AND isOverdue() AND hasNoLabel()"
        )
        assert query(pql).status_code == status.HTTP_200_OK

    def test_query_too_long(self, query):
        assert_pql_error(query('title ~ "' + "a" * 2000 + '"'), "2000")

    def test_nesting_too_deep(self, query):
        pql = "(" * 11 + 'priority = "high"' + ")" * 11
        assert_pql_error(query(pql), "nesting")
        pql = "(" * 10 + 'priority = "high"' + ")" * 10
        assert query(pql).status_code == status.HTTP_200_OK

    @pytest.mark.parametrize(
        "pql,fragment",
        [
            (f'milestone = "{uuid4()}"', "milestone is not available on this edition"),
            (f'teamspaceProject = "{uuid4()}"', "teamspaceProject is not available on this edition"),
            (f'cf["{uuid4()}"] = "x"', "is not available on this edition"),
            ('wasEver(priority, "high")', "is not available on this edition"),
            ('priority = "high" AND changedFrom("state", "a")', "is not available on this edition"),
        ],
    )
    def test_unavailable_fields(self, query, pql, fragment):
        assert_pql_error(query(pql), fragment)

    def test_structured_filters_param_still_rejected(self, api_key_client, workspace, project):
        response = api_key_client.get(_list_url(workspace, project), {"filters": "{}"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "pql" in response.data


@pytest.mark.contract
@pytest.mark.django_db
class TestScopeAndVisibility:
    def test_cannot_reach_other_project_even_by_project_clause(
        self, query, make_issue, workspace, create_user, project
    ):
        make_issue("mine")
        other = Project.objects.create(name="Oth", identifier="OTH", workspace=workspace, created_by=create_user)
        ProjectMember.objects.create(project=other, member=create_user, workspace=workspace, role=20, is_active=True)
        state = State.objects.create(name="s", project=other, workspace=workspace, group="started")
        Issue.objects.create(name="foreign", project=other, workspace=workspace, state=state)
        assert names(query(f'project = "{other.id}"')) == []
        assert names(query(f'project = "{other.id}" OR project = "{project.id}"')) == ["mine"]
        assert names(query('id ~ "OTH"')) == []
        assert names(query('id = "OTH-1"')) == []
        assert names(query('NOT priority = "urgent"')) == ["mine"]

    def test_relation_target_in_unreadable_project_looks_missing(
        self, query, make_issue, workspace, create_user, project
    ):
        make_issue("mine")
        stranger = User.objects.create(email=f"s-{uuid4().hex[:6]}@plane.so", username=uuid4().hex[:8])
        WorkspaceMember.objects.create(workspace=workspace, member=stranger, role=20)
        hidden = Project.objects.create(name="Hid", identifier="HID", workspace=workspace, created_by=stranger)
        ProjectMember.objects.create(project=hidden, member=stranger, workspace=workspace, role=20, is_active=True)
        hidden_issue = Issue.objects.create(name="hidden", project=hidden, workspace=workspace)
        assert_pql_error(query('childOf("HID-1")'), "not found")
        assert_pql_error(query(f'childOf("{hidden_issue.id}")'), "not found")

    def test_members_of_foreign_project_looks_missing(self, query, workspace):
        stranger = User.objects.create(email=f"s-{uuid4().hex[:6]}@plane.so", username=uuid4().hex[:8])
        WorkspaceMember.objects.create(workspace=workspace, member=stranger, role=20)
        hidden = Project.objects.create(name="Hid", identifier="HID", workspace=workspace, created_by=stranger)
        ProjectMember.objects.create(project=hidden, member=stranger, workspace=workspace, role=20, is_active=True)
        assert_pql_error(query(f'assignee IN membersOf("project:{hidden.id}")'), "not found")
        assert_pql_error(query(f'assignee IN membersOf("project:{uuid4()}")'), "not found")

    def test_restricted_guest_pql_cannot_widen(self, api_client, workspace, project, states, create_user):
        guest = User.objects.create(email=f"g-{uuid4().hex[:6]}@plane.so", username=uuid4().hex[:8])
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5)
        ProjectMember.objects.create(project=project, member=guest, workspace=workspace, role=5, is_active=True)
        token = APIToken.objects.create(user=guest, label="guest")
        api_client.credentials(HTTP_X_API_KEY=token.token)

        own = Issue(name="own", project=project, workspace=workspace, state=states["started"])
        own.save(created_by_id=guest.id)
        foreign = Issue(name="foreign", project=project, workspace=workspace, state=states["started"])
        foreign.save(created_by_id=create_user.id)

        url = _list_url(workspace, project)
        assert names(api_client.get(url, {"pql": 'stateGroup = "started"'})) == ["own"]
        assert names(api_client.get(url, {"pql": f'createdBy = "{create_user.id}"'})) == []
        assert names(api_client.get(url, {"pql": 'NOT title = "zzz"'})) == ["own"]
        assert names(api_client.get(url, {"pql": 'title = "foreign" OR title ~ "own"'})) == ["own"]
        assert_pql_error(api_client.get(url, {"pql": f'childOf("{foreign.id}")'}), "not found")

    def test_restricted_guest_has_children_ignores_hidden_children(
        self, api_client, workspace, project, states, create_user
    ):
        guest = User.objects.create(email=f"g-{uuid4().hex[:6]}@plane.so", username=uuid4().hex[:8])
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5)
        ProjectMember.objects.create(project=project, member=guest, workspace=workspace, role=5, is_active=True)
        token = APIToken.objects.create(user=guest, label="guest")
        api_client.credentials(HTTP_X_API_KEY=token.token)

        parent = Issue(name="parent", project=project, workspace=workspace, state=states["started"])
        parent.save(created_by_id=guest.id)
        child = Issue(name="child", project=project, workspace=workspace, state=states["started"], parent=parent)
        child.save(created_by_id=create_user.id)

        url = _list_url(workspace, project)
        assert names(api_client.get(url, {"pql": "hasChildren()"})) == []
        assert names(api_client.get(url, {"pql": "NOT hasChildren()"})) == ["parent"]

    def test_external_id_lookup_applies_pql(self, api_key_client, workspace, project, make_issue):
        make_issue("ext", priority="low", external_id="e1", external_source="src")
        url = _list_url(workspace, project)
        params = {"external_id": "e1", "external_source": "src"}
        assert api_key_client.get(url, {**params, "pql": 'priority = "low"'}).status_code == status.HTTP_200_OK
        assert api_key_client.get(url, {**params, "pql": 'priority = "high"'}).status_code == status.HTTP_404_NOT_FOUND
        assert_pql_error(api_key_client.get(url, {**params, "pql": "priority ="}))

    def test_non_member_cannot_list(self, api_client, workspace, project):
        outsider = User.objects.create(email=f"x-{uuid4().hex[:6]}@plane.so", username=uuid4().hex[:8])
        token = APIToken.objects.create(user=outsider, label="out")
        api_client.credentials(HTTP_X_API_KEY=token.token)
        response = api_client.get(_list_url(workspace, project), {"pql": "isDraft = false"})
        assert response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)


@pytest.mark.contract
@pytest.mark.django_db
class TestCycleAndModuleLists:
    def test_cycle_issues_accept_pql(self, api_key_client, workspace, project, make_issue, create_user):
        cycle = Cycle.objects.create(name="c", project=project, workspace=workspace, owned_by=create_user)
        for issue in (make_issue("hi", priority="high"), make_issue("lo", priority="low")):
            CycleIssue.objects.create(issue=issue, cycle=cycle, project=project, workspace=workspace)
        make_issue("outside", priority="high")
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/cycles/{cycle.id}/cycle-issues/"
        assert names(api_key_client.get(url, {"pql": 'priority = "high"'})) == ["hi"]
        assert names(api_key_client.get(url)) == ["hi", "lo"]
        assert_pql_error(api_key_client.get(url, {"pql": "priority ="}))
        assert_pql_error(api_key_client.get(url, {"pql": f'milestone = "{uuid4()}"'}), "not available")

    def test_module_issues_accept_pql(self, api_key_client, workspace, project, make_issue):
        module = Module.objects.create(name="m", project=project, workspace=workspace)
        for issue in (make_issue("hi", priority="high"), make_issue("lo", priority="low")):
            ModuleIssue.objects.create(issue=issue, module=module, project=project, workspace=workspace)
        make_issue("outside", priority="high")
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/modules/{module.id}/module-issues/"
        assert names(api_key_client.get(url, {"pql": 'priority = "high"'})) == ["hi"]
        assert_pql_error(api_key_client.get(url, {"pql": "priority ="}))
