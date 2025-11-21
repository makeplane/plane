import { useCallback, useEffect, useRef, useState } from "react";
import type { EditorRefApi, CollaborationState } from "@plane/editor";
// plane editor
import { convertBinaryDataToBase64String, getBinaryDataFromDocumentEditorHTMLString } from "@plane/editor";
// plane propel
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
// plane types
import type { TDocumentPayload } from "@plane/types";
// hooks
import useAutoSave from "@/hooks/use-auto-save";

type TArgs = {
  editorRef: React.RefObject<EditorRefApi>;
  fetchPageDescription: () => Promise<ArrayBuffer>;
  collaborationState: CollaborationState | null;
  updatePageDescription: (data: TDocumentPayload) => Promise<void>;
};

export const usePageFallback = (args: TArgs) => {
  const { editorRef, fetchPageDescription, collaborationState, updatePageDescription } = args;
  const hasShownFallbackToast = useRef(false);

  const [isFetchingFallbackBinary, setIsFetchingFallbackBinary] = useState(false);

  // Derive connection failure from collaboration state
  const hasConnectionFailed = collaborationState?.stage.kind === "disconnected";

  const handleUpdateDescription = useCallback(async () => {
    if (!hasConnectionFailed) return;
    const editor = editorRef.current;
    if (!editor) return;

    // Show toast notification when fallback mechanism kicks in (only once)
    if (!hasShownFallbackToast.current) {
      setToast({
        type: TOAST_TYPE.WARNING,
        title: "Connection lost",
        message: "Your changes are being saved using backup mechanism. ",
      });
      hasShownFallbackToast.current = true;
    }

    try {
      setIsFetchingFallbackBinary(true);

      const latestEncodedDescription = await fetchPageDescription();
      let latestDecodedDescription: Uint8Array;
      if (latestEncodedDescription && latestEncodedDescription.byteLength > 0) {
        latestDecodedDescription = new Uint8Array(latestEncodedDescription);
      } else {
        latestDecodedDescription = getBinaryDataFromDocumentEditorHTMLString("<p></p>");
      }

      editor.setProviderDocument(latestDecodedDescription);
      const { binary, html, json } = editor.getDocument();
      if (!binary || !json) return;
      const encodedBinary = convertBinaryDataToBase64String(binary);

      await updatePageDescription({
        description_binary: encodedBinary,
        description_html: html,
        description: json,
      });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: `Failed to update description using backup mechanism, ${error?.message}`,
      });
    } finally {
      setIsFetchingFallbackBinary(false);
    }
  }, [editorRef, fetchPageDescription, hasConnectionFailed, updatePageDescription]);

  useEffect(() => {
    if (hasConnectionFailed) {
      handleUpdateDescription();
    } else {
      // Reset toast flag when connection is restored
      hasShownFallbackToast.current = false;
    }
  }, [handleUpdateDescription, hasConnectionFailed]);

  useAutoSave(handleUpdateDescription);

  return { isFetchingFallbackBinary };
};
