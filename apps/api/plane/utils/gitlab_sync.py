# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import re
from typing import Optional

from django.utils import timezone

from plane.db.models import (
    Issue,
    IssueActivity,
    IssueGitLabMeta,
    Project,
    ProjectGitLabConfig,
)
from plane.utils.state_transition import is_state_transition_allowed
from plane.utils.time_tracking import handle_issue_state_change

# Work item keys look like ENG-42 at the start of an MR title or commit message.
WORK_ITEM_KEY_RE = re.compile(r"^([A-Za-z][A-Za-z0-9_]{0,11})-(\d+)\b")
# GitLab prefixes draft MRs with "Draft:" / "WIP:" — strip before matching the key.
DRAFT_PREFIX_RE = re.compile(r"^(?i)(?:draft|wip)\s*:\s*")


def normalize_work_item_text(text: Optional[str]) -> str:
    if not text:
        return ""
    # Commit messages: only the subject line participates in matching.
    first_line = text.strip().split("\n", 1)[0].strip()
    return DRAFT_PREFIX_RE.sub("", first_line).strip()


def extract_work_item_key(text: Optional[str]) -> Optional[tuple[str, int]]:
    normalized = normalize_work_item_text(text)
    if not normalized:
        return None
    match = WORK_ITEM_KEY_RE.match(normalized)
    if not match:
        return None
    return match.group(1).upper(), int(match.group(2))


def resolve_issue(workspace_slug: str, identifier: str, sequence_id: int) -> Optional[Issue]:
    project = Project.objects.filter(
        workspace__slug=workspace_slug,
        identifier__iexact=identifier,
        archived_at__isnull=True,
    ).first()
    if not project:
        return None
    return Issue.issue_objects.filter(project=project, sequence_id=sequence_id).first()


def get_or_create_gitlab_meta(issue: Issue) -> IssueGitLabMeta:
    # OneToOne(issue) is unique even for soft-deleted rows — revive if needed.
    meta = IssueGitLabMeta.all_objects.filter(issue=issue).first()
    if meta is not None:
        if meta.deleted_at is not None:
            meta.deleted_at = None
            meta.project_id = issue.project_id
            meta.workspace_id = issue.workspace_id
            meta.save(
                update_fields=["deleted_at", "project_id", "workspace_id", "updated_at"],
                disable_auto_set_user=True,
            )
        return meta

    return IssueGitLabMeta.objects.create(
        issue=issue,
        project_id=issue.project_id,
        workspace_id=issue.workspace_id,
    )


def get_or_create_project_gitlab_config(project: Project) -> ProjectGitLabConfig:
    config = ProjectGitLabConfig.all_objects.filter(project=project).first()
    if config is not None:
        if config.deleted_at is not None:
            config.deleted_at = None
            config.workspace_id = project.workspace_id
            config.save(
                update_fields=["deleted_at", "workspace_id", "updated_at"],
                disable_auto_set_user=True,
            )
        return config

    return ProjectGitLabConfig.objects.create(
        project=project,
        workspace_id=project.workspace_id,
    )


def serialize_gitlab_meta(meta: Optional[IssueGitLabMeta]) -> dict:
    if not meta:
        return {
            "mr_status": "",
            "mr_url": "",
            "mr_iid": None,
            "mr_title": "",
            "commit_count": 0,
            "last_synced_at": None,
        }
    return {
        "mr_status": meta.mr_status,
        "mr_url": meta.mr_url,
        "mr_iid": meta.mr_iid,
        "mr_title": meta.mr_title,
        "commit_count": meta.commit_count,
        "last_synced_at": meta.last_synced_at,
    }


def upsert_mr_meta(
    issue: Issue, *, status: str, url: str = "", iid: Optional[int] = None, title: str = ""
) -> IssueGitLabMeta:
    meta = get_or_create_gitlab_meta(issue)
    meta.mr_status = (status or "").lower()
    if url:
        meta.mr_url = url
    if iid is not None:
        meta.mr_iid = iid
    if title:
        meta.mr_title = title[:500]
    meta.last_synced_at = timezone.now()
    meta.save(
        update_fields=["mr_status", "mr_url", "mr_iid", "mr_title", "last_synced_at", "updated_at"],
        disable_auto_set_user=True,
    )
    return meta


