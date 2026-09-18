# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Multi reviewer contract tests (P1-REV-01 ~ P1-REV-12)."""

import pytest
from rest_framework.test import APIClient

from plane.db.models import (
    MATERIAL_TYPES_BY_STAGE,
    MentorBinding,
    OrgUnit,
    OrgUnitMember,
    ResearchAuditEvent,
    StageReview,
    StageReviewerAssignment,
    StageReviewRevision,
    StageTransition,
)
from plane.tests.research_fixtures import (
    add_workspace_member,
    enable_research,
    make_instance_admin,
    make_user,
    make_workspace,
)

pytestmark = pytest.mark.contract


@pytest.fixture(autouse=True)
def research_module_on(settings):
    settings.RESEARCH_MODULE_ENABLED = True


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def env(db):
    admin = make_user(first_name="Admin")
    make_instance_admin(admin)
    workspace = make_workspace(admin)
    enable_research(workspace, purpose="PUBLIC_RESEARCH", main_pi=admin)
    owner = make_user(first_name="Owner")
    add_workspace_member(workspace, owner)
    mentor = make_user(first_name="Mentor")
    add_workspace_member(workspace, mentor)
    pi = make_user(first_name="PI")
    add_workspace_member(workspace, pi)
    reviewer = make_user(first_name="Reviewer")
    add_workspace_member(workspace, reviewer)
    unit_admin = make_user(first_name="UnitAdmin")
    add_workspace_member(workspace, unit_admin)
    stranger = make_user(first_name="Stranger")
    add_workspace_member(workspace, stranger)

    root = OrgUnit.objects.create(
        workspace=workspace,
        name=workspace.name,
        parent=None,
        unit_type=OrgUnit.UnitType.ROOT,
        depth=0,
        path="",
    )
    root.path = f"/{str(root.id).replace('-', '')}/"
    root.save(update_fields=["path"])
    group = OrgUnit.objects.create(
        workspace=workspace,
        name="Group",
        parent=root,
        unit_type=OrgUnit.UnitType.GROUP,
        depth=1,
        path="",
    )
    group.path = f"{root.path}{str(group.id).replace('-', '')}/"
    group.save(update_fields=["path"])
    OrgUnitMember.objects.create(workspace=workspace, org_unit=group, user=pi, org_role=OrgUnitMember.OrgRole.PI)
    OrgUnitMember.objects.create(
        workspace=workspace, org_unit=group, user=unit_admin, org_role=OrgUnitMember.OrgRole.UNIT_ADMIN
    )
    MentorBinding.objects.create(workspace=workspace, mentee=owner, mentor=mentor)

    admin_client = client_for(admin)
    created = admin_client.post(
        f"/api/research/workspaces/{workspace.slug}/projects/",
        {"owner": str(owner.id), "org_unit": str(group.id), "research_type": "PHD"},
        format="json",
    )
    project_id = created.json()["id"]
    return {
        "admin": admin,
        "owner": owner,
        "mentor": mentor,
        "pi": pi,
        "reviewer": reviewer,
        "unit_admin": unit_admin,
        "stranger": stranger,
        "workspace": workspace,
        "project_id": project_id,
        "admin_client": admin_client,
        "owner_client": client_for(owner),
        "mentor_client": client_for(mentor),
        "pi_client": client_for(pi),
        "reviewer_client": client_for(reviewer),
        "unit_admin_client": client_for(unit_admin),
        "stranger_client": client_for(stranger),
    }


def stages_url(env):
    return f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/stages/"


def stage_url(env, stage_id, suffix=""):
    return f"/api/research/workspaces/{env['workspace'].slug}/stages/{stage_id}/{suffix}"


def reviews_url(env, suffix=""):
    return f"/api/research/workspaces/{env['workspace'].slug}/reviews/{suffix}"


def reviewers_url(env, stage_id):
    return stage_url(env, stage_id, "reviewers/")


def disable_literature_gate(env):
    response = env["admin_client"].patch(
        f"/api/research/workspaces/{env['workspace'].slug}/stage-requirements/",
        {
            "items": [
                {"stage": "PRE_OPENING", "code": code, "is_active": False}
                for code in ("literature_min_included", "literature_max_entries", "literature_quality")
            ]
        },
        format="json",
    )
    assert response.status_code == 200


