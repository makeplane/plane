/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { measureTextWidth } from "@plane/utils";
import { partitionWorkItemProperties } from "./partition";
import type { WorkItemPropertyEntry, WorkItemPropertyVariant } from "./types";

/** Width assumed for a chip that has never rendered. Generous, so a first guess rarely overshoots. */
export const UNMEASURED_CHIP_WIDTH_PX = 90;

// Off-DOM estimate of the "+N" trigger (Propel `Pill` sm) until it renders: 12px caption text,
// 8px inline padding and a 1px border on each side, never narrower than its 24px height.
const TRIGGER_FONT = "400 12px sans-serif";
const TRIGGER_CHROME_PX = 18;
const TRIGGER_MIN_WIDTH_PX = 24;

/** An element is an open dropdown trigger while either attribute marks it so. */
const OPEN_TRIGGER_SELECTOR = '[aria-expanded="true"], [data-popup-open]';

export type PropertiesOverflowLayout = {
  visibleKeys: string[];
  hiddenKeys: string[];
  /** Variant id rendered for each visible entry that offers variants. */
  variantByKey: Map<string, string>;
};

type UsePropertiesOverflowArgs = {
  entries: WorkItemPropertyEntry[];
  /** Room for the chips in px; `null` shows every chip (no budget yet, or a wrapping layout). */
  budget: number | null;
  gap: number;
  /** While the "+N" menu is open the split is held, so its rows don't jump under the pointer. */
  isMenuOpen: boolean;
  /** Changing it drops every cached width, e.g. after a locale switch. */
  remeasureKey?: string | number;
};

/** Identity of one rendered chip for the width cache: what is shown, not just which property. */
export const getChipMeasureId = (entry: WorkItemPropertyEntry, variant?: WorkItemPropertyVariant) =>
  [entry.key, variant ? `${variant.id}:${variant.widthPx}` : "", entry.measureKey ?? ""].join("|");

const sameLayout = (a: PropertiesOverflowLayout, b: PropertiesOverflowLayout) =>
  a.visibleKeys.join("|") === b.visibleKeys.join("|") &&
  a.hiddenKeys.join("|") === b.hiddenKeys.join("|") &&
  a.variantByKey.size === b.variantByKey.size &&
  [...a.variantByKey].every(([key, id]) => b.variantByKey.get(key) === id);

const offersVariant = (entry: WorkItemPropertyEntry | undefined, id: string) =>
  !!entry?.variants?.some((variant) => variant.id === id);

const showEverything = (entries: WorkItemPropertyEntry[]): PropertiesOverflowLayout => ({
  visibleKeys: entries.map((entry) => entry.key),
  hiddenKeys: [],
  variantByKey: new Map(
    entries.flatMap((entry) => (entry.variants?.length ? [[entry.key, entry.variants[0].id] as const] : []))
  ),
});

/**
 * Decides which property chips of a single-line row are shown and which collapse into the "+N"
 * menu, and which rendering a shrinkable chip uses.
 *
 * Chip widths come from a `ResizeObserver` on each chip's wrapper and are cached by what the chip
 * shows, so a collapsed chip keeps its last width and a new one starts from its estimate. Input
 * changes (entries, budget, menu state) refit before paint; width corrections refit on the next
 * frame, with the row's `overflow-hidden` clipping any one-frame overshoot.
 *
 * A chip whose dropdown is open is never collapsed or re-rendered by a refit — it would tear down
 * the open dropdown — and the split is held while the "+N" menu is open.
 */
