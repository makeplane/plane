/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import type { IUser } from "@plane/types";
import { useCurrentTime } from "@/hooks/use-current-time";

export type TGreeting = "morning" | "afternoon" | "evening";

export const useGreeting = (user: IUser) => {
  const { currentTime } = useCurrentTime();

  const userTimezone = useMemo(() => {
    if (!user?.user_timezone) return undefined;
    try {
      new Intl.DateTimeFormat(undefined, { timeZone: user.user_timezone });
      return user.user_timezone;
    } catch (e) {
      console.warn(
        `[useGreeting] Invalid user_timezone "${user.user_timezone}", falling back to browser timezone.`,
        e
      );
      return undefined;
    }
  }, [user?.user_timezone]);

  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: userTimezone,
    hourCycle: "h23",
    hour: "numeric",
  }).format(currentTime);

  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: userTimezone,
    month: "short",
    day: "numeric",
  }).format(currentTime);

  const weekDay = new Intl.DateTimeFormat("en-US", {
    timeZone: userTimezone,
    weekday: "long",
  }).format(currentTime);

  const timeString = new Intl.DateTimeFormat("en-US", {
    timeZone: userTimezone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).format(currentTime);

  const hourNum = parseInt(hour, 10);
  // 5–11: morning, 12–16: afternoon, 17–4: evening
  const greeting: TGreeting =
    hourNum >= 5 && hourNum < 12 ? "morning" : hourNum >= 12 && hourNum < 17 ? "afternoon" : "evening";

  return { greeting, timeString, weekDay, date };
};
