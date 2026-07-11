/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef } from "react";
import { useTranslation } from "@plane/i18n";
import type { TIssueRelationTypes } from "@plane/types";
import { cn } from "@plane/utils";
import type { TPickerPayload } from "./use-dependency-drag";

type Props = {
  payload: TPickerPayload;
  onResolve: (relationType: TIssueRelationTypes | null) => void;
};

const PICKER_WIDTH = 220;
const PICKER_MARGIN = 8;

/**
 * Options are ordered by how often a user dragging a dependency picks them:
 * precedence relationships first, associative second.
 */
const OPTIONS: ReadonlyArray<{ type: TIssueRelationTypes; labelKey: string }> = [
  { type: "blocking", labelKey: "gantt_dependency.picker.blocking" },
  { type: "blocked_by", labelKey: "gantt_dependency.picker.blocked_by" },
  { type: "relates_to", labelKey: "gantt_dependency.picker.relates_to" },
  { type: "duplicate", labelKey: "gantt_dependency.picker.duplicate" },
];

/**
 * Popover shown on Shift+drop. Anchored to the drop point but clamped to stay
 * inside the viewport. Click outside / Escape cancels without creating any
 * relation.
 */
export function RelationTypePicker({ payload, onResolve }: Props) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onResolve(null);
    };
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onResolve(null);
    };
    document.addEventListener("keydown", onKeyDown);
    // Use capture so we see the click before any nested handler stops it.
    document.addEventListener("mousedown", onMouseDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown, true);
    };
  }, [onResolve]);

  // Clamp horizontally so the picker stays on-screen near the edges of the
  // chart. Vertical overflow is rare (drag anchors below the viewport top),
  // so we keep the simple clamp.
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0;
  const left = Math.min(Math.max(PICKER_MARGIN, payload.clientX), viewportWidth - PICKER_WIDTH - PICKER_MARGIN);
  const top = payload.clientY + PICKER_MARGIN;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Pick dependency type"
      className="border-custom-border-200 bg-custom-background-100 shadow-lg fixed z-50 rounded-md border p-1"
      style={{ left, top, width: PICKER_WIDTH }}
    >
      <ul className="flex flex-col">
        {OPTIONS.map((option) => (
          <li key={option.type}>
            <button
              type="button"
              onClick={() => onResolve(option.type)}
              className={cn(
                "text-sm hover:bg-custom-background-80 w-full rounded-sm px-2 py-1.5 text-left",
                // Highlight the relation type the drag geometry defaulted to
                // — user can confirm with a single click.
                {
                  "bg-custom-background-80 font-medium": option.type === payload.defaultRelationType,
                }
              )}
            >
              {t(option.labelKey)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
