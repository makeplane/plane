/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane types
import { useTranslation } from "@plane/i18n";
// hooks
import type { IUser } from "@plane/types";
import { useCurrentTime } from "@/hooks/use-current-time";
// types

export interface IUserGreetingsView {
  user: IUser;
}

export function UserGreetingsView(props: IUserGreetingsView) {
  const { user } = props;
  // current time hook
  const { currentTime } = useCurrentTime();
  // store hooks
  const { t } = useTranslation();

  const userTimezone = (() => {
    if (!user?.user_timezone) return undefined;
    try {
      Intl.DateTimeFormat(undefined, { timeZone: user.user_timezone });
      return user.user_timezone;
    } catch {
      return undefined;
    }
  })();

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
  const greeting = hourNum < 5 ? "night" : hourNum < 12 ? "morning" : hourNum < 18 ? "afternoon" : "evening";

  return (
    <div className="my-6 flex flex-col items-center">
      <h2 className="text-center text-20 font-semibold">
        {t("good")} {t(greeting)}, {user?.first_name} {user?.last_name}
      </h2>
      <h5 className="flex items-center gap-2 font-medium text-placeholder">
        <div>{greeting === "morning" ? "🌤️" : greeting === "afternoon" ? "🌥️" : "🌙"}</div>
        <div>
          {weekDay}, {date} {timeString}
        </div>
      </h5>
    </div>
  );
}
