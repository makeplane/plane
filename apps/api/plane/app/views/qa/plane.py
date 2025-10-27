from rest_framework import status
from rest_framework.response import Response

from plane.app.serializers.qa import TestPlanDetailSerializer, CaseModuleCreateUpdateSerializer, \
    CaseModuleListSerializer, CaseLabelListSerializer, CaseLabelCreateSerializer
from plane.db.models import TestPlan, TestCaseRepository, TestCase, CaseModule, CaseLabel
from plane.utils.paginator import CustomPaginator
from plane.utils.response import list_response
from plane.app.views import BaseAPIView
from plane.app.serializers import TestPlanCreateUpdateSerializer, TestCaseRepositorySerializer, \
    TestCaseRepositoryDetailSerializer


class RepositoryAPIView(BaseAPIView):
    model = TestCaseRepository
    queryset = TestCaseRepository.objects.all()
    serializer_class = TestCaseRepositorySerializer
    filterset_fields = {
        'project_id': ['exact', 'in'],
        'workspace__slug': ['exact', 'icontains', 'in'],
    }
    pagination_class = CustomPaginator

    def post(self, request, slug):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        repository = serializer.save()
        serializer = TestCaseRepositoryDetailSerializer(instance=repository)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request, slug):
        repositories = self.filter_queryset(self.queryset)
        paginator = self.pagination_class()
        paginated_queryset = paginator.paginate_queryset(repositories, request)
        serializer = TestCaseRepositoryDetailSerializer(instance=paginated_queryset, many=True)
        return list_response(data=serializer.data, count=repositories.count())


class PlanAPIView(BaseAPIView):
    model = TestPlan
    queryset = TestPlan.objects.all()
    pagination_class = CustomPaginator
    serializer_class = TestPlanCreateUpdateSerializer
    filterset_fields = {
        'name': ['exact', 'icontains', 'in'],
        'id': ['exact', 'in'],
        'repository_id': ['exact']
    }

    def post(self, request, slug):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        test_plan = serializer.save()
        serializer = TestPlanDetailSerializer(instance=test_plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request, slug):
        planes = self.filter_queryset(self.queryset)
        paginator = self.pagination_class()
        paginated_queryset = paginator.paginate_queryset(planes, request)
        serializer = TestPlanDetailSerializer(instance=paginated_queryset, many=True)
        return list_response(data=serializer.data, count=planes.count())

    def put(self, request, slug):
        plan_id = request.data.pop('id')
        plan = self.queryset.get(id=plan_id)
        update_serializer = self.serializer_class(instance=plan, data=request.data, partial=True)
        update_serializer.is_valid(raise_exception=True)
        updated_plan = update_serializer.save()
        serializer = TestPlanDetailSerializer(instance=plan)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, slug):
        plan_ids = request.data.pop('ids')
        self.queryset.filter(id__in=plan_ids).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CaseAPIView(BaseAPIView):
    model = TestCase
    queryset = TestCase.objects.all()
    pagination_class = CustomPaginator

    def get(self, request, slug):
        ...

    def post(self, request, slug):
        ...


class CaseModuleAPIView(BaseAPIView):
    model = CaseModule
    queryset = CaseModule.objects.all()
    serializer_class = CaseModuleCreateUpdateSerializer

    def get(self, request, slug):
        modules = self.queryset.filter(parent=None)
        serializer = CaseModuleListSerializer(instance=modules, many=True)
        return Response(data=serializer.data)

    def post(self, request, slug):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        test_plan = serializer.save()
        serializer = CaseModuleListSerializer(instance=test_plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class LabelAPIView(BaseAPIView):
    model = CaseLabel
    queryset = CaseLabel.objects.all()
    serializer_class = CaseLabelListSerializer
    filterset_fields = {
        'name': ['exact', 'icontains', 'in'],
        'repository_id': ['exact']
    }

    def get(self, request, slug):
        labels = self.filter_queryset(self.queryset).all()
        serializer = self.serializer_class(instance=labels, many=True)
        return Response(data=serializer.data)

    def post(self, request, slug):
        serializer = CaseLabelCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        test_plan = serializer.save()
        serializer = self.serializer_class(instance=test_plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, slug):
        ids = request.data.pop('ids')
        self.queryset.filter(id__in=ids).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)