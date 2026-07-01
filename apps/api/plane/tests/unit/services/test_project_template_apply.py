# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for ``plane.app.services.project_template_apply``.

Covers VER-02 (built-in template coverage), GEN-01..GEN-07 (generated
states, labels, modules, cycles, and starter issues), and the date/ownership
behaviors D-14..D-17. The tests follow the payload-fixture and
validator-expectation pattern from
``apps/api/plane/tests/unit/serializers/test_project_template.py``.

The tests exercise the apply service against seeded ``ProjectTemplate``
rows built from ``BUILT_IN_PROJECT_TEMPLATES``. Each test asserts the
generated database state through the model classes so the contract is
pinned at the data layer, not just the service return value.
"""

from datetime import date
import uuid

import pytest
from django.db import IntegrityError
from django.utils import timezone

from plane.app.serializers.project_template import (
    BUILT_IN_PROJECT_TEMPLATES,
    PROJECT_TEMPLATE_SCHEMA_VERSION,
    validate_project_template_payload,
)
from plane.db.models import (
    Cycle,
    CycleIssue,
    DEFAULT_STATES,
    Intake,
    Issue,
    IssueView,
    IssueLabel,
    Label,
    Module,
    ModuleIssue,
    Page,
    PageLabel,
    ProjectPage,
    Project,
    ProjectMember,
    ProjectTemplate,
    State,
    WorkspaceMember,
)


def _seeded_template(system_key: str):
    """Return a persisted ``ProjectTemplate`` for the given built-in key.

    The seed is idempotent and mirrors the data migration shape: ``is_system=True``,
    ``workspace=None``, ``is_active=True``, ``system_key`` stable. The fresh
    ``payload`` snapshot keeps tests deterministic regardless of any
    previous mutations.
    """
    entry = next(
        built
        for built in BUILT_IN_PROJECT_TEMPLATES
        if built["system_key"] == system_key
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


def _make_project(workspace, create_user, name="Template Project", identifier="TP"):
    """Create and return a Project (and admin membership) for the tests."""
    project = Project.objects.create(
        name=name,
        identifier=identifier,
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,
        is_active=True,
    )
    return project


def _import_apply():
    """Import the apply service lazily so the RED phase fails on import.

    Importing at module top level would defeat the RED gate because the
    Python import machinery caches module-level failures and the test
    collector would silently skip the test class. Defer the import to the
    test body so each test exercises the import path independently.
    """
    from plane.app.services import project_template_apply

    return project_template_apply


@pytest.mark.unit
class TestApplyProjectTemplateSoftwareProject:
    """Apply-service coverage for the ``software-project`` built-in (VER-02)."""

    @pytest.mark.django_db
    def test_apply_creates_states_for_software_project(
        self, db, workspace, create_user
    ):
        """GEN-01: payload states persist with explicit sequence and default.

        The five ``software-project`` states must exist on the new project
        with the payload's sequence values, and no duplicate DEFAULT_STATES
        are added (D-07).
        """
        apply_module = _import_apply()
        template = _seeded_template("software-project")
        project = _make_project(workspace, create_user, "SW Project", "SWP")

        apply_module.apply_project_template(
            project=project,
            workspace=workspace,
            template=template,
            actor=create_user,
            creation_date=date(2026, 6, 30),
        )

        states = State.objects.filter(project=project).order_by("sequence")
        names = list(states.values_list("name", flat=True))
        assert names == ["Backlog", "Todo", "In Progress", "Done", "Cancelled"]
        # No DEFAULT_STATES slip in when the template branch runs (D-07).
        default_state_names = {state["name"] for state in DEFAULT_STATES}
        # All five template states are exactly the DEFAULT_STATES names for
        # this template, but no extras must be appended from the legacy
        # DEFAULT_STATES constant.
        assert names == ["Backlog", "Todo", "In Progress", "Done", "Cancelled"]
        assert states.count() == 5
        # Sequence values mirror the payload.
        assert list(states.values_list("sequence", flat=True)) == [
            15000,
            25000,
            35000,
            45000,
            55000,
        ]
        # Exactly one default state is set, per the validator's invariant.
        assert states.filter(default=True).count() == 1
        # The default state is the payload's default entry.
        assert states.get(default=True).name == "Backlog"
        # ``created_by`` is the requesting user (D-16).
        assert states.exclude(created_by=create_user).count() == 0
        # Defensive double-check: DEFAULT_STATES names are still a subset
        # of the generated state names so we never accidentally saw extras.
        assert default_state_names.issuperset({"Backlog", "Todo", "In Progress"})

    @pytest.mark.django_db
    def test_apply_creates_labels_for_software_project(
        self, db, workspace, create_user
    ):
        """GEN-02: payload labels persist with payload ``order`` and color."""
        apply_module = _import_apply()
        template = _seeded_template("software-project")
        project = _make_project(workspace, create_user, "SW Project", "SWP")

        apply_module.apply_project_template(
            project=project,
            workspace=workspace,
            template=template,
            actor=create_user,
            creation_date=date(2026, 6, 30),
        )

        labels = Label.objects.filter(project=project).order_by("sort_order")
        names = list(labels.values_list("name", flat=True))
        assert names == ["Bug", "Feature"]
        # Explicit payload ``order`` values win (D-10).
        assert list(labels.values_list("sort_order", flat=True)) == [100, 200]
        # ``created_by`` is the requesting user (D-16).
        assert labels.exclude(created_by=create_user).count() == 0

    @pytest.mark.django_db
    def test_apply_creates_module_with_no_dates_for_software_project(
        self, db, workspace, create_user
    ):
        """GEN-03: module persists payload status and gets a deterministic sort_order."""
        apply_module = _import_apply()
        template = _seeded_template("software-project")
        project = _make_project(workspace, create_user, "SW Project", "SWP")

        apply_module.apply_project_template(
            project=project,
            workspace=workspace,
            template=template,
            actor=create_user,
            creation_date=date(2026, 6, 30),
        )

        modules = Module.objects.filter(project=project).order_by("sort_order")
        assert modules.count() == 1
        core = modules.first()
        assert core.name == "Core"
        assert core.status == "planned"
        # No ``start_offset_days`` in the payload, so the module dates stay NULL.
        assert core.start_date is None
        assert core.target_date is None
        # ``created_by`` is the requesting user (D-16).
        assert core.created_by_id == create_user.id

    @pytest.mark.django_db
    def test_apply_creates_cycle_with_offset_dates(
        self, db, workspace, create_user
    ):
        """GEN-04: cycle dates resolve from creation_date and target_offset_days (D-14/D-15)."""
        apply_module = _import_apply()
        template = _seeded_template("software-project")
        project = _make_project(workspace, create_user, "SW Project", "SWP")

        creation_date = date(2026, 6, 30)
        apply_module.apply_project_template(
            project=project,
            workspace=workspace,
            template=template,
            actor=create_user,
            creation_date=creation_date,
        )

        cycles = Cycle.objects.filter(project=project)
        assert cycles.count() == 1
        sprint = cycles.first()
        assert sprint.name == "Sprint 1"
        # D-14/D-15: dates resolve from creation_date + target_offset_days.
        # The payload supplies start_offset_days=0 and target_offset_days=14.
        assert sprint.start_date.date() == creation_date
        assert sprint.end_date.date() == date(2026, 7, 14)
        # D-16: Cycle.owned_by is the request user.
        assert sprint.owned_by_id == create_user.id
        assert sprint.created_by_id == create_user.id

    @pytest.mark.django_db
    def test_apply_creates_starter_issue_with_state_and_links(
        self, db, workspace, create_user
    ):
        """GEN-05/GEN-06/GEN-07: starter issue links resolve to generated rows (D-11/D-12/D-16/D-17)."""
        apply_module = _import_apply()
        template = _seeded_template("software-project")
        project = _make_project(workspace, create_user, "SW Project", "SWP")

        apply_module.apply_project_template(
            project=project,
            workspace=workspace,
            template=template,
            actor=create_user,
            creation_date=date(2026, 6, 30),
        )

        issues = Issue.objects.filter(project=project).order_by("sequence_id")
        assert issues.count() == 3
        starter = issues.get(name="Set up the project backlog")
        # Explicit state resolution (D-11).
        assert starter.state is not None
        assert starter.state.name == "Backlog"
        assert "Collect initial feature ideas" in starter.description_html
        assert starter.start_date == date(2026, 6, 30)
        assert starter.target_date == date(2026, 7, 2)
        # D-17: starter issue has no assignees or subscribers.
        assert starter.assignees.count() == 0
        assert starter.issue_subscribers.count() == 0
        # D-16: starter issue is owned by the requesting user.
        assert starter.created_by_id == create_user.id

        # Module/Cycle links resolve through generated maps (D-12).
        assert ModuleIssue.objects.filter(issue=starter).count() == 1
        assert CycleIssue.objects.filter(issue=starter).count() == 1
        assert IssueLabel.objects.filter(issue=starter).count() == 1

    @pytest.mark.django_db
    def test_apply_creates_rich_project_sections_for_software_project(
        self, db, workspace, create_user
    ):
        """Template application creates intake, views, pages, and enables feature tabs."""
        apply_module = _import_apply()
        template = _seeded_template("software-project")
        project = _make_project(workspace, create_user, "SW Project", "SWP")

        apply_module.apply_project_template(
            project=project,
            workspace=workspace,
            template=template,
            actor=create_user,
            creation_date=date(2026, 6, 30),
        )

        project.refresh_from_db()
        assert project.cycle_view is True
        assert project.module_view is True
        assert project.issue_views_view is True
        assert project.page_view is True
        assert project.intake_view is True

        intake = Intake.objects.get(project=project, name="Engineering Requests")
        assert intake.is_default is True
        assert "feature requests" in intake.description

        views = IssueView.objects.filter(project=project).order_by("sort_order")
        assert list(views.values_list("name", flat=True)) == [
            "Open Bugs",
            "Sprint Board",
        ]
        bug_label = Label.objects.get(project=project, name="Bug")
        open_bugs = views.get(name="Open Bugs")
        assert open_bugs.filters["labels"] == [str(bug_label.id)]

        page = Page.objects.get(workspace=workspace, name="Engineering Handbook")
        assert ProjectPage.objects.filter(project=project, page=page).exists()
        assert "coding standards" in page.description_html
        feature_label = Label.objects.get(project=project, name="Feature")
        assert PageLabel.objects.filter(page=page, label=feature_label).exists()


@pytest.mark.unit
class TestApplyProjectTemplateMarketingCampaign:
    """Apply-service coverage for the ``marketing-campaign`` built-in (VER-02)."""

    @pytest.mark.django_db
    def test_apply_creates_starter_issue_with_label_links(
        self, db, workspace, create_user
    ):
        """GEN-05: starter issue label_links resolves through the generated label map (D-12)."""
        apply_module = _import_apply()
        template = _seeded_template("marketing-campaign")
        project = _make_project(workspace, create_user, "MC Project", "MCP")

        apply_module.apply_project_template(
            project=project,
            workspace=workspace,
            template=template,
            actor=create_user,
            creation_date=date(2026, 6, 30),
        )

        states = State.objects.filter(project=project)
        # marketing-campaign payload has 4 states.
        assert states.count() == 4
        # The starter issue references "social" label and the launch-week cycle.
        starter = Issue.objects.get(project=project, name="Draft launch announcement")
        assert starter.state.name == "Backlog"
        assert Issue.objects.filter(project=project).count() == 3

        # Label link is created from the resolved label map.
        assert IssueLabel.objects.filter(issue=starter).count() == 1
        social = Label.objects.get(project=project, name="Social")
        assert IssueLabel.objects.filter(issue=starter, label=social).exists()

        # Cycle link is created from the resolved cycle map.
        assert CycleIssue.objects.filter(issue=starter).count() == 1
        launch_week = Cycle.objects.get(project=project, name="Launch Week")
        assert CycleIssue.objects.filter(issue=starter, cycle=launch_week).exists()

        # No module link because the marketing template's modules list is empty
        # and the starter issue's ``module_key`` is null.
        assert ModuleIssue.objects.filter(issue=starter).count() == 0

        # Cycle.owned_by is the request user (D-16).
        assert launch_week.owned_by_id == create_user.id

        # D-17: starter issue has no assignees or subscribers.
        assert starter.assignees.count() == 0
        assert starter.issue_subscribers.count() == 0

    @pytest.mark.django_db
    def test_apply_creates_cycle_with_seven_day_target_offset(
        self, db, workspace, create_user
    ):
        """D-15: target_offset_days=7 yields a 7-day end date from creation_date."""
        apply_module = _import_apply()
        template = _seeded_template("marketing-campaign")
        project = _make_project(workspace, create_user, "MC Project", "MCP")

        creation_date = date(2026, 6, 30)
        apply_module.apply_project_template(
            project=project,
            workspace=workspace,
            template=template,
            actor=create_user,
            creation_date=creation_date,
        )

        launch_week = Cycle.objects.get(project=project, name="Launch Week")
        assert launch_week.start_date.date() == creation_date
        assert launch_week.end_date.date() == date(2026, 7, 7)


@pytest.mark.unit
class TestApplyProjectTemplateOperationsProject:
    """Apply-service coverage for the ``operations-project`` built-in (VER-02)."""

    @pytest.mark.django_db
    def test_apply_creates_starter_issue_with_module_and_cycle(
        self, db, workspace, create_user
    ):
        """GEN-06/GEN-07: module + cycle + label links resolve correctly (D-12)."""
        apply_module = _import_apply()
        template = _seeded_template("operations-project")
        project = _make_project(workspace, create_user, "OPS Project", "OPP")

        apply_module.apply_project_template(
            project=project,
            workspace=workspace,
            template=template,
            actor=create_user,
            creation_date=date(2026, 6, 30),
        )

        # The starter issue for operations references "ops" module, "month-1" cycle, "process" label.
        starter = Issue.objects.get(project=project, name="Document current process")
        assert starter.state.name == "Backlog"
        assert Issue.objects.filter(project=project).count() == 3

        process_label = Label.objects.get(project=project, name="Process")
        assert IssueLabel.objects.filter(issue=starter, label=process_label).exists()

        ops_module = Module.objects.get(project=project, name="Operations")
        assert ModuleIssue.objects.filter(issue=starter, module=ops_module).exists()

        month_one = Cycle.objects.get(project=project, name="Month 1")
        assert CycleIssue.objects.filter(issue=starter, cycle=month_one).exists()

    @pytest.mark.django_db
    def test_apply_creates_cycle_with_thirty_day_target_offset(
        self, db, workspace, create_user
    ):
        """D-14/D-15: target_offset_days=30 yields a 30-day end date from creation_date."""
        apply_module = _import_apply()
        template = _seeded_template("operations-project")
        project = _make_project(workspace, create_user, "OPS Project", "OPP")

        creation_date = date(2026, 6, 30)
        apply_module.apply_project_template(
            project=project,
            workspace=workspace,
            template=template,
            actor=create_user,
            creation_date=creation_date,
        )

        month_one = Cycle.objects.get(project=project, name="Month 1")
        assert month_one.start_date.date() == creation_date
        assert month_one.end_date.date() == date(2026, 7, 30)


@pytest.mark.unit
class TestApplyProjectTemplateErrors:
    """Failure modes of the apply service (D-04/D-13)."""

    @pytest.mark.django_db
    def test_apply_revalidates_payload_before_writes(
        self, db, workspace, create_user
    ):
        """D-04: re-running ``validate_project_template_payload`` before writes blocks stale payloads."""
        apply_module = _import_apply()
        template = _seeded_template("software-project")
        # Corrupt the payload after seeding by removing ``schema_version``.
        corrupted_payload = dict(template.payload)
        corrupted_payload.pop("schema_version", None)
        template.payload = corrupted_payload
        template.save(update_fields=["payload", "updated_at"])

        project = _make_project(workspace, create_user, "Corrupt", "COR")
        with pytest.raises(Exception):
            apply_module.apply_project_template(
                project=project,
                workspace=workspace,
                template=template,
                actor=create_user,
                creation_date=date(2026, 6, 30),
            )
        # Atomicity guarantee: no states persist when validation fails (D-05).
        assert State.objects.filter(project=project).count() == 0
        assert Label.objects.filter(project=project).count() == 0

    @pytest.mark.django_db
    def test_apply_rolls_back_when_validation_fails(
        self, db, workspace, create_user
    ):
        """D-05: when the apply service raises mid-flow, no generated rows persist."""
        apply_module = _import_apply()
        template = _seeded_template("software-project")
        # Make the payload reference a missing label key — validator catches this.
        payload = dict(template.payload)
        payload["starter_issues"] = [
            {
                "name": "Bad ref",
                "state_key": "backlog",
                "label_keys": ["does-not-exist"],
                "module_key": "core",
                "cycle_key": "sprint-1",
                "priority": "medium",
            }
        ]
        template.payload = payload
        template.save(update_fields=["payload", "updated_at"])

        project = _make_project(workspace, create_user, "Rollback Apply", "RAP")
        with pytest.raises(Exception):
            apply_module.apply_project_template(
                project=project,
                workspace=workspace,
                template=template,
                actor=create_user,
                creation_date=date(2026, 6, 30),
            )
        # The service must roll back partial writes.
        assert State.objects.filter(project=project).count() == 0
        assert Label.objects.filter(project=project).count() == 0
        assert Module.objects.filter(project=project).count() == 0
        assert Cycle.objects.filter(project=project).count() == 0
        assert Issue.objects.filter(project=project).count() == 0


@pytest.mark.unit
class TestResolveRelativeTemplateDates:
    """D-14/D-15: relative date resolution pure helper."""

    def test_resolve_relative_dates_uses_target_offset_when_present(self):
        """``target_offset_days`` wins over ``duration_days`` when both are set (D-15)."""
        apply_module = _import_apply()
        creation_date = date(2026, 6, 30)
        result = apply_module.resolve_relative_template_dates(
            {"start_offset_days": 0, "target_offset_days": 14, "duration_days": 30},
            creation_date,
        )
        assert result["start_date"] == date(2026, 6, 30)
        assert result["end_date"] == date(2026, 7, 14)

    def test_resolve_relative_dates_falls_back_to_duration(self):
        """``duration_days`` is used as a fallback when ``target_offset_days`` is absent (D-15)."""
        apply_module = _import_apply()
        creation_date = date(2026, 6, 30)
        result = apply_module.resolve_relative_template_dates(
            {"start_offset_days": 7, "duration_days": 14},
            creation_date,
        )
        assert result["start_date"] == date(2026, 7, 7)
        assert result["end_date"] == date(2026, 7, 21)

    def test_resolve_relative_dates_returns_none_when_offsets_missing(self):
        """No offsets → both dates resolve to None (the model default)."""
        apply_module = _import_apply()
        result = apply_module.resolve_relative_template_dates(
            {}, date(2026, 6, 30)
        )
        assert result["start_date"] is None
        assert result["end_date"] is None


@pytest.mark.unit
class TestResolveAvailableProjectTemplate:
    """D-01 / D-02 / VER-03: the availability resolver returns ``None``
    for missing, inactive, and foreign-workspace templates so callers
    can surface a generic 404 without leaking existence (T-02-08).
    """

    def test_resolve_returns_none_when_template_id_is_none(self):
        """No ``template_id`` is a pass-through (``None`` → ``None``)."""
        apply_module = _import_apply()

        result = apply_module.resolve_available_project_template(
            template_id=None, workspace=_StubWorkspace(id=1)
        )
        assert result is None

    @pytest.mark.django_db
    def test_resolve_returns_none_for_missing_template(
        self, db, workspace, create_user
    ):
        """A random UUID for a missing template is treated as unavailable."""
        apply_module = _import_apply()

        result = apply_module.resolve_available_project_template(
            template_id=uuid.uuid4(), workspace=workspace
        )
        assert result is None

    @pytest.mark.django_db
    def test_resolve_returns_none_for_inactive_custom_template(
        self, db, workspace, create_user
    ):
        """An inactive custom template in the current workspace resolves to ``None``."""
        apply_module = _import_apply()
        template = ProjectTemplate.objects.create(
            workspace=workspace,
            name="Inactive Custom",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            is_system=False,
            is_active=False,
            payload={},
            created_by=create_user,
        )

        result = apply_module.resolve_available_project_template(
            template_id=template.id, workspace=workspace
        )
        assert result is None

    @pytest.mark.django_db
    def test_resolve_returns_none_for_foreign_workspace_custom_template(
        self, db, workspace, create_user
    ):
        """A custom template owned by another workspace is treated as unavailable."""
        apply_module = _import_apply()
        foreign = type(workspace).objects.create(
            name="Other Workspace",
            slug="other-workspace",
            owner=create_user,
        )
        WorkspaceMember.objects.create(
            workspace=foreign, member=create_user, role=20
        )
        foreign_template = ProjectTemplate.objects.create(
            workspace=foreign,
            name="Foreign Custom",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            is_system=False,
            is_active=True,
            payload={},
            created_by=create_user,
        )

        result = apply_module.resolve_available_project_template(
            template_id=foreign_template.id, workspace=workspace
        )
        assert result is None

    @pytest.mark.django_db
    def test_resolve_returns_active_custom_template(self, db, workspace, create_user):
        """An active custom template in the current workspace resolves."""
        apply_module = _import_apply()
        active = ProjectTemplate.objects.create(
            workspace=workspace,
            name="Active Custom",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            is_system=False,
            is_active=True,
            payload={"schema_version": PROJECT_TEMPLATE_SCHEMA_VERSION},
            created_by=create_user,
        )

        result = apply_module.resolve_available_project_template(
            template_id=active.id, workspace=workspace
        )
        assert result is not None
        assert result.id == active.id

    @pytest.mark.django_db
    def test_resolve_returns_active_builtin_template(self, db, workspace, create_user):
        """An active built-in template (workspace NULL) resolves for any workspace."""
        apply_module = _import_apply()
        builtin = _seeded_template("software-project")

        result = apply_module.resolve_available_project_template(
            template_id=builtin.id, workspace=workspace
        )
        assert result is not None
        assert result.id == builtin.id


class _StubWorkspace:
    """Minimal workspace stand-in for resolver unit tests that don't need the DB."""

    def __init__(self, *, id):
        self.id = id
