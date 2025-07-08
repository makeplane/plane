# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.models import CustomerRequestIssue, CustomerRequest
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.app.permissions import WorkSpaceAdminPermission
from plane.db.models import FileAsset

# Django imports
from django.db.models import OuterRef, Func, Q, F, CharField, Subquery
from django.db.models.functions import Cast


class IssueCustomerEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def get(self, request, slug, work_item_id):
        customer_ids = (
            CustomerRequestIssue.objects.filter(
                issue_id=work_item_id, workspace__slug=slug
            )
            .order_by("customer_id")
            .distinct("customer_id")
        ).values_list("customer_id", flat=True)

        return Response(customer_ids, status=status.HTTP_200_OK)


class IssueCustomerRequestEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def get(self, request, slug, work_item_id):
        search = request.query_params.get("search", False)

        customer_requests = (
            CustomerRequest.objects.filter(
                Q(customer_request_issues__issue_id=work_item_id)
                & Q(customer_request_issues__deleted_at__isnull=True),
                workspace__slug=slug,
            ).annotate(
                attachment_count=Subquery(
                    FileAsset.objects.filter(
                        entity_identifier=Cast(
                            OuterRef("id"), output_field=CharField()
                        ),
                        entity_type=FileAsset.EntityTypeContext.CUSTOMER_REQUEST_ATTACHMENT,
                    )
                    .order_by()
                    .annotate(count=Func(F("id"), function="Count"))
                    .values("count")
                )
            )
        ).distinct()

        # # Add search functionality
        if search:
            fields = ["customer__name", "name"]
            q = Q()

            for field in fields:
                q |= Q(**{f"{field}__icontains": search})

            customer_requests = customer_requests.filter(q)

        customer_requests = customer_requests.values(
            "id", "customer_id", "attachment_count", "name", "description_html", "link"
        )

        return Response(customer_requests, status=status.HTTP_200_OK)
