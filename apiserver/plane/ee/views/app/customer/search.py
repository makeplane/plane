# Python imports
import re

# Django imports
from django.db.models import Q, F

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.app.permissions import WorkSpaceAdminPermission
from plane.ee.models.issue import Issue
from plane.ee.models.customer import CustomerRequestIssue

class CustomerIssueSearchEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def get(self, request, slug, customer_id):
        query = request.query_params.get("search", None)

        fields = ["name", "sequence_id", "project__identifier"]
        q = Q()
        for field in fields:
            if field == "sequence_id":
                sequences = re.findall(r"\b\d+\b", query)
                for sequence_id in sequences:
                    q |= Q(**{"sequence_id": sequence_id})
            else:
                q |= Q(**{f"{field}__icontains": query})

        issue_ids = CustomerRequestIssue.objects.filter(
            customer_id=customer_id,
            deleted_at__isnull=True
        ).values_list('issue_id', flat=True)

        issues = Issue.objects.filter(
            q,
            project__project_projectmember__member=self.request.user,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
            workspace__slug=slug,
        ).filter(
            Q(type_id__isnull=True) | Q(project__project_projectfeature__is_epic_enabled=True)
        ).exclude(id__in=issue_ids)

        issues = issues.distinct().values(
            "id", 
            "name", 
            "state_id", 
            "sort_order", 
            "priority",
            "sequence_id", 
            "project_id", 
            "project__identifier",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "labels",
            "type_id",
            "assignees",
            is_epic=F("type__is_epic")
        )[:100]

        return Response(issues, status=status.HTTP_200_OK)

        