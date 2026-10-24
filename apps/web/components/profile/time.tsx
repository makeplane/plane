/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// hooks
import { useCurrentTime } from "@/hooks/use-current-time";
import { useTimeFormat } from "@/hooks/use-time-format";

type Props = {
  timeZone: string | undefined;
};

export const ProfileSidebarTime = observer(function ProfileSidebarTime(props: Props) {
  const { timeZone } = props;
  // current time hook
  const { currentTime } = useCurrentTime();
  const { timeFormat } = useTimeFormat();

  // Create a date object for the current time in the specified timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone,
    hour12: timeFormat === "12-hour",
    hour: "2-digit",
    minute: "2-digit",
  });
  const timeString = formatter.format(currentTime);

  return (
    <span>
      {timeString} <span className="text-secondary">{timeZone}</span>
    </span>
  );
});
