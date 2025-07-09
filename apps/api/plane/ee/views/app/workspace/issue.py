# Python imports
import json

# Django imports
from django.utils import timezone
from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.views.base import BaseAPIView
from plane.db.models import Issue
from plane.ee.serializers import IssueSerializer
from plane.app.permissions import ROLE, allow_permission
from plane.utils.order_queryset import order_issue_queryset
from plane.utils.issue_filters import issue_filters
from plane.bgtasks.issue_activities_task import issue_activity


class WorkspaceIssueDetailEndpoint(BaseAPIView):
    """
    This endpoint is used to get the list of issues in the gantt layout in the workspace
    level
    """

    @check_feature_flag(FeatureFlag.GLOBAL_VIEWS_TIMELINE)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        filters = issue_filters(request.query_params, "GET")
        issue = Issue.issue_objects.filter(
            workspace__slug=slug,
        ).filter(
            Q(
                project__project_projectmember__role=5,
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__guest_view_all_features=True,
            )
            | Q(
                project__project_projectmember__role=5,
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__guest_view_all_features=False,
                created_by=self.request.user,
            )
            |
            # For other roles (role < 5), show all issues
            Q(
                project__project_projectmember__role__gt=5,
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            ),
        )

        issue = issue.filter(**filters)
        order_by_param = request.GET.get("order_by", "-created_at")
        # Issue queryset
        issue, order_by_param = order_issue_queryset(
            issue_queryset=issue, order_by_param=order_by_param
        )
        return self.paginate(
            request=request,
            order_by=order_by_param,
            queryset=(issue),
            on_results=lambda issue: IssueSerializer(
                issue, many=True, fields=self.fields, expand=self.expand
            ).data,
        )


class WorkspaceIssueBulkUpdateDateEndpoint(BaseAPIView):
    """
    This endpoint is used to update the start and target date of the issues in the gantt
    layout in the workspace level
    """

    def validate_dates(self, current_start, current_target, new_start, new_target):
        """
        Validate that start date is before target date.
        """
        from datetime import datetime

        start = new_start or current_start
        target = new_target or current_target

        # Convert string dates to datetime objects if they're strings
        if isinstance(start, str):
            start = datetime.strptime(start, "%Y-%m-%d").date()
        if isinstance(target, str):
            target = datetime.strptime(target, "%Y-%m-%d").date()

        if start and target and start > target:
            return False
        return True

    @check_feature_flag(FeatureFlag.GLOBAL_VIEWS_TIMELINE)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        updates = request.data.get("updates", [])

        issue_ids = [update["id"] for update in updates]
        epoch = int(timezone.now().timestamp())

        # get all the project ids from the payload
        project_ids = [update["project_id"] for update in updates]

        # Fetch all relevant issues in a single query
        issues = list(
            Issue.objects.filter(
                id__in=issue_ids,
                project_id__in=project_ids,
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                workspace__slug=slug,
            )
        )

        issues_dict = {str(issue.id): issue for issue in issues}
        issues_to_update = []

        for update in updates:
            issue_id = update["id"]
            issue = issues_dict.get(issue_id)

            if not issue:
                continue

            start_date = update.get("start_date")
            target_date = update.get("target_date")
            validate_dates = self.validate_dates(
                issue.start_date, issue.target_date, start_date, target_date
            )
            if not validate_dates:
                return Response(
                    {"message": "Start date cannot exceed target date"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if start_date:
                issue_activity.delay(
                    type="issue.activity.updated",
                    requested_data=json.dumps({"start_date": update.get("start_date")}),
                    current_instance=json.dumps({"start_date": str(issue.start_date)}),
                    issue_id=str(issue_id),
                    actor_id=str(request.user.id),
                    project_id=str(issue.project_id),
                    epoch=epoch,
                )
                issue.start_date = start_date
                issues_to_update.append(issue)

            if target_date:
                issue_activity.delay(
                    type="issue.activity.updated",
                    requested_data=json.dumps(
                        {"target_date": update.get("target_date")}
                    ),
                    current_instance=json.dumps(
                        {"target_date": str(issue.target_date)}
                    ),
                    issue_id=str(issue_id),
                    actor_id=str(request.user.id),
                    project_id=str(issue.project_id),
                    epoch=epoch,
                )
                issue.target_date = target_date
                issues_to_update.append(issue)

        # Bulk update issues
        Issue.objects.bulk_update(issues_to_update, ["start_date", "target_date"])

        return Response(
            {"message": "Issues updated successfully"}, status=status.HTTP_200_OK
        )
