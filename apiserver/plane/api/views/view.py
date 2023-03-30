# Django imports
from django.db import IntegrityError
from django.db.models import Prefetch, OuterRef, Exists

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from sentry_sdk import capture_exception

# Module imports
from . import BaseViewSet, BaseAPIView
from plane.api.serializers import (
    IssueViewSerializer,
    IssueLiteSerializer,
    IssueViewFavoriteSerializer,
)
from plane.api.permissions import ProjectEntityPermission
from plane.db.models import (
    IssueView,
    Issue,
    IssueBlocker,
    IssueLink,
    CycleIssue,
    ModuleIssue,
    IssueViewFavorite,
)
from plane.utils.issue_filters import issue_filters


class IssueViewViewSet(BaseViewSet):
    serializer_class = IssueViewSerializer
    model = IssueView
    permission_classes = [
        ProjectEntityPermission,
    ]

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_id"))

    def get_queryset(self):
        subquery = IssueViewFavorite.objects.filter(
            user=self.request.user,
            view_id=OuterRef("pk"),
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project")
            .select_related("workspace")
            .annotate(is_favorite=Exists(subquery))
            .order_by("-is_favorite", "name")
            .distinct()
        )


class ViewIssuesEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def get(self, request, slug, project_id, view_id):
        try:
            view = IssueView.objects.get(pk=view_id)
            queries = view.query

            filters = issue_filters(request.query_params, "GET")

            issues = (
                Issue.objects.filter(
                    **queries, project_id=project_id, workspace__slug=slug
                )
                .filter(**filters)
                .select_related("project")
                .select_related("workspace")
                .select_related("state")
                .select_related("parent")
                .prefetch_related("assignees")
                .prefetch_related("labels")
            )

            serializer = IssueLiteSerializer(issues, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except IssueView.DoesNotExist:
            return Response(
                {"error": "Issue View does not exist"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class IssueViewFavoriteViewSet(BaseViewSet):
    serializer_class = IssueViewFavoriteSerializer
    model = IssueViewFavorite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(user=self.request.user)
            .select_related("view")
        )

    def create(self, request, slug, project_id):
        try:
            serializer = IssueViewFavoriteSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(user=request.user, project_id=project_id)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"error": "The view is already added to favorites"},
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

    def destroy(self, request, slug, project_id, view_id):
        try:
            view_favourite = IssueViewFavorite.objects.get(
                project=project_id,
                user=request.user,
                workspace__slug=slug,
                view_id=view_id,
            )
            view_favourite.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except IssueViewFavorite.DoesNotExist:
            return Response(
                {"error": "View is not in favorites"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
