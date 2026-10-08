/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TPageFlagHookArgs = {
  workspaceSlug: string;
};

export type TPageFlagHookReturnType = {
  isMovePageEnabled: boolean;
  isPageSharingEnabled: boolean;
};

export const usePageFlag = (args: TPageFlagHookArgs): TPageFlagHookReturnType => {
  const {} = args;
  return {
    isMovePageEnabled: false,
    isPageSharingEnabled: false,
  };
};
