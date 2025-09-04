import React, { useEffect, useMemo, useRef } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
// hooks
import { useRouterParams } from "@/hooks/store/use-router-params";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useScrollManager } from "@/plane-web/hooks/pages/use-scroll-manager";
import { TPageInstance } from "@/store/pages/base-page";
// local components
import { PageCommentCreationHandler } from "./comment-creation-handler";
import { PageCommentFilterControls } from "./comment-filter-controls";
import { PageCommentsEmptyState } from "./comments-empty-placeholder";
import { PageCommentsThreadList } from "./comments-thread-list";
import { PageCommentThreadLoader } from "./thread-loading-skeleton";

type CommentHandlers = {
  onPendingCommentCancel?: () => void;
  onRegisterStartNewComment?: (
    handler: (selection?: { from: number; to: number; referenceText?: string }) => void
  ) => void;
  onCreateCommentMark?: (selection: { from: number; to: number }, commentId: string) => void;
};

export type ThreadsSidebarProps = {
  page: TPageInstance;
  selectedThreadId?: string;
  pendingComment?: {
    selection: { from: number; to: number };
    referenceText?: string;
  };
  handlers?: CommentHandlers;
};

export const PageCommentsSidebarPanel = observer(function ThreadsSidebar({
  page,
  selectedThreadId,
  pendingComment,
  handlers = {},
}: ThreadsSidebarProps) {
  const { workspaceSlug } = useRouterParams();

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll management
  const { setItemRef, scrollToItem, scrollToElement } = useScrollManager(scrollContainerRef);

  // Store access
  const {
    comments: { updateCommentFilters, baseComments, filteredBaseComments, commentsFilters, isEmpty },
  } = page;

  const { getWorkspaceBySlug } = useWorkspace();
  const workspaceId = useMemo(
    () => (workspaceSlug ? (getWorkspaceBySlug(workspaceSlug?.toString())?.id ?? "") : ""),
    [getWorkspaceBySlug, workspaceSlug]
  );

  // Fetch comments
  const { isLoading } = useSWR(
    page.id ? `BASE-COMMENTS-${page.id}` : null,
    async () => {
      await page.comments.fetchPageComments();
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  // Register scroll callback with store
  useEffect(() => {
    page.comments.onScrollToPendingComment = (commentId: string) => {
      scrollToItem(commentId, { highlight: true });
    };

    return () => {
      page.comments.onScrollToPendingComment = null;
    };
  }, [page.comments, scrollToItem]);

  // Auto-scroll to selected thread
  useEffect(() => {
    if (selectedThreadId) {
      scrollToItem(selectedThreadId);
    }
  }, [selectedThreadId, scrollToItem]);

  if (isLoading && isEmpty && !page.comments.pendingScrollToComment) {
    return <PageCommentThreadLoader />;
  }

  return (
    <div className="w-[361px] h-full bg-custom-background-100 border-l border-custom-border-200 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-custom-border-200">
        <div className="flex justify-between items-start w-full">
          <h2 className="text-custom-text-100 text-base font-medium leading-6">Comments</h2>
          <PageCommentFilterControls filters={commentsFilters} onFilterChange={updateCommentFilters} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-1.5 pt-0 sidebar-scroll-container">
          {/* New Comment Section */}
          <PageCommentCreationHandler
            page={page}
            workspaceConfig={{
              workspaceSlug: workspaceSlug?.toString() || "",
              workspaceId,
            }}
            pendingComment={pendingComment}
            handlers={{
              ...handlers,
              onScrollToElement: scrollToElement,
            }}
          />

          {/* Comments List or Empty State */}
          {filteredBaseComments.length === 0 ? (
            <PageCommentsEmptyState hasComments={baseComments.length > 0} />
          ) : (
            <PageCommentsThreadList
              comments={filteredBaseComments}
              page={page}
              selectedThreadId={selectedThreadId}
              onSetItemRef={setItemRef}
            />
          )}
        </div>
      </div>
    </div>
  );
});
