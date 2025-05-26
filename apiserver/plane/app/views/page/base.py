# Python imports
import json
import base64
from datetime import datetime

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import (
    Exists,
    OuterRef,
    Q,
    Value,
    UUIDField,
    Func,
    F,
    Count,
    Subquery,
)
from django.http import StreamingHttpResponse
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models.functions import Coalesce
from django.utils import timezone


# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import (
    PageLogSerializer,
    PageSerializer,
    PageLiteSerializer,
    PageDetailSerializer,
)
from plane.db.models import (
    Page,
    PageLog,
    UserFavorite,
    ProjectMember,
    ProjectPage,
    Project,
    UserRecentVisit,
    DeployBoard,
)
from plane.utils.error_codes import ERROR_CODES
from ..base import BaseAPIView, BaseViewSet
from plane.bgtasks.page_transaction_task import page_transaction
from plane.bgtasks.page_version_task import page_version
from plane.bgtasks.recent_visited_task import recent_visited_task
from plane.bgtasks.copy_s3_object import copy_s3_objects
from plane.ee.bgtasks.page_update import nested_page_update, PageAction
from plane.ee.utils.page_descendants import get_all_parent_ids


class PageViewSet(BaseViewSet):
    serializer_class = PageSerializer
    model = Page
    search_fields = ["name"]

    def get_queryset(self):
        subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_type="page",
            entity_identifier=OuterRef("pk"),
            workspace__slug=self.kwargs.get("slug"),
        )
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(
                projects__project_projectmember__member=self.request.user,
                projects__project_projectmember__is_active=True,
                projects__archived_at__isnull=True,
            )
            .filter(moved_to_page__isnull=True)
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .prefetch_related("projects")
            .select_related("workspace")
            .select_related("owned_by")
            .annotate(is_favorite=Exists(subquery))
            .order_by(self.request.GET.get("order_by", "-created_at"))
            .prefetch_related("labels")
            .order_by("-is_favorite", "-created_at")
            .annotate(
                project=Exists(
                    ProjectPage.objects.filter(
                        page_id=OuterRef("id"), project_id=self.kwargs.get("project_id")
                    )
                )
            )
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "page_labels__label_id",
                        distinct=True,
                        filter=~Q(page_labels__label_id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                project_ids=Coalesce(
                    ArrayAgg(
                        "projects__id", distinct=True, filter=~Q(projects__id=True)
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .filter(project=True)
            .annotate(
                anchor=DeployBoard.objects.filter(
                    entity_name="page",
                    entity_identifier=OuterRef("pk"),
                    workspace__slug=self.kwargs.get("slug"),
                ).values("anchor")
            )
            .distinct()
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        serializer = PageSerializer(
            data=request.data,
            context={
                "project_id": project_id,
                "owned_by_id": request.user.id,
                "description": request.data.get("description", {}),
                "description_binary": request.data.get("description_binary", None),
                "description_html": request.data.get("description_html", "<p></p>"),
            },
        )

        if serializer.is_valid():
            serializer.save()
            # capture the page transaction
            page_transaction.delay(request.data, None, serializer.data["id"])
            if serializer.data.get("parent_id"):
                nested_page_update.delay(
                    page_id=serializer.data["id"],
                    action=PageAction.SUB_PAGE,
                    project_id=project_id,
                    slug=slug,
                    user_id=request.user.id,
                )

            page = self.get_queryset().get(pk=serializer.data["id"])
            serializer = PageDetailSerializer(page)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def partial_update(self, request, slug, project_id, pk):
        try:
            page = Page.objects.get(
                pk=pk, workspace__slug=slug, projects__id=project_id
            )

            if page.is_locked:
                return Response(
                    {"error": "Page is locked"}, status=status.HTTP_400_BAD_REQUEST
                )

            parent = request.data.get("parent_id", None)
            if parent:
                _ = Page.objects.get(
                    pk=parent, workspace__slug=slug, projects__id=project_id
                )

            if "parent_id" in request.data:
                nested_page_update.delay(
                    page_id=page.id,
                    action=PageAction.MOVED_INTERNALLY,
                    project_id=project_id,
                    slug=slug,
                    extra={"old_parent_id": page.parent_id, "new_parent_id": parent},
                    user_id=request.user.id,
                )

            # Only update access if the page owner is the requesting  user
            if (
                page.access != request.data.get("access", page.access)
                and page.owned_by_id != request.user.id
            ):
                return Response(
                    {
                        "error": "Access cannot be updated since this page is owned by someone else"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = PageDetailSerializer(page, data=request.data, partial=True)
            page_description = page.description_html
            if serializer.is_valid():
                serializer.save()
                # capture the page transaction
                if request.data.get("description_html"):
                    page_transaction.delay(
                        new_value=request.data,
                        old_value=json.dumps(
                            {"description_html": page_description},
                            cls=DjangoJSONEncoder,
                        ),
                        page_id=pk,
                    )

                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Page.DoesNotExist:
            return Response(
                {
                    "error": "Page not found"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def retrieve(self, request, slug, project_id, pk=None):
        page = self.get_queryset().filter(pk=pk).first()
        project = Project.objects.get(pk=project_id)

        """
        if the role is guest and guest_view_all_features is false and owned by is not
        the requesting user then dont show the page
        """

        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=5,
                is_active=True,
            ).exists()
            and not project.guest_view_all_features
            and not page.owned_by == request.user
        ):
            return Response(
                {"error": "You are not allowed to view this page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page is None:
            return Response(
                {"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND
            )
        else:
            issue_ids = PageLog.objects.filter(
                page_id=pk, entity_name="issue"
            ).values_list("entity_identifier", flat=True)
            data = PageDetailSerializer(page).data
            data["issue_ids"] = issue_ids
            recent_visited_task.delay(
                slug=slug,
                entity_name="page",
                entity_identifier=pk,
                user_id=request.user.id,
                project_id=project_id,
            )
            return Response(data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], model=Page, creator=True, field="owned_by")
    def lock(self, request, slug, project_id, pk):
        action = request.data.get("action", "current-page")
        page = Page.objects.filter(
            pk=pk, workspace__slug=slug, projects__id=project_id
        ).first()

        page.is_locked = True
        page.save()

        nested_page_update.delay(
            page_id=page.id,
            action=PageAction.LOCKED,
            project_id=project_id,
            slug=slug,
            sub_pages=True if action == "all" else False,
            user_id=request.user.id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN], model=Page, creator=True, field="owned_by")
    def unlock(self, request, slug, project_id, pk):
        action = request.data.get("action", "current-page")
        page = Page.objects.filter(
            pk=pk, workspace__slug=slug, projects__id=project_id
        ).first()

        page.is_locked = False
        page.save()

        nested_page_update.delay(
            page_id=page.id,
            action=PageAction.UNLOCKED,
            project_id=project_id,
            slug=slug,
            sub_pages=True if action == "all" else False,
            user_id=request.user.id,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN], model=Page, creator=True, field="owned_by")
    def access(self, request, slug, project_id, pk):
        access = request.data.get("access", 0)
        page = Page.objects.filter(
            pk=pk, workspace__slug=slug, projects__id=project_id
        ).first()

        # Only update access if the page owner is the requesting user
        if (
            page.access != request.data.get("access", page.access)
            and page.owned_by_id != request.user.id
        ):
            return Response(
                {
                    "error": "Access cannot be updated since this page is owned by someone else"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        page.access = access
        page.save()
        nested_page_update.delay(
            page_id=page.id,
            action=PageAction.MADE_PUBLIC if access == 0 else PageAction.MADE_PRIVATE,
            project_id=project_id,
            slug=slug,
            user_id=request.user.id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        search = request.query_params.get("search")
        page_type = request.query_params.get("type", "public")

        sub_pages_count = (
            Page.objects.filter(parent=OuterRef("id"))
            .order_by()
            .values("parent")
            .annotate(count=Count("id"))
            .values("count")[:1]
        )

        filters = Q()
        if search:
            filters &= Q(name__icontains=search)

        if page_type == "private":
            filters &= Q(access=1)
        elif page_type == "archived":
            filters &= Q(archived_at__isnull=False)
        elif page_type == "public":
            filters &= Q(parent__isnull=True)

        queryset = (
            self.get_queryset()
            .annotate(sub_pages_count=Subquery(sub_pages_count))
            .filter(filters)
        )

        project = Project.objects.get(pk=project_id)
        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=5,
                is_active=True,
            ).exists()
            and not project.guest_view_all_features
        ):
            queryset = queryset.filter(owned_by=request.user)

        pages = PageSerializer(queryset, many=True).data
        return Response(pages, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], model=Page, creator=True, field="owned_by")
    def archive(self, request, slug, project_id, pk):
        page = Page.objects.get(pk=pk, workspace__slug=slug, projects__id=project_id)

        # only the owner or admin can archive the page
        if (
            ProjectMember.objects.filter(
                project_id=project_id, member=request.user, is_active=True, role__lte=15
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only the owner or admin can archive the page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        page.archived_at = timezone.now()
        page.save()

        # archive the sub pages
        nested_page_update.delay(
            page_id=str(pk),
            action=PageAction.ARCHIVED,
            project_id=project_id,
            slug=slug,
            user_id=request.user.id,
        )

        return Response({"archived_at": str(datetime.now())}, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], model=Page, creator=True, field="owned_by")
    def unarchive(self, request, slug, project_id, pk):
        page = Page.objects.get(pk=pk, workspace__slug=slug, projects__id=project_id)

        # check if the parent page is still archived, if its archived then throw error.
        parent_page = Page.objects.filter(pk=page.parent_id).first()
        if parent_page and parent_page.archived_at:
            return Response(
                {"error": "The parent page should be restored first"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # only the owner or admin can un archive the page
        if (
            ProjectMember.objects.filter(
                project_id=project_id, member=request.user, is_active=True, role__lte=15
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only the owner or admin can un archive the page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        page.archived_at = None
        page.save()

        nested_page_update.delay(
            page_id=page.id,
            action=PageAction.UNARCHIVED,
            project_id=project_id,
            slug=slug,
            user_id=request.user.id,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN], model=Page, creator=True, field="owned_by")
    def destroy(self, request, slug, project_id, pk):
        page = Page.objects.get(pk=pk, workspace__slug=slug, projects__id=project_id)

        if page.archived_at is None:
            return Response(
                {"error": "The page should be archived before deleting"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page.owned_by_id != request.user.id and (
            not ProjectMember.objects.filter(
                workspace__slug=slug,
                member=request.user,
                role=20,
                project_id=project_id,
                is_active=True,
            ).exists()
        ):
            return Response(
                {"error": "Only admin or owner can delete the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # remove parent from all the children
        _ = Page.objects.filter(
            parent_id=pk, projects__id=project_id, workspace__slug=slug
        ).update(parent=None)

        page.delete()
        # Delete the user favorite page
        UserFavorite.objects.filter(
            project=project_id,
            workspace__slug=slug,
            entity_identifier=pk,
            entity_type="page",
        ).delete()
        # Delete the page from recent visit
        UserRecentVisit.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            entity_identifier=pk,
            entity_name="page",
        ).delete(soft=False)
        # Delete the deploy board
        DeployBoard.objects.filter(
            entity_name="page", entity_identifier=pk, workspace__slug=slug
        ).delete()

        nested_page_update.delay(
            page_id=page.id,
            action=PageAction.DELETED,
            project_id=project_id,
            slug=slug,
            user_id=request.user.id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def sub_pages(self, request, slug, project_id, page_id):
        pages = (
            Page.all_objects.filter(
                workspace__slug=slug, projects__id=project_id, parent_id=page_id
            )
            .annotate(
                project_ids=Coalesce(
                    ArrayAgg(
                        "projects__id", distinct=True, filter=~Q(projects__id=True)
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                )
            )
            .annotate(
                sub_pages_count=Page.objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
        )
        serializer = PageLiteSerializer(pages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def parent_pages(self, request, slug, project_id, page_id):
        page_ids = get_all_parent_ids(page_id)

        pages = Page.objects.filter(
            workspace__slug=slug, projects__id=project_id, id__in=page_ids
        ).annotate(
            project_ids=Coalesce(
                ArrayAgg("projects__id", distinct=True, filter=~Q(projects__id=True)),
                Value([], output_field=ArrayField(UUIDField())),
            )
        )

        # Convert queryset to a dictionary keyed by id
        page_map = {str(page.id): page for page in pages}

        # Rebuild ordered list based on page_ids
        ordered_pages = [page_map[str(pid)] for pid in page_ids if str(pid) in page_map]

        serializer = PageLiteSerializer(ordered_pages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PageFavoriteViewSet(BaseViewSet):
    model = UserFavorite

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id, pk):
        _ = UserFavorite.objects.create(
            project_id=project_id,
            entity_identifier=pk,
            entity_type="page",
            user=request.user,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, pk):
        page_favorite = UserFavorite.objects.get(
            project=project_id,
            user=request.user,
            workspace__slug=slug,
            entity_identifier=pk,
            entity_type="page",
        )
        page_favorite.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PageLogEndpoint(BaseAPIView):
    serializer_class = PageLogSerializer
    model = PageLog

    def post(self, request, slug, project_id, page_id):
        serializer = PageLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id, page_id=page_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, slug, project_id, page_id, transaction):
        page_transaction = PageLog.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            page_id=page_id,
            transaction=transaction,
        )
        serializer = PageLogSerializer(
            page_transaction, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, project_id, page_id, transaction):
        transaction = PageLog.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            page_id=page_id,
            transaction=transaction,
        )
        # Delete the transaction object
        transaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PagesDescriptionViewSet(BaseViewSet):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def retrieve(self, request, slug, project_id, pk):
        page = (
            Page.objects.filter(pk=pk, workspace__slug=slug, projects__id=project_id)
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .first()
        )
        if page is None:
            return Response({"error": "Page not found"}, status=404)
        binary_data = page.description_binary

        def stream_data():
            if binary_data:
                yield binary_data
            else:
                yield b""

        response = StreamingHttpResponse(
            stream_data(), content_type="application/octet-stream"
        )
        response["Content-Disposition"] = 'attachment; filename="page_description.bin"'
        return response

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def partial_update(self, request, slug, project_id, pk):
        page = (
            Page.objects.filter(pk=pk, workspace__slug=slug, projects__id=project_id)
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .first()
        )

        if page is None:
            return Response({"error": "Page not found"}, status=404)

        if page.is_locked:
            return Response(
                {
                    "error_code": ERROR_CODES["PAGE_LOCKED"],
                    "error_message": "PAGE_LOCKED",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page.archived_at:
            return Response(
                {
                    "error_code": ERROR_CODES["PAGE_ARCHIVED"],
                    "error_message": "PAGE_ARCHIVED",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Serialize the existing instance
        existing_instance = json.dumps(
            {"description_html": page.description_html}, cls=DjangoJSONEncoder
        )

        # Get the base64 data from the request
        base64_data = request.data.get("description_binary")

        # If base64 data is provided
        if base64_data:
            # Decode the base64 data to bytes
            new_binary_data = base64.b64decode(base64_data)
            # capture the page transaction
            if request.data.get("description_html"):
                page_transaction.delay(
                    new_value=request.data, old_value=existing_instance, page_id=pk
                )
            # Store the updated binary data
            page.name = request.data.get("name", page.name)
            page.description_binary = new_binary_data
            page.description_html = request.data.get("description_html")
            page.description = request.data.get("description")
            page.save()
            # Return a success response
            page_version.delay(
                page_id=page.id,
                existing_instance=existing_instance,
                user_id=request.user.id,
            )
            return Response({"message": "Updated successfully"})
        else:
            return Response({"error": "No binary data provided"})


class PageDuplicateEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def post(self, request, slug, project_id, page_id):
        page = Page.objects.get(
            id=page_id, workspace__slug=slug, projects__id=project_id
        )

        # check for permission
        if page.access == Page.PRIVATE_ACCESS and page.owned_by_id != request.user.id:
            return Response(
                {"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        # update the descendants pages with the current page
        nested_page_update.delay(
            page_id=page_id,
            action=PageAction.DUPLICATED,
            project_id=project_id,
            slug=slug,
            user_id=request.user.id,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
