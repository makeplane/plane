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

import { useCallback, useEffect, useRef, useState } from "react";
import type { EditorRefApi, CollaborationState } from "@plane/editor";
// plane editor
import { convertBinaryDataToBase64String, getBinaryDataFromDocumentEditorHTMLString } from "@plane/editor";
// plane types
import type { TDocumentPayload } from "@plane/types";
// hooks
import useAutoSave from "@/hooks/use-auto-save";
import type { TPageInstance } from "@/store/pages/base-page";

type TArgs = {
  editorRef: React.RefObject<EditorRefApi>;
  fetchPageDescription: () => Promise<ArrayBuffer>;
  collaborationState: CollaborationState | null;
  updatePageDescription: (data: TDocumentPayload) => Promise<void>;
  page: TPageInstance;
};

/**
 * Performs the fallback save operation. Extracted as a standalone function
 * to avoid recreating callbacks when page content changes (which would cause
 * POST requests on every keystroke).
 */
async function performFallbackSave(
  editor: EditorRefApi,
  page: TPageInstance,
  fetchPageDescription: () => Promise<ArrayBuffer>,
  updatePageDescription: (data: TDocumentPayload) => Promise<void>
) {
  const latestEncodedDescription = await fetchPageDescription();
  let latestDecodedDescription: Uint8Array;

  if (latestEncodedDescription && latestEncodedDescription.byteLength > 0) {
    latestDecodedDescription = new Uint8Array(latestEncodedDescription);
  } else {
    latestDecodedDescription = getBinaryDataFromDocumentEditorHTMLString(page.description_html ?? "<p></p>", page.name);
  }

  editor.setProviderDocument(latestDecodedDescription);
  const { binary, html, json } = editor.getDocument();
  if (!binary || !json) return;

  const encodedBinary = convertBinaryDataToBase64String(binary);
  await updatePageDescription({
    description_binary: encodedBinary,
    description_html: html,
    description_json: json,
  });
}

export const usePageFallback = (args: TArgs) => {
  const { editorRef, fetchPageDescription, collaborationState, updatePageDescription, page } = args;
  const hasShownFallbackToast = useRef(false);
  const isSavingRef = useRef(false);

  const [isFetchingFallbackBinary, setIsFetchingFallbackBinary] = useState(false);

  // Derive connection failure from collaboration state
  const hasConnectionFailed = collaborationState?.stage.kind === "disconnected";

  // Stable callback that reads latest values on-demand when called
  // No dependencies on page content - reads directly from args when invoked
  const handleUpdateDescription = useCallback(async () => {
    if (!hasConnectionFailed) return;
    const editor = editorRef.current;
    if (!editor || isSavingRef.current) return;

    // Show toast notification when fallback mechanism kicks in (only once)
    if (!hasShownFallbackToast.current) {
      console.warn("Websocket Connection lost, your changes are being saved using backup mechanism.");
      hasShownFallbackToast.current = true;
    }

    try {
      isSavingRef.current = true;
      setIsFetchingFallbackBinary(true);
      // Read latest page/functions at call time, not at callback creation time
      await performFallbackSave(editor, page, fetchPageDescription, updatePageDescription);
    } catch (error: any) {
      console.error(error);
    } finally {
      isSavingRef.current = false;
      setIsFetchingFallbackBinary(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally stable: reads latest values on-demand
  }, [hasConnectionFailed, editorRef]);

  // Only trigger on connection state change, not on callback recreation
  useEffect(() => {
    if (hasConnectionFailed) {
      handleUpdateDescription();
    } else {
      // Reset toast flag when connection is restored
      hasShownFallbackToast.current = false;
    }
  }, [hasConnectionFailed, handleUpdateDescription]);

  useAutoSave(handleUpdateDescription);

  return { isFetchingFallbackBinary };
};
