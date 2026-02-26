/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// ce types
import type { TPageFlagHookArgs, TPageFlagHookReturnType } from "@/ce/hooks/use-page-flag";
// plane web hooks
import { useFlag } from "@/plane-web/hooks/store";

export const usePageFlag = (args: TPageFlagHookArgs): TPageFlagHookReturnType => {
  const { workspaceSlug } = args;
  // feature flag
  const isMovePageEnabled = useFlag(workspaceSlug, "MOVE_PAGES");
  const isPageAiSummaryEnabled = useFlag(workspaceSlug, "AI_PAGES_SUMMARY");
  const isPageSharingEnabled = useFlag(workspaceSlug, "SHARED_PAGES");
  return {
    isMovePageEnabled,
    isPageAiSummaryEnabled,
    isPageSharingEnabled,
  };
};
