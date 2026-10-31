/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { formatDuration, toDateKey } from "@plane/services";
import { useTranslation } from "@plane/i18n";
import type { TTimeSummary } from "@plane/types";

type Props = {
  /** First day of the displayed week, `YYYY-MM-DD`. */
  from: string;
  summary: TTimeSummary | undefined;
};

/** The seven local days starting at `from`. */
const getDays = (from: string): Date[] => {
  const [year, month, day] = from.split("-").map(Number);
  return Array.from({ length: 7 }, (_, index) => new Date(year, month - 1, day + index));
};

export function WeekSummary(props: Props) {
  const { from, summary } = props;
  // hooks
  const { t, currentLocale } = useTranslation();

  const secondsByDay = new Map((summary?.by_day ?? []).map((row) => [row.date, row.seconds]));
  const days = getDays(from).map((date) => ({ date, seconds: secondsByDay.get(toDateKey(date)) ?? 0 }));
  const peak = Math.max(1, ...days.map((day) => day.seconds));
  const weekday = new Intl.DateTimeFormat(currentLocale, { weekday: "short" });

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-subtle bg-surface-1 p-4">
      <div className="flex gap-8">
        <div>
          <p className="text-caption-sm-regular text-tertiary">{t("team_ops.summary.total")}</p>
          <p className="text-h5-semibold text-primary">{formatDuration(summary?.total_seconds ?? 0, currentLocale)}</p>
        </div>
        <div>
          <p className="text-caption-sm-regular text-tertiary">{t("team_ops.summary.billable")}</p>
          <p className="text-h5-semibold text-primary">
            {formatDuration(summary?.billable_seconds ?? 0, currentLocale)}
          </p>
        </div>
      </div>
      <ul className="grid grid-cols-7 gap-2">
        {days.map(({ date, seconds }) => (
          <li key={toDateKey(date)} className="flex flex-col items-center gap-1">
            <div className="flex h-20 w-full items-end rounded-sm bg-layer-1">
              <div
                className="w-full rounded-sm bg-accent-primary"
                style={{ height: `${Math.round((seconds / peak) * 100)}%` }}
                role="img"
                aria-label={`${weekday.format(date)} ${formatDuration(seconds, currentLocale)}`}
              />
            </div>
            <span className="text-caption-sm-regular text-tertiary">{weekday.format(date)}</span>
            <span className="text-caption-sm-regular text-secondary tabular-nums">
              {seconds > 0 ? formatDuration(seconds, currentLocale) : "–"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
