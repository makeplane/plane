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

import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Editor } from "@tiptap/core";
import type { CollaborationCursorOptions } from "@tiptap/extension-collaboration-cursor";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
// plane imports
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";
// plane editor imports
import { EAwarenessKeys } from "@/plane-editor/constants/awareness";
// types
import type { TUserDetails } from "@/types";

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

/** Awareness extends Observable (has on/off); provider types may not expose these. */
type AwarenessWithEvents = { on(event: string, cb: () => void): void; off(event: string, cb: () => void): void };

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

  const awarenessProvider = useMemo(() => {
    if (!editor) return null;
    const collaborationCaret = editor.extensionManager.extensions.find(
      (ext) => ext.name === ADDITIONAL_EXTENSIONS.COLLABORATION_CARET
    );
    const collaborationCaretOptions = collaborationCaret?.options as CollaborationCursorOptions;
    return (collaborationCaretOptions?.provider as HocuspocusProvider)?.awareness || null;
  }, [editor]);

  const setEditingState = useCallback(
    (isEditing: boolean) => {
      awarenessProvider?.setLocalStateField(EAwarenessKeys.DRAWIO_EDITING, {
        diagramId: diagramId,
        isEditing,
      });
    },
    [awarenessProvider, diagramId]
  );

  const broadcastDiagramUpdate = useCallback(
    (imageData?: string, imageSrc?: string) => {
      if (awarenessProvider && diagramId) {
        const updateInfo: TDrawioUpdate = {
          diagramId,
          timestamp: Date.now(),
          imageData, // Direct SVG data for instant updates
          imageSrc, // S3 URL for persistence
        };

        awarenessProvider.setLocalStateField(EAwarenessKeys.DRAWIO_UPDATE, updateInfo);

        // Clear the update state after a longer moment to ensure other users receive it
        setTimeout(() => {
          awarenessProvider.setLocalStateField(EAwarenessKeys.DRAWIO_UPDATE, null);
        }, 1000);
      }
    },
    [awarenessProvider, diagramId]
  );

  useEffect(() => {
    if (!awarenessProvider) return;

    const updateAwarenessUsers = () => {
      // Capture fresh awareness states on each update
      const awarenessStates = Array.from(awarenessProvider.states?.entries?.() ?? []) as [
        number,
        Record<string, unknown>,
      ][];

      const states = awarenessStates.map(([clientId, state]) => ({
        clientId,
        user: (state.user as TUserDetails) || { color: "", id: "", name: "" },
        drawioEditing: state.drawioEditing as TDrawioEditing | undefined,
      }));
      setAwarenessUsers(states);

      // Check for diagram updates from other users
      const diagramUpdates = awarenessStates
        .map(([clientId, state]) => ({
          clientId,
          update: state.drawioUpdate as TDrawioUpdate | undefined,
        }))
        .filter(({ update, clientId }) => update?.diagramId === diagramId && clientId !== awarenessProvider.clientID)
        .sort((a, b) => (b.update?.timestamp || 0) - (a.update?.timestamp || 0));

      if (diagramUpdates.length > 0) {
        const latestUpdate = diagramUpdates[0].update;
        if (latestUpdate && latestUpdate.timestamp > lastUpdateTimestampRef.current) {
          lastUpdateTimestampRef.current = latestUpdate.timestamp;
          setLastUpdate(latestUpdate);
        }
      }
    };

    (awarenessProvider as unknown as AwarenessWithEvents).on("update", updateAwarenessUsers);

    return () => {
      (awarenessProvider as unknown as AwarenessWithEvents).off("update", updateAwarenessUsers);
    };
  }, [editor, diagramId, awarenessProvider]);

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
