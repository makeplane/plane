# Python imports
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional

# Third Party Imports
import strawberry
import strawberry_django
from asgiref.sync import sync_to_async

# Strawberry imports
from strawberry.scalars import JSON

# Module imports
from plane.db.models import Description
from plane.ee.models import PageComment, PageCommentReaction
from plane.graphql.utils.timezone import user_timezone_converter

# Local Imports
from .reaction import PageCommentReactionCountType


@strawberry.enum
class PageCommentUpdateTypeEnum(Enum):
    UPDATE = "UPDATE"
    RESOLVE = "RESOLVE"
    UN_RESOLVE = "UN_RESOLVE"
    DELETE = "DELETE"
    RESTORED = "RESTORED"


@strawberry.input
@dataclass
class PageCommentInput:
    description_html: Optional[str] = None
    description_json: Optional[JSON] = None
    reference_stripped: Optional[str] = None


@strawberry_django.type(Description)
class PageCommentDescriptionType:
    id: str
    description_html: Optional[str] = None
    description_json: Optional[JSON] = None
    description_binary: Optional[str] = None
    description_stripped: Optional[str] = None

    @strawberry.field
    def workspace(self) -> str:
        return self.workspace_id

    @strawberry.field
    def project(self) -> Optional[str]:
        return self.project_id if self.project_id else None

    @strawberry.field
    def created_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.created_at)
        return converted_date

    @strawberry.field
    def updated_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.updated_at)
        return converted_date


@strawberry_django.type(PageComment)
class PageCommentType:
    id: str
    is_resolved: bool
    reference_stripped: Optional[str]

    @strawberry.field
    def workspace(self) -> str:
        return self.workspace_id

    @strawberry.field
    def project(self) -> Optional[str]:
        return self.project_id if self.project_id else None

    @strawberry.field
    def page(self) -> str:
        return self.page_id

    @strawberry.field
    def parent(self) -> Optional[str]:
        return self.parent_id if self.parent_id else None

    @strawberry.field
    def description(self) -> PageCommentDescriptionType:
        return self.description

    @strawberry.field
    def edited_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.edited_at)
        return converted_date

    @strawberry.field
    def created_by(self) -> Optional[str]:
        return self.created_by_id if self.created_by_id else None

    @strawberry.field
    def updated_by(self) -> Optional[str]:
        return self.updated_by_id if self.updated_by_id else None

    @strawberry.field
    def created_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.created_at)
        return converted_date

    @strawberry.field
    def updated_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.updated_at)
        return converted_date


@strawberry_django.type(PageComment)
class PageCommentWithReactionsListType(PageCommentType):
    @strawberry.field
    async def reactions_count(self) -> list[PageCommentReactionCountType]:
        comment_id = self.id

        comment_reactions = await sync_to_async(list)(
            PageCommentReaction.objects.filter(comment_id=comment_id)
            .values("reaction", "created_by_id")
            .distinct()
        )

        grouped = defaultdict(list)
        for reaction in comment_reactions:
            grouped[reaction["reaction"]].append(str(reaction["created_by_id"]))

        return [
            PageCommentReactionCountType(reaction=k, user_ids=v)
            for k, v in grouped.items()
        ]


@strawberry_django.type(PageComment)
class PageCommentListType(PageCommentWithReactionsListType):
    total_replies: int = 0

    @strawberry.field
    async def latest_reply(self) -> Optional[PageCommentWithReactionsListType]:
        page_id = self.page_id
        comment_id = self.id

        comment_latest_reply = await sync_to_async(list)(
            PageComment.objects.filter(
                page_id=page_id,
                parent_id=comment_id,
            )
            .prefetch_related("description")
            .order_by("-created_at")
        )

        if comment_latest_reply and len(comment_latest_reply) > 0:
            return comment_latest_reply[0]
        return None
