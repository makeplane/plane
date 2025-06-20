import { useCallback, useEffect } from "react";
// plane editor
import { EditorRefApi, getBinaryDataFromDocumentEditorHTMLString } from "@plane/editor";
// plane types
import { TDocumentPayload } from "@plane/types";
// hooks
import useAutoSave from "@/hooks/use-auto-save";

type TArgs = {
  editorRef: React.RefObject<EditorRefApi>;
  fetchPageDescription: () => Promise<ArrayBuffer>;
  hasConnectionFailed: boolean;
  updatePageDescription: (data: TDocumentPayload) => Promise<void>;
};

export const usePageFallback = (args: TArgs) => {
  const { editorRef, fetchPageDescription, hasConnectionFailed, updatePageDescription } = args;

  const handleUpdateDescription = useCallback(async () => {
    if (!hasConnectionFailed) return;
    const editor = editorRef.current;
    if (!editor) return;

    try {
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
      const encodedBinary = Buffer.from(binary).toString("base64");

      await updatePageDescription({
        description_binary: encodedBinary,
        description_html: html,
        description: json,
      });
    } catch (error) {
      console.error("Error in updating description using fallback logic:", error);
    }
  }, [editorRef, fetchPageDescription, hasConnectionFailed, updatePageDescription]);

  useEffect(() => {
    if (hasConnectionFailed) {
      handleUpdateDescription();
    }
  }, [handleUpdateDescription, hasConnectionFailed]);

  useAutoSave(handleUpdateDescription);
};
