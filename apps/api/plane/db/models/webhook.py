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

# Python imports
from uuid import uuid4
from urllib.parse import urlparse

# Django imports
from django.db import models
from django.core.exceptions import ValidationError

# Module imports
from plane.db.models import BaseModel, ProjectBaseModel
from plane.db.models.workspace import WorkspaceBaseModel


def generate_token():
    return "plane_wh_" + uuid4().hex


def validate_schema(value):
    parsed_url = urlparse(value)
    if parsed_url.scheme not in ["http", "https"]:
        raise ValidationError("Invalid schema. Only HTTP and HTTPS are allowed.")


def validate_domain(value):
    parsed_url = urlparse(value)
    domain = parsed_url.netloc
    if domain in ["localhost", "127.0.0.1"]:
        raise ValidationError("Local URLs are not allowed.")


class Webhook(BaseModel):
    class ContentTypeChoices(models.TextChoices):
        JSON = "application/json", "application/json"
        FORM_DATA = "application/x-www-form-urlencoded", "application/x-www-form-urlencoded"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="workspace_webhooks")
    name = models.CharField(max_length=255, blank=True, null=True)
    content_type = models.CharField(max_length=255, choices=ContentTypeChoices.choices, default=ContentTypeChoices.JSON)
    url = models.URLField(validators=[validate_schema, validate_domain], max_length=1024)
    is_active = models.BooleanField(default=True)
    secret_key = models.CharField(max_length=255, default=generate_token)
    is_internal = models.BooleanField(default=False)
    rich_filters = models.JSONField(default=dict)
    pql_filters = models.JSONField(default=dict)
    # v1 scopes Which are deprecated and will be removed in the future.
    project = models.BooleanField(default=False)
    issue = models.BooleanField(default=False)
    module = models.BooleanField(default=False)
    cycle = models.BooleanField(default=False)
    issue_comment = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.workspace.slug} {self.url}"

    class Meta:
        unique_together = ["workspace", "url", "deleted_at"]
        verbose_name = "Webhook"
        verbose_name_plural = "Webhooks"
        db_table = "webhooks"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "url"],
                condition=models.Q(deleted_at__isnull=True),
                name="webhook_url_unique_url_when_deleted_at_null",
            )
        ]


class WebhookScope(WorkspaceBaseModel):
    class ScopeChoices(models.TextChoices):
        PROJECT = "project", "Project"
        MODULE = "module", "Module"
        CYCLE = "cycle", "Cycle"
        MILESTONE = "milestone", "Milestone"
        PAGE = "page", "Page"
        PAGE_COMMENT = "page_comment", "Page Comment"
        WORK_ITEM = "work_item", "Work Item"
        WORK_ITEM_COMMENT = "work_item_comment", "Work Item Comment"
        WORK_ITEM_LINK = "work_item_link", "Work Item Link"
        WORK_ITEM_VOTE = "work_item_vote", "Work Item Vote"
        WORK_ITEM_ATTACHMENT = "work_item_attachment", "Work Item Attachment"
        WORK_ITEM_RELATION = "work_item_relation", "Work Item Relation"
        WORK_ITEM_DEPENDENCY = "work_item_dependency", "Work Item Dependency"
        WORK_ITEM_PAGE_LINK = "work_item_page_link", "Work Item Page Link"

    webhook = models.ForeignKey("db.Webhook", on_delete=models.CASCADE, related_name="scopes")
    scope = models.CharField(max_length=255, choices=ScopeChoices.choices)
    version = models.CharField(max_length=10, default="v2")

    class Meta:
        verbose_name = "Webhook Scope"
        verbose_name_plural = "Webhook Scopes"
        db_table = "webhook_scopes"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "webhook", "scope", "version"],
                condition=models.Q(deleted_at__isnull=True),
                name="webhook_scope_unique_workspace_webhook_scope_version_when_deleted_at_null",
            )
        ]


class WebhookEvent(WorkspaceBaseModel):
    webhook = models.ForeignKey("db.Webhook", on_delete=models.CASCADE, related_name="events")
    event_type = models.CharField(max_length=255)
    # request details
    request_method = models.CharField(max_length=10, blank=True, null=True)
    request_headers = models.TextField(blank=True, null=True)
    request_body = models.TextField(blank=True, null=True)
    # response details
    response_status = models.TextField(blank=True, null=True)
    response_headers = models.TextField(blank=True, null=True)
    response_body = models.TextField(blank=True, null=True)
    # retry count
    retry_count = models.PositiveSmallIntegerField(default=0)
    # duration
    duration_ms = models.PositiveIntegerField(null=True, blank=True, help_text="Round-trip time in milliseconds.")
    error_message = models.TextField(blank=True, default="", help_text="Error message if the request failed.")

    class Meta:
        verbose_name = "Webhook Event"
        verbose_name_plural = "Webhook Events"
        db_table = "webhook_events"
        ordering = ("-created_at",)


# Deprecated: WebhookLog is deprecated and will be removed in the future.
class WebhookLog(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="webhook_logs")
    # Associated webhook
    webhook = models.UUIDField()

    # Basic request details
    event_type = models.CharField(max_length=255, blank=True, null=True)
    request_method = models.CharField(max_length=10, blank=True, null=True)
    request_headers = models.TextField(blank=True, null=True)
    request_body = models.TextField(blank=True, null=True)

    # Response details
    response_status = models.TextField(blank=True, null=True)
    response_headers = models.TextField(blank=True, null=True)
    response_body = models.TextField(blank=True, null=True)

    # Retry Count
    retry_count = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "Webhook Log"
        verbose_name_plural = "Webhook Logs"
        db_table = "webhook_logs"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.event_type} {str(self.webhook)}"


# Deprecated: ProjectWebhook is deprecated and will be removed in the future.
class ProjectWebhook(ProjectBaseModel):
    webhook = models.ForeignKey("db.Webhook", on_delete=models.CASCADE, related_name="project_webhooks")

    class Meta:
        unique_together = ["project", "webhook", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "webhook"],
                condition=models.Q(deleted_at__isnull=True),
                name="project_webhook_unique_project_webhook_when_deleted_at_null",
            )
        ]
        verbose_name = "Project Webhook"
        verbose_name_plural = "Project Webhooks"
        db_table = "project_webhooks"
        ordering = ("-created_at",)
