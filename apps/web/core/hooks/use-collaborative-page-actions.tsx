import { useState, useEffect, useCallback, useMemo } from "react";
import type { EditorRefApi, TDocumentEventsServer } from "@plane/editor";
import type { TDocumentEventsClient } from "@plane/editor/lib";
import { DocumentCollaborativeEvents, getServerEventName } from "@plane/editor/lib";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// store
import type { TPageInstance } from "@/store/pages/base-page";

export type CollaborativeAction = {
  execute: (shouldSync?: boolean, recursive?: boolean) => Promise<void>;
  errorMessage: string;
};

type CollaborativeActionEvent =
  | { type: "sendMessageToServer"; message: TDocumentEventsServer; recursive?: boolean }
  | { type: "receivedMessageFromServer"; message: TDocumentEventsClient };

type Props = {
  page: TPageInstance;
};

export const useCollaborativePageActions = (props: Props) => {
  const { page } = props;
  const editorRef = page.editor.editorRef;
  // currentUserAction local state to track if the current action is being processed, a
  // local action is basically the action performed by the current user to avoid double operations
  const [currentActionBeingProcessed, setCurrentActionBeingProcessed] = useState<TDocumentEventsClient | null>(null);

  // @ts-expect-error - TODO: fix this
  const actionHandlerMap: Record<TDocumentEventsClient, CollaborativeAction> = useMemo(
    () => ({
      [DocumentCollaborativeEvents.lock.client]: {
        execute: (shouldSync?: boolean, recursive?: boolean) => page.lock({ shouldSync, recursive }),
        errorMessage: "Page could not be locked. Please try again later.",
      },
      [DocumentCollaborativeEvents.unlock.client]: {
        execute: (shouldSync?: boolean, recursive?: boolean) => page.unlock({ shouldSync, recursive }),
        errorMessage: "Page could not be unlocked. Please try again later.",
      },
      [DocumentCollaborativeEvents.archive.client]: {
        execute: (shouldSync?: boolean) => page.archive({ shouldSync }),
        errorMessage: "Page could not be archived. Please try again later.",
      },
      [DocumentCollaborativeEvents.unarchive.client]: {
        execute: (shouldSync?: boolean) => page.restore({ shouldSync }),
        errorMessage: "Page could not be restored. Please try again later.",
      },
      [DocumentCollaborativeEvents["make-public"].client]: {
        execute: (shouldSync?: boolean) => page.makePublic({ shouldSync }),
        errorMessage: "Page could not be made public. Please try again later.",
      },
      [DocumentCollaborativeEvents["make-private"].client]: {
        execute: (shouldSync?: boolean) => page.makePrivate({ shouldSync }),
        errorMessage: "Page could not be made private. Please try again later.",
      },
    }),
    [page]
  );

  const executeCollaborativeAction = useCallback(
    async (event: CollaborativeActionEvent) => {
      const isPerformedByCurrentUser = event.type === "sendMessageToServer";
      const clientAction = isPerformedByCurrentUser ? DocumentCollaborativeEvents[event.message].client : event.message;
      const actionDetails = actionHandlerMap[clientAction];
      try {
        await actionDetails.execute(isPerformedByCurrentUser, isPerformedByCurrentUser ? event?.recursive : undefined);
        if (isPerformedByCurrentUser) {
          const serverEventName = getServerEventName(clientAction);
          if (serverEventName) {
            editorRef?.emitRealTimeUpdate(serverEventName);
          }
        }
      } catch {
        if (actionDetails?.errorMessage) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: actionDetails.errorMessage,
          });
        }
      }
    },
    [actionHandlerMap, editorRef]
  );

  useEffect(() => {
    const realTimeStatelessMessageListener = editorRef?.listenToRealTimeUpdate();
    const handleStatelessMessage = (message: { payload: TDocumentEventsClient }) => {
      if (currentActionBeingProcessed === message.payload) {
        setCurrentActionBeingProcessed(null);
        return;
      }

      if (message.payload) {
        executeCollaborativeAction({ type: "receivedMessageFromServer", message: message.payload });
      }
    };

    realTimeStatelessMessageListener?.on("stateless", handleStatelessMessage);

    return () => {
      realTimeStatelessMessageListener?.off("stateless", handleStatelessMessage);
    };
  }, [editorRef, currentActionBeingProcessed, executeCollaborativeAction]);

  return {
    executeCollaborativeAction,
  };
};
