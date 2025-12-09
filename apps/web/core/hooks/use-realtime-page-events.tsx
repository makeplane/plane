import { useCallback, useMemo } from "react";
// plane imports
import type { EventToPayloadMap } from "@plane/editor";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
// types
import type { IUserLite } from "@plane/types";
// components
import type { TEditorBodyHandlers } from "@/components/pages/editor/editor-body";
// hooks
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import type { EPageStoreType } from "@/plane-web/hooks/store";
import { usePageStore } from "@/plane-web/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";

// Type for page update handlers with proper typing for action data
export type PageUpdateHandler<T extends keyof EventToPayloadMap = keyof EventToPayloadMap> = (params: {
  pageIds: string[];
  data: EventToPayloadMap[T];
  performAction: boolean;
}) => void;

// Type for custom event handlers that can be provided to override default behavior
export type TCustomEventHandlers = {
  [K in keyof EventToPayloadMap]?: PageUpdateHandler<K>;
};

interface UsePageEventsProps {
  page: TPageInstance;
  storeType: EPageStoreType;
  getUserDetails: (userId: string) => IUserLite | undefined;
  customRealtimeEventHandlers?: TCustomEventHandlers;
  handlers: TEditorBodyHandlers;
}

export const useRealtimePageEvents = ({
  page,
  storeType,
  getUserDetails,
  customRealtimeEventHandlers,
  handlers,
}: UsePageEventsProps) => {
  const router = useAppRouter();
  const { removePage, getPageById } = usePageStore(storeType);

  const { data: currentUser } = useUser();

  // Helper function to safely get user display text
  const getUserDisplayText = useCallback(
    (userId: string | undefined) => {
      if (!userId) return "";
      try {
        const userDetails = getUserDetails(userId);
        return userDetails?.display_name ? ` by ${userDetails.display_name}` : "";
      } catch {
        return "";
      }
    },
    [getUserDetails]
  );

  const ACTION_HANDLERS = useMemo(
    function ACTION_HANDLERS() {
      return {
        archived: ({ pageIds, data }: { pageIds: string[]; data: EventToPayloadMap["archived"] }) => {
          pageIds.forEach((pageId) => {
            const pageItem = getPageById(pageId);
            if (pageItem) pageItem.archive({ archived_at: data.archived_at, shouldSync: false });
          });
        },

        unarchived: ({ pageIds }: { pageIds: string[] }) => {
          pageIds.forEach((pageId) => {
            const pageItem = getPageById(pageId);
            if (pageItem) pageItem.restore({ shouldSync: false });
          });
        },

        locked: ({ pageIds }: { pageIds: string[] }) => {
          pageIds.forEach((pageId) => {
            const pageItem = getPageById(pageId);
            if (pageItem) pageItem.lock({ shouldSync: false, recursive: false });
          });
        },

        unlocked: ({ pageIds }: { pageIds: string[] }) => {
          pageIds.forEach((pageId) => {
            const pageItem = getPageById(pageId);
            if (pageItem) pageItem.unlock({ shouldSync: false, recursive: false });
          });
        },

        "made-public": ({ pageIds }: { pageIds: string[] }) => {
          pageIds.forEach((pageId) => {
            const pageItem = getPageById(pageId);
            if (pageItem) pageItem.makePublic({ shouldSync: false });
          });
        },

        "made-private": ({ pageIds }: { pageIds: string[] }) => {
          pageIds.forEach((pageId) => {
            const pageItem = getPageById(pageId);
            if (pageItem) pageItem.makePrivate({ shouldSync: false });
          });
        },

        deleted: ({ pageIds, data }: { pageIds: string[]; data: EventToPayloadMap["deleted"] }) => {
          pageIds.forEach((pageId) => {
            const pageItem = getPageById(pageId);
            if (pageItem) {
              removePage({ pageId, shouldSync: false });
              if (page.id === pageId && data?.user_id !== currentUser?.id) {
                setToast({
                  type: TOAST_TYPE.ERROR,
                  title: "Page deleted",
                  message: `Page deleted${getUserDisplayText(data.user_id)}`,
                });
                router.push(handlers.getRedirectionLink());
              } else if (page.id === pageId) {
                router.push(handlers.getRedirectionLink());
              }
            }
          });
        },

        property_updated: ({ pageIds, data }: { pageIds: string[]; data: EventToPayloadMap["property_updated"] }) => {
          pageIds.forEach((pageId) => {
            const pageInstance = getPageById(pageId);
            const { name: updatedName, ...rest } = data;
            if (updatedName != null) pageInstance?.updateTitle(updatedName);
            pageInstance?.mutateProperties(rest);
          });
        },

        error: ({ pageIds, data }: { pageIds: string[]; data: EventToPayloadMap["error"] }) => {
          const errorType = data.error_type;
          const errorMessage = data.error_message || "An error occurred";
          const errorCode = data.error_code;

          if (page.id && pageIds.includes(page.id)) {
            // Show toast notification
            setToast({
              type: TOAST_TYPE.ERROR,
              title: errorType === "fetch" ? "Failed to load page" : "Failed to save page",
              message: errorMessage,
            });

            // Handle specific error codes
            const pageInstance = getPageById(page.id);
            if (pageInstance) {
              if (errorCode === "page_locked") {
                // Lock the page if not already locked
                if (!pageInstance.is_locked) {
                  pageInstance.mutateProperties({ is_locked: true });
                }
              } else if (errorCode === "page_archived") {
                // Mark page as archived if not already
                if (!pageInstance.archived_at) {
                  pageInstance.mutateProperties({ archived_at: new Date().toISOString() });
                }
              }
            }
          }
        },

        ...customRealtimeEventHandlers,
      };
    },
    [getPageById, removePage, page, currentUser, getUserDisplayText, router, handlers, customRealtimeEventHandlers]
  );

  // The main function that will be returned from this hook
  const updatePageProperties = useCallback(
    <T extends keyof EventToPayloadMap>(
      pageIds: string | string[],
      actionType: T,
      data: EventToPayloadMap[T],
      performAction = false
    ) => {
      // Convert to array if single string is passed
      const normalizedPageIds = Array.isArray(pageIds) ? pageIds : [pageIds];

      if (normalizedPageIds.length === 0) return;

      // Get the handler for this message type
      const handler = ACTION_HANDLERS[actionType] as PageUpdateHandler<T> | undefined;

      if (handler) {
        // Now TypeScript knows that handler and data match in type
        handler({ pageIds: normalizedPageIds, data, performAction });
      } else {
        console.warn(`No handler for message type: ${actionType.toString()}`);
      }
    },
    [ACTION_HANDLERS]
  );

  return { updatePageProperties };
};
