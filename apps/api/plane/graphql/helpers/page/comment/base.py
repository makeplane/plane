# Python Imports
from typing import Optional

# Third Party Imports
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import F, Func, OuterRef, QuerySet
from django.utils import timezone

# Strawberry Imports
from strawberry.exceptions import GraphQLError

# Module Imports
from plane.db.models import Description
from plane.ee.models import PageComment
from plane.graphql.types.page.comment.base import (
    PageCommentListType,
    PageCommentType,
    PageCommentUpdateTypeEnum,
    PageCommentWithReactionsListType,
)

# Local Imports
from .feature_flag import is_page_comment_feature_flagged
from ...project import _get_project
from ...workspace import _get_workspace


# constructing page query
def page_comment_base_query(
    user_id: str,
    workspace_slug: str,
    page_id: str,
    project_id: Optional[str] = None,
    parent_id: Optional[str] = None,
    comment_id: Optional[str] = None,
    is_root: Optional[bool] = False,
    order_by: Optional[str] = "-created_at",
    update_type: Optional[PageCommentUpdateTypeEnum] = None,
    comment_ids: Optional[list[str]] = None,
) -> QuerySet:
    # Feature Flag validation
    is_page_comment_feature_flagged(workspace_slug=workspace_slug, user_id=user_id)

    # validating workspace
    workspace = _get_workspace(workspace_slug=workspace_slug)
    workspace_slug = workspace.slug

    # validating project
    project = None
    if project_id:
        project = _get_project(workspace_slug=workspace_slug, project_id=project_id)
        project = project.id

    # Base query for page comments
    if update_type and update_type == PageCommentUpdateTypeEnum.RESTORED:
        base_query = PageComment.all_objects
    else:
        base_query = PageComment.objects

    base_query = base_query.filter(workspace__slug=workspace_slug, page_id=page_id)

    # project filter
    if project:
        base_query = base_query.filter(project_id=project)
    else:
        base_query = base_query.filter(project_id__isnull=True)

    # root comment filter
    if is_root:
        base_query = base_query.filter(parent_id__isnull=True)
    else:
        if parent_id:
            # check if parent id is a valid comment id
            page_parent_comment = PageComment.objects.filter(
                page_id=page_id, id=parent_id
            ).first()
            if not page_parent_comment:
                message = "Parent comment not found"
                error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
                raise GraphQLError(message, extensions=error_extensions)

            base_query = base_query.filter(parent_id=parent_id)

    # comment filter
    if comment_id:
        base_query = base_query.filter(id=comment_id)

    # comment ids filter
    if comment_ids:
        base_query = base_query.filter(id__in=comment_ids)

    # Order by
    base_query = base_query.order_by(order_by)

    return base_query


# listing page comments
def get_page_comments(
    user_id: str,
    workspace_slug: str,
    page_id: str,
    project_id: Optional[str] = None,
    parent_id: Optional[str] = None,
    comment_id: Optional[str] = None,
    is_root: Optional[bool] = False,
    order_by: Optional[str] = "-created_at",
    update_type: Optional[PageCommentUpdateTypeEnum] = None,
    comment_ids: Optional[list[str]] = None,
) -> list[PageCommentListType]:
    base_query = page_comment_base_query(
        user_id=user_id,
        workspace_slug=workspace_slug,
        page_id=page_id,
        project_id=project_id,
        parent_id=parent_id,
        comment_id=comment_id,
        is_root=is_root,
        order_by=order_by,
        update_type=update_type,
        comment_ids=comment_ids,
    )

    base_query = (
        base_query.prefetch_related("workspace")
        .select_related("description")
        .annotate(
            total_replies=PageComment.objects.filter(
                workspace__slug=workspace_slug, page_id=page_id, parent=OuterRef("id")
            )
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count")
        )
    )

    page_comments = base_query.all()

    return list(page_comments)


