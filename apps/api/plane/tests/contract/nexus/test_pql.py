# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""PQL: the parser (no database) and the filters it compiles to (database)."""

from datetime import date, timedelta

import pytest
from django.utils import timezone

from plane.db.models import (
    Cycle,
    CycleIssue,
    IntakeIssue,
    Intake,
    Issue,
    IssueMention,
    IssueRelation,
    IssueSubscriber,
    IssueType,
    Module,
    ModuleIssue,
    User,
    WorkspaceMember,
)
from plane.nexus.models import WorkItemProperty, WorkItemPropertyOption, WorkItemPropertyValue
from plane.nexus.pql import (
    MAX_CONDITIONS,
    MAX_DEPTH,
    BoolOp,
    Compare,
    Not,
    PQLError,
    Predicate,
    apply_pql,
    parse_pql,
    pql_fields,
)

from .test_work_item_support import make_issue, make_label, make_state


# --------------------------------------------------------------------------- parser


@pytest.mark.unit
class TestParser:
    def test_simple_comparison(self):
        node = parse_pql('priority = "urgent"')
        assert (
            isinstance(node, Compare) and node.field == "priority" and node.op == "=" and node.value.value == "urgent"
        )

    def test_precedence_not_and_or(self):
        node = parse_pql('priority = "high" OR NOT stateGroup = "started" AND isOverdue()')
        assert isinstance(node, BoolOp) and node.op == "OR"
        right = node.children[1]
        assert isinstance(right, BoolOp) and right.op == "AND"
        assert isinstance(right.children[0], Not) and isinstance(right.children[1], Predicate)

    def test_parentheses_override_precedence(self):
        node = parse_pql('(priority = "high" OR priority = "low") AND isOverdue()')
        assert node.op == "AND" and node.children[0].op == "OR"

    def test_keywords_fields_and_functions_are_case_insensitive(self):
        node = parse_pql("PRIORITY in ('high','urgent') and stategroup In OPENSTATES() or isoverdue()")
        assert node.op == "OR" and node.children[0].children[0].field == "priority"
        assert node.children[0].children[1].value.name == "openStates"
        assert node.children[1].call.name == "isOverdue"

    @pytest.mark.parametrize(
        "pql, op",
        [
            ('stateGroup NOT IN ("completed", "cancelled")', "not in"),
            ("dueDate IS NULL", "is null"),
            ("assignee IS NOT NULL", "is not null"),
            ("label IS EMPTY", "is empty"),
            ("label IS NOT EMPTY", "is not empty"),
            ("dueDate BETWEEN (daysAgo(7), today())", "between"),
            ('dueDate BETWEEN "2024-01-01" AND "2024-02-01"', "between"),
            ('title ~ "capex"', "~"),
            ("createdAt >= startOfWeek()", ">="),
            ("updatedAt < daysAgo(30)", "<"),
            ('dueDate <= "2024-05-01"', "<="),
            ('dueDate > "2024-05-01"', ">"),
            ('priority != "none"', "!="),
        ],
    )
    def test_operators(self, pql, op):
        assert parse_pql(pql).op == op

    def test_between_and_does_not_split_the_query(self):
        node = parse_pql('dueDate BETWEEN "2024-01-01" AND "2024-02-01" AND priority = "high"')
        assert node.op == "AND" and len(node.children) == 2 and node.children[0].op == "between"

    def test_custom_property(self):
        node = parse_pql('cf["5f0c4d1e-8a39-4c1b-9a4e-0d1c2b3a4f5e"] IN ("5f0c4d1e-8a39-4c1b-9a4e-0d1c2b3a4f5f")')
        assert node.field == "cf" and node.property_id == "5f0c4d1e-8a39-4c1b-9a4e-0d1c2b3a4f5e" and node.op == "in"

    def test_single_quotes_and_escapes(self):
        assert parse_pql("title ~ 'it\\'s'").value.value == "it's"

    def test_numbers_and_booleans(self):
        assert parse_pql("isDraft = true").value.value is True
        assert parse_pql('cf["5f0c4d1e-8a39-4c1b-9a4e-0d1c2b3a4f5e"] >= -2.5').value.value == -2.5

    def test_predicate_spelled_as_boolean_field(self):
        node = parse_pql("isArchived() = false")
        assert isinstance(node, Compare) and node.field == "isArchived" and node.value.value is False

    def test_pql_fields(self):
        assert pql_fields('NOT isArchived() AND priority = "high" OR isDraft = true') == {
            "isArchived",
            "priority",
            "isDraft",
        }
        assert pql_fields("") == set() and pql_fields(None) == set()

    @pytest.mark.parametrize(
        "pql, fragment",
        [
            ("", "empty"),
            ("   ", "empty"),
            ('state__group = "started"', "Use stateGroup"),
            ('foo = "x"', "Unknown field 'foo'"),
            ('priority = "high" AND', "ends where a condition"),
            ('(priority = "high"', "Missing ')'"),
            ('priority = "high")', "Unbalanced ')'"),
            ('priority = "high" stateGroup = "started"', "Join conditions with AND or OR"),
            ("priority = high", "Unquoted value 'high'"),
            ('priority "high"', "Expected an operator after priority"),
            ('title ~ "unterminated', "Unterminated string"),
            ("dueDate < today() - 7", "no date arithmetic"),
            ("isOverdue(1)", "takes no arguments"),
            ("daysAgo()", "exactly one argument"),
            ('dueDate < daysAgo("7")', "whole number"),
            ("dueDate < daysAgo(-1)", "non-negative"),
            ("today()", "is a value, not a condition"),
            ('isOverdue() = "x"', "standalone condition"),
            ("foo()", "Unknown function 'foo()'"),
            ('wasEver(assignee, "x")', "history query"),
            ("childOf(5)", "quoted work item id"),
            ('cf["Priority"] = "x"', "UUID, not its name"),
            ("dueDate IS MISSING", "Expected NULL or EMPTY"),
            ('priority NOT "high"', "Expected IN after NOT"),
            ('priority IN "high"', "needs a list"),
            ("assignee = NULL", "IS NULL"),
            ('priority = "high" && isOverdue()', "use AND / OR"),
            ('dueDate BETWEEN "2024-01-01" "2024-02-01"', "needs AND"),
            ("()", "Empty parentheses"),
            ("AND isOverdue()", "has no condition before it"),
        ],
    )
    def test_errors_name_the_problem(self, pql, fragment):
        with pytest.raises(PQLError) as exc:
            parse_pql(pql)
        assert fragment in str(exc.value)

    def test_condition_limit(self):
        ok = " AND ".join(['priority = "high"'] * MAX_CONDITIONS)
        parse_pql(ok)
        with pytest.raises(PQLError, match="Too many conditions"):
            parse_pql(ok + " AND isOverdue()")

    def test_in_counts_as_one_condition(self):
        parse_pql(" AND ".join(['priority IN ("high","low","urgent","none")'] * MAX_CONDITIONS))

    @pytest.mark.parametrize(
        "pql, fragment",
        [
            ('título ~ "x"', "plain ASCII"),
            ("priority = ²", "plain ASCII"),
            ("(" * 1000 + 'priority = "high"' + ")" * 1000, "nests too deeply"),
            ("NOT " * 990 + 'priority = "high"', "nests too deeply"),
            ("dueDate > daysAgo(99999999)", "at most 10000"),
        ],
    )
    def test_hostile_input_is_an_error_not_a_crash(self, pql, fragment):
        with pytest.raises(PQLError) as exc:
            parse_pql(pql)
        assert fragment in str(exc.value)

    def test_nesting_up_to_the_limit_parses(self):
        parse_pql("(" * MAX_DEPTH + 'priority = "high"' + ")" * MAX_DEPTH)
        parse_pql("NOT " * MAX_DEPTH + 'priority = "high"')
        parse_pql('title ~ "título"')