def add_commit_shas(issue: Issue, shas: list[str]) -> IssueGitLabMeta:
    meta = get_or_create_gitlab_meta(issue)
    existing = set(meta.commit_shas or [])
    added = False
    for sha in shas:
        if not sha or sha in existing:
            continue
        existing.add(sha)
        added = True
    if added:
        meta.commit_shas = list(existing)
        meta.commit_count = len(existing)
        meta.last_synced_at = timezone.now()
        meta.save(
            update_fields=["commit_shas", "commit_count", "last_synced_at", "updated_at"],
            disable_auto_set_user=True,
        )
    return meta


def maybe_transition_on_merge(issue: Issue) -> bool:
    """Move issue from configured 'from' state to 'to' state when MR is merged."""
    config = (
        ProjectGitLabConfig.objects.filter(project_id=issue.project_id, deleted_at__isnull=True)
        .select_related("merge_from_state", "merge_to_state")
        .first()
    )
    if not config or not config.merge_from_state_id or not config.merge_to_state_id:
        return False
    if str(issue.state_id) != str(config.merge_from_state_id):
        return False
    if str(issue.state_id) == str(config.merge_to_state_id):
        return False
    if not is_state_transition_allowed(issue.project_id, issue.state_id, config.merge_to_state_id):
        return False

    old_state = issue.state
    old_state_id = issue.state_id
    new_state = config.merge_to_state
    if new_state is None:
        return False

    issue.state = new_state
    # Match existing automation patterns (working_hours_task) — FK name in update_fields.
    issue.save(update_fields=["state", "updated_at"], disable_auto_set_user=True)
    handle_issue_state_change(issue, old_state_id, new_state.id, actor=None)

    IssueActivity.objects.create(
        issue_id=issue.id,
        project_id=issue.project_id,
        workspace_id=issue.workspace_id,
        actor=None,
        verb="updated",
        field="state",
        old_value=old_state.name if old_state else None,
        new_value=new_state.name,
        old_identifier=old_state.id if old_state else None,
        new_identifier=new_state.id,
        comment="updated the state via GitLab merge to",
        epoch=int(timezone.now().timestamp()),
    )
    return True


def handle_merge_request_event(workspace_slug: str, payload: dict) -> dict:
    attrs = payload.get("object_attributes") or {}
    title = attrs.get("title") or ""
    key = extract_work_item_key(title)
    if not key:
        return {"matched": False, "reason": "no_work_item_key_in_title"}

    identifier, sequence_id = key
    issue = resolve_issue(workspace_slug, identifier, sequence_id)
    if not issue:
        return {"matched": False, "reason": "issue_not_found", "key": f"{identifier}-{sequence_id}"}

    status_value = attrs.get("state") or ""
    upsert_mr_meta(
        issue,
        status=status_value,
        url=attrs.get("url") or "",
        iid=attrs.get("iid"),
        title=title,
    )

    transitioned = False
    action = (attrs.get("action") or "").lower()
    if action == "merge" or status_value.lower() == "merged":
        # Reload so we don't act on a stale state_id if the issue changed mid-request.
        issue = Issue.issue_objects.filter(pk=issue.id).select_related("state").first() or issue
        transitioned = maybe_transition_on_merge(issue)

    return {
        "matched": True,
        "issue_id": str(issue.id),
        "key": f"{identifier}-{sequence_id}",
        "mr_status": status_value,
        "transitioned": transitioned,
    }


def handle_push_event(workspace_slug: str, payload: dict) -> dict:
    commits = payload.get("commits") or []
    updated: dict[str, int] = {}

    for commit in commits:
        message = commit.get("message") or ""
        key = extract_work_item_key(message)
        if not key:
            continue
        identifier, sequence_id = key
        issue = resolve_issue(workspace_slug, identifier, sequence_id)
        if not issue:
            continue
        sha = commit.get("id") or commit.get("sha") or ""
        if not sha:
            continue
        meta = add_commit_shas(issue, [sha])
        updated[str(issue.id)] = meta.commit_count

    return {"matched": bool(updated), "updated_issues": updated}
