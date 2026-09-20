# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Personnel review must create verifiable accounts and organisation relations."""

import csv
import io
from datetime import timedelta

import pytest
from django.utils import timezone

from plane.db.models import (
    MentorBinding,
    OrgUnit,
    OrgUnitMember,
    ResearchAuditEvent,
    ResearchUserProfile,
    User,
    UserImportBatch,
    WorkspaceMember,
)
from plane.tests.contract.app.test_research_user_import import (
    advisor_table,
    client_for,
    env as import_env,
    post_import,
    research_module_on as import_research_module_on,
    roster_row,
)
from plane.tests.research_fixtures import add_workspace_member, make_user, make_workspace, user_imports_url

pytestmark = pytest.mark.contract

# Re-export shared fixtures for pytest collection without shadowing parameters.
env = import_env
research_module_on = import_research_module_on


def single_payload(env, **overrides):
    payload = {
        "category": "STUDENT",
        "display_name": "待审核学生",
        "email": "single-student@example.com",
        "student_no": "SINGLE-001",
        "org_unit": str(env["team"].id),
        "phone": "17700000000",
        "grade": "2026",
        "degree": "MS",
        "review_note": "单条录入",
        "advisors": [{"name": "刘俊扬", "email": "primary@example.com"}],
    }
    payload.update(overrides)
    return payload


def create_single(env, **overrides):
    response = client_for(env["admin"]).post(
        user_imports_url(env["workspace"], "single/"),
        single_payload(env, **overrides),
        format="json",
    )
    assert response.status_code == 201, response.data
    return response.data


def include_row(env, batch, index=0):
    response = client_for(env["admin"]).patch(
        user_imports_url(env["workspace"], f"{batch['id']}/rows/{batch['rows'][index]['id']}/"),
        {"review_decision": "INCLUDED"},
        format="json",
    )
    assert response.status_code == 200, response.data


def preview(env, batch):
    response = client_for(env["admin"]).get(
        user_imports_url(env["workspace"], f"{batch['id']}/approval-preview/")
    )
    assert response.status_code == 200, response.data
    assert response.data["token"]
    return response.data


def approve(env, batch, token):
    return client_for(env["admin"]).post(
        user_imports_url(env["workspace"], f"{batch['id']}/approve/"),
        {"preview_token": token},
        format="json",
    )


def approved_student(env, **overrides):
    batch = create_single(env, **overrides)
    include_row(env, batch)
    checked = preview(env, batch)
    assert checked["blockers"] == []
    response = approve(env, batch, checked["token"])
    assert response.status_code == 200, response.data
    return batch, User.objects.get(email=overrides.get("email", "single-student@example.com"))


@pytest.mark.parametrize("category", ["STUDENT", "ADVISOR"])
def test_single_record_remains_pending_without_account_or_relationship_writes(env, category):
    overrides = {"category": category}
    if category == "ADVISOR":
        overrides.update(student_no="", advisors=[])
    batch = create_single(env, **overrides)

    assert batch["status"] == "PENDING_REVIEW"
    assert len(batch["rows"]) == 1
    assert batch["rows"][0]["review_decision"] == "PENDING"
    assert batch["rows"][0]["status"] == "OK"
    assert not User.objects.filter(email="single-student@example.com").exists()
    assert not OrgUnitMember.objects.filter(user__email="single-student@example.com").exists()
    assert not MentorBinding.objects.filter(mentee__email="single-student@example.com").exists()
    checked = preview(env, batch)
    assert checked["blockers"]
    assert approve(env, batch, checked["token"]).status_code == 409


