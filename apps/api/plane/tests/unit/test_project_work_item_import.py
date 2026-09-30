# Copyright (c) 2026 Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date

import pytest

from plane.db.models import (
    Cycle,
    CycleIssue,
    Issue,
    IssueAssignee,
    IssueLabel,
    IssuePropertyValue,
    IssueRelation,
    IssueSequence,
    IssueSubscriber,
    IssueType,
    IssueTypeProperty,
    Label,
    Module,
    ModuleIssue,
    Project,
    ProjectIssueType,
    ProjectMember,
    State,
    User,
    WorkspaceMember,
)
from plane.utils.project_work_item_import import WorkItemImportOptions, import_work_items_into_project


def _project_with_state(workspace, user, name, identifier):
    project = Project.objects.create(
        name=name,
        identifier=identifier,
        workspace=workspace,
        created_by=user,
    )
    ProjectMember.objects.create(project=project, member=user, role=20, is_active=True)
    State.objects.create(
        name="Todo",
        color="#3B82F6",
        project=project,
        workspace=workspace,
        group="unstarted",
        sequence=10000,
        default=True,
        created_by=user,
    )
    return project


def _workspace_only_member(workspace, email, display_name):
    """A person the workspace knows but the project does not."""
    user = User.objects.create(email=email, username=email, display_name=display_name)
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15, is_active=True)
    return user


def _project_guest(workspace, project, email, display_name):
    """A person who belongs to the project, but only as a guest."""
    user = _workspace_only_member(workspace, email, display_name)
    ProjectMember.objects.create(project=project, member=user, role=5, is_active=True)
    return user


def _member_picker_property(workspace, project, user, title="Owner"):
    """A work item type with one member picker property, attached to the project."""
    issue_type = IssueType.objects.create(workspace=workspace, name="Task", created_by=user)
    ProjectIssueType.objects.create(
        project=project,
        workspace=workspace,
        issue_type=issue_type,
        created_by=user,
    )
    return IssueTypeProperty.objects.create(
        workspace=workspace,
        issue_type=issue_type,
        title=title,
        property_type="member_picker",
        select_mode="multi",
        created_by=user,
    )


@pytest.mark.django_db
class TestProjectWorkItemImport:
    def test_import_creates_issues_with_parent_links(self, workspace, create_user):
        project = Project.objects.create(
            name="Import WI",
            identifier="IWI",
            workspace=workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        State.objects.create(
            name="Todo",
            color="#3B82F6",
            project=project,
            workspace=workspace,
            group="unstarted",
            sequence=10000,
            default=True,
            created_by=create_user,
        )
        Label.objects.create(
            name="Bug",
            color="#EF4444",
            project=project,
            workspace=workspace,
            created_by=create_user,
        )

        result = import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "P1",
                    "name": "Parent",
                    "description_html": "<p>Parent</p>",
                    "state": "Todo",
                    "priority": "high",
                    "labels": ["Bug"],
                    "assignee_emails": [create_user.email],
                },
                {
                    "external_key": "C1",
                    "name": "Child",
                    "description_html": "plain text child",
                    "state": "Todo",
                    "priority": "low",
                    "parent_external_key": "P1",
                    "labels": [],
                    "assignee_emails": ["missing@example.com"],
                },
            ],
        )

        assert result["created_work_items"] == 2
        assert any("missing@example.com" in w and "skipped" in w for w in result["warnings"])

        parent = Issue.objects.get(project=project, name="Parent")
        assert IssueAssignee.objects.filter(issue=parent, assignee=create_user).exists()

        child = Issue.objects.get(project=project, name="Child")
        assert child.parent is not None
        assert child.parent.name == "Parent"
        assert child.description_html.startswith("<p>")
        assert not IssueAssignee.objects.filter(issue=child).exists()
        assert IssueSequence.objects.filter(project=project).count() == 2

    def test_unknown_assignee_email_does_not_fail_import(self, workspace, create_user):
        project = Project.objects.create(
            name="Unassigned WI",
            identifier="UNA",
            workspace=workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        State.objects.create(
            name="Todo",
            color="#3B82F6",
            project=project,
            workspace=workspace,
            group="unstarted",
            sequence=10000,
            default=True,
            created_by=create_user,
        )

        result = import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "A1",
                    "name": "Alone",
                    "state": "Todo",
                    "priority": "none",
                    "assignee_emails": ["nobody@example.com", "also-missing@example.com"],
                }
            ],
        )

        assert result["created_work_items"] == 1
        issue = Issue.objects.get(project=project, name="Alone")
        assert not IssueAssignee.objects.filter(issue=issue).exists()
        assert len([w for w in result["warnings"] if "is not a member of this workspace" in w]) == 2

    def test_duration_is_kept_consistent_with_the_dates(self, workspace, create_user):
        project = Project.objects.create(
            name="Duration WI",
            identifier="DUR",
            workspace=workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        State.objects.create(
            name="Todo",
            color="#3B82F6",
            project=project,
            workspace=workspace,
            group="unstarted",
            sequence=10000,
            default=True,
            created_by=create_user,
        )

        result = import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "D1",
                    "name": "Exported duration",
                    "state": "Todo",
                    "start_date": "2026-03-02",
                    "target_date": "2026-03-06",
                    "duration": 5,
                },
                {
                    "external_key": "D2",
                    "name": "Derived from dates",
                    "state": "Todo",
                    "start_date": "2026-03-02",
                    "target_date": "2026-03-04",
                },
                {
                    "external_key": "D3",
                    "name": "Derived target date",
                    "state": "Todo",
                    "start_date": "2026-03-02",
                    "duration": "4",
                },
                {
                    "external_key": "D4",
                    "name": "Standalone duration",
                    "state": "Todo",
                    "duration": 7,
                },
                {
                    "external_key": "D5",
                    "name": "Unreadable duration",
                    "state": "Todo",
                    "start_date": "2026-03-02",
                    "target_date": "2026-03-04",
                    "duration": "five days",
                },
            ],
        )

        assert result["created_work_items"] == 5
        assert Issue.objects.get(project=project, name="Exported duration").duration == 5

        derived = Issue.objects.get(project=project, name="Derived from dates")
        assert derived.duration == 3

        anchored = Issue.objects.get(project=project, name="Derived target date")
        assert anchored.duration == 4
        assert anchored.target_date == date(2026, 3, 5)

        standalone = Issue.objects.get(project=project, name="Standalone duration")
        assert standalone.duration == 7
        assert standalone.start_date is None
        assert standalone.target_date is None

        unreadable = Issue.objects.get(project=project, name="Unreadable duration")
        assert unreadable.duration == 3
        assert any("five days" in w for w in result["warnings"])