# listing page comments async
@sync_to_async
def get_page_comments_async(
    user_id: str,
    workspace_slug: str,
    page_id: str,
    project_id: Optional[str] = None,
    parent_id: Optional[str] = None,
    comment_id: Optional[str] = None,
    is_root: Optional[bool] = False,
    order_by: Optional[str] = "-created_at",
    update_type: Optional[PageCommentUpdateTypeEnum] = None,
    comment_ids: Optional[list[str]] = None,
) -> list[PageCommentListType]:
    return get_page_comments(
        workspace_slug=workspace_slug,
        project_id=project_id,
        page_id=page_id,
        user_id=user_id,
        parent_id=parent_id,
        comment_id=comment_id,
        is_root=is_root,
        order_by=order_by,
        update_type=update_type,
        comment_ids=comment_ids,
    )


# listing page comments
def get_page_comment_replies(
    user_id: str,
    workspace_slug: str,
    page_id: str,
    project_id: Optional[str] = None,
    parent_id: Optional[str] = None,
    comment_id: Optional[str] = None,
    is_root: Optional[bool] = False,
    order_by: Optional[str] = "-created_at",
    update_type: Optional[PageCommentUpdateTypeEnum] = None,
) -> list[PageCommentWithReactionsListType]:
    base_query = page_comment_base_query(
        user_id=user_id,
        workspace_slug=workspace_slug,
        page_id=page_id,
        project_id=project_id,
        parent_id=parent_id,
        comment_id=comment_id,
        is_root=is_root,
        order_by=order_by,
        update_type=update_type,
    )

    base_query = base_query.prefetch_related("workspace").select_related("description")

    page_comments = base_query.all()

    return list(page_comments)


# listing page comments async
@sync_to_async
def get_page_comment_replies_async(
    user_id: str,
    workspace_slug: str,
    page_id: str,
    project_id: Optional[str] = None,
    parent_id: Optional[str] = None,
    comment_id: Optional[str] = None,
    is_root: Optional[bool] = False,
    order_by: Optional[str] = "-created_at",
    update_type: Optional[PageCommentUpdateTypeEnum] = None,
) -> list[PageCommentWithReactionsListType]:
    return get_page_comment_replies(
        workspace_slug=workspace_slug,
        project_id=project_id,
        page_id=page_id,
        user_id=user_id,
        parent_id=parent_id,
        comment_id=comment_id,
        is_root=is_root,
        order_by=order_by,
        update_type=update_type,
    )


# getting page comment
def get_page_comment(
    user_id: str,
    workspace_slug: str,
    page_id: str,
    comment_id: str,
    project_id: Optional[str] = None,
) -> PageCommentType:
    try:
        base_query = page_comment_base_query(
            user_id=user_id,
            workspace_slug=workspace_slug,
            page_id=page_id,
            comment_id=comment_id,
            project_id=project_id,
        )

        page_comment = base_query.first()

        if not page_comment and page_comment is None:
            message = "Page comment not found"
            error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
            raise GraphQLError(message, extensions=error_extensions)

        return page_comment
    except PageComment.DoesNotExist:
        message = "Page comment not found"
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)
    except Exception as e:
        message = e.message if hasattr(e, "message") else "Error getting page comment"
        error_extensions = (
            {"code": "SOMETHING_WENT_WRONG", "statusCode": 400}
            if not hasattr(e, "extensions")
            else e.extensions
        )
        raise GraphQLError(message, extensions=error_extensions)


# getting page comment async
@sync_to_async
def get_page_comment_async(
    user_id: str,
    workspace_slug: str,
    page_id: str,
    comment_id: str,
    project_id: Optional[str] = None,
) -> PageCommentType:
    return get_page_comment(
        user_id=user_id,
        workspace_slug=workspace_slug,
        page_id=page_id,
        comment_id=comment_id,
        project_id=project_id,
    )


