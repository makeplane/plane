import { useCallback } from "react";
// plane editor
import { TMentionSection } from "@plane/editor";
// plane types
import { TSearchEntities, TSearchResponse } from "@plane/types";

export type TAdditionalEditorMentionHandlerArgs = {
  response: TSearchResponse;
  sections: TMentionSection[];
};

export type TAdditionalParseEditorContentArgs = {
  id: string;
  entityType: TSearchEntities;
};

export type TAdditionalParseEditorContentReturnType =
  | {
      redirectionPath: string;
      textContent: string;
    }
  | undefined;

export const useAdditionalEditorMention = () => {
  const updateAdditionalSections = useCallback((args: TAdditionalEditorMentionHandlerArgs) => {
    const {} = args;
  }, []);

  const parseAdditionalEditorContent = useCallback(
    (args: TAdditionalParseEditorContentArgs): TAdditionalParseEditorContentReturnType => {
      const {} = args;
      return undefined;
    },
    []
  );

  return {
    updateAdditionalSections,
    parseAdditionalEditorContent,
  };
};
