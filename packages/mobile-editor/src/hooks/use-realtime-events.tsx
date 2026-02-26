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

// types
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MutableRefObject } from "react";
// plane types
import type { EditorRefApi, EventToPayloadMap, TDocumentEventEmitter, TDocumentEventsClient } from "@plane/editor";
// plane utils
import { getMoveSourceAndTargetFromMoveType } from "@plane/utils";
// constants
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
// helpers
import { callNative } from "@/helpers";
// store
import { usePages } from "@/hooks/store";

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
  currentPageId: string;
  currentProjectId?: string;
  currentUserId: string;
  editorRef: MutableRefObject<EditorRefApi | null>;
  customRealtimeEventHandlers?: TCustomEventHandlers;
}

export const useRealtimePageEvents = ({ currentPageId, currentUserId, editorRef }: UsePageEventsProps) => {
  const [isEditable, setIsEditable] = useState<boolean | null>(null);

  // CurrentUserAction local state to track if the current action is being processed
  // A local action is basically the action performed by the current user to avoid double operations
  const [currentActionBeingProcessed, setCurrentActionBeingProcessed] = useState<TDocumentEventsClient | null>(null);
  const [refInitialized, setRefInitialized] = useState(false);
  const { getSubPageById } = usePages();

  const updatePageAccess = useCallback(
    async (pageId: string) => {
      const response = await callNative<string>(CallbackHandlerStrings.getPageAccess);
      if (!response) return;
      const access = JSON.parse(response) as { canEdit?: boolean; canView?: boolean };
      const canEdit = access["canEdit"] === true;
      const canView = access["canView"] === true;
      const pageItem = getSubPageById(pageId);
      if (pageItem) {
        pageItem.setCanEdit(canEdit);
        pageItem.setCanView(canView);
      }
      setIsEditable(canEdit);
    },
    [getSubPageById]
  );

  useEffect(() => {
    window.updatePageAccess = updatePageAccess;
  }, [updatePageAccess]);

  const ACTION_HANDLERS = useMemo<
    Partial<{
      [K in keyof EventToPayloadMap]: PageUpdateHandler<K>;
    }>
  >(
    () => ({
      archived: ({ pageIds, data }) => {
        pageIds.forEach((pageId) => {
          const pageItem = getSubPageById(pageId);
          if (pageItem) void pageItem.archive();
          if (currentPageId === pageId) {
            void callNative(
              CallbackHandlerStrings.getCollaborativeDocumentEvents,
              JSON.stringify({
                event: "archived",
                payload: data,
              })
            );
            void updatePageAccess(pageId);
            setIsEditable(false);
          }
        });
      },
      unarchived: ({ pageIds, data }) => {
        pageIds.forEach((pageId) => {
          const pageItem = getSubPageById(pageId);
          if (pageItem) void pageItem.restore();

          if (currentPageId === pageId) {
            void callNative(
              CallbackHandlerStrings.getCollaborativeDocumentEvents,
              JSON.stringify({
                event: "unarchived",
                payload: data,
              })
            );
            void updatePageAccess(pageId);
          }
        });
      },
      locked: ({ pageIds, data }) => {
        pageIds.forEach((pageId) => {
          const pageItem = getSubPageById(pageId);
          if (pageItem) void pageItem.lock();
          if (currentPageId === pageId) {
            setIsEditable(false);
            void callNative(
              CallbackHandlerStrings.getCollaborativeDocumentEvents,
              JSON.stringify({
                event: "locked",
                payload: data,
              })
            );
            void updatePageAccess(pageId);
            setIsEditable(false);
          }
        });
      },
      unlocked: ({ pageIds, data }) => {
        pageIds.forEach((pageId) => {
          const pageItem = getSubPageById(pageId);
          if (pageItem) void pageItem.unlock();
          if (currentPageId === pageId) {
            void callNative(
              CallbackHandlerStrings.getCollaborativeDocumentEvents,
              JSON.stringify({
                event: "unlocked",
                payload: data,
              })
            );
            void updatePageAccess(pageId);
          }
        });
      },
      "made-public": ({ pageIds, data }) => {
        pageIds.forEach((pageId) => {
          const pageItem = getSubPageById(pageId);
          if (pageItem) void pageItem.makePublic();
          if (currentPageId === pageId) {
            void callNative(
              CallbackHandlerStrings.getCollaborativeDocumentEvents,
              JSON.stringify({
                event: "made-public",
                payload: data,
              })
            );
            void updatePageAccess(pageId);
          }
        });
      },
      "made-private": ({ pageIds, data }) => {
        pageIds.forEach((pageId) => {
          const pageItem = getSubPageById(pageId);
          if (pageItem) void pageItem.makePrivate();
          if (currentPageId === pageId) {
            void callNative(
              CallbackHandlerStrings.getCollaborativeDocumentEvents,
              JSON.stringify({
                event: "made-private",
                payload: data,
              })
            );
            void updatePageAccess(pageId);
          }
        });
      },
      deleted: ({ pageIds, data }) => {
        pageIds.forEach((pageId) => {
          if (currentPageId === pageId) {
            void callNative(
              CallbackHandlerStrings.getCollaborativeDocumentEvents,
              JSON.stringify({
                event: "deleted",
                payload: data,
              })
            );
          }
        });
      },
      property_updated: ({ pageIds, data }) => {
        pageIds.forEach((pageId) => {
          const pageInstance = getSubPageById(pageId);
          const { name: updatedName, ...rest } = data;
          if (updatedName != null) {
            pageInstance?.updateTitle(updatedName);
            if (pageId === currentPageId) {
              void callNative(
                CallbackHandlerStrings.updatePageTitle,
                JSON.stringify({
                  pageId: pageId,
                  name: updatedName,
                })
              );
            }
          }
          pageInstance?.mutateProperties(rest);
        });
      },
      moved_internally: ({ pageIds, data }) => {
        pageIds.forEach((pageId) => {
          if (data.parent_id !== undefined) {
            if (pageId === currentPageId) {
              void callNative(
                CallbackHandlerStrings.getCollaborativeDocumentEvents,
                JSON.stringify({
                  event: "moved_internally",
                  payload: data,
                })
              );
            }
          }
        });
      },
      shared: ({ data }) => {
        const { users_and_access } = data;
        for (const user of users_and_access) {
          const { user_id, access, page_id: pageIds } = user;
          for (const pageId of pageIds) {
            if (currentUserId === user_id && pageId === currentPageId) {
              void callNative(
                CallbackHandlerStrings.getCollaborativeDocumentEvents,
                JSON.stringify({
                  event: "shared",
                  payload: {
                    access,
                  },
                })
              );
              void updatePageAccess(pageId);
            }
          }
        }
      },
      unshared: ({ data }) => {
        const { users_and_access } = data;
        for (const user of users_and_access) {
          const { user_id, access, page_id: pageIds } = user;
          for (const pageId of pageIds) {
            if (pageId === currentPageId && currentUserId === user_id) {
              setIsEditable(false);
              void callNative(
                CallbackHandlerStrings.getCollaborativeDocumentEvents,
                JSON.stringify({
                  event: "unshared",
                  payload: {
                    access,
                  },
                })
              );
            }
          }
        }
      },
      moved: ({ pageIds, data }) => {
        const moveType = data.move_type;
        const newEntityIdentifier = data.new_entity_identifier;

        if (moveType && newEntityIdentifier && currentPageId) {
          const { target: moveTarget } = getMoveSourceAndTargetFromMoveType(moveType);

          // remove the old page instance from the store
          if (pageIds.includes(currentPageId)) {
            void callNative(
              CallbackHandlerStrings.getCollaborativeDocumentEvents,
              JSON.stringify({
                event: "moved",
                payload: {
                  moveTarget: moveTarget,
                  newEntityIdentifier: newEntityIdentifier,
                  newPageId: currentPageId,
                },
              })
            );
          }
        }
      },
      published: () => {},
      unpublished: () => {},
      "collaborators-updated": () => {},
      restored: () => {},
      duplicated: () => {},
    }),
    [getSubPageById, currentPageId, currentUserId, updatePageAccess]
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

  useEffect(() => {
    let realTimeStatelessMessageListener: TDocumentEventEmitter | undefined;
    const handleStatelessMessage = (message: { payload: TDocumentEventsClient }) => {
      if (currentActionBeingProcessed === message.payload) {
        setCurrentActionBeingProcessed(null);
        return;
      }

      if (message.payload) {
        if (message.payload === "locked" || message.payload === "archived") {
          setIsEditable(false);
        }
      }
    };
    setInterval(() => {
      if (editorRef.current && !refInitialized) {
        setRefInitialized(true);
        realTimeStatelessMessageListener = editorRef?.current?.listenToRealTimeUpdate();
        realTimeStatelessMessageListener?.on("stateless", handleStatelessMessage);
      }
    }, 500);

    return () => {
      realTimeStatelessMessageListener?.off("stateless", handleStatelessMessage);
    };
  }, [editorRef, currentActionBeingProcessed, currentPageId, refInitialized, currentUserId, getSubPageById]);

  return { isEditable, updatePageProperties };
};
