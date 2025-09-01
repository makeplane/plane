# Python imports
import uuid
from uuid import UUID
from enum import IntEnum

# Django imports
from django.conf import settings
from django.utils import timezone
from django.db import models
from django.db.models import Q

# Module imports
from plane.utils.html_processor import strip_tags
from plane.db.mixins import SoftDeletionQuerySet, SoftDeletionManager

from .base import BaseModel
from .project import ProjectMember


def get_view_props():
    return {"full_width": False}


class PageQuerySet(SoftDeletionQuerySet):
    """QuerySet for project related models that handles accessibility"""

    def accessible_to(self, user_id: UUID, slug: str):
        from plane.ee.models import TeamspaceProject, TeamspaceMember
        from plane.payment.flags.flag_decorator import check_workspace_feature_flag
        from plane.payment.flags.flag import FeatureFlag

        base_query = Q(
            projects__project_projectmember__member=user_id,
            projects__project_projectmember__is_active=True,
        )

        if check_workspace_feature_flag(
            feature_key=FeatureFlag.TEAMSPACES, user_id=user_id, slug=slug
        ):
            ## Get all team ids where the user is a member
            teamspace_ids = TeamspaceMember.objects.filter(
                member_id=user_id, workspace__slug=slug
            ).values_list("team_space_id", flat=True)

            member_project_ids = ProjectMember.objects.filter(
                member_id=user_id, workspace__slug=slug, is_active=True
            ).values_list("project_id", flat=True)

            # Get all the projects in the respective teamspaces
            teamspace_project_ids = (
                TeamspaceProject.objects.filter(team_space_id__in=teamspace_ids)
                .exclude(project_id__in=member_project_ids)
                .values_list("project_id", flat=True)
            )

            return self.filter(
                Q(projects__id__in=teamspace_project_ids) | Q(base_query),
            )

        return self.filter(base_query, deleted_at__isnull=True)


class PageManager(SoftDeletionManager):
    """Manager for project related models that handles accessibility"""

    def get_queryset(self):
        return PageQuerySet(self.model, using=self._db).filter(deleted_at__isnull=True)

    def accessible_to(self, user_id: UUID, slug: str):
        return self.get_queryset().accessible_to(user_id, slug)


class PageAccess(IntEnum):
    PUBLIC = 0
    PRIVATE = 1


class Page(BaseModel):
    PRIVATE_ACCESS = PageAccess.PRIVATE
    PUBLIC_ACCESS = PageAccess.PUBLIC

    ACCESS_CHOICES = ((PRIVATE_ACCESS, "Private"), (PUBLIC_ACCESS, "Public"))

    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="pages"
    )
    name = models.TextField(blank=True)
    description = models.JSONField(default=dict, blank=True)
    description_binary = models.BinaryField(null=True)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)
    owned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="pages"
    )
    access = models.PositiveSmallIntegerField(
        choices=((0, "Public"), (1, "Private")), default=0
    )
    color = models.CharField(max_length=255, blank=True)
    labels = models.ManyToManyField(
        "db.Label", blank=True, related_name="pages", through="db.PageLabel"
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="child_page",
    )
    archived_at = models.DateField(null=True)
    is_locked = models.BooleanField(default=False)
    view_props = models.JSONField(default=get_view_props)
    logo_props = models.JSONField(default=dict)
    is_global = models.BooleanField(default=False)
    projects = models.ManyToManyField(
        "db.Project", related_name="pages", through="db.ProjectPage"
    )
    moved_to_page = models.UUIDField(null=True, blank=True)
    moved_to_project = models.UUIDField(null=True, blank=True)
    sort_order = models.FloatField(default=65535)
    objects = PageManager()
    external_id = models.CharField(max_length=255, null=True, blank=True)
    external_source = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        verbose_name = "Page"
        verbose_name_plural = "Pages"
        db_table = "pages"
        ordering = ("-created_at",)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Store original values of semantic fields for change tracking
        # Only set if fields are not deferred to avoid unnecessary DB queries
        deferred_fields = self.get_deferred_fields()
        self._original_name = self.name if "name" not in deferred_fields else None
        self._original_description_stripped = (
            self.description_stripped
            if "description_stripped" not in deferred_fields
            else None
        )

    def __str__(self):
        """Return owner email and page name"""
        return f"{self.owned_by.email} <{self.name}>"

    def save(self, *args, **kwargs):
        # Strip the html tags using html parser
        self.description_stripped = (
            None
            if (self.description_html == "" or self.description_html is None)
            else strip_tags(self.description_html)
        )
        super(Page, self).save(*args, **kwargs)

    @property
    def is_description_empty(self):
        return (
            self.description_html == "<p></p>"
            or self.description_html == '<p class="editor-paragraph-block"></p>'
            or self.description_html
            == '<p class="editor-paragraph-block"></p><p class="editor-paragraph-block"></p>'
            or not self.description_html
        )


