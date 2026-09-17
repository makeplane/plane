# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Shared helpers for the stage workflow (P1-A1).

Stage instances and stage materials reuse the single ACL entry point: this
module only projects them into ``ResearchResource`` objects so
``check_access`` stays the only place that answers "may this actor do this".
"""

from plane.db.models import ResearchProjectProfile, ResearchStageInstance
from plane.research.utils.acl import ResearchResource
from plane.research.utils.settings import get_workspace_research_settings

STAGE_RESOURCE_KIND = "stage_instance"
MATERIAL_RESOURCE_KIND = "stage_material"


def default_stage_visibility(workspace):
    """Stage objects inherit the workspace research default visibility."""
    return get_workspace_research_settings(workspace).get("default_report_visibility") or "DIRECT_ADVISOR"


def stage_queryset(workspace):
    return (
        ResearchStageInstance.objects.filter(workspace=workspace, deleted_at__isnull=True)
        .select_related("project", "org_unit")
        .prefetch_related("transitions")
        .order_by("project_id", "sort_order")
    )


def project_owner_id(project_id, workspace_id):
    """Owner of the research project, used as the ACL subject for stages."""
    profile = (
        ResearchProjectProfile.objects.filter(project_id=project_id, workspace_id=workspace_id)
        .values_list("owner_id", flat=True)
        .first()
    )
    return profile


def stage_resource(instance, *, owner_id=None, visibility=None, with_reviewers=False) -> ResearchResource:
    owner = owner_id or project_owner_id(instance.project_id, instance.workspace_id)
    reviewer_ids = []
    if with_reviewers:
        from plane.research.services.review_rules import effective_assignments

        reviewer_ids = [str(assignment.reviewer_id) for assignment in effective_assignments(instance)]
    profile = getattr(instance.project, "research_profile", None)
    if profile is None:
        profile = ResearchProjectProfile.objects.filter(
            project_id=instance.project_id,
            workspace_id=instance.workspace_id,
        ).first()
    return ResearchResource(
        kind=STAGE_RESOURCE_KIND,
        workspace_id=instance.workspace_id,
        owner_id=owner,
        org_unit_id=instance.org_unit_id,
        visibility=visibility or default_stage_visibility(instance.workspace),
        state=instance.status,
        # Stage metadata itself is not a private note. Draft protection applies
        # to each material Page through ``material_resource`` and Page guards.
        is_draft=False,
        reviewer_ids=reviewer_ids,
        project_id=instance.project_id,
        is_team_content=bool(profile and profile.research_type == ResearchProjectProfile.ResearchType.RESEARCH_PROJECT),
    )


def material_resource(
    material,
    *,
    stage=None,
    owner_id=None,
    visibility=None,
    with_reviewers=False,
) -> ResearchResource:
    stage = stage or material.stage_instance
    owner = owner_id or project_owner_id(stage.project_id, stage.workspace_id)
    reviewer_ids = []
    if with_reviewers:
        from plane.research.services.review_rules import effective_assignments

        reviewer_ids = [str(assignment.reviewer_id) for assignment in effective_assignments(stage)]
    profile = getattr(stage.project, "research_profile", None)
    return ResearchResource(
        kind=MATERIAL_RESOURCE_KIND,
        workspace_id=stage.workspace_id,
        owner_id=material.owner_id or owner,
        org_unit_id=stage.org_unit_id,
        visibility=visibility or material.visibility,
        state=material.status,
        # A draft with a submitted version has a private live revision and a
        # formal snapshot for authorised readers. A never-submitted draft has
        # no audience beyond its author.
        is_draft=material.status == "DRAFT" and not _has_submitted_material_version(material),
        reviewer_ids=reviewer_ids,
        project_id=stage.project_id,
        is_team_content=bool(profile and profile.research_type == ResearchProjectProfile.ResearchType.RESEARCH_PROJECT),
    )


def _has_submitted_material_version(material):
    prefetched = getattr(material, "_prefetched_objects_cache", {}).get("versions")
    versions = prefetched if prefetched is not None else material.versions.all()
    return any(version.snapshot.get("status") == "SUBMITTED" for version in versions)
