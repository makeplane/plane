# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Workspace level research configuration.

A workspace without a ``WorkspaceResearchSetting`` row renders the research
module by default: the workspace switch falls back to the deployment level
switch, so a partially rolled out installation still behaves predictably.
The row becomes authoritative as soon as it exists, which is how an
administrator opts a single workspace back out.
"""

from plane.research.utils.config import (
    research_file_limits,
    research_gate_defaults,
    research_module_enabled,
    research_submodule_defaults,
)
from plane.utils.constants import DEFAULT_TIMEZONE


def default_workspace_research_settings():
    limits = research_file_limits()
    return {
        "module_enabled": research_module_enabled(),
        "purpose": "GENERAL",
        "main_pi": None,
        "required_reporter_categories": ["STUDENT", "POSTDOC"],
        "org_enabled": True,
        "report_enabled": True,
        "approval_enabled": True,
        "allow_multiple_projects": False,
        "default_report_visibility": "DIRECT_ADVISOR",
        "weekly_default_visibility": None,
        "monthly_default_visibility": None,
        "timezone": DEFAULT_TIMEZONE,
        "audit_retention_days": 0,
        **research_submodule_defaults(),
        **research_gate_defaults(),
        **limits,
    }


def get_workspace_research_settings(workspace):
    """Return the effective research settings for a workspace."""
    defaults = default_workspace_research_settings()
    try:
        from plane.db.models import WorkspaceResearchSetting
    except ImportError:  # pragma: no cover - model not shipped yet
        return defaults

    setting = WorkspaceResearchSetting.objects.filter(workspace=workspace).first()
    if setting is None:
        return defaults

    return {
        "module_enabled": bool(setting.module_enabled),
        "purpose": setting.purpose,
        "main_pi": setting.main_pi_id,
        "required_reporter_categories": setting.required_reporter_categories,
        "org_enabled": bool(setting.org_enabled),
        "report_enabled": bool(setting.report_enabled),
        "approval_enabled": bool(setting.approval_enabled),
        "allow_multiple_projects": bool(setting.allow_multiple_projects),
        "default_report_visibility": setting.default_report_visibility,
        "weekly_default_visibility": setting.weekly_default_visibility,
        "monthly_default_visibility": setting.monthly_default_visibility,
        "timezone": setting.timezone or getattr(workspace, "timezone", None),
        "audit_retention_days": setting.audit_retention_days,
        "image_max_mb": setting.image_max_mb,
        "pdf_max_mb": setting.pdf_max_mb,
        "markdown_max_mb": setting.markdown_max_mb,
        "stage_enabled": bool(setting.stage_enabled),
        "experiment_enabled": bool(setting.experiment_enabled),
        "code_enabled": bool(setting.code_enabled),
        "integration_enabled": bool(setting.integration_enabled),
        "literature_min_included": setting.literature_min_included,
        "literature_max_entries": setting.literature_max_entries,
        "stage_min_reviewers": setting.stage_min_reviewers,
        "stage_pass_ratio": setting.stage_pass_ratio,
        "code_snapshot_max_mb": setting.code_snapshot_max_mb,
    }


def workspace_research_enabled(workspace) -> bool:
    """The deployment switch always wins over the workspace switch."""
    if not research_module_enabled():
        return False
    return bool(get_workspace_research_settings(workspace)["module_enabled"])


def workspace_research_sections(workspace):
    settings = get_workspace_research_settings(workspace)
    enabled = workspace_research_enabled(workspace)
    return {
        "org": bool(enabled and settings["org_enabled"]),
        "reports": bool(enabled and settings["report_enabled"]),
        "approvals": bool(enabled and settings["approval_enabled"]),
        "stages": bool(enabled and settings["stage_enabled"]),
        "experiments": bool(enabled and settings["experiment_enabled"]),
        "code": bool(enabled and settings["code_enabled"]),
        "integrations": bool(enabled and settings["integration_enabled"]),
    }


def default_visibility_for(report_type, workspace):
    settings = get_workspace_research_settings(workspace)
    if report_type == "WEEKLY" and settings["weekly_default_visibility"]:
        return settings["weekly_default_visibility"]
    if report_type == "MONTHLY" and settings["monthly_default_visibility"]:
        return settings["monthly_default_visibility"]
    return settings["default_report_visibility"]
