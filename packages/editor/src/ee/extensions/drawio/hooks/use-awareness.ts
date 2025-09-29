import { Editor } from "@tiptap/core";
import { type CollaborationCursorOptions } from "@tiptap/extension-collaboration-cursor";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";
import { EAwarenessKeys } from "@/plane-editor/constants/awareness";
import { TUserDetails } from "@/types";

type TDrawioEditing = {
  diagramId: string;
  isEditing: boolean;
};

type TDrawioUpdate = {
  diagramId: string;
  timestamp: number;
  imageData?: string;
  imageSrc?: string;
};

export const useDrawioAwareness = (editor: Editor, diagramId: string | null) => {
  const [awarenessUsers, setAwarenessUsers] = useState<
    Array<{
      clientId: number;
      user: TUserDetails;
      drawioEditing?: TDrawioEditing;
    }>
  >([]);

  const [lastUpdate, setLastUpdate] = useState<TDrawioUpdate | null>(null);
  const lastUpdateTimestampRef = useRef<number>(0);

  // Image states moved from block component
  const [liveImageData, setLiveImageData] = useState<string | undefined>(undefined);
  const [imageKey, setImageKey] = useState(0);
  const [failedToLoadDiagram, setFailedToLoadDiagram] = useState(false);

  const getAwarenessProvider = useMemo(() => {
    if (!editor) return null;
    const collaborationCursor = editor.extensionManager.extensions.find(
      (ext) => ext.name === ADDITIONAL_EXTENSIONS.COLLABORATION_CURSOR
    );
    const collaborationCursorOptions = collaborationCursor?.options as CollaborationCursorOptions;
    return collaborationCursorOptions?.provider?.awareness || null;
  }, [editor]);

  const setEditingState = useCallback(
    (isEditing: boolean) => {
      getAwarenessProvider?.setLocalStateField(EAwarenessKeys.DRAWIO_EDITING, {
        diagramId: diagramId,
        isEditing,
      });
    },
    [getAwarenessProvider, diagramId]
  );

  const broadcastDiagramUpdate = useCallback(
    (imageData?: string, imageSrc?: string) => {
      if (getAwarenessProvider && diagramId) {
        const updateInfo: TDrawioUpdate = {
          diagramId,
          timestamp: Date.now(),
          imageData, // Direct SVG data for instant updates
          imageSrc, // S3 URL for persistence
        };

        getAwarenessProvider.setLocalStateField(EAwarenessKeys.DRAWIO_UPDATE, updateInfo);

        // Clear the update state after a longer moment to ensure other users receive it
        setTimeout(() => {
          getAwarenessProvider.setLocalStateField(EAwarenessKeys.DRAWIO_UPDATE, null);
        }, 1000);
      }
    },
    [getAwarenessProvider, diagramId]
  );

  useEffect(() => {
    if (!getAwarenessProvider) return;

    const updateAwarenessUsers = () => {
      const states = Array.from(getAwarenessProvider.states?.entries?.() ?? []).map(
        ([clientId, state]: [number, Record<string, unknown>]) => ({
          clientId,
          user: (state.user as TUserDetails) || { color: "", id: "", name: "" },
          drawioEditing: state.drawioEditing as TDrawioEditing | undefined,
        })
      );
      setAwarenessUsers(states);

      // Check for diagram updates from other users
      const diagramUpdates = Array.from(getAwarenessProvider.states?.entries?.() ?? [])
        .map(([clientId, state]: [number, Record<string, unknown>]) => ({
          clientId,
          update: state.drawioUpdate as TDrawioUpdate | undefined,
        }))
        .filter(
          ({ update, clientId }) =>
            update && update.diagramId === diagramId && clientId !== getAwarenessProvider.clientID
        )
        .sort((a, b) => (b.update?.timestamp || 0) - (a.update?.timestamp || 0));

      if (diagramUpdates.length > 0) {
        const latestUpdate = diagramUpdates[0].update;
        if (latestUpdate && latestUpdate.timestamp > lastUpdateTimestampRef.current) {
          lastUpdateTimestampRef.current = latestUpdate.timestamp;
          setLastUpdate(latestUpdate);
        }
      }
    };

    getAwarenessProvider.on("update", updateAwarenessUsers);

    return () => {
      getAwarenessProvider.off("update", updateAwarenessUsers);
    };
  }, [editor, diagramId, getAwarenessProvider]);

  // Listen for diagram updates and update image states
  useEffect(() => {
    if (lastUpdate && lastUpdate.diagramId === diagramId) {
      if (lastUpdate.imageData) {
        // Use the direct image data for instant updates
        setLiveImageData(lastUpdate.imageData);
      }

      // Force refresh the image key
      setImageKey((prev) => prev + 1);

      // Reset any error states
      setFailedToLoadDiagram(false);
    }
  }, [lastUpdate, diagramId]);

  const userEditingThisDiagram = useMemo(() => {
    const userEditingState = awarenessUsers.find(
      (userState) => userState.drawioEditing?.isEditing && userState.drawioEditing?.diagramId === diagramId
    );
    return userEditingState?.user || null;
  }, [awarenessUsers, diagramId]);

  // Handlers for managing image states
  const clearLiveImageData = useCallback(() => {
    setLiveImageData(undefined);
  }, []);

  const updateImageKey = useCallback(() => {
    setImageKey((prev) => prev + 1);
  }, []);

  const setDiagramError = useCallback((hasError: boolean) => {
    setFailedToLoadDiagram(hasError);
  }, []);

  const handleBlockedClick = useCallback(() => {
    if (userEditingThisDiagram) {
      console.log(`${userEditingThisDiagram.name} is currently editing this diagram. Please wait for them to finish.`);
    }
  }, [userEditingThisDiagram]);

  const updateLiveImageData = useCallback((imageData: string | undefined) => {
    setLiveImageData(imageData);
  }, []);

  return {
    userEditingThisDiagram,
    setEditingState,
    broadcastDiagramUpdate,
    lastUpdate,
    // Image states
    liveImageData,
    imageKey,
    failedToLoadDiagram,
    // Image handlers
    clearLiveImageData,
    updateImageKey,
    updateLiveImageData,
    setDiagramError,
    handleBlockedClick,
  };
};