def test_student_approval_creates_primary_membership_and_each_advisor_mapping(env):
    existing_advisor = env["advisors"]["刘俊扬"]
    add_workspace_member(env["workspace"], existing_advisor)
    original_primary = OrgUnitMember.objects.create(
        workspace=env["workspace"], org_unit=env["group"], user=existing_advisor,
        org_role=OrgUnitMember.OrgRole.ADVISOR, is_primary=True,
    )
    batch, student = approved_student(env, advisors=[
        {"name": "刘俊扬", "email": existing_advisor.email},
        {"name": "新联合导师", "email": "new-co@example.com"},
    ])

    assert OrgUnitMember.objects.get(workspace=env["workspace"], user=student, is_primary=True).org_unit == env["team"]
    assert ResearchUserProfile.objects.get(user=student).category == "STUDENT"
    assert ResearchUserProfile.objects.get(user=student).degree == "MS"
    for email, is_primary in ((existing_advisor.email, True), ("new-co@example.com", False)):
        membership = OrgUnitMember.objects.get(
            workspace=env["workspace"], org_unit=env["team"], user__email=email,
            org_role=OrgUnitMember.OrgRole.ADVISOR,
        )
        assert membership.is_primary is False
        binding = MentorBinding.objects.get(workspace=env["workspace"], mentee=student, mentor__email=email)
        assert binding.org_unit == env["team"]
        assert binding.is_primary_advisor is is_primary
    assert (
        OrgUnitMember.objects.get(workspace=env["workspace"], user=existing_advisor, is_primary=True).id
        == original_primary.id
    )
    assert UserImportBatch.objects.get(pk=batch["id"]).status == "IMPORTED"


def test_standalone_advisor_requires_no_student_number_or_advisor_and_gets_primary_org(env):
    batch = create_single(env, category="ADVISOR", student_no="", advisors=[])
    include_row(env, batch)
    response = approve(env, batch, preview(env, batch)["token"])
    assert response.status_code == 200, response.data

    advisor = User.objects.get(email="single-student@example.com")
    assert ResearchUserProfile.objects.get(user=advisor).category == "ADVISOR"
    membership = OrgUnitMember.objects.get(workspace=env["workspace"], user=advisor, is_primary=True)
    assert membership.org_unit == env["team"]
    assert membership.org_role == OrgUnitMember.OrgRole.ADVISOR
    assert not MentorBinding.objects.filter(workspace=env["workspace"], mentee=advisor).exists()


def test_preview_can_assign_primary_org_to_new_referenced_advisor(env):
    batch = create_single(env, advisors=[{"name": "新导师", "email": "new-primary@example.com"}])
    include_row(env, batch)
    checked = client_for(env["admin"]).post(
        user_imports_url(env["workspace"], f"{batch['id']}/approval-preview/"),
        {"advisor_primary_orgs": {"new-primary@example.com": str(env["group"].id)}},
        format="json",
    )
    assert checked.status_code == 200, checked.data
    assert checked.data["blockers"] == []
    assert not User.objects.filter(email="new-primary@example.com").exists()
    response = approve(env, batch, checked.data["token"])
    assert response.status_code == 200, response.data
    advisor = User.objects.get(email="new-primary@example.com")
    assert OrgUnitMember.objects.get(workspace=env["workspace"], user=advisor, is_primary=True).org_unit == env["group"]
    assert OrgUnitMember.objects.get(org_unit=env["team"], user=advisor, org_role="ADVISOR").is_primary is False


def test_existing_workspace_roster_is_row_error_but_other_rows_remain_reviewable(env):
    existing = make_user(email="already-member@example.com")
    add_workspace_member(env["workspace"], existing)
    response = post_import(
        env,
        row=roster_row(email=existing.email, student_no="EXISTING", co1="", co2="")
        + roster_row(email="new-member@example.com", student_no="NEW", co1="", co2=""),
        advisors=advisor_table("刘俊扬"),
    )
    assert response.status_code == 201, response.data
    assert [row["status"] for row in response.data["rows"]] == ["ERROR", "OK"]
    row = response.data["rows"][0]
    included = client_for(env["admin"]).patch(
        user_imports_url(env["workspace"], f"{response.data['id']}/rows/{row['id']}/"),
        {"review_decision": "INCLUDED"}, format="json",
    )
    assert included.status_code in (400, 409)
    assert not User.objects.filter(email="new-member@example.com").exists()


