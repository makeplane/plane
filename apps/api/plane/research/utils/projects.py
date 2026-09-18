# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Research-project type, membership, and delegated-change helpers."""

import json

from django.core.serializers.json import DjangoJSONEncoder

from plane.db.models import ProjectMember, ResearchProjectProfile

PROJECT_ADMIN_ROLE = 20
PROJECT_MEMBER_ROLE = 15
TEAM_CONTENT_ROLES = (PROJECT_ADMIN_ROLE, PROJECT_MEMBER_ROLE)


def is_team_project(profile) -> bool:
    return bool(
        profile
        and profile.research_type == ResearchProjectProfile.ResearchType.RESEARCH_PROJECT
    )


def is_active_team_project_member(actor, profile) -> bool:
    """Return whether ``actor`` may add their own content to a team project."""
    if not is_team_project(profile) or actor is None:
        return False
    return ProjectMember.objects.filter(
        project_id=profile.project_id,
        workspace_id=profile.workspace_id,
        member=actor,
        role__in=TEAM_CONTENT_ROLES,
        is_active=True,
        deleted_at__isnull=True,
    ).exists()


def is_active_team_project_admin(actor, profile) -> bool:
    """Project role 20 is the explicit cross-author team-content grant."""
    if not is_team_project(profile) or actor is None:
        return False
    return ProjectMember.objects.filter(
        project_id=profile.project_id,
        workspace_id=profile.workspace_id,
        member=actor,
        role=PROJECT_ADMIN_ROLE,
        is_active=True,
        deleted_at__isnull=True,
    ).exists()


def can_create_research_content(actor, workspace, profile) -> bool:
    """Cultivation owners and active team members create their own content."""
    if profile is None:
        return False
    if profile.owner_id == actor.id:
        return True
    return is_active_team_project_member(actor, profile)


def can_manage_authored_team_content(actor, profile, instance) -> bool:
    """Team members may maintain content they created, never another author's."""
    return bool(
        is_active_team_project_member(actor, profile)
        and instance.created_by_id == actor.id
    )


def can_manage_team_content(actor, profile, instance) -> bool:
    """Allow own content, the project owner, or an explicitly promoted admin."""
    if not is_team_project(profile):
        return False
    if profile.owner_id == getattr(actor, "id", None):
        return True
    if can_manage_authored_team_content(actor, profile, instance):
        return True
    return is_active_team_project_admin(actor, profile)


def content_org_unit_id(profile, stage_instance=None):
    """Resolve content scope from its stage, falling back to its project."""
    if stage_instance is not None and stage_instance.org_unit_id:
        return stage_instance.org_unit_id
    return profile.org_unit_id if profile else None


def audit_field_snapshot(instance, fields, *, redacted_fields=()):
    """Return a detached, JSON-safe value snapshot for an audit event."""
    redacted = set(redacted_fields)
    values = {}
    for field_name in fields:
        if field_name in redacted:
            values[field_name] = "[redacted]"
            continue
        model_field = instance._meta.get_field(field_name)
        value = getattr(instance, model_field.attname if model_field.is_relation else field_name)
        values[field_name] = value
    return json.loads(json.dumps(values, cls=DjangoJSONEncoder))


def delegated_change_metadata(
    actor,
    instance,
    fields,
    before,
    *,
    redacted_fields=(),
    **metadata,
):
    """Build immutable before/after evidence for an authorised edit."""
    changed_fields = list(fields)
    return {
        **metadata,
        "fields": changed_fields,
        "delegated": instance.created_by_id != actor.id,
        "before": before,
        "after": audit_field_snapshot(
            instance,
            changed_fields,
            redacted_fields=redacted_fields,
        ),
    }
