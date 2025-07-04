# python imports
from dataclasses import dataclass, field

# Third-party library imports
import strawberry


@strawberry.input
@dataclass
class CommentReactionInput:
    reaction: str = field()


@strawberry.type
class CommentReactionType:
    reaction: str
    user_ids: list[strawberry.ID]
