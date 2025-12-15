from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from yaml import serialize

from plane.app.serializers.qa import TestPlanDetailSerializer, CaseModuleCreateUpdateSerializer, \
    CaseModuleListSerializer, CaseLabelListSerializer, CaseLabelCreateSerializer, CaseCreateUpdateSerializer, \
    CaseListSerializer, CaseAttachmentSerializer, ReviewCaseRecordsSerializer
from plane.app.serializers.qa.plan import PlanModuleCreateUpdateSerializer, PlanModuleListSerializer, \
    PlanCaseListSerializer, PlanCaseCardSerializer, PlanCaseRecordSerializer
from plane.app.views.qa.filters import TestPlanFilter
from plane.db.models import TestPlan, TestCaseRepository, TestCase, CaseModule, CaseLabel, FileAsset, Workspace, \
    PlanModule, PlanCase, PlanCaseRecord, Issue, Cycle, CycleIssue
from plane.utils.paginator import CustomPaginator
from plane.utils.response import list_response
from plane.app.views import BaseAPIView, BaseViewSet
from plane.app.serializers import TestPlanCreateUpdateSerializer, TestCaseRepositorySerializer, \
    TestCaseRepositoryDetailSerializer, CycleSerializer
from plane.app.permissions import allow_permission, ROLE
from plane.settings.storage import S3Storage
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata
from django.conf import settings
from django.http import HttpResponseRedirect, FileResponse, StreamingHttpResponse
from urllib.parse import quote
import uuid
from django.utils import timezone


class RepositoryAPIView(BaseAPIView):
    model = TestCaseRepository
    queryset = TestCaseRepository.objects.all()
    serializer_class = TestCaseRepositorySerializer
    filterset_fields = {
        'project_id': ['exact', 'in'],
        'project__name': ['exact', 'icontains', 'in'],
        'id': ['exact', 'in'],
        'workspace__slug': ['exact', 'icontains', 'in'],
        'name': ['exact', 'icontains', 'in'],
    }
    pagination_class = CustomPaginator

    def post(self, request, slug):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        repository = serializer.save()
        serializer = TestCaseRepositoryDetailSerializer(instance=repository)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def put(self, request, slug):
        repository_id = request.data.pop('id')
        repository = self.queryset.get(id=repository_id)
        update_serializer = self.serializer_class(instance=repository, data=request.data, partial=True)
        update_serializer.is_valid(raise_exception=True)
        updated_plan = update_serializer.save()
        serializer = TestCaseRepositoryDetailSerializer(instance=repository)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def get(self, request, slug):
        repositories = self.filter_queryset(self.queryset)
        paginator = self.pagination_class()
        paginated_queryset = paginator.paginate_queryset(repositories, request)
        serializer = TestCaseRepositoryDetailSerializer(instance=paginated_queryset, many=True)
        return list_response(data=serializer.data, count=repositories.count())

    def delete(self, request, slug):
        plan_ids = request.data.pop('ids')
        self.queryset.filter(id__in=plan_ids).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlanAPIView(BaseAPIView):
    model = TestPlan
    queryset = TestPlan.objects.all()
    pagination_class = CustomPaginator
    serializer_class = TestPlanCreateUpdateSerializer
    filterset_class = TestPlanFilter

    def post(self, request, slug):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        test_plan = serializer.save()
        serializer = TestPlanDetailSerializer(instance=test_plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request, slug):
        planes = self.filter_queryset(self.queryset).distinct()
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


class PlanCaseAPIView(BaseAPIView):
    queryset = PlanCase.objects.all()
    pagination_class = CustomPaginator
    filterset_fields = {
        'plan_id': ['exact', 'in'],
        'case__module_id': ['exact', 'in'],
    }
    serializer_class = PlanCaseListSerializer

    def get(self, request, slug):
        plans = self.filter_queryset(self.queryset).distinct()
        paginator = self.pagination_class()
        paginated_queryset = paginator.paginate_queryset(plans, request)
        serializer = self.serializer_class(instance=paginated_queryset, many=True)
        return list_response(data=serializer.data, count=plans.count())


