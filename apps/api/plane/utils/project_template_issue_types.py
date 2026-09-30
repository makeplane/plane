# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import IntegrityError

from plane.db.models import IssueType, IssueTypeProperty, Project, ProjectIssueType
from plane.utils.issue_type_property import clean_property_list


def seed_project_issue_types_from_template_payload(
    *,
    project: Project,
    payload: dict,
    created_by_id,
) -> None:
    if not payload.get("is_issue_type_enabled"):
        return
    if not getattr(project, "is_issue_type_enabled", False):
        return

    ws_id = project.workspace_id

    def _get_or_create_issue_type(*, name: str, description: str = "", is_epic: bool, is_default: bool):
        cleaned_name = (name or "").strip()[:255]
        if not cleaned_name:
            return None
        existing = IssueType.objects.filter(workspace_id=ws_id, name=cleaned_name, deleted_at__isnull=True).first()
        if existing:
            return existing
        try:
            return IssueType.objects.create(
                workspace_id=ws_id,
                name=cleaned_name,
                description=str(description or "")[:4096],
                is_epic=is_epic,
                is_default=is_default,
                created_by_id=created_by_id,
            )
        except IntegrityError:
            return IssueType.objects.filter(workspace_id=ws_id, name=cleaned_name, deleted_at__isnull=True).first()

    def _seed_properties(issue_type: IssueType | None, raw_properties):
        if issue_type is None or not raw_properties:
            return
        try:
            rows = clean_property_list(raw_properties)
        except ValueError:
            return
        for idx, row in enumerate(rows):
            exists = IssueTypeProperty.objects.filter(
                issue_type=issue_type,
                title=row["title"],
                deleted_at__isnull=True,
            ).first()
            if exists:
                continue
            try:
                IssueTypeProperty.objects.create(
                    workspace_id=issue_type.workspace_id,
                    issue_type=issue_type,
                    title=row["title"],
                    description=row.get("description", ""),
                    property_type=row["property_type"],
                    is_mandatory=row.get("is_mandatory", False),
                    is_active=row.get("is_active", True),
                    options=row.get("options", []),
                    select_mode=row.get("select_mode", "single"),
                    default_value=row.get("default_value"),
                    sort_order=(idx + 1) * 10000,
                    created_by_id=created_by_id,
                )
            except IntegrityError:
                pass

    def _link(project_: Project, issue_type: IssueType | None, *, level: int, is_default: bool):
        if issue_type is None:
            return
        if ProjectIssueType.objects.filter(project=project_, issue_type=issue_type, deleted_at__isnull=True).exists():
            return
        try:
            ProjectIssueType.objects.create(
                project=project_,
                issue_type=issue_type,
                workspace_id=project_.workspace_id,
                level=level,
                is_default=is_default,
                created_by_id=created_by_id,
            )
        except IntegrityError:
            pass

    task_type = _get_or_create_issue_type(name="Task", is_epic=False, is_default=True)
    _link(project, task_type, level=0, is_default=True)
    _seed_properties(task_type, payload.get("task_custom_properties"))

    if payload.get("epic_enabled"):
        epic_type = _get_or_create_issue_type(name="Epic", is_epic=True, is_default=False)
        _link(project, epic_type, level=1, is_default=False)
        _seed_properties(epic_type, payload.get("epic_custom_properties"))

    extra = payload.get("additional_work_item_types") or []
    if not isinstance(extra, list):
        return
    base_level = 2
    for idx, row in enumerate(extra[:20]):
        if not isinstance(row, dict):
            continue
        nm = str(row.get("name", "")).strip()[:255]
        if not nm:
            continue
        if nm.lower() in {"task", "epic"}:
            continue
        desc = str(row.get("description", "") or "")[:4096]
        it = _get_or_create_issue_type(name=nm, description=desc, is_epic=False, is_default=False)
        _link(project, it, level=base_level + idx, is_default=False)
        _seed_properties(it, row.get("custom_properties"))
