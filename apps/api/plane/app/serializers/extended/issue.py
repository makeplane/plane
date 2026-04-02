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
from django.db import IntegrityError

# Module imports
from plane.app.serializers.issue import IssueCreateSerializer
from plane.db.models import Issue, IssueType, IssueAssignee, IssueLabel, IssueSubscriber
from plane.ee.models import IntakeResponsibility, IntakeResponsibilityTypeChoices
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag


class ExtendedIssueCreateSerializer(IssueCreateSerializer):
    def create(self, validated_data):
        assignees = validated_data.pop("assignee_ids", None)
        labels = validated_data.pop("label_ids", None)
        validated_data.pop("release_ids", None)

        project_id = self.context["project_id"]
        workspace_id = self.context["workspace_id"]
        default_assignee_id = self.context["default_assignee_id"]

        issue_type = validated_data.pop("type", None)

        if not issue_type:
            # Get default issue type
            issue_type = IssueType.objects.filter(
                project_issue_types__project_id=project_id,
                is_epic=False,
                is_default=True,
            ).first()
            issue_type = issue_type

        # Create Issue
        issue = Issue.objects.create(**validated_data, project_id=project_id, type=issue_type)

        # Issue Audit Users
        created_by_id = issue.created_by_id
        updated_by_id = issue.updated_by_id

        # Check if the issue is an intake issue and if the intake responsibility feature flag is enabled
        # then check if the payload has assignee_ids and if so, then assign the issue to the assignees
        # else assign to the intake responsibility assignees

        intake_id = self.context.get("intake_id", None)
        workspace_slug = self.context.get("slug", None)

        if assignees is not None and len(assignees):
            try:
                IssueAssignee.objects.bulk_create(
                    [
                        IssueAssignee(
                            assignee_id=assignee_id,
                            issue=issue,
                            project_id=project_id,
                            workspace_id=workspace_id,
                            created_by_id=created_by_id,
                            updated_by_id=updated_by_id,
                        )
                        for assignee_id in assignees
                    ],
                    batch_size=10,
                )
            except IntegrityError:
                pass
        else:
            if (
                intake_id
                and workspace_slug
                and check_workspace_feature_flag(
                    feature_key=FeatureFlag.INTAKE_RESPONSIBILITY, user_id=self.context["user_id"], slug=workspace_slug
                )
            ):
                intake_responsibilities = IntakeResponsibility.objects.filter(
                    project_id=project_id,
                    intake=intake_id,
                    type=IntakeResponsibilityTypeChoices.ASSIGNEE,
                ).values_list("user_id", flat=True)
                try:
                    IssueAssignee.objects.bulk_create(
                        [
                            IssueAssignee(
                                assignee_id=user_id,
                                issue=issue,
                                project_id=project_id,
                                workspace_id=workspace_id,
                                created_by_id=created_by_id,
                                updated_by_id=updated_by_id,
                            )
                            for user_id in intake_responsibilities
                        ],
                        batch_size=10,
                    )

                    IssueSubscriber.objects.bulk_create(
                        [
                            IssueSubscriber(
                                subscriber_id=user_id,
                                issue=issue,
                                workspace_id=workspace_id,
                                project_id=project_id,
                                created_by_id=created_by_id,
                                updated_by_id=updated_by_id,
                            )
                            for user_id in intake_responsibilities
                        ]
                    )

                except IntegrityError:
                    pass
            else:
                # Assign to default assignee if valid
                if default_assignee_id is not None and self._is_valid_assignee(default_assignee_id, project_id):
                    try:
                        IssueAssignee.objects.create(
                            assignee_id=default_assignee_id,
                            issue=issue,
                            project_id=project_id,
                            workspace_id=workspace_id,
                            created_by_id=created_by_id,
                            updated_by_id=updated_by_id,
                        )
                    except IntegrityError:
                        pass

        if labels is not None and len(labels):
            try:
                IssueLabel.objects.bulk_create(
                    [
                        IssueLabel(
                            label_id=label_id,
                            issue=issue,
                            project_id=project_id,
                            workspace_id=workspace_id,
                            created_by_id=created_by_id,
                            updated_by_id=updated_by_id,
                        )
                        for label_id in labels
                    ],
                    batch_size=10,
                )
            except IntegrityError:
                pass

        return issue
