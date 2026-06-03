# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.bgtasks.jira_import_task import JiraImporter
from plane.db.models import (
    ImportJob,
    Project,
    State,
    Cycle,
    CycleIssue,
    Issue,
    IssueComment,
    IssueLink,
    IssueLabel,
    IssueType,
    Module,
    ModuleIssue,
    IssueAssignee,
)
from plane.tests.factories import ProjectFactory, UserFactory, WorkspaceFactory, WorkspaceMemberFactory


def _issue(key, summary, status_name, status_cat, priority="High", parent=None):
    return {
        "key": key,
        "fields": {
            "summary": summary,
            "status": {"name": status_name, "statusCategory": {"key": status_cat}},
            "priority": {"name": priority},
            "assignee": {"accountId": "acc1"},
            "reporter": {"accountId": "acc1"},
            "creator": {"accountId": "acc1"},
            "labels": ["bug"],
            "components": [{"name": "API"}],
            "issuetype": {"name": "Task"},
            "duedate": "2024-02-01",
            "parent": {"key": parent} if parent else None,
            "issuelinks": [],
            "attachment": [{"filename": "a.png", "content": "https://acme.atlassian.net/a.png"}],
        },
        "renderedFields": {"description": f"<p>{summary} body</p>"},
    }


class FakeJiraClient:
    """Returns deterministic fixture data so the importer can run without network."""

    def board(self, board_id):
        return {"name": "Acme Board", "location": {"projectKey": "ACME", "projectName": "Acme"}}

    def board_projects(self, board_id):
        return [{"key": "ACME"}]

    def project(self, key):
        return {"name": "Acme", "key": "ACME", "components": [{"id": "1", "name": "API"}]}

    def epic_link_field_id(self):
        # Team-managed project: epic hierarchy uses fields.parent, not Epic Link.
        return None

    def assignable_users(self, key):
        return [{"accountId": "acc1", "displayName": "Ada", "emailAddress": "ada@acme.com"}]

    def project_statuses(self, key):
        return [
            {
                "statuses": [
                    {"id": "10", "name": "To Do", "statusCategory": {"key": "new"}},
                    {"id": "11", "name": "Done", "statusCategory": {"key": "done"}},
                ]
            }
        ]

    def priorities(self):
        return [{"id": "1", "name": "High"}]

    def sprints(self, board_id):
        return [
            {
                "id": 5,
                "name": "Sprint 1",
                "startDate": "2024-01-01T00:00:00.000Z",
                "endDate": "2024-01-14T00:00:00.000Z",
            }
        ]

    def sprint_issue_keys(self, sprint_id):
        return ["ACME-1"]

    def search_issues(self, jql, **kwargs):
        return [
            _issue("ACME-1", "First", "To Do", "new"),
            _issue("ACME-2", "Child", "Done", "done", parent="ACME-1"),
        ]

    def issue_comments(self, key):
        if key == "ACME-1":
            return [{"id": "100", "author": {"accountId": "acc1"}, "renderedBody": "<p>nice</p>"}]
        return []


def _make_job(db):
    user = UserFactory(email="ada@acme.com")
    workspace = WorkspaceFactory(owner=user)
    WorkspaceMemberFactory(workspace=workspace, member=user, role=20)
    return ImportJob.objects.create(
        workspace=workspace,
        source="jira",
        initiated_by=user,
        config={
            "domain": "acme.atlassian.net",
            "email": "ada@acme.com",
            "token": "secret",
            "board_id": 1,
            "user_import": "invite",
            "auto_create_states": True,
            "flags": {"components": True, "comments": True, "attachments": True, "links": True},
        },
    )


