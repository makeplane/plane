# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Lark/Feishu Bot messaging helpers.

Keeps the Bot HTTP integration isolated so signal handlers and Celery
tasks stay readable. Token caching uses the Django cache so we don't
re-mint a tenant_access_token (2-hour TTL) on every notification.
"""

# Python imports
import json
import logging
import os

# Third party
import requests

# Django imports
from django.core.cache import cache

logger = logging.getLogger("plane.utils.lark_notify")

_TOKEN_CACHE_KEY = "lark:tenant_token"
_TOKEN_CACHE_TTL = 5400  # 90 min; Lark tokens expire after 2h, refresh well before


def _base_host():
    domain = (os.environ.get("LARK_BASE_DOMAIN") or "feishu.cn").strip()
    return f"https://open.{domain}"


def _get_tenant_token():
    cached = cache.get(_TOKEN_CACHE_KEY)
    if cached:
        return cached

    app_id = (os.environ.get("LARK_CLIENT_ID") or "").strip()
    app_secret = (os.environ.get("LARK_CLIENT_SECRET") or "").strip()
    if not (app_id and app_secret):
        return None

    try:
        resp = requests.post(
            f"{_base_host()}/open-apis/auth/v3/tenant_access_token/internal",
            json={"app_id": app_id, "app_secret": app_secret},
            timeout=10,
        )
        resp.raise_for_status()
        body = resp.json()
    except requests.RequestException as exc:
        logger.warning("Lark token fetch failed: %s", exc)
        return None

    if body.get("code", 0) != 0:
        logger.warning("Lark token returned non-zero code: %s", body)
        return None

    token = body.get("tenant_access_token")
    if token:
        cache.set(_TOKEN_CACHE_KEY, token, _TOKEN_CACHE_TTL)
    return token


def get_union_id(user):
    """Resolve a Plane user to their Lark union_id.

    Priority:
      1. Account row created by the OAuth provider (provider='lark') —
         provider_account_id is the union_id (see lark.py provider).
      2. Synthetic email parsing for users bulk-imported via the sync
         task but who haven't signed in via Lark yet.
    """
    if user is None:
        return None
    # Late import to avoid app-loading order issues
    from plane.db.models import Account

    try:
        account = Account.objects.filter(user=user, provider="lark").first()
        if account and account.provider_account_id:
            return account.provider_account_id
    except Exception:
        logger.exception("Account lookup failed for user=%s", user.id)

    email = (user.email or "").strip().lower()
    if email.endswith("@lark.local"):
        return email.split("@")[0]
    return None


def _send(union_id, msg_type, content_dict):
    if not union_id:
        return False
    token = _get_tenant_token()
    if not token:
        logger.warning("No Lark tenant_access_token — skipping notify to %s", union_id)
        return False

    try:
        resp = requests.post(
            f"{_base_host()}/open-apis/im/v1/messages",
            params={"receive_id_type": "union_id"},
            headers={"Authorization": f"Bearer {token}"},
            json={
                "receive_id": union_id,
                "msg_type": msg_type,
                "content": json.dumps(content_dict, ensure_ascii=False),
            },
            timeout=10,
        )
        body = resp.json()
    except requests.RequestException as exc:
        logger.warning("Lark IM send failed for %s: %s", union_id, exc)
        return False

    if body.get("code", 0) != 0:
        logger.warning("Lark IM non-zero for %s: %s", union_id, body)
        return False
    return True


def send_text(union_id, text):
    return _send(union_id, "text", {"text": text})


def send_interactive_card(union_id, card):
    """`card` is the full interactive-card JSON dict (header + elements)."""
    return _send(union_id, "interactive", card)


# ---------- Card builders --------------------------------------------------


def _plane_base_url():
    return (os.environ.get("PLANE_PUBLIC_BASE_URL") or "https://task.vijimgroup.com").rstrip("/")


def issue_url(workspace_slug, project_id, issue_id):
    return f"{_plane_base_url()}/{workspace_slug}/projects/{project_id}/issues/{issue_id}/"


def _short_id(issue):
    project_identifier = getattr(issue.project, "identifier", "") if getattr(issue, "project", None) else ""
    return f"{project_identifier}-{issue.sequence_id}" if project_identifier else f"#{issue.sequence_id}"


def card_issue_assigned(issue, assigner_name):
    short = _short_id(issue)
    url = issue_url(issue.workspace.slug, issue.project_id, issue.id)
    return {
        "config": {"wide_screen_mode": True},
        "header": {
            "title": {"tag": "plain_text", "content": "📋 你被分配了新任务"},
            "template": "blue",
        },
        "elements": [
            {
                "tag": "div",
                "fields": [
                    {"is_short": True, "text": {"tag": "lark_md", "content": f"**任务**\n{short}"}},
                    {
                        "is_short": True,
                        "text": {"tag": "lark_md", "content": f"**分配人**\n{assigner_name or '系统'}"},
                    },
                ],
            },
            {"tag": "div", "text": {"tag": "lark_md", "content": f"**标题**\n{issue.name}"}},
            {
                "tag": "action",
                "actions": [
                    {
                        "tag": "button",
                        "text": {"tag": "plain_text", "content": "查看任务 →"},
                        "type": "primary",
                        "url": url,
                    }
                ],
            },
        ],
    }


def card_issue_state_changed(issue, old_state_name, new_state_name, changer_name):
    short = _short_id(issue)
    url = issue_url(issue.workspace.slug, issue.project_id, issue.id)
    return {
        "config": {"wide_screen_mode": True},
        "header": {
            "title": {"tag": "plain_text", "content": "🔄 任务状态变更"},
            "template": "turquoise",
        },
        "elements": [
            {"tag": "div", "text": {"tag": "lark_md", "content": f"**{short}**: {issue.name}"}},
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**{old_state_name or '?'}** → **{new_state_name or '?'}** _by {changer_name or '系统'}_",
                },
            },
            {
                "tag": "action",
                "actions": [
                    {
                        "tag": "button",
                        "text": {"tag": "plain_text", "content": "查看任务 →"},
                        "url": url,
                    }
                ],
            },
        ],
    }


def card_issue_comment(issue, comment_excerpt, commenter_name):
    short = _short_id(issue)
    url = issue_url(issue.workspace.slug, issue.project_id, issue.id)
    return {
        "config": {"wide_screen_mode": True},
        "header": {
            "title": {"tag": "plain_text", "content": "💬 任务有新评论"},
            "template": "green",
        },
        "elements": [
            {"tag": "div", "text": {"tag": "lark_md", "content": f"**{short}**: {issue.name}"}},
            {
                "tag": "div",
                "text": {"tag": "lark_md", "content": f"**{commenter_name or '某人'}**: {comment_excerpt}"},
            },
            {
                "tag": "action",
                "actions": [
                    {
                        "tag": "button",
                        "text": {"tag": "plain_text", "content": "查看任务 →"},
                        "url": url,
                    }
                ],
            },
        ],
    }