def submitted_stage(env):
    """Walk PRE_OPENING to SUBMITTED and return its id."""
    stages = env["owner_client"].get(stages_url(env)).json()["results"]
    stage_id = next(item["id"] for item in stages if item["stage"] == "PRE_OPENING")
    disable_literature_gate(env)
    assert env["owner_client"].post(stage_url(env, stage_id, "enter/"), {}, format="json").status_code == 200
    for material_type in MATERIAL_TYPES_BY_STAGE["PRE_OPENING"]:
        created = env["owner_client"].post(
            stage_url(env, stage_id, "materials/"),
            {"material_type": material_type},
            format="json",
        )
        assert created.status_code == 201, created.json()
    submitted = env["owner_client"].post(stage_url(env, stage_id, "submit/"), {}, format="json")
    assert submitted.status_code == 200, submitted.json()
    return stage_id


def submit_review(env, stage_id, client, payload):
    return client.post(stage_url(env, stage_id, "reviews/"), payload, format="json")


@pytest.mark.django_db
class TestReviewerAssignment:
    def test_submission_assigns_the_mandatory_reviewers(self, env):
        stage_id = submitted_stage(env)
        payload = env["admin_client"].get(reviewers_url(env, stage_id)).json()
        roles = {item["reviewer_role"] for item in payload["results"]}
        assert roles == {"DIRECT_ADVISOR", "PI"}
        assert all(item["is_required"] for item in payload["results"])
        # the author is never part of the reviewer set (P1-REV-11)
        assert str(env["owner"].id) not in {item["reviewer"] for item in payload["results"]}

    def test_manual_assignment_and_revocation(self, env):
        stage_id = submitted_stage(env)
        created = env["admin_client"].post(
            reviewers_url(env, stage_id),
            {"reviewer": str(env["reviewer"].id), "reviewer_role": "REVIEWER"},
            format="json",
        )
        assert created.status_code == 201
        assignment_id = created.json()["id"]

        duplicate = env["admin_client"].post(
            reviewers_url(env, stage_id),
            {"reviewer": str(env["reviewer"].id), "reviewer_role": "REVIEWER"},
            format="json",
        )
        assert duplicate.status_code == 409

        revoked = env["admin_client"].delete(
            f"/api/research/workspaces/{env['workspace'].slug}/reviewers/{assignment_id}/"
        )
        assert revoked.status_code == 204
        assignment = StageReviewerAssignment.objects.get(pk=assignment_id)
        assert assignment.is_active is False
        assert assignment.superseded_at is not None

    def test_reminder_notifies_and_is_audited(self, env):
        stage_id = submitted_stage(env)
        assignment = StageReviewerAssignment.objects.filter(stage_instance_id=stage_id).first()
        response = env["admin_client"].post(
            f"/api/research/workspaces/{env['workspace'].slug}/reviewers/{assignment.id}/remind/",
            {"message": "please review"},
            format="json",
        )
        assert response.status_code == 200
        assert response.json()["notified"] == 1
        assert ResearchAuditEvent.objects.filter(
            workspace=env["workspace"], action="stage.review.remind"
        ).exists()

    def test_to_me_list_splits_required_and_optional(self, env):
        stage_id = submitted_stage(env)
        env["admin_client"].post(
            reviewers_url(env, stage_id),
            {"reviewer": str(env["reviewer"].id), "reviewer_role": "REVIEWER"},
            format="json",
        )
        to_me = env["mentor_client"].get(reviews_url(env, "?scope=to_me")).json()
        assert to_me["count"] == 1
        assert len(to_me["required"]) == 1
        assert to_me["optional"] == []

        optional = env["reviewer_client"].get(reviews_url(env, "?scope=to_me")).json()
        assert optional["count"] == 1
        assert len(optional["optional"]) == 1

        submit_review(env, stage_id, env["mentor_client"], {"recommendation": "PASS"})
        after = env["mentor_client"].get(reviews_url(env, "?scope=to_me")).json()
        assert after["count"] == 0


