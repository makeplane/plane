/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { cn } from "@plane/utils";

/** Collapsed column widths: the flat board strip, and the swimlane header/band/footer cells. */
export const KANBAN_COLLAPSED_COLUMN_WIDTH = "w-11";
export const KANBAN_SWIMLANE_COLLAPSED_COLUMN_WIDTH = "w-14";

/** Marks the swimlane root so the pieces of one collapsed column can light up together. */
export const KANBAN_SWIMLANES_ATTRIBUTE = "data-kanban-swimlanes";
const COLLAPSED_COLUMN_ATTRIBUTE = "data-collapsed-column";

type Props = {
  columnId: string;
  title: string;
  count: number;
  onExpand: () => void;
  /**
   * In swimlanes a collapsed column is split into a header cell, one cell per band and a footer cap.
   * Only the header cell takes focus; the others are extra mouse targets for the same action.
   */
  focusable?: boolean;
  className?: string;
  children?: ReactNode;
};

/**
 * A collapsed board column (or one piece of it in swimlanes) as a single expand button, with a
 * "name · count" tooltip that follows the cursor down the strip.
 */
export function KanbanCollapsedColumnTrigger(props: Props) {
  const { columnId, title, count, onExpand, focusable = true, className, children } = props;

  return (
    <Tooltip label={`${title} · ${count}`} side="right" trackCursorAxis="y" sticky>
      <button
        type="button"
        aria-label={title}
        aria-expanded={false}
        tabIndex={focusable ? undefined : -1}
        aria-hidden={focusable ? undefined : true}
        {...{ [COLLAPSED_COLUMN_ATTRIBUTE]: columnId }}
        onClick={onExpand}
        className={cn(
          "cursor-pointer transition-colors outline-none hover:bg-layer-1-hover focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-inset",
          className
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}

/**
 * Hovering any piece of a collapsed swimlane column highlights every piece of it. Pure CSS: the
 * swimlane root matches `:has()` on the hovered piece, so nothing re-renders on hover.
 */
export function KanbanCollapsedColumnHoverStyle(props: { columnId: string }) {
  const { columnId } = props;
  const selector = `[${COLLAPSED_COLUMN_ATTRIBUTE}="${CSS.escape(columnId)}"]`;

  return (
    <style>{`[${KANBAN_SWIMLANES_ATTRIBUTE}]:has(${selector}:hover) ${selector}{background-color:var(--background-color-layer-1-hover)}`}</style>
  );
}
