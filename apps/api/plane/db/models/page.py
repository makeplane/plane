import uuid

from django.conf import settings
from django.utils import timezone

# Django imports
from django.db import models

# Module imports
from plane.utils.html_processor import strip_tags

from .base import BaseModel


def get_view_props():
    return {"full_width": False}


class Page(BaseModel):
    PRIVATE_ACCESS = 1
    PUBLIC_ACCESS = 0
    DEFAULT_SORT_ORDER = 65535

    ACCESS_CHOICES = ((PRIVATE_ACCESS, "Private"), (PUBLIC_ACCESS, "Public"))

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="pages")
    name = models.TextField(blank=True)
    description = models.JSONField(default=dict, blank=True)
    description_binary = models.BinaryField(null=True)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)
    owned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="pages")
    access = models.PositiveSmallIntegerField(choices=((0, "Public"), (1, "Private")), default=0)
    color = models.CharField(max_length=255, blank=True)
    labels = models.ManyToManyField("db.Label", blank=True, related_name="pages", through="db.PageLabel")
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
    projects = models.ManyToManyField("db.Project", related_name="pages", through="db.ProjectPage")
    moved_to_page = models.UUIDField(null=True, blank=True)
    moved_to_project = models.UUIDField(null=True, blank=True)
    sort_order = models.FloatField(default=DEFAULT_SORT_ORDER)

    external_id = models.CharField(max_length=255, null=True, blank=True)
    external_source = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        verbose_name = "Page"
        verbose_name_plural = "Pages"
        db_table = "pages"
        ordering = ("-created_at",)

    def __str__(self):
        """Return owner email and page name"""
        return f"{self.owned_by.email} <{self.name}>"

    def _get_sort_order(self, project):
        """Get the next sort order for the page within a specific project."""
        if self.access == Page.PRIVATE_ACCESS:
            largest = ProjectPage.objects.filter(
                page__access=Page.PRIVATE_ACCESS,
                page__owned_by=self.owned_by,
                project=project,
            ).aggregate(largest=models.Max("sort_order"))["largest"]
        else:
            largest = ProjectPage.objects.filter(
                page__access=Page.PUBLIC_ACCESS,
                project=project,
            ).aggregate(largest=models.Max("sort_order"))["largest"]

        return (largest or self.DEFAULT_SORT_ORDER) + 10000

    def save(self, *args, **kwargs):
        # Strip the html tags using html parser
        self.description_stripped = (
            None
            if (self.description_html == "" or self.description_html is None)
            else strip_tags(self.description_html)
        )

        if not self._state.adding:
            original = Page.objects.get(pk=self.pk)
            if original.access != self.access:
                # Get the project pages for the page and update the sort order
                project_pages = list(ProjectPage.objects.filter(page=self).select_related("project"))
                for project_page in project_pages:
                    project_page.sort_order = self._get_sort_order(project_page.project)
                # Bulk update all project pages in a single query
                if project_pages:
                    ProjectPage.objects.bulk_update(project_pages, ["sort_order"])

        super(Page, self).save(*args, **kwargs)


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
        ("back_link", "Back Link"),
        ("forward_link", "Forward Link"),
        ("page_mention", "Page Mention"),
        ("user_mention", "User Mention"),
    )
    transaction = models.UUIDField(default=uuid.uuid4)
    page = models.ForeignKey(Page, related_name="page_log", on_delete=models.CASCADE)
    entity_identifier = models.UUIDField(null=True, blank=True)
    entity_name = models.CharField(max_length=30, verbose_name="Transaction Type")
    entity_type = models.CharField(max_length=30, verbose_name="Entity Type", null=True, blank=True)
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="workspace_page_log")

    class Meta:
        unique_together = ["page", "transaction"]
        verbose_name = "Page Log"
        verbose_name_plural = "Page Logs"
        db_table = "page_logs"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["entity_type"], name="pagelog_entity_type_idx"),
            models.Index(fields=["entity_identifier"], name="pagelog_entity_id_idx"),
            models.Index(fields=["entity_name"], name="pagelog_entity_name_idx"),
            models.Index(fields=["entity_type", "entity_identifier"], name="pagelog_type_id_idx"),
            models.Index(fields=["entity_name", "entity_identifier"], name="pagelog_name_id_idx"),
        ]

    def __str__(self):
        return f"{self.page.name} {self.entity_name}"


class PageLabel(BaseModel):
    label = models.ForeignKey("db.Label", on_delete=models.CASCADE, related_name="page_labels")
    page = models.ForeignKey("db.Page", on_delete=models.CASCADE, related_name="page_labels")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="workspace_page_label")

    class Meta:
        verbose_name = "Page Label"
        verbose_name_plural = "Page Labels"
        db_table = "page_labels"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.page.name} {self.label.name}"


class ProjectPage(BaseModel):
    DEFAULT_SORT_ORDER = 65535

    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="project_pages")
    page = models.ForeignKey("db.Page", on_delete=models.CASCADE, related_name="project_pages")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="project_pages")
    sort_order = models.FloatField(default=DEFAULT_SORT_ORDER)

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

    def _get_sort_order(self):
        """Get the next sort order for the project page based on page access type."""
        if self.page.access == Page.PRIVATE_ACCESS:
            # For private pages, get max sort_order among pages owned by same user in same project
            largest = ProjectPage.objects.filter(
                page__access=Page.PRIVATE_ACCESS,
                page__owned_by=self.page.owned_by,
                project=self.project,
            ).aggregate(largest=models.Max("sort_order"))["largest"]
        else:
            # For public pages, get max sort_order among all public pages in same project
            largest = ProjectPage.objects.filter(
                page__access=Page.PUBLIC_ACCESS,
                project=self.project,
            ).aggregate(largest=models.Max("sort_order"))["largest"]

        return (largest or self.DEFAULT_SORT_ORDER) + 10000

    def save(self, *args, **kwargs):
        # Set sort_order for new project pages
        if self._state.adding and self.sort_order == self.DEFAULT_SORT_ORDER:
            self.sort_order = self._get_sort_order()

        super(ProjectPage, self).save(*args, **kwargs)


class PageVersion(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="page_versions")
    page = models.ForeignKey("db.Page", on_delete=models.CASCADE, related_name="page_versions")
    last_saved_at = models.DateTimeField(default=timezone.now)
    owned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="page_versions")
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
