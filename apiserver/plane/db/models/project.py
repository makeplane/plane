# Django imports
from django.db import models
from django.conf import settings
from django.template.defaultfilters import slugify
from django.db.models.signals import post_save
from django.dispatch import receiver

# Modeule imports
from plane.db.mixins import AuditModel

# Module imports
from . import BaseModel

ROLE_CHOICES = (
    (20, "Admin"),
    (15, "Member"),
    (10, "Viewer"),
    (5, "Guest"),
)


class Project(BaseModel):

    NETWORK_CHOICES = ((0, "Secret"), (2, "Public"))
    name = models.CharField(max_length=255, verbose_name="Project Name")
    description = models.TextField(verbose_name="Project Description", blank=True)
    description_text = models.JSONField(
        verbose_name="Project Description RT", blank=True, null=True
    )
    description_html = models.JSONField(
        verbose_name="Project Description HTML", blank=True, null=True
    )
    network = models.PositiveSmallIntegerField(default=2, choices=NETWORK_CHOICES)
    workspace = models.ForeignKey(
        "db.WorkSpace", on_delete=models.CASCADE, related_name="workspace_project"
    )
    identifier = models.CharField(
        max_length=5,
        verbose_name="Project Identifier",
    )
    slug = models.SlugField(max_length=100, blank=True)
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

    def __str__(self):
        """Return name of the project"""
        return f"{self.name} <{self.workspace.name}>"

    class Meta:
        unique_together = ["identifier", "workspace"]
        verbose_name = "Project"
        verbose_name_plural = "Projects"
        db_table = "project"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        self.identifier = self.identifier.strip().upper()
        return super().save(*args, **kwargs)


class ProjectBaseModel(BaseModel):

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="project_%(class)s"
    )
    workspace = models.ForeignKey(
        "db.Workspace", models.CASCADE, related_name="workspace_%(class)s"
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
    role = models.PositiveSmallIntegerField(choices=ROLE_CHOICES, default=10)

    class Meta:
        verbose_name = "Project Member Invite"
        verbose_name_plural = "Project Member Invites"
        db_table = "project_member_invite"
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
    role = models.PositiveSmallIntegerField(choices=ROLE_CHOICES, default=10)
    view_props = models.JSONField(null=True)

    class Meta:
        unique_together = ["project", "member"]
        verbose_name = "Project Member"
        verbose_name_plural = "Project Members"
        db_table = "project_member"
        ordering = ("-created_at",)

    def __str__(self):
        """Return members of the project"""
        return f"{self.member.email} <{self.project.name}>"


class ProjectIdentifier(AuditModel):

    workspace = models.ForeignKey(
        "db.Workspace", models.CASCADE, related_name="project_identifiers", null=True
    )
    project = models.OneToOneField(
        Project, on_delete=models.CASCADE, related_name="project_identifier"
    )
    name = models.CharField(max_length=10)

    class Meta:
        unique_together = ["name", "workspace"]
        verbose_name = "Project Identifier"
        verbose_name_plural = "Project Identifiers"
        db_table = "project_identifier"
        ordering = ("-created_at",)
