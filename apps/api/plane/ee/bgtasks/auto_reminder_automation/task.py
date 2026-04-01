# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""
Auto-reminder background task for work items with upcoming target dates.

Sends in-app and/or email reminders to a work item's subscribers and assignees
when its target date falls within a project-configured window.

HOW IT WORKS
------------
1. Eligible projects have auto_reminder_days > 0 and are not deleted/archived.
2. For each project, the reminder window is [today, today + auto_reminder_days],
   where "today" is resolved in the workspace's timezone (default UTC).
3. Issues with a target_date inside that window and an in-progress state
   (backlog, unstarted, or started) are collected.
4. Recipients are the combined subscribers and assignees of each issue,
   filtered to active project members only.
5. Deduplication: a user is skipped if they already received the same channel's
   notification for this issue within the last auto_reminder_days days.
6. Notifications are bulk-created in batches of 100 and dispatched asynchronously.

DATA FETCHING (avoiding N+1)
----------------------------
Before processing begins, three bulk queries load all required data upfront:
    - Active project members for all eligible projects
    - Subscribers for all candidate issues
    - Assignees for all candidate issues
Results are stored in in-memory maps so per-issue lookups are pure dict reads.

ENTRY POINTS
------------
AutomationAutoReminderTask(workspace_slug, project_id).execute()
    Call from code or the management command for a scoped run.
    Returns (in_app_notification_count, email_notification_count).

auto_reminder_automation_task  (Celery shared_task)
    Scheduled entry point — processes all eligible projects.
    Register with django-celery-beat.

python manage.py automation_auto_reminder
    Management command with optional --slug, --project, --global flags.

NOTIFICATION CHANNELS
---------------------
Both in-app and email channels are currently always enabled.
    in-app  →  Notification rows + push notification dispatch
    email   →  EmailNotificationLog rows + templated email dispatch