@pytest.mark.django_db
class TestReviewSubmission:
    def test_forbidden_cases(self, env):
        stage_id = submitted_stage(env)
        # the author never reviews their own stage (P1-REV-11)
        self_review = submit_review(env, stage_id, env["owner_client"], {"recommendation": "PASS"})
        assert self_review.status_code == 403
        assert self_review.json()["error_code"] == "stage_review_self_forbidden"
        # a member who cannot see the stage gets the "invisible" answer (§5.1)
        not_assigned = submit_review(env, stage_id, env["stranger_client"], {"recommendation": "PASS"})
        assert not_assigned.status_code == 404
        # a unit admin can see the stage but is not an assigned reviewer
        visible_but_unassigned = submit_review(
            env, stage_id, env["unit_admin_client"], {"recommendation": "PASS"}
        )
        assert visible_but_unassigned.status_code == 403
        assert visible_but_unassigned.json()["error_code"] == "stage_review_not_assigned"

    def test_reject_requires_a_comment(self, env):
        stage_id = submitted_stage(env)
        response = submit_review(env, stage_id, env["mentor_client"], {"recommendation": "REJECT"})
        assert response.status_code == 422
        assert response.json()["error_code"] == "stage_review_comment_required"

    def test_invalid_recommendation_is_rejected(self, env):
        stage_id = submitted_stage(env)
        response = submit_review(env, stage_id, env["mentor_client"], {"recommendation": "MAYBE"})
        assert response.status_code == 422
        assert response.json()["error_code"] == "stage_review_recommendation_invalid"

    def test_second_submission_must_use_revise(self, env):
        stage_id = submitted_stage(env)
        first = submit_review(env, stage_id, env["mentor_client"], {"recommendation": "PASS"})
        assert first.status_code == 201
        second = submit_review(env, stage_id, env["mentor_client"], {"recommendation": "REJECT", "comment": "no"})
        assert second.status_code == 409
        assert second.json()["error_code"] == "stage_review_state_conflict"

    def test_revision_keeps_every_version(self, env):
        stage_id = submitted_stage(env)
        created = submit_review(env, stage_id, env["mentor_client"], {"recommendation": "PASS", "comment": "first"})
        review_id = created.json()["id"]

        no_reason = env["mentor_client"].post(
            f"/api/research/workspaces/{env['workspace'].slug}/reviews/{review_id}/revise/",
            {"recommendation": "REVISE", "comment": "second"},
            format="json",
        )
        assert no_reason.status_code == 422
        assert no_reason.json()["error_code"] == "stage_review_revision_reason_required"

        revised = env["mentor_client"].post(
            f"/api/research/workspaces/{env['workspace'].slug}/reviews/{review_id}/revise/",
            {"recommendation": "REVISE", "comment": "second", "reason": "reconsidered after the meeting"},
            format="json",
        )
        assert revised.status_code == 200
        assert revised.json()["revision_no"] == 2
        assert revised.json()["recommendation"] == "REVISE"

        history = env["mentor_client"].get(
            f"/api/research/workspaces/{env['workspace'].slug}/reviews/{review_id}/revisions/"
        ).json()
        assert history["count"] == 2
        reasons = {item["reason"] for item in history["results"]}
        assert "reconsidered after the meeting" in reasons
        assert StageReviewRevision.objects.filter(review_id=review_id).count() == 2
        # the superseded recommendation is still visible in the trail
        assert any(item["recommendation"] == "PASS" for item in history["results"])