# creating description
def _create_description(
    workspace_id: str,
    project_id: Optional[str] = None,
    description_html: Optional[str] = None,
    description_json: Optional[dict] = None,
) -> Description:
    try:
        # Description data
        description_data = {
            "workspace_id": workspace_id,
            "project_id": None,
            "description_html": None,
            "description_json": None,
        }

        # Project id
        if project_id is not None:
            description_data["project_id"] = project_id

        # Description html
        if description_html is not None:
            description_data["description_html"] = description_html

        # Description json
        if description_json is not None:
            description_data["description_json"] = description_json

        # Remove None values from description data
        description_data = {k: v for k, v in description_data.items() if v is not None}

        description = Description.objects.create(**description_data)
        return description
    except Exception:
        message = "Error creating description"
        error_extensions = {"code": "SOMETHING_WENT_WRONG", "statusCode": 400}
        raise GraphQLError(message, extensions=error_extensions)


# creating page comment
def create_page_comment(
    user_id: str,
    workspace_slug: str,
    page_id: str,
    project_id: Optional[str] = None,
    parent_id: Optional[str] = None,
    description_html: Optional[str] = None,
    description_json: Optional[dict] = None,
    reference_stripped: Optional[str] = None,
) -> PageCommentListType | PageCommentWithReactionsListType:
    try:
        is_page_comment_feature_flagged(workspace_slug=workspace_slug, user_id=user_id)

        # Get workspace
        workspace = _get_workspace(workspace_slug=workspace_slug)
        workspace_id = workspace.id

        # Comment data
        comment_data = {
            "workspace_id": workspace_id,
            "page_id": page_id,
            "project_id": None,
            "description_id": None,
            "parent_id": None,
            "is_resolved": None,
            "edited_at": None,
            "reference_stripped": None,
        }

        # Project id
        if project_id is not None:
            project = _get_project(workspace_slug=workspace_slug, project_id=project_id)
            comment_data["project_id"] = project.id

        # Parent id
        if parent_id is not None:
            comment_data["parent_id"] = parent_id

        # Reference stripped
        if reference_stripped is not None:
            comment_data["reference_stripped"] = reference_stripped

        # creating the description
        description = _create_description(
            workspace_id=workspace_id,
            project_id=project_id,
            description_html=description_html,
            description_json=description_json,
        )
        comment_data["description_id"] = description.id if description else None
        comment_data["edited_at"] = timezone.now()

        # Remove None values from comment_data
        comment_data = {k: v for k, v in comment_data.items() if v is not None}

        # Create page comment
        page_comment = PageComment.objects.create(**comment_data)

        # Get page comment
        if page_comment and page_comment.id:
            if parent_id:
                # Get page comment replies
                page_comments = get_page_comment_replies(
                    user_id=user_id,
                    workspace_slug=workspace_slug,
                    page_id=page_id,
                    project_id=project_id,
                    parent_id=parent_id,
                    comment_id=page_comment.id,
                )
                page_comment = (
                    page_comments[0]
                    if page_comments and len(page_comments) > 0
                    else None
                )
            else:
                # Get page comment
                page_comments = get_page_comments(
                    user_id=user_id,
                    workspace_slug=workspace_slug,
                    page_id=page_id,
                    project_id=project_id,
                    comment_id=page_comment.id,
                )
                page_comment = (
                    page_comments[0]
                    if page_comments and len(page_comments) > 0
                    else None
                )

        return page_comment
    except Exception:
        message = "Error creating page comment"
        error_extensions = {"code": "SOMETHING_WENT_WRONG", "statusCode": 400}
        raise GraphQLError(message, extensions=error_extensions)


