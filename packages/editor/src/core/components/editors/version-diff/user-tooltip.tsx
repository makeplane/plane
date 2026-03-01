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

import React, { memo, useMemo, useState } from "react";

export type TUserInfo = {
  id: string;
  display_name: string;
  avatar_url?: string | null;
  email?: string;
};

export type TUserTooltipProps = {
  userId: string | null;
  userMap?: Map<string, TUserInfo> | null;
  children: React.ReactNode;
  changeType?: "added" | "removed" | null;
};

const CHANGE_TYPE_LABELS = {
  added: "Added",
  removed: "Deleted",
} as const;

/**
 * Tooltip component that displays user information on hover
 * Shows when hovering over ychange elements
 * Wrapped in React.memo for re-render optimization (rerender-memo)
 */
export const UserTooltip: React.FC<TUserTooltipProps> = memo(({ userId, userMap, children, changeType }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Get user info from the map
  const userInfo = userId && userMap ? userMap.get(userId) : null;

  // Memoize label lookup to avoid recalculation
  const changeTypeLabel = useMemo(() => (changeType ? CHANGE_TYPE_LABELS[changeType] : "Changed"), [changeType]);

  if (!userInfo) {
    // If no user info available, just render children without tooltip
    return <>{children}</>;
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}

      {showTooltip ? (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-custom-background-90 border border-custom-border-200 rounded-lg shadow-lg px-3 py-2 whitespace-nowrap text-xs">
            <div className="flex items-center gap-2">
              {userInfo.avatar_url ? (
                <img src={userInfo.avatar_url} alt={userInfo.display_name} className="w-5 h-5 rounded-full" />
              ) : null}
              <div>
                <div className="font-medium text-custom-text-100">{userInfo.display_name}</div>
                <div className="text-custom-text-300">{changeTypeLabel}</div>
                {userInfo.email ? <div className="text-custom-text-400 text-xs">{userInfo.email}</div> : null}
              </div>
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-custom-background-90" />
          </div>
        </div>
      ) : null}
    </div>
  );
});

UserTooltip.displayName = "UserTooltip";