class PlanModuleAPIView(BaseAPIView):
    model = PlanModule
    queryset = PlanModule.objects.all()
    serializer_class = PlanModuleListSerializer
    filterset_fields = {
        'name': ['exact', 'icontains', 'in'],
        'repository_id': ['exact', 'in'],
        'id': ['exact']
    }

    def post(self, request, slug):
        serializer = PlanModuleCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plan_module = serializer.save()
        serializer = PlanModuleListSerializer(instance=plan_module)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request, slug):
        query = self.filter_queryset(self.queryset).order_by('created_at')
        serializer = self.serializer_class(instance=query, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, slug):
        module_ids = request.data.pop('ids')
        self.queryset.filter(id__in=module_ids).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlanView(BaseViewSet):
    pagination_class = CustomPaginator

    @action(detail=False, methods=['post'], url_path='cancel')
    def cancel(self, request, slug):
        PlanCase.objects.get(id=request.data['id']).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='case-list')
    def case_list(self, request, slug):
        query = PlanCase.objects.filter(plan_id=request.query_params['plan_id'])
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
        serializer = PlanCaseCardSerializer(instance=paginated_queryset, many=True)
        return list_response(data=serializer.data, count=query.count())

    @action(detail=False, methods=['post'], url_path='execute')
    def execute(self, request, slug):
        plan_id = request.data['plan_id']
        case_id = request.data['case_id']
        result = request.data['result']
        reason = request.data.get('reason')
        steps = request.data['steps']
        assignee = request.data['assignee']
        issue_ids = request.data.get('issue_ids', [])

        plan_case = PlanCase.objects.get(plan_id=plan_id, case_id=case_id)

        # 创建执行记录
        pcr = PlanCaseRecord.objects.create(result=result, reason=reason, steps=steps, assignee_id=assignee,
                                            plan_case=plan_case)
        plan_case.result = result
        plan_case.save()

        plan = TestPlan.objects.get(id=plan_id)
        # 修改计划状态
        if not PlanCase.objects.filter(plan_id=plan_id, result=PlanCase.Result.NOT_START).exists():
            plan.state = TestPlan.State.COMPLETED
        else:
            plan.state = TestPlan.State.PROGRESS
        plan.save()
        return Response(status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='case-detail')
    def case_detail(self, request, slug):
        plan_id = request.query_params['plan_id']
        case_id = request.query_params['case_id']

        plan_case = PlanCase.objects.get(plan_id=plan_id, case_id=case_id)
        case = TestCase.objects.get(pk=case_id)
        case_data = CaseListSerializer(case).data

        case_data[
            'execute_steps'] = plan_case.plan_case_records.first().steps if plan_case.plan_case_records.first() else None
        return Response(case_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='add-bug')
    def add_bug(self, request, slug):
        case_id = request.data['case_id']
        issue_id = request.data['issue_id']
        case = TestCase.objects.get(pk=case_id)
        issue = Issue.objects.get(pk=issue_id)
        case.issues.add(issue)
        return Response(status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='records')
    def get_records(self, request, slug):
        plan_id = request.query_params['plan_id']
        case_id = request.query_params['case_id']
        plan_case = PlanCase.objects.get(plan_id=plan_id, case_id=case_id)
        records = PlanCaseRecord.objects.filter(plan_case=plan_case)
        serializer = PlanCaseRecordSerializer(instance=records, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='associate-cycle')
    def associate_cycle(self, request, slug):
        plan_id = request.data['plan_id']
        cycle_ids: list = request.data['cycle_id']

        # 1. 获取 Plan 对象
        plan = TestPlan.objects.get(pk=plan_id)

        # 2. 批量关联 Cycle
        # 使用 set 运算找出需要新增的 cycle_id，减少数据库查询
        # existing_cycle_ids = set(plan.cycles.filter(id__in=cycle_ids).values_list('id', flat=True))
        # new_cycle_ids = set(cycle_ids) - existing_cycle_ids
        #
        # if new_cycle_ids:
        #     # 批量查询并添加
        #     new_cycles = Cycle.objects.filter(pk__in=new_cycle_ids)
        #     plan.cycles.add(*new_cycles)

        # 3. 批量导入关联的用例
        # 获取所有选中 Cycle 下 Issue 关联的 Case ID
        # 通过连表查询一次性获取所有相关的 case_id
        related_case_ids = CycleIssue.objects.filter(
            cycle_id__in=cycle_ids
        ).values_list('issue__cases__id', flat=True).distinct()

        # 排除无效的 None 值（如果某些 Issue 没有关联 Case）
        valid_case_ids = [cid for cid in related_case_ids if cid]

        if not valid_case_ids:
            return Response(status=status.HTTP_200_OK)

        # 4. 批量创建 PlanCase
        # 获取该 Plan 已存在的 case_id，避免重复创建
        existing_plan_case_ids = set(
            PlanCase.objects.filter(
                plan=plan,
                case_id__in=valid_case_ids
            ).values_list('case_id', flat=True)
        )

        # 计算需要新创建的 case_id
        new_case_ids = set(valid_case_ids) - existing_plan_case_ids

        if new_case_ids:
            new_plan_cases = [
                PlanCase(plan=plan, case_id=case_id)
                for case_id in new_case_ids
            ]
            PlanCase.objects.bulk_create(new_plan_cases, batch_size=1000)

        return Response(status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='associate-modules')
    def associate_modules(self, request, slug):
        ...


