from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

from plane.app.serializers.qa import CaseAttachmentSerializer, IssueListSerializer, CaseIssueSerializer, TestCaseCommentSerializer
from plane.app.views import BaseAPIView
from plane.db.models import TestCase, FileAsset, TestCaseComment
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
        serializer = TestCaseCommentSerializer(paginated_queryset, many=True, context={"current_depth": 1, "max_depth": max_depth})
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

