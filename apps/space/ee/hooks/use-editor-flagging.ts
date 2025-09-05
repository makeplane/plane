// plane imports
import { useEffect } from "react";
import type { TExtensions } from "@plane/editor";
import { TEditorFlaggingHookReturnType } from "ce/hooks/use-editor-flagging";
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
    if (!hasFetchedFeatureFlag(anchor, "EDITOR_EXTERNAL_EMBEDS")) {
      fetchFeatureFlag(anchor, "EDITOR_EXTERNAL_EMBEDS");
    }
  }, [anchor, fetchFeatureFlag, hasFetchedFeatureFlag]);

  const isMathematicsEnabled = getFeatureFlag(anchor, "EDITOR_MATHEMATICS", true);
  const isExternalEmbedEnabled = getFeatureFlag(anchor, "EDITOR_EXTERNAL_EMBEDS", true);

  const documentDisabled: TExtensions[] = [];
  const documentFlagged: TExtensions[] = [];
  // disabled and flagged in the rich text editor
  const richTextDisabled: TExtensions[] = [];
  const richTextFlagged: TExtensions[] = [];
  // disabled and flagged in the lite text editor
  const liteTextDisabled: TExtensions[] = [];
  const liteTextFlagged: TExtensions[] = [];

  liteTextDisabled.push("external-embed");

  if (!isMathematicsEnabled) {
    documentFlagged.push("mathematics");
    richTextFlagged.push("mathematics");
    liteTextFlagged.push("mathematics");
  }

  if (!isExternalEmbedEnabled) {
    documentFlagged.push("external-embed");
    richTextFlagged.push("external-embed");
    liteTextFlagged.push("external-embed");
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
