# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

import logging
from collections import defaultdict
from typing import Any
from uuid import UUID

from django.contrib.auth import get_user_model
from django.utils import timezone

from plane.db.models import Importer, Issue, IssueAssignee, IssueComment, IssueLabel, Label, Project, ProjectMember, State, Workspace
from plane.utils.importers.jira.constants import JIRA_EXTERNAL_SOURCE, JIRA_TESTCASE_LABEL
from plane.utils.importers.jira.transform import JiraTransformer

logger = logging.getLogger("plane.worker")
User = get_user_model()


class JiraLoader:
    def __init__(
        self,
        *,
        importer: Importer,
        workspace: Workspace,
        project: Project,
        actor: User,
        config: dict[str, Any],
        data: dict[str, Any],
    ):
        self.importer = importer
        self.workspace = workspace
        self.project = project
        self.actor = actor
        self.config = config
        self.data = data
        self.transformer = JiraTransformer(custom_field_mappings=config.get("custom_field_mappings"))
        self.stats: dict[str, Any] = defaultdict(int)
        self.id_map: dict[str, str] = {}
        self.warnings: list[str] = []
        self.state_map: dict[str, UUID] = {}
        self._progress_total = 1
        self._progress_completed = 0
        self._progress_phase = "setup"
        self._progress_save_every = 50

    def run(self, extracted: dict[str, Any]) -> dict[str, Any]:
        testcases = extracted.get("testcases", [])
        comments = extracted.get("comments", [])
        self._init_progress(testcases, comments)
        self._update_progress("setup", force=True)

        self.state_map = self._ensure_states()
        self._ensure_labels(testcases)
        user_map = self._resolve_users()
        self._update_progress("setup", increment=1, force=True)

        self._import_testcases(testcases, user_map)
        self._import_comments(comments, user_map)

        return {
            "progress": {
                "phase": "testcases",
                "completed": self._progress_total,
                "total": self._progress_total,
                "percent": 100,
            },
            "stats": dict(self.stats),
            "id_map": self.id_map,
            "warnings": self.warnings,
        }

    def _init_progress(self, testcases: list[dict[str, Any]], comments: list[dict[str, Any]]) -> None:
        self._progress_total = max(1 + len(testcases) + len(comments), 1)
        self._progress_completed = 0

    def _update_progress(self, phase: str, *, increment: int = 0, force: bool = False) -> None:
        self._progress_phase = phase
        if increment:
            self._progress_completed = min(self._progress_total, self._progress_completed + increment)

        should_save = force or increment == 0 or self._progress_completed % self._progress_save_every == 0
        if not should_save:
            return

        percent = min(99, int((self._progress_completed / self._progress_total) * 100))
        payload = {
            "progress": {
                "phase": self._progress_phase,
                "completed": self._progress_completed,
                "total": self._progress_total,
                "percent": percent,
            },
            "stats": dict(self.stats),
            "warnings": self.warnings,
        }
        self.importer.imported_data = payload
        Importer.objects.filter(pk=self.importer.pk).update(
            imported_data=payload,
            updated_at=timezone.now(),
        )

    def _ensure_states(self) -> dict[str, UUID]:
        states = State.objects.filter(project=self.project, deleted_at__isnull=True)
        grouped: dict[str, State] = {}
        for state in states:
            grouped.setdefault(state.group, state)

        state_map: dict[str, UUID] = {}
        overrides = self.config.get("state_mappings") or {}
        for jira_status, plane_state_id in overrides.items():
            if plane_state_id:
                state_map[jira_status] = UUID(str(plane_state_id))

        for state in states.iterator():
            if state.name:
                state_map[state.name] = state.id

        for group in ("unstarted", "started", "completed"):
            if group in grouped:
                state_map.setdefault(group, grouped[group].id)

        fallback = states.filter(default=True).first() or states.first()
        if fallback:
            state_map.setdefault("default", fallback.id)

        return state_map

    def _resolve_users(self) -> dict[str, UUID | None]:
        user_map: dict[str, UUID | None] = {}
        for item in self.data.get("users") or []:
            email = (item.get("email") or "").lower()
            if not email:
                continue
            if item.get("import") is False:
                user_map[email] = None
                continue
            plane_user_id = item.get("plane_user_id")
            if plane_user_id:
                user_map[email] = UUID(str(plane_user_id))
                continue
            user = User.objects.filter(email__iexact=email).first()
            if user and ProjectMember.objects.filter(project=self.project, member=user, is_active=True).exists():
                user_map[email] = user.id
            else:
                user_map[email] = self.actor.id
                self.warnings.append(f"Unmapped Jira user {email}; attributed to importer.")
        return user_map

    def _lookup_user(self, email: str | None, user_map: dict[str, UUID | None]) -> UUID:
        if not email:
            return self.actor.id
        mapped = user_map.get(email.lower())
        return mapped or self.actor.id

    def _ensure_labels(self, testcases: list[dict[str, Any]]) -> None:
        label_names: set[str] = {JIRA_TESTCASE_LABEL}
        for issue in testcases:
            label_names.update(self.transformer.collect_labels(issue))
        for name in sorted(label_names):
            existing = Label.objects.filter(
                project=self.project,
                name=name,
                external_source=JIRA_EXTERNAL_SOURCE,
                deleted_at__isnull=True,
            ).first()
            if existing:
                continue
            Label.objects.create(
                name=name,
                project=self.project,
                workspace=self.workspace,
                created_by=self.actor,
                external_source=JIRA_EXTERNAL_SOURCE,
                external_id=name,
            )
            self.stats["labels"] += 1

    def _resolve_state_id(self, issue: dict[str, Any]) -> UUID | None:
        fields = issue.get("fields") or {}
        status = fields.get("status") or {}
        status_name = status.get("name")
        if status_name and status_name in self.state_map:
            return self.state_map[status_name]

        group = self.transformer.map_status_group(status)
        if group in self.state_map:
            return self.state_map[group]

        return self.state_map.get("default")

    def _get_or_create_issue(
        self,
        *,
        external_id: str,
        issue: dict[str, Any],
        user_map: dict[str, UUID | None],
    ) -> Issue:
        fields = issue.get("fields") or {}
        existing = Issue.objects.filter(
            project=self.project,
            external_source=JIRA_EXTERNAL_SOURCE,
            external_id=external_id,
            deleted_at__isnull=True,
        ).first()
        if existing:
            self.id_map[external_id] = str(existing.id)
            self.stats["issues_skipped"] += 1
            return existing

        reporter = fields.get("reporter") or {}
        assignee = fields.get("assignee") or {}
        created_by_id = self._lookup_user(reporter.get("emailAddress"), user_map)
        assignee_id = self._lookup_user(assignee.get("emailAddress"), user_map)

        plane_issue = Issue(
            project=self.project,
            workspace=self.workspace,
            name=(fields.get("summary") or issue.get("key") or "Test case")[:255],
            description_html=self.transformer.testcase_description_html(issue),
            priority=self.transformer.map_priority(fields.get("priority")),
            state_id=self._resolve_state_id(issue),
            external_source=JIRA_EXTERNAL_SOURCE,
            external_id=external_id,
            created_by_id=created_by_id,
            updated_by_id=created_by_id,
        )
        plane_issue.save()

        created_at = self.transformer.parse_datetime(fields.get("created"))
        if created_at:
            Issue.objects.filter(id=plane_issue.id).update(created_at=created_at)

        if assignee_id:
            IssueAssignee.objects.get_or_create(
                issue=plane_issue,
                assignee_id=assignee_id,
                project=self.project,
                workspace=self.workspace,
                defaults={"created_by": self.actor},
            )

        labels = self.transformer.collect_labels(issue)
        labels.append(JIRA_TESTCASE_LABEL)
        self._attach_labels(plane_issue, labels)
        self.id_map[external_id] = str(plane_issue.id)
        self.stats["issues"] += 1
        self.stats["testcases"] += 1
        return plane_issue

    def _attach_labels(self, issue: Issue, labels: list[str]) -> None:
        for label_name in labels:
            label = Label.objects.filter(project=self.project, name=label_name, deleted_at__isnull=True).first()
            if not label:
                continue
            IssueLabel.objects.get_or_create(
                issue=issue,
                label=label,
                project=self.project,
                workspace=self.workspace,
                defaults={"created_by": self.actor},
            )

    def _import_testcases(self, testcases: list[dict[str, Any]], user_map: dict[str, UUID | None]) -> None:
        self._update_progress("testcases", force=True)
        for issue in testcases:
            external_id = issue.get("key") or issue.get("id")
            if not external_id:
                self._update_progress("testcases", increment=1)
                continue
            self._get_or_create_issue(external_id=str(external_id), issue=issue, user_map=user_map)
            self._update_progress("testcases", increment=1)

    def _import_comments(self, comments: list[dict[str, Any]], user_map: dict[str, UUID | None]) -> None:
        self._update_progress("comments", force=True)
        for comment in comments:
            external_id = comment.get("id")
            issue_key = comment.get("issue_key")
            if not external_id or not issue_key:
                self._update_progress("comments", increment=1)
                continue

            issue_id = self.id_map.get(str(issue_key))
            if not issue_id:
                self.stats["comments_skipped"] += 1
                self._update_progress("comments", increment=1)
                continue

            if IssueComment.objects.filter(
                project=self.project,
                external_source=JIRA_EXTERNAL_SOURCE,
                external_id=str(external_id),
                deleted_at__isnull=True,
            ).exists():
                self.stats["comments_skipped"] += 1
                self._update_progress("comments", increment=1)
                continue

            author = comment.get("author") or {}
            IssueComment.objects.create(
                issue_id=issue_id,
                project=self.project,
                workspace=self.workspace,
                comment_html=self.transformer.comment_html(comment),
                created_by_id=self._lookup_user(author.get("emailAddress"), user_map),
                external_source=JIRA_EXTERNAL_SOURCE,
                external_id=str(external_id),
            )
            created_at = self.transformer.parse_datetime(comment.get("created"))
            if created_at:
                IssueComment.objects.filter(
                    project=self.project,
                    external_source=JIRA_EXTERNAL_SOURCE,
                    external_id=str(external_id),
                ).update(created_at=created_at)
            self.stats["comments"] += 1
            self._update_progress("comments", increment=1)