# creating page comment async
@sync_to_async
def create_page_comment_async(
    user_id: str,
    workspace_slug: str,
    page_id: str,
    project_id: Optional[str] = None,
    parent_id: Optional[str] = None,
    description_html: Optional[str] = None,
    description_json: Optional[dict] = None,
    reference_stripped: Optional[str] = None,
) -> PageCommentListType | PageCommentWithReactionsListType:
    return create_page_comment(
        user_id=user_id,
        workspace_slug=workspace_slug,
        page_id=page_id,
        project_id=project_id,
        parent_id=parent_id,
        description_html=description_html,
        description_json=description_json,
        reference_stripped=reference_stripped,
    )


# updating page comment
def partial_update_page_comment(
    user_id: str,
    workspace_slug: str,
    page_id: str,
    comment_id: str,
    update_type: PageCommentUpdateTypeEnum,
    project_id: Optional[str] = None,
    description_html: Optional[str] = None,
    description_json: Optional[dict] = None,
    reference_stripped: Optional[str] = None,
) -> PageCommentType | bool:
    try:
        is_page_comment_feature_flagged(workspace_slug=workspace_slug, user_id=user_id)

        # get page comment
        page_comments = get_page_comments(
            user_id=user_id,
            workspace_slug=workspace_slug,
            project_id=project_id,
            page_id=page_id,
            comment_id=comment_id,
            update_type=update_type,
        )
        page_comment = (
            page_comments[0] if page_comments and len(page_comments) > 0 else None
        )

        if not page_comment:
            message = "Page comment not found"
            error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
            raise GraphQLError(message, extensions=error_extensions)

        page_comment_description_id = page_comment.description_id

        if update_type == PageCommentUpdateTypeEnum.UPDATE:
            # get description
            description = Description.objects.get(id=page_comment_description_id)

            # update description
            if description_html is not None:
                description.description_html = description_html
            if description_json is not None:
                description.description_json = description_json
            if reference_stripped is not None:
                page_comment.reference_stripped = reference_stripped

            description.save()

            # update page comment
            page_comment.edited_at = timezone.now()
            page_comment.save()

            return page_comment
        elif update_type == PageCommentUpdateTypeEnum.RESOLVE:
            if page_comment.parent_id:
                message = "Cannot resolve a reply comment"
                error_extensions = {"code": "INVALID_REQUEST", "statusCode": 400}
                raise GraphQLError(message, extensions=error_extensions)

            page_comment.is_resolved = True
            page_comment.save()

            return page_comment
        elif update_type == PageCommentUpdateTypeEnum.UN_RESOLVE:
            if page_comment.parent_id:
                message = "Cannot un-resolve a reply comment"
                error_extensions = {"code": "INVALID_REQUEST", "statusCode": 400}
                raise GraphQLError(message, extensions=error_extensions)

            page_comment.is_resolved = False
            page_comment.save()

            return page_comment
        elif update_type == PageCommentUpdateTypeEnum.DELETE:
            page_comment.delete()

            return True
        elif update_type == PageCommentUpdateTypeEnum.RESTORED:
            page_comment.deleted_at = None
            page_comment.save()

            return page_comment
    except Exception as e:
        message = e.message if hasattr(e, "message") else "Error updating page comment"
        error_extensions = (
            {"code": "SOMETHING_WENT_WRONG", "statusCode": 400}
            if not hasattr(e, "extensions")
            else e.extensions
        )
        raise GraphQLError(message, extensions=error_extensions)


# updating page comment async
@sync_to_async
def partial_update_page_comment_async(
    user_id: str,
    workspace_slug: str,
    page_id: str,
    comment_id: str,
    update_type: PageCommentUpdateTypeEnum,
    project_id: Optional[str] = None,
    description_html: Optional[str] = None,
    description_json: Optional[dict] = None,
    reference_stripped: Optional[str] = None,
) -> PageCommentType | bool:
    return partial_update_page_comment(
        user_id=user_id,
        workspace_slug=workspace_slug,
        page_id=page_id,
        update_type=update_type,
        project_id=project_id,
        comment_id=comment_id,
        description_html=description_html,
        description_json=description_json,
        reference_stripped=reference_stripped,
    )