export function usePropertiesOverflow(args: UsePropertiesOverflowArgs) {
  const { entries, budget, gap, isMenuOpen, remeasureKey } = args;

  const [layout, setLayout] = useState<PropertiesOverflowLayout>(() => showEverything(entries));
  const layoutRef = useRef(layout);
  const inputsRef = useRef(args);
  // Kept current after each commit (not during render). Declared before the refit effects below so
  // they always read this render's inputs.
  useLayoutEffect(() => {
    inputsRef.current = args;
  });

  const widthCache = useRef(new Map<string, number>());
  const triggerWidthCache = useRef(new Map<number, number>());
  const chipNodes = useRef(new Map<string, HTMLElement>());
  const chipRefCallbacks = useRef(new Map<string, (node: HTMLElement | null) => void>());
  const triggerNode = useRef<HTMLElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const frameRef = useRef<number | null>(null);

  const triggerWidth = useCallback((hiddenCount: number) => {
    const digits = String(hiddenCount).length;
    return (
      triggerWidthCache.current.get(digits) ??
      Math.max(TRIGGER_MIN_WIDTH_PX, measureTextWidth(`+${hiddenCount}`, TRIGGER_FONT) + TRIGGER_CHROME_PX)
    );
  }, []);

  /** Key of the visible chip whose dropdown is open, read straight off the DOM. */
  const findOpenChipKey = useCallback((): string | null => {
    for (const [key, node] of chipNodes.current) {
      if (node.querySelector(OPEN_TRIGGER_SELECTOR)) return key;
    }
    return null;
  }, []);

  const refit = useCallback(() => {
    frameRef.current = null;
    const latest = inputsRef.current;
    const previous = layoutRef.current;
    const entryByKey = new Map(latest.entries.map((entry) => [entry.key, entry]));

    let next: PropertiesOverflowLayout;
    if (latest.budget === null) {
      next = showEverything(latest.entries);
    } else {
      const widthOf = (entry: WorkItemPropertyEntry, variant?: WorkItemPropertyVariant) =>
        widthCache.current.get(getChipMeasureId(entry, variant)) ?? variant?.widthPx ?? UNMEASURED_CHIP_WIDTH_PX;
      const partition = partitionWorkItemProperties({
        items: latest.entries.map((entry) => ({
          key: entry.key,
          hidePriority: entry.hidePriority,
          tierWidths: entry.variants?.length
            ? entry.variants.map((variant) => widthOf(entry, variant))
            : [widthOf(entry)],
        })),
        budget: latest.budget,
        gap: latest.gap,
        triggerWidth,
      });
      const variantByKey = new Map<string, string>();
      for (const [key, tier] of partition.tierByKey) {
        const variant = entryByKey.get(key)?.variants?.[tier];
        if (variant) variantByKey.set(key, variant.id);
      }
      next = { visibleKeys: partition.visibleKeys, hiddenKeys: partition.hiddenKeys, variantByKey };

      // Only visible chips have a wrapper node, so an open chip is always one shown right now.
      const openChipKey = findOpenChipKey();
      const openKey = openChipKey !== null && entryByKey.has(openChipKey) ? openChipKey : null;
      const wouldHideOpenChip = openKey !== null && !next.visibleKeys.includes(openKey);
      if (latest.isMenuOpen || wouldHideOpenChip) {
        // Hold the current split: entries that went away drop out, new ones join the menu.
        const kept = new Set(previous.visibleKeys);
        const heldVariants = new Map<string, string>();
        for (const entry of latest.entries) {
          if (!kept.has(entry.key) || !entry.variants?.length) continue;
          const previousId = previous.variantByKey.get(entry.key);
          const fallbackId = next.variantByKey.get(entry.key) ?? entry.variants[0].id;
          heldVariants.set(entry.key, previousId && offersVariant(entry, previousId) ? previousId : fallbackId);
        }
        next = {
          visibleKeys: latest.entries.filter((entry) => kept.has(entry.key)).map((entry) => entry.key),
          hiddenKeys: latest.entries.filter((entry) => !kept.has(entry.key)).map((entry) => entry.key),
          variantByKey: heldVariants,
        };
      } else if (openKey !== null) {
        // The open chip stays visible; keep its rendering too so its dropdown isn't re-mounted.
        const previousId = previous.variantByKey.get(openKey);
        if (previousId && offersVariant(entryByKey.get(openKey), previousId)) {
          next = { ...next, variantByKey: new Map(next.variantByKey).set(openKey, previousId) };
        }
      }
    }

    if (sameLayout(previous, next)) return;
    layoutRef.current = next;
    setLayout(next);
  }, [findOpenChipKey, triggerWidth]);

  const scheduleRefit = useCallback(() => {
    if (frameRef.current !== null || typeof requestAnimationFrame === "undefined") return;
    frameRef.current = requestAnimationFrame(refit);
  }, [refit]);

  const getObserver = useCallback(() => {
    if (observerRef.current || typeof ResizeObserver === "undefined") return observerRef.current;
    observerRef.current = new ResizeObserver((records) => {
      for (const record of records) {
        const target = record.target as HTMLElement;
        const width = Math.ceil(record.borderBoxSize?.[0]?.inlineSize ?? record.contentRect.width);
        if (width <= 0) continue;
        if (target === triggerNode.current) {
          const hiddenCount = Number(target.dataset.hiddenCount);
          if (hiddenCount > 0) triggerWidthCache.current.set(String(hiddenCount).length, width);
          continue;
        }
        // The wrapper carries the id of what it is painting right now, so a measurement always
        // lands on the rendering it belongs to.
        const measureId = target.dataset.measureId;
        if (measureId) widthCache.current.set(measureId, width);
      }
      scheduleRefit();
    });
    return observerRef.current;
  }, [scheduleRefit]);

  const getChipRef = useCallback(
    (key: string) => {
      let callback = chipRefCallbacks.current.get(key);
      if (!callback) {
        callback = (node: HTMLElement | null) => {
          const current = chipNodes.current.get(key);
          if (current && current !== node) {
            observerRef.current?.unobserve(current);
            chipNodes.current.delete(key);
          }
          if (node) {
            chipNodes.current.set(key, node);
            getObserver()?.observe(node);
          }
        };
        chipRefCallbacks.current.set(key, callback);
      }
      return callback;
    },
    [getObserver]
  );

  const triggerRef = useCallback(
    (node: HTMLElement | null) => {
      if (triggerNode.current && triggerNode.current !== node) observerRef.current?.unobserve(triggerNode.current);
      triggerNode.current = node;
      if (node) getObserver()?.observe(node);
    },
    [getObserver]
  );

  /**
   * Watches the row for a chip dropdown opening or closing, so a split held for an open chip is
   * released (and re-fitted) as soon as it closes.
   */
  const containerRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node || typeof MutationObserver === "undefined") return undefined;
      const observer = new MutationObserver(scheduleRefit);
      observer.observe(node, {
        subtree: true,
        attributes: true,
        attributeFilter: ["aria-expanded", "data-popup-open"],
      });
      // React 19 ref cleanup: runs when the node detaches or the callback changes.
      return () => observer.disconnect();
    },
    [scheduleRefit]
  );

  // Refit before paint whenever an input changes.
  const entrySignature = entries
    .map((entry) =>
      [entry.key, entry.hidePriority, entry.measureKey ?? "", entry.variants?.map((v) => `${v.id}:${v.widthPx}`)].join(
        "~"
      )
    )
    .join("|");
  useLayoutEffect(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    refit();
  }, [entrySignature, budget, gap, isMenuOpen, refit]);

  // Widths measured against a fallback font are wrong once the web font arrives.
  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) return;
    let cancelled = false;
    document.fonts.ready
      .then(() => {
        if (cancelled) return undefined;
        widthCache.current.clear();
        triggerWidthCache.current.clear();
        scheduleRefit();
        return undefined;
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [scheduleRefit]);

  const lastRemeasureKey = useRef(remeasureKey);
  useEffect(() => {
    if (lastRemeasureKey.current === remeasureKey) return;
    lastRemeasureKey.current = remeasureKey;
    widthCache.current.clear();
    triggerWidthCache.current.clear();
    scheduleRefit();
  }, [remeasureKey, scheduleRefit]);

  useEffect(
    () => () => {
      observerRef.current?.disconnect();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    []
  );

  return { layout, getChipRef, triggerRef, containerRef };
}
