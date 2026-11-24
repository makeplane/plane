/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: the "Work log" view of the Activity page. Log entries of the chosen range, newest
// first, under one heading per day; more pages load while scrolling.

import { useMemo, useState } from "react";
import type { RefObject } from "react";
import useSWRInfinite from "swr/infinite";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { ListLoaderItemRow } from "@/components/ui/loader/layouts/list-layout-loader";
import { ActivitySettingsLoader } from "@/components/ui/loader/settings/activity";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { projectActivityService } from "./activity.service";
import { ActivityEventRow } from "./activity-event-row";
import { coveredMinutes } from "./grid";
import type { TActivityEvent, TActivityEventsPage, TActivityQuery } from "./types";

type Props = {
  workspaceSlug: string;
  projectId: string;
  query: TActivityQuery;
  locale: string;
  // Scrolling container of the page, for loading more entries
  containerRef: RefObject<HTMLDivElement | null>;
  // Changes after an entry was added, changed or deleted: reloads the list
  version: number;
  canAdd: boolean;
  onAdd: () => void;
  canChange: (event: TActivityEvent) => boolean;
  onEdit: (event: TActivityEvent) => void;
  onDelete: (event: TActivityEvent) => void;
};

type TDay = { date: string; entries: TActivityEvent[]; minutes: number };

// An entry without an end fills one quarter
const MOMENT_MINUTES = 15;

function formatDuration(minutes: number) {
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function ActivityLogList(props: Props) {
  const { workspaceSlug, projectId, query, locale, containerRef, version, canAdd, onAdd } = props;
  const { t } = useTranslation();
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);

  const baseKey = `LIVIERE_ACTIVITY_LOGS_${projectId}_${query.from}_${query.to}_${query.tz}_${query.actor ?? ""}_${version}`;
  const { data, error, size, setSize, isLoading, isValidating } = useSWRInfinite(
    (index: number, previous: TActivityEventsPage | null) =>
      previous && !previous.next_page_results ? null : [baseKey, previous?.next_cursor],
    ([, cursor]: [string, string | undefined]) =>
      projectActivityService.getLogs(workspaceSlug, projectId, query, cursor),
    { revalidateOnFocus: false, revalidateFirstPage: false }
  );

  const days = useMemo(() => {
    // Local date of the start of an entry, YYYY-MM-DD
    const dateOf = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: query.tz,
    });
    const grouped: TDay[] = [];
    for (const entry of (data ?? []).flatMap((page) => page.results)) {
      const date = dateOf.format(new Date(entry.occurred_at));
      let day = grouped[grouped.length - 1];
      if (day?.date !== date) {
        day = { date, entries: [], minutes: 0 };
        grouped.push(day);
      }
      day.entries.push(entry);
    }
    // Time covered by the day's entries: parallel sessions and overlapping entries count once
    for (const day of grouped) {
      day.minutes = coveredMinutes(
        day.entries.map((entry) => {
          const start = new Date(entry.occurred_at).getTime();
          return [start, entry.ended_at ? new Date(entry.ended_at).getTime() : start + MOMENT_MINUTES * 60_000];
        })
      );
    }
    return grouped;
  }, [data, query.tz]);

  const lastPage = data?.[data.length - 1];
  const hasMore = !!lastPage?.next_page_results;
  const isLoadingMore = isValidating && size > (data?.length ?? 0);
  useIntersectionObserver(
    containerRef,
    hasMore && !isLoadingMore ? sentinel : null,
    () => void setSize((current) => current + 1),
    "200px"
  );

  // 24-hour clock, like the hour labels of the grid
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: query.tz,
  });
  const dayTitle = new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" });
  // One time column for all rows; wider when entries show a range
  const timeWidth = days.some((day) => day.entries.some((entry) => entry.ended_at)) ? "w-24" : "w-12";

  if (error) return <p className="text-13 text-danger-primary">{t("liviere.activity.load_error")}</p>;
  if (isLoading || !data) return <ActivitySettingsLoader />;
  if (days.length === 0) {
    return (
      <EmptyStateCompact
        assetKey="worklog"
        title={t("liviere.activity.log.empty_title")}
        description={t("liviere.activity.log.empty_description")}
        actions={canAdd ? [{ label: t("liviere.activity.log.add"), onClick: onAdd }] : undefined}
        rootClassName="py-16"
      />
    );
  }

  return (
    <div className="flex flex-col">
      {/* Headings stick to the top edge of the page container, above its padding (py-5) */}
      {days.map((day) => (
        <section key={day.date}>
          <header className="sticky -top-5 z-[1] flex items-baseline justify-between gap-3 border-b border-subtle bg-surface-1 py-2">
            <h3 className="text-13 font-medium text-primary">{dayTitle.format(new Date(`${day.date}T00:00:00Z`))}</h3>
            <span className="text-12 text-tertiary">
              {t("liviere.activity.log.day_summary", {
                count: day.entries.length,
                duration: formatDuration(day.minutes),
              })}
            </span>
          </header>
          <ul>
            {day.entries.map((entry) => (
              <ActivityEventRow
                key={entry.id}
                event={entry}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                time={time}
                timeWidth={timeWidth}
                canChange={props.canChange}
                onEdit={props.onEdit}
                onDelete={props.onDelete}
                hideKind
                className="border-b border-subtle px-1 py-3 hover:bg-layer-transparent-hover"
              />
            ))}
          </ul>
        </section>
      ))}
      {hasMore &&
        (isLoadingMore ? (
          <ListLoaderItemRow />
        ) : (
          <div ref={setSentinel}>
            <button
              type="button"
              onClick={() => void setSize(size + 1)}
              className="flex h-11 items-center p-3 text-13 font-medium text-accent-primary hover:text-accent-secondary hover:underline"
            >
              {t("common.load_more")} ↓
            </button>
          </div>
        ))}
    </div>
  );
}
