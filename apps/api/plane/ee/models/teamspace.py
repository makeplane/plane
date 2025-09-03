# Django imports
from django.db import models
from django.conf import settings

# Module imports
from plane.db.models import BaseModel


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
        "group_by": "state_detail.group",
        "order_by": "-created_at",
        "type": None,
        "sub_issue": True,
        "show_empty_groups": True,
        "layout": "list",
        "calendar_date_range": "",
    }


def get_default_display_properties():
    return {
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
    }


class Teamspace(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="team_spaces"
    )
    name = models.CharField(max_length=255)
    description_json = models.JSONField(default=dict, blank=True)
    description_html = models.TextField(default="<p></p>", blank=True)
    description_stripped = models.TextField(null=True, blank=True)
    description_binary = models.BinaryField(null=True, blank=True)
    logo_props = models.JSONField(null=True, blank=True)
    lead = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="team_space_leads",
        null=True,
    )

    class Meta:
        db_table = "team_spaces"
        verbose_name = "Team Space"
        verbose_name_plural = "Team Spaces"

    def __str__(self):
        return self.name


class TeamspaceMember(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="team_space_members"
    )
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="team_spaces"
    )
    team_space = models.ForeignKey(
        Teamspace, on_delete=models.CASCADE, related_name="members"
    )
    sort_order = models.IntegerField(default=65535)

    class Meta:
        unique_together = ["member", "team_space", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["member", "team_space"],
                condition=models.Q(deleted_at__isnull=True),
                name="team_space_member_unique_member_team_space_when_deleted_at_null",
            )
        ]
        db_table = "team_space_members"
        verbose_name = "Team Space Member"
        verbose_name_plural = "Team Space Members"

    def __str__(self):
        return f"{self.member.display_name} - {self.team_space}"


class TeamspaceProject(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="team_space_projects"
    )
    team_space = models.ForeignKey(
        Teamspace, on_delete=models.CASCADE, related_name="projects"
    )
    project = models.ForeignKey(
        "db.Project", on_delete=models.CASCADE, related_name="team_spaces"
    )
    sort_order = models.IntegerField(default=65535)

    class Meta:
        unique_together = ["team_space", "project", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["team_space", "project"],
                condition=models.Q(deleted_at__isnull=True),
                name="team_space_project_unique_team_space_project_when_deleted_at_null",
            )
        ]
        db_table = "team_space_projects"
        verbose_name = "Team Space Project"
        verbose_name_plural = "Team Space Projects"

    def __str__(self):
        return f"{self.project.name} - {self.team_space.name}"


class TeamspaceLabel(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="team_space_labels"
    )
    team_space = models.ForeignKey(
        Teamspace, on_delete=models.CASCADE, related_name="labels"
    )
    label = models.ForeignKey(
        "db.Label", on_delete=models.CASCADE, related_name="team_spaces"
    )
    sort_order = models.IntegerField(default=65535)

    class Meta:
        unique_together = ["team_space", "label", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["team_space", "label"],
                condition=models.Q(deleted_at__isnull=True),
                name="team_space_label_unique_team_space_label_when_deleted_at_null",
            )
        ]
        db_table = "team_space_labels"
        verbose_name = "Team Space Label"
        verbose_name_plural = "Team Space Labels"

    def __str__(self):
        return f"{self.label.name} - {self.team_space.name}"


class TeamspacePage(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="team_space_pages"
    )
    team_space = models.ForeignKey(
        Teamspace, on_delete=models.CASCADE, related_name="pages"
    )
    page = models.ForeignKey(
        "db.Page", on_delete=models.CASCADE, related_name="team_spaces"
    )
    sort_order = models.IntegerField(default=65535)

    class Meta:
        unique_together = ["team_space", "page", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["team_space", "page"],
                condition=models.Q(deleted_at__isnull=True),
                name="team_space_page_unique_team_space_page_when_deleted_at_null",
            )
        ]
        db_table = "team_space_pages"
        verbose_name = "Team Space Page"
        verbose_name_plural = "Team Space Pages"

    def __str__(self):
        return f"{self.page.name} - {self.team_space.name}"


