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

export type TEditorFlaggingHookProps = {
  workspaceSlug: string;
  storeType?: EPageStoreType;
};

/**
 * @description extensions disabled in various editors
 */
export const useEditorFlagging = (props: TEditorFlaggingHookProps): TEditorFlaggingHookReturnType => ({
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
