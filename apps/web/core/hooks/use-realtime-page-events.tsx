/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
// plane imports
import type { EventToPayloadMap } from "@plane/editor";
import { setToast, TOAST_TYPE, dismissToast } from "@plane/propel/toast";
// types
import type { IUserLite, TCollaborator } from "@plane/types";
import { getMoveSourceAndTargetFromMoveType } from "@plane/utils";
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
  // navigation
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const { removePage, getPageById, getOrFetchPageInstance, removePageInstance } = usePageStore(storeType);
  const { data: currentUser } = useUser();
  // derived values
  const { editorRef } = page.editor;

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
    () => ({
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
      moved_internally: ({ pageIds, data }: { pageIds: string[]; data: EventToPayloadMap["moved_internally"] }) => {
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
      published: ({ data }: { data: EventToPayloadMap["published"] }) => {
        const pagesToPublish = data.published_pages;
        pagesToPublish?.forEach(({ page_id: pageId, anchor }) => {
          const pageItem = getPageById(pageId);
          pageItem?.mutateProperties({ anchor: anchor });
        });
      },
      unpublished: ({ pageIds }: { pageIds: string[] }) => {
        pageIds.forEach((pageId) => {
          const pageItem = getPageById(pageId);
          pageItem?.mutateProperties({ anchor: null });
        });
      },
      "collaborators-updated": ({
        pageIds,
        data,
      }: {
        pageIds: string[];
        data: EventToPayloadMap["collaborators-updated"];
      }) => {
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
      restored: ({ data }: { data: EventToPayloadMap["restored"] }) => {
        if (page.id) {
          if (page?.restoration.versionId) {
            const descriptionJSON = page.restoration.descriptionJSON;
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
            editorRef?.clearEditor(false);

            // Set editor value BEFORE clearing store to avoid MobX proxy invalidation
            if (descriptionJSON) {
              editorRef?.setEditorValue(descriptionJSON, true);
            }

            page?.setVersionToBeRestored(null, null);
            page?.setRestorationStatus(false);

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
      shared: async ({ data }: { data: EventToPayloadMap["shared"] }) => {
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
      unshared: async ({ data }: { data: EventToPayloadMap["unshared"] }) => {
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
      duplicated: async ({ pageIds, data }: { pageIds: string[]; data: EventToPayloadMap["duplicated"] }) => {
        const duplicatedPage = data.new_page_id;
        dismissToast("duplicating-page");

        // create a new page instace of the duplicatedPage in the store
        await getOrFetchPageInstance({ pageId: duplicatedPage, trackVisit: false });

        if (page.id === pageIds[0] && data.user_id === currentUser?.id) {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: `Page duplicated successfully.`,
            actionItems: (
              <div className="flex items-center gap-1 text-11 text-secondary">
                <a
                  href={handlers.getRedirectionLink(duplicatedPage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-primary px-2 py-1 hover:bg-layer-1 font-medium rounded"
                >
                  View duplicated page
                </a>
              </div>
            ),
          });
        }
      },
      moved: async ({ pageIds, data }: { pageIds: string[]; data: EventToPayloadMap["moved"] }) => {
        const moveType = data.move_type;
        const newEntityIdentifier = data.new_entity_identifier;

        if (moveType && newEntityIdentifier && page.id) {
          const { target: moveTarget } = getMoveSourceAndTargetFromMoveType(moveType);

          // remove the old page instance from the store
          if (pageIds.includes(page.id)) {
            removePageInstance(page.id);

            if (moveTarget === "workspace") {
              router.replace(`/${workspaceSlug}/wiki/${page.id}`);
            } else if (moveTarget === "project") {
              router.replace(`/${workspaceSlug}/projects/${newEntityIdentifier}/pages/${page.id}`);
            } else {
              router.replace(`/${workspaceSlug}/teamspaces/${newEntityIdentifier}/pages/${page.id}`);
            }
          }
        }
      },
      ...customRealtimeEventHandlers,
    }),
    [
      customRealtimeEventHandlers,
      getPageById,
      removePage,
      page,
      currentUser?.id,
      getUserDisplayText,
      router,
      handlers,
      editorRef,
      getOrFetchPageInstance,
      removePageInstance,
      workspaceSlug,
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
