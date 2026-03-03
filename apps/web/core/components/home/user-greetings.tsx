/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
// plane types
import { useTranslation } from "@plane/i18n";
import type { IUser } from "@plane/types";
// plane ui
// hooks
import { useCurrentTime } from "@/hooks/use-current-time";

export interface IUserGreetingsView {
  user: IUser;
}

export function UserGreetingsView(props: IUserGreetingsView) {
  const { user } = props;
  // current time hook
  const { currentTime } = useCurrentTime();
  // store hooks
  const { t, currentLocale } = useTranslation();
  const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const userTimeZone = user?.user_timezone;
  const effectiveTimeZone = userTimeZone && userTimeZone !== "UTC" ? userTimeZone : browserTimeZone;

  const hour = new Intl.DateTimeFormat(currentLocale, {
    hour12: false,
    hour: "numeric",
    timeZone: effectiveTimeZone,
  }).format(currentTime);

  const date = new Intl.DateTimeFormat(currentLocale, {
    month: "short",
    day: "numeric",
    timeZone: effectiveTimeZone,
  }).format(currentTime);

  const weekDay = new Intl.DateTimeFormat(currentLocale, {
    weekday: "long",
    timeZone: effectiveTimeZone,
  }).format(currentTime);

  const timeString = new Intl.DateTimeFormat(currentLocale, {
    timeZone: effectiveTimeZone,
    hour12: false, // Use 24-hour format
    hour: "2-digit",
    minute: "2-digit",
  }).format(currentTime);

  const greeting = parseInt(hour, 10) < 12 ? "morning" : parseInt(hour, 10) < 18 ? "afternoon" : "evening";
  const salutation = currentLocale.startsWith("es") ? t(`good_${greeting}`) : `${t("good")} ${t(greeting)}`;

  return (
    <div className="flex flex-col items-center my-6">
      <h2 className="text-20 font-semibold text-center">
        {salutation}, {user?.first_name} {user?.last_name}
      </h2>
      <h5 className="flex items-center gap-2 font-medium text-placeholder">
        <div>{greeting === "morning" ? "🌤️" : greeting === "afternoon" ? "🌥️" : "🌙️"}</div>
        <div>
          {weekDay}, {date} {timeString}
        </div>
      </h5>
    </div>
  );
}
