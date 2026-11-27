/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: "Map" view of the decision register: every area at once as a box of rows (number and
// rule), with SVG lines between decisions: dashed "supersedes", solid "related". Hovering a row highlights its
// lines, a click opens the card in the side panel. Filters dim what does not match instead of hiding it.
// Drawing the lines is measured as "liviere-decisions-map-lines" (Performance panel of the browser).

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { RichText } from "./decision-card";
import { mapLines, touches, visibleLines } from "./map-geometry";
import type { TDotPosition, TMapLine } from "./map-geometry";
import { isPast, mapEdges } from "./model";
import type { TDecision, TDecisionArea, TDecisionStatus } from "./types";

type Props = {
  decisions: TDecision[];
  areas: TDecisionArea[];
  isDimmed: (decision: TDecision) => boolean;
  selected: number | null;
  onOpen: (number: number) => void;
};

const MEASURE = "liviere-decisions-map-lines";
// Below this width the boxes stack in one column and the lines are not drawn
const WIDE_QUERY = "(min-width: 768px)";

export const DOT_CLASS: Record<TDecisionStatus, string> = {
  active: "border-success-strong bg-success-primary text-on-color",
  proposed: "border-accent-strong bg-surface-1 text-accent-primary",
  deferred: "border-dashed border-warning-strong bg-surface-1 text-warning-primary",
  done: "border-strong bg-layer-2 text-tertiary",
  superseded: "border-strong bg-layer-2 text-tertiary line-through",
  revoked: "border-danger-strong bg-layer-2 text-danger-primary line-through",
};

// A ring around decisions waiting for the owner or for a rollout (any queue)
const ATTENTION: CSSProperties = {
  boxShadow: "0 0 0 2px var(--background-color-surface-1), 0 0 0 4px var(--border-color-warning-strong)",
};

export function Dot(props: { status: TDecisionStatus; number: number | string; attention?: boolean; dot?: number }) {
  const { status, number, attention, dot } = props;
  return (
    <span
      data-dot={dot}
      style={attention ? ATTENTION : undefined}
      className={cn(
        "relative z-[2] inline-flex h-[22px] min-w-[30px] flex-none items-center justify-center rounded-full border-2 px-1.5 text-[11.5px] font-semibold",
        DOT_CLASS[status]
      )}
    >
      {number}
    </span>
  );
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);
  return matches;
}

type TMapBox = { key: string; name: string; items: TDecision[] };

type BoxesProps = Pick<Props, "isDimmed" | "selected" | "onOpen"> & {
  boxes: TMapBox[];
  onHover: (number: number | null) => void;
};

// Memoised: hovering changes only the lines, not the rows
const MapBoxes = memo(function MapBoxes(props: BoxesProps) {
  const { boxes, isDimmed, selected, onOpen, onHover } = props;
  const { t } = useTranslation();
  return (
    <>
      {boxes.map((box) => {
        const inForce = box.items.filter((decision) => decision.status === "active").length;
        return (
          <section
            key={box.key}
            className={cn(
              "mb-5 break-inside-avoid rounded-lg border border-subtle bg-surface-1 px-3 py-2.5",
              !box.items.length && "opacity-55"
            )}
          >
            <h3 className="mb-2 flex justify-between gap-2 text-13 font-medium text-primary">
              <span className="min-w-0 truncate">{box.name}</span>
              <span className="font-normal shrink-0 text-tertiary">
                {t("liviere.decisions.map.in_force", { count: inForce })}
              </span>
            </h3>
            {box.items.map((decision) => (
              <button
                key={decision.number}
                type="button"
                data-number={decision.number}
                title={`${decision.identifier}: ${decision.title}`}
                onClick={() => onOpen(decision.number)}
                onMouseEnter={() => onHover(decision.number)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(decision.number)}
                onBlur={() => onHover(null)}
                className={cn(
                  "group flex w-full items-center gap-2 py-[3px] text-left",
                  isDimmed(decision) && "opacity-25"
                )}
              >
                <Dot
                  status={decision.status}
                  number={decision.number}
                  attention={decision.queues.length > 0}
                  dot={decision.number}
                />
                <span
                  className={cn(
                    "min-w-0 truncate text-13 group-hover:text-accent-primary",
                    isPast(decision) && "text-tertiary",
                    decision.status !== "done" && isPast(decision) && "line-through",
                    selected === decision.number && "font-medium text-accent-primary"
                  )}
                >
                  <RichText text={decision.title} />
                </span>
              </button>
            ))}
          </section>
        );
      })}
    </>
  );
});

