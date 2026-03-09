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

  // Use profile timezone when set to a real zone; treat UTC/Etc/UTC as unset (common
  // backend default) so we show local time. Otherwise use browser/OS timezone.
  const profileZone = user?.user_timezone?.trim();
  const isUtcDefault =
    !profileZone || profileZone === "UTC" || profileZone === "Etc/UTC" || profileZone.toLowerCase() === "utc";
  const timeZone = isUtcDefault
    ? typeof Intl !== "undefined" && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : undefined
    : profileZone;

  const hour = new Intl.DateTimeFormat("en-US", {
    hour12: false,
    hour: "numeric",
    ...(timeZone && { timeZone }),
  }).format(currentTime);

  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(timeZone && { timeZone }),
  }).format(currentTime);

  const weekDay = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    ...(timeZone && { timeZone }),
  }).format(currentTime);

  const timeString = new Intl.DateTimeFormat("en-US", {
    ...(timeZone && { timeZone }),
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).format(currentTime);

  const greeting = parseInt(hour, 10) < 12 ? "morning" : parseInt(hour, 10) < 18 ? "afternoon" : "evening";

  return (
    <div className="my-6 flex flex-col items-center">
      <h2 className="text-center text-20 font-semibold">
        {t("good")} {t(greeting)}, {user?.first_name} {user?.last_name}
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
