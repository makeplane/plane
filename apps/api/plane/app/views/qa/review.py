from gunicorn.util import close
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count

from plane.app.serializers.qa import ReviewModuleCreateUpdateSerializer, ReviewModuleDetailSerializer, \
    ReviewModuleListSerializer, ReviewListSerializer, ReviewCreateUpdateSerializer, ReviewCaseListSerializer
from plane.app.views import BaseAPIView, BaseViewSet
from plane.db.models import CaseReview, CaseReviewModule, CaseReviewThrough, CaseModule, TestCase, CaseReviewRecord
from plane.utils.paginator import CustomPaginator
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

        # SUGGEST 不参与最终结果判定，单人/多人均只取最后一次非 SUGGEST 的记录
        if cr.mode == CaseReview.ReviewMode.SINGLE:
            # 单人评审：取该评审人最后一次非 SUGGEST 的记录作为最终结果；若无记录则 NOT_START
            target_assignee_id = assignee_id or cr.assignees.values_list('id', flat=True).first()
            last_record = (
                CaseReviewRecord.objects
                .filter(crt=crt, assignee_id=target_assignee_id)
                .exclude(result=CaseReviewRecord.Result.SUGGEST)
                .order_by('-created_at')
                .first()
            )
            crt.result = last_record.result if last_record else CaseReviewThrough.Result.NOT_START
            crt.save()
        else:
            # 多人评审：每个评审人取其最后一次非 SUGGEST 的记录
            assignee_ids = list(cr.assignees.values_list('id', flat=True))
            if not assignee_ids:
                crt.result = CaseReviewThrough.Result.NOT_START
                crt.save()
            else:
                records = (
                    CaseReviewRecord.objects
                    .filter(crt=crt, assignee_id__in=assignee_ids)
                    .exclude(result=CaseReviewRecord.Result.SUGGEST)
                    .order_by('assignee_id', '-created_at')
                )
                last_by_assignee = {}
                for r in records:
                    if r.assignee_id not in last_by_assignee:
                        last_by_assignee[r.assignee_id] = r.result

                any_fail = any(res == CaseReviewRecord.Result.FAIL for res in last_by_assignee.values())
                any_re_review = any(res == CaseReviewRecord.Result.RE_REVIEW for res in last_by_assignee.values())
                any_missing = any(aid not in last_by_assignee for aid in assignee_ids)
                all_pass = (not any_missing) and len(last_by_assignee) == len(assignee_ids) and all(
                    res == CaseReviewRecord.Result.PASS for res in last_by_assignee.values()
                )

                if any_fail:
                    crt.result = CaseReviewThrough.Result.FAIL
                elif any_re_review:
                    crt.result = CaseReviewThrough.Result.RE_REVIEW
                elif any_missing:
                    crt.result = CaseReviewThrough.Result.PROCESS
                elif all_pass:
                    crt.result = CaseReviewThrough.Result.PASS
                else:
                    crt.result = CaseReviewThrough.Result.PROCESS
                crt.save()

        # 评审单整体状态维护：存在 NOT_START/PROCESS/RE_REVIEW → 进行中；否则已完成
        through_results = set(
            CaseReviewThrough.objects.filter(review=cr).values_list('result', flat=True)
        )
        if (
            CaseReviewThrough.Result.NOT_START in through_results or
            CaseReviewThrough.Result.PROCESS in through_results or
            CaseReviewThrough.Result.RE_REVIEW in through_results
        ):
            cr.state = CaseReview.State.PROGRESS
        else:
            cr.state = CaseReview.State.COMPLETED
        cr.save()

        serializer = ReviewCaseListSerializer(instance=crt)
        return Response(serializer.data, status=status.HTTP_200_OK)