@pytest.mark.django_db
class TestWorkItemImportCreatesMissingEntities:
    def test_missing_labels_and_modules_are_created(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Fresh", "FRS")

        result = import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "FRS-1",
                    "name": "Needs a label",
                    "state": "Todo",
                    "labels": ["Nawozy", "Social media"],
                    "modules": ["Kampania wiosenna"],
                }
            ],
        )

        assert result["created_work_items"] == 1
        assert Label.objects.filter(project=project, name="Nawozy").exists()
        assert Label.objects.filter(project=project, name="Social media").exists()
        assert Module.objects.filter(project=project, name="Kampania wiosenna").exists()

        issue = Issue.objects.get(project=project, name="Needs a label")
        assert ModuleIssue.objects.filter(issue=issue).count() == 1
        assert any("label" in w for w in result["warnings"])

    def test_existing_label_is_reused_not_duplicated(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Reuse", "REU")
        Label.objects.create(name="Bug", color="#EF4444", project=project, workspace=workspace)

        import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[{"external_key": "R1", "name": "One", "state": "Todo", "labels": ["bug"]}],
        )

        assert Label.objects.filter(project=project, name__iexact="bug").count() == 1

    def test_missing_cycle_is_created_with_dates_from_its_work_items(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Cycles", "CYC")

        result = import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "C1",
                    "name": "Early",
                    "state": "Todo",
                    "cycles": ["Sprint 1"],
                    "start_date": "2026-03-02",
                    "target_date": "2026-03-06",
                },
                {
                    "external_key": "C2",
                    "name": "Late",
                    "state": "Todo",
                    "cycles": ["Sprint 1"],
                    "start_date": "2026-03-04",
                    "target_date": "2026-03-20",
                },
            ],
        )

        cycle = Cycle.objects.get(project=project, name="Sprint 1")
        assert cycle.start_date.date() == date(2026, 3, 2)
        assert cycle.end_date.date() == date(2026, 3, 20)
        assert CycleIssue.objects.filter(cycle=cycle).count() == 2
        assert any("Sprint 1" in w for w in result["warnings"])

    def test_cycle_without_dated_work_items_is_created_as_a_draft(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Draft cycle", "DRC")

        import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[{"external_key": "D1", "name": "No dates", "state": "Todo", "cycles": ["Backlog sprint"]}],
        )

        cycle = Cycle.objects.get(project=project, name="Backlog sprint")
        assert cycle.start_date is None
        assert cycle.end_date is None
        assert CycleIssue.objects.filter(cycle=cycle).count() == 1

    def test_existing_cycle_is_attached(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Has cycle", "HCY")
        Cycle.objects.create(name="Sprint 1", project=project, workspace=workspace, owned_by=create_user)

        import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[{"external_key": "C1", "name": "In cycle", "state": "Todo", "cycles": ["Sprint 1"]}],
        )

        issue = Issue.objects.get(project=project, name="In cycle")
        assert CycleIssue.objects.filter(issue=issue).count() == 1


