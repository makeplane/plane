# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Models of the Liviere/plane fork. They live in their own Django app (label "liviere") with its own
# migrations, so they never clash with upstream migrations in plane/db.

# Django imports
from django.conf import settings
from django.db import models

# Module imports
from plane.liviere.activity.kinds import DEFAULT_KINDS


def default_activity_kinds():
    return list(DEFAULT_KINDS)


class ActivityEvent(models.Model):
    """One action in a project, counted by the activity heatmap (plane/liviere/activity)."""

    SOURCE_ISSUE_ACTIVITY = "issue_activity"
    SOURCE_PAGE = "page"
    SOURCE_CYCLE = "cycle"
    SOURCE_MODULE = "module"
    SOURCE_VIEW = "view"
    # Activity log entry written by a person or an AI agent (plane/liviere/activity/logs.py)
    SOURCE_LOG = "log"

    id = models.BigAutoField(primary_key=True)
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="+")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="+")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+")
    occurred_at = models.DateTimeField()
    kind = models.CharField(max_length=40)
    source = models.CharField(max_length=20)
    # Id of the IssueActivity row the event was copied from; makes the copy idempotent
    source_id = models.UUIDField(null=True)
    # The object acted on (no foreign keys: events outlive deleted objects)
    issue_id = models.UUIDField(null=True)
    page_id = models.UUIDField(null=True)
    object_id = models.UUIDField(null=True)
    # Log entries only: end of the time range (occurred_at is its start) and the text
    ended_at = models.DateTimeField(null=True)
    note = models.TextField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True)

    class Meta:
        db_table = "liviere_activity_events"
        constraints = [
            models.UniqueConstraint(
                fields=["source", "source_id"],
                condition=models.Q(source_id__isnull=False),
                name="liviere_activity_event_unique_source",
            )
        ]
        indexes = [
            models.Index(fields=["project", "occurred_at"], name="liviere_act_project_time"),
            models.Index(fields=["project", "actor", "occurred_at"], name="liviere_act_project_actor"),
            models.Index(
                fields=["project", "ended_at"],
                condition=models.Q(ended_at__isnull=False),
                name="liviere_act_project_range",
            ),
        ]


class ProjectActivitySettings(models.Model):
    """Per-project switch of the "Activity" feature and the actions it counts."""

    project = models.OneToOneField("db.Project", on_delete=models.CASCADE, related_name="+", primary_key=True)
    enabled = models.BooleanField(default=False)
    kinds = models.JSONField(default=default_activity_kinds)
    # Time report (plane/liviere/activity/report.py): actions closer than the gap join a series, which lasts
    # from its first action to its last one plus the padding
    series_gap_minutes = models.PositiveSmallIntegerField(default=15)
    series_padding_minutes = models.PositiveSmallIntegerField(default=5)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+")

    class Meta:
        db_table = "liviere_project_activity_settings"


class ActivityDaySummary(models.Model):
    """
    What happened in a project on one day, in a few sentences by a person or an AI agent
    (plane/liviere/activity/summaries.py). One per project, day and author; shown on the Activity page and
    in the time report. Not an activity event: writing it adds no time.
    """

    id = models.BigAutoField(primary_key=True)
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="+")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="+")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+")
    # Local date in the project time zone
    day = models.DateField()
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "liviere_activity_day_summaries"
        constraints = [
            models.UniqueConstraint(
                fields=["project", "day", "author"],
                condition=models.Q(author__isnull=False),
                name="liviere_day_summary_unique_author",
            )
        ]
        indexes = [models.Index(fields=["project", "day"], name="liviere_day_summary_day")]


class ActivitySkipPeriod(models.Model):
    """
    A period the time report of a project leaves out, e.g. a night of automated tests
    (plane/liviere/activity/skips.py). The Activity grid only marks it; its numbers do not change.
    """

    id = models.BigAutoField(primary_key=True)
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="+")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="+")
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    description = models.CharField(max_length=500, blank=True, default="")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "liviere_activity_skip_periods"
        indexes = [models.Index(fields=["project", "starts_at"], name="liviere_skip_project_start")]


