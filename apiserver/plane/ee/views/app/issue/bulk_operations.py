# Python imports
import json
from datetime import datetime
from typing import List, Optional

# Django imports
from django.utils import timezone
from django.db.models.functions import Coalesce
from django.db.models import Q, Value, UUIDField, F, Subquery, OuterRef, Prefetch
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.aggregates import ArrayAgg
from django.core.serializers.json import DjangoJSONEncoder

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.permissions import ProjectEntityPermission
from plane.ee.serializers import IssueSerializer
from plane.db.models import (
    Project,
    Issue,
    IssueLabel,
    IssueAssignee,
    Workspace,
    IssueSubscriber,
    CycleIssue,
    ModuleIssue,
)
from plane.ee.models import IssueProperty, IssuePropertyValue
from plane.bgtasks.issue_activities_task import issue_activity
from plane.ee.bgtasks import bulk_issue_activity
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.utils.error_codes import ERROR_CODES
from plane.ee.utils.issue_property_validators import property_savers
from plane.ee.utils.workflow import WorkflowStateManager
from plane.ee.bgtasks.entity_issue_state_progress_task import (
    entity_issue_state_activity_task,
)


class BulkIssueOperationsEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    def create_issue_property_values(
        self,
        issues: List[Issue],
        type_id: str,
        project_id: str,
        slug: str,
        workspace_id: str,
    ) -> None:
        """Create default property values for issues if they don't exist."""
        # Get issue properties with default values for the issue type
        issue_properties_with_default_values = IssueProperty.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_type_id=type_id,
            default_value__isnull=False,
        ).exclude(default_value=[])

        if not issue_properties_with_default_values:
            return

        # Get existing properties for the issue type in a single query
        existing_property_values = set(
            IssuePropertyValue.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue__type_id=type_id,
                issue__in=issues,
                property__issue_type__is_epic=False,
            ).values_list("property_id", "issue_id")
        )

        bulk_issue_property_values = []
        for issue in issues:
            # Get existing property ids for this issue
            existing_prop_ids = {
                prop_id
                for prop_id, issue_id in existing_property_values
                if str(issue_id) == str(issue.id)
            }

            # Get missing properties
            missing_properties = [
                prop
                for prop in issue_properties_with_default_values
                if str(prop.id) not in existing_prop_ids
            ]

            if missing_properties:
                # Get missing property values
                missing_prop_values = {
                    str(prop.id): prop.default_value for prop in missing_properties
                }

                # Save the data
                bulk_issue_property_values.extend(
                    property_savers(
                        properties=missing_properties,
                        property_values=missing_prop_values,
                        issue_id=issue.id,
                        workspace_id=workspace_id,
                        project_id=project_id,
                        existing_prop_values=[],
                    )
                )

        # Bulk create the issue property values
        if bulk_issue_property_values:
            IssuePropertyValue.objects.bulk_create(
                bulk_issue_property_values, batch_size=100
            )

    def validate_dates(
        self, start_date: Optional[str], target_date: Optional[str]
    ) -> None:
        """Validate start and target dates."""
        if start_date and target_date:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            target = datetime.strptime(target_date, "%Y-%m-%d").date()
            if start > target:
                raise ValueError(ERROR_CODES["INVALID_ISSUE_DATES"])

    @check_feature_flag(FeatureFlag.BULK_OPS_ONE)
    def post(self, request, slug, project_id):
        issue_ids = request.data.get("issue_ids", [])
        if not issue_ids:
            return Response(
                {"error": "Issue IDs are required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get all the issues
        issues = (
            Issue.objects.filter(
                workspace__slug=slug, project_id=project_id, pk__in=issue_ids
            )
            .select_related("state")
            .prefetch_related("labels", "assignees", "issue_module__module")
            .prefetch_related(
                Prefetch(
                    "issue_cycle",
                    queryset=CycleIssue.objects.only("cycle_id"),
                )
            )
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id", distinct=True, filter=~Q(labels__id__isnull=True)
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "assignees__id",
                        distinct=True,
                        filter=~Q(assignees__id__isnull=True)
                        & Q(assignees__member_project__is_active=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                module_ids=Coalesce(
                    ArrayAgg(
                        "issue_module__module_id",
                        distinct=True,
                        filter=~Q(issue_module__module_id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
        )
        # Current epoch
        epoch = int(timezone.now().timestamp())

        # Project details
        project = Project.objects.get(workspace__slug=slug, pk=project_id)
        workspace_id = project.workspace_id

        # Initialize arrays
        issue_activities = []
        bulk_update_issues = []
        bulk_issue_activities = []
        bulk_update_issue_labels = []
        bulk_update_issue_modules = []
        bulk_update_issue_assignees = []
        bulk_cycle_issues = []

        properties = request.data.get("properties", {})

        if properties.get("start_date", False) and properties.get("target_date", False):
            if (
                datetime.strptime(properties.get("start_date"), "%Y-%m-%d").date()
                > datetime.strptime(properties.get("target_date"), "%Y-%m-%d").date()
            ):
                return Response(
                    {
                        "error_code": ERROR_CODES["INVALID_ISSUE_DATES"],
                        "error_message": "INVALID_ISSUE_DATES",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        for issue in issues:
            # Priority
            if properties.get("priority", False):
                issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {"priority": properties.get("priority")}
                        ),
                        "current_instance": json.dumps({"priority": (issue.priority)}),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )
                issue.priority = properties.get("priority")

            # State
            if properties.get("state_id", False):
                issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {"state_id": properties.get("state_id")}
                        ),
                        "current_instance": json.dumps(
                            {"state_id": str(issue.state_id)}
                        ),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )
                # Check if state is updated then is the transition allowed
                workflow_state_manager = WorkflowStateManager(
                    project_id=project_id, slug=slug
                )
                if not workflow_state_manager.validate_state_transition(
                    issue=issue,
                    new_state_id=properties.get("state_id"),
                    user_id=request.user.id,
                ):
                    return Response(
                        {
                            "error_code": ERROR_CODES["INVALID_STATE_TRANSITION"],
                            "error_message": "INVALID_STATE_TRANSITION",
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )

                issue.state_id = properties.get("state_id")
                if issue.state.group == "completed":
                    issue.completed_at = timezone.now()

            # Start date
            if properties.get("start_date", False):
                if (
                    issue.target_date
                    and not properties.get("target_date", False)
                    and issue.target_date
                    <= datetime.strptime(
                        properties.get("start_date"), "%Y-%m-%d"
                    ).date()
                ):
                    return Response(
                        {
                            "error_code": ERROR_CODES["INVALID_ISSUE_START_DATE"],
                            "error_message": "INVALID_ISSUE_START_DATE",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {"start_date": properties.get("start_date")}
                        ),
                        "current_instance": json.dumps(
                            {"start_date": str(issue.start_date)}
                        ),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )
                issue.start_date = properties.get("start_date")

            # Target date
            if properties.get("target_date", False):
                if (
                    issue.start_date
                    and not properties.get("start_date", False)
                    and issue.start_date
                    >= datetime.strptime(
                        properties.get("target_date"), "%Y-%m-%d"
                    ).date()
                ):
                    return Response(
                        {
                            "error_code": ERROR_CODES["INVALID_ISSUE_TARGET_DATE"],
                            "error_message": "INVALID_ISSUE_TARGET_DATE",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {"target_date": properties.get("target_date")}
                        ),
                        "current_instance": json.dumps(
                            {"target_date": str(issue.target_date)}
                        ),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )
                issue.target_date = properties.get("target_date")

            # Estimate Point
            if properties.get("estimate_point", False):
                issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {"estimate_point": properties.get("estimate_point")}
                        ),
                        "current_instance": json.dumps(
                            {
                                "estimate_point": (
                                    str(issue.estimate_point_id)
                                    if issue.estimate_point_id
                                    else issue.estimate_point_id
                                )
                            }
                        ),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )
                issue.estimate_point_id = properties.get("estimate_point")

            # Issue Type
            if properties.get("type_id", False):
                issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {"type_id": properties.get("type_id")}
                        ),
                        "current_instance": json.dumps({"type_id": str(issue.type_id)}),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )
                issue.type_id = properties.get("type_id")

            bulk_update_issues.append(issue)

            # Labels
            if properties.get("label_ids", []):
                for label_id in properties.get("label_ids", []):
                    bulk_update_issue_labels.append(
                        IssueLabel(
                            issue=issue,
                            label_id=label_id,
                            created_by=request.user,
                            project_id=project_id,
                            workspace_id=workspace_id,
                        )
                    )
                bulk_issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {"label_ids": properties.get("label_ids", [])}
                        ),
                        "current_instance": json.dumps(
                            {
                                "label_ids": [
                                    str(label.id) for label in issue.labels.all()
                                ]
                            }
                        ),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )

            # Assignees
            if properties.get("assignee_ids", []):
                for assignee_id in properties.get("assignee_ids", issue.assignees):
                    bulk_update_issue_assignees.append(
                        IssueAssignee(
                            issue=issue,
                            assignee_id=assignee_id,
                            created_by=request.user,
                            project_id=project_id,
                            workspace_id=workspace_id,
                        )
                    )
                bulk_issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {"assignee_ids": properties.get("assignee_ids", [])}
                        ),
                        "current_instance": json.dumps(
                            {
                                "assignee_ids": [
                                    str(assignee.id)
                                    for assignee in issue.assignees.all()
                                ]
                            }
                        ),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )

            # Module
            if properties.get("module_ids", []):
                for module_id in properties.get("module_ids"):
                    issue_module_ids = [str(uuid) for uuid in issue.module_ids]
                    if module_id not in issue_module_ids:
                        bulk_update_issue_modules.append(
                            ModuleIssue(
                                issue=issue,
                                module_id=module_id,
                                project_id=project_id,
                                workspace_id=project.workspace_id,
                                created_by=request.user,
                            )
                        )
                        issue_activities.append(
                            {
                                "type": "module.activity.created",
                                "requested_data": json.dumps({"module_id": module_id}),
                                "current_instance": None,
                                "issue_id": str(issue.id),
                                "actor_id": str(request.user.id),
                                "project_id": str(project_id),
                                "epoch": epoch,
                            }
                        )

            # Check if the cycle id is being updated
            if "cycle_id" in properties:
                # If the cycle id is None, create a cycle activity to delete the cycle since the issue is being moved out of the cycle
                if properties.get("cycle_id") is None:
                    bulk_issue_activities.append(
                        {
                            "type": "cycle.activity.deleted",
                            "requested_data": None,
                            "current_instance": json.dumps(
                                {
                                    "cycle_id": (
                                        str(issue.issue_cycle.first().cycle_id)
                                        if issue.issue_cycle.first()
                                        else None
                                    )
                                }
                            ),
                            "issue_id": str(issue.id),
                            "actor_id": str(request.user.id),
                            "project_id": str(project_id),
                            "epoch": epoch,
                        }
                    )

                # Get the current cycle ID if it exists
                ci = issue.issue_cycle.first()
                current_cycle_id = str(ci.cycle_id) if ci else ""

                # If the cycle id is not None, create a cycle activity to add the cycle since the issue is being moved into a cycle
                if properties.get(
                    "cycle_id"
                ) is not None and current_cycle_id != properties.get("cycle_id"):
                    # New issues to create
                    bulk_cycle_issues.append(
                        CycleIssue(
                            created_by_id=request.user.id,
                            updated_by_id=request.user.id,
                            cycle_id=properties.get("cycle_id"),
                            issue=issue,
                            project_id=project_id,
                            workspace_id=workspace_id,
                        )
                    )
                    # pushed to a background job to update the entity issue state activity
                    entity_issue_state_activity_task.delay(
                        issue_cycle_data=[
                            {
                                "issue_id": str(issue.id),
                                "cycle_id": str(properties.get("cycle_id")),
                            }
                        ],
                        user_id=str(request.user.id),
                        slug=slug,
                        action="ADDED",
                    )
                    bulk_issue_activities.append(
                        {
                            "type": "cycle.activity.created",
                            "requested_data": json.dumps(
                                {"cycle_id": properties.get("cycle_id")}
                            ),
                            "current_instance": json.dumps(
                                {
                                    "cycle_id": (
                                        current_cycle_id if current_cycle_id else None
                                    )
                                }
                            ),
                            "issue_id": str(issue.id),
                            "actor_id": str(request.user.id),
                            "project_id": str(project_id),
                            "epoch": epoch,
                        }
                    )

        # Bulk update all the objects
        Issue.objects.bulk_update(
            bulk_update_issues,
            [
                "priority",
                "start_date",
                "target_date",
                "state_id",
                "completed_at",
                "estimate_point_id",
                "type_id",
            ],
            batch_size=100,
        )

        # Create new labels
        IssueLabel.objects.bulk_create(
            bulk_update_issue_labels, ignore_conflicts=True, batch_size=100
        )

        # Create new assignees
        IssueAssignee.objects.bulk_create(
            bulk_update_issue_assignees, ignore_conflicts=True, batch_size=100
        )

        # Create new modules
        ModuleIssue.objects.bulk_create(
            bulk_update_issue_modules, ignore_conflicts=True, batch_size=100
        )

        # Cycle Issues
        if "cycle_id" in properties:
            # Fetch all the issues with their respective cycle ids
            issues_with_cycle_ids = CycleIssue.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_id__in=issue_ids,
            ).values_list("issue_id", "cycle_id")

            # Build the issue-cycle mapping list
            issue_cycle_data = [
                {"issue_id": str(issue_id), "cycle_id": str(cycle_id)}
                for issue_id, cycle_id in issues_with_cycle_ids
            ]
            # Trigger the background task once
            entity_issue_state_activity_task.delay(
                issue_cycle_data=issue_cycle_data,
                user_id=str(request.user.id),
                slug=slug,
                action="REMOVED",
            )

            # Delete all cycle ids irrespective of the issue
            CycleIssue.objects.filter(
                issue__in=issues,
            ).delete()

        # Bulk create the cycle issues
        CycleIssue.objects.bulk_create(
            bulk_cycle_issues,
            ignore_conflicts=True,
            batch_size=100,
        )

        # Create new issue property values
        if properties.get("type_id", False):
            self.create_issue_property_values(
                issues=bulk_update_issues,
                type_id=properties.get("type_id"),
                project_id=project_id,
                slug=slug,
                workspace_id=workspace_id,
            )

        # update the issue activity
        [issue_activity.delay(**activity) for activity in issue_activities]
        [bulk_issue_activity.delay(**activity) for activity in bulk_issue_activities]

        return Response(status=status.HTTP_204_NO_CONTENT)


class BulkArchiveIssuesEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @check_feature_flag(FeatureFlag.BULK_OPS_ONE)
    def post(self, request, slug, project_id):
        issue_ids = request.data.get("issue_ids", [])

        if not len(issue_ids):
            return Response(
                {"error": "Issue IDs are required"}, status=status.HTTP_400_BAD_REQUEST
            )

        issues = Issue.objects.filter(
            workspace__slug=slug, project_id=project_id, pk__in=issue_ids
        ).select_related("state")
        bulk_archive_issues = []
        for issue in issues:
            if issue.state.group not in ["completed", "cancelled"]:
                return Response(
                    {
                        "error_code": 4091,
                        "error_message": "INVALID_ARCHIVE_STATE_GROUP",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            issue_activity.delay(
                type="issue.activity.updated",
                requested_data=json.dumps(
                    {"archived_at": str(timezone.now().date()), "automation": False}
                ),
                actor_id=str(request.user.id),
                issue_id=str(issue.id),
                project_id=str(project_id),
                current_instance=json.dumps(
                    IssueSerializer(issue).data, cls=DjangoJSONEncoder
                ),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            issue.archived_at = timezone.now().date()
            bulk_archive_issues.append(issue)
        Issue.objects.bulk_update(bulk_archive_issues, ["archived_at"])

        return Response(
            {"archived_at": str(timezone.now().date())}, status=status.HTTP_200_OK
        )


class BulkSubscribeIssuesEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @check_feature_flag(FeatureFlag.BULK_OPS_ONE)
    def post(self, request, slug, project_id):
        issue_ids = request.data.get("issue_ids", [])
        workspace = Workspace.objects.filter(slug=slug).first()

        if not len(issue_ids):
            return Response(
                {"error": "Issue IDs are required"}, status=status.HTTP_400_BAD_REQUEST
            )

        issues = Issue.objects.filter(
            workspace__slug=slug, project_id=project_id, pk__in=issue_ids
        )

        IssueSubscriber.objects.bulk_create(
            [
                IssueSubscriber(
                    subscriber_id=request.user.id,
                    issue=issue,
                    project_id=project_id,
                    workspace_id=workspace.id,
                    created_by_id=request.user.id,
                    updated_by_id=request.user.id,
                )
                for issue in issues
            ],
            batch_size=10,
            ignore_conflicts=True,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
