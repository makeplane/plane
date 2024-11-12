import { useCallback, useEffect, useState } from "react";
// plane editor
import {
  convertBase64StringToBinaryData,
  EditorRefApi,
  getBinaryDataFromRichTextEditorHTMLString,
} from "@plane/editor";

type TArgs = {
  descriptionBinary: string | null;
  descriptionHTML: string | null;
  updateDescription?: (data: string) => Promise<ArrayBuffer>;
};

export const useIssueDescription = (args: TArgs) => {
  const { descriptionBinary: savedDescriptionBinary, descriptionHTML, updateDescription } = args;
  // states
  const [descriptionBinary, setDescriptionBinary] = useState<Uint8Array | null>(null);
  // update description
  const resolveConflictsAndUpdateDescription = useCallback(
    async (encodedDescription: string, editorRef: EditorRefApi | null) => {
      if (!updateDescription) return;
      try {
        const conflictFreeEncodedDescription = await updateDescription(encodedDescription);
        const decodedDescription = conflictFreeEncodedDescription
          ? new Uint8Array(conflictFreeEncodedDescription)
          : new Uint8Array();
        editorRef?.setProviderDocument(decodedDescription);
      } catch (error) {
        console.error("Error while updating description", error);
      }
    },
    [updateDescription]
  );

  useEffect(() => {
    if (descriptionBinary) return;
    if (savedDescriptionBinary) {
      const savedDescriptionBuffer = convertBase64StringToBinaryData(savedDescriptionBinary);
      const decodedSavedDescription = savedDescriptionBuffer
        ? new Uint8Array(savedDescriptionBuffer)
        : new Uint8Array();
      setDescriptionBinary(decodedSavedDescription);
    } else {
      const decodedDescriptionHTML = getBinaryDataFromRichTextEditorHTMLString(descriptionHTML ?? "<p></p>");
      setDescriptionBinary(decodedDescriptionHTML);
    }
  }, [descriptionBinary, descriptionHTML, savedDescriptionBinary]);

  return {
    descriptionBinary,
    resolveConflictsAndUpdateDescription,
  };
};
