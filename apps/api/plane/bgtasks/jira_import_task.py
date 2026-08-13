# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from html import escape

from celery import shared_task
from django.db import transaction

from plane.db.models import Importer, Issue, IssueLabel, Label, Project, State
from plane.utils.exception_logger import log_exception
from plane.utils.jira_importer import JIRA_EXTERNAL_SOURCE, JiraClient, jira_adf_to_text, jira_priority


@shared_task(bind=True, autoretry_for=(), max_retries=0)
def jira_import_task(self, importer_id: str, metadata: dict):
    try:
        importer = Importer.objects.select_related("workspace", "project", "initiated_by").get(id=importer_id, service="jira")
        if importer.status != "queued":
            return
        importer.status = "processing"
        importer.save(update_fields=["status"])

        client = JiraClient(metadata)
        stats = {"created": 0, "updated": 0, "failed": 0, "processed": 0, "errors": []}
        for jira_issue in client.iter_issues():
            importer.refresh_from_db(fields=["status"])
            if importer.status == "cancelled":
                importer.imported_data = stats
                importer.save(update_fields=["imported_data"])
                return
            result = _upsert_issue(importer, jira_issue)
            stats[result] += 1
            stats["processed"] += 1
            importer.imported_data = stats
            importer.save(update_fields=["imported_data"])

        importer.status = "completed"
        importer.imported_data = stats
        importer.save(update_fields=["status", "imported_data"])
    except Importer.DoesNotExist:
        return
    except Exception as exc:
        log_exception(exc)
        Importer.objects.filter(id=importer_id).update(status="failed", imported_data={"error": str(exc)})


def _upsert_issue(importer: Importer, jira_issue: dict) -> str:
    fields = jira_issue.get("fields", {})
    issue_key = str(jira_issue.get("key", "")).strip()
    if not issue_key:
        return "failed"

    state = _get_state(importer.project, fields.get("status"))
    description = escape(jira_adf_to_text(fields.get("description")))
    defaults = {
        "workspace": importer.workspace,
        "project": importer.project,
        "state": state,
        "name": (fields.get("summary") or issue_key)[:255],
        "description_html": f"<p>{description}</p>" if description else "<p></p>",
        "priority": jira_priority(fields.get("priority")),
        "created_by": importer.initiated_by,
    }

    with transaction.atomic():
        issue, created = Issue.objects.update_or_create(
            workspace=importer.workspace,
            project=importer.project,
            external_source=JIRA_EXTERNAL_SOURCE,
            external_id=issue_key,
            defaults=defaults,
        )
        _sync_labels(importer, issue, fields.get("labels") or [])
    return "created" if created else "updated"


def _get_state(project: Project, status: dict | None) -> State | None:
    status_name = ((status or {}).get("name") or "").strip()
    if not status_name:
        return State.objects.filter(project=project, default=True).first() or State.objects.filter(project=project).first()
    external_id = str((status or {}).get("id") or status_name)
    state = _existing_jira_state(project, status_name, external_id)
    if state is not None:
        return state
    return _create_jira_state(project, status_name, external_id)


def _existing_jira_state(project: Project, status_name: str, external_id: str) -> State | None:
    state = State.objects.filter(
        project=project,
        external_source=JIRA_EXTERNAL_SOURCE,
        external_id=external_id,
    ).first()
    if state is not None:
        return state
    state = State.objects.filter(project=project, name=status_name).first()
    if state is not None:
        state.external_source = JIRA_EXTERNAL_SOURCE
        state.external_id = external_id
        state.save(update_fields=["external_source", "external_id"])
        return state
    return None


def _create_jira_state(project: Project, status_name: str, external_id: str) -> State:
    return State.objects.create(
        project=project,
        workspace=project.workspace,
        external_source=JIRA_EXTERNAL_SOURCE,
        external_id=external_id,
        name=status_name[:255],
        color="#60646C",
        group="unstarted",
    )


def _sync_labels(importer: Importer, issue: Issue, labels: list[str]) -> None:
    label_objects = []
    for label_name in labels[:50]:
        label_name = str(label_name).strip()[:255]
        if not label_name:
            continue
        label_objects.append(_get_jira_label(importer, label_name))
    for label in label_objects:
        IssueLabel.objects.get_or_create(
            workspace=importer.workspace,
            project=importer.project,
            issue=issue,
            label=label,
        )


def _get_jira_label(importer: Importer, label_name: str) -> Label:
    label = Label.objects.filter(workspace=importer.workspace, project=importer.project, name=label_name).first()
    if label is not None:
        return label
    return Label.objects.create(
        workspace=importer.workspace,
        project=importer.project,
        external_source=JIRA_EXTERNAL_SOURCE,
        external_id=label_name,
        name=label_name,
        color="#60646C",
    )