class TeamspaceView(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="team_space_views"
    )
    team_space = models.ForeignKey(
        Teamspace, on_delete=models.CASCADE, related_name="views"
    )
    view = models.ForeignKey(
        "db.IssueView", on_delete=models.CASCADE, related_name="team_spaces"
    )
    sort_order = models.IntegerField(default=65535)

    class Meta:
        unique_together = ["team_space", "view", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["team_space", "view"],
                condition=models.Q(deleted_at__isnull=True),
                name="team_space_view_unique_team_space_view_when_deleted_at_null",
            )
        ]
        db_table = "team_space_views"
        verbose_name = "Team Space View"
        verbose_name_plural = "Team Space Views"

    def __str__(self):
        return f"{self.view.name} - {self.team_space.name}"


class TeamspaceActivity(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="team_space_activities"
    )
    team_space = models.ForeignKey(
        Teamspace, on_delete=models.CASCADE, related_name="activities"
    )
    verb = models.CharField(max_length=255, verbose_name="Action", default="created")
    field = models.CharField(
        max_length=255, verbose_name="Field Name", blank=True, null=True
    )
    old_value = models.TextField(verbose_name="Old Value", blank=True, null=True)
    new_value = models.TextField(verbose_name="New Value", blank=True, null=True)
    comment = models.TextField(verbose_name="Comment", blank=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="team_space_activities",
    )
    old_identifier = models.UUIDField(null=True)
    new_identifier = models.UUIDField(null=True)
    epoch = models.FloatField(null=True)

    class Meta:
        verbose_name = "Team Space Activity"
        verbose_name_plural = "Team Space Activities"
        db_table = "team_space_activities"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.team_space.name} {self.verb}"


class TeamspaceComment(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="team_space_comments"
    )
    team_space = models.ForeignKey(
        Teamspace, on_delete=models.CASCADE, related_name="comments"
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        related_name="children",
        null=True,
        blank=True,
    )
    comment_stripped = models.TextField(verbose_name="Comment", blank=True)
    comment_json = models.JSONField(blank=True, default=dict)
    comment_html = models.TextField(blank=True, default="<p></p>")
    # System can also create comment
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="team_space_comments",
        null=True,
    )
    edited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "team_space_comments"
        verbose_name = "Team Space Comment"
        verbose_name_plural = "Team Space Comments"

    def __str__(self):
        return f"{self.comment.text} - {self.team_space.name}"


class TeamspaceCommentReaction(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="team_space_comment_reactions",
    )
    team_space = models.ForeignKey(
        Teamspace, on_delete=models.CASCADE, related_name="comment_reactions"
    )
    comment = models.ForeignKey(
        "ee.TeamspaceComment",
        on_delete=models.CASCADE,
        related_name="team_space_reactions",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="team_space_comment_reactions",
    )
    reaction = models.CharField(max_length=20)

    class Meta:
        unique_together = ["comment", "actor", "reaction", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["comment", "actor", "reaction"],
                condition=models.Q(deleted_at__isnull=True),
                name="comment_reaction_unique_team_space_actor_reaction_when_deleted_at_null",
            )
        ]
        verbose_name = "Team Space Comment Reaction"
        verbose_name_plural = "Team Space Comment Reactions"
        db_table = "team_space_comment_reactions"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.team_space.name} {self.actor.email}"


class TeamspaceUserProperty(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="team_space_user_properties",
    )
    team_space = models.ForeignKey(
        "ee.Teamspace", on_delete=models.CASCADE, related_name="user_properties"
    )
    user = models.ForeignKey(
        "db.User", on_delete=models.CASCADE, related_name="team_space_properties"
    )
    filters = models.JSONField(default=get_default_filters)
    display_filters = models.JSONField(default=get_default_display_filters)
    display_properties = models.JSONField(default=get_default_display_properties)
    rich_filters = models.JSONField(default=dict)

    class Meta:
        unique_together = ["team_space", "user", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["team_space", "user"],
                condition=models.Q(deleted_at__isnull=True),
                name="team_space_user_property_unique_team_space_user_when_deleted_at_null",
            )
        ]
        db_table = "team_space_user_properties"
        verbose_name = "Team Space User Property"
        verbose_name_plural = "Team Space User Properties"
