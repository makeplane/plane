export type TPageFlagHookArgs = {
  workspaceSlug: string;
};

export type TPageFlagHookReturnType = {
  isMovePageEnabled: boolean;
};

export const usePageFlag = (args: TPageFlagHookArgs): TPageFlagHookReturnType => {
  const {} = args;
  return {
    isMovePageEnabled: false,
  };
};