@pytest.mark.django_db
class TestWorkItemImportPeople:
    def test_assignee_matches_by_full_name_not_only_display_name(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Names", "NAM")
        create_user.first_name = "Jan"
        create_user.last_name = "Kowalski"
        create_user.display_name = "jan.kowalski"
        create_user.save()

        import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[{"external_key": "N1", "name": "By full name", "state": "Todo", "assignees": ["Jan Kowalski"]}],
        )

        issue = Issue.objects.get(project=project, name="By full name")
        assert IssueAssignee.objects.filter(issue=issue, assignee=create_user).exists()

    def test_subscribers_are_imported(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Subs", "SUB")

        import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[{"external_key": "S1", "name": "Watched", "state": "Todo", "subscribers": [create_user.email]}],
        )

        issue = Issue.objects.get(project=project, name="Watched")
        assert IssueSubscriber.objects.filter(issue=issue, subscriber=create_user).exists()

    def test_assignee_outside_the_project_is_skipped_and_reported(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Outsiders", "OUT")
        outsider = _workspace_only_member(workspace, "outsider@example.com", "outsider")

        result = import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "O1",
                    "name": "Mixed assignees",
                    "state": "Todo",
                    "assignee_emails": [create_user.email, outsider.email],
                }
            ],
        )

        issue = Issue.objects.get(project=project, name="Mixed assignees")
        # The person who is a project member stays, the other one is dropped
        assert IssueAssignee.objects.filter(issue=issue, assignee=create_user).exists()
        assert not IssueAssignee.objects.filter(issue=issue, assignee=outsider).exists()
        assert any(outsider.email in w and "not to this project" in w for w in result["warnings"])

    def test_subscriber_outside_the_project_is_skipped(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Outsider subs", "OUS")
        outsider = _workspace_only_member(workspace, "watcher@example.com", "watcher")

        result = import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "O2",
                    "name": "Watched by an outsider",
                    "state": "Todo",
                    "subscriber_emails": [outsider.email],
                }
            ],
        )

        issue = Issue.objects.get(project=project, name="Watched by an outsider")
        assert not IssueSubscriber.objects.filter(issue=issue).exists()
        assert any(outsider.email in w and "not to this project" in w for w in result["warnings"])

    def test_assignee_outside_the_project_is_skipped_when_matched_by_name(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Outsider names", "OUN")
        outsider = _workspace_only_member(workspace, "byname@example.com", "Anna Nowak")

        result = import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[{"external_key": "O3", "name": "By name", "state": "Todo", "assignees": ["Anna Nowak"]}],
        )

        issue = Issue.objects.get(project=project, name="By name")
        assert not IssueAssignee.objects.filter(issue=issue, assignee=outsider).exists()
        assert any("Anna Nowak" in w and "not to this project" in w for w in result["warnings"])

    def test_assignee_who_left_the_project_is_skipped(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Left", "LFT")
        former = _workspace_only_member(workspace, "former@example.com", "former")
        ProjectMember.objects.create(project=project, member=former, role=15, is_active=False)

        result = import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[{"external_key": "O4", "name": "Old owner", "state": "Todo", "assignee_emails": [former.email]}],
        )

        issue = Issue.objects.get(project=project, name="Old owner")
        assert not IssueAssignee.objects.filter(issue=issue).exists()
        assert any(former.email in w and "not to this project" in w for w in result["warnings"])

    def test_guest_is_not_assigned_and_is_reported(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Guests", "GST")
        guest = _project_guest(workspace, project, "guest@example.com", "guest")

        result = import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[{"external_key": "G1", "name": "For a guest", "state": "Todo", "assignee_emails": [guest.email]}],
        )

        issue = Issue.objects.get(project=project, name="For a guest")
        assert not IssueAssignee.objects.filter(issue=issue).exists()
        assert any(guest.email in w and "guest" in w for w in result["warnings"])

    def test_guest_is_dropped_but_a_member_on_the_same_row_is_kept(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Mixed", "MIX")
        guest = _project_guest(workspace, project, "mixedguest@example.com", "mixed guest")

        import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "M1",
                    "name": "Two people",
                    "state": "Todo",
                    "assignee_emails": [guest.email, create_user.email],
                }
            ],
        )

        issue = Issue.objects.get(project=project, name="Two people")
        assigned = list(IssueAssignee.objects.filter(issue=issue).values_list("assignee_id", flat=True))
        assert assigned == [create_user.id]

    def test_guest_can_still_be_a_subscriber(self, workspace, create_user):
        """Plane lets guests follow a work item, it only refuses to assign them."""
        project = _project_with_state(workspace, create_user, "Watching", "WCH")
        guest = _project_guest(workspace, project, "watcher-guest@example.com", "watching guest")

        import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "W1",
                    "name": "Followed by a guest",
                    "state": "Todo",
                    "subscriber_emails": [guest.email],
                }
            ],
        )

        issue = Issue.objects.get(project=project, name="Followed by a guest")
        assert IssueSubscriber.objects.filter(issue=issue, subscriber=guest).exists()

    def test_member_picker_property_drops_people_outside_the_project(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Picker", "PCK")
        outsider = _workspace_only_member(workspace, "picked@example.com", "picked")
        issue_type = IssueType.objects.create(workspace=workspace, name="Task", created_by=create_user)
        ProjectIssueType.objects.create(
            project=project,
            workspace=workspace,
            issue_type=issue_type,
            created_by=create_user,
        )
        prop = IssueTypeProperty.objects.create(
            workspace=workspace,
            issue_type=issue_type,
            title="Owner",
            property_type="member_picker",
            select_mode="multi",
            created_by=create_user,
        )

        result = import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "P1",
                    "name": "With owner",
                    "state": "Todo",
                    "issue_type": "Task",
                    "custom_properties": {"Owner": [create_user.email, outsider.email]},
                }
            ],
        )

        issue = Issue.objects.get(project=project, name="With owner")
        value = IssuePropertyValue.objects.get(issue=issue, property=prop)
        assert value.value == [str(create_user.id)]
        assert any(outsider.email in w and "not a member of this project" in w for w in result["warnings"])

    def test_member_picker_property_drops_guests(self, workspace, create_user):
        """The member dropdown never offers a guest, so an import must not write one either."""
        project = _project_with_state(workspace, create_user, "Picker guests", "PKG")
        guest = _project_guest(workspace, project, "picked-guest@example.com", "picked guest")
        prop = _member_picker_property(workspace, project, create_user)

        result = import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "PG1",
                    "name": "Owned by a guest",
                    "state": "Todo",
                    "issue_type": "Task",
                    "custom_properties": {"Owner": [guest.email, create_user.email]},
                }
            ],
        )

        issue = Issue.objects.get(project=project, name="Owned by a guest")
        value = IssuePropertyValue.objects.get(issue=issue, property=prop)
        assert value.value == [str(create_user.id)]
        assert any(guest.email in w and "cannot be picked" in w for w in result["warnings"])

    def test_member_picker_property_accepts_an_id_in_any_case(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Picker ids", "PKI")
        prop = _member_picker_property(workspace, project, create_user)

        result = import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "PI1",
                    "name": "Owned by id",
                    "state": "Todo",
                    "issue_type": "Task",
                    "custom_properties": {"Owner": [str(create_user.id).upper()]},
                }
            ],
        )

        issue = Issue.objects.get(project=project, name="Owned by id")
        value = IssuePropertyValue.objects.get(issue=issue, property=prop)
        assert value.value == [str(create_user.id)]
        assert not any("not a member of this project" in w for w in result["warnings"])


