from django.core.files.uploadedfile import InMemoryUploadedFile
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.utils import IntegrityError
from django.core.exceptions import ValidationError

from plane.app.serializers.qa import CaseAttachmentSerializer, IssueListSerializer, CaseIssueSerializer, \
    TestCaseCommentSerializer, PlanCaseRecordSerializer, CaseListSerializer, CaseLabelListSerializer
from plane.app.serializers.qa.case import CaseExecuteRecordSerializer
from plane.app.views import BaseAPIView, BaseViewSet
from plane.utils.import_export import parser_case_file
from plane.db.models import TestCase, FileAsset, TestCaseComment, PlanCase, Issue, CaseModule, CaseLabel
from plane.utils.paginator import CustomPaginator
from plane.utils.response import list_response


class CaseAssetAPIView(BaseAPIView):
    model = FileAsset
    queryset = FileAsset.objects.all()
    serializer_class = CaseAttachmentSerializer

    def get(self, request, slug, case_id: str):
        case = self.queryset.filter(case_id=case_id, is_uploaded=True)
        serializer = self.serializer_class(instance=case, many=True)
        return Response(data=serializer.data)


class CaseIssueWithType(BaseAPIView):
    model = TestCase
    queryset = TestCase.objects.all()
    filterset_fields = {
        'issues__type__name': ['exact', 'icontains', 'in'],
        'id': ['exact'],
    }
    serializer_class = CaseIssueSerializer

    def get(self, request, slug):
        cases = self.filter_queryset(self.queryset).distinct()
        serializer = self.serializer_class(instance=cases, many=True)
        return Response(data=serializer.data)


