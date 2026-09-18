# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Canonical ACL projections for project-scoped research resources."""

from plane.research.utils.acl import ResearchResource
from plane.db.models import ExperimentRecord, ResearchProjectProfile


def _project_profile(instance):
    return getattr(instance.project, "research_profile", None)


def _is_team(profile):
    return bool(
        profile
        and profile.research_type == ResearchProjectProfile.ResearchType.RESEARCH_PROJECT
    )


def repository_resource(repository) -> ResearchResource:
    profile = _project_profile(repository)
    is_private = repository.visibility == repository.Visibility.PRIVATE
    return ResearchResource(
        kind="code_repository",
        workspace_id=repository.workspace_id,
        owner_id=repository.created_by_id or (profile.owner_id if profile else None),
        org_unit_id=profile.org_unit_id if profile else None,
        visibility="PRIVATE" if is_private else "DIRECT_ADVISOR",
        state=repository.status,
        is_draft=is_private,
        project_id=repository.project_id,
        is_team_content=_is_team(profile),
    )


def outcome_resource(outcome) -> ResearchResource:
    profile = _project_profile(outcome)
    return ResearchResource(
        kind="research_outcome",
        workspace_id=outcome.workspace_id,
        owner_id=outcome.created_by_id or (profile.owner_id if profile else None),
        org_unit_id=profile.org_unit_id if profile else None,
        visibility=outcome.visibility,
        state=outcome.status,
        is_draft=outcome.status == outcome.Status.DRAFT,
        project_id=outcome.project_id,
        is_team_content=_is_team(profile),
    )


def experiment_resource(record: ExperimentRecord) -> ResearchResource:
    profile = _project_profile(record)
    return ResearchResource(
        kind="experiment_record",
        workspace_id=record.workspace_id,
        owner_id=record.owner_id,
        org_unit_id=(
            record.stage_instance.org_unit_id
            if record.stage_instance_id and record.stage_instance is not None
            else (profile.org_unit_id if profile else None)
        ),
        visibility=record.visibility,
        state=record.status,
        is_draft=record.submitted_at is None,
        project_id=record.project_id,
        is_team_content=_is_team(profile),
    )
