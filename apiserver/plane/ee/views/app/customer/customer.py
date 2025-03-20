# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.models import Customer, CustomerRequest
from plane.db.models import Workspace
from plane.ee.serializers import CustomerSerializer
from plane.app.permissions import WorkSpaceAdminPermission
from plane.utils.global_paginator import paginate

# Django imports
from django.db.models import (OuterRef,  Func, F)

## imports
from plane.ee.utils.workspace_feature import WorkspaceFeatureContext, check_workspace_feature


class CustomerEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def get(self, request, slug, pk=None):
        cursor = request.GET.get("cursor", None)
        
        customers = (Customer.objects.filter(workspace__slug=slug).annotate(
                customer_request_count=
                    CustomerRequest.objects.filter(
                        customer_id=OuterRef("id"), 
                    )
                .order_by()
                .annotate(count=Func(F("id"), function="count"))
                .values("count")
                ))
        
        if pk:
            customer = customers.get(pk=pk)
            serializer = CustomerSerializer(customer)

            return Response(serializer.data, status=status.HTTP_200_OK)

        # Add search functionality
        search = request.query_params.get("query", False)

        if search:
            customers = customers.filter(name__icontains=search)

        paginated_data = paginate(
            base_queryset=customers,
            queryset=customers,
            cursor=cursor,
            on_result=lambda customers: CustomerSerializer(customers, many=True).data 
        )
    
        return Response(paginated_data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def post(self, request, slug):
        if check_workspace_feature(slug, WorkspaceFeatureContext.IS_CUSTOMER_ENABLED):
            workspace = Workspace.objects.get(slug=slug)
            
            customer = Customer.objects.filter(workspace_id=workspace.id, name=request.data["name"])

            if customer:
                return Response({"error": "Customer already exist for this workspace"}, status=status.HTTP_400_BAD_REQUEST)

            serializer = CustomerSerializer(data=request.data)

            serializer.is_valid(raise_exception=True)

            serializer.save(workspace_id=workspace.id)

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response({"error": "Customer feature is not enabled for this workspace"}, status=status.HTTP_403_FORBIDDEN)

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def patch(self, request, slug, pk):
        customer = Customer.objects.get(pk=pk, workspace__slug=slug)

        serializer = CustomerSerializer(customer, data=request.data, partial=True)

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def delete(self, request, slug, pk):
        customer = Customer.objects.get(pk=pk, workspace__slug=slug)

        customer.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
