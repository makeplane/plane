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

import uuid

from django.contrib.auth.hashers import make_password
from django.db import models, transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
import re

from oauth2_provider.models import (
    AbstractAccessToken,
    AbstractApplication,
    AbstractGrant,
    AbstractIDToken,
    AbstractRefreshToken,
    ApplicationManager,
)

from plane.app.permissions.base import ROLE
from plane.authentication.bgtasks.app_webhook_url_updates import app_webhook_url_updates
from plane.authentication.bgtasks.app_delete_updates import app_delete_updates
from plane.authentication.bgtasks.app_logo_asset_updates import app_logo_asset_updates
from plane.db.mixins import SoftDeleteModel, UserAuditModel
from plane.db.models import (
    BaseModel,
    Project,
    ProjectMember,
    User,
    WorkspaceMember,
    Webhook,
)
from plane.db.models.user import BotTypeEnum
from plane.utils.html_processor import strip_tags
from plane.authentication.utils.oauth_utils import create_bot_user_avatar_asset


def custom_app_slug_validator(value):
    if not re.match(r"^[a-z0-9-]+$", value):
        raise ValidationError("Slug must contain only lowercase letters, numbers and hyphens")
    return value


# oauth models
class Application(AbstractApplication, UserAuditModel, SoftDeleteModel):
    class Status(models.TextChoices):
        """
        The status of the application.
        draft – Saved but not yet published by the publisher.
        pending_review – Submitted and waiting for admin/moderator approval.
        approved – Reviewed and accepted, but not necessarily public yet.
        published – Live on the marketplace and discoverable by users.
        hidden – Temporarily removed from public view (but not deleted).
        suspended – Blocked due to violation, security issue, or admin action.
        archived – Permanently de-listed (kept for history, not editable).
        """

        DRAFT = "draft", "Draft"
        PENDING_REVIEW = "pending_review", "Pending Review"
        APPROVED = "approved", "Approved"
        PUBLISHED = "published", "Published"
        HIDDEN = "hidden", "Hidden"
        SUSPENDED = "suspended", "Suspended"
        ARCHIVED = "archived", "Archived"

    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)
    slug = models.SlugField(max_length=48, db_index=True, unique=True, validators=[custom_app_slug_validator])
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
    webhook_secret = models.CharField(max_length=255, null=True, blank=True)
    attachments = models.ManyToManyField(
        "db.FileAsset",
        related_name="applications",
        through="authentication.ApplicationAttachment",
        blank=True,
    )
    categories = models.ManyToManyField(
        "authentication.ApplicationCategory",
        related_name="applications",
        blank=True,
    )
    privacy_policy_url = models.URLField(max_length=800, null=True, blank=True)
    terms_of_service_url = models.URLField(max_length=800, null=True, blank=True)
    contact_email = models.EmailField(max_length=255, null=True, blank=True)
    support_url = models.URLField(max_length=800, null=True, blank=True)
    setup_url = models.CharField(max_length=800, null=True, blank=True)
    video_url = models.URLField(max_length=800, null=True, blank=True)
    configuration_url = models.URLField(max_length=800, null=True, blank=True)
    is_internal = models.BooleanField(default=False)
    website = models.URLField(max_length=800, null=True, blank=True)

    is_mentionable = models.BooleanField(default=False)
    supported_plans = models.JSONField(default=list, blank=True)
    supported_environments = models.JSONField(default=list, blank=True)
    links = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=255, default=Status.DRAFT.value)
    resource_permissions = models.JSONField(default=list, blank=True)
    is_featured = models.BooleanField(default=False)

    # seo fields
    metadata = models.JSONField(default=dict, null=True, blank=True)

    objects = ApplicationManager()

    class Meta(AbstractApplication.Meta):
        verbose_name = "Application"
        verbose_name_plural = "Applications"
        db_table = "oauth_applications"
        ordering = ("-published_at",)

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

        if not self._state.adding:
            old_instance = Application.objects.get(id=self.id)
            if self.webhook_url != old_instance.webhook_url:
                app_webhook_url_updates.delay(self.id)
            # update app bot user imates
            if self.logo_asset != old_instance.logo_asset:
                app_logo_asset_updates.delay(self.id)

        super(Application, self).save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        with transaction.atomic():
            app_delete_updates.delay(self.id)
            super(Application, self).delete(*args, **kwargs)


