# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Jira -> Plane import engine.

Run as a Celery task. The orchestration lives in ``JiraImporter`` (importable
for tests); the ``@shared_task`` wrapper manages the job status lifecycle and
scrubs credentials when the job finishes.
"""

# Python imports
from uuid import uuid4

# Django imports
from django.utils.dateparse import parse_date, parse_datetime

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import (
    Project,
    ProjectIdentifier,
    ProjectMember,
    State,
    Label,
    Module,
    ModuleIssue,
    Cycle,
    CycleIssue,
    Issue,
    IssueAssignee,
    IssueLabel,
    IssueComment,
    IssueLink,
    IssueRelation,
    IssueType,
    ProjectIssueType,
    User,
    Workspace,
    WorkspaceMember,
    WorkspaceMemberInvite,
    ImportJob,
)
from plane.db.models.state import DEFAULT_STATES
from plane.utils.exception_logger import log_exception
from plane.utils.jira import (
    JiraClient,
    DEFAULT_ISSUE_FIELDS,
    map_priority,
    map_status_group,
    map_relation_type,
)

ADMIN_ROLE = 20
MEMBER_ROLE = 15
EXTERNAL_SOURCE = "JIRA"


def _empty_report():
    return {
        "projects": 0,
        "members": 0,
        "invited": 0,
        "states": 0,
        "labels": 0,
        "modules": 0,
        "cycles": 0,
        "work_items": 0,
        "comments": 0,
        "attachments": 0,
        "links": 0,
        "errors": [],
        "phase": "queued",
    }


class JiraImporter:
    def __init__(self, job: ImportJob, client=None):
        self.job = job
        self.workspace: Workspace = job.workspace
        self.config = job.config or {}
        self.client = client or JiraClient(
            self.config.get("domain"),
            self.config.get("email"),
            self.config.get("token"),
        )
        self.initiator_id = job.initiated_by_id
        self.board_id = self.config.get("board_id")
        self.flags = self.config.get("flags", {})
        self.user_import = self.config.get("user_import", "invite")  # invite | skip
        self.state_map = self.config.get("state_map", {})
        self.priority_map = self.config.get("priority_map", {})
        self.auto_create_states = self.config.get("auto_create_states", True)

        self.report = _empty_report()
        self.project = None
        self.project_key = None
        self.jira_project = {}
        self.board_name = None
        # Classic Jira projects link stories to epics via a custom "Epic Link" field.
        self.epic_link_field = None

        # lookup maps
        self.jira_user_to_plane = {}
        self.plane_states = {}
        self.plane_labels = {}
        self.plane_modules = {}
        self.plane_issue_types = {}
        self.issue_by_key = {}
        self._fields_by_key = {}
        self._parent_keys = {}

    # -- lifecycle ---------------------------------------------------------
    def run(self):
        self._resolve_board()
        self._ensure_project()
        if self.user_import != "skip":
            self._set_phase("members")
            self._import_members()
        self._set_phase("states")
        self._import_states()
        if self.flags.get("components", True):
            self._set_phase("modules")
            self._import_components()
        self._set_phase("cycles")
        sprint_map = self._import_cycles()
        self._set_phase("work_items")
        self._import_issues()
        self._link_parents()
        if self.flags.get("comments", True):
            self._set_phase("comments")
            self._import_comments()
        if self.flags.get("attachments", True):
            self._set_phase("attachments")
            self._import_attachments()
        if self.flags.get("links", True):
            self._set_phase("links")
            self._import_links()
        self._set_phase("cycles_assign")
        self._assign_sprints(sprint_map)
        self._set_phase("done")
        return self.report

    def _set_phase(self, phase):
        self.report["phase"] = phase
        # Persist progress so the UI poll reflects live counts.
        self.job.report = self.report
        self.job.save(update_fields=["report", "updated_at"])

    def _record_error(self, message):
        self.report["errors"].append(message[:500])

    # -- board / project ---------------------------------------------------
    def _resolve_board(self):
        board = self.client.board(self.board_id)
        self.board_name = board.get("name")
        location = board.get("location") or {}
        self.project_key = location.get("projectKey")
        if not self.project_key:
            projects = self.client.board_projects(self.board_id)
            if projects:
                self.project_key = projects[0].get("key")
        if not self.project_key:
            raise ValueError("Could not resolve a Jira project for the selected board")
        self.jira_project = self.client.project(self.project_key)
        # Best-effort discovery of the classic "Epic Link" custom field id.
        try:
            self.epic_link_field = self.client.epic_link_field_id()
        except Exception as exc:
            self._record_error(f"epic-link field: {exc}")

    def _unique_identifier(self, base):
        base = "".join(ch for ch in base.upper() if ch.isalnum())[:10] or "PROJ"
        identifier = base
        suffix = 1
        while ProjectIdentifier.objects.filter(name=identifier, workspace=self.workspace).exists():
            suffix += 1
            identifier = f"{base[:8]}{suffix}"
        return identifier

    def _ensure_project(self):
        target = self.config.get("target", {})
        if target.get("type") == "existing" and target.get("project_id"):
            self.project = Project.objects.get(pk=target["project_id"], workspace=self.workspace)
            return

        existing = Project.objects.filter(
            workspace=self.workspace,
            external_source=EXTERNAL_SOURCE,
            external_id=self.project_key,
        ).first()
        if existing:
            self.project = existing
            return

        name = (target.get("name") or self.jira_project.get("name") or self.board_name or self.project_key)[:255]
        identifier = self._unique_identifier(target.get("identifier") or self.project_key or name)

        project = Project(
            name=name,
            identifier=identifier,
            workspace=self.workspace,
            external_source=EXTERNAL_SOURCE,
            external_id=self.project_key,
        )
        project.save(created_by_id=self.initiator_id)
        ProjectIdentifier.objects.create(name=project.identifier, project=project, workspace=self.workspace)
        ProjectMember.objects.get_or_create(
            project=project, member_id=self.initiator_id, defaults={"role": ADMIN_ROLE}
        )
        State.objects.bulk_create(
            [
                State(
                    name=state["name"],
                    color=state["color"],
                    project=project,
                    sequence=state["sequence"],
                    workspace=self.workspace,
                    group=state["group"],
                    default=state.get("default", False),
                    created_by_id=self.initiator_id,
                )
                for state in DEFAULT_STATES
            ]
        )
        self.project = project
        self.report["projects"] += 1

    # -- members -----------------------------------------------------------
    def _import_members(self):
        try:
            jira_users = self.client.assignable_users(self.project_key)
        except Exception as exc:
            self._record_error(f"users: {exc}")
            return
        for jira_user in jira_users:
            account_id = jira_user.get("accountId")
            email = (jira_user.get("emailAddress") or "").strip().lower()
            if not account_id:
                continue
            user = User.objects.filter(email=email).first() if email else None
            if user:
                self.jira_user_to_plane[account_id] = user.id
                WorkspaceMember.objects.get_or_create(
                    workspace=self.workspace, member=user, defaults={"role": MEMBER_ROLE}
                )
                ProjectMember.objects.get_or_create(
                    project=self.project, member=user, defaults={"role": MEMBER_ROLE}
                )
                self.report["members"] += 1
            elif email and self.user_import == "invite":
                WorkspaceMemberInvite.objects.get_or_create(
                    workspace=self.workspace,
                    email=email,
                    defaults={"token": uuid4().hex, "role": MEMBER_ROLE},
                )
                self.report["invited"] += 1

    # -- states ------------------------------------------------------------
    def _import_states(self):
        try:
            status_types = self.client.project_statuses(self.project_key)
        except Exception as exc:
            self._record_error(f"states: {exc}")
            return
        seen = {}
        for issue_type in status_types:
            for status in issue_type.get("statuses", []):
                seen[status["id"]] = status

        for status_id, status in seen.items():
            name = status["name"]
            mapped_id = self.state_map.get(status_id) or self.state_map.get(name)
            if mapped_id:
                state = State.all_state_objects.filter(pk=mapped_id, project=self.project).first()
                if state:
                    self.plane_states[name.lower()] = state
                    continue
            if not self.auto_create_states:
                continue
            group = map_status_group((status.get("statusCategory") or {}).get("key"))
            state, created = State.objects.get_or_create(
                project=self.project,
                name=name,
                defaults={
                    "workspace": self.workspace,
                    "group": group,
                    "color": "#60646C",
                    "external_source": EXTERNAL_SOURCE,
                    "external_id": status_id,
                },
            )
            self.plane_states[name.lower()] = state
            if created:
                self.report["states"] += 1

    # -- labels / components ----------------------------------------------
    def _get_label(self, name):
        if name in self.plane_labels:
            return self.plane_labels[name]
        label, created = Label.objects.get_or_create(
            project=self.project,
            name=name,
            defaults={
                "workspace": self.workspace,
                "external_source": EXTERNAL_SOURCE,
                "external_id": name,
            },
        )
        self.plane_labels[name] = label
        if created:
            self.report["labels"] += 1
        return label

    def _import_components(self):
        for component in self.jira_project.get("components", []) or []:
            name = component.get("name")
            if not name:
                continue
            module, created = Module.objects.get_or_create(
                project=self.project,
                name=name,
                defaults={
                    "workspace": self.workspace,
                    "external_source": EXTERNAL_SOURCE,
                    "external_id": str(component.get("id")),
                },
            )
            self.plane_modules[name] = module
            if created:
                self.report["modules"] += 1

    # -- cycles (sprints) --------------------------------------------------
    def _import_cycles(self):
        sprint_map = {}
        try:
            sprints = self.client.sprints(self.board_id)
        except Exception as exc:
            self._record_error(f"sprints: {exc}")
            return sprint_map
        for sprint in sprints:
            sprint_id = sprint.get("id")
            cycle = Cycle.objects.filter(
                project=self.project, external_source=EXTERNAL_SOURCE, external_id=str(sprint_id)
            ).first()
            if not cycle:
                cycle = Cycle(
                    project=self.project,
                    workspace=self.workspace,
                    name=(sprint.get("name") or f"Sprint {sprint_id}")[:255],
                    owned_by_id=self.initiator_id,
                    start_date=parse_datetime(sprint.get("startDate")) if sprint.get("startDate") else None,
                    end_date=parse_datetime(sprint.get("endDate")) if sprint.get("endDate") else None,
                    external_source=EXTERNAL_SOURCE,
                    external_id=str(sprint_id),
                )
                cycle.save(created_by_id=self.initiator_id)
                self.report["cycles"] += 1
            sprint_map[sprint_id] = cycle
        return sprint_map

    # -- issue types -------------------------------------------------------
    def _get_issue_type(self, name, is_epic):
        if not name:
            return None
        if name in self.plane_issue_types:
            return self.plane_issue_types[name]
        # Reuse an existing same-named type for this project (e.g. the seeded
        # Task/Epic, or one from a prior import) before creating a new one.
        issue_type = (
            IssueType.objects.filter(
                workspace=self.workspace, name__iexact=name, project_issue_types__project=self.project
            ).first()
            or IssueType.objects.filter(
                workspace=self.workspace,
                external_source=EXTERNAL_SOURCE,
                external_id=name,
                project_issue_types__project=self.project,
            ).first()
        )
        if not issue_type:
            issue_type = IssueType.objects.create(
                workspace=self.workspace,
                name=name,
                is_epic=is_epic,
                external_source=EXTERNAL_SOURCE,
                external_id=name,
            )
            ProjectIssueType.objects.create(
                project=self.project, issue_type=issue_type, level=1 if is_epic else 0
            )
        self.plane_issue_types[name] = issue_type
        return issue_type

    # -- issues ------------------------------------------------------------
    def _import_issues(self):
        jql = f'project = "{self.project_key}" ORDER BY created ASC'
        request_fields = list(DEFAULT_ISSUE_FIELDS)
        if self.epic_link_field:
            request_fields.append(self.epic_link_field)
        try:
            issues = self.client.search_issues(jql, fields=request_fields)
            for jira_issue in issues:
                try:
                    self._create_issue(jira_issue)
                except Exception as exc:
                    self._record_error(f"issue {jira_issue.get('key')}: {exc}")
        except Exception as exc:
            self._record_error(f"issues: {exc}")

    def _create_issue(self, jira_issue):
        key = jira_issue["key"]
        fields = jira_issue.get("fields", {}) or {}
        rendered = jira_issue.get("renderedFields", {}) or {}
        self._fields_by_key[key] = fields

        status_name = (fields.get("status") or {}).get("name", "")
        state = self.plane_states.get(status_name.lower())
        priority_name = (fields.get("priority") or {}).get("name")
        priority = self.priority_map.get(priority_name) or map_priority(priority_name)
        reporter = fields.get("reporter") or fields.get("creator") or {}
        reporter_uid = self.jira_user_to_plane.get(reporter.get("accountId"))
        description_html = rendered.get("description") or "<p></p>"
        name = (fields.get("summary") or key)[:255]
        due_date = parse_date(fields.get("duedate")) if fields.get("duedate") else None
        issue_type_field = fields.get("issuetype") or {}

        issue = Issue.all_objects.filter(
            project=self.project, external_source=EXTERNAL_SOURCE, external_id=key
        ).first()
        if issue:
            issue.name = name
            issue.description_html = description_html
            issue.priority = priority
            if state:
                issue.state = state
            if due_date:
                issue.target_date = due_date
            if self.project.is_issue_type_enabled:
                issue.type = self._get_issue_type(
                    issue_type_field.get("name"), issue_type_field.get("name") == "Epic"
                )
            issue.save()
        else:
            issue = Issue(
                project=self.project,
                workspace=self.workspace,
                name=name,
                description_html=description_html,
                priority=priority,
                target_date=due_date,
                external_source=EXTERNAL_SOURCE,
                external_id=key,
            )
            if state:
                issue.state = state
            if self.project.is_issue_type_enabled:
                issue.type = self._get_issue_type(
                    issue_type_field.get("name"), issue_type_field.get("name") == "Epic"
                )
            issue.save(created_by_id=reporter_uid or self.initiator_id)
            self.report["work_items"] += 1

        self.issue_by_key[key] = issue

        # Sub-tasks (and team-managed children) carry `parent`; classic stories
        # link to their epic via the Epic Link custom field instead.
        parent = fields.get("parent")
        if parent and parent.get("key"):
            self._parent_keys[key] = parent.get("key")
        elif self.epic_link_field:
            epic_key = fields.get(self.epic_link_field)
            # Epic Link is the epic's issue key (a string); guard against odd
            # payload shapes and self-references.
            if isinstance(epic_key, str) and epic_key and epic_key != key:
                self._parent_keys[key] = epic_key

        assignee = fields.get("assignee") or {}
        assignee_uid = self.jira_user_to_plane.get(assignee.get("accountId"))
        if assignee_uid:
            IssueAssignee.objects.get_or_create(
                issue=issue, assignee_id=assignee_uid, defaults={"project": self.project}
            )

        for label_name in fields.get("labels", []) or []:
            label = self._get_label(label_name)
            IssueLabel.objects.get_or_create(issue=issue, label=label, defaults={"project": self.project})

        for component in fields.get("components", []) or []:
            module = self.plane_modules.get(component.get("name"))
            if module:
                ModuleIssue.objects.get_or_create(issue=issue, module=module, defaults={"project": self.project})

    def _link_parents(self):
        for child_key, parent_key in self._parent_keys.items():
            child = self.issue_by_key.get(child_key)
            parent = self.issue_by_key.get(parent_key)
            if child and parent and child.id != parent.id and child.parent_id != parent.id:
                child.parent = parent
                try:
                    child.save()
                except Exception as exc:
                    self._record_error(f"parent {child_key}->{parent_key}: {exc}")

    # -- comments ----------------------------------------------------------
    def _import_comments(self):
        for key, issue in self.issue_by_key.items():
            try:
                for comment in self.client.issue_comments(key):
                    comment_id = str(comment.get("id"))
                    if IssueComment.objects.filter(
                        issue=issue, external_source=EXTERNAL_SOURCE, external_id=comment_id
                    ).exists():
                        continue
                    author = comment.get("author") or {}
                    actor_uid = self.jira_user_to_plane.get(author.get("accountId"))
                    issue_comment = IssueComment(
                        issue=issue,
                        project=self.project,
                        workspace=self.workspace,
                        comment_html=comment.get("renderedBody") or "<p></p>",
                        actor_id=actor_uid,
                        external_source=EXTERNAL_SOURCE,
                        external_id=comment_id,
                    )
                    issue_comment.save(created_by_id=actor_uid or self.initiator_id)
                    self.report["comments"] += 1
            except Exception as exc:
                self._record_error(f"comments {key}: {exc}")

    # -- attachments (as links) -------------------------------------------
    def _import_attachments(self):
        for key, issue in self.issue_by_key.items():
            for attachment in self._fields_by_key.get(key, {}).get("attachment", []) or []:
                url = attachment.get("content")
                if not url:
                    continue
                _, created = IssueLink.objects.get_or_create(
                    issue=issue,
                    url=url,
                    defaults={
                        "project": self.project,
                        "title": attachment.get("filename") or "Attachment",
                    },
                )
                if created:
                    self.report["attachments"] += 1

    # -- links -------------------------------------------------------------
    def _import_links(self):
        for key, issue in self.issue_by_key.items():
            for link in self._fields_by_key.get(key, {}).get("issuelinks", []) or []:
                link_type = link.get("type") or {}
                other = link.get("outwardIssue") or link.get("inwardIssue")
                if not other:
                    continue
                other_issue = self.issue_by_key.get(other.get("key"))
                if not other_issue or other_issue.id == issue.id:
                    continue
                relation_type = map_relation_type(link_type.get("name"))
                _, created = IssueRelation.objects.get_or_create(
                    issue=issue,
                    related_issue=other_issue,
                    defaults={"project": self.project, "relation_type": relation_type},
                )
                if created:
                    self.report["links"] += 1

    # -- sprint membership -------------------------------------------------
    def _assign_sprints(self, sprint_map):
        for sprint_id, cycle in sprint_map.items():
            try:
                for issue_key in self.client.sprint_issue_keys(sprint_id):
                    issue = self.issue_by_key.get(issue_key)
                    if issue:
                        CycleIssue.objects.get_or_create(
                            issue=issue, cycle=cycle, defaults={"project": self.project}
                        )
            except Exception as exc:
                self._record_error(f"sprint {sprint_id} membership: {exc}")


@shared_task
def jira_import_task(job_id):
    try:
        job = ImportJob.objects.get(pk=job_id)
    except ImportJob.DoesNotExist:
        return

    job.status = "processing"
    job.report = _empty_report()
    job.save(update_fields=["status", "report"])

    def _scrub_credentials(import_job):
        config = import_job.config or {}
        config.pop("token", None)
        import_job.config = config

    try:
        importer = JiraImporter(job)
        report = importer.run()
        job.report = report
        job.status = "completed"
        _scrub_credentials(job)
        job.save(update_fields=["status", "report", "config"])
    except Exception as exc:
        job.status = "failed"
        job.reason = str(exc)[:500]
        _scrub_credentials(job)
        job.save(update_fields=["status", "reason", "config"])
        log_exception(exc)
