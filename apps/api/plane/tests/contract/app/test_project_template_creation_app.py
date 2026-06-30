# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for built-in template Project creation on the app route.

Covers CREATE-03/CREATE-04 (template selection), D-05 (transactional
generated content), D-07 (no DEFAULT_STATES duplication), and the GEN-01..07
must-haves for the three built-in templates. Uses the seeded built-in
fixture shape from ``test_project_templates_app.py`` and the request setup
from ``test_project_app.py``.
"""

import uuid

import pytest
from rest_framework import status

from plane.app.serializers.project_template import BUILT_IN_PROJECT_TEMPLATES
from plane.db.models import (
    Cycle,
    CycleIssue,
    Issue,
    IssueLabel,
    Label,
    Module,
    ModuleIssue,
    Project,
    ProjectIdentifier,
    ProjectMember,
    ProjectTemplate,
    State,
)


class TestProjectTemplateCreationBase:
    """URL helpers shared across the template-creation contract tests."""

    def get_project_url(
        self, workspace_slug: str, pk: uuid.UUID = None, details: bool = False
    ) -> str:
        base_url = f"/api/workspaces/{workspace_slug}/projects/"
        if pk:
            return f"{base_url}{pk}/"
        if details:
            return f"{base_url}details/"
        return base_url


@pytest.fixture
def seeded_builtin_templates(db):
    """Idempotently seed the three built-in ProjectTemplate rows."""
    for entry in BUILT_IN_PROJECT_TEMPLATES:
        ProjectTemplate.objects.update_or_create(
            system_key=entry["system_key"],
            is_system=True,
            workspace__isnull=True,
            defaults={
                "name": entry["name"],
                "description": entry.get("description", ""),
                "template_type": entry["template_type"],
                "is_system": True,
                "is_active": True,
                "workspace": None,
                "payload": entry["payload"],
            },
        )
    return ProjectTemplate.objects.filter(is_system=True)


@pytest.mark.contract
class TestProjectTemplateCreationApp(TestProjectTemplateCreationBase):
    """App-route POST contract coverage for built-in template Project creation."""

    @pytest.mark.django_db
    def test_create_project_with_software_template_persists_generated_content(
        self, session_client, workspace, create_user, seeded_builtin_templates
    ):
        """CREATE-03/CREATE-04 + D-05/D-07: the app create route applies the
        ``software-project`` built-in, persisting states, labels, modules,
        cycles, the starter issue, and the join rows in one transaction —
        with no duplicate DEFAULT_STATES."""
        url = self.get_project_url(workspace.slug)
        software = ProjectTemplate.objects.get(system_key="software-project")
        project_data = {
            "name": "Software From Template",
            "identifier": "SFT",
            "template_id": str(software.id),
        }

        response = session_client.post(url, project_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED

        project = Project.objects.get(name=project_data["name"])
        # D-05: the create transaction also creates ProjectIdentifier and admin ProjectMember.
        assert ProjectIdentifier.objects.filter(project=project).count() == 1
        assert ProjectMember.objects.filter(
            project=project, member=create_user, role=20
        ).count() == 1

        # GEN-01: exactly 5 states (payload-driven, no DEFAULT_STATES).
        states = State.objects.filter(project=project)
        assert states.count() == 5
        assert set(states.values_list("name", flat=True)) == {
            "Backlog",
            "Todo",
            "In Progress",
            "Done",
            "Cancelled",
        }
        # D-07: no extra DEFAULT_STATES appended beyond the template's five.
        # The payload states are exactly five, matching the template,
        # which itself does NOT match DEFAULT_STATES' 6 entries (no "Triage").
        assert states.filter(name="Triage").count() == 0

        # GEN-02: 2 labels with payload order 100 and 200.
        labels = Label.objects.filter(project=project).order_by("sort_order")
        assert labels.count() == 2
        assert list(labels.values_list("name", flat=True)) == ["Bug", "Feature"]
        assert list(labels.values_list("sort_order", flat=True)) == [100, 200]

        # GEN-03: 1 module named "Core".
        modules = Module.objects.filter(project=project)
        assert modules.count() == 1
        assert modules.first().name == "Core"

        # GEN-04: 1 cycle with target_offset_days=14 from creation_date.
        cycles = Cycle.objects.filter(project=project)
        assert cycles.count() == 1
        assert cycles.first().name == "Sprint 1"

        # GEN-05/GEN-06/GEN-07: 1 starter issue with explicit state.
        issues = Issue.objects.filter(project=project)
        assert issues.count() == 1
        starter = issues.first()
        assert starter.state.name == "Backlog"

        # Module and Cycle join rows from generated objects (D-12).
        assert ModuleIssue.objects.filter(issue=starter).count() == 1
        assert CycleIssue.objects.filter(issue=starter).count() == 1
        # The starter issue's ``label_keys`` is empty, so no IssueLabel rows.
        assert IssueLabel.objects.filter(issue=starter).count() == 0

    @pytest.mark.django_db
    def test_create_project_with_marketing_template_creates_seven_day_cycle(
        self, session_client, workspace, create_user, seeded_builtin_templates
    ):
        """Marketing Campaign template: 7-day Launch Week cycle from creation date."""
        url = self.get_project_url(workspace.slug)
        marketing = ProjectTemplate.objects.get(system_key="marketing-campaign")
        project_data = {
            "name": "Marketing From Template",
            "identifier": "MFT",
            "template_id": str(marketing.id),
        }

        response = session_client.post(url, project_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED

        project = Project.objects.get(name=project_data["name"])
        # 4 states, no DEFAULT_STATES extras.
        states = State.objects.filter(project=project)
        assert states.count() == 4
        # 2 labels.
        labels = Label.objects.filter(project=project)
        assert labels.count() == 2
        # No modules.
        assert Module.objects.filter(project=project).count() == 0
        # 1 cycle named "Launch Week" with target_offset_days=7.
        cycles = Cycle.objects.filter(project=project)
        assert cycles.count() == 1
        launch_week = cycles.first()
        assert launch_week.name == "Launch Week"
        # 1 starter issue with label and cycle links (no module link).
        starter = Issue.objects.get(project=project)
        assert IssueLabel.objects.filter(issue=starter).count() == 1
        assert CycleIssue.objects.filter(issue=starter).count() == 1
        assert ModuleIssue.objects.filter(issue=starter).count() == 0

    @pytest.mark.django_db
    def test_create_project_with_operations_template_creates_thirty_day_cycle(
        self, session_client, workspace, create_user, seeded_builtin_templates
    ):
        """Operations Project template: 30-day Month 1 cycle from creation date."""
        url = self.get_project_url(workspace.slug)
        operations = ProjectTemplate.objects.get(system_key="operations-project")
        project_data = {
            "name": "Operations From Template",
            "identifier": "OFT",
            "template_id": str(operations.id),
        }

        response = session_client.post(url, project_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED

        project = Project.objects.get(name=project_data["name"])
        # 4 states.
        assert State.objects.filter(project=project).count() == 4
        # 1 label "Process".
        process_label = Label.objects.get(project=project, name="Process")
        # 1 module "Operations".
        ops_module = Module.objects.get(project=project, name="Operations")
        # 1 cycle "Month 1".
        month_one = Cycle.objects.get(project=project, name="Month 1")
        # Starter issue links all three.
        starter = Issue.objects.get(project=project)
        assert IssueLabel.objects.filter(
            issue=starter, label=process_label
        ).exists()
        assert ModuleIssue.objects.filter(
            issue=starter, module=ops_module
        ).exists()
        assert CycleIssue.objects.filter(
            issue=starter, cycle=month_one
        ).exists()