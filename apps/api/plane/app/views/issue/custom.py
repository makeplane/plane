import random

from django.core.files.uploadedfile import InMemoryUploadedFile
from django.db import IntegrityError
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from plane.app.views import BaseViewSet
from plane.db.models import Issue, Workspace, IssueType, ProjectIssueType, Label, IssueLabel
from plane.utils.import_export import parser_excel_issue, parser_issue_file


class IssueAPI(BaseViewSet):

    @action(detail=False, methods=['post'], url_path='issue-import')
    def issue_import(self, request, slug, project_id):
        # 获取数据
        files: list[InMemoryUploadedFile] = request.FILES.getlist('file')
        try:
            issue_data = parser_issue_file(files)
        except Exception as e:
            return Response({'error': f'需求导入失败:{str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        epic_dic = dict()
        feature_dic = dict()
        label_dic = dict()
        workspace = Workspace.objects.get(slug=slug)
        epic_type = ProjectIssueType.objects.get(project_id=project_id, issue_type__name='史诗').issue_type
        feature_type = ProjectIssueType.objects.get(project_id=project_id, issue_type__name='特性').issue_type
        story_type = ProjectIssueType.objects.get(project_id=project_id, issue_type__name='用户故事').issue_type
        total_count = len(issue_data)
        success_count = 0
        fail_list = []
        for data in issue_data:
            try:
                # 先创建史诗工作项
                epic = epic_dic.get('Module') or \
                       Issue.objects.get_or_create(workspace=workspace, project_id=project_id, name=data['Module'],
                                                   type=epic_type)[0]
                epic_dic[epic.name] = epic
                # 创建特性工作项
                feature = Issue.objects.get_or_create(workspace=workspace, project_id=project_id, name=data['Sub'],
                                                      type=feature_type)[0]
                feature_dic[feature.name] = feature
                if feature.parent != epic:
                    feature.parent = epic
                    feature.save()
                feature_dic[feature.name] = feature

                # 创建用户故事
                story, created = Issue.objects.get_or_create(workspace=workspace, project_id=project_id,
                                                             name=data['name'],
                                                             type=story_type,
                                                             defaults=dict(description_html=data['description_html'],
                                                                           parent=feature))
                if not created:
                    raise IntegrityError()

                # 创建标签
                for label in data['labels']:
                    label_instance = label_dic.get(label) or \
                                     Label.objects.get_or_create(workspace=workspace, project_id=project_id,
                                                                 name=label, defaults=dict(
                                             color="#{:06x}".format(random.randint(0, 0xFFFFFF))))[0]
                    IssueLabel.objects.create(issue=story, label=label_instance, project_id=project_id,
                                              workspace=workspace)
            except IntegrityError as e:
                fail_list.append(dict(name=data['name'], error='case name already exists'))
                continue
            except Exception as e:
                fail_list.append(dict(name=data['name'], error=str(e).replace('\n', '')))
                continue
            success_count += 1

        return Response(data={'total_count': total_count, 'success_count': success_count, 'fail': fail_list},
                        status=status.HTTP_200_OK)
