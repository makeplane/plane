"""Outbound dispatch from Plane → silo for project-scoped notifications.

When a work item changes (created, state changed, comment added, etc.),
the issue_activity task fires this Celery task with the event payload.
This task looks up the relevant `WorkspaceEntityConnection` rows for
the project (`type=slack-channel-notification`) and, if any are
configured for this event type, posts a single payload to silo via
the silo↔Django HMAC channel.

Silo handles all Slack formatting + delivery; Django stays out of
the Block Kit business.

The HMAC scheme matches what silo uses to call Django, just in the
reverse direction. Same shared secret, same algorithm. silo's events
endpoint validates it.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
import time

import requests
from celery import shared_task
from django.conf import settings

from plane.connections.models import WorkspaceEntityConnection, WorkspaceUserConnection
from plane.db.models import Issue, IssueComment, Project, State, User

log = logging.getLogger("plane.bgtasks.silo_notification")

SLACK_NOTIFICATION_TYPE = "slack-channel-notification"

# Map issue_activity event type → our payload event_type. Anything not
# in this map is ignored (we don't care about cycle/module/link/etc.
# for Slack notifications in v1).
ACTIVITY_EVENT_MAP = {
    "issue.activity.created": "work_item.created",
    "issue.activity.updated": "work_item.updated",  # narrowed below
    "comment.activity.created": "work_item.commented",
}

# Subscriptions advertised to the FE picker. Keep this in sync with
# `EVENT_OPTIONS` in apps/web/core/components/integration/slack-notifications/root.tsx.
EVENT_TYPES = (
    "work_item.created",
    "work_item.state_changed",
    "work_item.commented",
    "work_item.completed",
)


def _silo_url(path: str) -> str:
    base = (
        os.environ.get("SILO_INTERNAL_BASE_URL")
        or os.environ.get("SILO_PUBLIC_BASE_URL")
        or "http://silo:3005"
    )
    base_path = os.environ.get("SILO_BASE_PATH", "/silo")
    return f"{base.rstrip('/')}{base_path}{path}"


def _sign(method: str, path_with_silo_base: str, body: str) -> tuple[str, str]:
    secret = getattr(settings, "SILO_HMAC_SECRET_KEY", "") or ""
    ts = str(int(time.time()))
    body_hash = hashlib.sha256(body.encode("utf-8")).hexdigest()
    msg = f"{ts}.{method.upper()}.{path_with_silo_base}.{body_hash}"
    sig = hmac.new(secret.encode("utf-8"), msg.encode("utf-8"), hashlib.sha256).hexdigest()
    return ts, sig


def _render_comment_for_slack(comment: IssueComment, workspace_id: str) -> str:
    """Convert a Plane comment's HTML into Slack-mrkdwn-friendly text.

    Plane stores comments as HTML with `<mention-component>` tags
    embedding Plane user UUIDs. `comment_stripped` discards the tags
    entirely, so a comment "hey @selberg pachuko" becomes "hey
    pachuko" — the @-mention vanishes. Re-render each mention as
    `<@SLACK_USER_ID>` (Slack mention syntax) for users who have
    linked their Slack identity, or `@DisplayName` as a fallback.
    """
    from bs4 import BeautifulSoup

    html = comment.comment_html or ""
    if "mention-component" not in html:
        # Fast path — comment has no mentions, plain stripped text is fine.
        return comment.comment_stripped or ""

    soup = BeautifulSoup(html, "html.parser")
    plane_user_ids = {
        tag.get("entity_identifier")
        for tag in soup.find_all("mention-component", attrs={"entity_name": "user_mention"})
        if tag.get("entity_identifier")
    }
    if not plane_user_ids:
        return comment.comment_stripped or ""

    slack_by_plane: dict[str, str] = {}
    for m in WorkspaceUserConnection.objects.filter(
        workspace_id=workspace_id,
        connection_type="slack",
        user_id__in=plane_user_ids,
        deleted_at__isnull=True,
    ).select_related("user"):
        slack_by_plane[str(m.user_id)] = m.connection_id

    name_by_plane: dict[str, str] = {}
    for u in User.objects.filter(id__in=plane_user_ids):
        name_by_plane[str(u.id)] = u.display_name or u.email or "user"

    for tag in soup.find_all("mention-component", attrs={"entity_name": "user_mention"}):
        plane_uid = tag.get("entity_identifier")
        if not plane_uid:
            tag.replace_with("")
            continue
        slack_uid = slack_by_plane.get(str(plane_uid))
        if slack_uid:
            tag.replace_with(f"<@{slack_uid}>")
        else:
            tag.replace_with(f"@{name_by_plane.get(str(plane_uid), 'user')}")

    return soup.get_text(separator="").strip()


@shared_task
def dispatch_silo_work_item_event(
    activity_type: str,
    issue_id: str | None,
    project_id: str,
    actor_id: str | None,
    requested_data: str | None = None,
    current_instance: str | None = None,
) -> None:
    """Build the silo payload for an activity and POST it.

    No-ops if the workspace has no Slack notification mappings for
    this project — cheap fast path so this can be called on every
    activity without measurable cost.
    """
    try:
        event_type = ACTIVITY_EVENT_MAP.get(activity_type)
        if not event_type:
            return

        # Cheap existence check: is anything bound for this project?
        mappings_qs = WorkspaceEntityConnection.objects.filter(
            project_id=project_id, type=SLACK_NOTIFICATION_TYPE
        )
        if not mappings_qs.exists():
            return

        try:
            project = Project.objects.select_related("workspace").get(pk=project_id)
        except Project.DoesNotExist:
            return

        issue = None
        if issue_id:
            issue = (
                Issue.objects.select_related("state")
                .filter(pk=issue_id, project_id=project_id)
                .first()
            )

        comment = None
        # comment.activity.created passes the serialized new comment in
        # `requested_data` (Plane's public API does this). Older code
        # paths (silo's create-comment view) pass it in `current_instance`.
        # Look in both.
        if event_type == "work_item.commented":
            for blob in (requested_data, current_instance):
                if not blob:
                    continue
                try:
                    ci = json.loads(blob) if isinstance(blob, str) else blob
                except (json.JSONDecodeError, TypeError):
                    continue
                if not isinstance(ci, dict):
                    continue
                comment_id = ci.get("id")
                if comment_id:
                    comment = IssueComment.objects.filter(pk=comment_id).first()
                    if comment:
                        break

        # For `issue.activity.updated`, narrow event_type based on
        # what actually changed. `requested_data` has the new values,
        # `current_instance` is the row pre-change. We only care about
        # state transitions for Slack — other field changes are too
        # chatty to fan out by default.
        prev_state = None
        new_state = None
        if event_type == "work_item.updated":
            try:
                req = json.loads(requested_data) if isinstance(requested_data, str) else (requested_data or {})
                ci = json.loads(current_instance) if isinstance(current_instance, str) else (current_instance or {})
            except (json.JSONDecodeError, TypeError):
                req, ci = {}, {}

            new_state_id = req.get("state_id") or req.get("state")
            prev_state_id = ci.get("state_id") or ci.get("state")
            if not new_state_id or not prev_state_id or new_state_id == prev_state_id:
                # Not a state change — silo doesn't care about other
                # field changes for v1 notifications.
                return

            states = {
                str(s.id): s
                for s in State.objects.filter(id__in=[new_state_id, prev_state_id])
            }
            new_state = states.get(str(new_state_id))
            prev_state = states.get(str(prev_state_id))

            # Promote to `work_item.completed` if the new state's group
            # is completed/cancelled — channels often subscribe to one
            # but not the other, so the more specific event lets them
            # filter cleanly.
            if new_state and new_state.group in ("completed", "cancelled"):
                event_type = "work_item.completed"
            else:
                event_type = "work_item.state_changed"

        actor = None
        if actor_id:
            actor = User.objects.filter(pk=actor_id).first()

        # Per-user DM targets:
        #   - newly-assigned users (issue.activity.updated where
        #     assignee_ids changed, OR issue.activity.created when the
        #     creator picked assignees up front)
        #   - users @-mentioned in the description (created/updated)
        #     or the comment body
        # Each maps to a Slack user_id via WorkspaceUserConnection.
        # We exclude the actor — Slack DMing yourself when you assign
        # yourself or mention yourself in a comment is just noise.
        affected_plane_user_ids: set[str] = set()

        try:
            req = json.loads(requested_data) if isinstance(requested_data, str) else (requested_data or {})
            ci = json.loads(current_instance) if isinstance(current_instance, str) else (current_instance or {})
        except (json.JSONDecodeError, TypeError):
            req, ci = {}, {}

        if event_type in ("work_item.created", "work_item.state_changed", "work_item.completed"):
            new_assignees = set(req.get("assignee_ids") or req.get("assignees") or [])
            old_assignees = set(ci.get("assignee_ids") or ci.get("assignees") or [])
            added_assignees = new_assignees - old_assignees
            for uid in added_assignees:
                affected_plane_user_ids.add(str(uid))

            html = req.get("description_html")
            if html:
                from plane.bgtasks.notification_task import extract_mentions
                # extract_mentions takes a JSON string of the instance
                for uid in extract_mentions(json.dumps({"description_html": html})):
                    affected_plane_user_ids.add(str(uid))

        if event_type == "work_item.commented" and comment is not None:
            from plane.bgtasks.notification_task import extract_comment_mentions
            for uid in extract_comment_mentions(comment.comment_html or ""):
                affected_plane_user_ids.add(str(uid))

        # Skip self-DMs (you mentioned yourself, you assigned yourself).
        # Disable via SILO_DM_SKIP_SELF=False in dev to test the path
        # solo without needing a second user to mention you.
        if actor_id and os.environ.get("SILO_DM_SKIP_SELF", "True").lower() in ("true", "1", "yes"):
            affected_plane_user_ids.discard(str(actor_id))

        dm_targets = []
        if affected_plane_user_ids:
            mappings = WorkspaceUserConnection.objects.filter(
                workspace_id=project.workspace_id,
                connection_type="slack",
                user_id__in=affected_plane_user_ids,
                deleted_at__isnull=True,
            ).select_related("user")
            for m in mappings:
                # Honour each user's DM toggle. v1: opt-IN — only DM if
                # the user explicitly enabled it in Profile → Connections.
                cfg = m.config or {}
                if not cfg.get("dm_on_assign", True) and event_type != "work_item.commented":
                    continue
                if not cfg.get("dm_on_mention", True) and event_type == "work_item.commented":
                    continue
                dm_targets.append(
                    {
                        "plane_user_id": str(m.user_id),
                        "slack_user_id": m.connection_id,
                    }
                )

        payload = {
            "event_type": event_type,
            "activity_type": activity_type,
            "workspace_slug": project.workspace.slug,
            "workspace_id": str(project.workspace_id),
            "project_id": str(project.id),
            "project_identifier": project.identifier,
            "issue": (
                {
                    "id": str(issue.id),
                    "sequence_id": issue.sequence_id,
                    "name": issue.name,
                    "state_name": issue.state.name if issue.state_id else None,
                    "state_group": issue.state.group if issue.state_id else None,
                    "priority": issue.priority,
                }
                if issue
                else None
            ),
            "actor": (
                {
                    "id": str(actor.id),
                    "display_name": actor.display_name,
                    "email": actor.email,
                }
                if actor
                else None
            ),
            "comment_text": _render_comment_for_slack(comment, project.workspace_id) if comment else None,
            "state_change": (
                {
                    "from_name": prev_state.name if prev_state else None,
                    "from_group": prev_state.group if prev_state else None,
                    "to_name": new_state.name if new_state else None,
                    "to_group": new_state.group if new_state else None,
                }
                if (prev_state or new_state)
                else None
            ),
            "dm_targets": dm_targets,
        }

        body = json.dumps(payload)
        path = "/api/notifications/work-item-event"
        full_silo_path = (os.environ.get("SILO_BASE_PATH", "/silo")) + path
        ts, sig = _sign("POST", full_silo_path, body)

        url = _silo_url(path)
        try:
            r = requests.post(
                url,
                data=body,
                headers={
                    "Content-Type": "application/json",
                    "X-Silo-Timestamp": ts,
                    "X-Silo-Signature": sig,
                },
                timeout=5,
            )
            if r.status_code >= 300:
                log.warning(
                    "silo notification rejected: status=%s body=%s url=%s",
                    r.status_code,
                    r.text[:200],
                    url,
                )
        except requests.RequestException as e:
            log.warning("silo notification post failed: %s", e)
    except Exception:
        # Never let this kill the surrounding activity flow.
        log.exception("dispatch_silo_work_item_event crashed")