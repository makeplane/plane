import { useCallback, useMemo } from "react";
// plane editor
import type { TMentionSection } from "@plane/editor";
// plane types
import type { TSearchEntities, TSearchResponse } from "@plane/types";

export type TAdditionalEditorMentionHandlerArgs = {
  response: TSearchResponse;
};

export type TAdditionalEditorMentionHandlerReturnType = {
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
  const updateAdditionalSections = useCallback(
    (args: TAdditionalEditorMentionHandlerArgs): TAdditionalEditorMentionHandlerReturnType => {
      const {} = args;
      return {
        sections: [],
      };
    },
    []
  );

  const parseAdditionalEditorContent = useCallback(
    (args: TAdditionalParseEditorContentArgs): TAdditionalParseEditorContentReturnType => {
      const {} = args;
      return undefined;
    },
    []
  );

  const editorMentionTypes: TSearchEntities[] = useMemo(() => ["user_mention"], []);

  return {
    updateAdditionalSections,
    parseAdditionalEditorContent,
    editorMentionTypes,
  };
};