"""

# Python imports
import logging
import time
import uuid
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Optional, Union

# Third party imports
import pytz
from celery import shared_task

# Django imports
from django.utils import timezone

# Module imports
from plane.app.serializers import NotificationSerializer
from plane.db.models import (
    EmailNotificationLog,
    Issue,
    IssueAssignee,
    IssueSubscriber,
    Notification,
    Project,
    ProjectMember,
)
from plane.graphql.bgtasks.push_notifications import issue_push_notifications
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.utils.exception_logger import log_exception

# local imports
from .email import send_auto_reminder_email_with_template

logger = logging.getLogger(__name__)

# type alias for project/issue IDs (Django often uses uuid.UUID; APIs may pass str).
UUIDField = Union[str, uuid.UUID]

# feature flag: auto reminder automation
FEATURE_FLAG_KEY = FeatureFlag.DUE_DATE_REMINDER
FEATURE_FLAG_DEFAULT_VALUE = False

# in-app notification: sender and entity used for deduplication and display.
NOTIFICATION_SENDER = "in_app:issue_activities:target-date-reminder"
NOTIFICATION_ENTITY_NAME = "issue"

# email notification log: entity_name and entity used by the email stacking task to route and batch.
EMAIL_NOTIFICATION_ENTITY_NAME = "workitem-target-date-reminder"
EMAIL_NOTIFICATION_ENTITY = "issue-reminder"


class AutomationAutoReminderTask:
    """
    sends target-date reminders for work items across eligible projects.

    pass workspace_slug and/or project_id to narrow the scope.
    leave both as None to process every eligible project in the database.

    call execute() to run. it returns (in_app_notification_count, email_notification_count): the number
    of in-app Notification rows and EmailNotificationLog rows created in that run.
    """

    def __init__(
        self,
        workspace_slug: Optional[str] = None,
        project_id: Optional[UUIDField] = None,
    ):
        # initialize the instance variables
        self.workspace_slug = workspace_slug
        self.project_id = project_id

        # initialize the in-memory maps
        self.project_member_ids_map = {}
        self.issue_subscriber_ids_map = {}
        self.issue_assignee_ids_map = {}
        # initialize the already-reminded maps
        self.already_reminded_in_app_map: dict = {}
        self.already_reminded_email_map: dict = {}
        # initialize the notification lists
        self.in_app_notifications = []
        self.email_notifications = []
        self.email_notification_map: defaultdict[str, list] = defaultdict(list)
        # initialize the triggered issue ids set
        self._triggered_issue_ids: set = set()

    def _reset_caches(self) -> None:
        """
        clear all per-run state so execute() can be safely called more than once
        """

        # clear the in-memory maps
        self.project_member_ids_map.clear()
        self.issue_subscriber_ids_map.clear()
        self.issue_assignee_ids_map.clear()
        # clear the already-reminded maps
        self.already_reminded_in_app_map.clear()
        self.already_reminded_email_map.clear()
        # clear the notification lists
        self.in_app_notifications.clear()
        self.email_notifications.clear()
        self.email_notification_map.clear()
        # clear the triggered issue ids set
        self._triggered_issue_ids.clear()

    def _validate_feature_flag(self, workspace_slug: str) -> bool:
        """
        returns True if the feature flag is enabled, False otherwise
        """

        return check_workspace_feature_flag(
            feature_key=FEATURE_FLAG_KEY, slug=workspace_slug, default_value=FEATURE_FLAG_DEFAULT_VALUE
        )

    def _fetch_projects(self) -> list[Project]:
        """
        returns projects eligible for reminders: auto_reminder_days > 0, not deleted or archived.
        narrowed to workspace_slug and/or project_id when set on the instance.
        """

        projects = Project.objects.filter(
            deleted_at__isnull=True, archived_at__isnull=True, auto_reminder_days__gt=0
        ).select_related("workspace")

        if self.workspace_slug:
            projects = projects.filter(workspace__slug=self.workspace_slug)

        if self.project_id is not None:
            projects = projects.filter(id=self.project_id)

        return list(projects)

    def _fetch_issues_grouped_by_project(self, project_ids: list) -> dict:
        """
        Fetches all candidate issues for the given project IDs in a single query.
        Returns a dict mapping project_id → list[Issue].
        """

        issues = (
            Issue.issue_objects.filter(project_id__in=project_ids, target_date__isnull=False)
            .filter(state__group__in=["backlog", "unstarted", "started"])
            .select_related("state", "project", "type")
            .order_by("-updated_at")
        )

        grouped: defaultdict[uuid.UUID, list[Issue]] = defaultdict(list)
        for issue in issues:
            grouped[issue.project_id].append(issue)

        return grouped

    def _prefetch_data_for_projects(self, project_ids: list, issue_ids: list) -> None:
        """Bulk-fetches project members, issue subscribers, and assignees in 3 queries.

        Populates project_member_ids_map, issue_subscriber_ids_map, and
        issue_assignee_ids_map so per-issue lookups hit the in-memory cache
        instead of issuing individual DB queries.
        """

        # seed empty lists so cache hits work even for projects/issues with no rows.
        for pid in project_ids:
            self.project_member_ids_map.setdefault(pid, [])
        for iid in issue_ids:
            self.issue_subscriber_ids_map.setdefault(iid, [])
            self.issue_assignee_ids_map.setdefault(iid, [])

        # bulk fetch project members
        for project_id, member_id in ProjectMember.objects.filter(
            project_id__in=project_ids, is_active=True
        ).values_list("project_id", "member_id"):
            self.project_member_ids_map[project_id].append(str(member_id))

        # bulk fetch issue subscribers
        for issue_id, subscriber_id in IssueSubscriber.objects.filter(issue_id__in=issue_ids).values_list(
            "issue_id", "subscriber_id"
        ):
            self.issue_subscriber_ids_map[issue_id].append(str(subscriber_id))

        # bulk fetch issue assignees
        for issue_id, assignee_id in IssueAssignee.objects.filter(issue_id__in=issue_ids).values_list(
            "issue_id", "assignee_id"
        ):
            self.issue_assignee_ids_map[issue_id].append(str(assignee_id))

    def _get_issue_recipient_ids(self, project_id: UUIDField, issue_id: UUIDField) -> list[str]:
        """
        Returns the active recipients for an issue: the union of its subscribers and assignees,
        filtered to active project members.
        read directly from the maps populated by _prefetch_data_for_projects
        """

        project_member_ids = self.project_member_ids_map.get(project_id, [])
        if not project_member_ids:
            return []

        subscriber_ids = self.issue_subscriber_ids_map.get(issue_id, [])
        assignee_ids = self.issue_assignee_ids_map.get(issue_id, [])

        project_member_set = set(project_member_ids)
        return [uid for uid in set(subscriber_ids) | set(assignee_ids) if uid in project_member_set]

    def _validate_issue_target_date_within_reminder_window(
        self, issue_target_date: Union[date, datetime], current_time: datetime, auto_reminder_days: int
    ) -> bool:
        """
        returns True if the issue's target_date falls within the reminder window
        the window is [today, today + auto_reminder_days], where today is derived
        from current_time (already converted to the workspace's timezone)
        """

        target_date = issue_target_date.date() if isinstance(issue_target_date, datetime) else issue_target_date
        today = current_time.date()

        if target_date < today:
            return False
        if target_date > today + timedelta(days=auto_reminder_days):
            return False

        return True

    def _prefetch_already_reminded(self, issue_ids: list, min_cutoff: datetime) -> None:
        """
        bulk fetch duplicate-check records for all issues in 2 queries

        min_cutoff is the earliest cutoff across all eligible projects
        (i.e. now - max(auto_reminder_days)). this ensures records for every
        project are captured. per-project filtering against the exact cutoff
        happens in memory inside _process_issue

        populates already_reminded_in_app_map and already_reminded_email_map as:
            {issue_id: {str(receiver_id): created_at}}
        """

        for iid in issue_ids:
            self.already_reminded_in_app_map.setdefault(iid, {})
            self.already_reminded_email_map.setdefault(iid, {})

        for issue_id, receiver_id, created_at in Notification.objects.filter(
            entity_identifier__in=issue_ids,
            entity_name=NOTIFICATION_ENTITY_NAME,
            sender=NOTIFICATION_SENDER,
            created_at__gte=min_cutoff,
        ).values_list("entity_identifier", "receiver_id", "created_at"):
            self.already_reminded_in_app_map[issue_id][str(receiver_id)] = created_at

        for issue_id, receiver_id, created_at in EmailNotificationLog.objects.filter(
            entity_identifier__in=issue_ids,
            entity_name=EMAIL_NOTIFICATION_ENTITY_NAME,
            entity=EMAIL_NOTIFICATION_ENTITY,
            created_at__gte=min_cutoff,
        ).values_list("entity_identifier", "receiver_id", "created_at"):
            self.already_reminded_email_map[issue_id][str(receiver_id)] = created_at

    def _construct_in_app_notification_title(
        self, project_identifier: str, issue_sequence_id: int, issue_target_date: Union[date, datetime]
    ) -> str:
        """
        builds the notification title, e.g. 'Reminder for PROJ-42 to be completed before 2025-06-30.'
        """

        return (
            f"Reminder for {project_identifier}-{issue_sequence_id}"
            f" to be completed before {issue_target_date.strftime('%Y-%m-%d')}."
        )

    def _build_reminder_in_app_notification_data(self, issue: Issue) -> dict:
        """
        builds the data dict stored on the Notification row
        contains issue details and an issue_activity entry with verb='reminder'
        """

        project_identifier = getattr(issue.project, "identifier", "") if issue.project else ""

        return {
            "issue": {
                "id": str(issue.id),
                "name": str(issue.name),
                "identifier": str(project_identifier),
                "sequence_id": issue.sequence_id,
                "state_name": issue.state.name if issue.state else "",
                "state_group": issue.state.group if issue.state else "",
                "type_id": str(issue.type_id) if issue.type_id else "",
                "target_date": issue.target_date.strftime("%Y-%m-%d") if issue.target_date else "",
            },
            "issue_activity": {
                "id": "",
                "verb": "reminder",
                "field": "reminder",
                "actor": str(issue.created_by_id) if issue.created_by_id else "",
                "new_value": "",
                "old_value": "",
                "old_identifier": None,
                "new_identifier": None,
            },
        }

    def _build_reminder_email_notification_data(self, issue: Issue, project: Project) -> dict:
        """
        extends the in-app notification data with project_id, workspace_slug, and activity_time
        this dict is stored as the EmailNotificationLog.data field
        """

        data = self._build_reminder_in_app_notification_data(issue)
        data["issue"]["project_id"] = str(project.id)
        data["issue"]["workspace_slug"] = str(project.workspace.slug) if project.workspace else ""
        data["issue_activity"]["activity_time"] = str(issue.updated_at) if issue.updated_at else ""
        return data

    def _build_reminder_email_notification_context(
        self, workspace_slug: str, project: Project, issue: Issue, subscriber_id: str
    ) -> None:
        """
        appends a template context entry for this issue to the subscriber's email notification map
        the map is later used to send a single batched email per subscriber
        """

        email_notification_context = {
            "workspace": {"slug": str(workspace_slug)},
            "project": {"id": str(project.id), "identifier": str(project.identifier), "name": str(project.name)},
            "workitem": {
                "id": str(issue.id),
                "sequence_id": issue.sequence_id,
                "name": str(issue.name),
                "target_date": issue.target_date.strftime("%Y-%m-%d") if issue.target_date else "",
            },
        }

        self.email_notification_map[subscriber_id].append(email_notification_context)

    def _save_notifications(self) -> None:
        """
        bulk-creates all queued in-app Notification rows, then fires a push notification for each
        """

        if self.in_app_notifications:
            created = Notification.objects.bulk_create(self.in_app_notifications, batch_size=100)
            self._send_push_notifications(notifications=created)

    def _send_push_notifications(self, notifications: list[Notification]) -> None:
        """
        serializes each Notification and dispatches it as an async push notification
        """

        for notification in notifications:
            serialized = NotificationSerializer(notification).data
            for key in ["id", "workspace", "project", "receiver"]:
                if key in serialized and serialized[key]:
                    serialized[key] = str(serialized[key])
            if serialized.get("triggered_by_details") and "id" in serialized["triggered_by_details"]:
                serialized["triggered_by_details"]["id"] = str(serialized["triggered_by_details"]["id"])
            issue_push_notifications.delay(serialized)

    def _save_email_notifications(self) -> None:
        """
        bulk-creates all queued EmailNotificationLog rows (ignoring duplicates), then dispatches emails
        """

        if self.email_notifications:
            EmailNotificationLog.objects.bulk_create(self.email_notifications, batch_size=100, ignore_conflicts=True)
            self._send_auto_reminder_email()

    def _send_auto_reminder_email(self) -> None:
        """
        dispatches one templated reminder email per subscriber.
        """

        for subscriber_id, email_notification_context in self.email_notification_map.items():
            send_auto_reminder_email_with_template.delay(
                subscriber_id=subscriber_id, context=email_notification_context
            )

    def _process_issue(
        self,
        project: Project,
        issue: Issue,
        current_time: datetime,
        utc_now: datetime,
        utc_cutoff: datetime,
        in_app_notification_enabled: bool,
        email_notification_enabled: bool,
        auto_reminder_days: int,
    ) -> None:
        """
        processes one issue: validates the reminder window, resolves recipients,
        skips already-reminded users, then queues in-app and email notifications.
        """

        project_identifier = project.identifier
        issue_id = issue.id
        issue_target_date = issue.target_date

        if not self._validate_issue_target_date_within_reminder_window(
            issue_target_date=issue_target_date,
            current_time=current_time,
            auto_reminder_days=auto_reminder_days,
        ):
            return

        subscriber_ids = self._get_issue_recipient_ids(project_id=project.id, issue_id=issue_id)
        if not subscriber_ids:
            return

        # filter the prefetched reminder records down to this project's exact cutoff.
        already_in_app = {
            uid for uid, dt in self.already_reminded_in_app_map.get(issue_id, {}).items() if dt >= utc_cutoff
        }
        already_email = {
            uid for uid, dt in self.already_reminded_email_map.get(issue_id, {}).items() if dt >= utc_cutoff
        }

        triggered_by_id = project.created_by_id
        in_app_notification_data = self._build_reminder_in_app_notification_data(issue=issue)
        email_notification_data = self._build_reminder_email_notification_data(issue=issue, project=project)
        now = utc_now

        generated_notification_title = None
        if in_app_notification_enabled:
            generated_notification_title = self._construct_in_app_notification_title(
                project_identifier=project_identifier,
                issue_sequence_id=issue.sequence_id,
                issue_target_date=issue_target_date,
            )

        for subscriber_id in subscriber_ids:
            if in_app_notification_enabled and subscriber_id not in already_in_app:
                self.in_app_notifications.append(
                    Notification(
                        workspace=project.workspace,
                        project=project,
                        data=in_app_notification_data,
                        entity_identifier=issue_id,
                        entity_name=NOTIFICATION_ENTITY_NAME,
                        title=generated_notification_title,
                        sender=NOTIFICATION_SENDER,
                        triggered_by_id=triggered_by_id,
                        receiver_id=subscriber_id,
                    )
                )
                self._triggered_issue_ids.add(str(issue_id))

            if email_notification_enabled and subscriber_id not in already_email:
                self.email_notifications.append(
                    EmailNotificationLog(
                        receiver_id=subscriber_id,
                        triggered_by_id=triggered_by_id,
                        entity_identifier=issue_id,
                        entity_name=EMAIL_NOTIFICATION_ENTITY_NAME,
                        data=email_notification_data,
                        entity=EMAIL_NOTIFICATION_ENTITY,
                        processed_at=now,
                        sent_at=now,
                    )
                )
                self._triggered_issue_ids.add(str(issue_id))
                self._build_reminder_email_notification_context(
                    workspace_slug=project.workspace.slug,
                    project=project,
                    issue=issue,
                    subscriber_id=subscriber_id,
                )

    def _process_project(self, project: Project, issues: list[Issue]) -> None:
        """Processes all eligible issues for the given project.

        Reads notification channel toggles and workspace timezone, then calls
        _process_issue for each pre-fetched issue.
        """

        project_id = project.id

        # Both channels are always on. Per-project toggle support can be added here later.
        in_app_notification_enabled = True
        email_notification_enabled = True

        workspace_tz = (project.workspace.timezone if project.workspace else None) or "UTC"
        now = timezone.now()
        current_time = now.astimezone(pytz.timezone(workspace_tz))
        auto_reminder_days = project.auto_reminder_days
        utc_cutoff = now - timedelta(days=auto_reminder_days)

        logger.info(
            "[auto-reminder] processing workspace=%s project=%s with %d candidate issues",
            project.workspace.slug if project.workspace else "unknown",
            project_id,
            len(issues),
            extra={
                "kind": "auto_reminder_task_processing_project",
                "workspace_slug": project.workspace.slug if project.workspace else "unknown",
                "project_id": project_id,
                "auto_reminder_days": auto_reminder_days,
                "candidate_issues": len(issues),
                "triggered_issues": list(self._triggered_issue_ids),
                "notifications": {"in_app": len(self.in_app_notifications), "email": len(self.email_notifications)},
            },
        )

        for issue in issues:
            self._process_issue(
                project=project,
                issue=issue,
                current_time=current_time,
                utc_now=now,
                utc_cutoff=utc_cutoff,
                in_app_notification_enabled=in_app_notification_enabled,
                email_notification_enabled=email_notification_enabled,
                auto_reminder_days=auto_reminder_days,
            )

    def execute(self) -> tuple[int, int]:
        """
        Run the full reminder task and return (in_app_notification_count, email_notification_count).

        Fetches eligible projects, processes their issues, and bulk-creates all
        notification and email log rows. Exceptions are logged via log_exception;
        any rows built before the error are still counted in the return value.
        """

        self._reset_caches()

        start_time = time.monotonic()

        if self.workspace_slug and self.project_id:
            logger.info(
                "[auto-reminder] task started in %.3fs with workspace_slug=%s project_id=%s",
                start_time,
                self.workspace_slug,
                self.project_id,
                extra={
                    "kind": "auto_reminder_task_started",
                    "workspace_slug": self.workspace_slug,
                    "project_id": self.project_id,
                    "start_time": start_time,
                },
            )
        else:
            logger.info(
                "[auto-reminder] task started at %s in global mode",
                start_time,
                extra={
                    "kind": "auto_reminder_task_started",
                    "workspace_slug": None,
                    "project_id": None,
                    "start_time": start_time,
                },
            )

        try:
            all_projects = self._fetch_projects()
            logger.info("[auto-reminder] fetched %d eligible project(s)", len(all_projects))

            # group projects by workspace
            projects_by_workspace: defaultdict[str, list[Project]] = defaultdict(list)
            for project in all_projects:
                projects_by_workspace[project.workspace.slug].append(project)

            # filter to workspaces where the feature flag is enabled
            eligible_projects: list[Project] = []
            for ws_slug, workspace_projects in projects_by_workspace.items():
                if not self._validate_feature_flag(workspace_slug=ws_slug):
                    logger.info("[auto-reminder] workspace=%s skipped — feature flag disabled", ws_slug)
                    continue
                eligible_projects.extend(workspace_projects)

            if eligible_projects:
                project_ids = [p.id for p in eligible_projects]

                # fetch issues grouped by project
                issues_by_project = self._fetch_issues_grouped_by_project(project_ids=project_ids)
                all_issue_ids = [issue.id for issues in issues_by_project.values() for issue in issues]
                logger.info(
                    "[auto-reminder] prefetching data for %d project(s) and %d issue(s)",
                    len(project_ids),
                    len(all_issue_ids),
                )

                # bulk fetch project members, issue subscribers, and assignees in 3 queries
                self._prefetch_data_for_projects(project_ids=project_ids, issue_ids=all_issue_ids)

                # bulk fetch already-reminded records across all issues in 2 queries
                # use the widest window (max auto_reminder_days) so all projects are covered
                # per-project cutoff filtering happens in memory inside _process_issue
                max_reminder_days = max(p.auto_reminder_days for p in eligible_projects)
                self._prefetch_already_reminded(
                    issue_ids=all_issue_ids,
                    min_cutoff=timezone.now() - timedelta(days=max_reminder_days),
                )

                for project in eligible_projects:
                    try:
                        self._process_project(project=project, issues=issues_by_project.get(project.id, []))
                    except Exception as e:
                        log_exception(e)
                        elapsed = time.monotonic() - start_time
                        logger.exception(
                            "[auto-reminder] exception while processing workspace=%s project=%s in %.3fs",
                            project.workspace.slug if project.workspace else "unknown",
                            project.id,
                            elapsed,
                            extra={
                                "kind": "auto_reminder_task_completed_process_issue",
                                "workspace_slug": project.workspace.slug if project.workspace else "unknown",
                                "project_id": project.id,
                                "elapsed": elapsed,
                                "error": str(e),
                            },
                        )

                # save the notifications and email notifications
                try:
                    self._save_notifications()
                    self._save_email_notifications()
                except Exception as e:
                    log_exception(e)
                    elapsed = time.monotonic() - start_time
                    logger.exception(
                        "[auto-reminder] exception while saving notifications and email notifications in %.3fs",
                        elapsed,
                        extra={
                            "kind": "auto_reminder_task_completed_save_notifications_and_email_notifications",
                            "workspace_slug": project.workspace.slug if project.workspace else "unknown",
                            "project_id": project.id,
                            "elapsed": elapsed,
                            "error": str(e),
                        },
                    )

                in_app_notification_count = len(self.in_app_notifications)
                email_notification_count = len(self.email_notifications)

                # log the task completion
                elapsed = time.monotonic() - start_time
                logger.info(
                    "[auto-reminder] task completed in %.3fs with %s notifications",
                    elapsed,
                    in_app_notification_count + email_notification_count,
                    extra={
                        "kind": "auto_reminder_task_completed",
                        "workspace_slug": self.workspace_slug,
                        "project_id": self.project_id,
                        "triggered_issues": len(self._triggered_issue_ids),
                        "notifications": {"in_app": in_app_notification_count, "email": email_notification_count},
                        "elapsed": elapsed,
                    },
                )

                return in_app_notification_count, email_notification_count
            else:
                elapsed = time.monotonic() - start_time
                logger.info(
                    "[auto-reminder] no eligible projects found and task completed in %.3fs",
                    elapsed,
                    extra={
                        "kind": "auto_reminder_task_completed_no_eligible_projects",
                        "workspace_slug": self.workspace_slug,
                        "project_id": self.project_id,
                        "elapsed": elapsed,
                    }
                    if self.workspace_slug and self.project_id
                    else {"elapsed": elapsed},
                )

                return 0, 0
        except Exception as e:
            log_exception(e)

            # log the task failure
            elapsed = time.monotonic() - start_time
            logger.exception(
                "[auto-reminder] task failed after %.3fs — %s",
                elapsed,
                extra={
                    "error": str(e),
                    "triggered_issues": len(self._triggered_issue_ids),
                    "notifications": {
                        "in_app": len(self.in_app_notifications),
                        "email": len(self.email_notifications),
                    },
                },
            )

            return 0, 0


@shared_task
def auto_reminder_automation_task():
    """
    Celery entry point for the scheduled auto-reminder run.

    Processes all eligible projects with no workspace or project filter.
    To run a scoped reminder or get return counts, call
    AutomationAutoReminderTask(...).execute() directly or use the management command.
    """

    try:
        AutomationAutoReminderTask(workspace_slug=None, project_id=None).execute()
    except Exception as e:
        log_exception(e)