class CaseLabelAPIView(BaseAPIView):
    model = CaseLabel
    queryset = CaseLabel.objects.all()
    serializer_class = CaseLabelListSerializer
    filterset_fields = {
        'name': ['exact', 'icontains'],
        'repository_id': ['exact'],
        'id': ['exact']
    }

    def get(self, request, slug):
        serializer = self.serializer_class(instance=self.filter_queryset(self.queryset), many=True)
        return Response(data=serializer.data)

    def post(self, request, slug):
        name = request.data['name']
        case_id = request.data['case_id']

        case = TestCase.objects.get(id=case_id)
        label, _ = CaseLabel.objects.get_or_create(name=name, repository=case.repository)
        case.labels.add(label)
        case.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, slug):
        self.filter_queryset(self.queryset).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TestCaseCommentAPIView(BaseAPIView):
    model = TestCaseComment
    queryset = TestCaseComment.objects.all()
    serializer_class = TestCaseCommentSerializer
    pagination_class = CustomPaginator
    filterset_fields = {
        'case_id': ['exact'],
    }

    def get(self, request, slug):
        case_id = request.GET.get('case_id')
        max_depth = min(int(request.GET.get('max_depth', 5)), 5)
        if not case_id:
            return Response({"error": "case_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        roots = self.queryset.filter(case_id=case_id, parent__isnull=True).order_by('created_at')
        paginator = self.pagination_class()
        paginated_queryset = paginator.paginate_queryset(roots, request)
        serializer = TestCaseCommentSerializer(paginated_queryset, many=True,
                                               context={"current_depth": 1, "max_depth": max_depth})
        return list_response(data=serializer.data, count=roots.count())

    @transaction.atomic
    def post(self, request, slug):
        parent_id = request.data.get('parent')
        case_id = request.data.get('case') or request.data.get('case_id')
        content = request.data.get('content')
        if not case_id or not content:
            return Response({"error": "content and case are required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            case = TestCase.objects.get(id=case_id)
        except TestCase.DoesNotExist:
            return Response({"error": "TestCase not found"}, status=status.HTTP_404_NOT_FOUND)
        parent = None
        if parent_id:
            parent = self.queryset.filter(id=parent_id, case_id=case_id).first()
        comment = self.queryset.create(content=content, creator=request.user, case=case, parent=parent)
        serializer = self.serializer_class(comment, context={"current_depth": 1})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @transaction.atomic
    def put(self, request, slug, id):
        comment = self.queryset.filter(id=id, creator=request.user).first()
        if not comment:
            return Response({"error": "Comment not found or no permission"}, status=status.HTTP_404_NOT_FOUND)
        content = request.data.get('content')
        if content is None or str(content).strip() == "":
            return Response({"error": "content is required"}, status=status.HTTP_400_BAD_REQUEST)
        comment.content = content
        comment.save()
        serializer = self.serializer_class(comment, context={"current_depth": 1})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @transaction.atomic
    def delete(self, request, slug, id):
        comment = self.queryset.filter(id=id, creator=request.user).first()
        if not comment:
            return Response({"error": "Comment not found or no permission"}, status=status.HTTP_404_NOT_FOUND)

        def delete_subtree(node_id):
            children = TestCaseComment.objects.filter(parent_id=node_id)
            for c in children:
                delete_subtree(c.id)
            TestCaseComment.objects.filter(id=node_id).delete(soft=False)

        delete_subtree(comment.id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CaseAPI(BaseViewSet):
    pagination_class = CustomPaginator

    @action(detail=False, methods=['get'], url_path='execute-record')
    def execute_record(self, request, slug):
        case_id = request.query_params.get('case_id')
        result = []

        plan_cases = PlanCase.objects.filter(case_id=case_id)
        for plan_case in plan_cases:
            record = plan_case.plan_case_records.first()
            if not record:
                continue
            serializer = CaseExecuteRecordSerializer(record)
            result.append(serializer.data)
        return list_response(data=result, count=len(result))

    @action(detail=False, methods=['get'], url_path='issues-list')
    def issue_list(self, request, slug):
        type_name = request.query_params.get('type_name').split(',')
        case_id = request.query_params.get('case_id')

        issues = TestCase.objects.get(id=case_id).issues.filter(type__name__in=type_name)
        paginator = self.pagination_class()
        paginated_queryset = paginator.paginate_queryset(issues, request)
        serializer = IssueListSerializer(paginated_queryset, many=True)
        return list_response(data=serializer.data, count=issues.count())

    @action(detail=False, methods=['get'], url_path='issue-case')
    def get_issue_case(self, request, slug):
        issue_id = request.query_params.get('issue_id')
        issue = Issue.objects.get(id=issue_id)
        cases = issue.cases.all()
        serializer = CaseListSerializer(cases, many=True)
        return Response(data=serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='unselect-issue-case')
    def get_unselect_issue_case(self, request, slug):
        issue_id = request.query_params.get('issue_id')
        repository_id = request.query_params.get('repository_id')
        module_id = request.query_params.get('module_id')

        issue = Issue.objects.get(id=issue_id)
        case_id = issue.cases.values_list('id', flat=True)
        cases = TestCase.objects.filter(repository__workspace__slug=slug, repository_id=repository_id)
        if module_id:
            case_module = CaseModule.objects.get(id=module_id)
            cases = cases.filter(module_id__in=case_module.get_all_children)
        cases = cases.exclude(id__in=case_id)
        serializer = CaseListSerializer(cases, many=True)
        return Response(data=serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['delete'], url_path='delete-issue-case')
    def delete_issue_case(self, request, slug):
        issue_id = request.data.get('issue_id')
        case_id = request.data.get('case_id')

        if not issue_id or not case_id:
            return Response({"error": "issue_id and case_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        issue = get_object_or_404(Issue, id=issue_id)
        case = get_object_or_404(TestCase, id=case_id)
        issue.cases.remove(case)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['delete'], url_path='add-issue-case')
    def add_issue_case(self, request, slug):
        issue_id = request.data.get('issue_id')
        case_id = request.data.get('case_id')

        if not issue_id or not case_id:
            return Response({"error": "issue_id and case_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        issue = get_object_or_404(Issue, id=issue_id)
        case = get_object_or_404(TestCase, id=case_id)
        issue.cases.add(case)
        return Response(status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='import-case')
    def import_case(self, request, slug):
        repository_id = request.data['repository_id']
        files: list[InMemoryUploadedFile] = request.FILES.getlist('file')
        try:
            case_data = parser_case_file(files)
        except Exception as e:
            return Response({'error': f'用例导入失败:{str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        total_count = len(case_data)
        success_count = 0
        fail_list = []
        for data in case_data:
            try:
                instance = TestCase.objects.create(
                    name=data['name'],
                    priority=TestCase.Priority[data['priority']].value,
                    remark=data['remark'],
                    precondition=data['precondition'],
                    steps=data['steps'],
                    repository_id=repository_id,
                )

                # 创建模块
                case_module, _ = CaseModule.objects.get_or_create(repository_id=repository_id, name=data['module'])
                instance.module = case_module
                # 创建标签
                for label in data['label']:
                    label_instance, _ = CaseLabel.objects.get_or_create(repository_id=repository_id, name=label)
                    instance.labels.add(label_instance)
                instance.save()
            except IntegrityError as e:
                fail_list.append(dict(name=data['name'], error='case name already exists'))
                continue
            except Exception as e:
                fail_list.append(dict(name=data['name'], error=str(e).replace('\n', '')))
                continue
            success_count += 1

        return Response(data={'total_count': total_count, 'success_count': success_count, 'fail': fail_list},
                        status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='update-module')
    def update_module(self, request, slug):
        cases_id = request.data.get('cases_id')
        module_id = request.data.get('module_id')

        TestCase.objects.filter(pk__in=cases_id).update(module_id=module_id)
        return Response(status=status.HTTP_200_OK)
