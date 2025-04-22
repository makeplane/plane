# Django imports
from django.db import models
from django.conf import settings

# Module imports
from plane.db.models.base import BaseModel
from plane.db.models.project import ProjectBaseModel
from plane.utils.html_processor import strip_tags


class GroupChoices(models.TextChoices):
    DRAFT = "draft", "Draft"
    PLANNING = "planning", "Planning"
    EXECUTION = "execution", "Execution"
    MONITORING = "monitoring", "Monitoring"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class ProjectState(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="project_states"
    )
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=255)
    sequence = models.FloatField(default=65535)
    group = models.CharField(
        max_length=20, choices=GroupChoices.choices, default=GroupChoices.DRAFT
    )
    default = models.BooleanField(default=False)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        """Return name of the state"""
        return f"{self.name} <{self.workspace.name}>"

    class Meta:
        unique_together = ["name", "workspace", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "workspace"],
                condition=models.Q(deleted_at__isnull=True),
                name="project_state_unique_name_project_when_deleted_at_null",
            )
        ]
        verbose_name = "Project State"
        verbose_name_plural = "Project States"
        db_table = "project_states"
        ordering = ("sequence",)

    def save(self, *args, **kwargs):
        if self._state.adding:
            # Get the maximum sequence value from the database
            last_id = ProjectState.objects.filter(workspace=self.workspace).aggregate(
                largest=models.Max("sequence")
            )["largest"]
            # if last_id is not None
            if last_id is not None:
                self.sequence = last_id + 15000

        return super().save(*args, **kwargs)


class PriorityChoices(models.TextChoices):
    NONE = "none", "None"
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"
    URGENT = "urgent", "Urgent"


class ProjectAttribute(ProjectBaseModel):
    priority = models.CharField(
        max_length=50, choices=PriorityChoices.choices, default=PriorityChoices.NONE
    )
    state = models.ForeignKey(
        ProjectState,
        on_delete=models.SET_NULL,
        related_name="project_attributes",
        null=True,
    )
    start_date = models.DateTimeField(null=True, blank=True)
    target_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Project Attribute"
        verbose_name_plural = "Project Attributes"
        db_table = "project_attributes"
        ordering = ("created_at",)


class ProjectFeature(ProjectBaseModel):
    is_project_updates_enabled = models.BooleanField(default=False)
    is_epic_enabled = models.BooleanField(default=False)
    is_workflow_enabled = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Project Feature"
        verbose_name_plural = "Project Features"
        db_table = "project_features"
        ordering = ("-created_at",)

    def __str__(self):
        return str(self.project)


class ProjectLink(ProjectBaseModel):
    title = models.CharField(max_length=255, null=True, blank=True)
    url = models.TextField()
    metadata = models.JSONField(default=dict)

    class Meta:
        verbose_name = "Project Link"
        verbose_name_plural = "Project Links"
        db_table = "project_links"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.project.name} {self.url}"


class ProjectReaction(ProjectBaseModel):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_reactions",
    )
    reaction = models.CharField(max_length=20)

    class Meta:
        unique_together = ["project", "actor", "reaction", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "actor", "reaction"],
                condition=models.Q(deleted_at__isnull=True),
                name="project_reaction_unique_project_actor_reaction_when_deleted_at_null",
            )
        ]
        verbose_name = "Project Reaction"
        verbose_name_plural = "Project Reactions"
        db_table = "project_reactions"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.project.name} {self.actor.email}"


class ProjectComment(ProjectBaseModel):
    comment_stripped = models.TextField(verbose_name="Comment", blank=True)
    comment_json = models.JSONField(blank=True, default=dict)
    comment_html = models.TextField(blank=True, default="<p></p>")
    # System can also create comment
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_comments",
        null=True,
    )
    access = models.CharField(
        choices=(("INTERNAL", "INTERNAL"), ("EXTERNAL", "EXTERNAL")),
        default="INTERNAL",
        max_length=100,
    )
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)
    edited_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        self.comment_stripped = (
            strip_tags(self.comment_html) if self.comment_html != "" else ""
        )
        return super(ProjectComment, self).save(*args, **kwargs)

    class Meta:
        verbose_name = "Project Comment"
        verbose_name_plural = "Project Comments"
        db_table = "project_comments"
        ordering = ("-created_at",)

    def __str__(self):
        """Return project of the comment"""
        return str(self.project)


class ProjectCommentReaction(ProjectBaseModel):
    reaction = models.CharField(max_length=255)
    comment = models.ForeignKey(
        "ee.ProjectComment", on_delete=models.CASCADE, related_name="project_reactions"
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_comment_reactions",
    )

    class Meta:
        unique_together = ["comment", "actor", "reaction", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["comment", "actor", "reaction"],
                condition=models.Q(deleted_at__isnull=True),
                name="project_comment_reaction_unique_comment_actor_reaction_when_deleted_at_null",
            )
        ]
        verbose_name = "Project Comment Reaction"
        verbose_name_plural = "Project Comment Reactions"
        db_table = "project_comment_reactions"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.comment} {self.actor.email}"


class ProjectMemberActivityModel(ProjectBaseModel):
    class ProjectMemberActivityType(models.TextChoices):
        # Project
        PROJECT_JOINED = "PROJECT_JOINED", "Project Joined"
        PROJECT_LEFT = "PROJECT_LEFT", "Project Left"
        PROJECT_INVITED = "PROJECT_INVITED", "Project Invited"
        PROJECT_REMOVED = "PROJECT_REMOVED", "Project Removed"

        # Team
        TEAM_JOINED = "TEAM_JOINED", "Team Joined"
        TEAM_LEFT = "TEAM_LEFT", "Team Left"
        TEAM_INVITED = "TEAM_INVITED", "Team Invited"
        TEAM_REMOVED = "TEAM_REMOVED", "Team Removed"

        # Role
        ROLE_UPDATED = "ROLE_UPDATED", "Role Updated"

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_member_activities",
    )
    project_member = models.ForeignKey(
        "db.ProjectMember",
        on_delete=models.CASCADE,
        related_name="activities",
        null=True,
    )
    type = models.CharField(
        max_length=255, default=ProjectMemberActivityType.PROJECT_JOINED
    )
    old_value = models.TextField(blank=True, null=True)
    new_value = models.TextField(blank=True, null=True)
    epoch = models.FloatField(null=True)

    class Meta:
        verbose_name = "Project Member Activity"
        verbose_name_plural = "Project Member Activities"
        db_table = "project_member_activities"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.project.name} {self.actor}"