export function DecisionsMap(props: Props) {
  const { decisions, areas, isDimmed, selected, onOpen } = props;
  const { t } = useTranslation();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<TMapLine[]>([]);
  const [hover, setHover] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const wide = useMediaQuery(WIDE_QUERY);
  const edges = useMemo(() => mapEdges(decisions), [decisions]);
  const boxOf = useMemo(() => new Map(decisions.map((decision) => [decision.number, decision.area])), [decisions]);

  // One box per area of the tree, decisions by number; decisions of an area missing from the tree last
  const boxes = useMemo((): TMapBox[] => {
    const ordered = [...decisions];
    ordered.sort((a, b) => a.number - b.number);
    const byArea = new Map<string, TDecision[]>();
    for (const decision of ordered) byArea.set(decision.area, [...(byArea.get(decision.area) ?? []), decision]);
    const known = areas.map((area) => ({ key: area.key, name: area.name, items: byArea.get(area.key) ?? [] }));
    const knownKeys = new Set(areas.map((area) => area.key));
    const other = [...byArea.entries()]
      .filter(([key]) => !knownKeys.has(key))
      .map(([key, items]) => ({ key, name: key, items }));
    return [...known, ...other];
  }, [decisions, areas]);

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap || !wide) {
      setLines([]);
      return;
    }
    performance.mark(`${MEASURE}-start`);
    const origin = wrap.getBoundingClientRect();
    const positions = new Map<number, TDotPosition>();
    wrap.querySelectorAll<HTMLElement>("[data-dot]").forEach((element) => {
      const box = element.getBoundingClientRect();
      positions.set(Number(element.dataset.dot), {
        x: box.left - origin.left + box.width / 2,
        y: box.top - origin.top + box.height / 2,
        width: box.width,
      });
    });
    setLines(mapLines(edges, positions, boxOf));
  }, [edges, wide, boxOf]);

  // Measured after every layout change of the rows: data, filters (dimming keeps the layout), width
  useLayoutEffect(measure, [measure, boxes]);
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let frame = 0;
    const later = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(later);
    observer.observe(wrap);
    window.addEventListener("resize", later);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", later);
    };
  }, [measure]);
  // The measure ends once the lines are on the page
  useEffect(() => {
    if (performance.getEntriesByName(`${MEASURE}-start`).length) {
      performance.measure(MEASURE, `${MEASURE}-start`);
      performance.clearMarks(`${MEASURE}-start`);
    }
  }, [lines]);

  const focus = hover ?? selected;
  const shown = visibleLines(lines, focus, showAll);
  // Some lines wait for a highlighted decision: offer all of them
  const limited = visibleLines(lines, null, false).length < lines.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-12 text-tertiary">
        {(["active", "proposed", "deferred", "done", "superseded"] as const).map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <Dot status={status} number={12} />
            {t(`liviere.decisions.map.legend.${status}`)}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <Dot status="active" number={12} attention />
          {t("liviere.decisions.map.legend.attention")}
        </span>
        {wide && (
          <>
            <span className="flex items-center gap-1.5">
              <svg width="34" height="8" aria-hidden="true" className="text-tertiary">
                <path d="M0 4H34" stroke="currentColor" strokeWidth="1.4" strokeDasharray="5 4" />
              </svg>
              {t("liviere.decisions.map.legend.supersedes")}
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="34" height="8" aria-hidden="true" className="text-accent-primary">
                <path d="M0 4H34" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              {t("liviere.decisions.map.legend.related")}
            </span>
          </>
        )}
        <span>{t(wide ? "liviere.decisions.map.hint" : "liviere.decisions.map.narrow")}</span>
        {wide && limited && (
          <button type="button" className="text-accent-primary hover:underline" onClick={() => setShowAll((v) => !v)}>
            {t(showAll ? "liviere.decisions.map.focus_lines" : "liviere.decisions.map.all_lines", {
              count: lines.length,
            })}
          </button>
        )}
      </div>
      <div ref={wrapRef} className="relative">
        <div className={wide ? "columns-[300px] gap-x-[26px]" : "columns-1"}>
          <MapBoxes boxes={boxes} isDimmed={isDimmed} selected={selected} onOpen={onOpen} onHover={setHover} />
        </div>
        {wide && (
          <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible" aria-hidden="true">
            {shown.map((line) => {
              const lit = touches(line, focus);
              return (
                <path
                  key={`${line.type}-${line.from}-${line.to}`}
                  d={line.path}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={lit ? 2.2 : 1.4}
                  strokeDasharray={line.type === "supersedes" ? "5 4" : undefined}
                  opacity={focus === null ? 0.55 : lit ? 1 : 0.08}
                  className={line.type === "related" ? "text-accent-primary" : "text-tertiary"}
                />
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
