import { useCallback, useEffect, useState } from "react";
// plane editor
import { EditorRefApi, getBinaryDataFromRichTextEditorHTMLString } from "@plane/editor";

type TArgs = {
  descriptionHTML: string | null;
  fetchDescription: () => Promise<any>;
  id: string;
  updateDescription?: (data: string) => Promise<any>;
};

export const useIssueDescription = (args: TArgs) => {
  const { descriptionHTML, fetchDescription, id, updateDescription } = args;
  // states
  const [descriptionBinary, setDescriptionBinary] = useState<Uint8Array | null>(null);
  // update description
  const resolveConflictsAndUpdateDescription = useCallback(
    async (encodedDescription: string, editorRef: EditorRefApi | null) => {
      if (!updateDescription) return;
      const conflictFreeEncodedDescription = await updateDescription(encodedDescription);
      const decodedDescription = conflictFreeEncodedDescription
        ? new Uint8Array(conflictFreeEncodedDescription)
        : new Uint8Array();
      editorRef?.setProviderDocument(decodedDescription);
    },
    [updateDescription]
  );

  useEffect(() => {
    if (descriptionBinary) return;
    // fetch latest binary description
    const fetchDecodedDescription = async () => {
      const encodedDescription = await fetchDescription();
      let decodedDescription = encodedDescription ? new Uint8Array(encodedDescription) : new Uint8Array();
      // if there's no binary data present, convert existing HTML string to binary
      if (decodedDescription.length === 0) {
        decodedDescription = getBinaryDataFromRichTextEditorHTMLString(descriptionHTML ?? "<p></p>");
      } else {
        // decode binary string
        decodedDescription = new Uint8Array(encodedDescription);
      }
      setDescriptionBinary(decodedDescription);
    };
    fetchDecodedDescription();
  }, [descriptionBinary, descriptionHTML, fetchDescription]);

  useEffect(() => {
    setDescriptionBinary(null);
  }, [id]);

  return {
    descriptionBinary,
    resolveConflictsAndUpdateDescription,
  };
};
