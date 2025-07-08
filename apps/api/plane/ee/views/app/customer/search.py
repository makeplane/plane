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
from plane.ee.models.customer import CustomerRequestIssue, CustomerRequest


class CustomerIssueSearchEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def get(self, request, slug, customer_id):
        query = request.query_params.get("search", None)
        customer_request_id = request.query_params.get("customer_request_id", None)

        fields = ["name", "sequence_id", "project__identifier"]
        q = Q()
        for field in fields:
            if field == "sequence_id":
                sequences = re.findall(r"\b\d+\b", query)
                for sequence_id in sequences:
                    q |= Q(**{"sequence_id": sequence_id})
            else:
                q |= Q(**{f"{field}__icontains": query})

        # Get all customer request IDs for the customer in a single query
        customer_request_ids = CustomerRequest.objects.filter(
            customer_id=customer_id
        ).values_list("id", flat=True)

        # Filter issues that are already added to the given customer_request_id
        # or have been directly added to the customer

        issue_ids_to_exclude = CustomerRequestIssue.objects.filter(
            customer_request_id=customer_request_id
        ).values_list("issue_id", flat=True)

        # Filter work items that is already added to the customer requests of the customer
        if customer_request_id is None:
            issue_ids_to_exclude = CustomerRequestIssue.objects.filter(
                customer_request_id__in=customer_request_ids
            ).values_list("issue_id", flat=True)

        issues = (
            Issue.objects.filter(
                q,
                project__archived_at__isnull=True,
                workspace__slug=slug,
                archived_at__isnull=True,
            )
            .filter(
                Q(issue_intake__status=1)
                | Q(issue_intake__status=-1)
                | Q(issue_intake__status=2)
                | Q(issue_intake__isnull=True)
            )
            .exclude(
                Q(type__is_epic=True)
                & Q(project__project_projectfeature__is_epic_enabled=False)
            )
            .exclude(id__in=issue_ids_to_exclude)
            .accessible_to(request.user.id, slug)
        )

        issues = issues.distinct().values(
            "id",
            "name",
            "state_id",
            "sort_order",
            "priority",
            "sequence_id",
            "project_id",
            "project__identifier",
            "type_id",
            is_epic=F("type__is_epic"),
        )[:100]

        return Response(issues, status=status.HTTP_200_OK)