@pytest.mark.unit
class TestJiraImportEngine:
    def test_imports_project_states_issues_cycles(self, db):
        job = _make_job(db)
        report = JiraImporter(job, client=FakeJiraClient()).run()

        project = Project.objects.get(workspace=job.workspace, external_source="JIRA", external_id="ACME")
        assert project.name == "Acme"

        # States auto-created from Jira statuses (To Do new; Done reuses default "Done")
        assert State.objects.filter(project=project, name="To Do").exists()

        # Two work items imported
        assert Issue.all_objects.filter(project=project).count() == 2
        assert report["work_items"] == 2

        issue1 = Issue.all_objects.get(project=project, external_id="ACME-1")
        issue2 = Issue.all_objects.get(project=project, external_id="ACME-2")

        # reporter -> created_by
        assert issue1.created_by_id == job.initiated_by_id
        # priority mapping
        assert issue1.priority == "high"
        # status -> state mapping
        assert issue1.state.name == "To Do"
        # parent linkage (second pass)
        assert issue2.parent_id == issue1.id

        # cycle + membership
        cycle = Cycle.objects.get(project=project, external_id="5")
        assert cycle.name == "Sprint 1"
        assert CycleIssue.objects.filter(issue=issue1, cycle=cycle).exists()

        # label, component->module, assignee
        assert IssueLabel.objects.filter(issue=issue1).exists()
        module = Module.objects.get(project=project, name="API")
        assert ModuleIssue.objects.filter(issue=issue1, module=module).exists()
        assert IssueAssignee.objects.filter(issue=issue1, assignee_id=job.initiated_by_id).exists()

        # comment + attachment-as-link
        assert IssueComment.objects.filter(issue=issue1).count() == 1
        assert IssueLink.objects.filter(issue=issue1, url="https://acme.atlassian.net/a.png").exists()

    def test_rerun_is_idempotent(self, db):
        job = _make_job(db)
        JiraImporter(job, client=FakeJiraClient()).run()
        # Re-run with a fresh importer over the same job/workspace
        JiraImporter(job, client=FakeJiraClient()).run()

        project = Project.objects.get(workspace=job.workspace, external_source="JIRA", external_id="ACME")
        # No duplicate projects, issues, cycles, or comments
        assert Project.objects.filter(workspace=job.workspace, external_id="ACME").count() == 1
        assert Issue.all_objects.filter(project=project).count() == 2
        assert Cycle.objects.filter(project=project, external_id="5").count() == 1
        assert IssueComment.objects.filter(issue__project=project).count() == 1


class ClassicEpicFakeJiraClient:
    """A company-managed (classic) Jira project: stories link to epics via the
    Epic Link custom field rather than `fields.parent`."""

    EPIC_LINK = "customfield_10014"

    def board(self, board_id):
        return {"name": "Classic Board", "location": {"projectKey": "ACME"}}

    def board_projects(self, board_id):
        return [{"key": "ACME"}]

    def project(self, key):
        return {"name": "Acme", "key": "ACME", "components": []}

    def epic_link_field_id(self):
        return self.EPIC_LINK

    def project_statuses(self, key):
        return [{"statuses": [{"id": "10", "name": "To Do", "statusCategory": {"key": "new"}}]}]

    def priorities(self):
        return []

    def assignable_users(self, key):
        return []

    def sprints(self, board_id):
        return []

    def sprint_issue_keys(self, sprint_id):
        return []

    def _issue(self, key, summary, issue_type, epic_link=None):
        fields = {
            "summary": summary,
            "status": {"name": "To Do", "statusCategory": {"key": "new"}},
            "issuetype": {"name": issue_type},
            "parent": None,
        }
        if epic_link:
            fields[self.EPIC_LINK] = epic_link
        return {"key": key, "fields": fields, "renderedFields": {}}

    def search_issues(self, jql, **kwargs):
        return [
            self._issue("ACME-100", "Big epic", "Epic"),
            self._issue("ACME-101", "A story", "Story", epic_link="ACME-100"),
        ]

    def issue_comments(self, key):
        return []


@pytest.mark.unit
class TestJiraEpicLinkImport:
    def test_classic_epic_link_hierarchy_and_epic_type(self, db):
        user = UserFactory(email="ada@acme.com")
        workspace = WorkspaceFactory(owner=user)
        WorkspaceMemberFactory(workspace=workspace, member=user, role=20)
        project = ProjectFactory(workspace=workspace, name="Existing", is_issue_type_enabled=True)

        job = ImportJob.objects.create(
            workspace=workspace,
            source="jira",
            initiated_by=user,
            config={
                "domain": "acme.atlassian.net",
                "email": "ada@acme.com",
                "token": "secret",
                "board_id": 1,
                "user_import": "skip",
                "auto_create_states": True,
                "target": {"type": "existing", "project_id": str(project.id)},
                "flags": {"components": False, "comments": False, "attachments": False, "links": False},
            },
        )
        JiraImporter(job, client=ClassicEpicFakeJiraClient()).run()

        epic = Issue.all_objects.get(project=project, external_id="ACME-100")
        story = Issue.all_objects.get(project=project, external_id="ACME-101")

        # Story is linked under the epic via the Epic Link custom field
        assert story.parent_id == epic.id

        # An Epic work item type was created (is_epic) and applied to the epic
        assert IssueType.objects.filter(
            workspace=workspace, name="Epic", is_epic=True, project_issue_types__project=project
        ).exists()
        assert epic.type is not None and epic.type.is_epic is True
        assert story.type is not None and story.type.name == "Story" and story.type.is_epic is False
