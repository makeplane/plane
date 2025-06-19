// ce types
import { TPageFlagHookArgs, TPageFlagHookReturnType } from "@/ce/hooks/use-page-flag";
// plane web hooks
import { useFlag } from "@/plane-web/hooks/store";

export const usePageFlag = (args: TPageFlagHookArgs): TPageFlagHookReturnType => {
  const { workspaceSlug } = args;
  // feature flag
  const isMovePageEnabled = useFlag(workspaceSlug, "MOVE_PAGES");
  const isPageSharingEnabled = useFlag(workspaceSlug, "SHARED_PAGES");
  return {
    isMovePageEnabled,
    isPageSharingEnabled,
  };
};