def test_instance_account_reuse_preserves_identity_and_password(env):
    existing = make_user(email="single-student@example.com", first_name="Original", last_name="Identity")
    existing.display_name = "Preserved display name"
    existing.save()
    identity = (existing.first_name, existing.last_name, existing.display_name, existing.password)
    batch, student = approved_student(env, display_name="Uploaded different name")

    student.refresh_from_db()
    assert student.id == existing.id
    assert (student.first_name, student.last_name, student.display_name, student.password) == identity
    assert WorkspaceMember.objects.filter(workspace=env["workspace"], member=student).exists()
    assert UserImportBatch.objects.get(pk=batch["id"]).rows.get().initial_password == ""


def test_instance_profile_identity_conflict_is_not_reviewable(env):
    existing = make_user(email="single-student@example.com")
    ResearchUserProfile.objects.create(
        user=existing,
        student_no="EXISTING-ADVISOR",
        category="ADVISOR",
    )

    batch = create_single(env)

    assert batch["rows"][0]["status"] == "ERROR"
    assert "人员类别" in batch["rows"][0]["message"]
    assert not WorkspaceMember.objects.filter(workspace=env["workspace"], member=existing).exists()


def test_edited_included_record_requires_review_again_and_invalidates_preview(env):
    batch = create_single(env)
    include_row(env, batch)
    checked = preview(env, batch)
    edited = client_for(env["admin"]).patch(
        user_imports_url(env["workspace"], f"{batch['id']}/rows/{batch['rows'][0]['id']}/"),
        {"phone": "18800000000"}, format="json",
    )
    assert edited.status_code == 200, edited.data
    assert UserImportBatch.objects.get(pk=batch["id"]).rows.get().review_decision == "PENDING"
    assert approve(env, batch, checked["token"]).status_code == 409
    assert not User.objects.filter(email="single-student@example.com").exists()


def test_new_workspace_membership_after_preview_invalidates_approval(env):
    batch = create_single(env)
    include_row(env, batch)
    checked = preview(env, batch)
    concurrently_added = make_user(email="single-student@example.com")
    add_workspace_member(env["workspace"], concurrently_added)

    response = approve(env, batch, checked["token"])
    assert response.status_code == 409, response.data
    assert UserImportBatch.objects.get(pk=batch["id"]).status == "PENDING_REVIEW"
    assert not OrgUnitMember.objects.filter(user=concurrently_added).exists()
    assert not MentorBinding.objects.filter(mentee=concurrently_added).exists()


def test_pending_batch_approval_requires_latest_preview_token(env):
    batch = create_single(env)
    include_row(env, batch)

    response = client_for(env["admin"]).post(
        user_imports_url(env["workspace"], f"{batch['id']}/approve/"),
        {},
        format="json",
    )

    assert response.status_code == 409, response.data
    assert UserImportBatch.objects.get(pk=batch["id"]).status == "PENDING_REVIEW"
    assert not User.objects.filter(email="single-student@example.com").exists()


def test_all_excluded_batch_is_blocked_in_explicit_approval_preview(env):
    batch = create_single(env)
    excluded = client_for(env["admin"]).patch(
        user_imports_url(env["workspace"], f"{batch['id']}/rows/{batch['rows'][0]['id']}/"),
        {"review_decision": "EXCLUDED"}, format="json",
    )
    assert excluded.status_code == 200, excluded.data
    checked = preview(env, batch)
    assert checked["included"] == []
    assert len(checked["excluded"]) == 1
    assert checked["blockers"]
    assert approve(env, batch, checked["token"]).status_code == 409
    assert not User.objects.filter(email="single-student@example.com").exists()


def test_report_uses_reviewed_values_instead_of_uploaded_raw_values(env):
    uploaded = post_import(env, row=roster_row(co1="", co2=""), advisors=advisor_table("刘俊扬"))
    assert uploaded.status_code == 201, uploaded.data
    batch = uploaded.data
    client = client_for(env["admin"])
    edited = client.patch(
        user_imports_url(env["workspace"], f"{batch['id']}/rows/{batch['rows'][0]['id']}/"),
        {"phone": "18812345678", "grade": "2027"}, format="json",
    )
    assert edited.status_code == 200, edited.data
    include_row(env, batch)
    response = approve(env, batch, preview(env, batch)["token"])
    assert response.status_code == 200, response.data
    report = client.get(user_imports_url(env["workspace"], f"{batch['id']}/report/"))
    assert report.status_code == 200
    rows = list(csv.DictReader(io.StringIO(report.content.decode("utf-8-sig"))))
    student = next(row for row in rows if row["邮箱"] == "student@example.com")
    assert student["手机号"] == "18812345678"
    assert student["年级"] == "2027"


