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

export const usePageFallback = (args: TArgs) => {
  const { editorRef, fetchPageDescription, collaborationState, updatePageDescription, page } = args;
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
      console.warn("Websocket Connection lost, your changes are being saved using backup mechanism.");
      hasShownFallbackToast.current = true;
    }

    try {
      setIsFetchingFallbackBinary(true);

      const latestEncodedDescription = await fetchPageDescription();
      let latestDecodedDescription: Uint8Array;
      if (latestEncodedDescription && latestEncodedDescription.byteLength > 0) {
        latestDecodedDescription = new Uint8Array(latestEncodedDescription);
      } else {
        const pageDescriptionHtml = page.description_html;
        latestDecodedDescription = getBinaryDataFromDocumentEditorHTMLString(
          pageDescriptionHtml ?? "<p></p>",
          page.name
        );
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
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsFetchingFallbackBinary(false);
    }
  }, [editorRef, fetchPageDescription, hasConnectionFailed, updatePageDescription, page.description_html, page.name]);

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
