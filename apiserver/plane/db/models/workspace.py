# Django imports
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

# Module imports
from .base import BaseModel
from plane.utils.constants import RESTRICTED_WORKSPACE_SLUGS

ROLE_CHOICES = (
    (20, "Owner"),
    (15, "Admin"),
    (10, "Member"),
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
        "display_properties": {
            "assignee": True,
            "attachment_count": True,
            "created_on": True,
            "due_date": True,
            "estimate": True,
            "key": True,
            "labels": True,
            "link": True,
            "priority": True,
            "start_date": True,
            "state": True,
            "sub_issue_count": True,
            "updated_on": True,
        },
    }


def get_default_filters():
    return {
        "priority": None,
        "state": None,
        "state_group": None,
        "assignees": None,
        "created_by": None,
        "labels": None,
        "start_date": None,
        "target_date": None,
        "subscriber": None,
    }


def get_default_display_filters():
    return {
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


def get_default_display_properties():
    return {
        "display_properties": {
            "assignee": True,
            "attachment_count": True,
            "created_on": True,
            "due_date": True,
            "estimate": True,
            "key": True,
            "labels": True,
            "link": True,
            "priority": True,
            "start_date": True,
            "state": True,
            "sub_issue_count": True,
            "updated_on": True,
        },
    }


def get_issue_props():
    return {
        "subscribed": True,
        "assigned": True,
        "created": True,
        "all_issues": True,
    }


def slug_validator(value):
    if value in RESTRICTED_WORKSPACE_SLUGS:
        raise ValidationError("Slug is not valid")


class Workspace(BaseModel):
    name = models.CharField(max_length=80, verbose_name="Workspace Name")
    logo = models.URLField(verbose_name="Logo", blank=True, null=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owner_workspace",
    )
    slug = models.SlugField(
        max_length=48,
        db_index=True,
        unique=True,
        validators=[
            slug_validator,
        ],
    )
    organization_size = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        """Return name of the Workspace"""
        return self.name

    class Meta:
        verbose_name = "Workspace"
        verbose_name_plural = "Workspaces"
        db_table = "workspaces"
        ordering = ("-created_at",)


class WorkspaceBaseModel(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", models.CASCADE, related_name="workspace_%(class)s"
    )
    project = models.ForeignKey(
        "db.Project",
        models.CASCADE,
        related_name="project_%(class)s",
        null=True,
    )

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if self.project:
            self.workspace = self.project.workspace
        super(WorkspaceBaseModel, self).save(*args, **kwargs)


class WorkspaceMember(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="workspace_member",
    )
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="member_workspace",
    )
    role = models.PositiveSmallIntegerField(choices=ROLE_CHOICES, default=10)
    company_role = models.TextField(null=True, blank=True)
    view_props = models.JSONField(default=get_default_props)
    default_props = models.JSONField(default=get_default_props)
    issue_props = models.JSONField(default=get_issue_props)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ["workspace", "member"]
        verbose_name = "Workspace Member"
        verbose_name_plural = "Workspace Members"
        db_table = "workspace_members"
        ordering = ("-created_at",)

    def __str__(self):
        """Return members of the workspace"""
        return f"{self.member.email} <{self.workspace.name}>"


class WorkspaceMemberInvite(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="workspace_member_invite",
    )
    email = models.CharField(max_length=255)
    accepted = models.BooleanField(default=False)
    token = models.CharField(max_length=255)
    message = models.TextField(null=True)
    responded_at = models.DateTimeField(null=True)
    role = models.PositiveSmallIntegerField(choices=ROLE_CHOICES, default=10)

    class Meta:
        unique_together = ["email", "workspace"]
        verbose_name = "Workspace Member Invite"
        verbose_name_plural = "Workspace Member Invites"
        db_table = "workspace_member_invites"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.workspace.name} {self.email} {self.accepted}"


class Team(BaseModel):
    name = models.CharField(max_length=255, verbose_name="Team Name")
    description = models.TextField(verbose_name="Team Description", blank=True)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="members",
        through="TeamMember",
        through_fields=("team", "member"),
    )
    workspace = models.ForeignKey(
        Workspace, on_delete=models.CASCADE, related_name="workspace_team"
    )
    logo_props = models.JSONField(default=dict)

    def __str__(self):
        """Return name of the team"""
        return f"{self.name} <{self.workspace.name}>"

    class Meta:
        unique_together = ["name", "workspace"]
        verbose_name = "Team"
        verbose_name_plural = "Teams"
        db_table = "teams"
        ordering = ("-created_at",)


class TeamMember(BaseModel):
    workspace = models.ForeignKey(
        Workspace, on_delete=models.CASCADE, related_name="team_member"
    )
    team = models.ForeignKey(
        Team, on_delete=models.CASCADE, related_name="team_member"
    )
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="team_member",
    )

    def __str__(self):
        return self.team.name

    class Meta:
        unique_together = ["team", "member"]
        verbose_name = "Team Member"
        verbose_name_plural = "Team Members"
        db_table = "team_members"
        ordering = ("-created_at",)


class WorkspaceTheme(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="themes"
    )
    name = models.CharField(max_length=300)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="themes",
    )
    colors = models.JSONField(default=dict)

    def __str__(self):
        return str(self.name) + str(self.actor.email)

    class Meta:
        unique_together = ["workspace", "name"]
        verbose_name = "Workspace Theme"
        verbose_name_plural = "Workspace Themes"
        db_table = "workspace_themes"
        ordering = ("-created_at",)


class WorkspaceUserProperties(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="workspace_user_properties",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_user_properties",
    )
    filters = models.JSONField(default=get_default_filters)
    display_filters = models.JSONField(default=get_default_display_filters)
    display_properties = models.JSONField(
        default=get_default_display_properties
    )

    class Meta:
        unique_together = ["workspace", "user"]
        verbose_name = "Workspace User Property"
        verbose_name_plural = "Workspace User Property"
        db_table = "workspace_user_properties"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.workspace.name} {self.user.email}"
