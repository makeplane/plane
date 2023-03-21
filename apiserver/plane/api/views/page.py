# Django imports
from django.db import IntegrityError
from django.db.models import Exists, OuterRef, Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from sentry_sdk import capture_exception

# Module imports
from .base import BaseViewSet, BaseAPIView
from plane.api.permissions import ProjectEntityPermission
from plane.db.models import (
    Page,
    PageBlock,
    PageFavorite,
    Issue,
    IssueAssignee,
    IssueActivity,
)
from plane.api.serializers import (
    PageSerializer,
    PageBlockSerializer,
    PageFavoriteSerializer,
    IssueSerializer,
)


class PageViewSet(BaseViewSet):
    serializer_class = PageSerializer
    model = Page
    permission_classes = [
        ProjectEntityPermission,
    ]

    def get_queryset(self):
        subquery = PageFavorite.objects.filter(
            user=self.request.user,
            page_id=OuterRef("pk"),
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .select_related("project")
            .select_related("workspace")
            .select_related("owned_by")
            .annotate(is_favorite=Exists(subquery))
            .distinct()
        )

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"), owned_by=self.request.user
        )


class PageBlockViewSet(BaseViewSet):
    serializer_class = PageBlockSerializer
    model = PageBlock
    permission_classes = [
        ProjectEntityPermission,
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(page_id=self.kwargs.get("page_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project")
            .select_related("workspace")
            .select_related("page")
            .select_related("issue")
            .distinct()
        )

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            page_id=self.kwargs.get("page_id"),
        )


class PageFavoriteViewSet(BaseViewSet):
    permission_classes = [
        ProjectEntityPermission,
    ]

    serializer_class = PageFavoriteSerializer
    model = PageFavorite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(user=self.request.user)
            .select_related("page", "page__owned_by")
        )

    def create(self, request, slug, project_id):
        try:
            serializer = PageFavoriteSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(user=request.user, project_id=project_id)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"error": "The page is already added to favorites"},
                    status=status.HTTP_410_GONE,
                )
            else:
                capture_exception(e)
                return Response(
                    {"error": "Something went wrong please try again later"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def destroy(self, request, slug, project_id, page_id):
        try:
            page_favorite = PageFavorite.objects.get(
                project=project_id,
                user=request.user,
                workspace__slug=slug,
                page_id=page_id,
            )
            page_favorite.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PageFavorite.DoesNotExist:
            return Response(
                {"error": "Page is not in favorites"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class CreateIssueFromPageBlockEndpoint(BaseAPIView):
    def post(self, request, slug, project_id, page_id, page_block_id):
        try:
            page_block = PageBlock.objects.get(
                pk=page_block_id,
                workspace__slug=slug,
                project_id=project_id,
                page_id=page_id,
            )
            issue = Issue.objects.create(name=page_block.name, project_id=project_id)
            _ = IssueAssignee.objects.create(
                issue=issue, assignee=request.user, project_id=project_id
            )
            page_block.issue = issue
            page_block.save()

            return Response(IssueSerializer(issue).data, status=status.HTTP_200_OK)
        except PageBlock.DoesNotExist:
            return Response(
                {"error": "Page Block does not exist"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
