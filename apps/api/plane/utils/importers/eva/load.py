# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

import logging
from collections import defaultdict
from typing import Any
from uuid import UUID

from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone

from plane.db.models import (
    Cycle,
    CycleIssue,
    FileAsset,
    Importer,
    Issue,
    IssueAssignee,
    IssueComment,
    IssueLabel,
    IssueLink,
    IssueRelation,
    Label,
    Module,
    ModuleIssue,
    Page,
    Project,
    ProjectMember,
    ProjectPage,
    State,
    Workspace,
)
from plane.utils.importers.eva.constants import EVA_EXTERNAL_SOURCE
from plane.utils.importers.eva.client import EvaApiClient
from plane.utils.importers.eva.media import (
    has_broken_relative_plane_asset_links,
    has_unmigrated_eva_video_links,
    import_inline_media,
    looks_like_broken_eva_image_html,
    looks_like_broken_eva_video_html,
    rewrite_relative_plane_asset_links,
)
from plane.utils.importers.eva.transform import EvaTransformer

logger = logging.getLogger("plane.worker")
User = get_user_model()


class EvaLoader:
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
        metadata = importer.metadata or {}
        self.eva_client = EvaApiClient(metadata.get("url", ""), metadata.get("token", ""))
        self.transformer = EvaTransformer(base_url=metadata.get("url"))
        self.stats: dict[str, Any] = defaultdict(int)
        self.id_map: dict[str, str] = {}
        self.warnings: list[str] = []
        self._progress_total = 1
        self._progress_completed = 0
        self._progress_phase = "setup"
        self._progress_save_every = 50

    def run(self, extracted: dict[str, Any]) -> dict[str, Any]:
        self._init_progress(extracted)
        self._update_progress("setup", force=True)
        self._ensure_states()
        user_map = self._resolve_users()
        label_map = self._ensure_labels(extracted)
        cycle_map = self._ensure_cycles(extracted)
        module_map = self._ensure_modules(extracted)
        self._update_progress("setup", increment=1, force=True)

        tasks = extracted.get("tasks", [])
        ordered_tasks = self._order_tasks(tasks)
        self._import_tasks(ordered_tasks, user_map, label_map, cycle_map, module_map)
        self._import_testcases(extracted.get("testcases", []), user_map, label_map)
        self._import_comments(extracted.get("comments", []), user_map)
        self._import_attachments(extracted.get("attachments", []))
        self._import_relations(tasks)
        self._import_documents(extracted.get("documents", []), user_map)

        return {
            "progress": {
                "phase": "documents",
                "completed": self._progress_total,
                "total": self._progress_total,
                "percent": 100,
            },
            "stats": dict(self.stats),
            "id_map": self.id_map,
            "warnings": self.warnings,
        }

    def _init_progress(self, extracted: dict[str, Any]) -> None:
        tasks = extracted.get("tasks", [])
        self._progress_total = (
            1
            + len(tasks)
            + len(extracted.get("testcases", []))
            + len(extracted.get("comments", []))
            + len(extracted.get("attachments", []))
            + len(tasks)
            + len(extracted.get("documents", []))
        )
        self._progress_total = max(self._progress_total, 1)
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
        for eva_status, plane_state_id in overrides.items():
            if plane_state_id:
                state_map[eva_status] = UUID(str(plane_state_id))

        for eva_status, group in {
            "OPEN": "unstarted",
            "IN_PROGRESS": "started",
            "IN_REVIEW": "started",
            "CLOSED": "completed",
        }.items():
            if eva_status not in state_map and group in grouped:
                state_map[eva_status] = grouped[group].id

        if "OPEN" not in state_map:
            fallback = states.filter(default=True).first() or states.first()
            if fallback:
                state_map["OPEN"] = fallback.id

        self.state_map = state_map
        return state_map

    def _resolve_users(self) -> dict[str, UUID | None]:
        user_map: dict[str, UUID | None] = {}
        configured_users = self.data.get("users") or []
        for item in configured_users:
            email = (item.get("email") or "").lower()
            if not email:
                continue
            import_mode = item.get("import")
            if import_mode is False:
                user_map[email] = None
                continue
            plane_user_id = item.get("plane_user_id")
            if plane_user_id:
                user_map[email] = UUID(str(plane_user_id))
                continue
            user = User.objects.filter(email__iexact=email).first()
            if user and ProjectMember.objects.filter(
                project=self.project, member=user, is_active=True
            ).exists():
                user_map[email] = user.id
            else:
                user_map[email] = self.actor.id
                self.warnings.append(f"Unmapped EVA user {email}; attributed to importer.")
        return user_map

    def _lookup_user(self, email: str | None, user_map: dict[str, UUID | None]) -> UUID:
        if not email:
            return self.actor.id
        mapped = user_map.get(email.lower())
        return mapped or self.actor.id

    def _ensure_labels(self, extracted: dict[str, Any]) -> dict[str, UUID]:
        label_names: set[str] = set()
        for task in extracted.get("tasks", []):
            label_names.update(self.transformer.collect_labels(task))
        label_names.add("eva-test-case")

        label_map: dict[str, UUID] = {}
        for name in sorted(label_names):
            existing = Label.objects.filter(
                project=self.project,
                name=name,
                external_source=EVA_EXTERNAL_SOURCE,
                deleted_at__isnull=True,
            ).first()
            if existing:
                label_map[name] = existing.id
                continue
            label = Label.objects.create(
                name=name,
                project=self.project,
                workspace=self.workspace,
                created_by=self.actor,
                external_source=EVA_EXTERNAL_SOURCE,
                external_id=name,
            )
            label_map[name] = label.id
            self.stats["labels"] += 1
        return label_map

    def _ensure_cycles(self, extracted: dict[str, Any]) -> dict[str, UUID]:
        cycle_map: dict[str, UUID] = {}
        for task in extracted.get("tasks", []):
            for item in task.get("lists") or []:
                code = item.get("code")
                name = item.get("name") or code
                if not code or code in cycle_map:
                    continue
                existing = Cycle.objects.filter(
                    project=self.project,
                    external_source=EVA_EXTERNAL_SOURCE,
                    external_id=code,
                    deleted_at__isnull=True,
                ).first()
                if existing:
                    cycle_map[code] = existing.id
                    continue
                cycle = Cycle.objects.create(
                    name=name,
                    project=self.project,
                    workspace=self.workspace,
                    owned_by=self.actor,
                    created_by=self.actor,
                    external_source=EVA_EXTERNAL_SOURCE,
                    external_id=code,
                )
                cycle_map[code] = cycle.id
                self.stats["cycles"] += 1
        return cycle_map

    def _ensure_modules(self, extracted: dict[str, Any]) -> dict[str, UUID]:
        module_map: dict[str, UUID] = {}
        for task in extracted.get("tasks", []):
            for item in task.get("fix_versions") or []:
                code = item.get("code")
                name = item.get("name") or code
                if not code or code in module_map:
                    continue
                existing = Module.objects.filter(
                    project=self.project,
                    external_source=EVA_EXTERNAL_SOURCE,
                    external_id=code,
                    deleted_at__isnull=True,
                ).first()
                if existing:
                    module_map[code] = existing.id
                    continue
                module = Module.objects.create(
                    name=name,
                    project=self.project,
                    workspace=self.workspace,
                    created_by=self.actor,
                    external_source=EVA_EXTERNAL_SOURCE,
                    external_id=code,
                )
                module_map[code] = module.id
                self.stats["modules"] += 1
        return module_map

    def _order_tasks(self, tasks: list[dict[str, Any]]) -> list[dict[str, Any]]:
        by_id = {task["id"]: task for task in tasks if task.get("id")}
        children: dict[str, list[str]] = defaultdict(list)
        roots: list[str] = []
        for task_id, task in by_id.items():
            parent = task.get("parent_task") or {}
            parent_id = parent.get("id") if isinstance(parent, dict) else task.get("parent_task_id")
            if parent_id and parent_id in by_id:
                children[parent_id].append(task_id)
            else:
                roots.append(task_id)

        ordered: list[dict[str, Any]] = []

        def walk(task_id: str) -> None:
            ordered.append(by_id[task_id])
            for child_id in children.get(task_id, []):
                walk(child_id)

        for root_id in roots:
            walk(root_id)
        return ordered

    def _resolve_state_id(self, task: dict[str, Any]) -> UUID | None:
        status = task.get("cache_status_type")
        if status and status in self.state_map:
            return self.state_map[status]
        group = self.transformer.map_status_group(status)
        state = State.objects.filter(project=self.project, group=group, deleted_at__isnull=True).first()
        return state.id if state else None

    def _get_or_create_issue(
        self,
        *,
        external_id: str,
        name: str,
        description_html: str,
        task: dict[str, Any],
        user_map: dict[str, UUID | None],
        parent_issue_id: UUID | None = None,
        extra_labels: list[str] | None = None,
    ) -> Issue:
        existing = Issue.objects.filter(
            project=self.project,
            external_source=EVA_EXTERNAL_SOURCE,
            external_id=external_id,
            deleted_at__isnull=True,
        ).first()
        if existing:
            self.id_map[external_id] = str(existing.id)
            self.stats["issues_skipped"] += 1
            if looks_like_broken_eva_video_html(existing.description_html):
                fresh_html = self.transformer.issue_description_html(task)
                fresh_html = self._import_description_media(
                    fresh_html,
                    entity_type=FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
                    issue_id=str(existing.id),
                )
                existing.description_html = fresh_html
                existing.save(update_fields=["description_html"])
            else:
                repaired_html = self._repair_description_media(
                    existing.description_html,
                    entity_type=FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
                    issue_id=str(existing.id),
                )
                if repaired_html != existing.description_html:
                    existing.description_html = repaired_html
                    existing.save(update_fields=["description_html"])
            return existing

        responsible = task.get("responsible") or {}
        author = task.get("cmf_author") or {}
        created_by_id = self._lookup_user(author.get("login"), user_map)
        assignee_id = self._lookup_user(responsible.get("login"), user_map)

        gantt = task.get("op_gantt_task") or {}
        issue = Issue(
            project=self.project,
            workspace=self.workspace,
            name=name[:255],
            description_html=description_html,
            priority=self.transformer.map_priority(task.get("priority")),
            state_id=self._resolve_state_id(task),
            parent_id=parent_issue_id,
            start_date=self.transformer.parse_date(gantt.get("sched_start_date")),
            target_date=self.transformer.parse_date(gantt.get("sched_finish_date") or task.get("deadline")),
            external_source=EVA_EXTERNAL_SOURCE,
            external_id=external_id,
            created_by_id=created_by_id,
            updated_by_id=created_by_id,
        )
        issue.save()

        created_at = self.transformer.parse_datetime(task.get("cmf_created_at"))
        if created_at:
            Issue.objects.filter(id=issue.id).update(created_at=created_at)

        description_with_assets = self._import_description_media(
            issue.description_html,
            entity_type=FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
            issue_id=str(issue.id),
        )
        if description_with_assets != issue.description_html:
            issue.description_html = description_with_assets
            issue.save(update_fields=["description_html"])

        if assignee_id:
            IssueAssignee.objects.get_or_create(
                issue=issue,
                assignee_id=assignee_id,
                project=self.project,
                workspace=self.workspace,
                defaults={"created_by": self.actor},
            )

        labels = self.transformer.collect_labels(task)
        if extra_labels:
            labels.extend(extra_labels)
        self._attach_labels(issue, labels)
        self.id_map[external_id] = str(issue.id)
        self.stats["issues"] += 1
        return issue

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

    def _import_tasks(
        self,
        tasks: list[dict[str, Any]],
        user_map: dict[str, UUID | None],
        label_map: dict[str, UUID],
        cycle_map: dict[str, UUID],
        module_map: dict[str, UUID],
    ) -> None:
        del label_map
        self._update_progress("tasks", force=True)
        for task in tasks:
            external_id = task.get("id")
            if not external_id:
                self._update_progress("tasks", increment=1)
                continue
            parent = task.get("parent_task") or {}
            parent_external_id = parent.get("id") if isinstance(parent, dict) else None
            parent_issue_id = UUID(self.id_map[parent_external_id]) if parent_external_id in self.id_map else None
            issue = self._get_or_create_issue(
                external_id=external_id,
                name=task.get("name") or task.get("code") or "Untitled",
                description_html=self.transformer.issue_description_html(task),
                task=task,
                user_map=user_map,
                parent_issue_id=parent_issue_id,
            )
            for item in task.get("lists") or []:
                cycle_id = cycle_map.get(item.get("code"))
                if cycle_id:
                    CycleIssue.objects.get_or_create(
                        issue=issue,
                        cycle_id=cycle_id,
                        project=self.project,
                        workspace=self.workspace,
                        defaults={"created_by": self.actor},
                    )
            for item in task.get("fix_versions") or []:
                module_id = module_map.get(item.get("code"))
                if module_id:
                    ModuleIssue.objects.get_or_create(
                        issue=issue,
                        module_id=module_id,
                        project=self.project,
                        workspace=self.workspace,
                        defaults={"created_by": self.actor},
                    )
            self._update_progress("tasks", increment=1)

    def _import_testcases(
        self,
        testcases: list[dict[str, Any]],
        user_map: dict[str, UUID | None],
        label_map: dict[str, UUID],
    ) -> None:
        del label_map
        self._update_progress("testcases", force=True)
        for testcase in testcases:
            external_id = testcase.get("id")
            if not external_id:
                continue
            parent = testcase.get("parent_task") or {}
            parent_external_id = parent.get("id") if isinstance(parent, dict) else testcase.get("parent_id")
            parent_issue_id = UUID(self.id_map[parent_external_id]) if parent_external_id in self.id_map else None
            self._get_or_create_issue(
                external_id=external_id,
                name=testcase.get("name") or testcase.get("code") or "Test case",
                description_html=self.transformer.testcase_description_html(testcase),
                task=testcase,
                user_map=user_map,
                parent_issue_id=parent_issue_id,
                extra_labels=["eva-test-case"],
            )
            self.stats["testcases"] += 1
            self._update_progress("testcases", increment=1)

    def _import_comments(self, comments: list[dict[str, Any]], user_map: dict[str, UUID | None]) -> None:
        self._update_progress("comments", force=True)
        for comment in comments:
            external_id = comment.get("id")
            parent_id = comment.get("parent_id")
            if not external_id or not parent_id:
                self._update_progress("comments", increment=1)
                continue
            issue_id = self.id_map.get(parent_id)
            if not issue_id:
                self.stats["comments_skipped"] += 1
                self._update_progress("comments", increment=1)
                continue
            if IssueComment.objects.filter(
                project=self.project,
                external_source=EVA_EXTERNAL_SOURCE,
                external_id=external_id,
                deleted_at__isnull=True,
            ).exists():
                self.stats["comments_skipped"] += 1
                existing_comment = IssueComment.objects.filter(
                    project=self.project,
                    external_source=EVA_EXTERNAL_SOURCE,
                    external_id=external_id,
                    deleted_at__isnull=True,
                ).first()
                if existing_comment:
                    if looks_like_broken_eva_video_html(existing_comment.comment_html):
                        fresh_html = self.transformer.comment_html(comment)
                        fresh_html = self._import_description_media(
                            fresh_html,
                            entity_type=FileAsset.EntityTypeContext.COMMENT_DESCRIPTION,
                            comment_id=str(existing_comment.id),
                        )
                        existing_comment.comment_html = fresh_html
                        existing_comment.save(update_fields=["comment_html"])
                    else:
                        repaired_html = self._repair_description_media(
                            existing_comment.comment_html,
                            entity_type=FileAsset.EntityTypeContext.COMMENT_DESCRIPTION,
                            comment_id=str(existing_comment.id),
                        )
                        if repaired_html != existing_comment.comment_html:
                            existing_comment.comment_html = repaired_html
                            existing_comment.save(update_fields=["comment_html"])
                self._update_progress("comments", increment=1)
                continue

            author = comment.get("cmf_author") or {}
            actor_id = self._lookup_user(author.get("login"), user_map)
            issue_comment = IssueComment(
                issue_id=issue_id,
                project=self.project,
                workspace=self.workspace,
                comment_html=self.transformer.comment_html(comment),
                actor_id=actor_id,
                created_by_id=actor_id,
                updated_by_id=actor_id,
                external_source=EVA_EXTERNAL_SOURCE,
                external_id=external_id,
            )
            issue_comment.save()
            created_at = self.transformer.parse_datetime(comment.get("cmf_created_at"))
            if created_at:
                IssueComment.objects.filter(id=issue_comment.id).update(created_at=created_at)

            comment_html_with_assets = self._import_description_media(
                issue_comment.comment_html,
                entity_type=FileAsset.EntityTypeContext.COMMENT_DESCRIPTION,
                comment_id=str(issue_comment.id),
            )
            if comment_html_with_assets != issue_comment.comment_html:
                issue_comment.comment_html = comment_html_with_assets
                issue_comment.save(update_fields=["comment_html"])

            self.stats["comments"] += 1
            self._update_progress("comments", increment=1)

    def _import_attachments(self, attachments: list[dict[str, Any]]) -> None:
        self._update_progress("attachments", force=True)
        for attachment in attachments:
            parent_id = attachment.get("parent_id")
            url = attachment.get("url") or attachment.get("download_url")
            if not parent_id or not url:
                self.stats["attachments_skipped"] += 1
                self._update_progress("attachments", increment=1)
                continue
            issue_id = self.id_map.get(parent_id)
            if not issue_id:
                self.stats["attachments_skipped"] += 1
                self._update_progress("attachments", increment=1)
                continue
            title = attachment.get("name") or attachment.get("code") or "EVA attachment"
            if IssueLink.objects.filter(issue_id=issue_id, url=url, deleted_at__isnull=True).exists():
                self.stats["attachments_skipped"] += 1
                self._update_progress("attachments", increment=1)
                continue
            IssueLink.objects.create(
                issue_id=issue_id,
                project=self.project,
                workspace=self.workspace,
                title=title,
                url=url,
                created_by=self.actor,
            )
            self.stats["attachments"] += 1
            self._update_progress("attachments", increment=1)

    def _import_relations(self, tasks: list[dict[str, Any]]) -> None:
        self._update_progress("relations", force=True)
        for task in tasks:
            source_id = self.id_map.get(task.get("id"))
            if not source_id:
                self._update_progress("relations", increment=1)
                continue
            for relation_key in ("out_tasks", "in_tasks"):
                for related in task.get(relation_key) or []:
                    related_code = related.get("code")
                    if not related_code:
                        continue
                    target_external_id = next(
                        (candidate.get("id") for candidate in tasks if candidate.get("code") == related_code),
                        None,
                    )
                    if not target_external_id:
                        continue
                    target_id = self.id_map.get(target_external_id)
                    if not target_id:
                        continue
                    relation_type = self.transformer.map_relation_type(related.get("relation_type"))
                    if relation_key == "in_tasks":
                        issue_id, related_issue_id = target_id, source_id
                    else:
                        issue_id, related_issue_id = source_id, target_id
                    IssueRelation.objects.get_or_create(
                        issue_id=issue_id,
                        related_issue_id=related_issue_id,
                        relation_type=relation_type,
                        project=self.project,
                        workspace=self.workspace,
                        defaults={"created_by": self.actor},
                    )
                    self.stats["relations"] += 1
            self._update_progress("relations", increment=1)

    def _import_documents(self, documents: list[dict[str, Any]], user_map: dict[str, UUID | None]) -> None:
        self._update_progress("documents", force=True)
        for document in documents:
            external_id = document.get("id") or document.get("code")
            if not external_id:
                continue
            existing_page = Page.objects.filter(
                workspace=self.workspace,
                external_source=EVA_EXTERNAL_SOURCE,
                external_id=external_id,
                deleted_at__isnull=True,
            ).first()
            if existing_page:
                if ProjectPage.objects.filter(
                    project=self.project,
                    page=existing_page,
                    deleted_at__isnull=True,
                ).exists():
                    self.stats["documents_skipped"] += 1
                else:
                    ProjectPage.objects.create(
                        workspace=self.workspace,
                        project=self.project,
                        page=existing_page,
                        created_by=self.actor,
                        updated_by=self.actor,
                    )
                    self.stats["documents"] += 1
                if self._repair_page_description(existing_page, document):
                    self.stats["documents_repaired"] += 1
                self._update_progress("documents", increment=1)
                continue
            author = document.get("cmf_author") or {}
            owner_id = self._lookup_user(author.get("login"), user_map)
            page = Page.objects.create(
                workspace=self.workspace,
                name=document.get("name") or document.get("code") or "EVA document",
                description_html=self.transformer.document_description_html(document),
                owned_by_id=owner_id,
                created_by_id=owner_id,
                updated_by_id=owner_id,
                external_source=EVA_EXTERNAL_SOURCE,
                external_id=external_id,
            )
            ProjectPage.objects.create(
                workspace=self.workspace,
                project=self.project,
                page=page,
                created_by=self.actor,
                updated_by=self.actor,
            )
            description_with_assets = self._import_description_media(
                page.description_html,
                entity_type=FileAsset.EntityTypeContext.PAGE_DESCRIPTION,
                page_id=str(page.id),
            )
            if description_with_assets != page.description_html:
                page.description_html = description_with_assets
                page.save(update_fields=["description_html"])
            self.stats["documents"] += 1
            self._update_progress("documents", increment=1)

    def _repair_page_description(self, page: Page, document: dict[str, Any]) -> bool:
        description_html = page.description_html or ""
        if looks_like_broken_eva_video_html(description_html) or looks_like_broken_eva_image_html(
            description_html, self.eva_client.base_url
        ):
            repaired_html = self._import_description_media(
                self.transformer.document_description_html(document),
                entity_type=FileAsset.EntityTypeContext.PAGE_DESCRIPTION,
                page_id=str(page.id),
            )
        else:
            repaired_html = self._repair_description_media(
                description_html,
                entity_type=FileAsset.EntityTypeContext.PAGE_DESCRIPTION,
                page_id=str(page.id),
            )

        if repaired_html != description_html:
            page.description_html = repaired_html
            page.save(update_fields=["description_html"])
            return True
        return False

    def _import_description_media(
        self,
        html: str,
        *,
        entity_type: str,
        issue_id: str | None = None,
        comment_id: str | None = None,
        page_id: str | None = None,
    ) -> str:
        if not self.eva_client.base_url or not self.eva_client.token:
            return html
        return import_inline_media(
            html,
            client=self.eva_client,
            workspace=self.workspace,
            project=self.project,
            actor=self.actor,
            entity_type=entity_type,
            issue_id=issue_id,
            comment_id=comment_id,
            page_id=page_id,
        )

    def _repair_description_media(
        self,
        html: str,
        *,
        entity_type: str,
        issue_id: str | None = None,
        comment_id: str | None = None,
        page_id: str | None = None,
    ) -> str:
        if not html:
            return html
        html = rewrite_relative_plane_asset_links(html)
        needs_repair = (
            "<img" in html.lower()
            and ('src="/files/' in html or "src='files/" in html or 'src="files/' in html)
        ) or has_unmigrated_eva_video_links(html, self.eva_client.base_url)
        if not needs_repair:
            return html
        repaired = self._import_description_media(
            html,
            entity_type=entity_type,
            issue_id=issue_id,
            comment_id=comment_id,
            page_id=page_id,
        )
        return rewrite_relative_plane_asset_links(repaired)
