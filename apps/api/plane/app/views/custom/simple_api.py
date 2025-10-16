from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.utils import timezone
from datetime import datetime
from plane.db.models import *


def temporary_create_issue_type(project: Project = None, project_id: str = None):
    if project_id:
        project = Project.objects.get(id=project_id)
    if ProjectIssueType.objects.filter(project=project).exists():
        return

    task_logo_props = {"icon": {"name": "Layers", "color": "#6796ff", "background_color": "#FFFFFF"},
                       "in_use": "icon"}
    requirement_logo_props = {"icon": {"name": "NotebookPen", "color": "#028375", "background_color": "#FFFFFF"},
                              "in_use": "icon"}
    bug_logo_props = {"icon": {"name": "Bug", "color": "#8e0119", "background_color": "#FFFFFF"}, "in_use": "icon"}
    property_logo_props = {"icon": {"name": "AlignLeft", "color": "#6d7b8a"}, "in_use": "icon"}

    task_type = IssueType.objects.create(name="Task", workspace=project.workspace, description='任务',is_default=True,
                                         logo_props=task_logo_props, )
    requirement_type = IssueType.objects.create(name="Requirement", workspace=project.workspace,
                                                description='需求', logo_props=requirement_logo_props, )
    bug_type = IssueType.objects.create(name="Bug", workspace=project.workspace, description='缺陷',
                                        logo_props=bug_logo_props)

    ProjectIssueType.objects.create(project=project, issue_type=task_type, workspace=project.workspace)
    ProjectIssueType.objects.create(project=project, issue_type=requirement_type, workspace=project.workspace)
    ProjectIssueType.objects.create(project=project, issue_type=bug_type, workspace=project.workspace)

    IssueTypeProperty.objects.create(issue_type=bug_type, project=project, workspace=project.workspace,
                                     display_name='解决方案', is_multi=True, logo_props=property_logo_props,
                                     settings={"display_format": "multi-line"})


class SimpleTestAPIView(APIView):
    """
    简单的测试API接口
    不需要认证，支持GET和POST请求
    """

    # 不需要认证
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        """
        GET请求 - 返回当前时间和简单信息
        """

        projects = Project.objects.all()
        for project in projects:
            temporary_create_issue_type(project)

        return Response('1', status=status.HTTP_200_OK)

    def post(self, request):
        """
        POST请求 - 接收数据并返回处理结果
        """
        received_data = request.data

        response_data = {
            "message": "数据接收成功",
            "timestamp": timezone.now().isoformat(),
            "method": "POST",
            "status": "success",
            "received_data": received_data,
            "processed_info": {
                "data_type": type(received_data).__name__,
                "data_size": len(str(received_data)),
                "processing_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
        }

        return Response(response_data, status=status.HTTP_201_CREATED)


class HealthCheckAPIView(APIView):
    """
    健康检查API接口
    """

    # 不需要认证
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        """
        健康检查接口
        """
        data = {
            "status": "healthy",
            "timestamp": timezone.now().isoformat(),
            "service": "Plane API",
            "version": "1.0.0",
            "uptime": "运行正常"
        }
        return Response(data, status=status.HTTP_200_OK)
