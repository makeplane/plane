# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Experiment state machine, locking and amendment rules (P1-C1)."""

import pytest

from plane.db.models import (
    AMENDABLE_FIELDS,
    LOCKED_FIELDS,
    ExperimentAmendment,
    ExperimentRecord,
    ExperimentRecordVersion,
    Project,
    ProjectIdentifier,
    ResearchProjectProfile,
)
from plane.research.services.experiment_service import (
    STATUS,
    STATUS_TRANSITIONS,
    append_version,
    approve_amendment,
    archive_experiment,
    can_transition,
    create_amendment,
    locked_field_changes,
    next_sequence_no,
    reject_amendment,
    require_writable,
    submit_experiment,
)
from plane.research.services.stage_service import StageRuleError
from plane.tests.research_fixtures import enable_research, make_user, make_workspace

pytestmark = pytest.mark.unit


@pytest.fixture
def experiment_env(db):
    admin = make_user(first_name="Admin")
    workspace = make_workspace(admin)
    enable_research(workspace)
    owner = make_user(first_name="Owner")
    project = Project.objects.create(workspace=workspace, name="Experiment project", identifier="EXP", created_by=owner)
    ProjectIdentifier.objects.create(name=project.identifier, project=project, workspace=workspace)
    ResearchProjectProfile.objects.create(project=project, workspace=workspace, owner=owner, created_by=owner)
    record = ExperimentRecord.objects.create(
        workspace=workspace,
        project=project,
        sequence_no=1,
        title="First run",
        owner=owner,
        molecular_system="PEO/LiTFSI",
        method="GPC",
    )
    return {"workspace": workspace, "owner": owner, "admin": admin, "project": project, "record": record}


def test_state_machine_matches_the_documented_edges():
    assert can_transition(STATUS.PLANNED, STATUS.RUNNING)
    assert can_transition(STATUS.RUNNING, STATUS.COMPLETED)
    assert can_transition(STATUS.RUNNING, STATUS.FAILED)
    assert can_transition(STATUS.RUNNING, STATUS.CANCELLED)
    assert can_transition(STATUS.FAILED, STATUS.ARCHIVED)
    assert not can_transition(STATUS.PLANNED, STATUS.COMPLETED)
    assert not can_transition(STATUS.COMPLETED, STATUS.RUNNING)
    assert STATUS_TRANSITIONS[STATUS.ARCHIVED] == set()


def test_locked_and_amendable_field_sets_are_disjoint():
    # a field is either frozen when the run starts or amendable through review
    assert set(LOCKED_FIELDS) & set(AMENDABLE_FIELDS) == set()
    assert "molecular_system" in LOCKED_FIELDS
    assert "result" in AMENDABLE_FIELDS


@pytest.mark.django_db
def test_sequence_numbers_are_unique_and_never_reused(experiment_env):
    assert next_sequence_no(experiment_env["project"].id) == 2
    ExperimentRecord.objects.create(
        workspace=experiment_env["workspace"],
        project=experiment_env["project"],
        sequence_no=2,
        title="Second run",
        owner=experiment_env["owner"],
    )
    assert next_sequence_no(experiment_env["project"].id) == 3


@pytest.mark.django_db
def test_locked_fields_are_detected(experiment_env):
    record = experiment_env["record"]
    assert locked_field_changes(record, {"method": "NMR"}) == ["method"]
    assert locked_field_changes(record, {"method": "GPC"}) == []
    assert locked_field_changes(record, {"result": "new"}) == []


@pytest.mark.django_db
def test_submission_locks_and_snapshots_the_record(experiment_env):
    record = experiment_env["record"]
    submit_experiment(record, experiment_env["owner"])
    record.refresh_from_db()
    assert record.submitted_at is not None
    assert record.is_locked is True
    assert record.current_version_no == 1
    version = ExperimentRecordVersion.objects.get(record=record, version_no=1)
    assert version.change_source == "SUBMIT"
    assert version.snapshot["title"] == "First run"
    assert version.snapshot["sequence_no"] == 1

    with pytest.raises(StageRuleError) as excinfo:
        submit_experiment(record, experiment_env["owner"])
    assert excinfo.value.error_code == "experiment_state_conflict"


@pytest.mark.django_db
def test_submitted_records_are_read_only(experiment_env):
    record = experiment_env["record"]
    submit_experiment(record, experiment_env["owner"])
    record.refresh_from_db()
    with pytest.raises(StageRuleError) as excinfo:
        require_writable(record)
    assert excinfo.value.error_code == "experiment_read_only"
    assert excinfo.value.http_status == 409


