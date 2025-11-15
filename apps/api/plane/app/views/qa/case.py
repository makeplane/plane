from rest_framework.response import Response

from plane.app.serializers.qa import CaseAttachmentSerializer, IssueListSerializer, CaseIssueSerializer
from plane.app.views import BaseAPIView
from plane.db.models import TestCase, FileAsset


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

