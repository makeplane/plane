# Python imports
import pytz
from uuid import uuid4

# Django imports
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q

# Module imports
from plane.db.mixins import AuditModel

# Module imports
from .base import BaseModel

ROLE_CHOICES = (
    (20, "Admin"),
    (15, "Member"),
    (5, "Guest"),
)


def get_default_props():
    return {
        "filters": {
            "priority": None,
            "state": None,
            "state_group": None,
            "assignees": None,
            "created_by": None,
            "labels": None,
            "start_date": None,
            "target_date": None,
            "subscriber": None,
        },
        "display_filters": {
            "group_by": None,
            "order_by": "-created_at",
            "type": None,
            "sub_issue": True,
            "show_empty_groups": True,
            "layout": "list",
            "calendar_date_range": "",
        },
    }


def get_default_preferences():
    return {"pages": {"block_display": True}}


class Project(BaseModel):
    NETWORK_CHOICES = ((0, "Secret"), (2, "Public"))
    name = models.CharField(max_length=255, verbose_name="Project Name")
    description = models.TextField(
        verbose_name="Project Description", blank=True
    )
    description_text = models.JSONField(
        verbose_name="Project Description RT", blank=True, null=True
    )
    description_html = models.JSONField(
        verbose_name="Project Description HTML", blank=True, null=True
    )
    network = models.PositiveSmallIntegerField(
        default=2, choices=NETWORK_CHOICES
    )
    workspace = models.ForeignKey(
        "db.WorkSpace",
        on_delete=models.CASCADE,
        related_name="workspace_project",
    )
    identifier = models.CharField(
        max_length=12,
        verbose_name="Project Identifier",
        db_index=True,
    )
    default_assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="default_assignee",
        null=True,
        blank=True,
    )
    project_lead = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_lead",
        null=True,
        blank=True,
    )
    emoji = models.CharField(max_length=255, null=True, blank=True)
    icon_prop = models.JSONField(null=True)
    module_view = models.BooleanField(default=True)
    cycle_view = models.BooleanField(default=True)
    issue_views_view = models.BooleanField(default=True)
    page_view = models.BooleanField(default=True)
    inbox_view = models.BooleanField(default=False)
    is_time_tracking_enabled = models.BooleanField(default=False)
    is_issue_type_enabled = models.BooleanField(default=False)
    guest_view_all_features = models.BooleanField(default=False)
    cover_image = models.TextField(blank=True, null=True)
    cover_image_asset = models.ForeignKey(
        "db.FileAsset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="project_cover_image",
    )
    estimate = models.ForeignKey(
        "db.Estimate",
        on_delete=models.SET_NULL,
        related_name="projects",
        null=True,
    )
    archive_in = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(12)]
    )
    close_in = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(12)]
    )
    logo_props = models.JSONField(default=dict)
    default_state = models.ForeignKey(
        "db.State",
        on_delete=models.SET_NULL,
        null=True,
        related_name="default_state",
    )
    archived_at = models.DateTimeField(null=True)
    # timezone
    TIMEZONE_CHOICES = tuple(zip(pytz.all_timezones, pytz.all_timezones))
    timezone = models.CharField(
        max_length=255, default="UTC", choices=TIMEZONE_CHOICES
    )

    @property
    def cover_image_url(self):
        # Return cover image url
        if self.cover_image_asset:
            return self.cover_image_asset.asset_url

        # Return cover image url
        if self.cover_image:
            return self.cover_image

        return None

    def __str__(self):
        """Return name of the project"""
        return f"{self.name} <{self.workspace.name}>"

    class Meta:
        unique_together = [
            ["identifier", "workspace", "deleted_at"],
            ["name", "workspace", "deleted_at"],
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["identifier", "workspace"],
                condition=Q(deleted_at__isnull=True),
                name="project_unique_identifier_workspace_when_deleted_at_null",
            ),
            models.UniqueConstraint(
                fields=["name", "workspace"],
                condition=Q(deleted_at__isnull=True),
                name="project_unique_name_workspace_when_deleted_at_null",
            ),
        ]
        verbose_name = "Project"
        verbose_name_plural = "Projects"
        db_table = "projects"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        self.identifier = self.identifier.strip().upper()
        return super().save(*args, **kwargs)


