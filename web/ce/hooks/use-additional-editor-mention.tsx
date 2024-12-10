import { useCallback } from "react";
// plane editor
import { TMentionSection } from "@plane/editor";
// plane types
import { TSearchResponse } from "@plane/types";

export type TAdditionalEditorMentionHandlerArgs = {
  response: TSearchResponse;
  sections: TMentionSection[];
};

export const useAdditionalEditorMention = () => {
  const updateAdditionalSections = useCallback((args: TAdditionalEditorMentionHandlerArgs) => {
    const {} = args;
  }, []);

  return {
    updateAdditionalSections,
  };
};
