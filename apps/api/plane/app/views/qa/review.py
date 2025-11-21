from gunicorn.util import close
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count

from plane.app.serializers.qa import ReviewModuleCreateUpdateSerializer, ReviewModuleDetailSerializer, \
    ReviewModuleListSerializer, ReviewListSerializer, ReviewCreateUpdateSerializer, ReviewCaseListSerializer, \
    ReviewCaseRecordsSerializer
from plane.app.views import BaseAPIView, BaseViewSet
from plane.db.models import CaseReview, CaseReviewModule, CaseReviewThrough, CaseModule, TestCase, CaseReviewRecord
from plane.utils.paginator import CustomPaginator
from plane.utils.qa import update_case_review_status
from plane.utils.response import list_response


class ReviewModuleAPIView(BaseAPIView):
    queryset = CaseReviewModule.objects.all()
    serializer_class = ReviewModuleListSerializer
    filterset_fields = {
        'name': ['exact', 'icontains', 'in'],
        'repository_id': ['exact', 'in'],
    }

    def post(self, request, slug):
        serializer = ReviewModuleCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        test_plan = serializer.save()
        serializer = ReviewModuleDetailSerializer(instance=test_plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request, slug):
        query = self.filter_queryset(self.queryset).order_by('created_at')
        serializer = self.serializer_class(instance=query, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, slug):
        module_ids = request.data.pop('ids')
        self.queryset.filter(id__in=module_ids).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CaseReviewAPIView(BaseAPIView):
    queryset = CaseReview.objects.all()
    pagination_class = CustomPaginator
    serializer_class = ReviewListSerializer
    filterset_fields = {
        'name': ['exact', 'icontains', 'in'],
        'module_id': ['exact', 'in'],
        'state': ['exact', 'in'],
        'mode': ['exact', 'in'],
    }

    def post(self, request, slug):
        serializer = ReviewCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        test_plan = serializer.save()
        serializer = self.serializer_class(instance=test_plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request, slug):
        cases = self.filter_queryset(self.queryset)
        paginator = self.pagination_class()
        paginated_queryset = paginator.paginate_queryset(cases, request)
        serializer = self.serializer_class(instance=paginated_queryset, many=True)
        return list_response(data=serializer.data, count=cases.count())

    def put(self, request, slug):
        review_id = request.data.pop('id')
        review = self.queryset.get(id=review_id)
        update_serializer = ReviewCreateUpdateSerializer(instance=review, data=request.data, partial=True)
        update_serializer.is_valid(raise_exception=True)
        update_serializer.save()
        serializer = self.serializer_class(instance=review)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, slug):
        ids = request.data.pop('ids')
        self.queryset.filter(id__in=ids).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CaseReviewView(BaseViewSet):
    pagination_class = CustomPaginator

    @action(detail=False, methods=['get'], url_path='enums')
    def get_enums(self, request, slug):
        result = dict()
        result['CaseReviewThrough_Result'] = {label: dict(label=label, color=color) for label, color in
                                              CaseReviewThrough.Result.choices}
        result['CaseReview_State'] = {label: dict(label=label, color=color) for label, color in
                                      CaseReview.State.choices}
        result['CaseReview_ReviewMode'] = {label: dict(label=label, color=color) for label, color in
                                           CaseReview.ReviewMode.choices}
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='cancel-case')
    def cancel_case(self, request, slug):
        CaseReviewThrough.objects.filter(id__in=request.data['ids']).delete(
            soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='case-list')
    def case_list(self, request, slug):
        query = CaseReviewThrough.objects.filter(review_id=request.query_params['review_id'])
        if name := request.query_params.get('name__icontains'):
            query = query.filter(case__name__icontains=name)
        module_ids = request.query_params.getlist('module_id') or request.query_params.getlist('module_ids')
        if module_ids:
            expanded = set(module_ids)
            frontier = list(module_ids)
            while frontier:
                children = list(
                    CaseModule.objects.filter(parent_id__in=frontier, deleted_at__isnull=True).values_list('id',
                                                                                                           flat=True))
                new_children = [c for c in children if c not in expanded]
                if not new_children:
                    break
                expanded.update(new_children)
                frontier = new_children
            query = query.filter(case__module_id__in=list(expanded))
        else:
            module_id = request.query_params.get('module_id')
            if module_id:
                expanded = {module_id}
                frontier = [module_id]
                while frontier:
                    children = list(
                        CaseModule.objects.filter(parent_id__in=frontier, deleted_at__isnull=True).values_list('id',
                                                                                                               flat=True))
                    new_children = [c for c in children if c not in expanded]
                    if not new_children:
                        break
                    expanded.update(new_children)
                    frontier = new_children
                query = query.filter(case__module_id__in=list(expanded))
        paginator = self.pagination_class()
        paginated_queryset = paginator.paginate_queryset(query, request)
        serializer = ReviewCaseListSerializer(instance=paginated_queryset, many=True)
        return list_response(data=serializer.data, count=query.count())

    @action(detail=False, methods=['get'], url_path='module-count')
    def module_count(self, request, slug):
        review_id = request.query_params['review_id']
        review = CaseReview.objects.get(id=review_id)
        case_ids = CaseReviewThrough.objects.filter(review_id=review_id).values_list('case_id', flat=True)
        modules = list(
            CaseModule.objects.filter(repository_id=review.module.repository_id, deleted_at__isnull=True).values('id',
                                                                                                                 'parent_id'))
        base_counts = {m['id']: 0 for m in modules}
        aggregates = TestCase.objects.filter(id__in=case_ids).values('module_id').annotate(count=Count('id'))
        for item in aggregates:
            if item['module_id']:
                base_counts[item['module_id']] = item['count']
        children_map = {}
        for m in modules:
            pid = m['parent_id']
            if pid:
                children_map.setdefault(pid, []).append(m['id'])
        result = {str(m['id']): base_counts.get(m['id'], 0) for m in modules}
        for m in modules:
            mid = m['id']
            for child in children_map.get(mid, []):
                result[str(mid)] += base_counts.get(child, 0)
        result['total'] = len(case_ids)
        return Response(data=result, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='case-review')
    def case_review(self, request, slug):
        # 输入参数
        review_id = request.data.get('review_id')
        case_id = request.data.get('case_id')
        record_result = request.data.get('result')
        reason = request.data.get('reason')
        assignee_id = request.data.get('assignee')

        # 获取评审单与评审用例
        cr = CaseReview.objects.get(id=review_id)
        crt = CaseReviewThrough.objects.get(review=cr, case_id=case_id)

        # 记录评审历史：每次提交一条记录，保留历史
        CaseReviewRecord.objects.create(
            result=record_result,
            reason=reason,
            assignee_id=assignee_id,
            crt=crt,
        )

        update_case_review_status(cr, crt, assignee_id)

        serializer = ReviewCaseListSerializer(instance=crt)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='records')
    def get_records(self, request, slug):
        review_id = request.query_params['review_id']
        case_id = request.query_params['case_id']
        crt = CaseReviewThrough.objects.get(review=review_id, case_id=case_id)
        query = CaseReviewRecord.objects.filter(crt=crt)
        serializer = ReviewCaseRecordsSerializer(instance=query, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
