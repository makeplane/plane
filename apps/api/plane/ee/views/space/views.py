# Python imports
import copy

# Django imports
from django.db.models import F, Q, Prefetch, OuterRef, Func

# Third Party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

# Module imports
from .base import BaseAPIView

# fetch the space app grouper function separately
from plane.space.utils.grouper import (
    issue_group_values,
    issue_on_results,
    issue_queryset_grouper,
)
from plane.utils.order_queryset import order_issue_queryset
from plane.utils.paginator import GroupedOffsetPaginator, SubGroupedOffsetPaginator
from plane.db.models import (
    Issue,
    IssueReaction,
    DeployBoard,
    IssueVote,
    IssueView,
    IssueLink,
    FileAsset,
)
from plane.utils.issue_filters import issue_filters
from plane.ee.serializers import ViewsPublicSerializer, ViewsPublicMetaSerializer
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import ErrorCodes
from plane.utils.filters import ComplexFilterBackend
from plane.utils.filters import IssueFilterSet


class ViewsMetaDataEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def get(self, request, anchor):
        try:
            deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="view")
        except DeployBoard.DoesNotExist:
            return Response(
                {"error": "View is not published"}, status=status.HTTP_404_NOT_FOUND
            )

        if check_workspace_feature_flag(
            feature_key=FeatureFlag.VIEW_PUBLISH, slug=deploy_board.workspace.slug
        ):
            try:
                issue_view_id = deploy_board.entity_identifier
                issue_view = IssueView.objects.get(id=issue_view_id)
            except IssueView.DoesNotExist:
                return Response(
                    {"error": "View is not published"}, status=status.HTTP_404_NOT_FOUND
                )

            serializer = ViewsPublicMetaSerializer(issue_view)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(
                {
                    "error": "Payment required",
                    "error_code": ErrorCodes.PAYMENT_REQUIRED.value,
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )


class ViewsPublicEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def get(self, request, anchor):
        # Get the deploy board object
        deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="view")
        # Check if the workspace has access to feature
        if check_workspace_feature_flag(
            feature_key=FeatureFlag.VIEW_PUBLISH, slug=deploy_board.workspace.slug
        ):
            # Get the views object
            views = IssueView.objects.get(pk=deploy_board.entity_identifier)
            serializer = ViewsPublicSerializer(views)
            return Response(serializer.data, status=status.HTTP_200_OK)
        # Check if the workspace has access to feature
        else:
            return Response(
                {
                    "error": "Payment required",
                    "error_code": ErrorCodes.PAYMENT_REQUIRED.value,
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )


class IssueViewsPublicEndpoint(BaseAPIView):
    permission_classes = [AllowAny]
    filter_backends = (ComplexFilterBackend,)
    filterset_class = IssueFilterSet

    def apply_annotations(self, issue_queryset):
        return (
            issue_queryset.annotate(
                link_count=IssueLink.objects.filter(issue=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                attachment_count=FileAsset.objects.filter(
                    entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                    issue_id=OuterRef("id"),
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(cycle_id=F("issue_cycle__cycle_id"))
            .prefetch_related("assignees", "labels", "issue_module__module")
            .prefetch_related(
                Prefetch(
                    "issue_reactions",
                    queryset=IssueReaction.objects.select_related("actor"),
                )
            )
            .prefetch_related(
                Prefetch("votes", queryset=IssueVote.objects.select_related("actor"))
            )
        )

    def get(self, request, anchor):
        # Get the deploy board object
        deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="view")
        if not deploy_board:
            return Response(
                {"error": "View is not published"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if the workspace has access to feature
        if check_workspace_feature_flag(
            feature_key=FeatureFlag.VIEW_PUBLISH, slug=deploy_board.workspace.slug
        ):
            project_id = deploy_board.project_id
            slug = deploy_board.workspace.slug

            # Get the views object
            view = IssueView.objects.get(
                pk=deploy_board.entity_identifier, project_id=project_id
            )
            filters = issue_filters(request.query_params, "GET")
            order_by_param = request.GET.get("order_by", "-created_at")

            issue_queryset = Issue.issue_objects.filter(
                workspace__slug=slug, project_id=project_id
            )

            if view.rich_filters:
                issue_queryset = ComplexFilterBackend().filter_queryset(
                    request, issue_queryset, self, view.rich_filters
                )

            issue_queryset = issue_queryset.distinct()

            # Apply legacy filters
            issue_queryset = issue_queryset.filter(**filters)
            # Total count queryset
            total_issue_queryset = copy.deepcopy(issue_queryset)

            # Applying annotations to the issue queryset
            issue_queryset = self.apply_annotations(issue_queryset)

            # Issue queryset
            issue_queryset, order_by_param = order_issue_queryset(
                issue_queryset=issue_queryset, order_by_param=order_by_param
            )

            # Group by
            group_by = request.GET.get("group_by", False)
            sub_group_by = request.GET.get("sub_group_by", False)

            # issue queryset
            issue_queryset = issue_queryset_grouper(
                queryset=issue_queryset, group_by=group_by, sub_group_by=sub_group_by
            )

            if group_by:
                if sub_group_by:
                    if group_by == sub_group_by:
                        return Response(
                            {
                                "error": "Group by and sub group by cannot have same parameters"
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    else:
                        return self.paginate(
                            request=request,
                            order_by=order_by_param,
                            queryset=issue_queryset,
                            total_count_queryset=total_issue_queryset,
                            on_results=lambda issues: issue_on_results(
                                group_by=group_by,
                                issues=issues,
                                sub_group_by=sub_group_by,
                            ),
                            paginator_cls=SubGroupedOffsetPaginator,
                            group_by_fields=issue_group_values(
                                field=group_by,
                                slug=slug,
                                project_id=project_id,
                                filters=filters,
                                queryset=total_issue_queryset,
                            ),
                            sub_group_by_fields=issue_group_values(
                                field=sub_group_by,
                                slug=slug,
                                project_id=project_id,
                                filters=filters,
                                queryset=total_issue_queryset,
                            ),
                            group_by_field_name=group_by,
                            sub_group_by_field_name=sub_group_by,
                            count_filter=Q(
                                Q(issue_intake__status=1)
                                | Q(issue_intake__status=-1)
                                | Q(issue_intake__status=2)
                                | Q(issue_intake__isnull=True),
                                archived_at__isnull=True,
                                is_draft=False,
                            ),
                        )
                else:
                    # Group paginate
                    return self.paginate(
                        request=request,
                        order_by=order_by_param,
                        queryset=issue_queryset,
                        total_count_queryset=total_issue_queryset,
                        on_results=lambda issues: issue_on_results(
                            group_by=group_by, issues=issues, sub_group_by=sub_group_by
                        ),
                        paginator_cls=GroupedOffsetPaginator,
                        group_by_fields=issue_group_values(
                            field=group_by,
                            slug=slug,
                            project_id=project_id,
                            filters=filters,
                            queryset=total_issue_queryset,
                        ),
                        group_by_field_name=group_by,
                        count_filter=Q(
                            Q(issue_intake__status=1)
                            | Q(issue_intake__status=-1)
                            | Q(issue_intake__status=2)
                            | Q(issue_intake__isnull=True),
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
            else:
                return self.paginate(
                    order_by=order_by_param,
                    request=request,
                    queryset=issue_queryset,
                    total_count_queryset=total_issue_queryset,
                    on_results=lambda issues: issue_on_results(
                        group_by=group_by, issues=issues, sub_group_by=sub_group_by
                    ),
                )
        else:
            return Response(
                {
                    "error": "Payment required",
                    "error_code": ErrorCodes.PAYMENT_REQUIRED.value,
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )
