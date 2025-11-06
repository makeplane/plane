from django.db.models import Count
from rest_framework.response import Response

from plane.app.views import BaseAPIView
from plane.db.models import CaseModule, TestCase


class CaseModuleCountAPIView(BaseAPIView):
    model = CaseModule
    queryset = CaseModule.objects.all()
    filterset_fields = {
        'name': ['exact', 'icontains', 'in'],
        'repository_id': ['exact']
    }

    def get(self, request, slug):
        modules = self.filter_queryset(self.queryset).annotate(case_count=Count('cases')).values('id', 'case_count')
        result = dict(total=TestCase.objects.filter(repository_id=request.query_params['repository_id']).count())
        for module in modules:
            result[str(module['id'])] = module['case_count']

        return Response(data=result)
