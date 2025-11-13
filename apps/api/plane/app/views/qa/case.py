from rest_framework.response import Response

from plane.app.serializers.qa import CaseAttachmentSerializer
from plane.app.views import BaseAPIView
from plane.db.models import TestCase,FileAsset


class CaseAssetAPIView(BaseAPIView):
    model = FileAsset
    queryset = FileAsset.objects.all()
    serializer_class = CaseAttachmentSerializer


    def get(self,request,slug,case_id:str):
        case = self.queryset.filter(case_id=case_id,is_uploaded=True)
        serializer = self.serializer_class(instance=case, many=True)
        return Response(data=serializer.data)
