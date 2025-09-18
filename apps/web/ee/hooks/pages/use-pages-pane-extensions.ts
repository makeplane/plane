import { useCallback, useMemo, useState, type RefObject } from "react";
import { useSearchParams } from "next/navigation";
import type { EditorRefApi, TCommentClickPayload } from "@plane/editor";
import {
  PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM,
  PAGE_NAVIGATION_PANE_TAB_KEYS,
  PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM,
} from "@/components/pages/navigation-pane";
import { useAppRouter } from "@/hooks/use-app-router";
import { useQueryParams } from "@/hooks/use-query-params";
import { PageCommentsNavigationExtension } from "@/plane-web/components/pages/comments/comments-navigation-extension";
import type { TPageNavigationPaneTab } from "@/plane-web/components/pages/navigation-pane";
import type {
  INavigationPaneExtension,
  TCommentsNavigationExtensionData,
} from "@/plane-web/types/pages/pane-extensions";
import type { TPageInstance } from "@/store/pages/base-page";

export type TPageExtensionHookParams = {
  page: TPageInstance;
  editorRef: RefObject<EditorRefApi>;
};

export const usePagesPaneExtensions = (params: TPageExtensionHookParams) => {
  const { page, editorRef } = params;

  // Comment-specific state - contained within the hook
  const [selectedCommentId, setSelectedCommentId] = useState<string | undefined>();
  const [pendingComment, setPendingComment] = useState<
    | {
        selection: { from: number; to: number };
        referenceText?: string;
      }
    | undefined
  >(undefined);

  // Generic infrastructure dependencies
  const router = useAppRouter();
  const { updateQueryParams } = useQueryParams();
  const searchParams = useSearchParams();

  // Comment-specific callbacks - all contained within hook
  const onCommentClick = useCallback(
    (payload: TCommentClickPayload, _referenceTextParagraph?: string) => {
      setSelectedCommentId(payload.primaryCommentId);

      const updatedRoute = updateQueryParams({
        paramsToAdd: { [PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM]: "comments" },
      });
      router.push(updatedRoute);
    },
    [router, updateQueryParams]
  );

  const onPendingCommentCancel = useCallback(() => {
    setPendingComment(undefined);
  }, []);

  const onSelectedThreadConsumed = useCallback(() => {
    setSelectedCommentId(undefined);
  }, []);

  const onCreateCommentMark = useCallback(
    (selection: { from: number; to: number }, commentId: string) => {
      if (editorRef.current) {
        const { from, to } = selection;
        editorRef.current.setCommentMark({ commentId, from, to });
      }
    },
    [editorRef]
  );

  const onStartNewComment = useCallback(
    (selection?: { from: number; to: number; referenceText?: string }) => {
      if (selection) {
        setPendingComment({
          selection: { from: selection.from, to: selection.to },
          referenceText: selection.referenceText,
        });
      }

      // Open comments navigation pane
      const updatedRoute = updateQueryParams({
        paramsToAdd: {
          paneTab: "comments",
        },
      });
      router.push(updatedRoute);
    },
    [router, updateQueryParams]
  );

  // Generic navigation pane logic - hook manages feature-specific routing
  const navigationPaneQueryParam = searchParams.get(
    PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM
  ) as TPageNavigationPaneTab | null;

  const isNavigationPaneOpen =
    (!!navigationPaneQueryParam && PAGE_NAVIGATION_PANE_TAB_KEYS.includes(navigationPaneQueryParam)) ||
    searchParams.get("paneTab") === "comments";

  const handleOpenNavigationPane = useCallback(() => {
    const updatedRoute = updateQueryParams({
      paramsToAdd: { [PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM]: "outline" },
    });
    router.push(updatedRoute);
  }, [router, updateQueryParams]);

  const handleCloseNavigationPane = useCallback(() => {
    const updatedRoute = updateQueryParams({
      paramsToRemove: [PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM, PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM],
    });
    router.push(updatedRoute);
    setSelectedCommentId(undefined);
    setPendingComment(undefined);
  }, [router, updateQueryParams]);

  // Editor extension handlers map - directly consumable by PageEditorBody
  const editorExtensionHandlers: Map<string, unknown> = useMemo(() => {
    const map: Map<string, unknown> = new Map();
    map.set("comments", {
      onClick: onCommentClick,
      onCreateCommentMark,
      onStartNewComment,
      onDelete: page.comments.deleteComment,
      onRestore: page.comments.restoreComment,
      onResolve: page.comments.resolveComment,
      onUnresolve: page.comments.unresolveComment,
      onCommentsOrderChange: page.comments.updateCommentsOrder,
      canComment: page.canCurrentUserCommentOnPage,
    });
    return map;
  }, [
    onCommentClick,
    onCreateCommentMark,
    onStartNewComment,
    page.comments.deleteComment,
    page.comments.restoreComment,
    page.comments.resolveComment,
    page.comments.unresolveComment,
    page.comments.updateCommentsOrder,
    page.canCurrentUserCommentOnPage,
  ]);

  const navigationPaneExtensions: INavigationPaneExtension[] = [
    {
      id: "comments",
      triggerParam: "comments",
      component: PageCommentsNavigationExtension,
      width: 361,
      data: {
        selectedCommentId,
        pendingComment,
        onPendingCommentCancel,
        onSelectedThreadConsumed,
        onClick: onCommentClick,
        onDelete: page.comments.deleteComment,
        onRestore: page.comments.restoreComment,
        onResolve: page.comments.resolveComment,
        onUnresolve: page.comments.unresolveComment,
        canComment: page.canCurrentUserCommentOnPage,
        onCommentsOrderChange: page.comments.updateCommentsOrder,
        onStartNewComment,
        onCreateCommentMark,
      } satisfies TCommentsNavigationExtensionData,
    },
  ];

  return {
    editorExtensionHandlers,
    navigationPaneExtensions,
    handleOpenNavigationPane,
    isNavigationPaneOpen,
    handleCloseNavigationPane,
  };
};
