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

# Django imports
from django.db.models import (OuterRef,  Func, F, CharField, Subquery, Q)
from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models.functions import Cast

class CustomerRequestEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def get(self, request, slug, customer_id, pk=None):
        customer_requests = CustomerRequest.objects.filter(customer_id=customer_id, workspace__slug=slug).annotate( 
            issue_ids=ArrayAgg(
                "customer_request_issues__issue_id", 
                filter=(
                    Q(customer_request_issues__deleted_at__isnull=True) &
                    (Q(customer_request_issues__issue__type_id__isnull=True) |
                    Q(customer_request_issues__issue__project__project_projectfeature__is_epic_enabled=True))
                ),
                distinct=True) 
            ).annotate(attachment_count=Subquery(
                FileAsset.objects.filter(
                    entity_identifier=Cast(OuterRef("id"), output_field=CharField()),
                    entity_type=FileAsset.EntityTypeContext.CUSTOMER_REQUEST_ATTACHMENT,        
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            ))

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
                customer_request_issue = serializer.save(workspace_id=workspace.id, customer_id=customer.id)

                issues = Issue.objects.filter(customer_request_issues__customer_request_id=customer_request_issue.id).values(
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
                    is_epic=F("type__is_epic"))

                response_data = {
                    **serializer.data, 
                    "issues": issues
                }                

                return Response(response_data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"error": "Customer doesn't exist"}, status=status.HTTP_400_BAD_REQUEST
        )
 
    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def patch(self, request, slug, pk, customer_id=None):
        customer_request = CustomerRequest.objects.get(pk=pk, workspace__slug=slug)
        
        serializer = CustomerRequestSerializer(customer_request, data=request.data, partial=True)    
    
        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(data=serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def delete(self, request, slug, pk, customer_id=None):
        customer_request = CustomerRequest.objects.get(pk=pk, workspace__slug=slug)

        customer_request.delete()

        # Delete the linked issues
        CustomerRequestIssue.objects.filter(customer_request=pk).delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

class CustomerIssuesEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def get(self, request, slug, customer_id):
        customer_request_id = request.query_params.get("customer_request_id")

        issues = (Issue.objects.filter(
            workspace__slug=slug, 
            customer_request_issues__deleted_at__isnull=True,
            customer_request_issues__customer_id=customer_id    
        ).annotate(
            assignee_ids=ArrayAgg("assignees__id", distinct=True)
        ))

        if customer_request_id:
            issues = issues.filter(customer_request_issues__customer_request_id=customer_request_id)
            
        issues = issues.distinct().values(
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
            "assignee_ids",
            "type_id",
            is_epic=F("type__is_epic"),
            customer_request_id=F("customer_request_issues__customer_request_id")
        )
    
        return Response(issues, status=status.HTTP_200_OK)
    
    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def post(self, request, slug, customer_id):
        workspace = Workspace.objects.get(slug=slug)

        customer_request_id = request.query_params.get("customer_request_id", None)
        
        issue_ids = request.data.get("issue_ids", [])

        # Filtering already existing issues for the customer 
        existing_issues = CustomerRequestIssue.objects.filter(
            customer_id=customer_id,
            issue_id__in=issue_ids,
            workspace__slug=slug
        ).annotate(
            issue_id_str=Cast("issue_id", output_field=CharField())
        ).values_list(
            "issue_id_str", flat=True
        )

        # Eleminating existing issues ids
        new_issue_ids = [issue_id for issue_id in issue_ids if str(issue_id) not in existing_issues]

        customer_request_issues = []
        for issue_id in new_issue_ids:
            customer_request_issues.append(
                CustomerRequestIssue(
                    customer_request_id=customer_request_id,
                    customer_id=customer_id,
                    workspace_id = workspace.id,
                    issue_id= issue_id,
                )
            )

        # Bulk create the new issues
        issues = CustomerRequestIssue.objects.bulk_create(customer_request_issues, batch_size=10, ignore_conflicts=True)

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
                is_epic=F("type__is_epic")
            )

        return Response(issues, status=status.HTTP_201_CREATED)
        
    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def delete(self, request, slug, customer_id, issue_id):
        customer_request_id = request.query_params.get("customer_request_id")
        
        customer_request_issue = CustomerRequestIssue.objects.filter(
            customer_id=customer_id, 
            issue_id=issue_id,
            workspace__slug=slug
            )
        
        if customer_request_id:
            customer_request_issue = customer_request_issue.filter(customer_request_id=customer_request_id)

        customer_request_issue.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

