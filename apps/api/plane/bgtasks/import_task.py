# [FA-CUSTOM] Background task for file-based CSV/XLSX issue import
import json
import logging
from datetime import datetime

from celery import shared_task
from django.contrib.auth import get_user_model
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import (
    ImportJob,
    Issue,
    IssueAssignee,
    IssueLabel,
    Label,
    ProjectMember,
    State,
    WorkspaceMember,
)
from plane.utils.exception_logger import log_exception
from plane.utils.importers.presets import get_priority_map

User = get_user_model()

logger = logging.getLogger(__name__)

VALID_PRIORITIES = {"urgent", "high", "medium", "low", "none"}

PRIORITY_ALIASES = {
    "critical": "urgent",
    "highest": "urgent",
    "normal": "medium",
    "minor": "low",
    "trivial": "none",
}

# Values that external tools (ClickUp, Jira, Asana, etc.) use to
# represent "no value" in CSV/XLSX exports.
_NULL_STRINGS = frozenset({
    "null", "none", "n/a", "na", "nan", "undefined", "-", "—",
})


def _clean_cell(value: str | None) -> str | None:
    """Sanitise a single CSV cell value.

    * Strips whitespace
    * Strips surrounding brackets / braces (``[]``, ``{}``)
    * Converts null-like strings to ``None``

    Returns the cleaned string, or ``None`` when the cell is effectively
    empty.
    """
    if value is None:
        return None
    value = str(value).strip().strip("[]{}").strip()
    if not value or value.lower() in _NULL_STRINGS:
        return None
    return value


def _resolve_assignee_user(
    mapped_user_id, project, workspace, actor_id,
    member_lookup, workspace_member_lookup,
):
    """
    Resolve a mapped_user_id to a User instance, auto-adding
    workspace members or pending-invite users to the project as needed.

    Returns the User or None.
    """
    if mapped_user_id.startswith("invite:"):
        invite_email = mapped_user_id[len("invite:"):]
        invited_user = User.objects.filter(email=invite_email).first()
        if not invited_user:
            return None
        ws_membership = WorkspaceMember.objects.filter(
            workspace=workspace, member=invited_user, is_active=True,
        ).first()
        if not ws_membership:
            return None
        _ensure_project_member(project, workspace, invited_user, actor_id)
        member_lookup[str(invited_user.id)] = invited_user
        return invited_user

    assignee_user = member_lookup.get(mapped_user_id)
    if assignee_user:
        return assignee_user

    if mapped_user_id in workspace_member_lookup:
        ws_user = workspace_member_lookup[mapped_user_id]
        _ensure_project_member(project, workspace, ws_user, actor_id)
        member_lookup[mapped_user_id] = ws_user
        return ws_user

    return None


def _ensure_project_member(project, workspace, user, actor_id):
    """Add a user to the project if not already a member."""
    ProjectMember.objects.get_or_create(
        project=project,
        member=user,
        defaults={
            "role": 15,
            "is_active": True,
            "workspace": workspace,
            "created_by_id": actor_id,
        },
    )