class WorkItemOpen(models.Model):
    """A person opened a work item (peek or full page) for the first time; see plane/liviere/unread."""

    id = models.BigAutoField(primary_key=True)
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="+")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="+")
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="+")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    opened_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "liviere_work_item_opens"
        constraints = [
            models.UniqueConstraint(fields=["user", "issue"], name="liviere_work_item_open_unique"),
        ]
        indexes = [
            models.Index(fields=["user", "project"], name="liviere_open_user_project"),
        ]


class UnreadWorkspaceCutoff(models.Model):
    """Work items created up to `since` are read for everybody (set to the deployment time by a migration)."""

    workspace = models.OneToOneField("db.Workspace", on_delete=models.CASCADE, related_name="+", primary_key=True)
    since = models.DateTimeField()

    class Meta:
        db_table = "liviere_unread_workspace_cutoffs"


class UnreadProjectCutoff(models.Model):
    """Work items of a project created up to `since` are read for one person ("Mark all as read")."""

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="+")
    since = models.DateTimeField()

    class Meta:
        db_table = "liviere_unread_project_cutoffs"
        constraints = [
            models.UniqueConstraint(fields=["user", "project"], name="liviere_unread_project_cutoff_unique"),
        ]


class UnreadMembershipState(models.Model):
    """Last seen state of a project membership, kept by plane.liviere.tasks.sync_unread_memberships.

    Plane re-activates an old ProjectMember row (bulk_update, no signal, old created_at) when a person is added to
    a project again; the task notices the change and moves the person's cutoff of the project, so the time they
    were away does not show up as "New"."""

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="+")
    is_active = models.BooleanField()
    # Last time the membership was seen in this state (moved forward only while it is inactive)
    checked_at = models.DateTimeField()

    class Meta:
        db_table = "liviere_unread_membership_states"
        constraints = [
            models.UniqueConstraint(fields=["user", "project"], name="liviere_unread_membership_unique"),
        ]


class PushSubscription(models.Model):
    """Web push subscription of one browser (plane/liviere/push); removed when the push service answers 404/410."""

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    endpoint = models.TextField(unique=True)
    p256dh = models.CharField(max_length=128)
    auth = models.CharField(max_length=64)
    user_agent = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    last_success_at = models.DateTimeField(null=True)
    failure_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "liviere_push_subscriptions"
        indexes = [models.Index(fields=["user"], name="liviere_push_sub_user")]


class PushProject(models.Model):
    """A project the person wants push notifications about (for all their browsers)."""

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="+")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="+")

    class Meta:
        db_table = "liviere_push_projects"
        constraints = [
            models.UniqueConstraint(fields=["user", "project"], name="liviere_push_project_unique"),
        ]
        indexes = [models.Index(fields=["project"], name="liviere_push_project_project")]


# Decision register (plane/liviere/decisions): one decision is one rule of a project, with a state and a history.


class DecisionSettings(models.Model):
    """Per-project switch of the "Decisions" feature and the counter of decision numbers.

    The row is created when the feature is enabled, so the counter exists before the first decision: every write
    locks it (select_for_update) and takes the next number, which is never handed out again."""

    project = models.OneToOneField("db.Project", on_delete=models.CASCADE, related_name="+", primary_key=True)
    enabled = models.BooleanField(default=False)
    last_number = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+")

    class Meta:
        db_table = "liviere_decision_settings"


class DecisionArea(models.Model):
    """An area of a project's decisions (parent empty) or a mechanism of an area (parent set); two levels only."""

    id = models.BigAutoField(primary_key=True)
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="+")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="+")
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, related_name="mechanisms")
    key = models.CharField(max_length=40)
    name = models.CharField(max_length=100)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "liviere_decision_areas"
        constraints = [
            models.UniqueConstraint(
                fields=["project", "key"],
                condition=models.Q(parent__isnull=True),
                name="liviere_decision_area_unique_key",
            ),
            models.UniqueConstraint(
                fields=["parent", "key"],
                condition=models.Q(parent__isnull=False),
                name="liviere_decision_mechanism_unique_key",
            ),
        ]


