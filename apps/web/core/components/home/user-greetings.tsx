/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
  const { t } = useTranslation();

  const hour = new Intl.DateTimeFormat("en-US", {
    hour12: false,
    hour: "numeric",
  }).format(currentTime);

  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(currentTime);

  const weekDay = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(currentTime);

  const timeString = new Intl.DateTimeFormat("en-US", {
    timeZone: user?.user_timezone,
    hour12: false, // Use 24-hour format
    hour: "2-digit",
    minute: "2-digit",
  }).format(currentTime);

  const greeting =
    parseInt(hour, 10) < 12 ? "good_morning" : parseInt(hour, 10) < 18 ? "good_afternoon" : "good_evening";

  return (
    <div className="my-6 flex flex-col items-center">
      <h2 className="text-center text-20 font-semibold">
        {t(greeting)}, {user?.first_name} {user?.last_name}
      </h2>
      <h5 className="flex items-center gap-2 font-medium text-placeholder">
        <div>{greeting === "good_morning" ? "🌤️" : greeting === "good_afternoon" ? "🌥️" : "🌙️"}</div>
        <div>
          {weekDay}, {date} {timeString}
        </div>
      </h5>
    </div>
  );
}
