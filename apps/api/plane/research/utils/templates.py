# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Stage material templates and variable resolution (P1-OPN-08)."""

import re

from plane.db.models import ReportTemplate

VARIABLE_PATTERN = re.compile(r"\{\{\s*([a-z_]+)\s*\}\}")


def resolve_variables(content_json, values):
    """Return ``(resolved, unresolved)`` for a template body.

    Unresolved variables are reported so the caller can refuse to write the
    material instead of storing a half rendered document.
    """
    unresolved = set()

    def walk(node):
        if isinstance(node, dict):
            return {key: walk(value) for key, value in node.items()}
        if isinstance(node, list):
            return [walk(item) for item in node]
        if isinstance(node, str):

            def replace(match):
                name = match.group(1)
                if name in values and values[name] not in (None, ""):
                    return str(values[name])
                unresolved.add(name)
                return match.group(0)

            return VARIABLE_PATTERN.sub(replace, node)
        return node

    resolved = walk(content_json or {})
    return resolved, sorted(unresolved)


def template_values(*, user=None, project=None, stage="", org_unit="", period=""):
    return {
        "user": getattr(user, "display_name", "") if user is not None else "",
        "project": getattr(project, "name", "") if project is not None else "",
        "stage": stage,
        "period": period,
        "advisor": "",
        "org_unit": org_unit,
    }


def find_material_template(workspace, stage, material_type):
    return (
        ReportTemplate.objects.filter(
            workspace=workspace,
            scope=ReportTemplate.Scope.STAGE_MATERIAL,
            is_active=True,
            deleted_at__isnull=True,
            stage=stage,
            material_type=material_type,
        )
        .order_by("-is_default", "name")
        .first()
    )
