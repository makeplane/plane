# 顶部新增必要的导入，并在文件末尾新增 CaseAttachmentV2Endpoint
from rest_framework import status
from rest_framework.response import Response

from plane.app.serializers.qa import TestPlanDetailSerializer, CaseModuleCreateUpdateSerializer, \
    CaseModuleListSerializer, CaseLabelListSerializer, CaseLabelCreateSerializer, CaseCreateUpdateSerializer, \
    CaseListSerializer, CaseAttachmentSerializer
from plane.app.views.qa.filters import TestPlanFilter
from plane.db.models import TestPlan, TestCaseRepository, TestCase, CaseModule, CaseLabel, FileAsset, Workspace
from plane.utils.paginator import CustomPaginator
from plane.utils.response import list_response
from plane.app.views import BaseAPIView
from plane.app.serializers import TestPlanCreateUpdateSerializer, TestCaseRepositorySerializer, \
    TestCaseRepositoryDetailSerializer
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


class CaseAPIView(BaseAPIView):
    model = TestCase
    queryset = TestCase.objects.all()
    pagination_class = CustomPaginator
    serializer_class = CaseListSerializer
    filterset_fields = {
        'name': ['exact', 'icontains', 'in'],
        'repository_id': ['exact'],
        'state': ['exact', 'in'],
        'type': ['exact', 'in'],
        'priority': ['exact', 'in'],
        'module_id': ['exact', 'in'],
        'id': ['exact'],
    }

    def get(self, request, slug):
        cases = self.filter_queryset(self.queryset)
        paginator = self.pagination_class()
        paginated_queryset = paginator.paginate_queryset(cases, request)
        serializer = self.serializer_class(instance=paginated_queryset, many=True)
        return list_response(data=serializer.data, count=cases.count())

    def post(self, request, slug):
        serializer = CaseCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        test_plan = serializer.save()
        serializer = self.serializer_class(instance=test_plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def put(self,request,slug):
        case_id = request.data.pop('id')
        case = self.queryset.get(id=case_id)
        update_serializer = CaseCreateUpdateSerializer(instance=case, data=request.data, partial=True)
        update_serializer.is_valid(raise_exception=True)
        updated_plan = update_serializer.save()
        serializer = self.serializer_class(instance=case)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CaseDetailAPIView(BaseAPIView):
    model = TestCase
    queryset = TestCase.objects.all()
    pagination_class = CustomPaginator
    serializer_class = CaseListSerializer

    def get(self, request, slug,case_id):
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
        serializer = CaseLabelCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        test_plan = serializer.save()
        serializer = self.serializer_class(instance=test_plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, slug):
        ids = request.data.pop('ids')
        self.queryset.filter(id__in=ids).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EnumDataAPIView(BaseAPIView):

    def get(self, request, slug):
        plan_state = dict(TestPlan.State.choices)
        case_state = dict(TestCase.State.choices)
        case_type = dict(TestCase.Type.choices)
        case_priority = dict(TestCase.Priority.choices)
        case_test_type = dict(TestCase.TestType.choices)
        return Response(dict(
            plan_state=plan_state, case_state=case_state, case_type=case_type, case_priority=case_priority,
            case_test_type=case_test_type
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
