// ce types
export type TPageFlagHookArgs = {
  workspaceSlug: string;
};

export type TPageFlagHookReturnType = {
  isMovePageEnabled: boolean;
};

// plane web hooks
import { useFlag } from "@/plane-web/hooks/store";

export const usePageFlag = (args: TPageFlagHookArgs): TPageFlagHookReturnType => {
  const { workspaceSlug } = args;
  // feature flag
  const isMovePageEnabled = useFlag(workspaceSlug, "MOVE_PAGES");
  return {
    isMovePageEnabled,
  };
};