def test_repeated_approval_does_not_duplicate_accounts_or_relationships(env):
    batch = create_single(env)
    include_row(env, batch)
    token = preview(env, batch)["token"]
    first = approve(env, batch, token)
    assert first.status_code == 200, first.data
    counts = (User.objects.count(), OrgUnitMember.objects.count(), MentorBinding.objects.count())
    second = approve(env, batch, token)
    assert second.status_code == 200, second.data
    assert (User.objects.count(), OrgUnitMember.objects.count(), MentorBinding.objects.count()) == counts


def test_approval_failure_rolls_back_accounts_profiles_and_relations_for_entire_batch(env, monkeypatch):
    from plane.research.services import user_import

    uploaded = post_import(
        env,
        row=roster_row(email="first-student@example.com", student_no="FIRST", co1="", co2="")
        + roster_row(email="second-student@example.com", student_no="SECOND", co1="", co2=""),
        advisors=advisor_table("刘俊扬"),
    )
    assert uploaded.status_code == 201, uploaded.data
    batch = uploaded.data
    include_row(env, batch, 0)
    include_row(env, batch, 1)
    token = preview(env, batch)["token"]
    original = user_import._import_row

    def fail_second(workspace, actor, row, *args, **kwargs):
        if row.email == "second-student@example.com" and not kwargs.get("dry_run", False):
            return {"status": "ERROR", "message": "Simulated second-row write failure"}
        return original(workspace, actor, row, *args, **kwargs)

    monkeypatch.setattr(user_import, "_import_row", fail_second)
    response = approve(env, batch, token)
    assert response.status_code in (400, 409), response.data
    assert not User.objects.filter(email__in=["first-student@example.com", "second-student@example.com"]).exists()
    assert not ResearchUserProfile.objects.filter(student_no__in=["FIRST", "SECOND"]).exists()
    assert not OrgUnitMember.objects.filter(workspace=env["workspace"]).exists()
    assert not MentorBinding.objects.filter(workspace=env["workspace"]).exists()
    assert not WorkspaceMember.objects.filter(workspace=env["workspace"], member=env["advisors"]["刘俊扬"]).exists()
    assert UserImportBatch.objects.get(pk=batch["id"]).status == "PENDING_REVIEW"


def test_same_named_advisors_are_distinguished_by_email(env):
    _, student = approved_student(env, advisors=[
        {"name": "同名导师", "email": "same-name-primary@example.com"},
        {"name": "同名导师", "email": "same-name-co@example.com"},
    ])
    bindings = MentorBinding.objects.filter(workspace=env["workspace"], mentee=student)
    assert set(bindings.values_list("mentor__email", "is_primary_advisor")) == {
        ("same-name-primary@example.com", True),
        ("same-name-co@example.com", False),
    }
    assert OrgUnitMember.objects.filter(
        workspace=env["workspace"], org_unit=env["team"], org_role="ADVISOR",
        user__email__in=["same-name-primary@example.com", "same-name-co@example.com"],
    ).count() == 2


def test_ordinary_member_cannot_create_single_import_or_preview_admin_batches(env):
    batch = create_single(env)
    ordinary = make_user()
    add_workspace_member(env["workspace"], ordinary)
    client = client_for(ordinary)
    created = client.post(user_imports_url(env["workspace"], "single/"), single_payload(env), format="json")
    checked = client.get(user_imports_url(env["workspace"], f"{batch['id']}/approval-preview/"))
    relations = client.get(user_imports_url(env["workspace"], f"{batch['id']}/relations/"))
    assert created.status_code == checked.status_code == relations.status_code == 403
    assert UserImportBatch.objects.filter(workspace=env["workspace"]).count() == 1