class PageLog(BaseModel):
    TYPE_CHOICES = (
        ("to_do", "To Do"),
        ("issue", "issue"),
        ("image", "Image"),
        ("video", "Video"),
        ("file", "File"),
        ("link", "Link"),
        ("cycle", "Cycle"),
        ("module", "Module"),
        ("page_mention", "Page Mention"),
        ("user_mention", "User Mention"),
        (
            "sub_page",
            "Sub Page",
        ),  # nested relationship where one page is a child of another.
        (
            "page_link",
            "Page Link",
        ),  # Indicates a reference or external link to another page.
    )
    transaction = models.UUIDField(default=uuid.uuid4)
    page = models.ForeignKey(Page, related_name="page_log", on_delete=models.CASCADE)
    entity_identifier = models.UUIDField(null=True, blank=True)
    entity_name = models.CharField(max_length=30, verbose_name="Transaction Type")
    entity_type = models.CharField(
        max_length=30, verbose_name="Entity Type", null=True, blank=True
    )
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="workspace_page_log"
    )

    class Meta:
        unique_together = ["page", "transaction"]
        verbose_name = "Page Log"
        verbose_name_plural = "Page Logs"
        db_table = "page_logs"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.page.name} {self.entity_name}"


class PageLabel(BaseModel):
    label = models.ForeignKey(
        "db.Label", on_delete=models.CASCADE, related_name="page_labels"
    )
    page = models.ForeignKey(
        "db.Page", on_delete=models.CASCADE, related_name="page_labels"
    )
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="workspace_page_label"
    )

    class Meta:
        verbose_name = "Page Label"
        verbose_name_plural = "Page Labels"
        db_table = "page_labels"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.page.name} {self.label.name}"


class ProjectPage(BaseModel):
    project = models.ForeignKey(
        "db.Project", on_delete=models.CASCADE, related_name="project_pages"
    )
    page = models.ForeignKey(
        "db.Page", on_delete=models.CASCADE, related_name="project_pages"
    )
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="project_pages"
    )

    class Meta:
        unique_together = ["project", "page", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "page"],
                condition=models.Q(deleted_at__isnull=True),
                name="project_page_unique_project_page_when_deleted_at_null",
            )
        ]
        verbose_name = "Project Page"
        verbose_name_plural = "Project Pages"
        db_table = "project_pages"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.project.name} {self.page.name}"


class PageVersion(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="page_versions"
    )
    page = models.ForeignKey(
        "db.Page", on_delete=models.CASCADE, related_name="page_versions"
    )
    last_saved_at = models.DateTimeField(default=timezone.now)
    owned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="page_versions"
    )
    description_binary = models.BinaryField(null=True)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)
    description_json = models.JSONField(default=dict, blank=True)
    sub_pages_data = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Page Version"
        verbose_name_plural = "Page Versions"
        db_table = "page_versions"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        # Strip the html tags using html parser
        self.description_stripped = (
            None
            if (self.description_html == "" or self.description_html is None)
            else strip_tags(self.description_html)
        )
        super(PageVersion, self).save(*args, **kwargs)