@shared_task
def issue_import_task(import_job_id: str, actor_id: str):
    """
    Two-pass import:
      Pass 1 — Create all issues (without parent links).
      Pass 2 — Resolve parent-child relationships.
    """
    try:
        import_job = ImportJob.objects.get(id=import_job_id)
        import_job.status = "processing"
        import_job.progress = 0
        import_job.save(update_fields=["status", "progress"])

        project = import_job.project
        workspace = import_job.workspace
        col_map = import_job.column_mapping
        status_map = import_job.status_mapping
        assignee_map = import_job.assignee_mapping
        # Build case-insensitive assignee map for robust matching
        assignee_map_normalized = {
            " ".join(k.lower().split()): v
            for k, v in assignee_map.items()
        }
        rows = import_job.parsed_data
        total = len(rows)

        if total == 0:
            import_job.status = "completed"
            import_job.progress = 100
            import_job.save(update_fields=["status", "progress"])
            return

        # Pre-fetch lookup tables
        state_lookup = {
            str(s.id): s for s in State.objects.filter(project=project)
        }
        default_state = (
            State.objects.filter(project=project, default=True)
            .exclude(is_triage=True)
            .first()
        )

        member_lookup = {}
        for pm in ProjectMember.objects.filter(
            project=project, is_active=True, role__gte=15
        ).select_related("member"):
            member_lookup[str(pm.member.id)] = pm.member

        # Workspace members not yet in the project (for auto-add during import)
        workspace_member_lookup = {}
        for wm in WorkspaceMember.objects.filter(
            workspace=workspace, is_active=True, role__gte=15
        ).exclude(
            member__id__in=[m.id for m in member_lookup.values()]
        ).select_related("member"):
            workspace_member_lookup[str(wm.member.id)] = wm.member

        label_lookup = {
            label.name.lower(): label
            for label in Label.objects.filter(project=project)
        }

        # Priority normalization from the detected preset
        priority_map = get_priority_map(import_job.detected_preset)

        # Track: external_id → created Issue (for parent resolution)
        external_to_issue = {}
        # Track: (issue, parent_external_id) for pass 2
        pending_parents = []

        errors = []
        imported = 0
        skipped = 0

        # ==== PASS 1: Create issues ====
        for idx, row in enumerate(rows):
            try:
                title_col = col_map.get("title", "")
                title = _clean_cell(row.get(title_col)) if title_col else None

                if not title:
                    errors.append({
                        "row": idx + 2,  # +2 for 1-indexed + header row
                        "error": "Title is empty",
                        "data": _truncate_row(row),
                    })
                    skipped += 1
                    continue

                # Build issue fields
                issue_data = {"name": title[:255]}

                # Description
                desc_col = col_map.get("description", "")
                desc_text = _clean_cell(row.get(desc_col)) if desc_col else None
                if desc_text:
                    issue_data["description_html"] = f"<p>{desc_text}</p>"
                    issue_data["description_stripped"] = desc_text

                # State
                status_col = col_map.get("status", "")
                raw_status = _clean_cell(row.get(status_col)) if status_col else None
                if raw_status:
                    mapped_state_id = status_map.get(raw_status)
                    if mapped_state_id and mapped_state_id in state_lookup:
                        issue_data["state"] = state_lookup[mapped_state_id]
                    elif default_state:
                        issue_data["state"] = default_state
                elif default_state:
                    issue_data["state"] = default_state

                # Priority
                priority_col = col_map.get("priority", "")
                raw_priority = _clean_cell(row.get(priority_col)) if priority_col else None
                if raw_priority:
                    raw_priority = raw_priority.lower()
                    normalized = priority_map.get(raw_priority, raw_priority)
                    normalized = PRIORITY_ALIASES.get(normalized, normalized)
                    if normalized in VALID_PRIORITIES:
                        issue_data["priority"] = normalized

                # Due date (target_date)
                due_col = col_map.get("due_date", "")
                due_val = _clean_cell(row.get(due_col)) if due_col else None
                if due_val:
                    parsed_date = _parse_date(due_val)
                    if parsed_date:
                        issue_data["target_date"] = parsed_date

                # Start date
                start_col = col_map.get("start_date", "")
                start_val = _clean_cell(row.get(start_col)) if start_col else None
                if start_val:
                    parsed_date = _parse_date(start_val)
                    if parsed_date:
                        issue_data["start_date"] = parsed_date

                # Create issue (handles advisory lock + sequence_id internally)
                issue = Issue(**issue_data, project=project, workspace=workspace)
                issue.save(created_by_id=actor_id)

                imported += 1

                # Assignees (may be comma-separated in file)
                assignee_col = col_map.get("assignee", "")
                assignee_val = _clean_cell(row.get(assignee_col)) if assignee_col else None
                if assignee_val:
                    raw_names = [
                        n.strip()
                        for n in assignee_val.split(",")
                        if n.strip()
                    ]
                    for raw_name in raw_names:
                        normalized_name = " ".join(raw_name.lower().split())
                        mapped_user_id = assignee_map_normalized.get(
                            normalized_name
                        )
                        if not mapped_user_id:
                            continue

                        assignee_user = _resolve_assignee_user(
                            mapped_user_id, project, workspace, actor_id,
                            member_lookup, workspace_member_lookup,
                        )
                        if assignee_user:
                            IssueAssignee.objects.create(
                                issue=issue,
                                assignee=assignee_user,
                                project=project,
                                workspace=workspace,
                                created_by_id=actor_id,
                            )

                # Labels (comma-separated in file)
                label_col = col_map.get("labels", "")
                label_val = _clean_cell(row.get(label_col)) if label_col else None
                if label_val:
                    raw_labels = [
                        lbl.strip()
                        for lbl in label_val.split(",")
                        if lbl.strip()
                    ]
                    for lbl_name in raw_labels:
                        label = label_lookup.get(lbl_name.lower())
                        if not label:
                            # Auto-create label
                            label = Label.objects.create(
                                name=lbl_name,
                                project=project,
                                workspace=workspace,
                                created_by_id=actor_id,
                            )
                            label_lookup[lbl_name.lower()] = label
                        IssueLabel.objects.create(
                            issue=issue,
                            label=label,
                            project=project,
                            workspace=workspace,
                            created_by_id=actor_id,
                        )

                # Track external ID for parent resolution
                ext_id_col = col_map.get("external_id", "")
                ext_id = _clean_cell(row.get(ext_id_col)) if ext_id_col else None
                if ext_id:
                    external_to_issue[ext_id] = issue

                # Also map by row number (1-based, accounting for header)
                external_to_issue[str(idx + 2)] = issue

                # Track parent relationship for Pass 2
                parent_col = col_map.get("parent_task_id", "")
                parent_ref = _clean_cell(row.get(parent_col)) if parent_col else None
                if parent_ref:
                    pending_parents.append((issue, parent_ref))

                # Log activity (batched — every 50th issue + first)
                if imported == 1 or imported % 50 == 0:
                    issue_activity.delay(
                        type="issue.activity.created",
                        requested_data=json.dumps(
                            {"name": title},
                            cls=DjangoJSONEncoder,
                        ),
                        actor_id=actor_id,
                        issue_id=str(issue.id),
                        project_id=str(project.id),
                        current_instance=None,
                        epoch=int(timezone.now().timestamp()),
                        notification=False,
                        origin="import",
                    )

            except Exception as e:
                errors.append({
                    "row": idx + 2,
                    "error": str(e)[:500],
                    "data": _truncate_row(row),
                })
                skipped += 1
                log_exception(e)

            # Update progress every 10 rows
            if (idx + 1) % 10 == 0 or idx == total - 1:
                progress = int(((idx + 1) / total) * 90)  # 90% for pass 1
                ImportJob.objects.filter(id=import_job_id).update(
                    progress=progress,
                    imported_count=imported,
                    skipped_count=skipped,
                    error_count=len(errors),
                )

        # ==== PASS 2: Resolve parent-child relationships ====
        for issue, parent_ref in pending_parents:
            try:
                parent_issue = external_to_issue.get(parent_ref)
                if parent_issue:
                    issue.parent = parent_issue
                    issue.save(update_fields=["parent"])
                else:
                    errors.append({
                        "row": "N/A",
                        "error": (
                            f"Parent '{parent_ref}' not found "
                            f"for issue '{issue.name}'"
                        ),
                        "data": {},
                    })
            except Exception as e:
                errors.append({
                    "row": "N/A",
                    "error": f"Parent resolution failed: {str(e)[:300]}",
                    "data": {},
                })

        # Finalize
        final_status = "completed"
        if errors:
            final_status = "completed_with_errors"
        if imported == 0:
            final_status = "failed"

        import_job.refresh_from_db()
        import_job.status = final_status
        import_job.progress = 100
        import_job.imported_count = imported
        import_job.skipped_count = skipped
        import_job.error_count = len(errors)
        import_job.error_log = errors[:500]  # Cap at 500 error entries
        import_job.parsed_data = []  # Clear to save space
        import_job.save(
            update_fields=[
                "status",
                "progress",
                "imported_count",
                "skipped_count",
                "error_count",
                "error_log",
                "parsed_data",
            ]
        )

    except Exception as e:
        try:
            import_job = ImportJob.objects.get(id=import_job_id)
            import_job.status = "failed"
            import_job.error_log = [
                {"row": 0, "error": str(e)[:1000], "data": {}}
            ]
            import_job.save(update_fields=["status", "error_log"])
        except Exception:
            pass
        log_exception(e)


def _parse_date(date_str: str):
    """Try multiple common date formats and return a date object or None."""
    formats = [
        "%Y-%m-%d",
        "%m/%d/%Y",
        "%d/%m/%Y",
        "%Y/%m/%d",
        "%m-%d-%Y",
        "%d-%m-%Y",
        "%b %d, %Y",
        "%B %d, %Y",
        "%d %b %Y",
        "%d %B %Y",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt).date()
        except ValueError:
            continue
    return None


def _truncate_row(row: dict) -> dict:
    """Truncate row values for error log storage."""
    return {k: str(v)[:100] for k, v in row.items()} if row else {}