@pytest.mark.django_db
class TestWorkItemImportRelations:
    def test_mirrored_relation_is_stored_on_the_canonical_side(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Relations", "REL")

        import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "REL-1",
                    "name": "Blocker",
                    "state": "Todo",
                    "relations": [{"type": "blocking", "issue": "REL-2"}],
                },
                {"external_key": "REL-2", "name": "Blocked", "state": "Todo"},
            ],
        )

        blocker = Issue.objects.get(project=project, name="Blocker")
        blocked = Issue.objects.get(project=project, name="Blocked")
        relation = IssueRelation.objects.get(project=project)

        assert relation.relation_type == "blocked_by"
        assert relation.issue_id == blocked.id
        assert relation.related_issue_id == blocker.id

    def test_relation_written_on_both_sides_creates_one_row(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Both", "BTH")

        import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "BTH-1",
                    "name": "First",
                    "state": "Todo",
                    "relations": [{"type": "blocked_by", "issue": "BTH-2"}],
                },
                {
                    "external_key": "BTH-2",
                    "name": "Second",
                    "state": "Todo",
                    "relations": [{"type": "blocking", "issue": "BTH-1"}],
                },
            ],
        )

        assert IssueRelation.objects.filter(project=project).count() == 1

    def test_symmetric_relation_is_not_duplicated(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Symmetric", "SYM")

        import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "SYM-1",
                    "name": "First",
                    "state": "Todo",
                    "relations": [{"type": "relates_to", "issue": "SYM-2"}],
                },
                {
                    "external_key": "SYM-2",
                    "name": "Second",
                    "state": "Todo",
                    "relations": [{"type": "relates_to", "issue": "SYM-1"}],
                },
            ],
        )

        assert IssueRelation.objects.filter(project=project).count() == 1

    def test_relation_to_an_existing_work_item_is_resolved(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Existing", "EXI")
        import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[{"external_key": "EXI-1", "name": "Already here", "state": "Todo"}],
        )
        first = Issue.objects.get(project=project, name="Already here")

        import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "EXI-2",
                    "name": "Newcomer",
                    "state": "Todo",
                    "relations": [{"type": "relates_to", "issue": f"EXI-{first.sequence_id}"}],
                }
            ],
        )

        assert IssueRelation.objects.filter(project=project).count() == 1


