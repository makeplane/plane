/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// local imports
import { DAY_WIDTH, INDICATOR_COLORS, daysBetween, getPeriod, getTicks, moveEdge } from "./board";
import type { TScale, TTimelineItem } from "./board";

export type TTimelineGroup<T> = { id: string; name: ReactNode; summary?: ReactNode; items: T[] };

type Props<T> = {
  groups: TTimelineGroup<T>[];
  scale: TScale;
  /** Shows no group rows. */
  isFlat?: boolean;
  /** Height of the chart, which scrolls inside. */
  className?: string;
  renderLabel: (item: T) => ReactNode;
  onOpen?: (item: T) => void;
  canEdit?: (item: T) => boolean;
  onMove?: (item: T, edge: "start_date" | "target_date", date: string) => void;
};

const LABEL_WIDTH = 360;
const GROUP_HEIGHT = 36;
const ROW_HEIGHT = 56;
// Rows drawn beyond the visible ones. Hundreds of rows at once take seconds to draw.
const OVERSCAN = 400;
type TDrag = { id: string; edge: "start_date" | "target_date"; days: number };

/** Bars between the dates of products. The edges move by dragging or with the arrow keys. */
export function ProductTimeline<T extends TTimelineItem>(props: Props<T>) {
  const { groups, scale, isFlat = false, className = "h-full", renderLabel, onOpen, canEdit, onMove } = props;
  // states
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [drag, setDrag] = useState<TDrag | null>(null);
  const [viewport, setViewport] = useState({ top: 0, height: 1000 });
  const dragStart = useRef(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // hooks
  const { t, currentLocale } = useTranslation();
  // derived values
  const today = new Date().toLocaleDateString("en-CA");
  const items = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const { from, to } = getPeriod(items, today);
  const dayWidth = DAY_WIDTH[scale];
  const width = (daysBetween(from, to) + 1) * dayWidth;
  const left = (date: string) => daysBetween(from, date) * dayWidth;
  const todayLeft = left(today);

  // every row has a known height, so its place is known without drawing the ones before it
  type TRow = { key: string; top: number; height: number; group: TTimelineGroup<T>; item?: T };
  const rows: TRow[] = [];
  let totalHeight = 0;
  const addRow = (key: string, height: number, group: TTimelineGroup<T>, item?: T) => {
    rows.push({ key, top: totalHeight, height, group, item });
    totalHeight += height;
  };
  for (const group of groups) {
    if (!isFlat) addRow(`group-${group.id}`, GROUP_HEIGHT, group);
    if (!collapsed.includes(group.id)) for (const item of group.items) addRow(item.id, ROW_HEIGHT, group, item);
  }
  const visibleRows = rows.filter(
    (row) =>
      (row.top + row.height > viewport.top - OVERSCAN && row.top < viewport.top + viewport.height + OVERSCAN) ||
      // the row being dragged must not disappear
      row.item?.id === drag?.id
  );

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const measure = () => setViewport({ top: element.scrollTop, height: element.clientHeight });
    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  // today in view when the scale changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ left: Math.max(0, todayLeft - 200) });
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- moving dates must not scroll the chart
  }, [scale]);

  const formatTick = (tick: string) => {
    const date = new Date(`${tick}T00:00:00Z`);
    if (scale === "quarter") return `Q${Math.floor(date.getUTCMonth() / 3) + 1} ${date.getUTCFullYear()}`;
    return date.toLocaleDateString(
      currentLocale,
      scale === "week"
        ? { day: "numeric", month: "short", timeZone: "UTC" }
        : { month: "short", year: "numeric", timeZone: "UTC" }
    );
  };

  const toggle = (id: string) =>
    setCollapsed((ids) => (ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id]));

  const edgeProps = (item: T, edge: "start_date" | "target_date") => ({
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragStart.current = event.clientX;
      setDrag({ id: item.id, edge, days: 0 });
    },
    onPointerMove: (event: PointerEvent<HTMLButtonElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
      setDrag({ id: item.id, edge, days: Math.round((event.clientX - dragStart.current) / dayWidth) });
    },
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
      const days = Math.round((event.clientX - dragStart.current) / dayWidth);
      setDrag(null);
      const date = moveEdge(item, edge, days);
      if (date && date !== item[edge]) onMove?.(item, edge, date);
    },
    onPointerCancel: () => setDrag(null),
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      const days = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
      if (!days) return;
      event.preventDefault();
      const date = moveEdge(item, edge, days);
      if (date && date !== item[edge]) onMove?.(item, edge, date);
    },
  });

  const renderBar = (item: T) => {
    const isDragged = drag?.id === item.id;
    const start = isDragged && drag.edge === "start_date" ? moveEdge(item, "start_date", drag.days) : item.start_date;
    const end = isDragged && drag.edge === "target_date" ? moveEdge(item, "target_date", drag.days) : item.target_date;
    if (!start || !end) return null;
    const isEditable = !!canEdit?.(item);
    const edgeClassName =
      "absolute inset-y-0 w-2 cursor-ew-resize touch-none rounded-sm opacity-0 group-hover:opacity-60 focus-visible:opacity-100 bg-inverse";

    return (
      <div
        className="group absolute inset-y-3"
        style={{ left: left(start), width: Math.max((daysBetween(start, end) + 1) * dayWidth, 6) }}
      >
        <button
          type="button"
          onClick={() => onOpen?.(item)}
          aria-label={`${item.name}, ${start} – ${end}, ${t(`product.indicators.${item.indicator}`)}, ${item.progress ?? 0}%`}
          className="relative block size-full overflow-hidden rounded-sm bg-layer-3"
        >
          <span className={cn("absolute inset-0 opacity-30", INDICATOR_COLORS[item.indicator])} />
          <span
            className={cn("absolute inset-y-0 left-0", INDICATOR_COLORS[item.indicator])}
            style={{ width: `${item.progress ?? 0}%` }}
          />
        </button>
        {isEditable && (
          <>
            <button
              type="button"
              aria-label={`${t("product_board.move_start")}: ${item.name}`}
              className={cn(edgeClassName, "left-0")}
              {...edgeProps(item, "start_date")}
            />
            <button
              type="button"
              aria-label={`${t("product_board.move_end")}: ${item.name}`}
              className={cn(edgeClassName, "right-0")}
              {...edgeProps(item, "target_date")}
            />
          </>
        )}
        {isDragged && (
          <span className="pointer-events-none absolute -top-5 left-0 z-10 rounded-sm bg-inverse px-1 text-caption-sm-medium whitespace-nowrap text-inverse">
            {start} – {end}
          </span>
        )}
      </div>
    );
  };

  const rowStyle = { width: LABEL_WIDTH + width };
  const labelClassName = "sticky left-0 z-10 flex shrink-0 items-center border-r border-subtle bg-surface-1 px-3";

  return (
    <div
      ref={scrollRef}
      // scrolls in both directions, so it has to be reachable with the keyboard
      // oxlint-disable-next-line jsx_a11y/no-noninteractive-tabindex
      tabIndex={0}
      role="region"
      aria-label={t("product_board.views.timeline")}
      onScroll={(event) => {
        const { scrollTop, clientHeight } = event.currentTarget;
        setViewport((current) =>
          // a horizontal scroll changes nothing
          current.top === scrollTop && current.height === clientHeight
            ? current
            : { top: scrollTop, height: clientHeight }
        );
      }}
      className={cn("relative overflow-auto rounded-md border border-subtle", className)}
    >
      <div className="sticky top-0 z-20 flex h-8 border-b border-subtle bg-surface-1" style={rowStyle}>
        <div className={labelClassName} style={{ width: LABEL_WIDTH }} />
        <div className="relative" style={{ width }}>
          {getTicks(from, to, scale).map((tick) => (
            <span
              key={tick}
              className="absolute inset-y-0 border-l border-subtle pt-1.5 pl-1 text-caption-sm-regular whitespace-nowrap text-tertiary"
              style={{ left: Math.max(left(tick), 0) }}
            >
              {formatTick(tick)}
            </span>
          ))}
        </div>
      </div>
      <div className="relative" style={{ ...rowStyle, height: totalHeight }}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-px bg-danger-primary"
          style={{ left: LABEL_WIDTH + todayLeft }}
          title={t("product_board.today")}
        />
        {visibleRows.map(({ key, top, height, group, item }) => (
          <div key={key} className="absolute left-0 flex border-b border-subtle" style={{ ...rowStyle, top, height }}>
            {item ? (
              <>
                <div className={labelClassName} style={{ width: LABEL_WIDTH }}>
                  {renderLabel(item)}
                </div>
                <div className="relative" style={{ width }}>
                  {renderBar(item)}
                </div>
              </>
            ) : (
              <div className="w-full bg-layer-1">
                <button
                  type="button"
                  aria-expanded={!collapsed.includes(group.id)}
                  onClick={() => toggle(group.id)}
                  className="sticky left-0 z-10 flex h-full items-center gap-3 px-3 text-body-xs-semibold whitespace-nowrap text-primary"
                >
                  <span aria-hidden>{collapsed.includes(group.id) ? "▸" : "▾"}</span>
                  {group.name}
                  {group.summary}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
