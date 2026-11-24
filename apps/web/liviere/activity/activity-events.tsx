/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: actions of one heatmap quarter, with links to what they changed (rows:
// activity-event-row.tsx).

import { useEffect, useRef } from "react";
import useSWR from "swr";
import { X } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/ui";
import { projectActivityService } from "./activity.service";
import type { TSelectedBucket } from "./activity-root";
import { ActivityEventRow } from "./activity-event-row";
import { slotBounds, slotRange } from "./grid";
import type { TActivityEvent, TActivityQuery } from "./types";

type Props = {
  workspaceSlug: string;
  projectId: string;
  query: TActivityQuery;
  selected: TSelectedBucket;
  locale: string;
  onClose: () => void;
  canChange: (event: TActivityEvent) => boolean;
  onEdit: (event: TActivityEvent) => void;
  onDelete: (event: TActivityEvent) => void;
};

export function ActivityEventList(props: Props) {
  const { workspaceSlug, projectId, query, selected, locale, onClose, canChange, onEdit, onDelete } = props;
  const { t } = useTranslation();
  const { start, end } = slotBounds(selected.date, selected.slot);
  const { data, error, isLoading } = useSWR(
    `LIVIERE_ACTIVITY_EVENTS_${projectId}_${query.tz}_${query.actor ?? ""}_${start}`,
    () => projectActivityService.getEvents(workspaceSlug, projectId, { ...query, start, end }),
    { revalidateOnFocus: false }
  );
  // 24-hour clock, like the hour labels of the grid
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: query.tz,
  });
  const sectionRef = useRef<HTMLElement>(null);
  // The list opens below the grid; bring it into view
  useEffect(() => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selected.date, selected.slot]);
  const day = new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" });
  // One time column for all rows; wider when log entries show a range
  const timeWidth = data?.results.some((event) => event.ended_at) ? "w-24" : "w-12";

  return (
    <section ref={sectionRef} className="rounded-md border border-subtle bg-layer-1 p-4">
      <header className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-14 font-medium text-primary">
          {day.format(new Date(`${selected.date}T00:00:00Z`))}, {slotRange(selected.slot)}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("liviere.activity.close")}
          className="rounded-sm p-1 text-tertiary hover:bg-layer-transparent-hover"
        >
          <X className="size-4" />
        </button>
      </header>
      {error ? (
        <p className="text-13 text-danger-primary">{t("liviere.activity.load_error")}</p>
      ) : isLoading || !data ? (
        <Loader className="flex flex-col gap-2">
          <Loader.Item height="20px" width="100%" />
          <Loader.Item height="20px" width="80%" />
        </Loader>
      ) : data.results.length === 0 ? (
        <p className="text-13 text-tertiary">{t("liviere.activity.no_activity")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.results.map((event) => (
            <ActivityEventRow
              key={event.id}
              event={event}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              time={time}
              timeWidth={timeWidth}
              canChange={canChange}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          {data.next_page_results && (
            <li className="text-12 text-tertiary">{t("liviere.activity.more_events", { count: data.total_count })}</li>
          )}
        </ul>
      )}
    </section>
  );
}