class CaseAPIView(BaseAPIView):
    model = TestCase
    queryset = TestCase.objects.select_related(
        'repository', 'module', 'assignee'
    ).prefetch_related(
        'labels', 'issues'
    )
    pagination_class = CustomPaginator
    serializer_class = CaseListSerializer
    filterset_fields = {
        'name': ['exact', 'icontains', 'in'],
        'labels__name': ['exact', 'icontains'],
        'repository_id': ['exact'],
        'type': ['exact', 'in'],
        'priority': ['exact', 'in'],
        'module_id': ['exact', 'in'],
        'id': ['exact', 'in'],
        'plan_cases__plan__id': ['exact', 'in'],
    }

    def get(self, request, slug):
        cases = self.filter_queryset(self.queryset)
        paginator = self.pagination_class()
        paginated_queryset = paginator.paginate_queryset(cases, request)
        serializer = self.serializer_class(instance=paginated_queryset, many=True)
        data = serializer.data

        return list_response(data=data, count=cases.count())

    def post(self, request, slug):

        serializer = CaseCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        test_plan = serializer.save()
        serializer = self.serializer_class(instance=test_plan)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def put(self, request, slug):
        case_id = request.data.pop('id')
        case = self.queryset.get(id=case_id)
        update_serializer = CaseCreateUpdateSerializer(instance=case, data=request.data, partial=True)
        update_serializer.is_valid(raise_exception=True)
        update_serializer.save()
        serializer = self.serializer_class(instance=case)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, slug):
        self.filter_queryset(self.queryset).all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CaseDetailAPIView(BaseAPIView):
    model = TestCase
    queryset = TestCase.objects.all()
    pagination_class = CustomPaginator
    serializer_class = CaseListSerializer

    def get(self, request, slug, case_id):
        case = self.queryset.get(id=case_id)
        serializer = self.serializer_class(instance=case)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CaseModuleAPIView(BaseAPIView):
    model = CaseModule
    queryset = CaseModule.objects.all()
    serializer_class = CaseModuleCreateUpdateSerializer
    filterset_fields = {
        'name': ['exact', 'icontains', 'in'],
        'repository_id': ['exact'],
        'id': ['exact'],
    }

    def get(self, request, slug):
        modules = self.filter_queryset(self.queryset.filter(parent=None))
        serializer = CaseModuleListSerializer(instance=modules, many=True)
        return Response(data=serializer.data)

    def post(self, request, slug):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        test_plan = serializer.save()
        serializer = CaseModuleListSerializer(instance=test_plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, slug):
        self.filter_queryset(self.queryset).all().delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


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
        name = request.data['name']
        case_id = request.data.get('case_id')
        repository_id = request.data['repository_id']
        label, _ = CaseLabel.objects.get_or_create(name=name, repository_id=repository_id)
        if case_id:
            case = TestCase.objects.get(id=case_id)
            case.labels.add(label)
            case.save()
        serializer = self.serializer_class(instance=label)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, slug):
        case_id = request.data.get('case_id')
        label_id = request.data['id']
        label = self.queryset.get(id=label_id)
        if case_id:
            case = TestCase.objects.get(id=case_id)
            case.labels.remove(label)
            case.save()
        if not label.cases.exists():
            label.delete(soft=False)

        return Response(status=status.HTTP_204_NO_CONTENT)


