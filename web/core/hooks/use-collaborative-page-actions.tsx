import { useState, useEffect, useCallback, useMemo } from "react";
import { EditorReadOnlyRefApi, EditorRefApi, TDocumentEventsServer } from "@plane/editor";
import { DocumentCollaborativeEvents, TDocumentEventsClient, getServerEventName } from "@plane/editor/lib";
import { TOAST_TYPE, setToast } from "@plane/ui";
import { IPage } from "@/store/pages/page";

// Better type naming and structure
type CollaborativeAction = {
  execute: (shouldSync?: boolean) => Promise<void>;
  errorMessage: string;
};

type CollaborativeActionEvent =
  | { type: "sendMessageToServer"; message: TDocumentEventsServer }
  | { type: "receivedMessageFromServer"; message: TDocumentEventsClient };

export const useCollaborativePageActions = (editorRef: EditorRefApi | EditorReadOnlyRefApi | null, page: IPage) => {
  // currentUserAction local state to track if the current action is being processed, a
  // local action is basically the action performed by the current user to avoid double operations
  const [currentActionBeingProcessed, setCurrentActionBeingProcessed] = useState<TDocumentEventsClient | null>(null);

  const actionHandlerMap: Record<TDocumentEventsClient, CollaborativeAction> = useMemo(
    () => ({
      [DocumentCollaborativeEvents.lock.client]: {
        execute: (shouldSync) => page.lock(shouldSync),
        errorMessage: "Page could not be locked. Please try again later.",
      },
      [DocumentCollaborativeEvents.unlock.client]: {
        execute: (shouldSync) => page.unlock(shouldSync),
        errorMessage: "Page could not be unlocked. Please try again later.",
      },
      [DocumentCollaborativeEvents.archive.client]: {
        execute: (shouldSync) => page.archive(shouldSync),
        errorMessage: "Page could not be archived. Please try again later.",
      },
      [DocumentCollaborativeEvents.unarchive.client]: {
        execute: (shouldSync) => page.restore(shouldSync),
        errorMessage: "Page could not be restored. Please try again later.",
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
        await actionDetails.execute(isPerformedByCurrentUser);
        if (isPerformedByCurrentUser) {
          setCurrentActionBeingProcessed(clientAction);
        }
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: actionDetails.errorMessage,
        });
      }
    },
    [actionHandlerMap]
  );

  useEffect(() => {
    if (currentActionBeingProcessed) {
      const serverEventName = getServerEventName(currentActionBeingProcessed);
      if (serverEventName) {
        editorRef?.emitRealTimeUpdate(serverEventName);
      }
    }
  }, [currentActionBeingProcessed, editorRef]);

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
    EVENT_ACTION_DETAILS_MAP: actionHandlerMap,
  };
};
