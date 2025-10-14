// editor
import type { TExtensions } from "@plane/editor";

export type TEditorFlaggingHookReturnType = {
  document: {
    disabled: TExtensions[];
    flagged: TExtensions[];
  };
  liteText: {
    disabled: TExtensions[];
    flagged: TExtensions[];
  };
  richText: {
    disabled: TExtensions[];
    flagged: TExtensions[];
  };
};

/**
 * @description extensions disabled in various editors
 */
export const useEditorFlagging = (anchor: string): TEditorFlaggingHookReturnType => ({
  document: {
    disabled: [],
    flagged: [],
  },
  liteText: {
    disabled: [],
    flagged: [],
  },
  richText: {
    disabled: [],
    flagged: [],
  },
});
