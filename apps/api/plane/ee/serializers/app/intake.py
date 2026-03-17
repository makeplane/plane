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
from django.db import IntegrityError, transaction

# Third party imports
from rest_framework import serializers

# Module imports
from plane.app.serializers.base import BaseSerializer
from plane.ee.models import (
    IntakeSetting,
    IntakeForm,
    IntakeFormField,
    IntakeResponsibility,
    IntakeResponsibilityTypeChoices,
    TeamspaceMember,
    TeamspaceProject,
)
from plane.db.models import Project, ProjectMember
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag


class IntakeSettingSerializer(BaseSerializer):
    class Meta:
        model = IntakeSetting
        fields = "__all__"
        read_only_fields = [
            "created_at",
            "updated_at",
            "workspace",
            "project",
            "created_by",
        ]


class IntakeResponsibilitySerializer(serializers.Serializer):
    users = serializers.ListField(child=serializers.UUIDField(), required=False, allow_empty=True)

    def validate_users(self, value):
        if not value:
            return []

        project_id = self.context.get("project_id")
        if not project_id:
            raise serializers.ValidationError("Project is required")

        # Check if teamspace projects is enabled
        if check_workspace_feature_flag(
            feature_key=FeatureFlag.TEAMSPACES, user_id=self.context.get("user_id"), slug=self.context.get("slug")
        ):
            # Get the project members and teamspace members
            teamspace_ids = TeamspaceProject.objects.filter(project_id=project_id).values_list(
                "team_space_id", flat=True
            )

            validated_users = list(
                ProjectMember.objects.filter(project_id=project_id, member_id__in=value, is_active=True).values_list(
                    "member_id", flat=True
                )
            ) + list(
                TeamspaceMember.objects.filter(team_space_id__in=teamspace_ids, member_id__in=value).values_list(
                    "member_id", flat=True
                )
            )

            return list(set(validated_users))
        validated_users = ProjectMember.objects.filter(
            project_id=project_id, member_id__in=value, is_active=True
        ).values_list("member_id", flat=True)

        return list(validated_users)

    def create(self, validated_data):
        # Remove the existing responsibility and add the new user
        intake = self.context.get("intake")
        project_id = self.context.get("project_id")

        if not intake or not project_id:
            raise serializers.ValidationError("Intake and project are required")

        # Get the existing users
        existing_users = IntakeResponsibility.objects.filter(intake=intake, project_id=project_id).values_list(
            "user_id", flat=True
        )
        requested_users = validated_data.get("users")

        new_users = set(requested_users) - set(existing_users)
        deleted_users = set(existing_users) - set(requested_users)

        with transaction.atomic():
            # Delete the existing users
            IntakeResponsibility.objects.filter(
                intake=intake, project_id=project_id, user_id__in=deleted_users
            ).delete()

            # Create the new users
            IntakeResponsibility.objects.bulk_create(
                [
                    IntakeResponsibility(
                        intake=intake,
                        project_id=project_id,
                        user_id=user_id,
                        workspace_id=intake.workspace_id,
                        type=IntakeResponsibilityTypeChoices.ASSIGNEE,
                    )
                    for user_id in new_users
                ],
                batch_size=10,
            )

        # Return all requested users (the final state), not just newly created ones
        return requested_users

    def to_representation(self, instance):
        """
        Convert the list of user IDs to the expected format
        """
        if isinstance(instance, list):
            # Convert user_ids to strings
            return {"users": [str(user_id) for user_id in instance]}
        return {"users": []}


class IntakeFormSerializer(BaseSerializer):
    form_fields = serializers.ListField(child=serializers.UUIDField(), write_only=True)

    class Meta:
        model = IntakeForm
        fields = "__all__"
        read_only_fields = [
            "created_at",
            "updated_at",
            "workspace",
            "project",
            "created_by",
            "intake",
        ]

    def create(self, validated_data):
        form_fields = validated_data.pop("form_fields", None)

        # Get the project id from the context
        project_id = self.context["project_id"]
        project = Project.objects.get(id=project_id)

        with transaction.atomic():
            # Create the intake form
            intake_form = IntakeForm.objects.create(
                **validated_data,
                project=project,
            )

            if form_fields:
                try:
                    intake_form.create_update_form_fields(form_fields, self.context.get("created_by_id"))
                except IntegrityError:
                    raise serializers.ValidationError("Error creating intake form fields")

            return intake_form

    def update(self, instance, validated_data):
        form_fields = validated_data.pop("form_fields", None)

        with transaction.atomic():
            instance = super().update(instance, validated_data)

            if form_fields:
                try:
                    instance.create_update_form_fields(form_fields, self.context.get("updated_by_id"))
                except IntegrityError:
                    raise serializers.ValidationError("Error updating intake form fields")
            return instance


class IntakeFormReadSerializer(IntakeFormSerializer):
    form_fields = serializers.SerializerMethodField()

    class Meta:
        model = IntakeForm
        fields = [
            "id",
            "name",
            "description",
            "anchor",
            "is_active",
            "intake",
            "work_item_type",
            "form_fields",
            "is_workitem_description_required",
            "is_workitem_name_required",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "project",
            "workspace",
            "intake",
        ]
        read_only_fields = fields

    def get_form_fields(self, obj):
        return [field.work_item_property_id for field in obj.fields]


class IntakeFormFieldSerializer(BaseSerializer):
    class Meta:
        model = IntakeFormField
        fields = "__all__"
        read_only_fields = [
            "created_at",
            "updated_at",
            "workspace",
            "project",
            "created_by",
        ]