class EnumDataAPIView(BaseAPIView):

    def get(self, request, slug):
        plan_state = dict(TestPlan.State.choices)
        case_state = dict(TestCase.State.choices)
        case_type = dict(TestCase.Type.choices)
        case_priority = dict(TestCase.Priority.choices)
        case_test_type = dict(TestCase.TestType.choices)
        plan_case_result = dict(PlanCase.Result.choices)
        return Response(dict(
            plan_state=plan_state, case_state=case_state, case_type=case_type, case_priority=case_priority,
            case_test_type=case_test_type, plan_case_result=plan_case_result
        ))


# 新增：测试用例附件 V2 端点，复用 Issue 附件逻辑
class CaseAttachmentV2Endpoint(BaseAPIView):
    serializer_class = CaseAttachmentSerializer
    model = FileAsset

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def post(self, request, slug, project_id, case_id):
        name = request.data.get("name")
        type = request.data.get("type", False)
        size = int(request.data.get("size", settings.FILE_SIZE_LIMIT))

        if not type or type not in settings.ATTACHMENT_MIME_TYPES:
            return Response({"error": "Invalid file type.", "status": False}, status=status.HTTP_400_BAD_REQUEST)

        workspace = Workspace.objects.get(slug=slug)
        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"
        size_limit = min(size, settings.FILE_SIZE_LIMIT)

        asset = FileAsset.objects.create(
            attributes={"name": name, "type": type, "size": size_limit},
            asset=asset_key,
            size=size_limit,
            workspace_id=workspace.id,
            created_by=request.user,
            case_id=case_id,
            project_id=project_id,
            entity_type=FileAsset.EntityTypeContext.CASE_ATTACHMENT,
        )

        storage = S3Storage(request=request)
        presigned_url = storage.generate_presigned_post(object_name=asset_key, file_type=type, file_size=size_limit)

        return Response(
            {
                "upload_data": presigned_url,
                "asset_id": str(asset.id),
                "attachment": CaseAttachmentSerializer(asset).data,
                "asset_url": asset.asset_url,
            },
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN], creator=True, model=FileAsset)
    def delete(self, request, slug, project_id, case_id, pk):
        case_attachment = FileAsset.objects.get(pk=pk, workspace__slug=slug, project_id=project_id)
        case_attachment.is_deleted = True
        case_attachment.deleted_at = timezone.now()
        case_attachment.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get(self, request, slug, case_id, pk=None):
        if pk:
            asset = FileAsset.objects.get(id=pk, workspace__slug=slug)
            if not asset.is_uploaded:
                return Response({"error": "The asset is not uploaded.", "status": False},
                                status=status.HTTP_400_BAD_REQUEST)

            storage = S3Storage(request=request)
            s3_resp = storage.s3_client.get_object(Bucket=storage.aws_storage_bucket_name, Key=str(asset.asset.name))
            body = s3_resp.get("Body")
            content_type = s3_resp.get("ContentType") or asset.attributes.get("type") or "application/octet-stream"
            resp = StreamingHttpResponse(body, content_type=content_type)
            filename = asset.attributes.get("name")
            if filename:
                resp["Content-Disposition"] = f"attachment; filename*=UTF-8''{quote(filename)}"
            content_length = s3_resp.get("ContentLength")
            if content_length:
                resp["Content-Length"] = str(content_length)
            return resp

        case_attachments = FileAsset.objects.filter(
            case_id=case_id,
            entity_type=FileAsset.EntityTypeContext.CASE_ATTACHMENT,
            workspace__slug=slug,
            is_uploaded=True,
        )
        serializer = CaseAttachmentSerializer(case_attachments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def patch(self, request, slug, project_id, case_id, pk):
        case_attachment = FileAsset.objects.get(pk=pk, workspace__slug=slug, project_id=project_id)
        # 首次标记为已上传
        if not case_attachment.is_uploaded:
            case_attachment.is_uploaded = True
            case_attachment.created_by = request.user

        if not case_attachment.storage_metadata:
            get_asset_object_metadata.delay(str(case_attachment.id))

        # 可选：更新 attributes（与 UserAssetsV2Endpoint 同步风格）
        case_attachment.attributes = request.data.get("attributes", case_attachment.attributes)
        case_attachment.save(update_fields=["is_uploaded", "attributes"])
        return Response(status=status.HTTP_204_NO_CONTENT)
