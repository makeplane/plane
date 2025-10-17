import { useCallback, useMemo } from "react";
// plane imports
import type { EventToPayloadMap } from "@plane/editor";
import { setToast, TOAST_TYPE, dismissToast } from "@plane/propel/toast";
// components
import type { TEditorBodyHandlers } from "@/components/pages/editor/editor-body";
// hooks
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import type { EPageStoreType } from "@/plane-web/hooks/store";
import { usePageStore } from "@/plane-web/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";
import type { IUserLite } from "@plane/types";

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
  // derived values
  const { editorRef } = page.editor;

  // Helper function to safely get user display text
  const getUserDisplayText = useCallback(
    (userId: string | undefined) => {
      if (!userId) return "";
      try {
        const userDetails = getUserDetails(userId as string);
        return userDetails?.display_name ? ` by ${userDetails.display_name}` : "";
      } catch {
        return "";
      }
    },
    [getUserDetails]
  );

  const ACTION_HANDLERS = useMemo<
    Partial<{
      [K in keyof EventToPayloadMap]: PageUpdateHandler<K>;
    }>
  >(
    () => ({
      archived: ({ pageIds, data }) => {
        pageIds.forEach((pageId) => {
          const pageItem = getPageById(pageId);
          if (pageItem) pageItem.archive({ archived_at: data.archived_at, shouldSync: false });
        });
      },
      unarchived: ({ pageIds }) => {
        pageIds.forEach((pageId) => {
          const pageItem = getPageById(pageId);
          if (pageItem) pageItem.restore({ shouldSync: false });
        });
      },
      locked: ({ pageIds }) => {
        pageIds.forEach((pageId) => {
          const pageItem = getPageById(pageId);
          if (pageItem) pageItem.lock({ shouldSync: false, recursive: false });
        });
      },
      unlocked: ({ pageIds }) => {
        pageIds.forEach((pageId) => {
          const pageItem = getPageById(pageId);
          if (pageItem) pageItem.unlock({ shouldSync: false, recursive: false });
        });
      },
      "made-public": ({ pageIds }) => {
        pageIds.forEach((pageId) => {
          const pageItem = getPageById(pageId);
          if (pageItem) pageItem.makePublic({ shouldSync: false });
        });
      },
      "made-private": ({ pageIds }) => {
        pageIds.forEach((pageId) => {
          const pageItem = getPageById(pageId);
          if (pageItem) pageItem.makePrivate({ shouldSync: false });
        });
      },
      deleted: ({ pageIds, data }) => {
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
      property_updated: ({ pageIds, data }) => {
        pageIds.forEach((pageId) => {
          const pageInstance = getPageById(pageId);
          const { name: updatedName, ...rest } = data;
          if (updatedName != null) pageInstance?.updateTitle(updatedName);
          pageInstance?.mutateProperties(rest);
        });
      },
      moved_internally: ({ pageIds, data }) => {
        pageIds.forEach((pageId) => {
          const pageItem = getPageById(pageId);
          if (data.sub_pages_count !== undefined) {
            // Handle parent page sub-pages count update
            const currentSubPageCount = pageItem?.sub_pages_count ?? (data.sub_pages_count === -1 ? 1 : -1);
            pageItem?.mutateProperties({
              sub_pages_count: currentSubPageCount + data.sub_pages_count,
            });
          } else if (data.parent_id !== undefined) {
            // Handle page parent change
            pageItem?.mutateProperties({ parent_id: data.parent_id });
            if (pageItem?.id === page.id) {
              setToast({
                type: TOAST_TYPE.SUCCESS,
                title: "This page has been moved",
                message: "This page has been moved to a new parent page",
              });
            }
          }
        });
      },
      published: ({ data }) => {
        const pagesToPublish = data.published_pages;
        pagesToPublish?.forEach(({ page_id: pageId, anchor }) => {
          const pageItem = getPageById(pageId);
          pageItem?.mutateProperties({ anchor: anchor });
        });
      },
      unpublished: ({ pageIds }) => {
        pageIds.forEach((pageId) => {
          const pageItem = getPageById(pageId);
          pageItem?.mutateProperties({ anchor: null });
        });
      },
      "collaborators-updated": ({ pageIds, data }) => {
        pageIds.forEach((pageId: string) => {
          const pageItem = getPageById(pageId);
          const collaborators = data.users;
          if (pageItem && collaborators) {
            const collaboratorsForPageStore: TCollaborator[] = collaborators.map((col) => ({
              name: col.name,
              color: col.color,
              id: col.id,
              clientId: col.clientId,
            }));
            pageItem.updateCollaborators(collaboratorsForPageStore);
          }
        });
      },
      restored: ({ data }) => {
        if (page.id) {
          let descriptionHTML: string | null = null;
          if (page?.restoration.versionId) {
            descriptionHTML = page.restoration.descriptionHTML;
            if (!editorRef) {
              page?.setVersionToBeRestored(null, null);
              page?.setRestorationStatus(false);
              dismissToast("restoring-version");
              setToast({
                type: TOAST_TYPE.ERROR,
                title: "Page version failed to restore.",
              });
              return;
            }
            editorRef?.clearEditor(true);

            page?.setVersionToBeRestored(null, null);
            page?.setRestorationStatus(false);
            if (descriptionHTML) {
              editorRef?.setEditorValue(descriptionHTML);
            }

            dismissToast("restoring-version");
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Page version restored.",
            });

            return;
          }
        }
        // delete the pages from the store
        const { deleted_page_ids } = data;

        deleted_page_ids?.forEach((pageId) => {
          const pageItem = getPageById(pageId);
          if (pageItem)
            Promise.resolve(removePage({ pageId, shouldSync: false })).then(() => {
              if (page.id === pageId) {
                router.push(handlers.getRedirectionLink());
              }
            });
          else if (page.id === pageId) router.push(handlers.getRedirectionLink());
        });
      },
      shared: async ({ data }) => {
        const { users_and_access } = data;
        for (const user of users_and_access) {
          const { user_id, access, page_id: pageIds } = user;
          for (const pageId of pageIds) {
            const pageItem = getPageById(pageId);
            if (pageItem) {
              pageItem.appendSharedUsers([
                {
                  user_id,
                  access,
                },
              ]);
              if (currentUser?.id === user_id) {
                pageItem.setSharedAccess(access);
              }
            }
          }
        }
      },
      unshared: async ({ data }) => {
        const { users_and_access } = data;
        for (const user of users_and_access) {
          const { user_id, page_id: pageIds } = user;
          for (const pageId of pageIds) {
            const pageItem = getPageById(pageId);
            if (pageItem) {
              pageItem.removeSharedUser(user_id);
              if (currentUser?.id === user_id) {
                pageItem.setSharedAccess(null);
              }
            }
          }
        }
      },
      error: ({ pageIds, data }) => {
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
    }),
    [
      getPageById,
      page,
      editorRef,
      router,
      getUserDisplayText,
      removePage,
      currentUser,
      customRealtimeEventHandlers,
      handlers,
    ]
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
      const handler = ACTION_HANDLERS[actionType];

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
