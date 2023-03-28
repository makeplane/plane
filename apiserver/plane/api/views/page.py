# Python imports
from datetime import timedelta, datetime
from django.utils import timezone

# Django imports
from django.db import IntegrityError
from django.db.models import Exists, OuterRef, Q, Prefetch
from django.utils import timezone

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
)
from plane.api.serializers import (
    PageSerializer,
    PageBlockSerializer,
    PageFavoriteSerializer,
    IssueLiteSerializer,
)


class PageViewSet(BaseViewSet):
    serializer_class = PageSerializer
    model = Page
    permission_classes = [
        ProjectEntityPermission,
    ]
    search_fields = [
        "name",
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
            .order_by(self.request.GET.get("order_by", "-created_at"))
            .prefetch_related("labels")
            .order_by("name", "-is_favorite")
            .prefetch_related(
                Prefetch(
                    "blocks", queryset=PageBlock.objects.select_related("page", "issue")
                )
            )
            .distinct()
        )

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"), owned_by=self.request.user
        )

    def create(self, request, slug, project_id):
        try:
            serializer = PageSerializer(
                data=request.data,
                context={"project_id": project_id, "owned_by_id": request.user.id},
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
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
            .order_by("sort_order")
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
    permission_classes = [
        ProjectEntityPermission,
    ]

    def post(self, request, slug, project_id, page_id, page_block_id):
        try:
            page_block = PageBlock.objects.get(
                pk=page_block_id,
                workspace__slug=slug,
                project_id=project_id,
                page_id=page_id,
            )
            issue = Issue.objects.create(
                name=page_block.name,
                project_id=project_id,
                description=page_block.description,
                description_html=page_block.description_html,
                description_stripped=page_block.description_stripped,
            )
            _ = IssueAssignee.objects.create(
                issue=issue, assignee=request.user, project_id=project_id
            )
            page_block.issue = issue
            page_block.save()

            return Response(IssueLiteSerializer(issue).data, status=status.HTTP_200_OK)
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


class RecentPagesEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def get(self, request, slug, project_id):
        try:
            subquery = PageFavorite.objects.filter(
                user=request.user,
                page_id=OuterRef("pk"),
                project_id=project_id,
                workspace__slug=slug,
            )
            current_time = timezone.now()
            day_before = current_time - timedelta(days=1)

            todays_pages = (
                Page.objects.filter(
                    updated_at__date=timezone.now().date(),
                    workspace__slug=slug,
                    project_id=project_id,
                )
                .filter(project__project_projectmember__member=request.user)
                .annotate(is_favorite=Exists(subquery))
                .filter(Q(owned_by=self.request.user) | Q(access=0))
                .select_related("project")
                .select_related("workspace")
                .select_related("owned_by")
                .prefetch_related("labels")
                .order_by("-updated_by")
            )

            yesterdays_pages = (
                Page.objects.filter(
                    updated_at__date=day_before.date(),
                    workspace__slug=slug,
                    project_id=project_id,
                )
                .filter(project__project_projectmember__member=request.user)
                .annotate(is_favorite=Exists(subquery))
                .filter(Q(owned_by=self.request.user) | Q(access=0))
                .select_related("project")
                .select_related("workspace")
                .select_related("owned_by")
                .prefetch_related("labels")
                .order_by("-updated_by")
            )

            earlier_this_week = (
                Page.objects.filter(
                    updated_at__date__range=(
                        (timezone.now() - timedelta(days=7)).date(),
                        (timezone.now() - timedelta(days=2)).date(),
                    ),
                    workspace__slug=slug,
                    project_id=project_id,
                )
                .annotate(is_favorite=Exists(subquery))
                .filter(Q(owned_by=self.request.user) | Q(access=0))
                .filter(project__project_projectmember__member=request.user)
                .annotate(is_favorite=Exists(subquery))
                .select_related("project")
                .select_related("workspace")
                .select_related("owned_by")
                .prefetch_related("labels")
                .order_by("-updated_by")
            )
            todays_pages_serializer = PageSerializer(todays_pages, many=True)
            yesterday_pages_serializer = PageSerializer(yesterdays_pages, many=True)
            earlier_this_week_serializer = PageSerializer(earlier_this_week, many=True)
            return Response(
                {
                    "today": todays_pages_serializer.data,
                    "yesterday": yesterday_pages_serializer.data,
                    "earlier_this_week": earlier_this_week_serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class FavoritePagesEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def get(self, request, slug, project_id):
        try:
            subquery = PageFavorite.objects.filter(
                user=request.user,
                page_id=OuterRef("pk"),
                project_id=project_id,
                workspace__slug=slug,
            )
            pages = (
                Page.objects.filter(
                    workspace__slug=slug,
                    project_id=project_id,
                )
                .annotate(is_favorite=Exists(subquery))
                .filter(Q(owned_by=self.request.user) | Q(access=0))
                .filter(project__project_projectmember__member=request.user)
                .filter(is_favorite=True)
                .select_related("project")
                .select_related("workspace")
                .select_related("owned_by")
                .prefetch_related("labels")
                .order_by("name", "-is_favorite")
            )

            serializer = PageSerializer(pages, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class MyPagesEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def get(self, request, slug, project_id):
        try:
            subquery = PageFavorite.objects.filter(
                user=request.user,
                page_id=OuterRef("pk"),
                project_id=project_id,
                workspace__slug=slug,
            )
            pages = (
                Page.objects.filter(
                    workspace__slug=slug, project_id=project_id, owned_by=request.user
                )
                .select_related("project")
                .select_related("workspace")
                .select_related("owned_by")
                .prefetch_related("labels")
                .annotate(is_favorite=Exists(subquery))
                .filter(Q(owned_by=self.request.user) | Q(access=0))
                .filter(project__project_projectmember__member=request.user)
                .order_by("name", "-is_favorite")
            )
            serializer = PageSerializer(pages, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class CreatedbyOtherPagesEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def get(self, request, slug, project_id):
        try:
            subquery = PageFavorite.objects.filter(
                user=request.user,
                page_id=OuterRef("pk"),
                project_id=project_id,
                workspace__slug=slug,
            )
            pages = (
                Page.objects.filter(
                    ~Q(owned_by=request.user),
                    workspace__slug=slug,
                    project_id=project_id,
                    access=0,
                )
                .select_related("project")
                .select_related("workspace")
                .select_related("owned_by")
                .prefetch_related("labels")
                .annotate(is_favorite=Exists(subquery))
                .order_by("name", "-is_favorite")
            )
            serializer = PageSerializer(pages, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
