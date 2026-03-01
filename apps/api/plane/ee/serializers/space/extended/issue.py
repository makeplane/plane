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
from plane.db.models import Issue, IssueAssignee, IssueLabel, IssueType, State
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.ee.models import IntakeResponsibility, IntakeResponsibilityTypeChoices
from plane.ee.serializers.space.issue import IssueCreateSerializer


class ExtendedIssueCreateSerializer(IssueCreateSerializer):
    def create(self, validated_data):
        assignees = validated_data.pop("assignee_ids", None)
        labels = validated_data.pop("label_ids", None)

        project_id = self.context["project_id"]
        workspace_id = self.context["workspace_id"]
        default_assignee_id = self.context["default_assignee_id"]
        created_by_id = self.context["created_by_id"]

        issue_type = validated_data.pop("type", None)

        if not issue_type:
            # Get default issue type
            issue_type = IssueType.objects.filter(
                project_issue_types__project_id=project_id,
                is_epic=False,
                is_default=True,
            ).first()
            issue_type = issue_type

        triage_state = State.triage_objects.filter(project_id=project_id, workspace_id=workspace_id).first()
        if not triage_state:
            triage_state = State.create_triage_state(workspace_id=workspace_id, project_id=project_id)

        # Create Issue
        issue = Issue.objects.create(**validated_data, project_id=project_id, type=issue_type, state=triage_state)
        issue.save()

        # Issue Audit Users
        created_by_id = issue.created_by_id
        updated_by_id = issue.updated_by_id

        # Check if the issue is an intake issue and if the intake responsibility feature flag is enabled
        # then check if the payload has assignee_ids and if so, then assign the issue to the assignees
        # else assign to the intake responsibility assignees

        intake_id = self.context.get("intake_id", None)
        workspace_slug = self.context.get("slug", None)

        if assignees is not None and len(assignees):
            IssueAssignee.objects.bulk_create(
                [
                    IssueAssignee(
                        assignee=user,
                        issue=issue,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for user in assignees
                ],
                batch_size=10,
            )
        else:
            if (
                intake_id
                and workspace_slug
                and self.context.get("user_id", None)
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
                        ignore_conflicts=True,
                    )
                except IntegrityError:
                    pass

            # Then assign it to default assignee
            else:
                if default_assignee_id is not None:
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
            IssueLabel.objects.bulk_create(
                [
                    IssueLabel(
                        label=label,
                        issue=issue,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for label in labels
                ],
                batch_size=10,
            )

        return issue
