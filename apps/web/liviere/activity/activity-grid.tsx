/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: the heatmap itself. Up to 90 × 96 cells, so a single hover card follows the pointer
// instead of a tooltip component per cell. The current quarter has an amber outline; later quarters of today
// are dimmed.

import { useMemo, useRef, useState } from "react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { SLOTS_PER_DAY, bucketKey, daysInRange, indexBuckets, levelOf, levelThresholds, slotRange } from "./grid";
import type { TQuarter } from "./grid";
import type { TActivityHeatmap } from "./types";
import type { TSelectedBucket } from "./activity-root";

const LEVEL_CLASSES = [
  "bg-layer-3",
  "bg-accent-primary/25",
  "bg-accent-primary/50",
  "bg-accent-primary/75",
  "bg-accent-primary",
];
const NOW_CLASS = "outline-2 outline-offset-1 outline-warning-strong";
const HOUR_LABEL_EVERY = 3;
// Day label, then the 96 quarters; the quarters share the width, so the whole day fits on screen
const GRID_STYLE: React.CSSProperties = {
  gridTemplateColumns: `82px repeat(${SLOTS_PER_DAY}, minmax(5px, 1fr))`,
  columnGap: "2px",
};

type Props = {
  heatmap: TActivityHeatmap;
  locale: string;
  now: TQuarter;
  selected: TSelectedBucket | null;
  onSelect: (bucket: TSelectedBucket | null) => void;
};

type THover = { date: string; slot: number; x: number; y: number };

const cellFromEvent = (event: React.MouseEvent): { date: string; slot: number } | null => {
  const cell = (event.target as HTMLElement).closest<HTMLElement>("[data-slot]");
  if (!cell?.dataset.date || cell.dataset.slot === undefined) return null;
  return { date: cell.dataset.date, slot: Number(cell.dataset.slot) };
};

export function ActivityGrid(props: Props) {
  const { heatmap, locale, now, selected, onSelect } = props;
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<THover | null>(null);

  const days = useMemo(() => daysInRange(heatmap.from, heatmap.to), [heatmap.from, heatmap.to]);
  const buckets = useMemo(() => indexBuckets(heatmap.buckets), [heatmap.buckets]);
  const thresholds = useMemo(() => levelThresholds(heatmap.buckets.map((b) => b.count)), [heatmap.buckets]);
  const dayLabel = useMemo(() => {
    const format = new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "numeric",
      timeZone: "UTC",
    });
    return (date: string) => format.format(new Date(`${date}T00:00:00Z`));
  }, [locale]);

  const handleMove = (event: React.MouseEvent) => {
    const cell = cellFromEvent(event);
    const box = containerRef.current?.getBoundingClientRect();
    if (!cell || !box) return setHover(null);
    setHover({ ...cell, x: event.clientX - box.left, y: event.clientY - box.top });
  };

  const hovered = hover ? buckets.get(bucketKey(hover.date, hover.slot)) : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div ref={containerRef} className="relative overflow-x-auto pb-1">
        <div className="flex min-w-[760px] flex-col gap-[2px]">
          <div className="grid h-4 items-end text-11 text-tertiary" style={GRID_STYLE} aria-hidden="true">
            {Array.from({ length: SLOTS_PER_DAY / (4 * HOUR_LABEL_EVERY) }, (_, index) => (
              <span
                key={index}
                style={{ gridColumn: `${2 + index * 4 * HOUR_LABEL_EVERY} / span ${4 * HOUR_LABEL_EVERY}` }}
              >
                {(index * HOUR_LABEL_EVERY).toString().padStart(2, "0")}
              </span>
            ))}
          </div>
          <div
            role="grid"
            aria-label={t("liviere.activity.title")}
            className="flex flex-col gap-[2px]"
            onMouseMove={handleMove}
            onMouseLeave={() => setHover(null)}
            onKeyDown={(event) => {
              if (event.key === "Escape") onSelect(null);
            }}
            onClick={(event) => {
              const cell = cellFromEvent(event);
              if (!cell) return;
              const isSelected = selected?.date === cell.date && selected.slot === cell.slot;
              onSelect(isSelected || !buckets.has(bucketKey(cell.date, cell.slot)) ? null : cell);
            }}
          >
            {days.map((date) => (
              <div key={date} role="row" className="grid items-center" style={GRID_STYLE}>
                <span className="pr-2 text-right text-11 whitespace-nowrap text-tertiary">{dayLabel(date)}</span>
                {Array.from({ length: SLOTS_PER_DAY }, (_, slot) => {
                  const bucket = buckets.get(bucketKey(date, slot));
                  const level = levelOf(bucket?.count ?? 0, thresholds);
                  const isSelected = selected?.date === date && selected.slot === slot;
                  const isNow = date === now.date && slot === now.slot;
                  return (
                    <span
                      key={slot}
                      role="gridcell"
                      aria-current={isNow ? "time" : undefined}
                      data-date={date}
                      data-slot={slot}
                      className={cn(
                        "aspect-square w-full rounded-[2px]",
                        LEVEL_CLASSES[level],
                        bucket && "cursor-pointer",
                        date === now.date && slot > now.slot && "opacity-40",
                        isNow && NOW_CLASS,
                        isSelected && "outline-2 outline-offset-1 outline-accent-strong"
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {hover && (
          <div
            className="pointer-events-none absolute z-10 max-w-72 rounded-md border border-subtle bg-surface-1 px-3 py-2 text-12 shadow-raised-200"
            style={{ left: Math.max(0, hover.x - 120), top: hover.y + 16 }}
          >
            <div className="font-medium text-primary">
              {dayLabel(hover.date)}, {slotRange(hover.slot)}
              {hover.date === now.date && hover.slot === now.slot && ` · ${t("liviere.activity.now")}`}
            </div>
            {hovered ? (
              <>
                <div className="text-secondary">{t("liviere.activity.actions", { count: hovered.count })}</div>
                <ul className="mt-1 text-tertiary">
                  {Object.entries(hovered.by_kind)
                    // oxlint-disable-next-line unicorn/no-array-sort -- sorts the fresh array from entries
                    .sort((a, b) => b[1] - a[1])
                    .map(([kind, count]) => (
                      <li key={kind}>
                        {count} × {t(`liviere.activity.kinds.${kind}`)}
                      </li>
                    ))}
                </ul>
              </>
            ) : (
              <div className="text-tertiary">{t("liviere.activity.no_activity")}</div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 self-end text-11 text-tertiary">
        <span className="mr-1">{t("liviere.activity.less")}</span>
        {LEVEL_CLASSES.map((className) => (
          <span key={className} className={cn("size-[10px] rounded-[2px]", className)} />
        ))}
        <span className="ml-1">{t("liviere.activity.more")}</span>
        <span className={cn("ml-3 size-[10px] rounded-[2px] bg-layer-3", NOW_CLASS)} />
        <span className="ml-1">{t("liviere.activity.now")}</span>
      </div>
    </div>
  );
}
