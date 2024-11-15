import { useCallback, useEffect } from "react";
// plane editor
import { EditorRefApi } from "@plane/editor";
// plane types
import { TDocumentPayload } from "@plane/types";
// hooks
import useAutoSave from "@/hooks/use-auto-save";

type TArgs = {
  editorRef: React.RefObject<EditorRefApi>;
  fetchPageDescription: () => Promise<any>;
  hasConnectionFailed: boolean;
  updatePageDescription: (data: TDocumentPayload) => Promise<void>;
};

export const usePageFallback = (args: TArgs) => {
  const { editorRef, fetchPageDescription, hasConnectionFailed, updatePageDescription } = args;

  const handleUpdateDescription = useCallback(async () => {
    if (!hasConnectionFailed) return;
    const editor = editorRef.current;
    if (!editor) return;

    const latestEncodedDescription = await fetchPageDescription();
    const latestDecodedDescription = latestEncodedDescription
      ? new Uint8Array(latestEncodedDescription)
      : new Uint8Array();

    editor.setProviderDocument(latestDecodedDescription);
    const { binary, html, json } = editor.getDocument();
    if (!binary || !json) return;
    const encodedBinary = Buffer.from(binary).toString("base64");

    await updatePageDescription({
      description_binary: encodedBinary,
      description_html: html,
      description: json,
    });
  }, [hasConnectionFailed]);

  useEffect(() => {
    if (hasConnectionFailed) {
      handleUpdateDescription();
    }
  }, [hasConnectionFailed]);

  useAutoSave(handleUpdateDescription);
};
