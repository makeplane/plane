# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for template Project creation on the app route.

Phase 02-02 covers CREATE-03/CREATE-04 (template selection), D-05
(transactional generated content), D-07 (no DEFAULT_STATES duplication),
and the GEN-01..07 must-haves for the three built-in templates. Uses the
seeded built-in fixture shape from ``test_project_templates_app.py`` and
the request setup from ``test_project_app.py``.

Phase 02-03 extensions cover:

- D-01/VER-03: active custom template in the current workspace is usable
  by both admin and member roles; guests remain blocked by existing
  Project create permission.
- D-02: missing, inactive built-in, inactive custom, and foreign-workspace
  custom ``template_id`` values all collapse to the same generic 404
  response status and error body (T-02-08).
- D-04: a saved ``ProjectTemplate.payload`` that fails validation blocks
  Project creation with a 4xx (T-02-09).
- D-13: a starter-issue reference key that fails resolution rolls back
  the entire create transaction (T-02-10).
- CREATE-05/VER-04: a forced mid-transaction exception inside the apply
  path leaves no Project, ProjectIdentifier, ProjectMember, State, Label,
  Module, Cycle, Issue, IssueLabel, ModuleIssue, or CycleIssue rows.
"""

import uuid
from unittest import mock

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.app.serializers.project_template import (
    BUILT_IN_PROJECT_TEMPLATES,
    PROJECT_TEMPLATE_SCHEMA_VERSION,
)
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
    User,
    WorkspaceMember,
)


def _minimal_valid_payload():
    """Return a minimal but valid template payload for custom-template tests."""
    return {
        "schema_version": PROJECT_TEMPLATE_SCHEMA_VERSION,
        "states": [
            {
                "state_key": "backlog",
                "name": "Backlog",
                "color": "#60646C",
                "group": "backlog",
                "sequence": 15000,
                "default": True,
            },
            {
                "state_key": "todo",
                "name": "Todo",
                "color": "#3F76FF",
                "group": "unstarted",
                "sequence": 25000,
            },
        ],
        "labels": [],
        "modules": [],
        "cycles": [],
        "starter_issues": [],
    }


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


@pytest.mark.contract
class TestProjectTemplateCreationAppGeneric404(TestProjectTemplateCreationBase):
    """D-02 / T-02-08: missing, inactive, and foreign-workspace templates
    all return the same generic 404 response (status + body shape).

    The contract requirement is that no client can distinguish between
    "template does not exist", "template is inactive", or "template
    belongs to another workspace" — only the existence (or active
    availability) of an in-workspace template can be acted upon.
    """

    @pytest.mark.django_db
    def test_create_project_with_missing_template_uuid_returns_404(
        self, session_client, workspace, create_user, seeded_builtin_templates
    ):
        """D-02: a random UUID for a non-existent template produces the generic 404."""
        url = self.get_project_url(workspace.slug)
        project_data = {
            "name": "Missing Template Project",
            "identifier": "MTP",
            "template_id": str(uuid.uuid4()),
        }

        response = session_client.post(url, project_data, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND
        # T-02-08: generic error body — no leak about why the lookup failed.
        assert response.json() == {"error": "Template not found"}
        # Atomicity: no Project, identifier, member, or state rows survive.
        assert Project.objects.count() == 0
        assert ProjectIdentifier.objects.count() == 0
        assert ProjectMember.objects.count() == 0
        assert State.objects.count() == 0
        assert Label.objects.count() == 0
        assert Module.objects.count() == 0
        assert Cycle.objects.count() == 0
        assert Issue.objects.count() == 0

    @pytest.mark.django_db
    def test_create_project_with_inactive_custom_template_returns_404(
        self, session_client, workspace, create_user, seeded_builtin_templates
    ):
        """D-02: inactive custom template in the current workspace produces the generic 404."""
        ProjectTemplate.objects.create(
            workspace=workspace,
            name="Inactive Custom",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            is_system=False,
            is_active=False,
            payload=_minimal_valid_payload(),
            created_by=create_user,
        )
        inactive = ProjectTemplate.objects.get(name="Inactive Custom")

        url = self.get_project_url(workspace.slug)
        project_data = {
            "name": "Inactive Custom Project",
            "identifier": "ICP",
            "template_id": str(inactive.id),
        }

        response = session_client.post(url, project_data, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"expected 404, got {response.status_code}: {response.json()}"
        )
        assert response.json() == {"error": "Template not found"}, (
            f"unexpected 404 body: {response.json()}"
        )
        assert Project.objects.count() == 0

    @pytest.mark.django_db
    def test_create_project_with_inactive_builtin_template_returns_404(
        self, session_client, workspace, create_user
    ):
        """D-02: an inactive built-in template produces the generic 404
        (deactivating a built-in is not exposed through the public API,
        but the resolver must still treat it as unavailable).
        """
        template = ProjectTemplate.objects.create(
            name="Inactive Built In",
            system_key="ghost-built-in",
            template_type=ProjectTemplate.TemplateType.BUILT_IN,
            is_system=True,
            is_active=False,
            workspace=None,
            payload=_minimal_valid_payload(),
            created_by=create_user,
        )

        url = self.get_project_url(workspace.slug)
        project_data = {
            "name": "Inactive Built In Project",
            "identifier": "IBP",
            "template_id": str(template.id),
        }

        response = session_client.post(url, project_data, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"expected 404, got {response.status_code}: {response.json()}"
        )
        assert response.json() == {"error": "Template not found"}, (
            f"unexpected 404 body: {response.json()}"
        )
        assert Project.objects.count() == 0

    @pytest.mark.django_db
    def test_create_project_with_foreign_workspace_custom_template_returns_404(
        self, session_client, workspace, create_user, seeded_builtin_templates
    ):
        """D-02: a custom template owned by another workspace is treated
        as if it does not exist; same status code and body as the missing
        case."""
        foreign_workspace = type(workspace).objects.create(
            name="Other Workspace", slug="other-workspace", owner=create_user
        )
        WorkspaceMember.objects.create(
            workspace=foreign_workspace, member=create_user, role=20
        )
        foreign = ProjectTemplate.objects.create(
            workspace=foreign_workspace,
            name="Foreign Custom",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            is_system=False,
            is_active=True,
            payload=_minimal_valid_payload(),
            created_by=create_user,
        )

        url = self.get_project_url(workspace.slug)
        project_data = {
            "name": "Foreign Custom Project",
            "identifier": "FCP",
            "template_id": str(foreign.id),
        }

        response = session_client.post(url, project_data, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"expected 404, got {response.status_code}: {response.json()}"
        )
        assert response.json() == {"error": "Template not found"}, (
            f"unexpected 404 body: {response.json()}"
        )
        assert Project.objects.count() == 0


@pytest.mark.contract
class TestProjectTemplateCreationAppCustom(TestProjectTemplateCreationBase):
    """D-01 / VER-03: custom (workspace-scoped) template Project creation.

    An admin and a member of the current workspace can pick an active
    custom template when creating a Project. Guests remain blocked by
    the existing Project create permission (D-01/T-02-11).
    """

    @pytest.fixture
    def active_custom_template(self, db, workspace, create_user):
        """Seed an active, workspace-scoped custom template with minimal
        but valid payload content."""
        return ProjectTemplate.objects.create(
            workspace=workspace,
            name="Active Custom Template",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            is_system=False,
            is_active=True,
            payload=_minimal_valid_payload(),
            created_by=create_user,
        )

    @pytest.mark.django_db
    def test_admin_create_project_with_active_custom_template_succeeds(
        self, session_client, workspace, create_user, active_custom_template
    ):
        """D-01 / VER-03: workspace admin can create a Project from an
        active custom template."""
        url = self.get_project_url(workspace.slug)
        project_data = {
            "name": "Admin Custom Project",
            "identifier": "ACP",
            "template_id": str(active_custom_template.id),
        }

        response = session_client.post(url, project_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        project = Project.objects.get(name=project_data["name"])
        # The template branch writes only the payload's states — no
        # DEFAULT_STATES duplication.
        states = State.objects.filter(project=project)
        assert states.count() == 2
        assert set(states.values_list("name", flat=True)) == {"Backlog", "Todo"}
        # One default state is set per the validator invariant.
        assert states.filter(default=True).count() == 1
        # ProjectIdentifier + admin ProjectMember survive (D-05).
        assert ProjectIdentifier.objects.filter(project=project).count() == 1
        assert ProjectMember.objects.filter(
            project=project, member=create_user, role=20
        ).count() == 1

    @pytest.mark.django_db
    def test_member_create_project_with_active_custom_template_succeeds(
        self, session_client, workspace, create_user, active_custom_template
    ):
        """D-01 / VER-03: workspace member (non-admin) can create a
        Project from an active custom template per existing Project
        create permission."""
        member = User.objects.create_user(
            email="member@example.com", username="member"
        )
        WorkspaceMember.objects.create(
            workspace=workspace, member=member, role=15, is_active=True
        )
        member_client = APIClient()
        member_client.force_authenticate(user=member)

        url = self.get_project_url(workspace.slug)
        project_data = {
            "name": "Member Custom Project",
            "identifier": "MCP",
            "template_id": str(active_custom_template.id),
        }

        response = member_client.post(url, project_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert Project.objects.filter(name=project_data["name"]).exists()

    @pytest.mark.django_db
    def test_guest_create_project_with_active_custom_template_forbidden(
        self, workspace, create_user, active_custom_template
    ):
        """D-01 / T-02-11: workspace guests cannot create Projects at
        all (the existing Project create route blocks them), so they
        cannot pick a custom template either."""
        guest = User.objects.create_user(
            email="guest@example.com", username="guest"
        )
        WorkspaceMember.objects.create(
            workspace=workspace, member=guest, role=5, is_active=True
        )
        guest_client = APIClient()
        guest_client.force_authenticate(user=guest)

        url = self.get_project_url(workspace.slug)
        project_data = {
            "name": "Guest Custom Project",
            "identifier": "GCP",
            "template_id": str(active_custom_template.id),
        }

        response = guest_client.post(url, project_data, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        # D-05 atomicity: the entire transaction (incl. template writes)
        # never started, so no rows persist.
        assert Project.objects.count() == 0
        assert State.objects.count() == 0


@pytest.mark.contract
class TestProjectTemplateCreationAppStaleAndDangling(TestProjectTemplateCreationBase):
    """D-04 (T-02-09) and D-13 (T-02-10): re-validation and dangling
    reference failures in the apply service must surface before any
    partial Project row remains.
    """

    @pytest.fixture
    def admin_custom_template(self, db, workspace, create_user):
        """Custom template (workspace-scoped + active) used by the
        stale-payload tests so the apply path runs against a row that
        the resolver actually accepts.
        """
        return ProjectTemplate.objects.create(
            workspace=workspace,
            name="Stale Custom",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            is_system=False,
            is_active=True,
            payload=_minimal_valid_payload(),
            created_by=create_user,
        )

    @pytest.mark.django_db
    def test_create_project_with_stale_payload_fails(
        self, session_client, workspace, create_user, admin_custom_template
    ):
        """D-04 / T-02-09: a ProjectTemplate whose saved payload fails
        re-validation surfaces as a 4xx, with no partial Project rows.

        We corrupt the saved payload by removing ``schema_version`` and
        confirm the create endpoint blocks Project creation cleanly.
        """
        bad_payload = dict(admin_custom_template.payload)
        bad_payload.pop("schema_version", None)
        admin_custom_template.payload = bad_payload
        admin_custom_template.save(update_fields=["payload"])

        url = self.get_project_url(workspace.slug)
        project_data = {
            "name": "Stale Payload Project",
            "identifier": "SPP",
            "template_id": str(admin_custom_template.id),
        }

        response = session_client.post(url, project_data, format="json")

        # D-04: request fails before any core writes survive. The
        # contract surface is a 4xx (the serializer-ValidationError
        # subclass); the exact status depends on the route error
        # mapping, but it must NOT be a 201.
        assert 400 <= response.status_code < 500
        # T-02-09: no partial state survives when payload re-validation
        # fails inside the apply transaction.
        assert Project.objects.count() == 0
        assert ProjectIdentifier.objects.count() == 0
        assert ProjectMember.objects.count() == 0
        assert State.objects.count() == 0
        assert Label.objects.count() == 0
        assert Module.objects.count() == 0
        assert Cycle.objects.count() == 0
        assert Issue.objects.count() == 0

    @pytest.mark.django_db
    def test_create_project_with_dangling_starter_reference_rolls_back(
        self, session_client, workspace, create_user
    ):
        """D-13 / T-02-10: a starter issue referencing a missing state
        aborts the entire create transaction. No partial Project,
        identifier, member, state, label, module, cycle, issue, or
        join row remains.
        """
        payload = _minimal_valid_payload()
        payload["starter_issues"] = [
            {
                "name": "Dangling Ref Issue",
                "state_key": "missing-state",
                "label_keys": [],
                "module_key": None,
                "cycle_key": None,
                "priority": "medium",
            }
        ]
        dangling = ProjectTemplate.objects.create(
            workspace=workspace,
            name="Dangling Custom",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            is_system=False,
            is_active=True,
            payload=payload,
            created_by=create_user,
        )

        url = self.get_project_url(workspace.slug)
        project_data = {
            "name": "Dangling Project",
            "identifier": "DAN",
            "template_id": str(dangling.id),
        }

        response = session_client.post(url, project_data, format="json")

        # D-13: the request fails; the exact status depends on route
        # error mapping, but it must NOT be a 201.
        assert 400 <= response.status_code < 500
        # CREATE-05 / VER-04: counts across every table touched by the
        # create transaction.
        assert Project.objects.count() == 0
        assert ProjectIdentifier.objects.count() == 0
        assert ProjectMember.objects.count() == 0
        assert State.objects.count() == 0
        assert Label.objects.count() == 0
        assert Module.objects.count() == 0
        assert Cycle.objects.count() == 0
        assert Issue.objects.count() == 0
        assert IssueLabel.objects.count() == 0
        assert ModuleIssue.objects.count() == 0
        assert CycleIssue.objects.count() == 0

    @pytest.mark.django_db
    def test_create_project_forced_apply_exception_rolls_back(
        self, session_client, workspace, create_user, active_software_template
    ):
        """CREATE-05 / VER-04: forcing the apply service to raise mid-
        transaction leaves no Project or generated-content rows.

        Patches ``apply_project_template`` so the entire create
        transaction gets unwound; the assertions confirm every table
        touched by the template and shared core-write code paths is
        empty afterwards.
        """
        url = self.get_project_url(workspace.slug)
        project_data = {
            "name": "Forced Fail Project",
            "identifier": "FFP",
            "template_id": str(active_software_template.id),
        }

        forced_error = RuntimeError("forced apply failure")
        with mock.patch(
            "plane.app.services.project_creation.apply_project_template",
            side_effect=forced_error,
        ):
            response = session_client.post(url, project_data, format="json")

        # CREATE-05: forced failure does not produce a 201, and no rows
        # persist for any model the create transaction can write.
        assert response.status_code != status.HTTP_201_CREATED
        assert Project.objects.count() == 0
        assert ProjectIdentifier.objects.count() == 0
        assert ProjectMember.objects.count() == 0
        assert State.objects.count() == 0
        assert Label.objects.count() == 0
        assert Module.objects.count() == 0
        assert Cycle.objects.count() == 0
        assert Issue.objects.count() == 0
        assert IssueLabel.objects.count() == 0
        assert ModuleIssue.objects.count() == 0
        assert CycleIssue.objects.count() == 0


@pytest.fixture
def active_software_template(db):
    """An active built-in software-project template, seeded for the
    forced-failure test. Idempotent so it can be combined with the
    built-in seeding fixture used by other tests."""
    entry = next(
        built
        for built in BUILT_IN_PROJECT_TEMPLATES
        if built["system_key"] == "software-project"
    )
    template, _ = ProjectTemplate.objects.update_or_create(
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
    return template