def test_single_import_rejects_organisation_from_another_workspace(env):
    other = make_workspace(owner=make_user())
    foreign_unit = OrgUnit.objects.create(
        workspace=other, name="外部小组", unit_type="TEAM", path="foreign", depth=0,
    )
    response = client_for(env["admin"]).post(
        user_imports_url(env["workspace"], "single/"),
        single_payload(env, org_unit=str(foreign_unit.id)), format="json",
    )
    assert response.status_code == 400, response.data
    assert not UserImportBatch.objects.filter(workspace=env["workspace"]).exists()
    assert not User.objects.filter(email="single-student@example.com").exists()


def test_missing_historical_mapping_is_previewed_and_repaired_once(env):
    batch, student = approved_student(env)
    # Simulate the earlier importer which never wrote the advisor's team role.
    membership = OrgUnitMember.objects.get(
        workspace=env["workspace"], org_unit=env["team"], user=env["advisors"]["刘俊扬"],
        org_role=OrgUnitMember.OrgRole.ADVISOR,
    )
    membership.delete(soft=False)
    client = client_for(env["admin"])
    url = user_imports_url(env["workspace"], f"{batch['id']}/relations/")
    checked = client.get(url)
    assert checked.status_code == 200, checked.data
    missing = [item for item in checked.data["items"] if item["status"] == "missing"]
    assert len(missing) == 1
    assert not OrgUnitMember.objects.filter(
        org_unit=env["team"], user=env["advisors"]["刘俊扬"], org_role="ADVISOR"
    ).exists()
    repaired = client.post(url, {
        "preview_token": checked.data["token"], "item_ids": [missing[0]["id"]],
    }, format="json")
    assert repaired.status_code == 200, repaired.data
    assert OrgUnitMember.objects.filter(
        org_unit=env["team"], user=env["advisors"]["刘俊扬"], org_role="ADVISOR"
    ).count() == 1
    audit = ResearchAuditEvent.objects.get(
        workspace=env["workspace"], metadata__operation="repair_import_relations",
    )
    assert audit.actor_id == env["admin"].id
    assert [item["id"] for item in audit.metadata["relations"]] == [missing[0]["id"]]
    repeated = client.post(url, {
        "preview_token": checked.data["token"], "item_ids": [missing[0]["id"]],
    }, format="json")
    assert repeated.status_code == 200, repeated.data
    assert OrgUnitMember.objects.filter(
        org_unit=env["team"], user=env["advisors"]["刘俊扬"], org_role="ADVISOR"
    ).count() == 1
    fresh = client.get(url)
    assert not any(item["status"] == "missing" for item in fresh.data["items"])
    assert MentorBinding.objects.filter(workspace=env["workspace"], mentee=student).count() == 1


@pytest.mark.parametrize("ended", [False, True])
def test_history_repair_does_not_resurrect_removed_or_ended_binding(env, ended):
    batch, student = approved_student(env)
    binding = MentorBinding.objects.get(workspace=env["workspace"], mentee=student)
    if ended:
        MentorBinding.objects.filter(pk=binding.pk).update(
            effective_from=timezone.localdate() - timedelta(days=2),
            effective_to=timezone.localdate() - timedelta(days=1),
        )
    else:
        MentorBinding.objects.filter(pk=binding.pk).update(deleted_at=timezone.now())
    client = client_for(env["admin"])
    url = user_imports_url(env["workspace"], f"{batch['id']}/relations/")
    checked = client.get(url)
    assert checked.status_code == 200, checked.data
    conflicts = [item for item in checked.data["items"] if item["status"] == "conflict"]
    assert conflicts
    assert not any(item["status"] == "missing" for item in checked.data["items"])
    response = client.post(url, {
        "preview_token": checked.data["token"], "item_ids": [item["id"] for item in conflicts],
    }, format="json")
    assert response.status_code in (400, 409), response.data
    assert not any(item.is_effective() for item in MentorBinding.objects.filter(
        workspace=env["workspace"], mentee=student, deleted_at__isnull=True,
    ))
