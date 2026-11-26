/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * hover preview for drops onto a collapsed group.
 *
 * While a dragged work item is over a collapsed group's drop zone, the group renders as if it were
 * expanded, with a ghost of the dragged card where it would land. The preview is local React state only:
 * it is never stored (no kanban_filters write, no auto-collapse override). A drop turns it into the real
 * state through expandGroup; leaving the zone, cancelling the drag (Esc) or dropping anywhere else ends it.
 *
 * Entering and leaving are delayed by PREVIEW_DELAY_MS, so a card passing over a collapsed group does not
 * make it flicker open, and a short exit (the zone grows under the pointer) does not close it.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
// plane imports
import { cn } from "@plane/utils";

export const PREVIEW_DELAY_MS = 120;

export type TDropPreview = {
  /** the dragged element, cloned for the ghost */
  element: HTMLElement | null;
  width: number;
  height: number;
  /** the group the dragged card comes from (a swimlane drop keeps the card's column) */
  sourceGroupId?: string;
};

/** Preview data for a drag source element, measured when the drag enters a zone. */
export const getDropPreview = (element: Element | undefined, sourceGroupId?: string): TDropPreview => {
  const el = element instanceof HTMLElement ? element : null;
  const rect = el?.getBoundingClientRect();
  return { element: el, width: rect?.width ?? 0, height: rect?.height ?? 0, sourceGroupId };
};

/** True for the work item cards and list rows (both draggables carry type ISSUE). */
export const isWorkItemDrag = ({ source }: { source: { data: Record<string | symbol, unknown> } }) =>
  source.data?.type === "ISSUE";

export const useDropPreview = () => {
  const [preview, setPreview] = useState<TDropPreview | null>(null);
  const shown = useRef(false);
  const next = useRef<TDropPreview | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const cancelTimer = useCallback(() => {
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  /** the drag entered the zone: show the preview after the delay (at once if it is still shown) */
  const enter = useCallback(
    (data: TDropPreview) => {
      cancelTimer();
      next.current = data;
      if (shown.current) {
        setPreview(data);
        return;
      }
      timer.current = setTimeout(() => {
        timer.current = undefined;
        shown.current = true;
        setPreview(next.current);
      }, PREVIEW_DELAY_MS);
    },
    [cancelTimer]
  );

  /** the drag left the zone: hide the preview after the delay, unless the drag comes back first */
  const leave = useCallback(() => {
    cancelTimer();
    if (!shown.current) return;
    timer.current = setTimeout(() => {
      timer.current = undefined;
      shown.current = false;
      setPreview(null);
    }, PREVIEW_DELAY_MS);
  }, [cancelTimer]);

  /** end now: a drop on the zone, a drop anywhere else, or a cancelled drag */
  const end = useCallback(() => {
    cancelTimer();
    shown.current = false;
    next.current = null;
    setPreview(null);
  }, [cancelTimer]);

  // Any drop or cancel (Esc) ends the drag; pragmatic calls the monitors' onDrop in both cases.
  useEffect(() => monitorForElements({ onDrop: () => end() }), [end]);

  // Esc while the preview is shown, as a fallback for browsers that deliver it during a drag.
  useEffect(() => {
    if (!preview) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") end();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview, end]);

  useEffect(() => cancelTimer, [cancelTimer]);

  return { preview, enter, leave, end };
};

type GhostProps = {
  preview: TDropPreview;
  /** the drop will be refused (workflow): shown with a danger border */
  invalid?: boolean;
  className?: string;
};

/** A semi-transparent copy of the dragged card, the same size, where it would land. */
export function DropGhost({ preview, invalid = false, className }: GhostProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = ref.current;
    const source = preview.element;
    if (!host || !source) return;
    const clone = source.cloneNode(true) as HTMLElement;
    // ids are looked up by the drop highlight; the copy must not answer for the card
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    clone.style.opacity = "1";
    clone.style.width = "100%";
    host.replaceChildren(clone);
    return () => host.replaceChildren();
  }, [preview.element]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "pointer-events-none overflow-hidden rounded-md border border-dashed border-accent-strong opacity-50 select-none",
        { "border-danger-strong": invalid, "min-h-10 bg-layer-1": !preview.element },
        className
      )}
      style={{ height: preview.height || undefined, width: preview.width || undefined, maxWidth: "100%" }}
    />
  );
}
