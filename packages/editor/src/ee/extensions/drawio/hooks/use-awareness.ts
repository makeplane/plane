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
import { useState, useMemo, useCallback, useEffect } from "react";
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
  savedAt: number;
};

export const useDrawioAwareness = (editor: Editor, diagramId: string | null) => {
  const [awarenessUsers, setAwarenessUsers] = useState<
    Array<{
      clientId: number;
      user: TUserDetails;
      drawioEditing?: TDrawioEditing;
      drawioUpdate?: TDrawioUpdate;
    }>
  >([]);

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
        diagramId,
        isEditing,
      });
    },
    [awarenessProvider, diagramId]
  );

  // Broadcast save signal so other connected users refresh their viewer
  const broadcastSave = useCallback(() => {
    if (!diagramId) return;
    awarenessProvider?.setLocalStateField(EAwarenessKeys.DRAWIO_UPDATE, {
      diagramId,
      savedAt: Date.now(),
    } satisfies TDrawioUpdate);
  }, [awarenessProvider, diagramId]);

  useEffect(() => {
    if (!awarenessProvider) return;

    const updateAwarenessUsers = () => {
      const awarenessStates = Array.from(awarenessProvider.states?.entries?.() ?? []) as [
        number,
        Record<string, unknown>,
      ][];

      const states = awarenessStates.map(([clientId, state]) => ({
        clientId,
        user: (state.user as TUserDetails) || { color: "", id: "", name: "" },
        drawioEditing: state.drawioEditing as TDrawioEditing | undefined,
        drawioUpdate: state.drawioUpdate as TDrawioUpdate | undefined,
      }));
      setAwarenessUsers(states);
    };

    awarenessProvider.on("update", updateAwarenessUsers);

    return () => {
      awarenessProvider.off("update", updateAwarenessUsers);
    };
  }, [editor, diagramId, awarenessProvider]);

  const userEditingThisDiagram = useMemo(() => {
    const userEditingState = awarenessUsers.find(
      (userState) => userState.drawioEditing?.isEditing && userState.drawioEditing?.diagramId === diagramId
    );
    return userEditingState?.user || null;
  }, [awarenessUsers, diagramId]);

  // Latest save timestamp from a remote user for this diagram
  const lastRemoteSave = useMemo(() => {
    const localClientId = awarenessProvider?.clientID;
    let latest: number | null = null;

    for (const state of awarenessUsers) {
      if (
        state.clientId !== localClientId &&
        state.drawioUpdate?.diagramId === diagramId &&
        state.drawioUpdate.savedAt
      ) {
        if (latest === null || state.drawioUpdate.savedAt > latest) {
          latest = state.drawioUpdate.savedAt;
        }
      }
    }

    return latest;
  }, [awarenessUsers, diagramId, awarenessProvider?.clientID]);

  const handleBlockedClick = useCallback(() => {
    if (userEditingThisDiagram) {
      console.log(`${userEditingThisDiagram.name} is currently editing this diagram.`);
    }
  }, [userEditingThisDiagram]);

  return {
    userEditingThisDiagram,
    setEditingState,
    handleBlockedClick,
    broadcastSave,
    lastRemoteSave,
  };
};
