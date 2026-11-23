/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useLayoutEffect, useState } from "react";

// Fixed parts of a single-line list row; they mirror the classes in `issue-layouts/list/block.tsx`
// (and the workspace draft row) and must move with them.
/** Room always kept for the work item title. A budget figure only — never a CSS min-width. */
const TITLE_MIN_WIDTH_PX = 240;
/** `gap-0.5` between the leading group (checkbox, identifier, chevron) and the title. */
const LEADING_GAP_PX = 2;
/** `gap-3` between the title side and the properties side of the row. */
const ROW_GAP_PX = 12;
/** `gap-2` between the properties and the quick actions. */
const QUICK_ACTIONS_GAP_PX = 8;

/** Breakpoints at which the row switches from stacked to single-line (`md:flex-row` / `lg:flex-row`). */
const SINGLE_LINE_QUERY = {
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
} as const;

type TUseListRowPropertiesBudgetArgs = {
  /** Off for rows that render no properties yet (e.g. an optimistic create). */
  enabled: boolean;
  /** Breakpoint from which the row is single-line; below it the properties wrap under the title. */
  singleLineFrom: keyof typeof SINGLE_LINE_QUERY;
};

export type TListRowPropertiesBudget = {
  /** The row (its content box is the total width). */
  rowRef: (node: HTMLElement | null) => void;
  /** The group before the title; everything up to its right edge (indent included) is taken. */
  leadingRef: (node: HTMLElement | null) => void;
  /** The quick actions after the properties; optional. */
  quickActionsRef: (node: HTMLElement | null) => void;
  /** Width in px for the property chips, or `null` while the row is stacked or not yet measured. */
  budgetPx: number | null;
};

/**
 * How much width a single-line list row can give its property chips: the row's content width less
 * the leading group, a title floor, the quick actions and the gaps between them. It reads only
 * parts of the row that the chips never resize, so collapsing chips can't feed back into it.
 * Measurements are coalesced to one per frame and only a changed value re-renders the row.
 */
export function useListRowPropertiesBudget(args: TUseListRowPropertiesBudgetArgs): TListRowPropertiesBudget {
  const { enabled, singleLineFrom } = args;
  const [rowNode, setRowNode] = useState<HTMLElement | null>(null);
  const [leadingNode, setLeadingNode] = useState<HTMLElement | null>(null);
  const [quickActionsNode, setQuickActionsNode] = useState<HTMLElement | null>(null);
  const [isSingleLine, setIsSingleLine] = useState(false);
  const [budgetPx, setBudgetPx] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!enabled || typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia(SINGLE_LINE_QUERY[singleLineFrom]);
    const update = () => setIsSingleLine(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [enabled, singleLineFrom]);

  useLayoutEffect(() => {
    if (!enabled || !isSingleLine || !rowNode || !leadingNode || typeof ResizeObserver === "undefined") return;
    let frame: number | null = null;

    const measure = () => {
      frame = null;
      const rowStyle = window.getComputedStyle(rowNode);
      const paddingLeft = parseFloat(rowStyle.paddingLeft) || 0;
      const paddingRight = parseFloat(rowStyle.paddingRight) || 0;
      const contentWidth = rowNode.clientWidth - paddingLeft - paddingRight;
      const contentLeft = rowNode.getBoundingClientRect().left + paddingLeft;
      const leadingWidth = Math.max(0, leadingNode.getBoundingClientRect().right - contentLeft);
      const quickActionsWidth = quickActionsNode?.offsetWidth ?? 0;
      const next = Math.max(
        0,
        Math.floor(
          contentWidth -
            leadingWidth -
            LEADING_GAP_PX -
            TITLE_MIN_WIDTH_PX -
            ROW_GAP_PX -
            (quickActionsWidth > 0 ? quickActionsWidth + QUICK_ACTIONS_GAP_PX : 0)
        )
      );
      setBudgetPx((current) => (current === next ? current : next));
    };
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(measure);
    };

    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(rowNode);
    observer.observe(leadingNode);
    if (quickActionsNode) observer.observe(quickActionsNode);
    return () => {
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [enabled, isSingleLine, rowNode, leadingNode, quickActionsNode]);

  return {
    rowRef: setRowNode,
    leadingRef: setLeadingNode,
    quickActionsRef: setQuickActionsNode,
    budgetPx: enabled && isSingleLine ? budgetPx : null,
  };
}
