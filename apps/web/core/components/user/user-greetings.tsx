/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane types
import { useTranslation } from "@plane/i18n";
// hooks
import type { IUser } from "@plane/types";
// [FA-CUSTOM] Calendar-aware date formatting (English text, Jalali calendar)
import { getCalendarSystem } from "@plane/utils";
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

  const hour = new Intl.DateTimeFormat("en-US", {
    hour12: false,
    hour: "numeric",
  }).format(currentTime);

  // [FA-CUSTOM] Use Intl with persian calendar for Jalali — always English text
  const dateLocale = getCalendarSystem() === "jalali" ? "en-US-u-ca-persian" : "en-US";
  const date = new Intl.DateTimeFormat(dateLocale, { month: "short", day: "numeric" }).format(currentTime);
  const weekDay = new Intl.DateTimeFormat(dateLocale, { weekday: "long" }).format(currentTime);
  const timeString = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(currentTime);

  const greeting = parseInt(hour, 10) < 12 ? "morning" : parseInt(hour, 10) < 18 ? "afternoon" : "evening";

  return (
    <div className="flex flex-col items-center my-6">
      <h2 className="text-20 font-semibold text-center">
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
