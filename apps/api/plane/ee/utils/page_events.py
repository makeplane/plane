from enum import Enum


class PageAction(str, Enum):
    SUB_PAGE = "sub_page"
    ARCHIVED = "archived"
    UNARCHIVED = "unarchived"
    LOCKED = "locked"
    UNLOCKED = "unlocked"
    MADE_PUBLIC = "made-public"
    MADE_PRIVATE = "made-private"
    PUBLISHED = "published"
    UNPUBLISHED = "unpublished"
    DUPLICATED = "duplicated"
    MOVED = "moved"
    MOVED_INTERNALLY = "moved_internally"
    DELETED = "deleted"
    RESTORED = "restored"
    SHARED = "shared"
    UNSHARED = "unshared"
    RESOLVED_COMMENT = "resolved_comment"
    UNRESOLVED_COMMENT = "unresolved_comment"