class ProjectBaseModel(BaseModel):
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="project_%(class)s"
    )
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="workspace_%(class)s",
    )

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.workspace = self.project.workspace
        super(ProjectBaseModel, self).save(*args, **kwargs)


class ProjectMemberInvite(ProjectBaseModel):
    email = models.CharField(max_length=255)
    accepted = models.BooleanField(default=False)
    token = models.CharField(max_length=255)
    message = models.TextField(null=True)
    responded_at = models.DateTimeField(null=True)
    role = models.PositiveSmallIntegerField(choices=ROLE_CHOICES, default=5)

    class Meta:
        verbose_name = "Project Member Invite"
        verbose_name_plural = "Project Member Invites"
        db_table = "project_member_invites"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.project.name} {self.email} {self.accepted}"


class ProjectMember(ProjectBaseModel):
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="member_project",
    )
    comment = models.TextField(blank=True, null=True)
    role = models.PositiveSmallIntegerField(choices=ROLE_CHOICES, default=5)
    view_props = models.JSONField(default=get_default_props)
    default_props = models.JSONField(default=get_default_props)
    preferences = models.JSONField(default=get_default_preferences)
    sort_order = models.FloatField(default=65535)
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if self._state.adding:
            smallest_sort_order = ProjectMember.objects.filter(
                workspace_id=self.project.workspace_id, member=self.member
            ).aggregate(smallest=models.Min("sort_order"))["smallest"]

            # Project ordering
            if smallest_sort_order is not None:
                self.sort_order = smallest_sort_order - 10000

        super(ProjectMember, self).save(*args, **kwargs)

    class Meta:
        unique_together = ["project", "member", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "member"],
                condition=Q(deleted_at__isnull=True),
                name="project_member_unique_project_member_when_deleted_at_null",
            )
        ]
        verbose_name = "Project Member"
        verbose_name_plural = "Project Members"
        db_table = "project_members"
        ordering = ("-created_at",)

    def __str__(self):
        """Return members of the project"""
        return f"{self.member.email} <{self.project.name}>"


# TODO: Remove workspace relation later
class ProjectIdentifier(AuditModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        models.CASCADE,
        related_name="project_identifiers",
        null=True,
    )
    project = models.OneToOneField(
        Project, on_delete=models.CASCADE, related_name="project_identifier"
    )
    name = models.CharField(max_length=12, db_index=True)

    class Meta:
        unique_together = ["name", "workspace", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "workspace"],
                condition=Q(deleted_at__isnull=True),
                name="unique_name_workspace_when_deleted_at_null",
            )
        ]
        verbose_name = "Project Identifier"
        verbose_name_plural = "Project Identifiers"
        db_table = "project_identifiers"
        ordering = ("-created_at",)


def get_anchor():
    return uuid4().hex


def get_default_views():
    return {
        "list": True,
        "kanban": True,
        "calendar": True,
        "gantt": True,
        "spreadsheet": True,
    }


# DEPRECATED TODO:
# used to get the old anchors for the project deploy boards
class ProjectDeployBoard(ProjectBaseModel):
    anchor = models.CharField(
        max_length=255, default=get_anchor, unique=True, db_index=True
    )
    comments = models.BooleanField(default=False)
    reactions = models.BooleanField(default=False)
    inbox = models.ForeignKey(
        "db.Inbox",
        related_name="bord_inbox",
        on_delete=models.SET_NULL,
        null=True,
    )
    votes = models.BooleanField(default=False)
    views = models.JSONField(default=get_default_views)

    class Meta:
        unique_together = ["project", "anchor"]
        verbose_name = "Project Deploy Board"
        verbose_name_plural = "Project Deploy Boards"
        db_table = "project_deploy_boards"
        ordering = ("-created_at",)

    def __str__(self):
        """Return project and anchor"""
        return f"{self.anchor} <{self.project.name}>"


class ProjectPublicMember(ProjectBaseModel):
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="public_project_members",
    )

    class Meta:
        unique_together = ["project", "member", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "member"],
                condition=models.Q(deleted_at__isnull=True),
                name="project_public_member_unique_project_member_when_deleted_at_null",
            )
        ]
        verbose_name = "Project Public Member"
        verbose_name_plural = "Project Public Members"
        db_table = "project_public_members"
        ordering = ("-created_at",)
