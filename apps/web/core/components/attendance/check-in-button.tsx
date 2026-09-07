/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { LoaderCircle, LogIn, LogOut, TriangleAlert } from "lucide-react";
// workspaces imports
import { Tooltip } from "@makeplane/propel/components/tooltip";
// components
import { AppSidebarItem } from "@/components/sidebar/sidebar-item";
// local imports
import { useAttendanceControl } from "./use-attendance";

/**
 * The attendance control in the workspace top bar.
 *
 * Icon only, because the bar is tight and tighter still on a phone. The label
 * and today's hours live in the tooltip, and on the home-page card, which is
 * the one that carries text.
 */
export const AttendanceCheckInButton = observer(function AttendanceCheckInButton() {
  const { isVisible, isCheckedIn, isNotLinked, isBusy, detailLabel, onPunch } = useAttendanceControl();

  if (!isVisible) return null;

  const Icon = isNotLinked ? TriangleAlert : isCheckedIn ? LogOut : LogIn;

  return (
    <Tooltip label={detailLabel} side="bottom">
      <AppSidebarItem
        variant="button"
        item={{
          icon: (
            <div className="relative">
              {isBusy ? <LoaderCircle className="size-5 animate-spin" /> : <Icon className="size-5" />}
              {isCheckedIn && !isBusy && (
                <span className="absolute top-0 right-0 size-2 rounded-full bg-success-primary" />
              )}
            </div>
          ),
          onClick: onPunch,
          disabled: isBusy,
        }}
      />
    </Tooltip>
  );
});
