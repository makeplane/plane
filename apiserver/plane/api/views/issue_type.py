import json

from django.core.serializers.json import DjangoJSONEncoder

# Django imports
from django.db import IntegrityError
from django.db.models import (
    Case,
    CharField,
    Exists,
    F,
    Func,
    Max,
    OuterRef,
    Q,
    Value,
    When,
    Subquery,
)
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

# Module imports
from plane.api.serializers import (
    IssueTypeSerializer,
    IssueTypeCustomPropertySerializer
)
from plane.app.permissions import (
    ProjectLitePermission,
)
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import (
    Workspace,
    IssueType,
    IssueTypeCustomProperty
)
from .base import BaseAPIView

class IssueTypeAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions related to comments of the particular issue.

    """

    serializer_class = IssueTypeSerializer
    model = IssueType
    webhook_event = "issue_type"
    permission_classes = [
        ProjectLitePermission,
    ]

    def get_queryset(self):
        return (
            IssueType.objects.filter(
                workspace__slug=self.kwargs.get("slug")
            )
            .select_related("workspace")
            .order_by(self.kwargs.get("order_by", "-created_at"))
            .distinct()
        )

    def get(self, request, slug, pk=None):
        if pk:
            issue_type = self.get_queryset().get(pk=pk)
            serializer = IssueTypeSerializer(
                issue_type,
                fields=self.fields,
                expand=self.expand,
            )
            import pdb;pdb.set_trace()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return self.paginate(
            request=request,
            queryset=(self.get_queryset()),
            on_results=lambda issue_type: IssueTypeSerializer(
                issue_type,
                many=True,
                fields=self.fields,
                expand=self.expand,
            ).data,
        )

    def post(self, request, slug):
        # Validation check if the issue already exists
        if (IssueType.objects.filter(
                name=request.data.get('name'),
                workspace__slug=slug
            ).exists()
        ):
            issue_type = IssueType.objects.filter(
                name=request.data.get('name'),
                workspace__slug=slug
            ).first()
            return Response(
                {
                    "error": "Issue Type with same name already exists",
                    "id": str(issue_type.id),
                },
                status=status.HTTP_409_CONFLICT,
            )
        workspace = Workspace.objects.get(slug=slug)
        serializer = IssueTypeSerializer(
            data=request.data, 
            context={'workspace_id': workspace.id}
        )
        if serializer.is_valid():
            serializer.save()
            issue_type = IssueType.objects.get(
                pk=serializer.data.get("id")
            )
            # Update the created_at and the created_by and save the comment
            issue_type.created_at = request.data.get(
                "created_at", timezone.now()
            )
            issue_type.created_by_id = request.data.get(
                "created_by", request.user.id
            )
            issue_type.save(update_fields=["created_at", "created_by"])

            # issue_activity.delay(
            #     type="type.activity.created",
            #     requested_data=json.dumps(
            #         serializer.data, cls=DjangoJSONEncoder
            #     ),
            #     current_instance=None,
            #     epoch=int(timezone.now().timestamp()),
            # )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, slug, project_id, issue_id, pk):
        issue_type = IssueType.objects.get(
            workspace__slug=slug,
            pk=pk,
        )
        requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)
        current_instance = json.dumps(
            IssueTypeSerializer(issue_comment).data,
            cls=DjangoJSONEncoder,
        )

        # Validation check if the issue already exists
        if (
            IssueType.objects.filter(
                workspace__slug=slug,
                name=request.data.get('name')
            ).exists()
        ):
            return Response(
                {
                    "error": "Issue Comment with the same name already exists",
                    "id": str(issue_type.id),
                },
                status=status.HTTP_409_CONFLICT,
            )

        serializer = IssueTypeSerializer(
            issue_comment, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            # issue_activity.delay(
            #     type="type.activity.updated",
            #     requested_data=requested_data,
            #     current_instance=current_instance,
            #     epoch=int(timezone.now().timestamp()),
            # )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # def delete(self, request, slug, project_id, issue_id, pk):
    #     issue_comment = IssueComment.objects.get(
    #         workspace__slug=slug,
    #         project_id=project_id,
    #         issue_id=issue_id,
    #         pk=pk,
    #     )
    #     current_instance = json.dumps(
    #         IssueCommentSerializer(issue_comment).data,
    #         cls=DjangoJSONEncoder,
    #     )
    #     issue_comment.delete()
    #     issue_activity.delay(
    #         type="comment.activity.deleted",
    #         requested_data=json.dumps({"comment_id": str(pk)}),
    #         actor_id=str(request.user.id),
    #         issue_id=str(issue_id),
    #         project_id=str(project_id),
    #         current_instance=current_instance,
    #         epoch=int(timezone.now().timestamp()),
    #     )
    #     return Response(status=status.HTTP_204_NO_CONTENT)

class IssueTypeCustomPropertyAPIEndpoint(BaseAPIView):
    def get(self, request, slug, issue_type, pk=None):
        workspace = Workspace.objects.get(slug=slug)
        properties = IssueTypeCustomProperty.objects.filter(
            issue_type_id=issue_type
        )
        if pk:
            property = properties.get(pk=pk)
            serializer = IssueTypeCustomPropertySerializer(
                property, many=False
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        serializer = IssueTypeCustomPropertySerializer(properties, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug, issue_type):
        try:
            serializer = IssueTypeCustomPropertySerializer(
                data={**request.data}, context={
                    "issue_type_id": issue_type
                }
            )
            print(serializer.is_valid())
            if serializer.is_valid():
                serializer.save()
                return Response(
                    serializer.data, status=status.HTTP_201_CREATED
                )
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The Property Name is already taken"},
                    status=status.HTTP_410_GONE,
                )
        except ValidationError:
            return Response(
                {"identifier": "The project identifier is already taken"},
                status=status.HTTP_410_GONE,
            )