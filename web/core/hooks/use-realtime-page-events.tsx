import { useCallback, useMemo } from "react";
import { EventToPayloadMap } from "@plane/editor";
import { IUserLite, TCollaborator } from "@plane/types";
import { dismissToast, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { TEditorBodyHandlers } from "@/components/pages";
// hooks
import { useUser } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// store
import { TPageInstance } from "@/store/pages/base-page";

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
  const { removePage, getPageById, getOrFetchPageInstance } = usePageStore(storeType);

  const { data: currentUser } = useUser();
  // derived values
  const editorRef = page.editorRef;

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
      title_updated: ({ pageIds, data }) => {
        pageIds.forEach((pageId) => {
          const pageItem = getPageById(pageId);
          if (pageItem && data.title != null) pageItem.updateTitle(data.title);
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
      unshared: async ({ pageIds, data }) => {},
      duplicated: async ({ pageIds, data }) => {
        const duplicatedPage = data.new_page_id;
        dismissToast("duplicating-page");

        // create a new page instace of the duplicatedPage in the store
        await getOrFetchPageInstance({ pageId: duplicatedPage });

        if (page.id === pageIds[0] && data.user_id === currentUser?.id) {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: `Page duplicated successfully.`,
            actionItems: (
              <div className="flex items-center gap-1 text-xs text-custom-text-200">
                <a
                  href={handlers.getRedirectionLink(duplicatedPage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-custom-primary px-2 py-1 hover:bg-custom-background-90 font-medium rounded"
                >
                  View duplicated page
                </a>
              </div>
            ),
          });
        }
      },
      ...customRealtimeEventHandlers,
    }),
    [
      getPageById,
      getOrFetchPageInstance,
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
        console.warn(`No handler for message type: ${actionType}`);
      }
    },
    [ACTION_HANDLERS]
  );

  return { updatePageProperties };
};
