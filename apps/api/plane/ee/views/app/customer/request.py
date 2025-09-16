# Python imports
import re
import json

# Django imports
from django.utils import timezone
from django.db.models import OuterRef, Func, F, CharField, Subquery, Q, Value, UUIDField
from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models.functions import Cast, Coalesce
from django.contrib.postgres.fields import ArrayField

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.models import CustomerRequest, Customer, CustomerRequestIssue
from plane.db.models import Workspace, Issue, FileAsset
from plane.ee.serializers import CustomerRequestSerializer
from plane.app.permissions import WorkSpaceAdminPermission
from plane.utils.issue_filters import issue_filters
from plane.bgtasks.issue_activities_task import issue_activity


class CustomerRequestEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def get(self, request, slug, customer_id, pk=None):
        customer_requests = (
            CustomerRequest.objects.filter(
                customer_id=customer_id, workspace__slug=slug
            )
            .annotate(
                work_item_ids=Coalesce(
                    Subquery(
                        Issue.objects.filter(
                            workspace__slug=slug,
                            customer_request_issues__deleted_at__isnull=True,
                            customer_request_issues__customer_id=customer_id,
                            customer_request_issues__customer_request_id=OuterRef("pk"),
                            archived_at__isnull=True,
                        )
                        .exclude(
                            Q(type__is_epic=True)
                            & Q(project__project_projectfeature__is_epic_enabled=False)
                        )
                        .values("customer_request_issues__customer_id")
                        .annotate(arr=ArrayAgg("id", distinct=True))
                        .values("arr")
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                )
            )
            .annotate(
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
        )

        if pk:
            customer_requests = customer_requests.get(pk=pk)

            serializer = CustomerRequestSerializer(customer_requests)

            return Response(serializer.data, status=status.HTTP_200_OK)

        # Add search functionality
        search = request.query_params.get("query", False)

        if search:
            customer_requests = customer_requests.filter(name__icontains=search)

        serializer = CustomerRequestSerializer(customer_requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def post(self, request, slug, customer_id):
        workspace = Workspace.objects.get(slug=slug)

        customer = Customer.objects.get(pk=customer_id)

        if customer:
            serializer = CustomerRequestSerializer(data=request.data)

            if serializer.is_valid():
                customer_request_issue = serializer.save(
                    workspace_id=workspace.id, customer_id=customer.id
                )

                issues = Issue.objects.filter(
                    customer_request_issues__customer_request_id=customer_request_issue.id
                ).values(
                    "id",
                    "name",
                    "state_id",
                    "sort_order",
                    "priority",
                    "sequence_id",
                    "project_id",
                    "created_at",
                    "updated_at",
                    "created_by",
                    "updated_by",
                    "labels",
                    "type_id",
                    "assignees",
                    is_epic=F("type__is_epic"),
                )

                response_data = {**serializer.data, "issues": issues}

                return Response(response_data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"error": "Customer doesn't exist"}, status=status.HTTP_400_BAD_REQUEST
        )

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def patch(self, request, slug, pk, customer_id=None):
        customer_request = CustomerRequest.objects.get(pk=pk, workspace__slug=slug)

        serializer = CustomerRequestSerializer(
            customer_request, data=request.data, partial=True
        )

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(data=serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def delete(self, request, slug, pk, customer_id=None):
        customer_request = CustomerRequest.objects.get(pk=pk, workspace__slug=slug)

        customer_request.delete()

        customer_request_issues = CustomerRequestIssue.objects.filter(
            customer_request=pk
        ).prefetch_related("customer", "customer_request")

        for customer_request_issue in customer_request_issues:
            issue_activity.delay(
                type="customer.activity.deleted",
                requested_data=json.dumps(
                    {
                        "customer_id": str(customer_request_issue.customer_id),
                        "name": customer_request_issue.customer_request.name,
                        "customer_request_id": str(pk),
                    }
                ),
                actor_id=str(request.user.id),
                issue_id=str(customer_request_issue.issue_id),
                project_id=customer_request_issue.issue.project_id,
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                subscriber=True,
            )

            # Delete the linked issues
            customer_request_issue.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class CustomerIssuesEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def get(self, request, slug, customer_id):
        customer_request_id = request.query_params.get("customer_request_id")
        search = request.query_params.get("search")

        issues = (
            Issue.objects.filter(
                workspace__slug=slug,
                customer_request_issues__deleted_at__isnull=True,
                customer_request_issues__customer_id=customer_id,
                archived_at__isnull=True,
            )
            .exclude(
                Q(type__is_epic=True)
                & Q(project__project_projectfeature__is_epic_enabled=False)
            )
            .annotate(assignee_ids=ArrayAgg("assignees__id", distinct=True))
        )

        # list issues of the given customer request
        if customer_request_id:
            issues = issues.filter(
                customer_request_issues__customer_request_id=customer_request_id
            )

        # Filtering linked work items based on various fields
        filters = issue_filters(request.query_params, "GET")
        issues = issues.filter(**filters)

        # Add search functionality
        if search:
            fields = ["name", "sequence_id", "project__identifier"]
            q = Q()
            for field in fields:
                if field == "sequence_id":
                    sequences = re.findall(r"\b\d+\b", search)
                    for sequence_id in sequences:
                        q |= Q(**{"sequence_id": sequence_id})
                else:
                    q |= Q(**{f"{field}__icontains": search})

            issues = issues.filter(q)

        issues = issues.distinct().values(
            "id",
            "name",
            "state_id",
            "sort_order",
            "priority",
            "project_id",
            "labels",
            "assignee_ids",
            "type_id",
            "sequence_id",
            is_epic=F("type__is_epic"),
        )

        return Response(issues, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def post(self, request, slug, customer_id):
        workspace = Workspace.objects.get(slug=slug)

        customer_request_id = request.query_params.get("customer_request_id", None)

        issue_ids = request.data.get("issue_ids", [])

        customer_request_issues = []
        for issue_id in issue_ids:
            customer_request_issues.append(
                CustomerRequestIssue(
                    customer_request_id=customer_request_id,
                    customer_id=customer_id,
                    workspace_id=workspace.id,
                    issue_id=issue_id,
                )
            )

        # Bulk create the new issues
        issues = CustomerRequestIssue.objects.bulk_create(
            customer_request_issues, batch_size=10, ignore_conflicts=True
        )

        if customer_request_id is not None:
            name = CustomerRequest.objects.get(pk=customer_request_id).name

            requested_data = json.dumps(
                {
                    "customer_id": str(customer_id),
                    "name": name,
                    "customer_request_id": str(customer_request_id),
                }
            )
        else:
            name = Customer.objects.get(pk=customer_id).name

            requested_data = json.dumps(
                {
                    "customer_id": str(customer_id),
                    "name": name,
                    "customer_request_id": None,
                }
            )

        # Track the issue
        for issue in issues:
            issue_activity.delay(
                type="customer.activity.created",
                requested_data=requested_data,
                actor_id=str(request.user.id),
                issue_id=str(issue.issue_id),
                project_id=str(issue.issue.project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                subscriber=True,
            )

        # Listing only inserted issue ids
        created_issue_ids = [issue.issue_id for issue in issues]

        issues = Issue.objects.filter(id__in=created_issue_ids).values(
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
            is_epic=F("type__is_epic"),
        )

        return Response(issues, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def delete(self, request, slug, customer_id, work_item_id):
        customer_request_id = request.query_params.get("customer_request_id", None)

        filters = {
            "customer_id": customer_id,
            "issue_id": work_item_id,
            "workspace__slug": slug,
        }

        if customer_request_id:
            filters["customer_request_id"] = customer_request_id

        customer_request_issues = CustomerRequestIssue.objects.filter(
            **filters
        ).prefetch_related("customer_request", "customer")

        customer_request_issue = customer_request_issues.first()

        if customer_request_issue is None:
            return Response(
                {"error": "Customer request issue not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if customer_request_id:
            name = customer_request_issue.customer_request.name
            requested_data = json.dumps(
                {
                    "customer_id": str(customer_id),
                    "name": name,
                    "customer_request_id": str(customer_request_id),
                }
            )
        else:
            name = customer_request_issue.customer.name
            requested_data = json.dumps(
                {
                    "customer_id": str(customer_id),
                    "name": name,
                    "customer_request_id": None,
                }
            )

        for customer_request_issue in customer_request_issues:
            issue_activity.delay(
                type="customer.activity.deleted",
                requested_data=requested_data,
                actor_id=str(request.user.id),
                issue_id=str(work_item_id),
                project_id=customer_request_issue.issue.project_id,
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                subscriber=True,
            )

            customer_request_issue.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
