# Django imports
from django.db import transaction
from django.shortcuts import get_object_or_404

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views import BaseAPIView
from plane.app.permissions import ProjectMemberPermission, ProjectEntityPermission
from plane.app.serializers.issue_type import (
    IssueTypeSerializer,
    ProjectIssueTypeSerializer, 
    IssueTypePropertySerializer,
    IssuePropertyValueSerializer,
    IssuePropertyValueBulkSerializer,
)
from plane.db.models import (
    IssueType, 
    ProjectIssueType, 
    IssueTypeProperty, 
    IssuePropertyValue,
    Issue,
    Workspace
)


class ProjectIssueTypeListCreateAPIEndpoint(BaseAPIView):
    """项目Issue Type列表和创建接口"""
    
    serializer_class = IssueTypeSerializer
    model = IssueType
    permission_classes = [ProjectMemberPermission]

    def get_queryset(self):
        return IssueType.objects.filter(
            workspace__slug=self.kwargs.get("slug"),
            project_issue_types__project_id=self.kwargs.get("project_id"),
            project_issue_types__deleted_at__isnull=True,
        ).distinct()

    def get(self, request, slug, project_id):
        """获取项目的Issue Type列表"""
        issue_types = self.get_queryset()
        serializer = IssueTypeSerializer(issue_types, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug, project_id):
        """创建新的Issue Type并关联到项目"""
        serializer = IssueTypeSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                # 创建IssueType
                issue_type = serializer.save(
                    workspace_id=Workspace.objects.get(slug=slug).id
                )


                # 创建ProjectIssueType关联
                ProjectIssueType.objects.create(
                    project_id=project_id,
                    issue_type=issue_type,
                    level=request.data.get("level", 0),
                    is_default=request.data.get("is_default", False),
                )
                
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IssueTypePropertyListCreateAPIEndpoint(BaseAPIView):
    """Issue Type属性配置接口"""
    
    serializer_class = IssueTypePropertySerializer
    model = IssueTypeProperty
    permission_classes = [ProjectMemberPermission]

    def get_queryset(self):
        return IssueTypeProperty.objects.filter(
            project_id=self.kwargs.get("project_id"),
            issue_type_id=self.kwargs.get("issue_type_id"),
            deleted_at__isnull=True,
        ).order_by("sort_order", "created_at")

    def get(self, request, slug, project_id, issue_type_id):
        """获取Issue Type的属性列表"""
        properties = self.get_queryset()
        serializer = IssueTypePropertySerializer(properties, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug, project_id, issue_type_id):
        """为Issue Type创建新属性"""
        # 验证issue_type是否属于该项目
        issue_type = get_object_or_404(
            IssueType,
            id=issue_type_id,
            project_issue_types__project_id=project_id,
            project_issue_types__deleted_at__isnull=True,
        )
        request.data['issue_type'] = issue_type.id
        
        serializer = IssueTypePropertySerializer(data=request.data)
        if serializer.is_valid():
            property_obj = serializer.save(
                project_id=project_id,
                issue_type=issue_type,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IssuePropertyValueAPIEndpoint(BaseAPIView):
    """Issue属性值存储接口"""
    
    serializer_class = IssuePropertyValueBulkSerializer
    permission_classes = [ProjectEntityPermission]

    def get(self, request, slug, project_id, issue_id):
        """获取Issue的所有属性值"""
        property_values = IssuePropertyValue.objects.filter(
            issue_id=issue_id,
            project_id=project_id,
            deleted_at__isnull=True,
        ).select_related("property")
        
        serializer = IssuePropertyValueSerializer(property_values, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug, project_id, issue_id):
        """批量设置Issue的属性值"""
        # 验证issue是否存在
        issue = get_object_or_404(
            Issue,
            id=issue_id
        )
        
        serializer = IssuePropertyValueBulkSerializer(data=request.data)
        if serializer.is_valid():
            property_values_data = serializer.validated_data["property_values"]
            
            with transaction.atomic():
                created_values = []
                
                for property_id, values in property_values_data.items():
                    # 验证property是否存在且属于该项目
                    property_obj = get_object_or_404(
                        IssueTypeProperty,
                        id=property_id,
                        project_id=project_id,
                        deleted_at__isnull=True,
                    )
                    
                    # 删除或更新现有值
                    existing_value = IssuePropertyValue.objects.filter(
                        issue=issue,
                        property=property_obj,
                        deleted_at__isnull=True,
                    ).first()
                    
                    if existing_value:
                        existing_value.value = values
                        existing_value.save()
                        created_values.append(existing_value)
                    else:
                        # 创建新值
                        new_value = IssuePropertyValue.objects.create(
                            issue=issue,
                            property=property_obj,
                            value=values,
                            project_id=project_id,
                        )
                        created_values.append(new_value)
                
                # 返回创建/更新的值
                result_serializer = IssuePropertyValueSerializer(created_values, many=True)
                return Response(result_serializer.data, status=status.HTTP_201_CREATED)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)