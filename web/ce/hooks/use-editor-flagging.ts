// editor
import { TExtensions } from "@plane/editor";

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
export const useEditorFlagging = (workspaceSlug: string): TEditorFlaggingHookReturnType => ({
  document: {
    disabled: ["ai", "collaboration-cursor"],
    flagged: [],
  },
  liteText: {
    disabled: ["ai", "collaboration-cursor"],
    flagged: [],
  },
  richText: {
    disabled: ["ai", "collaboration-cursor"],
    flagged: [],
  },
});