class Decision(models.Model):
    """One decision of a project (plane/liviere/decisions/rules.py has the states and the operations)."""

    id = models.BigAutoField(primary_key=True)
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="+")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="+")
    # Next number of the project (DecisionSettings.last_number), shown as "<project identifier>-D<number>"
    number = models.PositiveIntegerField()
    title = models.CharField(max_length=500)
    rationale = models.TextField(null=True)
    rejected = models.TextField(null=True)
    note = models.TextField(null=True)
    # RESTRICT, not PROTECT: an area with decisions cannot be deleted on its own, but a project (or workspace)
    # deleted for good takes its areas and decisions with it (plane/bgtasks/deletion_task.py, hard_delete)
    area = models.ForeignKey(DecisionArea, on_delete=models.RESTRICT, related_name="+")
    mechanism = models.ForeignKey(DecisionArea, on_delete=models.RESTRICT, null=True, related_name="+")
    area2 = models.ForeignKey(DecisionArea, on_delete=models.RESTRICT, null=True, related_name="+")
    kind = models.CharField(max_length=20)
    status = models.CharField(max_length=20)
    decided_by = models.CharField(max_length=20)
    confirmed = models.BooleanField(default=False)
    decided_on = models.DateField(null=True)
    review_on = models.DateField(null=True)
    review_condition = models.CharField(max_length=500, null=True)
    sources = models.JSONField(default=list)
    # A decision split into several rules has several successors
    supersedes = models.ForeignKey("self", on_delete=models.RESTRICT, null=True, related_name="successors")
    # "Waiting for rollout": a change the project coordinator still has to carry into rules and code
    pending_rollout = models.BooleanField(default=False)
    rollout_reason = models.CharField(max_length=20, null=True)
    rollout_at = models.DateTimeField(null=True)
    rollout_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+")
    rollout_channel = models.CharField(max_length=10, null=True)
    # Imported with an unknown author or date, or with estimated values ("estimated" lists the fields)
    needs_review = models.BooleanField(default=False)
    estimated = models.JSONField(default=list)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+")
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "liviere_decisions"
        constraints = [
            models.UniqueConstraint(fields=["project", "number"], name="liviere_decision_unique_number"),
        ]
        indexes = [
            models.Index(fields=["project", "status"], name="liviere_decision_status"),
            models.Index(fields=["project", "area"], name="liviere_decision_area"),
            models.Index(fields=["project", "area2"], name="liviere_decision_area2"),
            models.Index(
                fields=["project"],
                condition=models.Q(pending_rollout=True),
                name="liviere_decision_rollout",
            ),
        ]


class DecisionIssue(models.Model):
    """A work item of the workspace a decision points to (any project, archived work items too)."""

    id = models.BigAutoField(primary_key=True)
    decision = models.ForeignKey(Decision, on_delete=models.CASCADE, related_name="issue_links")
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="+")

    class Meta:
        db_table = "liviere_decision_issues"
        constraints = [
            models.UniqueConstraint(fields=["decision", "issue"], name="liviere_decision_issue_unique"),
        ]


class DecisionRelation(models.Model):
    """Two related decisions of a project, symmetric: `low` has the smaller number."""

    id = models.BigAutoField(primary_key=True)
    low = models.ForeignKey(Decision, on_delete=models.CASCADE, related_name="+")
    high = models.ForeignKey(Decision, on_delete=models.CASCADE, related_name="+")

    class Meta:
        db_table = "liviere_decision_relations"
        constraints = [
            models.UniqueConstraint(fields=["low", "high"], name="liviere_decision_relation_unique"),
        ]
        indexes = [models.Index(fields=["high"], name="liviere_decision_relation_high")]


class DecisionEvent(models.Model):
    """One change of a decision: who, when, through which channel (app session or API key) and what changed."""

    id = models.BigAutoField(primary_key=True)
    decision = models.ForeignKey(Decision, on_delete=models.CASCADE, related_name="events")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="+")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+")
    channel = models.CharField(max_length=10)
    kind = models.CharField(max_length=30)
    # {field: [old value, new value]}
    changes = models.JSONField(default=dict)
    note = models.TextField(null=True)
    occurred_at = models.DateTimeField()

    class Meta:
        db_table = "liviere_decision_events"
        indexes = [models.Index(fields=["decision", "occurred_at"], name="liviere_decision_event_time")]
