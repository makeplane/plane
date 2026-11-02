/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// hooks
import { useCurrentTime } from "@/hooks/use-current-time";
import { useDisplayTimezone } from "@/hooks/use-display-timezone";

type Props = {
  timeZone: string | undefined;
};

export const ProfileSidebarTime = observer(function ProfileSidebarTime(props: Props) {
  const { timeZone } = props;
  // current time hook
  const { currentTime } = useCurrentTime();
  // resolved display timezone: user preference (UTC treated as unset) -> workspace timezone -> browser local
  const resolvedTimeZone = useDisplayTimezone(timeZone);
  // when both are unset the browser's local timezone is used; resolve its name for display
  const displayTimeZone = resolvedTimeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Create a date object for the current time in the specified timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: displayTimeZone,
    hour12: false, // Use 24-hour format
    hour: "2-digit",
    minute: "2-digit",
  });
  const timeString = formatter.format(currentTime);

  return (
    <span>
      {timeString} <span className="text-secondary">{displayTimeZone}</span>
    </span>
  );
});