@pytest.mark.django_db
class TestWorkItemImportDates:
    def test_unreadable_date_is_reported_and_does_not_break_the_import(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Dates", "DAT")

        result = import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "D1",
                    "name": "Bad date",
                    "state": "Todo",
                    "start_date": "01.03.2026",
                }
            ],
        )

        assert result["created_work_items"] == 1
        assert Issue.objects.get(project=project, name="Bad date").start_date is None
        assert any("01.03.2026" in w for w in result["warnings"])


class TestWorkItemImportOptionsParsing:
    def test_missing_fields_leave_everything_on(self):
        options = WorkItemImportOptions.from_request_data({})

        assert options == WorkItemImportOptions()
        assert all(options.as_dict().values())

    def test_form_strings_are_read(self):
        options = WorkItemImportOptions.from_request_data(
            {"assignees": "false", "relations": "0", "labels": "no", "cycles": "off"}
        )

        assert not options.assignees
        assert not options.relations
        assert not options.labels
        assert not options.cycles
        assert options.subscribers
        assert options.dates

    def test_unreadable_values_keep_the_option_on(self):
        options = WorkItemImportOptions.from_request_data({"assignees": "", "relations": "maybe", "dates": None})

        assert options.assignees
        assert options.relations
        assert options.dates


@pytest.mark.django_db
class TestWorkItemImportOptions:
    def test_assignees_and_subscribers_can_be_left_out(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "No people", "NOP")

        result = import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "N1",
                    "name": "Nobody",
                    "state": "Todo",
                    "assignee_emails": [create_user.email],
                    "subscriber_emails": [create_user.email],
                }
            ],
            options=WorkItemImportOptions(assignees=False, subscribers=False),
        )

        issue = Issue.objects.get(project=project, name="Nobody")
        assert not IssueAssignee.objects.filter(issue=issue).exists()
        assert not IssueSubscriber.objects.filter(issue=issue).exists()
        assert any("assignee data" in w for w in result["warnings"])
        assert any("subscriber data" in w for w in result["warnings"])

    def test_people_written_as_names_are_counted_as_left_out(self, workspace, create_user):
        """A file may name people instead of listing e-mails; the summary must still see them."""
        project = _project_with_state(workspace, create_user, "Named people", "NMP")

        result = import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "NM1",
                    "name": "Named",
                    "state": "Todo",
                    "assignee_names": [create_user.display_name],
                    "subscriber_names": [create_user.display_name],
                }
            ],
            options=WorkItemImportOptions(assignees=False, subscribers=False),
        )

        assert any("assignee data" in w for w in result["warnings"])
        assert any("subscriber data" in w for w in result["warnings"])

    def test_relations_can_be_left_out(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "No relations", "NOR")

        import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "NOR-1",
                    "name": "Blocker",
                    "state": "Todo",
                    "relations": [{"type": "blocking", "issue": "NOR-2"}],
                },
                {"external_key": "NOR-2", "name": "Blocked", "state": "Todo"},
            ],
            options=WorkItemImportOptions(relations=False),
        )

        assert Issue.objects.filter(project=project).count() == 2
        assert not IssueRelation.objects.filter(project=project).exists()

    def test_parents_can_be_left_out(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "No parents", "NPA")

        import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {"external_key": "P1", "name": "Parent", "state": "Todo"},
                {"external_key": "C1", "name": "Child", "state": "Todo", "parent_external_key": "P1"},
            ],
            options=WorkItemImportOptions(parents=False),
        )

        assert Issue.objects.get(project=project, name="Child").parent is None

    def test_dates_can_be_left_out(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "No dates", "NDA")

        import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "D1",
                    "name": "Dated",
                    "state": "Todo",
                    "start_date": "2026-03-02",
                    "target_date": "2026-03-06",
                    "duration": 5,
                }
            ],
            options=WorkItemImportOptions(dates=False),
        )

        issue = Issue.objects.get(project=project, name="Dated")
        assert issue.start_date is None
        assert issue.target_date is None
        assert issue.duration is None

    def test_labels_are_neither_attached_nor_created_when_left_out(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "No labels", "NLA")

        import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[{"external_key": "L1", "name": "Plain", "state": "Todo", "labels": ["Nawozy"]}],
            options=WorkItemImportOptions(labels=False),
        )

        issue = Issue.objects.get(project=project, name="Plain")
        assert not Label.objects.filter(project=project).exists()
        assert not IssueLabel.objects.filter(issue=issue).exists()

    def test_modules_are_neither_attached_nor_created_when_left_out(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "No modules", "NMO")

        import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[{"external_key": "M1", "name": "Plain", "state": "Todo", "modules": ["Kampania wiosenna"]}],
            options=WorkItemImportOptions(modules=False),
        )

        issue = Issue.objects.get(project=project, name="Plain")
        assert not Module.objects.filter(project=project).exists()
        assert not ModuleIssue.objects.filter(issue=issue).exists()

    def test_cycles_are_neither_attached_nor_created_when_left_out(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "No cycles", "NCY")

        import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "C1",
                    "name": "Plain",
                    "state": "Todo",
                    "cycles": ["Sprint 1"],
                    "start_date": "2026-03-02",
                }
            ],
            options=WorkItemImportOptions(cycles=False),
        )

        issue = Issue.objects.get(project=project, name="Plain")
        assert not Cycle.objects.filter(project=project).exists()
        assert not CycleIssue.objects.filter(issue=issue).exists()

    def test_cycle_is_created_as_a_draft_when_dates_are_left_out(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Draft only", "DFO")

        result = import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {
                    "external_key": "C1",
                    "name": "Dated but cycled",
                    "state": "Todo",
                    "cycles": ["Sprint 1"],
                    "start_date": "2026-03-02",
                    "target_date": "2026-03-06",
                }
            ],
            options=WorkItemImportOptions(dates=False),
        )

        cycle = Cycle.objects.get(project=project, name="Sprint 1")
        assert cycle.start_date is None
        assert cycle.end_date is None
        assert CycleIssue.objects.filter(cycle=cycle).count() == 1
        assert any("without a period" in w for w in result["warnings"])

    def test_left_out_data_is_reported_once_per_kind(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Counted", "CNT")

        result = import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[
                {"external_key": f"K{index}", "name": f"Item {index}", "state": "Todo", "labels": ["Nawozy"]}
                for index in range(3)
            ],
            options=WorkItemImportOptions(labels=False),
        )

        label_warnings = [w for w in result["warnings"] if "label data" in w]
        assert len(label_warnings) == 1
        assert label_warnings[0].startswith("3 work item(s)")

    def test_rows_without_the_left_out_data_are_not_counted(self, workspace, create_user):
        project = _project_with_state(workspace, create_user, "Uncounted", "UNC")

        result = import_work_items_into_project(
            project=project,
            user=create_user,
            rows=[{"external_key": "U1", "name": "Nothing to drop", "state": "Todo"}],
            options=WorkItemImportOptions(labels=False, relations=False, dates=False),
        )

        assert not [w for w in result["warnings"] if "asked to leave out" in w]
