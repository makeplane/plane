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

# Django imports
from django.db import models
from django.db.models import Q
from django.conf import settings

# Module imports
from plane.db.models import ProjectBaseModel
from plane.utils.uuid import get_anchor


class IntakeSetting(ProjectBaseModel):
    intake = models.ForeignKey("db.Intake", on_delete=models.CASCADE, related_name="intake_settings")
    is_in_app_enabled = models.BooleanField(default=True)
    is_email_enabled = models.BooleanField(default=False)
    is_form_enabled = models.BooleanField(default=False)
    is_trackable_link_enabled = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Intake Setting"
        verbose_name_plural = "Intake Settings"
        db_table = "intake_settings"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.intake.name}"


class IntakeForm(ProjectBaseModel):
    intake = models.ForeignKey("db.Intake", on_delete=models.CASCADE, related_name="intake_forms")
    work_item_type = models.ForeignKey("db.IssueType", on_delete=models.CASCADE, related_name="intake_forms")
    name = models.CharField(max_length=255, verbose_name=" Intake Form Name")
    description = models.TextField(blank=True, null=True, verbose_name=" Intake Form Description")
    anchor = models.CharField(max_length=255, default=get_anchor, unique=True, db_index=True)
    is_active = models.BooleanField(default=True, verbose_name=" Intake Form Is Active")
    is_workitem_description_required = models.BooleanField(default=True)
    is_workitem_name_required = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Intake Form"
        verbose_name_plural = "Intake Forms"
        db_table = "intake_forms"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.name}"

    def create_update_form_fields(self, form_field_ids, user_id=None):
        """
        Create or update form fields for this intake form.

        Args:
            form_field_ids: List of IssueProperty IDs to create or update
            user_id: ID of the user performing the operation (optional, uses existing values for updates)

        Raises:
            IntegrityError: If there's an error creating or updating the form fields
        """
        from django.db import IntegrityError
        from plane.ee.models import IssueProperty

        # Get valid field IDs from IssueProperty
        valid_field_ids = list(
            IssueProperty.objects.filter(
                project_id=self.project_id, issue_type_id=self.work_item_type_id, pk__in=form_field_ids
            ).values_list("id", flat=True)
        )

        # Get current fields for this intake form
        current_field_ids = list(
            IntakeFormField.objects.filter(intake_form=self).values_list("work_item_property", flat=True)
        )

        # Calculate fields to add and remove
        fields_to_add = list(set(valid_field_ids) - set(current_field_ids))
        fields_to_remove = list(set(current_field_ids) - set(valid_field_ids))

        # Remove fields that are no longer needed
        if fields_to_remove:
            IntakeFormField.objects.filter(intake_form=self, work_item_property_id__in=fields_to_remove).delete()

        # Add new fields
        if fields_to_add:
            try:
                IntakeFormField.objects.bulk_create(
                    [
                        IntakeFormField(
                            intake_form=self,
                            work_item_property_id=field_id,
                            project_id=self.project_id,
                            workspace_id=self.workspace_id,
                            created_by_id=user_id or self.created_by_id,
                            updated_by_id=user_id or self.updated_by_id,
                        )
                        for field_id in fields_to_add
                    ]
                )
            except IntegrityError:
                raise IntegrityError("Error creating intake form fields")


class IntakeFormField(ProjectBaseModel):
    intake_form = models.ForeignKey("ee.IntakeForm", on_delete=models.CASCADE, related_name="intake_form_fields")
    work_item_property = models.ForeignKey(
        "ee.IssueProperty", on_delete=models.CASCADE, related_name="intake_form_fields"
    )
    sort_order = models.PositiveIntegerField(default=65535)

    class Meta:
        verbose_name = "Intake Form Field"
        verbose_name_plural = "Intake Form Fields"
        db_table = "intake_form_fields"
        ordering = ("-created_at",)
        unique_together = ("intake_form", "work_item_property")
        constraints = [
            models.UniqueConstraint(
                fields=["intake_form", "work_item_property"],
                condition=Q(deleted_at__isnull=True),
                name="intake_form_field_unique_intake_form_work_item_property_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.work_item_property.name}"


class IntakeResponsibilityTypeChoices(models.TextChoices):
    ASSIGNEE = "ASSIGNEE", "Assignee"
    SUBSCRIBER = "SUBSCRIBER", "Subscriber"


class IntakeResponsibility(ProjectBaseModel):
    intake = models.ForeignKey("db.Intake", on_delete=models.CASCADE, related_name="intake_responsibilities")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="intake_responsibilities")
    type = models.CharField(
        max_length=255,
        choices=IntakeResponsibilityTypeChoices.choices,
        default=IntakeResponsibilityTypeChoices.ASSIGNEE,
        db_index=True,
        verbose_name="Intake Responsibility Type",
        help_text="The type of responsibility for the intake",
    )

    class Meta:
        verbose_name = "Intake Responsibility"
        verbose_name_plural = "Intake Responsibilities"
        db_table = "intake_responsibilities"
        ordering = ("-created_at",)
        unique_together = ("intake", "user", "type", "deleted_at")
        constraints = [
            models.UniqueConstraint(
                fields=["intake", "user", "type"],
                condition=Q(deleted_at__isnull=True),
                name="intake_responsibility_unique_intake_user_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.intake.name} {self.user.email}"


class IntakeEmail(ProjectBaseModel):
    intake = models.ForeignKey("db.Intake", on_delete=models.CASCADE, related_name="intake_emails")
    work_item = models.ForeignKey(
        "db.Issue", on_delete=models.CASCADE, related_name="intake_work_item_emails", blank=True, null=True
    )
    anchor = models.CharField(max_length=255, default=get_anchor, unique=True, db_index=True)
    is_disabled = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Intake Email"
        verbose_name_plural = "Intake Emails"
        db_table = "intake_emails"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.intake.name} - {self.anchor}"
