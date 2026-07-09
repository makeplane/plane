# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

import logging
from collections import defaultdict
from collections.abc import Callable
from typing import Any
from uuid import UUID

from django.contrib.auth import get_user_model
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
        testcase_project: Project,
        actor: User,
        config: dict[str, Any],
        data: dict[str, Any],
    ):
        self.importer = importer
        self.workspace = workspace
        self.project = project
        self.testcase_project = testcase_project
        self.actor = actor
        self.config = config
        self.data = data
        metadata = importer.metadata or {}
        self.eva_client = EvaApiClient(metadata.get("url", ""), metadata.get("token", ""))
        self.transformer = EvaTransformer(base_url=metadata.get("url"))
        self.stats: dict[str, Any] = defaultdict(int)
        self.id_map: dict[str, str] = {}
        self.id_project_map: dict[str, str] = {}
        self.warnings: list[str] = []
        self.state_map: dict[str, UUID] = {}
        self.testcase_state_map: dict[str, UUID] = {}
        self._progress_total = 1
        self._progress_completed = 0
        self._progress_phase = "setup"
        self._progress_save_every = 50

    @property
    def import_tasks(self) -> bool:
        return bool(self.config.get("import_tasks", True))

    @property
    def import_testcases(self) -> bool:
        return bool(self.config.get("import_testcases", True))

    def run(self, extracted: dict[str, Any]) -> dict[str, Any]:
        self._init_progress(extracted)
        self._update_progress("setup", force=True)
        if self.import_tasks:
            self.state_map = self._ensure_states(self.project)
            self._ensure_labels(extracted)
        if self.import_testcases:
            self.testcase_state_map = self._ensure_states(self.testcase_project)
            self._ensure_testcase_labels(extracted)
        user_map = self._resolve_users()
        cycle_map = self._ensure_cycles(extracted) if self.import_tasks else {}
        module_map = self._ensure_modules(extracted) if self.import_tasks else {}
        self._update_progress("setup", increment=1, force=True)

        tasks = extracted.get("tasks", []) if self.import_tasks else []
        if self.import_tasks:
            ordered_tasks = self._order_tasks(tasks)
            self._import_tasks(ordered_tasks, user_map, cycle_map, module_map)
            self._import_comments(extracted.get("comments", []), user_map)
            self._import_attachments(extracted.get("attachments", []))
            self._import_relations(tasks)
            self._import_documents(extracted.get("documents", []), user_map)
        if self.import_testcases:
            self._import_testcases(extracted.get("testcases", []), user_map)
            self._import_comments(extracted.get("testcase_comments", []), user_map)

        final_phase = "documents" if self.import_tasks else "testcases"

        return {
            "progress": {
                "phase": final_phase,
                "completed": self._progress_total,
                "total": self._progress_total,
                "percent": 100,
            },
            "stats": dict(self.stats),
            "id_map": self.id_map,
            "warnings": self.warnings,
        }

    def _init_progress(self, extracted: dict[str, Any]) -> None:
        tasks = extracted.get("tasks", []) if self.import_tasks else []
        testcases = extracted.get("testcases", []) if self.import_testcases else []
        comments = extracted.get("comments", []) if self.import_tasks else []
        testcase_comments = extracted.get("testcase_comments", []) if self.import_testcases else []
        attachments = extracted.get("attachments", []) if self.import_tasks else []
        documents = extracted.get("documents", []) if self.import_tasks else []

        self._progress_total = (
            1
            + len(tasks)
            + len(testcases)
            + len(comments)
            + len(testcase_comments)
            + len(attachments)
            + len(tasks)
            + len(documents)
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

    def _ensure_states(self, project: Project) -> dict[str, UUID]:
        states = State.objects.filter(project=project, deleted_at__isnull=True)
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

        return state_map

    def _resolve_users(self) -> dict[str, UUID | None]:
        user_map: dict[str, UUID | None] = {}
        configured_users = self.data.get("users") or []
        import_projects: set = set()
        if self.import_tasks:
            import_projects.add(self.project.id)
        if self.import_testcases:
            import_projects.add(self.testcase_project.id)
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
                project_id__in=import_projects, member=user, is_active=True
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

    def _ensure_labels(self, extracted: dict[str, Any]) -> None:
        label_names: set[str] = set()
        for task in extracted.get("tasks", []):
            label_names.update(self.transformer.collect_labels(task))
        self._ensure_labels_for_project(self.project, label_names)

    def _ensure_testcase_labels(self, extracted: dict[str, Any]) -> None:
        label_names: set[str] = {"eva-test-case"}
        for testcase in extracted.get("testcases", []):
            label_names.update(self.transformer.collect_labels(testcase))
        self._ensure_labels_for_project(self.testcase_project, label_names)

    def _ensure_labels_for_project(self, project: Project, label_names: set[str]) -> dict[str, UUID]:
        label_map: dict[str, UUID] = {}
        for name in sorted(label_names):
            existing = Label.objects.filter(
                project=project,
                name=name,
                external_source=EVA_EXTERNAL_SOURCE,
                deleted_at__isnull=True,
            ).first()
            if existing:
                label_map[name] = existing.id
                continue
            label = Label.objects.create(
                name=name,
                project=project,
                workspace=self.workspace,
                created_by=self.actor,
                external_source=EVA_EXTERNAL_SOURCE,
                external_id=name,
            )
            label_map[name] = label.id
            self.stats["labels"] += 1
        return label_map

    def _cycle_dates(self, list_record: dict[str, Any] | None) -> dict[str, Any]:
        if not list_record:
            return {}
        end_date = self.transformer.parse_date(list_record.get("status_closed_at"))
        if not end_date:
            # EVA sprint is still open; Plane requires both dates or neither.
            return {}
        start_date = self.transformer.parse_date(list_record.get("cmf_created_at"))
        if not start_date:
            return {}
        return {"start_date": start_date, "end_date": end_date}

    def _ensure_cycles(self, extracted: dict[str, Any]) -> dict[str, UUID]:
        lists_by_code = {item["code"]: item for item in extracted.get("cycle_lists", []) if item.get("code")}
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
                    **self._cycle_dates(lists_by_code.get(code)),
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

    def _resolve_state_id(
        self,
        task: dict[str, Any],
        *,
        project: Project,
        state_map: dict[str, UUID],
    ) -> UUID | None:
        status = task.get("cache_status_type")
        if status and status in state_map:
            return state_map[status]
        group = self.transformer.map_status_group(status)
        state = State.objects.filter(project=project, group=group, deleted_at__isnull=True).first()
        return state.id if state else None

    def _get_or_create_issue(
        self,
        *,
        project: Project,
        state_map: dict[str, UUID],
        external_id: str,
        name: str,
        description_html: str,
        task: dict[str, Any],
        user_map: dict[str, UUID | None],
        parent_issue_id: UUID | None = None,
        extra_labels: list[str] | None = None,
        refresh_description_html: Callable[[dict[str, Any]], str] | None = None,
    ) -> Issue:
        refresh_description_html = refresh_description_html or self.transformer.issue_description_html
        existing = Issue.objects.filter(
            project=project,
            external_source=EVA_EXTERNAL_SOURCE,
            external_id=external_id,
            deleted_at__isnull=True,
        ).first()
        if existing:
            self.id_map[external_id] = str(existing.id)
            self.id_project_map[external_id] = str(project.id)
            self.stats["issues_skipped"] += 1
            self._repair_issue_description(
                existing,
                project=project,
                source=task,
                refresh_description_html=refresh_description_html,
            )
            return existing

        responsible = task.get("responsible") or {}
        author = task.get("cmf_author") or {}
        created_by_id = self._lookup_user(author.get("login"), user_map)
        assignee_id = self._lookup_user(responsible.get("login"), user_map)

        gantt = task.get("op_gantt_task") or {}
        issue = Issue(
            project=project,
            workspace=self.workspace,
            name=name[:255],
            description_html=description_html,
            priority=self.transformer.map_priority(task.get("priority")),
            state_id=self._resolve_state_id(task, project=project, state_map=state_map),
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
            project=project,
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
                project=project,
                workspace=self.workspace,
                defaults={"created_by": self.actor},
            )

        labels = self.transformer.collect_labels(task)
        if extra_labels:
            labels.extend(extra_labels)
        self._attach_labels(issue, labels, project=project)
        self.id_map[external_id] = str(issue.id)
        self.id_project_map[external_id] = str(project.id)
        self.stats["issues"] += 1
        return issue

    def _attach_labels(self, issue: Issue, labels: list[str], *, project: Project) -> None:
        for label_name in labels:
            label = Label.objects.filter(project=project, name=label_name, deleted_at__isnull=True).first()
            if not label:
                continue
            IssueLabel.objects.get_or_create(
                issue=issue,
                label=label,
                project=project,
                workspace=self.workspace,
                defaults={"created_by": self.actor},
            )

    def _project_for_external_id(self, external_id: str) -> Project:
        project_id = self.id_project_map.get(external_id)
        if project_id and str(project_id) == str(self.testcase_project.id):
            return self.testcase_project
        return self.project

    def _import_tasks(
        self,
        tasks: list[dict[str, Any]],
        user_map: dict[str, UUID | None],
        cycle_map: dict[str, UUID],
        module_map: dict[str, UUID],
    ) -> None:
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
                project=self.project,
                state_map=self.state_map,
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
    ) -> None:
        self._update_progress("testcases", force=True)
        for testcase in testcases:
            external_id = testcase.get("id")
            if not external_id:
                continue
            self._get_or_create_issue(
                project=self.testcase_project,
                state_map=self.testcase_state_map,
                external_id=external_id,
                name=testcase.get("name") or testcase.get("code") or "Test case",
                description_html=self.transformer.testcase_description_html(testcase),
                task=testcase,
                user_map=user_map,
                parent_issue_id=None,
                extra_labels=["eva-test-case"],
                refresh_description_html=self.transformer.testcase_description_html,
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
            comment_project = self._project_for_external_id(parent_id)
            if IssueComment.objects.filter(
                project=comment_project,
                external_source=EVA_EXTERNAL_SOURCE,
                external_id=external_id,
                deleted_at__isnull=True,
            ).exists():
                self.stats["comments_skipped"] += 1
                existing_comment = IssueComment.objects.filter(
                    project=comment_project,
                    external_source=EVA_EXTERNAL_SOURCE,
                    external_id=external_id,
                    deleted_at__isnull=True,
                ).first()
                if existing_comment:
                    self._repair_comment_html(
                        existing_comment,
                        project=comment_project,
                        comment_source=comment,
                    )
                self._update_progress("comments", increment=1)
                continue

            author = comment.get("cmf_author") or {}
            actor_id = self._lookup_user(author.get("login"), user_map)
            issue_comment = IssueComment(
                issue_id=issue_id,
                project=comment_project,
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
                project=comment_project,
                entity_type=FileAsset.EntityTypeContext.COMMENT_DESCRIPTION,
                issue_id=str(issue_id),
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
            attachment_project = self._project_for_external_id(parent_id)
            title = attachment.get("name") or attachment.get("code") or "EVA attachment"
            if IssueLink.objects.filter(issue_id=issue_id, url=url, deleted_at__isnull=True).exists():
                self.stats["attachments_skipped"] += 1
                self._update_progress("attachments", increment=1)
                continue
            IssueLink.objects.create(
                issue_id=issue_id,
                project=attachment_project,
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
                project=self.project,
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
                project=self.project,
                entity_type=FileAsset.EntityTypeContext.PAGE_DESCRIPTION,
                page_id=str(page.id),
            )
        else:
            repaired_html = self._repair_description_media(
                description_html,
                project=self.project,
                entity_type=FileAsset.EntityTypeContext.PAGE_DESCRIPTION,
                page_id=str(page.id),
            )

        if repaired_html != description_html:
            page.description_html = repaired_html
            page.save(update_fields=["description_html"])
            return True
        return False

    def _repair_issue_description(
        self,
        issue: Issue,
        *,
        project: Project,
        source: dict[str, Any],
        refresh_description_html: Callable[[dict[str, Any]], str],
    ) -> bool:
        description_html = issue.description_html or ""
        if looks_like_broken_eva_video_html(description_html) or looks_like_broken_eva_image_html(
            description_html, self.eva_client.base_url
        ):
            repaired_html = self._import_description_media(
                refresh_description_html(source),
                project=project,
                entity_type=FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
                issue_id=str(issue.id),
            )
        else:
            repaired_html = self._repair_description_media(
                description_html,
                project=project,
                entity_type=FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
                issue_id=str(issue.id),
            )

        if repaired_html != description_html:
            issue.description_html = repaired_html
            issue.save(update_fields=["description_html"])
            return True
        return False

    def _repair_comment_html(
        self,
        comment: IssueComment,
        *,
        project: Project,
        comment_source: dict[str, Any],
    ) -> bool:
        comment_html = comment.comment_html or ""
        if looks_like_broken_eva_video_html(comment_html) or looks_like_broken_eva_image_html(
            comment_html, self.eva_client.base_url
        ):
            repaired_html = self._import_description_media(
                self.transformer.comment_html(comment_source),
                project=project,
                entity_type=FileAsset.EntityTypeContext.COMMENT_DESCRIPTION,
                issue_id=str(comment.issue_id),
                comment_id=str(comment.id),
            )
        else:
            repaired_html = self._repair_description_media(
                comment_html,
                project=project,
                entity_type=FileAsset.EntityTypeContext.COMMENT_DESCRIPTION,
                issue_id=str(comment.issue_id),
                comment_id=str(comment.id),
            )

        if repaired_html != comment_html:
            comment.comment_html = repaired_html
            comment.save(update_fields=["comment_html"])
            return True
        return False

    def _import_description_media(
        self,
        html: str,
        *,
        project: Project,
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
            project=project,
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
        project: Project,
        entity_type: str,
        issue_id: str | None = None,
        comment_id: str | None = None,
        page_id: str | None = None,
    ) -> str:
        if not html:
            return html
        html = rewrite_relative_plane_asset_links(html)
        needs_repair = looks_like_broken_eva_image_html(html, self.eva_client.base_url)
        if not needs_repair:
            return html
        repaired = self._import_description_media(
            html,
            project=project,
            entity_type=entity_type,
            issue_id=issue_id,
            comment_id=comment_id,
            page_id=page_id,
        )
        return rewrite_relative_plane_asset_links(repaired)