@pytest.mark.django_db
def test_amendment_requires_reason_and_change_set(experiment_env):
    record = experiment_env["record"]
    submit_experiment(record, experiment_env["owner"])
    record.refresh_from_db()

    with pytest.raises(StageRuleError) as reason_error:
        create_amendment(record, experiment_env["owner"], reason="", change_set=[{"field": "result", "new": "x"}])
    assert reason_error.value.error_code == "experiment_amendment_reason_required"

    with pytest.raises(StageRuleError) as change_error:
        create_amendment(record, experiment_env["owner"], reason="typo", change_set=[])
    assert change_error.value.error_code == "experiment_amendment_change_set_required"

    with pytest.raises(StageRuleError) as field_error:
        create_amendment(
            record,
            experiment_env["owner"],
            reason="typo",
            change_set=[{"field": "molecular_system", "new": "other"}],
        )
    assert field_error.value.error_code == "experiment_amendment_field_not_allowed"


@pytest.mark.django_db
def test_only_one_amendment_may_be_pending(experiment_env):
    record = experiment_env["record"]
    submit_experiment(record, experiment_env["owner"])
    record.refresh_from_db()
    create_amendment(record, experiment_env["owner"], reason="first", change_set=[{"field": "result", "new": "x"}])
    with pytest.raises(StageRuleError) as excinfo:
        create_amendment(record, experiment_env["owner"], reason="second", change_set=[{"field": "result", "new": "y"}])
    assert excinfo.value.error_code == "experiment_amendment_pending_exists"


@pytest.mark.django_db
def test_approval_applies_the_change_and_appends_a_version(experiment_env):
    record = experiment_env["record"]
    submit_experiment(record, experiment_env["owner"])
    record.refresh_from_db()
    amendment = create_amendment(
        record,
        experiment_env["owner"],
        reason="the sample label was wrong",
        change_set=[{"field": "result", "old": "", "new": "conversion 92%"}],
    )
    approve_amendment(amendment, experiment_env["admin"], "checked")

    record.refresh_from_db()
    amendment.refresh_from_db()
    assert record.result == "conversion 92%"
    assert record.current_version_no == 2
    assert amendment.status == "APPROVED"
    assert amendment.result_version.version_no == 2
    # the previous state is still readable in version 1
    first = ExperimentRecordVersion.objects.get(record=record, version_no=1)
    assert first.snapshot["result"] == ""
    assert ExperimentRecordVersion.objects.filter(record=record).count() == 2


@pytest.mark.django_db
def test_rejection_leaves_the_record_untouched(experiment_env):
    record = experiment_env["record"]
    submit_experiment(record, experiment_env["owner"])
    record.refresh_from_db()
    amendment = create_amendment(
        record, experiment_env["owner"], reason="please", change_set=[{"field": "result", "new": "changed"}]
    )
    with pytest.raises(StageRuleError) as excinfo:
        reject_amendment(amendment, experiment_env["admin"], "")
    assert excinfo.value.error_code == "experiment_amendment_comment_required"

    reject_amendment(amendment, experiment_env["admin"], "evidence missing")
    record.refresh_from_db()
    amendment.refresh_from_db()
    assert record.result == ""
    assert record.current_version_no == 1
    assert amendment.status == "REJECTED"


@pytest.mark.django_db
def test_versions_are_append_only(experiment_env):
    record = experiment_env["record"]
    submit_experiment(record, experiment_env["owner"])
    record.refresh_from_db()
    version = ExperimentRecordVersion.objects.get(record=record)
    with pytest.raises(TypeError):
        version.delete()
    with pytest.raises(TypeError):
        ExperimentRecordVersion.objects.filter(record=record).update(reason="nope")


@pytest.mark.django_db
def test_failed_experiments_archive_instead_of_disappearing(experiment_env):
    record = experiment_env["record"]
    record.status = STATUS.FAILED
    record.failure_reason = "the column blocked"
    record.save(update_fields=["status", "failure_reason"])
    archive_experiment(record, experiment_env["owner"])
    record.refresh_from_db()
    assert record.status == STATUS.ARCHIVED
    with pytest.raises(StageRuleError) as excinfo:
        archive_experiment(record, experiment_env["owner"])
    assert excinfo.value.error_code == "experiment_state_conflict"


@pytest.mark.django_db
def test_appending_versions_increments_from_the_first(experiment_env):
    record = experiment_env["record"]
    first = append_version(record, experiment_env["owner"], change_source="SUBMIT")
    record.save(update_fields=["current_version_no"])
    second = append_version(record, experiment_env["owner"], change_source="AMENDMENT", reason="fix")
    assert (first.version_no, second.version_no) == (1, 2)
