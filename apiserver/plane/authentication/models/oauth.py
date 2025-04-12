import uuid

from oauth2_provider.models import (
    AbstractAccessToken,
    AbstractApplication,
    AbstractGrant,
    AbstractIDToken,
    AbstractRefreshToken,
    ApplicationManager,
)

from django.db import models
from django.contrib.auth.hashers import make_password

from plane.db.mixins import UserAuditModel, SoftDeleteModel
from plane.db.models import BaseModel, User, WorkspaceMember, ProjectMember, Project
from plane.app.permissions.base import ROLE

from plane.utils.html_processor import strip_tags


# oauth models
class Application(AbstractApplication, UserAuditModel, SoftDeleteModel):
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True
    )
    slug = models.SlugField(max_length=48, db_index=True, unique=True)
    short_description = models.CharField(max_length=255)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)
    logo_asset = models.ForeignKey(
        "db.FileAsset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="app_logo_asset",
    )

    published_at = models.DateTimeField(null=True)
    published_by = models.ForeignKey(
        "db.User",
        related_name="published_applications",
        on_delete=models.SET_NULL,
        null=True,
    )
    publish_requested_at = models.DateTimeField(null=True)
    company_name = models.CharField(max_length=255)
    webhook_url = models.URLField(max_length=800, null=True, blank=True)

    objects = ApplicationManager()

    class Meta(AbstractApplication.Meta):
        verbose_name = "Application"
        verbose_name_plural = "Applications"
        db_table = "oauth_applications"

    @property
    def logo_url(self):
        # Return the logo asset url if it exists
        if self.logo_asset:
            return self.logo_asset.asset_url
        return None

    def natural_key(self):
        return (self.client_id,)

    def save(self, *args, **kwargs):
        # Strip the html tags using html parser
        self.description_stripped = (
            None
            if (self.description_html == "" or self.description_html is None)
            else strip_tags(self.description_html)
        )

        super(Application, self).save(*args, **kwargs)


class Grant(AbstractGrant):
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True
    )

    class Meta(AbstractGrant.Meta):
        verbose_name = "Grant"
        verbose_name_plural = "Grants"
        db_table = "oauth_grants"


class AccessToken(AbstractAccessToken):
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True
    )
    grant_type = models.CharField(max_length=32)

    class Meta(AbstractAccessToken.Meta):
        verbose_name = "Access token"
        verbose_name_plural = "Access tokens"
        db_table = "oauth_access_tokens"


class RefreshToken(AbstractRefreshToken):
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True
    )

    class Meta(AbstractRefreshToken.Meta):
        verbose_name = "Refresh token"
        verbose_name_plural = "Refresh tokens"
        db_table = "oauth_refresh_tokens"


class IDToken(AbstractIDToken):
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True
    )

    class Meta(AbstractIDToken.Meta):
        verbose_name = "ID token"
        verbose_name_plural = "ID tokens"
        db_table = "oauth_id_tokens"


# supporting models
class ApplicationOwner(BaseModel):
    user = models.ForeignKey(
        "db.User", related_name="application_owners", on_delete=models.CASCADE
    )
    application = models.ForeignKey(
        "authentication.Application",
        related_name="application_owners",
        on_delete=models.CASCADE,
    )
    workspace = models.ForeignKey(
        "db.Workspace", related_name="application_owners", on_delete=models.CASCADE
    )

    class Meta:
        verbose_name = "Application owner"
        verbose_name_plural = "Application owners"
        db_table = "oauth_application_owners"


class WorkspaceAppInstallation(BaseModel):
    class Status(models.TextChoices):
        PENDING = "pending"
        INSTALLED = "installed"
        FAILED = "failed"
        REAUTHORIZE = "reauthorize"

    workspace = models.ForeignKey(
        "db.Workspace",
        related_name="workspace_app_installations",
        on_delete=models.CASCADE,
    )
    application = models.ForeignKey(
        "authentication.Application",
        related_name="workspace_app_installations",
        on_delete=models.CASCADE,
    )
    installed_by = models.ForeignKey(
        "db.User",
        related_name="installed_applications",
        on_delete=models.CASCADE,
        null=False,
        default=None,
    )
    app_bot = models.ForeignKey(
        "db.User", related_name="app_bots", on_delete=models.SET_NULL, null=True
    )
    status = models.CharField(max_length=255, default=Status.PENDING)

    class Meta:
        verbose_name = "Workspace app installation"
        verbose_name_plural = "Workspace app installations"
        db_table = "workspace_app_installations"
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "application"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_workspace_app_installation",
            )
        ]

    def save(self, *args, **kwargs):
        # create bot user and attach
        if not self.app_bot:
            username = f"{uuid.uuid4().hex}_bot"
            self.app_bot = User.objects.create(
                username=username,
                first_name=f"{self.application.name}",
                last_name="Bot",
                is_bot=True,
                email=f"{username}@plane.so",
                password=make_password(uuid.uuid4().hex),
                is_password_autoset=True,
            )

            # add this user to the workspace members
            WorkspaceMember.objects.create(
                member=self.app_bot, workspace=self.workspace, role=ROLE.MEMBER.value
            )

            # add this user as a project member to all the projects in the workspace using bulk_create
            ProjectMember.objects.bulk_create(
                [
                    ProjectMember(
                        workspace=self.workspace,
                        member=self.app_bot,
                        project=project,
                        role=ROLE.MEMBER.value,
                    )
                    for project in Project.objects.filter(workspace=self.workspace)
                ],
                ignore_conflicts=True,
            )
        super(WorkspaceAppInstallation, self).save(*args, **kwargs)
