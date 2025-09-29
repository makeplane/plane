from .comment import (
    ProjectPageCommentReactionsMutation,
    ProjectPageCommentsMutation,
    WorkspacePageCommentReactionsMutation,
    WorkspacePageCommentsMutation,
)
from .favorite import PageFavoriteMutation
from .page_descendants import (
    NestedChildArchivePageMutation,
    NestedChildDeletePageMutation,
    NestedChildRestorePageMutation,
    WorkspaceNestedChildArchivePageMutation,
    WorkspaceNestedChildDeletePageMutation,
    WorkspaceNestedChildRestorePageMutation,
)
from .project import PageMutation
from .workspace import WorkspacePageMutation
