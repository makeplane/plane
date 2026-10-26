/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { renderFormattedTime, resolveTimeFormat } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserProfile } from "@/hooks/store/user";

/**
 * Resolves the clock the current user sees times in: their profile choice,
 * else the current workspace default. Use inside `observer` components.
 */
export const useTimeFormat = () => {
  const { data: profile } = useUserProfile();
  const { currentWorkspace } = useWorkspace();

  const timeFormat = resolveTimeFormat(profile?.time_format, currentWorkspace?.time_format);

  const formatTime = useCallback((date: string | Date) => renderFormattedTime(date, timeFormat), [timeFormat]);

  return { timeFormat, formatTime };
};
