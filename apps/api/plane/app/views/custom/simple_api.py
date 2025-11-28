from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.utils import timezone
from datetime import datetime
from plane.db.models import *
from plane.utils.data_model import IssueTypeModel


def init_issue_type() -> list[IssueTypeModel]:
    bug = IssueTypeModel(
        **{'icon': {"icon": {"name": "Bug", "color": "#8e0119", "background_color": "#FFFFFF"}, "in_use": "icon"},
           'display': '缺陷'})
    task = IssueTypeModel(**{'icon': {"icon": {"name": "Layers", "color": "#6796ff", "background_color": "#FFFFFF"},
                                      "in_use": "icon"}, 'display': '任务', 'is_default': True})
    epic = IssueTypeModel(**{'icon': {"icon": {"name": "Mountain", "color": "#ff877b", "background_color": "#FFFFFF"},
                                      "in_use": "icon"}, 'display': '史诗'})
    feature = IssueTypeModel(**{'icon': {"icon": {"name": "Cog", "color": "#9191f9", "background_color": "#FFFFFF"},
                                         "in_use": "icon"}, 'display': '特性'})
    story = IssueTypeModel(**{'icon': {"icon": {"name": "NotebookPen", "color": "#00A1EC", "background_color": "#FFFFFF"},
                                       "in_use": "icon"}, 'display': '用户故事'})

    return [bug, task, epic, feature, story]


def temporary_create_issue_type(project: Project = None, project_id: str = None):
    if project_id:
        project = Project.objects.get(id=project_id)
    if ProjectIssueType.objects.filter(project=project).exists():
        return

    types = init_issue_type()
    for issue_type in types:
        obj = IssueType.objects.create(name=issue_type.display, workspace=project.workspace,
                                       description=issue_type.display, is_default=issue_type.is_default,
                                       logo_props=issue_type.icon)

        ProjectIssueType.objects.create(project=project, issue_type=obj, workspace=project.workspace)
        if obj.name == '缺陷':
            property_logo_props = {"icon": {"name": "AlignLeft", "color": "#6d7b8a"}, "in_use": "icon"}
            IssueTypeProperty.objects.create(issue_type=obj, project=project, workspace=project.workspace,
                                             display_name='修复版本', is_multi=False, logo_props=property_logo_props,
                                             settings={"display_format": "single-line"})


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