# --------------------------------------------------------------------------- compiled filters


@pytest.fixture
def states(project):
    return {group: make_state(project, group) for group in ("backlog", "started", "completed", "cancelled")}


@pytest.fixture
def run(project, workspace, create_user):
    def run(pql, user=None, base=None):
        queryset = base if base is not None else Issue.objects.filter(project=project)
        return set(
            apply_pql(queryset, pql, user=user or create_user, workspace_slug=workspace.slug).values_list(
                "name", flat=True
            )
        )

    return run


@pytest.mark.contract
class TestFilters:
    def test_priority_state_group_and_boolean_logic(self, project, states, run):
        make_issue(project, "a", priority="high", state=states["started"])
        make_issue(project, "b", priority="low", state=states["completed"])
        make_issue(project, "c", priority="urgent", state=states["backlog"])
        assert run('priority = "high"') == {"a"}
        assert run('priority IN ("high", "urgent")') == {"a", "c"}
        assert run('priority NOT IN ("high", "urgent")') == {"b"}
        assert run('priority != "high"') == {"b", "c"}
        assert run("stateGroup IN openStates()") == {"a", "c"}
        assert run("stateGroup IN closedStates()") == {"b"}
        assert run("stateGroup = activeStates()") == {"a"}
        assert run('priority = "high" OR stateGroup = "completed"') == {"a", "b"}
        assert run('NOT (priority = "high" OR stateGroup = "completed")') == {"c"}
        assert run('priority = "low" OR priority = "urgent" AND stateGroup = "started"') == {"b"}

    def test_title_text_and_identifier(self, project, run):
        a = make_issue(project, "Capex review", description_html="<p>budget</p>")
        b = make_issue(project, "Other", description_html="<p>CAPEX note</p>")
        assert run('title ~ "capex"') == {"Capex review"}
        assert run('text ~ "capex"') == {"Capex review", "Other"}
        assert run('title = "other"') == {"Other"}
        ident = f"{project.identifier}-{a.sequence_id}"
        assert run(f'id = "{ident}"') == {"Capex review"}
        assert run(f'id = "{ident.lower()}"') == {"Capex review"}
        assert run(f'id IN ("{ident}", "{b.id}")') == {"Capex review", "Other"}
        assert run(f'id != "{ident}"') == {"Other"}
        assert run(f'id ~ "{project.identifier}"') == {"Capex review", "Other"}
        with pytest.raises(PQLError, match="work item id"):
            run('id = "capex"')

    def test_dates(self, project, run):
        today = timezone.now().date()
        make_issue(project, "overdue", target_date=today - timedelta(days=3), start_date=today - timedelta(days=9))
        make_issue(project, "due-soon", target_date=today + timedelta(days=2))
        make_issue(project, "undated")
        assert run("dueDate < today()") == {"overdue"}
        assert run("isOverdue()") == {"overdue"}
        assert run("dueDate IS NULL") == {"undated"}
        assert run("dueDate IS NOT NULL") == {"overdue", "due-soon"}
        assert run("dueDate BETWEEN (daysAgo(7), today())") == {"overdue"}
        assert run(f'dueDate = "{(today + timedelta(days=2)).isoformat()}"') == {"due-soon"}
        assert run("dueDate <= daysFromNow(2) AND dueDate >= today()") == {"due-soon"}
        assert run("hasStartAndDueDates()") == {"overdue"}
        assert run("dueDate < endOfYear() AND dueDate > startOfYear()") <= {"overdue", "due-soon"}
        with pytest.raises(PQLError, match="YYYY-MM-DD"):
            run('dueDate = "next week"')

    def test_datetime_against_whole_days(self, project, run):
        old = make_issue(project, "old")
        Issue.objects.filter(pk=old.pk).update(created_at=timezone.now() - timedelta(days=40))
        make_issue(project, "new")
        today = timezone.now().date().isoformat()
        assert run(f'createdAt = "{today}"') == {"new"}
        assert run(f'createdAt < "{today}"') == {"old"}
        assert run("createdAt >= startOfWeek()") == {"new"}
        assert run("createdAt < daysAgo(30)") == {"old"}
        assert run("createdAt < monthsAgo(1)") == {"old"}
        assert run("createdAt <= now() AND createdAt >= startOfDay()") == {"new"}
        assert run("updatedAt > weeksAgo(1)") == {"old", "new"}

    def test_people(self, project, workspace, run, create_user, make_user):
        other, _ = make_user(workspace=workspace)
        label = make_label(project)
        mine = make_issue(project, "mine", creator=create_user, assignees=[create_user], labels=[label])
        make_issue(project, "theirs", creator=other, assignees=[other])
        make_issue(project, "nobody's")
        assert run("assignee = currentUser()") == {"mine"}
        assert run("assignee IN currentUser()") == {"mine"}
        assert run(f'assignee IN ("{other.id}", "{create_user.id}")') == {"mine", "theirs"}
        assert run("assignee != currentUser()") == {"theirs", "nobody's"}
        assert run("hasNoAssignee()") == {"nobody's"}
        assert run("assignee IS EMPTY") == {"nobody's"}
        assert run("assignee IN workspaceMembers()") == {"mine", "theirs"}
        assert run(f'assignee IN membersOf("project:{project.id}")') == {"mine"}
        assert run("createdBy = currentUser()") == {"mine"}
        assert run(f'label = "{label.id}"') == {"mine"}
        assert run("hasNoLabel()") == {"theirs", "nobody's"}
        assert run("label IS NOT EMPTY") == {"mine"}
        IssueMention.objects.create(issue=mine, mention=other, project=project, workspace=workspace)
        IssueSubscriber.objects.create(issue=mine, subscriber=other, project=project, workspace=workspace)
        assert run(f'mention = "{other.id}"') == {"mine"}
        assert run(f'subscriber = "{other.id}"') == {"mine"}
        with pytest.raises(PQLError, match="needs a UUID"):
            run('assignee = "jane"')
        with pytest.raises(PQLError, match="not a user field"):
            run("state = currentUser()")
        with pytest.raises(PQLError, match="no teamspaces"):
            run('assignee IN membersOf("teamspace:5f0c4d1e-8a39-4c1b-9a4e-0d1c2b3a4f5e")')

    def test_removed_assignee_no_longer_matches(self, project, run, create_user):
        issue = make_issue(project, "x", assignees=[create_user])
        issue.issue_assignee.all().delete()
        assert run("assignee = currentUser()") == set()
        assert run("hasNoAssignee()") == {"x"}

    def test_uuid_fields(self, project, states, run):
        epic = IssueType.objects.create(name="Epic", workspace=project.workspace, is_epic=True)
        make_issue(project, "a", state=states["started"], type=epic)
        make_issue(project, "b", state=states["backlog"])
        assert run(f'state = "{states["started"].id}"') == {"a"}
        assert run(f'project = "{project.id}"') == {"a", "b"}
        assert run(f'type = "{epic.id}"') == {"a"}
        assert run("isEpic()") == {"a"}
        assert run("type IS NULL") == {"b"}
        with pytest.raises(PQLError, match="state does not support ~"):
            run(f'state ~ "{states["started"].id}"')
        with pytest.raises(PQLError, match="no teamspaces"):
            run(f'teamspaceProject = "{project.id}"')

    def test_cycles_and_modules(self, project, workspace, run, create_user):
        now = timezone.now()
        active = Cycle.objects.create(
            name="now",
            project=project,
            workspace=workspace,
            start_date=now - timedelta(days=1),
            end_date=now + timedelta(days=5),
            owned_by=create_user,
        )
        done = Cycle.objects.create(
            name="done",
            project=project,
            workspace=workspace,
            start_date=now - timedelta(days=20),
            end_date=now - timedelta(days=10),
            owned_by=create_user,
        )
        later = Cycle.objects.create(
            name="later",
            project=project,
            workspace=workspace,
            start_date=now + timedelta(days=10),
            end_date=now + timedelta(days=20),
            owned_by=create_user,
        )
        module = Module.objects.create(name="M", project=project, workspace=workspace)
        for cycle, name in ((active, "in-active"), (done, "in-done"), (later, "in-later")):
            issue = make_issue(project, name)
            CycleIssue.objects.create(cycle=cycle, issue=issue, project=project, workspace=workspace)
        ModuleIssue.objects.create(
            module=module, issue=Issue.objects.get(name="in-done"), project=project, workspace=workspace
        )
        assert run("cycle IN activeCycle()") == {"in-active"}
        assert run("cycle = activeCycle()") == {"in-active"}
        assert run("cycle IN completedCycles()") == {"in-done"}
        assert run("cycle IN upcomingCycles()") == {"in-later"}
        assert run(f'cycle = "{done.id}"') == {"in-done"}
        assert run(f'module = "{module.id}"') == {"in-done"}
        assert run("module IS NULL") == {"in-active", "in-later"}
        with pytest.raises(PQLError, match="returns cycles"):
            run("module IN activeCycle()")

    def test_hierarchy_and_relations(self, project, run):
        parent = make_issue(project, "parent")
        child = make_issue(project, "child", parent=parent)
        blocker = make_issue(project, "blocker")
        dup = make_issue(project, "dup")
        IssueRelation.objects.create(issue=child, related_issue=blocker, relation_type="blocked_by", project=project)
        IssueRelation.objects.create(issue=dup, related_issue=parent, relation_type="duplicate", project=project)
        IssueRelation.objects.create(issue=blocker, related_issue=dup, relation_type="relates_to", project=project)
        ident = lambda issue: f"{project.identifier}-{issue.sequence_id}"  # noqa: E731
        assert run("isTopLevel()") == {"parent", "blocker", "dup"}
        assert run("isSubWorkItem()") == {"child"}
        assert run("hasChildren()") == {"parent"}
        assert run(f'childOf("{ident(parent)}")') == {"child"}
        assert run(f'childOf("{parent.id}")') == {"child"}
        assert run(f'parentOf("{ident(child)}")') == {"parent"}
        assert run(f'blockedBy("{ident(blocker)}")') == {"child"}
        assert run(f'blocks("{ident(child)}")') == {"blocker"}
        assert run(f'duplicateOf("{ident(parent)}")') == {"dup"}
        assert run(f'duplicateOf("{ident(dup)}")') == {"parent"}
        assert run(f'linkedTo("{ident(dup)}")') == {"blocker"}
        with pytest.raises(PQLError, match="no work item"):
            run(f'childOf("{project.identifier}-999")')
        with pytest.raises(PQLError, match="Never a title"):
            run('childOf("the parent")')

    def test_draft_archived_intake(self, project, workspace, states, run):
        make_issue(project, "draft", is_draft=True)
        make_issue(project, "archived", archived_at=date.today(), state=states["completed"])
        triage = make_state(project, "triage", "Triage")
        intake = Intake.objects.create(name="Intake", project=project, workspace=workspace)
        IntakeIssue.objects.create(
            intake=intake, issue=make_issue(project, "intake", state=triage), project=project, workspace=workspace
        )
        make_issue(project, "normal")
        assert run("isDraft()") == {"draft"}
        assert run("isDraft = true") == {"draft"}
        assert run("isArchived()") == {"archived"}
        assert run("isArchived = false") == {"draft", "intake", "normal"}
        assert run("isIntake()") == {"intake"}

    def test_custom_properties(self, project, workspace, run):
        prop = WorkItemProperty.objects.create(workspace=workspace, display_name="Risk", property_type="OPTION")
        high = WorkItemPropertyOption.objects.create(workspace=workspace, property=prop, name="High")
        low = WorkItemPropertyOption.objects.create(workspace=workspace, property=prop, name="Low")
        num = WorkItemProperty.objects.create(workspace=workspace, display_name="Score", property_type="DECIMAL")
        flag = WorkItemProperty.objects.create(workspace=workspace, display_name="Flag", property_type="BOOLEAN")
        text = WorkItemProperty.objects.create(workspace=workspace, display_name="Note", property_type="TEXT")
        email = WorkItemProperty.objects.create(workspace=workspace, display_name="Mail", property_type="EMAIL")
        a, b = make_issue(project, "a"), make_issue(project, "b")
        make_issue(project, "c")

        def value(issue, prop, **kw):
            WorkItemPropertyValue.objects.create(workspace=workspace, project=project, issue=issue, property=prop, **kw)

        value(a, prop, value_option=high)
        value(b, prop, value_option=low)
        value(a, num, value_decimal=7)
        value(b, num, value_decimal=2)
        value(a, flag, value_boolean=True)
        value(b, text, value_text="Needs legal review")
        assert run(f'cf["{prop.id}"] = "{high.id}"') == {"a"}
        assert run(f'cf["{prop.id}"] IN ("{high.id}", "{low.id}")') == {"a", "b"}
        assert run(f'cf["{prop.id}"] != "{high.id}"') == {"b", "c"}
        assert run(f'cf["{prop.id}"] IS NULL') == {"c"}
        assert run(f'cf["{num.id}"] >= 5') == {"a"}
        assert run(f'cf["{num.id}"] BETWEEN 1 AND 3') == {"b"}
        assert run(f'cf["{flag.id}"] = true') == {"a"}
        assert run(f'cf["{text.id}"] ~ "legal"') == {"b"}
        with pytest.raises(PQLError, match="option or entity id"):
            run(f'cf["{prop.id}"] = "High"')
        with pytest.raises(PQLError, match="bare number"):
            run(f'cf["{num.id}"] = "7"')
        with pytest.raises(PQLError, match="cannot be filtered"):
            run(f'cf["{email.id}"] = "x@y.z"')
        with pytest.raises(PQLError, match="does not support ~"):
            run(f'cf["{prop.id}"] ~ "x"')
        with pytest.raises(PQLError, match="no such custom property"):
            run('cf["5f0c4d1e-8a39-4c1b-9a4e-0d1c2b3a4f5e"] = "x"')

    def test_invalid_enum_values(self, run):
        with pytest.raises(PQLError, match='Invalid priority "critical". Valid values: urgent, high'):
            run('priority = "critical"')
        with pytest.raises(PQLError, match="isIntake()"):
            run('stateGroup = "triage"')

    def test_operator_not_allowed_for_field(self, run):
        with pytest.raises(PQLError, match="priority does not support ~"):
            run('priority ~ "hi"')
        with pytest.raises(PQLError, match="isDraft takes unquoted true or false"):
            run('isDraft = "true"')

    def test_current_user_needs_a_user(self, project, workspace):
        with pytest.raises(PQLError, match="authenticated"):
            apply_pql(
                Issue.objects.filter(project=project),
                "assignee = currentUser()",
                user=None,
                workspace_slug=workspace.slug,
            )

    def test_user_timezone_shapes_today(self, project, run, create_user):
        create_user.user_timezone = "Pacific/Kiritimati"  # UTC+14: "today" is often tomorrow in UTC
        create_user.save()
        user = User.objects.get(pk=create_user.pk)
        make_issue(project, "x", target_date=timezone.now().astimezone().date() - timedelta(days=5))
        assert run("dueDate < today()", user=user) == {"x"}
        assert WorkspaceMember.objects.filter(member=user).exists()


