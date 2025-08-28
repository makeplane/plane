// editor
import type { TExtensions } from "@plane/editor";
import { EPageStoreType } from "@/plane-web/hooks/store";

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
export const useEditorFlagging = (
  workspaceSlug: string,
  storeType?: EPageStoreType
): TEditorFlaggingHookReturnType => ({
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
