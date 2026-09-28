/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// hooks
import { useCurrentTime } from "@/hooks/use-current-time";

type Props = {
  timeZone: string | undefined;
};

export function ProfileSidebarTime(props: Props) {
  const { timeZone } = props;
  // current time hook
  const { currentTime } = useCurrentTime();

  // Create a date object for the current time in the specified timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone,
    hour12: false, // Use 24-hour format
    hour: "2-digit",
    minute: "2-digit",
  });
  const timeString = formatter.format(currentTime);

  return (
    <span>
      {timeString} <span className="text-secondary">{timeZone}</span>
    </span>
  );
}