@pytest.mark.contract
class TestFilterEdges:
    def test_dates_out_of_range_are_an_error(self, run):
        for pql in ('createdAt < "9999-12-31"', 'dueDate = "0001-01-01"'):
            with pytest.raises(PQLError, match="out of range"):
                run(pql)

    @pytest.mark.parametrize("tz", ["UTC", "America/New_York", "Pacific/Kiritimati"])
    def test_datetime_property_compares_the_stored_calendar_day(self, project, workspace, run, create_user, tz):
        from plane.nexus.views.work_item_type import _one_value

        prop = WorkItemProperty.objects.create(workspace=workspace, display_name="Go-live", property_type="DATETIME")
        for name, raw in (("jan31", "2024-01-31"), ("feb1", "2024-02-01"), ("noon", "2024-01-31 12:00:00")):
            issue = make_issue(project, name)
            WorkItemPropertyValue.objects.create(
                workspace=workspace, project=project, issue=issue, property=prop, **_one_value(prop, raw, issue)
            )
        create_user.user_timezone = tz
        create_user.save()
        user = User.objects.get(pk=create_user.pk)
        cf = f'cf["{prop.id}"]'
        assert run(f'{cf} = "2024-01-31"', user=user) == {"jan31", "noon"}
        assert run(f'{cf} > "2024-01-31"', user=user) == {"feb1"}
        assert run(f'{cf} BETWEEN "2024-02-01" AND "2024-02-01"', user=user) == {"feb1"}
        assert run(f'{cf} = "2024-01-31T12:00:00"', user=user) == {"noon"}
        assert run(f'{cf} < "2024-01-31T12:00:00"', user=user) == {"jan31"}