class Grant(AbstractGrant):
    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)
    workspace = models.ForeignKey(
        "db.Workspace",
        related_name="oauth_grants",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    workspace_app_installation = models.ForeignKey(
        "authentication.WorkspaceAppInstallation",
        related_name="oauth_grants",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    class Meta(AbstractGrant.Meta):
        verbose_name = "Grant"
        verbose_name_plural = "Grants"
        db_table = "oauth_grants"


class AccessToken(AbstractAccessToken):
    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)
    grant_type = models.CharField(max_length=32)
    workspace = models.ForeignKey(
        "db.Workspace",
        related_name="oauth_access_tokens",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    workspace_app_installation = models.ForeignKey(
        "authentication.WorkspaceAppInstallation",
        related_name="oauth_access_tokens",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    class Meta(AbstractAccessToken.Meta):
        verbose_name = "Access token"
        verbose_name_plural = "Access tokens"
        db_table = "oauth_access_tokens"


class RefreshToken(AbstractRefreshToken):
    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)
    workspace = models.ForeignKey(
        "db.Workspace",
        related_name="oauth_refresh_tokens",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    workspace_app_installation = models.ForeignKey(
        "authentication.WorkspaceAppInstallation",
        related_name="oauth_refresh_tokens",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    class Meta(AbstractRefreshToken.Meta):
        verbose_name = "Refresh token"
        verbose_name_plural = "Refresh tokens"
        db_table = "oauth_refresh_tokens"


class IDToken(AbstractIDToken):
    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)

    class Meta(AbstractIDToken.Meta):
        verbose_name = "ID token"
        verbose_name_plural = "ID tokens"
        db_table = "oauth_id_tokens"


# supporting models
class ApplicationOwner(BaseModel):
    user = models.ForeignKey("db.User", related_name="application_owners", on_delete=models.CASCADE)
    application = models.ForeignKey(
        "authentication.Application",
        related_name="application_owners",
        on_delete=models.CASCADE,
    )
    workspace = models.ForeignKey("db.Workspace", related_name="application_owners", on_delete=models.CASCADE)

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
        UNINSTALLED = "uninstalled"

    class InstallationState(models.TextChoices):
        ALLOWED = "allowed"
        NOT_ALLOWED = "not_allowed"

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
    app_bot = models.ForeignKey("db.User", related_name="app_bots", on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=255, default=Status.PENDING)
    webhook = models.ForeignKey(
        "db.Webhook",
        related_name="workspace_app_installations",
        on_delete=models.SET_NULL,
        null=True,
    )

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
        with transaction.atomic():
            # create bot user and attach
            if not self.app_bot:
                username = f"{self.workspace.slug}_{self.application.slug}_bot"
                email = f"{username}@plane.so"
                # check if any old installation exists with the same app and workspace
                # it would have been marked as inactive by the uninstall endpoint
                existing_installation = WorkspaceAppInstallation.all_objects.filter(
                    application=self.application,
                    workspace=self.workspace,
                ).first()
                if existing_installation:
                    # make that bot active in case it was marked as inactive by the uninstall endpoint and use that bot
                    if not existing_installation.app_bot.is_active:
                        existing_installation.app_bot.is_active = True
                        existing_installation.app_bot.save()
                    self.app_bot = existing_installation.app_bot
                else:
                    # check if a bot user with this email already exists
                    # (e.g., from a previous installation that was deleted)
                    existing_bot = User.objects.filter(email=email, is_bot=True).first()
                    if existing_bot:
                        # reuse the existing bot user
                        if not existing_bot.is_active:
                            existing_bot.is_active = True
                            existing_bot.save()
                        self.app_bot = existing_bot
                    else:
                        # create a new bot user
                        bot_type = BotTypeEnum.APP_BOT.value if self.application.is_mentionable else None
                        self.app_bot = User.objects.create(
                            username=username,
                            display_name=f"{self.application.name}",
                            first_name=f"{self.application.name}",
                            last_name="",
                            is_bot=True,
                            bot_type=bot_type,
                            email=email,
                            password=make_password(uuid.uuid4().hex),
                            is_password_autoset=True,
                        )
                        user_avatar_asset = create_bot_user_avatar_asset(self.application.logo_asset, self.app_bot)
                        self.app_bot.avatar_asset = user_avatar_asset
                        self.app_bot.save()

                # add this user to the workspace members (ignore if already exists)
                WorkspaceMember.objects.get_or_create(
                    member=self.app_bot, workspace=self.workspace, defaults={"role": ROLE.MEMBER.value}
                )

            if self.status == self.Status.INSTALLED:
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
                # create the webhook for the app installation
                self._create_webhook()
            super(WorkspaceAppInstallation, self).save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """
        Override delete method to handle cleanup when uninstalling an app:
        - Delete associated webhook
        - Expire/revoke tokens for the app bot and workspace members
        - Remove bot from project and workspace members
        - Mark bot as inactive
        """
        with transaction.atomic():
            # Get the app bot user
            app_bot = self.app_bot

            # Delete the webhook for the installation
            webhook = self.webhook
            if webhook:
                webhook.delete()

            # Delete the tokens for the installation
            # Expire any access token for the bot
            AccessToken.objects.filter(user=app_bot).update(expires=timezone.now())
            # Revoke any refresh token for the bot
            RefreshToken.objects.filter(user=app_bot).update(revoked=timezone.now())
            # Expire any access token and refresh token for any members of the workspace for the application
            workspace_member_ids = WorkspaceMember.objects.filter(workspace=self.workspace).values_list(
                "member_id", flat=True
            )
            AccessToken.objects.filter(user__in=workspace_member_ids, application=self.application).update(
                expires=timezone.now()
            )
            RefreshToken.objects.filter(user__in=workspace_member_ids, application=self.application).update(
                revoked=timezone.now()
            )

            # Remove the bot from project and workspace members
            ProjectMember.objects.filter(member=app_bot, workspace=self.workspace).update(
                deleted_at=timezone.now(), is_active=False
            )
            WorkspaceMember.objects.filter(member=app_bot, workspace=self.workspace).update(
                deleted_at=timezone.now(), is_active=False
            )

            # Mark the app bot user as inactive
            if app_bot:
                app_bot.is_active = False
                app_bot.save()

            # delete the workspace app installation
            self.status = self.Status.UNINSTALLED
            self.save()
            # Call the parent delete method
            super().delete(*args, **kwargs)

    def _create_webhook(self):
        if self.application.webhook_url:
            is_new_webhook = True
            webhook = Webhook()
            if self.webhook:
                webhook = self.webhook
                is_new_webhook = False

            webhook.url = self.application.webhook_url
            if self.application.webhook_secret:
                webhook.secret_key = self.application.webhook_secret
            webhook.is_active = True
            # In future, below config comes from the app installation screen
            webhook.project = True
            webhook.issue = True
            webhook.module = True
            webhook.cycle = True
            webhook.issue_comment = True
            webhook.workspace_id = self.workspace_id
            webhook.created_by_id = self.installed_by_id
            webhook.updated_by_id = self.installed_by_id
            webhook.save(disable_auto_set_user=True)

            if is_new_webhook:
                self.webhook = webhook


class ApplicationAttachment(BaseModel):
    application = models.ForeignKey(
        "authentication.Application",
        related_name="application_attachments",
        on_delete=models.CASCADE,
    )
    file_asset = models.ForeignKey(
        "db.FileAsset",
        related_name="application_attachments",
        on_delete=models.CASCADE,
    )

    class Meta:
        verbose_name = "Application attachment"
        verbose_name_plural = "Application attachments"
        db_table = "oauth_application_attachments"

    @property
    def file_asset_url(self):
        # Return the file asset url if it exists
        if self.file_asset:
            return self.file_asset.asset_url
        return None


class ApplicationCategory(BaseModel):
    DEFAULT_SORT_ORDER = 65535.0

    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=48, db_index=True, unique=True)
    description = models.TextField(null=True, blank=True)
    logo_props = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    sort_order = models.FloatField(default=DEFAULT_SORT_ORDER)

    class Meta:
        db_table = "oauth_application_categories"
        verbose_name = "Application Category"
        verbose_name_plural = "Application Categories"
        ordering = ("sort_order", "-created_at")
