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
  const { t, currentLocale } = useTranslation();

  const userTimeZone = user?.user_timezone;
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ");

  // the greeting and the clock below it read the same timezone, so they can never disagree
  const hour = new Intl.DateTimeFormat("en-US", {
    hourCycle: "h23",
    hour: "2-digit",
    timeZone: userTimeZone,
  }).format(currentTime);

  const date = new Intl.DateTimeFormat(currentLocale, {
    month: "short",
    day: "numeric",
    timeZone: userTimeZone,
  }).format(currentTime);

  const weekDay = new Intl.DateTimeFormat(currentLocale, {
    weekday: "long",
    timeZone: userTimeZone,
  }).format(currentTime);

  const timeString = new Intl.DateTimeFormat(currentLocale, {
    timeZone: userTimeZone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).format(currentTime);

  const hourValue = parseInt(hour, 10);
  const greeting = hourValue < 12 ? "good_morning" : hourValue < 18 ? "good_afternoon" : "good_evening";

  return (
    <div className="my-6 flex flex-col items-center">
      <h2 className="text-center text-20 font-semibold">{t(greeting, { name: displayName })}</h2>
      <h5 className="flex items-center gap-2 font-medium text-placeholder">
        <div>{greeting === "good_morning" ? "🌤️" : greeting === "good_afternoon" ? "🌥️" : "🌙️"}</div>
        <div>
          {weekDay}, {date} {timeString}
        </div>
      </h5>
    </div>
  );
}