@pytest.mark.django_db
class TestReviewDecision:
    def _review_three(self, env, stage_id, advisor_recommendation="PASS"):
        env["admin_client"].post(
            reviewers_url(env, stage_id),
            {"reviewer": str(env["reviewer"].id), "reviewer_role": "REVIEWER"},
            format="json",
        )
        assert (
            submit_review(
                env,
                stage_id,
                env["mentor_client"],
                {"recommendation": advisor_recommendation, "comment": "advisor note"},
            ).status_code
            == 201
        )
        assert submit_review(env, stage_id, env["pi_client"], {"recommendation": "PASS"}).status_code == 201
        assert submit_review(env, stage_id, env["reviewer_client"], {"recommendation": "PASS"}).status_code == 201

    def test_pass_is_blocked_until_the_rule_is_satisfied(self, env):
        stage_id = submitted_stage(env)
        blocked = env["admin_client"].post(stage_url(env, stage_id, "pass/"), {}, format="json")
        assert blocked.status_code == 422
        assert blocked.json()["error_code"] == "stage_review_blocked"
        blocker = next(item for item in blocked.json()["blockers"] if item["code"] == "review_rule")
        assert set(blocker["pending_required_roles"]) == {"DIRECT_ADVISOR", "PI_BRANCH"}
        assert StageTransition.objects.filter(stage_instance_id=stage_id, action="PASS").count() == 0

    def test_pass_succeeds_and_freezes_the_summary(self, env):
        stage_id = submitted_stage(env)
        self._review_three(env, stage_id)
        passed = env["admin_client"].post(stage_url(env, stage_id, "pass/"), {}, format="json")
        assert passed.status_code == 200, passed.json()
        assert passed.json()["status"] == "PASSED"

        transition = StageTransition.objects.get(stage_instance_id=stage_id, action="PASS")
        snapshot = transition.review_snapshot
        assert snapshot["reviewer_count"] == 3
        assert snapshot["distribution"]["PASS"] == 3
        assert snapshot["rule_version"]
        assert len(snapshot["reviews"]) == 3

    def test_direct_advisor_reject_blocks_the_pass(self, env):
        stage_id = submitted_stage(env)
        self._review_three(env, stage_id, advisor_recommendation="REJECT")
        blocked = env["admin_client"].post(stage_url(env, stage_id, "pass/"), {}, format="json")
        assert blocked.status_code == 422
        blocker = next(item for item in blocked.json()["blockers"] if item["code"] == "review_rule")
        assert blocker["vetoed_by"] == str(env["mentor"].id)

    def test_insufficient_reviewers_block_the_pass(self, env):
        stage_id = submitted_stage(env)
        assert submit_review(env, stage_id, env["mentor_client"], {"recommendation": "PASS"}).status_code == 201
        assert submit_review(env, stage_id, env["pi_client"], {"recommendation": "PASS"}).status_code == 201
        blocked = env["admin_client"].post(stage_url(env, stage_id, "pass/"), {}, format="json")
        assert blocked.status_code == 422
        blocker = next(item for item in blocked.json()["blockers"] if item["code"] == "review_rule")
        assert blocker["actual"] == 2
        assert blocker["required"] == 3

    def test_review_summary_endpoint_reports_the_rules(self, env):
        stage_id = submitted_stage(env)
        payload = env["admin_client"].get(stage_url(env, stage_id, "review-summary/")).json()
        assert payload["rules"]["min_reviewers"] == 3
        assert payload["rules"]["advisor_veto"] is True
        assert payload["decision"]["passed"] is False
        assert payload["summary"]["assignment_count"] >= 2

    def test_resubmission_supersedes_reviews_and_assignments(self, env):
        stage_id = submitted_stage(env)
        assert submit_review(env, stage_id, env["mentor_client"], {"recommendation": "PASS"}).status_code == 201
        returned = env["admin_client"].post(
            stage_url(env, stage_id, "return/"), {"reason": "revise the gap analysis"}, format="json"
        )
        assert returned.status_code == 200
        env["owner_client"].post(stage_url(env, stage_id, "enter/"), {}, format="json")
        assert env["owner_client"].post(stage_url(env, stage_id, "submit/"), {}, format="json").status_code == 200

        assert StageReview.objects.filter(stage_instance_id=stage_id, is_superseded=True).count() == 1
        active = StageReviewerAssignment.objects.filter(stage_instance_id=stage_id, is_active=True)
        assert active.count() >= 2
        # superseded reviews no longer count towards the rule
        summary = env["admin_client"].get(stage_url(env, stage_id, "review-summary/")).json()
        assert summary["summary"]["reviewer_count"] == 0

    def test_scope_mine_lists_my_reviews(self, env):
        stage_id = submitted_stage(env)
        submit_review(env, stage_id, env["mentor_client"], {"recommendation": "PASS"})
        mine = env["mentor_client"].get(reviews_url(env, "?scope=mine")).json()
        assert mine["count"] == 1
        assert mine["results"][0]["recommendation"] == "PASS"
        others = env["pi_client"].get(reviews_url(env, "?scope=mine")).json()
        assert others["count"] == 0
