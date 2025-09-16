import { TPageComment, JSONContent } from "@plane/types";
import { TCommentInstance } from "@/plane-web/store/pages/comments/comment-instance";
import { TCommentFilters } from "@/plane-web/store/pages/comments/comment.store";
import { TPageInstance } from "@/store/pages/base-page";
import { TPageRootHandlers } from "../../editor";

// Comment related types
export interface CommentData {
  id: string;
  actor_detail: { display_name: string };
  created_at: string;
  comment_html: string;
  comment_stripped: string;
  node_identifier?: string;
  node_type?: string;
  parent_id?: string | null;
  is_resolved?: boolean;
  reactions?: { [emoji: string]: string[] };
  reference_text?: string;
  total_replies?: number;
  hasReplies?: boolean;
}

export interface PendingComment {
  selection: { from: number; to: number };
  referenceText?: string;
}

export interface CommentFilters {
  showAll: boolean;
  showActive: boolean;
  showResolved: boolean;
}

// Navigation pane props types
export interface NavigationPaneRootProps {
  handleClose: () => void;
  isNavigationPaneOpen: boolean;
  page: TPageInstance;
  versionHistory: Pick<TPageRootHandlers, "fetchAllVersions" | "fetchVersionDetails">;
  selectedCommentId?: string;
  onCommentSelect?: (commentId: string | undefined) => void;
  onCommentClick?: (commentId: string) => void;
  pendingComment?: PendingComment;
  onPendingCommentCancel?: () => void;
}

export interface CommentItemProps {
  data: CommentItemData;
  actions: CommentItemActions;
}

// Data/Actions Pattern Interfaces
export interface CommentBoxData {
  placeholder: string;
  isReply: boolean;
  autoFocus: boolean;
  isSubmitting: boolean;
  workspaceSlug?: string;
  pageId?: string;
  commentSelection?: {
    from: number;
    to: number;
    referenceText?: string;
  } | null;
}

export interface CommentBoxActions {
  onSubmit?: (content: string) => void;
  onCancel?: (e?: React.MouseEvent) => void;
  createComment?: (data: Partial<TPageComment>) => Promise<TCommentInstance>;
  onCommentCreated?: (data: {
    description: {
      description_html: string;
      description_json: JSONContent;
      description_stripped: string;
    };
    reference_stripped?: string;
  }) => Promise<any>;
}

export interface CommentBoxProps {
  data: CommentBoxData;
  actions: CommentBoxActions;
}

export interface CommentItemData {
  comment: TCommentInstance;
  page: TPageInstance;
  isSelected: boolean;
  referenceText?: string;
  workspaceSlug: string;
  showReplies: boolean;
  showReplyBox: boolean;
  isSubmittingReply: boolean;
  isHovered: boolean;
  isResolving: boolean;
  threadComments: TCommentInstance[];
}

export interface CommentItemActions {
  onSelect: () => void;
  onCommentCreated?: (commentId: string, threadId: string) => void;
  onReply: (content: string) => Promise<void>;
  onResolve: (e: React.MouseEvent) => Promise<void>;
  onShowRepliesToggle: (e: React.MouseEvent) => void;
  onReplyToggle: (e: React.MouseEvent) => void;
  onHoverChange: (isHovered: boolean) => void;
}

export interface ThreadsSidebarData {
  page: TPageInstance;
  selectedThreadId?: string;
  workspaceSlug: string;
  isLoading: boolean;
  showNewCommentBox: boolean;
  newCommentSelection: {
    from: number;
    to: number;
    referenceText?: string;
  } | null;
  filters: TCommentFilters;
  allBaseComments: TCommentInstance[];
  filteredComments: TCommentInstance[];
}

export interface ThreadsSidebarActions {
  onFilterChange: (filterKey: "showAll" | "showActive" | "showResolved") => void;
}

export interface CommentHeaderProps {
  comment: TCommentInstance;
  isHovered: boolean;
  isResolving: boolean;
  onResolve: (e: React.MouseEvent) => void;
}

export interface CommentActionsProps {
  comment: TCommentInstance;
  showReplies: boolean;
  onShowRepliesToggle: (e: React.MouseEvent) => void;
}

// Tab panel types
export interface TabPanelProps {
  page: TPageInstance;
}

export interface InfoTabPanelProps extends TabPanelProps {
  versionHistory: Pick<TPageRootHandlers, "fetchAllVersions" | "fetchVersionDetails">;
}

// Export generic extension system interfaces
export type {
  INavigationPaneExtensionProps,
  INavigationPaneExtensionComponent,
  INavigationPaneExtension,
} from "./extensions";
