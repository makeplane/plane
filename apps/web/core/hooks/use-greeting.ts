/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import type { IUser } from "@plane/types";
import { useCurrentTime } from "@/hooks/use-current-time";

export type TGreeting = "morning" | "afternoon" | "evening";

export const useGreeting = (_user: IUser) => {
  const { currentTime } = useCurrentTime();

  const hourFormatter = useMemo(
    () => new Intl.DateTimeFormat("en-US", { hourCycle: "h23", hour: "numeric" }),
    []
  );

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }),
    []
  );

  const weekDayFormatter = useMemo(
    () => new Intl.DateTimeFormat("en-US", { weekday: "long" }),
    []
  );

  const timeStringFormatter = useMemo(
    () => new Intl.DateTimeFormat("en-US", { hourCycle: "h23", hour: "2-digit", minute: "2-digit" }),
    []
  );

  const hour = hourFormatter.format(currentTime);
  const date = dateFormatter.format(currentTime);
  const weekDay = weekDayFormatter.format(currentTime);
  const timeString = timeStringFormatter.format(currentTime);

  const hourNum = parseInt(hour, 10);
  // 5–11: morning, 12–16: afternoon, 17–4: evening
  const greeting: TGreeting =
    hourNum >= 5 && hourNum < 12 ? "morning" : hourNum >= 12 && hourNum < 17 ? "afternoon" : "evening";

  return { greeting, timeString, weekDay, date };
};
