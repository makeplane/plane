// plane imports
import { useEffect } from "react";
import { TEditorFlaggingHookReturnType } from "ce/hooks/use-editor-flagging";
import type { TExtensions } from "@plane/editor";
import { useFeatureFlags } from "./store";

/**
 * @description extensions disabled in various editors
 */
export const useEditorFlagging = (anchor: string): TEditorFlaggingHookReturnType => {
  const { fetchFeatureFlag, getFeatureFlag, hasFetchedFeatureFlag } = useFeatureFlags();

  useEffect(() => {
    if (!hasFetchedFeatureFlag(anchor, "EDITOR_MATHEMATICS")) {
      fetchFeatureFlag(anchor, "EDITOR_MATHEMATICS");
    }
  }, [anchor, fetchFeatureFlag, hasFetchedFeatureFlag]);

  const isMathematicsEnabled = getFeatureFlag(anchor, "EDITOR_MATHEMATICS", true);

  const documentDisabled: TExtensions[] = [];
  const documentFlagged: TExtensions[] = [];
  // disabled and flagged in the rich text editor
  const richTextDisabled: TExtensions[] = [];
  const richTextFlagged: TExtensions[] = [];
  // disabled and flagged in the lite text editor
  const liteTextDisabled: TExtensions[] = [];
  const liteTextFlagged: TExtensions[] = [];

  if (!isMathematicsEnabled) {
    documentFlagged.push("mathematics");
    richTextFlagged.push("mathematics");
    liteTextFlagged.push("mathematics");
  }

  return {
    document: {
      disabled: documentDisabled,
      flagged: documentFlagged,
    },
    liteText: {
      disabled: liteTextDisabled,
      flagged: liteTextFlagged,
    },
    richText: {
      disabled: richTextDisabled,
      flagged: richTextFlagged,
    },
  };
};
