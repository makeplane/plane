import { useCallback } from "react";
import useSWR from "swr";
// plane editor
import { EditorRefApi } from "@plane/editor";
// plane types
import { TDocumentPayload } from "@plane/types";
// helpers
import { LIVE_URL } from "@/helpers/common.helper";
// hooks
import useAutoSave from "@/hooks/use-auto-save";

type TArgs = {
  editorRef: React.RefObject<EditorRefApi>;
  fetchPageDescription: () => Promise<any>;
  updatePageDescription: (data: TDocumentPayload) => Promise<void>;
};

export const usePageFallback = (args: TArgs) => {
  const { editorRef, fetchPageDescription, updatePageDescription } = args;

  const { error } = useSWR("LIVE_SERVER_HEALTH_CHECK", async () => await fetch(`${LIVE_URL}/collaboration/health`), {
    errorRetryCount: 5,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const handleUpdateDescription = useCallback(async () => {
    if (!error) return;
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
  }, [error]);

  useAutoSave(handleUpdateDescription);
};
